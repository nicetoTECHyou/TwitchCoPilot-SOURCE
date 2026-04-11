
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Locate,
  Route,
  Trash2,
  Navigation,
  MapPin,
  Clock,
  Mountain,
  TrendingDown,
  FileDown,
  FileUp,
  Plus,
  X,
  Loader2,
  Braces,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { type Waypoint, type RouteInfo } from '@/types';
import { mapInstanceRef } from '@/components/map/MapContainer';
import type { RouteResult as StoreRouteResult } from '@/store/useNavigationStore';
import { NavigateSection } from './NavigateTab';
import { LngLatBounds } from 'maplibre-gl';

interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
}

// Re-export for convenience
interface RouteResult {
  routeIndex: number;
  distance: number;
  duration: number;
  ascent: number;
  descent: number;
  geometry: [number, number][];
  profile: string;
  category: 'shortest' | 'fastest' | 'safest';
}

/** Robust property extraction from BRouter GeoJSON features */
function parseRouteProps(props: Record<string, any>): { distance: number; duration: number; ascent: number; descent: number } {
  const getNum = (keys: string[]): number => {
    for (const key of keys) {
      if (props[key] !== undefined && props[key] !== null) {
        const val = Number(props[key]);
        if (!isNaN(val)) return val;
      }
    }
    return 0;
  };
  return {
    distance: getNum(['track-length']),
    duration: getNum(['total-time']),
    ascent:  getNum(['filtered ascend', 'ascend', 'plain-ascend']),
    descent: getNum(['filtered descend', 'descend', 'plain-descend']),
  };
}

/** Calculate ascent/descent from BRouter messages elevation data.
 *  BRouter 1.7.0 on brouter.de sometimes omits 'filtered descend' property.
 *  The messages array contains [lon, lat, elevation, distance, ...] per track point.
 *  This function parses elevation and calculates filtered ascend/descent (threshold: 5m).
 */
function calcElevationFromMessages(messages: any[]): { ascent: number; descent: number } | null {
  if (!Array.isArray(messages) || messages.length < 3) return null; // header + at least 2 data rows

  // Header row: ['Longitude', 'Latitude', 'Elevation', 'Distance', ...]
  const header = messages[0];
  const elevIdx = Array.isArray(header) ? header.indexOf('Elevation') : -1;
  if (elevIdx < 0) return null;

  let totalAscent = 0;
  let totalDescent = 0;
  let prevElev: number | null = null;
  const FILTER_THRESHOLD = 5; // meters — ignore micro-elevation changes (matches BRouter filtered behavior)

  for (let i = 1; i < messages.length; i++) {
    const row = messages[i];
    if (!Array.isArray(row) || row.length <= elevIdx) continue;
    const elev = Number(row[elevIdx]);
    if (isNaN(elev)) continue;

    if (prevElev !== null) {
      const diff = elev - prevElev;
      if (diff > FILTER_THRESHOLD) {
        totalAscent += diff;
      } else if (diff < -FILTER_THRESHOLD) {
        totalDescent += Math.abs(diff);
      }
    }
    prevElev = elev;
  }

  return { ascent: Math.round(totalAscent), descent: Math.round(totalDescent) };
}

/** Check if two routes share >85% of their geometry (coordinate overlap).
 *  Compares actual path coordinates, not just total distance —
 *  two routes may have similar distance but take completely different paths.
 */
function isSimilarRoute(a: RouteResult, b: RouteResult): boolean {
  if (!a || !b) return false;
  const geoA = a.geometry;
  const geoB = b.geometry;
  if (!geoA?.length || !geoB?.length) return false;

  // Quick check: if distance differs by >20%, routes are definitely different
  const maxDist = Math.max(a.distance, b.distance, 1);
  if (Math.abs(a.distance - b.distance) / maxDist > 0.20) return false;

  // Geometry comparison: sample coordinates from the shorter route
  // and check how many appear in the longer route (within ~50m tolerance)
  const shorter = geoA.length <= geoB.length ? geoA : geoB;
  const longer = geoA.length <= geoB.length ? geoB : geoA;
  const sampleStep = Math.max(1, Math.floor(shorter.length / 40)); // sample ~40 points
  let matches = 0;
  let checked = 0;
  for (let i = 0; i < shorter.length; i += sampleStep) {
    checked++;
    const [lngA, latA] = shorter[i];
    for (let j = 0; j < longer.length; j += sampleStep) {
      const [lngB, latB] = longer[j];
      // ~50m tolerance at typical latitudes (0.0005° ≈ 55m)
      if (Math.abs(Number(lngA) - Number(lngB)) < 0.0005 && Math.abs(Number(latA) - Number(latB)) < 0.0005) {
        matches++;
        break;
      }
    }
  }
  const overlapRatio = checked > 0 ? matches / checked : 0;
  return overlapRatio > 0.85; // >85% geometry overlap → similar
}

/** Fixed route categories: calculate via different BRouter profiles, then POST-PROCESS
 *
 * - Shortest (Kuerzeste): After calculation, the route with the SMALLEST distance is labeled "shortest".
 *   Uses trekking profile (distance-favorable) as primary candidate, but post-processing
 *   validates that the label matches actual metrics.
 * - Fastest (Schnellste): The route with the SMALLEST duration (time). Uses fastbike/mtb/car-fast
 *   profiles. Tempolimits and road types are considered by BRouter's cost function.
 * - Safest/Alternative (Sicherste): The remaining geographically different route. Uses safety
 *   profile (avoids highways, barriers, stairs). Acts as a penalty-based alternative route.
 *
 * POST-PROCESSING VALIDATION:
 * After all routes are fetched, we verify:
 *   - Route labeled "shortest" MUST have distance <= all other routes
 *   - If not, labels are SWAPPED and routes are REORDERED (shortest at index 0)
 *   - This ensures logical consistency regardless of BRouter profile behavior
 *
 * For car profiles: car-fast = fastest, car-eco = shortest (eco routing avoids highways)
 * For walk: only one sensible route
 */
const ROUTE_CATEGORIES: Record<string, { profile: string; category: 'shortest' | 'fastest' | 'safest' }[]> = {
  'fastbike': [
    { profile: 'trekking', category: 'shortest' },
    { profile: 'fastbike', category: 'fastest' },
    { profile: 'safety', category: 'safest' },
  ],
  'trekking': [
    { profile: 'trekking', category: 'shortest' },
    { profile: 'fastbike', category: 'fastest' },
    { profile: 'safety', category: 'safest' },
  ],
  'mtb': [
    { profile: 'trekking', category: 'shortest' },
    { profile: 'mtb', category: 'fastest' },
    { profile: 'safety', category: 'safest' },
  ],
  'safety': [
    { profile: 'trekking', category: 'shortest' },
    { profile: 'fastbike', category: 'fastest' },
    { profile: 'safety', category: 'safest' },
  ],
  'car-fast': [
    { profile: 'car-eco', category: 'shortest' },
    { profile: 'car-fast', category: 'fastest' },
    { profile: 'car-eco', category: 'safest' },
  ],
  'car-eco': [
    { profile: 'car-eco', category: 'shortest' },
    { profile: 'car-fast', category: 'fastest' },
    { profile: 'car-eco', category: 'safest' },
  ],
  'walk': [
    { profile: 'walk', category: 'shortest' },
    { profile: 'walk', category: 'fastest' },
    { profile: 'walk', category: 'safest' },
  ],
};

/** Get i18n label key for a route category */
function getCategoryLabel(category: 'shortest' | 'fastest' | 'safest'): string {
  switch (category) {
    case 'shortest': return 'nav.categoryShortest';
    case 'fastest': return 'nav.categoryFastest';
    case 'safest': return 'nav.categorySafest';
  }
}

/** Get i18n label key for a profile value */
function getProfileLabelKey(profile: string): string {
  const found = ROUTING_PROFILES.find(p => p.value === profile);
  return found?.labelKey || '';
}

const ROUTING_PROFILES = [
  { value: 'fastbike', labelKey: 'nav.profileFastBike' },
  { value: 'trekking', labelKey: 'nav.profileTrekking' },
  { value: 'mtb', labelKey: 'nav.profileMTB' },
  { value: 'safety', labelKey: 'nav.profileSafety' },
  { value: 'car-fast', labelKey: 'nav.profileCarFast' },
  { value: 'car-eco', labelKey: 'nav.profileCarEco' },
  { value: 'walk', labelKey: 'nav.profileWalk' },
];

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} ${t('general.km')}`;
  }
  return `${Math.round(meters)} ${t('general.m')}`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}${t('general.min')}`;
  }
  return `${minutes} ${t('general.min')}`;
}

export function RouteTab() {
  const {
    waypoints,
    route,
    alternativeRoutes,
    setWaypoints,
    setRoute,
    setAlternativeRoutes,
    clearWaypoints,
  } = useNavigationStore();
  const { routeProfile, updateSetting } = useSettingsStore();

  const [startInput, setStartInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [viaInput, setViaInput] = useState('');
  const [startResults, setStartResults] = useState<SearchResult[]>([]);
  const [destResults, setDestResults] = useState<SearchResult[]>([]);
  const [viaResults, setViaResults] = useState<SearchResult[]>([]);
  const [showStartResults, setShowStartResults] = useState(false);
  const [showDestResults, setShowDestResults] = useState(false);
  const [showViaResults, setShowViaResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [showAltRoutes, setShowAltRoutes] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [altProfileLabels, setAltProfileLabels] = useState<string[]>([]);
  const [routeCategories, setRouteCategories] = useState<('shortest' | 'fastest' | 'safest')[]>([]);
  const [error, setError] = useState('');

  // Sync startInput from store waypoints (NavigateTab GPS sets waypoint but can't set local state)
  useEffect(() => {
    const start = waypoints.find(w => w.type === 'start');
    if (start && start.name && start.name !== t('nav.destination')) {
      // Defensive: always coerce to number (Nominatim may have stored strings)
      const lat = Number(start.lat) || 0;
      const lon = Number(start.lon) || 0;
      const coords = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      if (startInput !== coords && startInput !== start.name) {
        setStartInput(start.name === t('nav.currentLocation') ? coords : start.name);
      }
    }
  }, [waypoints]);

  const geocode = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=de,en`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) return [];
      const data = await res.json();
      // CRITICAL FIX: Nominatim returns lat/lon as STRINGS — must parseFloat to avoid
      // TypeError when code later calls .toFixed() on what it expects to be a number
      return (Array.isArray(data) ? data : []).map((item: any) => ({
        lat: parseFloat(item.lat) || 0,
        lon: parseFloat(item.lon) || 0,
        display_name: item.display_name || '',
      }));
    } catch {
      return [];
    }
  }, []);

  const handleSearchStart = useCallback(async () => {
    if (!startInput.trim()) return;
    setIsSearching(true);
    setShowStartResults(true);
    setShowDestResults(false);
    setShowViaResults(false);
    const results = await geocode(startInput);
    setStartResults(results);
    setIsSearching(false);
  }, [startInput, geocode]);

  const handleSearchDest = useCallback(async () => {
    if (!destInput.trim()) return;
    setIsSearching(true);
    setShowDestResults(true);
    setShowStartResults(false);
    setShowViaResults(false);
    const results = await geocode(destInput);
    setDestResults(results);
    setIsSearching(false);
  }, [destInput, geocode]);

  const handleSearchVia = useCallback(async () => {
    if (!viaInput.trim()) return;
    setIsSearching(true);
    setShowViaResults(true);
    setShowStartResults(false);
    setShowDestResults(false);
    const results = await geocode(viaInput);
    setViaResults(results);
    setIsSearching(false);
  }, [viaInput, geocode]);

  const selectStart = useCallback((result: SearchResult) => {
    const wp: Waypoint = {
      id: 'start',
      lat: result.lat,
      lon: result.lon,
      name: result.display_name.split(',')[0],
      type: 'start',
      address: result.display_name,
    };
    const existing = waypoints.filter((w) => w.type !== 'start');
    setWaypoints([wp, ...existing]);
    setShowStartResults(false);
    setStartInput(result.display_name.split(',')[0]);
    mapInstanceRef.current?.easeTo({ center: [Number(result.lon), Number(result.lat)], zoom: 14, duration: 1000 });
  }, [waypoints, setWaypoints]);

  const selectDest = useCallback((result: SearchResult) => {
    const wp: Waypoint = {
      id: 'destination',
      lat: result.lat,
      lon: result.lon,
      name: result.display_name.split(',')[0],
      type: 'finish',
      address: result.display_name,
    };
    const existing = waypoints.filter((w) => w.type !== 'finish');
    setWaypoints([...existing, wp]);
    setShowDestResults(false);
    setDestInput(result.display_name.split(',')[0]);
    mapInstanceRef.current?.easeTo({ center: [Number(result.lon), Number(result.lat)], zoom: 14, duration: 1000 });
  }, [waypoints, setWaypoints]);

  const selectVia = useCallback((result: SearchResult) => {
    const wp: Waypoint = {
      id: `via-${Date.now()}`,
      lat: result.lat,
      lon: result.lon,
      name: result.display_name.split(',')[0],
      type: 'via',
      address: result.display_name,
    };
    // Insert after start and before finish
    const start = waypoints.filter((w) => w.type === 'start');
    const vias = waypoints.filter((w) => w.type === 'via');
    const finish = waypoints.filter((w) => w.type === 'finish');
    setWaypoints([...start, ...vias, wp, ...finish]);
    setShowViaResults(false);
    setViaInput('');
    mapInstanceRef.current?.easeTo({ center: [Number(result.lon), Number(result.lat)], zoom: 14, duration: 1000 });
  }, [waypoints, setWaypoints]);

  const handleGPSLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError(t('nav.gpsNotAvailable'));
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Check HTTPS requirement for mobile
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) {
      setError(t('nav.gpsHttpsRequired'));
      setTimeout(() => setError(''), 5000);
      return;
    }

    // v4.1.0 FIX: GPS-only, no network fallback (same fix as NavigateTab)
    // Prevents "Eingabe wiederholen" popups and inaccurate WiFi positioning
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const wp: Waypoint = {
          id: 'start',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: t('nav.currentLocation'),
          type: 'start',
        };
        const existing = waypoints.filter((w) => w.type !== 'start');
        setWaypoints([wp, ...existing]);
        setStartInput(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        mapInstanceRef.current?.easeTo({ center: [Number(pos.coords.longitude), Number(pos.coords.latitude)], zoom: 15, duration: 1000 });
      },
      (err) => {
        // v4.1.0: No retry with low accuracy — show error and stop
        console.warn('[GPS] Position failed (code ' + err.code + '):', err.message);
        const errMsgs: Record<number, string> = {
          1: t('nav.gpsNotAvailable'),
          2: t('nav.gpsPositionUnavailable'),
          3: t('nav.gpsTimeout'),
        };
        setError(errMsgs[err.code] || t('nav.gpsNotAvailable'));
        setTimeout(() => setError(''), 5000);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [waypoints, setWaypoints]);

  const calculateRoute = useCallback(async () => {
    const start = waypoints.find((w) => w.type === 'start');
    const finish = waypoints.find((w) => w.type === 'finish');
    if (!start || !finish) return;

    setIsCalculating(true);
    setError('');
    try {
      const viaPoints = waypoints.filter((w) => w.type === 'via');
      const allPoints = [start, ...viaPoints, finish];
      const lonlats = allPoints.map((wp) => `${wp.lon},${wp.lat}`).join('|');

      // Calculate 3 fixed categories: Shortest, Fastest, Safest
      // Each uses a different BRouter profile to guarantee meaningfully different routes
      const categories = ROUTE_CATEGORIES[routeProfile] || ROUTE_CATEGORIES['trekking'];
      const allRoutes: RouteResult[] = [];
      const profileLabels: string[] = [];
      const categoryLabels: ('shortest' | 'fastest' | 'safest')[] = [];
      const fetchedProfiles = new Set<string>();

      for (const cat of categories) {
        try {
          // Skip duplicate profiles (e.g. walk returns same for all 3)
          if (fetchedProfiles.has(cat.profile) && routeProfile !== 'walk') {
            // Re-use the route from the same profile but with different category
            const existing = allRoutes.find(r => r.profile === cat.profile);
            if (existing) {
              allRoutes.push({ ...existing, category: cat.category, routeIndex: allRoutes.length });
              profileLabels.push(cat.profile);
              categoryLabels.push(cat.category);
            }
            continue;
          }
          fetchedProfiles.add(cat.profile);

          const url = `https://brouter.de/brouter?lonlats=${lonlats}&profile=${cat.profile}&alternativeidx=0&format=geojson`;
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();

          const feature = data.features?.[0];
          if (!feature) continue;

          const props = feature.properties || {};
          const coords = feature.geometry?.coordinates || [];
          const parsed = parseRouteProps(props);

          // BRouter 1.7.0 on brouter.de sometimes omits 'filtered descend' property.
          // Fallback: calculate ascent/descent from elevation data in the messages array.
          if (parsed.descent === 0 && parsed.ascent > 0 && Array.isArray(props.messages)) {
            const elevFallback = calcElevationFromMessages(props.messages);
            if (elevFallback) {
              if (elevFallback.descent > 0) {
                parsed.descent = elevFallback.descent;
              }
              // Also use messages-based ascent if BRouter's value seems too low
              if (elevFallback.ascent > parsed.ascent) {
                parsed.ascent = elevFallback.ascent;
              }
            }
          }

          const routeData: RouteResult = {
            routeIndex: allRoutes.length,
            ...parsed,
            geometry: coords,
            profile: cat.profile,
            category: cat.category,
          };

          // Skip if too similar to an existing route
          const isDupe = allRoutes.some(r => isSimilarRoute(r, routeData));
          if (!isDupe) {
            allRoutes.push(routeData);
            profileLabels.push(cat.profile);
            categoryLabels.push(cat.category);
          }
        } catch (err) {
          console.warn('[RouteTab] Failed to fetch profile', cat.profile, err);
        }
      }

      if (allRoutes.length === 0) {
        setError(t('nav.noRoute'));
        return;
      }

      // ── Post-Processing: Validate and correct route labels ──
      // BRouter profiles don't guarantee strict distance/time optimization.
      // We post-process to ensure logical consistency:
      //   Route A (Kürzeste): Must have the SMALLEST distance (100% pure meter value)
      //   Route B (Schnellste): Must have the SMALLEST duration (time-based, considers road types)
      //   Route C (Alternativ/Sicherste): The remaining geographically different route
      //
      // Validation: If labeled "shortest" route has MORE distance than "fastest",
      // the labels must be swapped — a shortest route can never be longer than the fastest.

      if (allRoutes.length >= 2) {
        // Step 1: Find the route with the ACTUAL smallest distance
        let shortestIdx = 0;
        let shortestDist = allRoutes[0].distance;
        for (let i = 1; i < allRoutes.length; i++) {
          if (allRoutes[i].distance < shortestDist) {
            shortestDist = allRoutes[i].distance;
            shortestIdx = i;
          }
        }

        // Step 2: Find the route with the ACTUAL smallest duration (time)
        let fastestIdx = 0;
        let fastestDur = allRoutes[0].duration;
        for (let i = 1; i < allRoutes.length; i++) {
          if (allRoutes[i].duration < fastestDur && i !== shortestIdx) {
            fastestDur = allRoutes[i].duration;
            fastestIdx = i;
          }
        }

        // If shortest and fastest are the same route, find the next fastest
        if (fastestIdx === shortestIdx && allRoutes.length >= 2) {
          fastestDur = Infinity;
          for (let i = 0; i < allRoutes.length; i++) {
            if (i !== shortestIdx && allRoutes[i].duration < fastestDur) {
              fastestDur = allRoutes[i].duration;
              fastestIdx = i;
            }
          }
        }

        // Step 3: Re-label categories based on ACTUAL metrics
        for (let i = 0; i < allRoutes.length; i++) {
          if (i === shortestIdx) {
            allRoutes[i].category = 'shortest';
          } else if (i === fastestIdx) {
            allRoutes[i].category = 'fastest';
          } else {
            allRoutes[i].category = 'safest';
          }
        }

        // Step 4: Reorder — shortest route MUST be at index 0
        if (shortestIdx > 0) {
          const [shortestRoute] = allRoutes.splice(shortestIdx, 1);
          allRoutes.unshift(shortestRoute);
          const [sp] = profileLabels.splice(shortestIdx, 1);
          profileLabels.unshift(sp);
          const [sc] = categoryLabels.splice(shortestIdx, 1);
          categoryLabels.unshift(sc);
        }

        // Update route indices after reorder
        allRoutes.forEach((r, i) => { r.routeIndex = i; });

        // Step 5: Validation log
        console.log('[RouteTab] Route post-processing:', allRoutes.map(r =>
          `${r.category}: ${(r.distance / 1000).toFixed(1)}km / ${Math.round(r.duration / 60)}min (profile: ${r.profile})`
        ).join(' | '));
      }

      setAltProfileLabels(profileLabels);
      setRouteCategories(categoryLabels);

      // Step 3: Store main route + alternatives
      const main: RouteInfo = {
        distance: allRoutes[0].distance,
        duration: allRoutes[0].duration,
        ascent: allRoutes[0].ascent,
        descent: allRoutes[0].descent,
        geometry: allRoutes[0].geometry,
      };
      setRoute(main);
      setSelectedRouteIdx(0);
      // Preserve original main route for re-selection after switching alternatives
      originalMainRouteRef.current = main;

      const alts: RouteInfo[] = allRoutes.slice(1).map((r) => ({
        distance: r.distance,
        duration: r.duration,
        ascent: r.ascent,
        descent: r.descent,
        geometry: r.geometry,
      }));
      setAlternativeRoutes(alts);
      setShowAltRoutes(alts.length > 0);

      // ── Route Selection Mode: activate overlay on map ──
      if (allRoutes.length >= 2) {
        // Store ALL route results with categories for the overlay
        const storeRouteResults: StoreRouteResult[] = allRoutes.map(r => ({
          routeIndex: r.routeIndex,
          distance: r.distance,
          duration: r.duration,
          ascent: r.ascent,
          descent: r.descent,
          geometry: r.geometry,
          profile: r.profile,
          category: r.category,
        }));
        useNavigationStore.getState().setAllRouteResults(storeRouteResults);
        useNavigationStore.getState().setHighlightedRouteIdx(0);
        useNavigationStore.getState().setRouteSelectionMode(true);

        // Fit bounds for ALL routes combined
        const combinedBounds = new LngLatBounds();
        allRoutes.forEach(r => {
          if (r.geometry) {
            r.geometry.forEach(([lng, lat]) => combinedBounds.extend([Number(lng) || 0, Number(lat) || 0]));
          }
        });
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const padding = isMobile
          ? { top: 120, bottom: 200, left: 40, right: 40 }
          : { top: 80, bottom: 200, left: 80, right: 80 };
        mapInstanceRef.current?.fitBounds(combinedBounds, { padding, duration: 1000 });
      }
    } catch {
      setError(t('nav.routeFailed'));
    } finally {
      setIsCalculating(false);
    }
  }, [waypoints, routeProfile, setRoute, setAlternativeRoutes]);

  // Preserve original main route so clicking back to idx=0 restores it
  const originalMainRouteRef = useRef<RouteInfo | null>(null);

  const selectAlternative = useCallback(
    (idx: number) => {
      if (idx === 0) {
        // Restore original main route (not the potentially-overwritten store route)
        if (originalMainRouteRef.current) {
          setRoute(originalMainRouteRef.current);
        }
        setSelectedRouteIdx(0);
        useNavigationStore.getState().setHighlightedRouteIdx(0);
        return;
      }
      const alt = alternativeRoutes[idx - 1];
      if (alt) {
        setRoute(alt);
        setSelectedRouteIdx(idx);
        useNavigationStore.getState().setHighlightedRouteIdx(idx);
      }
    },
    [alternativeRoutes, setRoute]
  );

  const exportRouteJSON = useCallback(() => {
    if (!route) return;
    // Build the 1:1 route export with ALL calculated data
    const exportData = {
      app: 'TwitchCoPilot',
      version: '3.0.8',
      exportedAt: new Date().toISOString(),
      profile: routeProfile,
      waypoints: waypoints.map(wp => ({
        id: wp.id,
        lat: Number(wp.lat) || 0,
        lon: Number(wp.lon) || 0,
        name: wp.name || '',
        type: wp.type,
        address: wp.address || '',
      })),
      selectedRoute: {
        distance: route.distance,
        duration: route.duration,
        ascent: route.ascent,
        descent: route.descent,
        geometry: route.geometry,
      },
      alternativeRoutes: alternativeRoutes.map(alt => ({
        distance: alt.distance,
        duration: alt.duration,
        ascent: alt.ascent,
        descent: alt.descent,
        geometry: alt.geometry,
      })),
    };
    const json = JSON.stringify(exportData, null, 2);
    downloadFile(json, 'twitch-copilot-route.json', 'application/json');
    setShowExport(false);
  }, [route, routeProfile, waypoints, alternativeRoutes]);

  const importRouteJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate structure
        if (!data.app || !data.selectedRoute || !Array.isArray(data.selectedRoute.geometry) || data.selectedRoute.geometry.length < 2) {
          setError(t('nav.importError'));
          setTimeout(() => setError(''), 3000);
          return;
        }

        // Restore waypoints
        if (Array.isArray(data.waypoints) && data.waypoints.length >= 2) {
          setWaypoints(data.waypoints.map((wp: any) => ({
            id: wp.id || `wp-${Date.now()}`,
            lat: Number(wp.lat) || 0,
            lon: Number(wp.lon) || 0,
            name: wp.name || '',
            type: wp.type || 'via',
            address: wp.address || '',
          })));

          // Sync input fields
          const start = data.waypoints.find((wp: any) => wp.type === 'start');
          const finish = data.waypoints.find((wp: any) => wp.type === 'finish');
          if (start) setStartInput(start.name || `${Number(start.lat).toFixed(5)}, ${Number(start.lon).toFixed(5)}`);
          if (finish) setDestInput(finish.name || `${Number(finish.lat).toFixed(5)}, ${Number(finish.lon).toFixed(5)}`);
        }

        // Restore selected route
        const restoredRoute: RouteInfo = {
          distance: Number(data.selectedRoute.distance) || 0,
          duration: Number(data.selectedRoute.duration) || 0,
          ascent: Number(data.selectedRoute.ascent) || 0,
          descent: Number(data.selectedRoute.descent) || 0,
          geometry: data.selectedRoute.geometry.map((c: any) => [Number(c[0]) || 0, Number(c[1]) || 0] as [number, number]),
        };
        setRoute(restoredRoute);

        // Restore alternative routes
        if (Array.isArray(data.alternativeRoutes)) {
          setAlternativeRoutes(data.alternativeRoutes.map((alt: any) => ({
            distance: Number(alt.distance) || 0,
            duration: Number(alt.duration) || 0,
            ascent: Number(alt.ascent) || 0,
            descent: Number(alt.descent) || 0,
            geometry: (alt.geometry || []).map((c: any) => [Number(c[0]) || 0, Number(c[1]) || 0] as [number, number]),
          })));
          setShowAltRoutes(data.alternativeRoutes.length > 0);
        }

        // Restore routing profile if present
        if (data.profile && ROUTING_PROFILES.some(p => p.value === data.profile)) {
          updateSetting('routeProfile', data.profile);
        }

        // Fit map to imported route
        if (restoredRoute.geometry.length >= 2) {
          const bounds = new LngLatBounds();
          restoredRoute.geometry.forEach(([lng, lat]) => bounds.extend([lng, lat]));
          mapInstanceRef.current?.fitBounds(bounds, { padding: 60, duration: 1000 });
        }

        setSelectedRouteIdx(0);
        setError('');
      } catch {
        setError(t('nav.importError'));
        setTimeout(() => setError(''), 3000);
      }
    };
    input.click();
  }, [setRoute, setAlternativeRoutes, setWaypoints, updateSetting]);

  const exportGPX = useCallback(() => {
    if (!route) return;
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Twitch CoPilot">
  <trk>
    <name>Twitch CoPilot Route</name>
    <trkseg>
${route.geometry.map(([lon, lat]) => `      <trkpt lat="${lat}" lon="${lon}"/>`).join('\n')}
    </trkseg>
  </trk>
</gpx>`;
    downloadFile(gpx, 'route.gpx', 'application/gpx+xml');
    setShowExport(false);
  }, [route]);

  const exportKML = useCallback(() => {
    if (!route) return;
    const coords = route.geometry.map(([lon, lat]) => `${lon},${lat},0`).join('\n            ');
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Twitch CoPilot Route</name>
    <Placemark>
      <LineString>
        <coordinates>
            ${coords}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
    downloadFile(kml, 'route.kml', 'application/vnd.google-earth.kml+xml');
    setShowExport(false);
  }, [route]);

  const exportTCX = useCallback(() => {
    if (!route) return;
    const tcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Courses>
    <Course>
      <Name>Twitch CoPilot Route</Name>
      <Track>
        <Trackpoint>
          <Position><LatitudeDegrees>${route.geometry[0]?.[1] || 0}</LatitudeDegrees><LongitudeDegrees>${route.geometry[0]?.[0] || 0}</LongitudeDegrees></Position>
        </Trackpoint>
      </Track>
    </Course>
  </Courses>
</TrainingCenterDatabase>`;
    downloadFile(tcx, 'route.tcx', 'application/vnd.garmin.tcx');
    setShowExport(false);
  }, [route]);

  const handleClearRoute = useCallback(() => {
    clearWaypoints();
    setStartInput('');
    setDestInput('');
    setViaInput('');
    setShowAltRoutes(false);
    setSelectedRouteIdx(0);
  }, [clearWaypoints]);

  const startWp = waypoints.find((w) => w.type === 'start');
  const finishWp = waypoints.find((w) => w.type === 'finish');
  const viaWps = waypoints.filter((w) => w.type === 'via');

  return (
    <ScrollArea className="h-full custom-scrollbar">
    <div className="flex flex-col gap-3 p-3 pb-8 max-w-full overflow-hidden">
      {/* Start address */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-sidebar-foreground/70">
          {t('nav.start')}
        </label>
        <div className="flex gap-1.5">
          <Input
            placeholder={t('nav.search')}
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchStart()}
            className="h-8 text-sm bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSearchStart}
            disabled={isSearching}
          >
            {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-accent hover:text-accent/80"
            onClick={handleGPSLocate}
            title="GPS"
          >
            <Locate className="size-4" />
          </Button>
        </div>
        {showStartResults && startResults.length > 0 && (
          <div className="bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
            {startResults.map((r, i) => (
              <button
                key={i}
                className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-foreground/10 border-b border-border last:border-0 transition-colors"
                onClick={() => selectStart(r)}
              >
                <div className="font-medium truncate">{r.display_name?.split(',')[0] || '?'}</div>
                <div className="text-sidebar-foreground/50 truncate text-[10px] mt-0.5">
                  {r.display_name || ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIA search */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
          {t('nav.via')}
          {viaWps.length > 0 && (
            <span className="text-[10px] text-sidebar-foreground/40">({viaWps.length})</span>
          )}
        </label>
        <div className="flex gap-1.5">
          <Input
            placeholder={t('nav.viaSearch')}
            value={viaInput}
            onChange={(e) => setViaInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchVia()}
            className="h-8 text-sm bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSearchVia}
            disabled={isSearching}
          >
            {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </Button>
        </div>
        {showViaResults && viaResults.length > 0 && (
          <div className="bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
            {viaResults.map((r, i) => (
              <button
                key={i}
                className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-foreground/10 border-b border-border last:border-0 transition-colors"
                onClick={() => selectVia(r)}
              >
                <div className="font-medium truncate">{r.display_name?.split(',')[0] || '?'}</div>
                <div className="text-sidebar-foreground/50 truncate text-[10px] mt-0.5">
                  {r.display_name || ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Destination address */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-sidebar-foreground/70">
          {t('nav.destination')}
        </label>
        <div className="flex gap-1.5">
          <Input
            placeholder={t('nav.search')}
            value={destInput}
            onChange={(e) => setDestInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchDest()}
            className="h-8 text-sm bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSearchDest}
            disabled={isSearching}
          >
            {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </Button>
        </div>
        {showDestResults && destResults.length > 0 && (
          <div className="bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
            {destResults.map((r, i) => (
              <button
                key={i}
                className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-foreground/10 border-b border-border last:border-0 transition-colors"
                onClick={() => selectDest(r)}
              >
                <div className="font-medium truncate">{r.display_name?.split(',')[0] || '?'}</div>
                <div className="text-sidebar-foreground/50 truncate text-[10px] mt-0.5">
                  {r.display_name || ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Waypoint list with remove buttons */}
      {waypoints.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-sidebar-foreground/40 px-1">
            {t('nav.waypoints')}
          </div>
          {waypoints.map((wp, idx) => {
            const isStart = wp.type === 'start';
            const isFinish = wp.type === 'finish';
            const wpColor = isStart ? 'text-accent' : isFinish ? 'text-danger' : 'text-primary';
            const WpIcon = isStart ? Navigation : MapPin;
            return (
              <div key={wp.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-sidebar-foreground/5 text-xs group">
                <WpIcon className={`size-3 ${wpColor} shrink-0`} />
                <span className="text-[10px] text-sidebar-foreground/30 shrink-0">{isStart ? 'A' : isFinish ? 'B' : `V${idx}`}</span>
                <span className="flex-1 truncate min-w-0">{wp.name || `${(Number(wp.lat) || 0).toFixed(4)}, ${(Number(wp.lon) || 0).toFixed(4)}`}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 shrink-0 size-5 rounded flex items-center justify-center hover:bg-danger/20 text-sidebar-foreground/30 hover:text-danger transition-all"
                  onClick={() => useNavigationStore.getState().removeWaypoint(wp.id)}
                  title={t('nav.remove')}
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-sidebar-foreground/70 shrink-0">
          {t('nav.profile')}
        </label>
        <Select value={routeProfile} onValueChange={(v) => updateSetting('routeProfile', v)}>
          <SelectTrigger className="h-8 text-xs flex-1 bg-sidebar-foreground/5 border-sidebar-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROUTING_PROFILES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {t(p.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calculate button */}
      <Button
        onClick={calculateRoute}
        disabled={!startWp || !finishWp || isCalculating}
        className="w-full h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isCalculating ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Route className="size-4" />
        )}
        {t('nav.calculate')}
      </Button>

      {/* Error */}
      {error && (
        <div className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg">{error}</div>
      )}

      {/* Import button — always visible */}
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs gap-1.5 border-sidebar-border"
        onClick={importRouteJSON}
      >
        <FileUp className="size-3.5" />
        {t('nav.importRoute')}
      </Button>

      {/* Route info & selection */}
      {route && (
          <div className="space-y-3">
            {/* Route options — always visible when routes exist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-sidebar-foreground/70">
                  {t('nav.altRoutes')} ({1 + alternativeRoutes.length})
                </span>
                {isCalculating && (
                  <Loader2 className="size-3 animate-spin text-sidebar-foreground/40" />
                )}
              </div>

              {/* Main route option */}
              <button
                className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                  selectedRouteIdx === 0
                    ? 'bg-primary/15 border-primary ring-1 ring-primary/30'
                    : 'bg-sidebar-foreground/5 border-sidebar-border hover:bg-sidebar-foreground/10'
                }`}
                onClick={() => selectAlternative(0)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center size-4 rounded-full text-[10px] font-bold shrink-0 ${
                      selectedRouteIdx === 0 ? 'bg-primary text-primary-foreground' : 'bg-sidebar-foreground/15 text-sidebar-foreground/60'
                    }`}>1</span>
                    <span className="font-medium">{routeCategories[0] ? t(getCategoryLabel(routeCategories[0])) : t('nav.routeMain')}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{formatDistance(route.distance)}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 ml-6 text-sidebar-foreground/50">
                  <span className="tabular-nums">{formatDuration(route.duration)}</span>
                  <span className="flex items-center gap-0.5 tabular-nums"><Mountain className="size-3" />{route.ascent.toFixed(0)} {t('general.hm')}</span>
                  <span className="flex items-center gap-0.5 tabular-nums"><TrendingDown className="size-3" />{route.descent.toFixed(0)} {t('general.hm')}</span>
                </div>
              </button>

              {/* Alternative route options */}
              {alternativeRoutes.map((alt, i) => {
                const altIdx = i + 1;
                const isSelected = selectedRouteIdx === altIdx;
                const category = routeCategories[altIdx];
                const profileLabel = altProfileLabels[altIdx];
                const isDifferentProfile = profileLabel && profileLabel !== routeProfile;
                return (
                  <button
                    key={i}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'bg-primary/15 border-primary ring-1 ring-primary/30'
                        : 'bg-sidebar-foreground/5 border-sidebar-border hover:bg-sidebar-foreground/10'
                    }`}
                    onClick={() => selectAlternative(altIdx)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center size-4 rounded-full text-[10px] font-bold shrink-0 ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-sidebar-foreground/15 text-sidebar-foreground/60'
                        }`}>{altIdx + 1}</span>
                        <span className="font-medium">{category ? t(getCategoryLabel(category)) : t('nav.routeAlt', { n: altIdx + 1 })}</span>
                        {isDifferentProfile && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium">
                            {t(getProfileLabelKey(profileLabel))}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold tabular-nums">{formatDistance(alt.distance)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 ml-6 text-sidebar-foreground/50">
                      <span className="tabular-nums">{formatDuration(alt.duration)}</span>
                      <span className="flex items-center gap-0.5 tabular-nums"><Mountain className="size-3" />{alt.ascent.toFixed(0)} {t('general.hm')}</span>
                      <span className="flex items-center gap-0.5 tabular-nums"><TrendingDown className="size-3" />{alt.descent.toFixed(0)} {t('general.hm')}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5 border-sidebar-border"
                  onClick={() => setShowExport(!showExport)}
                >
                  <FileDown className="size-3.5" />
                  {t('nav.export')}
                </Button>
                {showExport && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-border rounded-lg shadow-lg z-10">
                    <button
                      className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-foreground/10 rounded-t-lg transition-colors flex items-center gap-2"
                      onClick={exportRouteJSON}
                    >
                      <Braces className="size-3.5 shrink-0" />
                      {t('nav.exportJSON')}
                    </button>
                    <div className="border-t border-border" />
                    <button
                      className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-foreground/10 transition-colors"
                      onClick={exportGPX}
                    >
                      GPX
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-foreground/10 transition-colors"
                      onClick={exportKML}
                    >
                      KML
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-foreground/10 rounded-b-lg transition-colors"
                      onClick={exportTCX}
                    >
                      TCX
                    </button>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-danger/50 text-danger hover:bg-danger/10 hover:text-danger"
                onClick={handleClearRoute}
              >
                <Trash2 className="size-3.5" />
                {t('bot.delete')}
              </Button>
            </div>
          </div>
      )}

      {/* Navigation controls — GPS, Start/Stop, Demo, Community Waypoints */}
      <NavigateSection />

      {/* Empty state */}
      {!route && !isCalculating && !error && (
        <div className="flex items-center justify-center text-center px-4 py-8">
          <div className="space-y-2">
            <MapPin className="size-8 text-sidebar-foreground/20 mx-auto" />
            <p className="text-xs text-sidebar-foreground/40">
              {t('nav.enterStartDest')}
            </p>
          </div>
        </div>
      )}
    </div>
    </ScrollArea>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
