/**
 * useAutoReroute — Detects off-route deviations and recalculates route to destination.
 *
 * How it works:
 * 1. During active navigation (isNavigating && !isDemoMode), monitors GPS position.
 * 2. Calculates minimum distance from current position to any point on route geometry.
 * 3. If distance exceeds REROUTE_THRESHOLD (50m) for REROUTE_GRACE_PERIOD (5s), triggers reroute.
 * 4. Calls BRouter API from current position to the finish waypoint.
 * 5. On success: updates route in store, resets remaining distance/ETA.
 * 6. On failure: shows error, keeps existing route.
 * 7. Cooldown: Won't reroute again within 30s of last successful reroute.
 *
 * v4.1.0 Fixes:
 * - Added AbortController with 15s timeout on BRouter fetch (prevents isRerouting=true forever)
 * - Auto-clears isRerouting when user returns to route within grace period
 * - Better error handling for network failures
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ttsQueue } from '@/lib/ttsQueue';
import { t } from '@/lib/i18n';

const REROUTE_THRESHOLD_M = 50;        // meters from route to trigger reroute
const REROUTE_GRACE_PERIOD_MS = 5000;   // must be off-route for 5s continuously
const REROUTE_COOLDOWN_MS = 30000;      // don't reroute again within 30s
const REROUTE_FETCH_TIMEOUT_MS = 15000;  // v4.1.0: max time to wait for BRouter API

// Haversine distance in meters
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate minimum distance from a point to the route geometry
function minDistanceToRoute(
  lat: number,
  lon: number,
  geometry: [number, number][]
): number {
  let minDist = Infinity;

  for (let i = 0; i < geometry.length; i++) {
    const [glon, glat] = geometry[i];
    const d = haversineDistance(lat, lon, glat, glon);
    if (d < minDist) minDist = d;
  }

  return minDist;
}

export function useAutoReroute() {
  const offRouteSinceRef = useRef<number | null>(null);
  const lastRerouteTimeRef = useRef(0);
  const isReroutingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const doReroute = useCallback(async () => {
    const nav = useNavigationStore.getState();
    if (!nav.route?.geometry || nav.isDemoMode) return;

    const { currentLat, currentLon } = nav;
    if (currentLat === null || currentLon === null) return;

    // Find the finish waypoint
    const finishWp = nav.waypoints.find((w) => w.type === 'finish');
    if (!finishWp) return;

    // Check cooldown
    const now = Date.now();
    if (now - lastRerouteTimeRef.current < REROUTE_COOLDOWN_MS) return;

    isReroutingRef.current = true;
    useNavigationStore.getState().setIsRerouting(true);

    // Announce rerouting via TTS
    const { voiceEnabled, voiceVolume, voiceRate, selectedVoice, language } = useSettingsStore.getState();
    if (voiceEnabled) {
      ttsQueue.enqueue(t('nav.tts.rerouting'), {
        voice: selectedVoice || undefined,
        rate: voiceRate,
        volume: voiceVolume,
        lang: language === 'de' ? 'de-DE' : 'en-US',
      });
    }

    // v4.1.0 FIX: AbortController with timeout to prevent isRerouting=true forever
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), REROUTE_FETCH_TIMEOUT_MS);

    try {
      const profile = useSettingsStore.getState().routeProfile || 'trekking';
      // Build lonlats including remaining via-points (not yet passed)
    const viaWps = nav.waypoints
      .filter((w) => w.type === 'via')
      .filter((w) => haversineDistance(currentLat, currentLon, w.lat, w.lon) > 100); // only future vias (>100m away)
    const allReroutePoints = [
      `${currentLon},${currentLat}`,
      ...viaWps.map((w) => `${w.lon},${w.lat}`),
      `${finishWp.lon},${finishWp.lat}`,
    ];
    const lonlats = allReroutePoints.join('|');
      const url = `https://brouter.de/brouter?lonlats=${lonlats}&profile=${profile}&alternativeidx=0&format=geojson`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('BRouter request failed');
      const data = await res.json();

      const feature = data.features?.[0];
      if (!feature) throw new Error('No route returned');

      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates || [];

      // Extract route data
      const getNum = (keys: string[]): number => {
        for (const key of keys) {
          if (props[key] !== undefined && props[key] !== null) {
            const val = Number(props[key]);
            if (!isNaN(val)) return val;
          }
        }
        return 0;
      };

      const newRoute = {
        distance: getNum(['track-length']),
        duration: getNum(['total-time']),
        ascent: getNum(['filtered ascend', 'ascend', 'plain-ascend']),
        descent: getNum(['filtered descend', 'descend', 'plain-descend']),
        geometry: coords as [number, number][],
      };

      // Update the route in the store
      const navStore = useNavigationStore.getState();
      navStore.setRoute(newRoute);
      navStore.setRemainingDistance(newRoute.distance);
      navStore.setAscent(newRoute.ascent);
      navStore.setDescent(newRoute.descent);

      // Recalculate ETA
      if (newRoute.duration > 0) {
        const h = Math.floor(newRoute.duration / 3600);
        const m = Math.round((newRoute.duration % 3600) / 60);
        navStore.setEta(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }

      // Clear driven path since we're on a new route
      useNavigationStore.setState({ drivenPath: [] });

      lastRerouteTimeRef.current = Date.now();
      console.log('[AutoReroute] Successfully rerouted:', {
        distance: (newRoute.distance / 1000).toFixed(1) + 'km',
        duration: Math.round(newRoute.duration / 60) + 'min',
      });
    } catch (err) {
      console.error('[AutoReroute] Failed:', err);
      // v4.1.0 FIX: If fetch was aborted due to timeout, log it clearly
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.warn('[AutoReroute] BRouter API timed out after', REROUTE_FETCH_TIMEOUT_MS, 'ms');
      }
    } finally {
      clearTimeout(timeoutId);
      isReroutingRef.current = false;
      abortControllerRef.current = null;
      // v4.1.0 CRITICAL FIX: Always reset isRerouting in finally block.
      // This ensures the rerouting indicator goes away even if the API call fails or times out.
      useNavigationStore.getState().setIsRerouting(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = useNavigationStore.subscribe(() => {
      const nav = useNavigationStore.getState();

      // Only check during active real-world navigation
      if (!nav.isNavigating || nav.isDemoMode) {
        offRouteSinceRef.current = null;
        return;
      }

      // Need GPS position and route geometry
      if (nav.currentLat === null || nav.currentLon === null || !nav.route?.geometry) {
        offRouteSinceRef.current = null;
        return;
      }

      const dist = minDistanceToRoute(nav.currentLat, nav.currentLon, nav.route.geometry);

      if (dist > REROUTE_THRESHOLD_M) {
        // Off route detected
        if (offRouteSinceRef.current === null) {
          offRouteSinceRef.current = Date.now();
        } else if (Date.now() - offRouteSinceRef.current >= REROUTE_GRACE_PERIOD_MS) {
          // Been off route for grace period — trigger reroute
          offRouteSinceRef.current = null;
          doReroute();
        }
      } else {
        // Back on route
        offRouteSinceRef.current = null;

        // v4.1.0 FIX: If isRerouting is still true but user is back on route,
        // and no reroute is in progress, clear the flag.
        // This handles the edge case where the reroute API call completed
        // but the state wasn't properly cleared.
        if (nav.isRerouting && !isReroutingRef.current) {
          useNavigationStore.getState().setIsRerouting(false);
        }
      }
    });

    return () => unsubscribe();
  }, [doReroute]);
}
