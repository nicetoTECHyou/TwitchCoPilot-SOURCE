
import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { t } from '@/lib/i18n';
import { usePOIStore } from '@/store/usePOIStore';
import { POI_CATEGORY_CONFIG, type POI } from '@/types';
import SkyChart from '@/components/map/SkyChart';
import { useFollowCam } from '@/hooks/useFollowCam';

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Shared map instance ref for external components (zoom controls, etc.)
export const mapInstanceRef = { current: null as maplibregl.Map | null };

function rasterStyle(tiles: string, attribution: string, maxzoom: number = 19) {
  return {
    version: 8 as const,
    sources: {
      tiles: {
        type: 'raster' as const,
        tiles: [tiles],
        tileSize: 256,
        maxzoom,
        attribution,
      },
    },
    layers: [
      { id: 'tiles', type: 'raster' as const, source: 'tiles', minzoom: 0 },
    ],
  };
}

const STYLES: Record<string, any> = {
  street: rasterStyle(
    'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
    '© OSM © CARTO'
  ),
  dark: rasterStyle(
    'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
    '© OSM © CARTO'
  ),
  satellite: rasterStyle(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    '© Esri',
    18
  ),
  topo: rasterStyle(
    'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    '© OpenTopoMap (CC-BY-SA)',
    17
  ),
};

// Hillshade overlay tile source
const HILLSHADE_TILES = 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png';
const HILLSHADE_ATTRIBUTION = '© Stamen Design © Stadia Maps © OSM';

const CENTER: [number, number] = [13.38, 52.52];

// ─── formatPOIDetails: build rich HTML from OSM tags ───────────────────────────
function formatPOIDetails(poi: POI): string {
  const tags = poi.tags || {};
  if (Object.keys(tags).length === 0) return '';

  const lines: string[] = [];
  const cat = poi.category;

  // Helper to add a labeled line if value exists
  const add = (label: string, value: string | undefined) => {
    if (value && value.trim()) {
      lines.push(`<div style="display:flex;gap:4px;font-size:11px;line-height:1.4"><span style="color:var(--color-muted-foreground);min-width:80px;flex-shrink:0">${escHtml(label)}</span><span style="color:inherit">${escHtml(value)}</span></div>`);
    }
  };

  // ─── Category-specific fields ─────────────────────────────────────────────
  if (cat === 'charging') {
    add(t('popup.bicycle'), tags.bicycle === 'yes' ? t('general.yes') : tags.bicycle === 'no' ? t('general.no') : undefined);
    add(t('popup.car'), tags.motorcar === 'yes' ? t('general.yes') : tags.motorcar === 'no' ? t('general.no') : undefined);
    add(t('popup.capacity'), tags.capacity);
    add(t('popup.operator'), tags.operator);
    add(t('popup.phone'), tags.phone);
    add(t('popup.openingHours'), tags.opening_hours);
    add(t('popup.type2'), tags['socket:type2']);
    add(t('popup.chademo'), tags['socket:chademo']);
    add(t('popup.ccs'), tags['socket:ccs_combo']);
    add(t('popup.schuko'), tags['socket:schuko']);
    add(t('popup.voltage'), tags.voltage ? `${tags.voltage} V` : undefined);
    add(t('popup.amperage'), tags.amperage ? `${tags.amperage} A` : undefined);
    add(t('poi.fee'), tags.fee === 'yes' ? t('general.yes') : tags.fee === 'no' ? t('general.no') : tags.fee);
  } else if (cat === 'restaurant' || cat === 'cafe') {
    add(t('popup.cuisine'), tags.cuisine);
    add(t('popup.phone'), tags.phone);
    add(t('popup.openingHours'), tags.opening_hours);
    if (tags.website) add(t('popup.website'), tags.website);
    add(t('popup.takeaway'), tags.takeaway === 'yes' ? t('general.yes') : tags.takeaway === 'no' ? t('general.no') : undefined);
    add(t('popup.delivery'), tags.delivery === 'yes' ? t('general.yes') : tags.delivery === 'no' ? t('general.no') : undefined);
    add(t('popup.outdoorSeating'), tags.outdoor_seating === 'yes' ? t('general.yes') : tags.outdoor_seating === 'no' ? t('general.no') : undefined);
  } else if (cat === 'shopping' || cat === 'hardware') {
    add(t('popup.phone'), tags.phone);
    add(t('popup.openingHours'), tags.opening_hours);
    add(t('popup.brand'), tags.brand);
    if (tags.website) add(t('popup.website'), tags.website);
  } else if (cat === 'hospital') {
    add(t('popup.phone'), tags.phone);
    add(t('popup.emergency'), tags.emergency === 'yes' ? t('general.yes') : tags.emergency === 'no' ? t('general.no') : undefined);
    add(t('popup.operator'), tags.operator);
  } else if (cat === 'pharmacy') {
    add(t('popup.phone'), tags.phone);
    add(t('popup.openingHours'), tags.opening_hours);
    add(t('poi.emergencyService'), tags.dispensing === 'yes' ? t('general.yes') : tags.dispensing === 'no' ? t('general.no') : undefined);
  } else if (cat === 'fuel') {
    add(t('popup.brand'), tags.brand);
    add(t('popup.openingHours'), tags.opening_hours);
    add(t('popup.phone'), tags.phone);
  } else if (cat === 'bicycle_repair') {
    add(t('popup.repair'), tags['bike:repair'] === 'yes' ? t('general.yes') : tags['bike:repair'] === 'no' ? t('general.no') : undefined);
    add(t('popup.phone'), tags.phone);
    add(t('popup.openingHours'), tags.opening_hours);
    add(t('popup.brand'), tags.brand);
  } else if (cat === 'camping' || cat === 'wildcamping') {
    add(t('popup.tents'), tags.tents === 'yes' ? t('general.yes') : tags.tents === 'no' ? t('general.no') : undefined);
    add(t('popup.caravans'), tags.caravans === 'yes' ? t('general.yes') : tags.caravans === 'no' ? t('general.no') : undefined);
    add(t('popup.phone'), tags.phone);
    if (tags.website) add(t('popup.website'), tags.website);
    add(t('popup.operator'), tags.operator);
    add(t('poi.fee'), tags.fee === 'yes' ? t('general.yes') : tags.fee === 'no' ? t('general.no') : tags.fee);
  } else if (cat === 'hostel' || cat === 'shelter') {
    add(t('popup.phone'), tags.phone);
    if (tags.website) add(t('popup.website'), tags.website);
    add(t('popup.operator'), tags.operator);
    add(t('poi.fee'), tags.fee === 'yes' ? t('general.yes') : tags.fee === 'no' ? t('general.no') : tags.fee);
  }

  // ─── Common fields for all (if not already shown) ──────────────────────
  const shownKeys = new Set<string>();
  // Address fields
  const addrKeys = Object.keys(tags).filter(k => k.startsWith('addr:'));
  if (addrKeys.length > 0) {
    const street = tags['addr:street'];
    const number = tags['addr:housenumber'];
    const city = tags['addr:city'];
    const postcode = tags['addr:postcode'];
    if (street) add(t('popup.address'), `${street}${number ? ' ' + number : ''}`);
    if (city) add(t('popup.city'), `${postcode ? postcode + ' ' : ''}${city}`);
  }
  addrKeys.forEach(k => shownKeys.add(k));

  // Generic common fields (skip if already in category-specific section)
  const commonFields: [string, string, string][] = [
    ['phone', t('popup.phone'), ''],
    ['opening_hours', t('popup.openingHours'), ''],
    ['website', t('popup.website'), ''],
    ['operator', t('popup.operator'), ''],
    ['description', t('popup.description'), ''],
  ];
  commonFields.forEach(([key, label]) => {
    if (tags[key] && !shownKeys.has(key) && !lines.some(l => l.includes(label))) {
      add(label, tags[key]);
      shownKeys.add(key);
    }
  });

  return lines.length > 0
    ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--color-border)">${lines.join('')}</div>`
    : '';
}

// ─── Context menu state type ──────────────────────────────────────────────
interface ContextMenuState {
  x: number;
  y: number;
  lngLat: { lat: number; lng: number };
}

export default function MapContainer() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gpsRef = useRef<maplibregl.Marker | null>(null);
  const wpRef = useRef<maplibregl.Marker[]>([]);
  const poiRef = useRef<maplibregl.Marker[]>([]);
  const readyRef = useRef(false);
  const skipStyleRef = useRef(true);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const mapStyle = useSettingsStore((s) => s.mapStyle);
  const showRouteLine = useSettingsStore((s) => s.showRouteLine);
  const showAltRoutes = useSettingsStore((s) => s.showAltRoutes);
  const showPOIMarkers = useSettingsStore((s) => s.showPOIMarkers);
  const showWaypoints = useSettingsStore((s) => s.showWaypoints);
  const showDrivenPath = useSettingsStore((s) => s.showDrivenPath);
  const showHillshade = useSettingsStore((s) => s.showHillshade);
  const followCamEnabled = useSettingsStore((s) => s.followCamEnabled);

  const { route, waypoints, currentLat, currentLon, isNavigating, isDemoMode, drivenPath, alternativeRoutes } = useNavigationStore();
  const highlightedRouteIdx = useNavigationStore((s) => s.highlightedRouteIdx);
  const routeSelectionMode = useNavigationStore((s) => s.routeSelectionMode);
  const pois = usePOIStore((s) => s.pois);

  // Follow-Cam: 3D Navigation Camera (Chase Cam)
  useFollowCam();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  // Counter incremented on every style.load — forces data-layer useEffects to re-apply
  // after setStyle() destroys all sources/layers.
  const [styleLoadCount, setStyleLoadCount] = useState(0);
  // Flag: skip fitBounds when re-applying data after a style change (don't jump the viewport)
  const styleChangedRef = useRef(false);

  // Close context menu on outside click
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Init map once
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    console.log('[Map] Init, style:', mapStyle);

    const map = new maplibregl.Map({
      container: el,
      style: STYLES[mapStyle] || STYLES.street,
      center: CENTER,
      zoom: 12,
      maxZoom: 22,
      attributionControl: false,
    });

    // Store map instance for external components (zoom controls in App.tsx)
    mapInstanceRef.current = map;

    // Disable right-click browser context menu on the map canvas
    map.getCanvas().addEventListener('contextmenu', (e) => e.preventDefault());

    map.on('style.load', () => {
      console.log('[Map] style.load fired');
      readyRef.current = true;
      addRouteLayers(map);
      addHillshadeLayer(map);
      if (!map.getSource('driven-path')) {
        map.addSource('driven-path', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
        map.addLayer({
          id: 'driven-path-line', type: 'line', source: 'driven-path',
          paint: { 'line-color': '#FF6B35', 'line-width': 4, 'line-opacity': 0.8 },
          layout: { 'line-join': 'round', 'line-cap': 'round' },
        });
      }
      // Force all data-layer useEffects to re-apply their data
      setStyleLoadCount(prev => prev + 1);
    });

    // Left-click: only for POI popups (do NOT add waypoint)
    // No explicit handler needed - MapLibre handles marker popups natively

    // Right-click: show custom context menu for waypoint placement
    map.on('contextmenu', (e) => {
      e.preventDefault();
      const { lat, lng } = e.lngLat;
      setContextMenu({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
        lngLat: { lat, lng },
      });
    });

    mapRef.current = map;

    // Resize observer to handle container size changes (especially mobile)
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    resizeObserver.observe(el);

    map.once('load', () => {
      console.log('[Map] map.load fired');
      readyRef.current = true;
      setTimeout(() => { skipStyleRef.current = false; }, 500);
    });

    return () => {
      resizeObserver.disconnect();
      poiRef.current.forEach(m => m.remove());
      wpRef.current.forEach(m => m.remove());
      gpsRef.current?.remove();
      mapInstanceRef.current = null;
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // Handle context menu actions
  const handleSetWaypoint = useCallback((type: 'start' | 'via' | 'finish') => {
    if (!contextMenu) return;
    const { lat, lng } = contextMenu.lngLat;
    useNavigationStore.getState().addWaypoint({
      id: `wp-${Date.now()}`,
      lat, lon: lng,
      type,
    });
    setContextMenu(null);
  }, [contextMenu]);

  // Close context menu when clicking elsewhere on the document
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contextMenu && contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu]);

  // Switch style (stars mode forces dark base map + overlay)
  useEffect(() => {
    if (skipStyleRef.current) return;
    const map = mapRef.current;
    if (!map) return;

    const effectiveStyle = mapStyle === 'stars' ? 'dark' : mapStyle;
    console.log('[Map] Switch style to:', effectiveStyle, '(original:', mapStyle, ')');

    const switchIt = () => {
      readyRef.current = false;
      styleChangedRef.current = true;
      map.setStyle(STYLES[effectiveStyle] || STYLES.street);
    };

    if (map.isStyleLoaded()) {
      switchIt();
    } else {
      map.once('style.load', switchIt);
    }
  }, [mapStyle]);

  // ─── Hillshade overlay toggle ──────────────────────────────────────────
  function addHillshadeLayer(map: maplibregl.Map) {
    if (!map.getSource('hillshade')) {
      map.addSource('hillshade', {
        type: 'raster',
        tiles: [HILLSHADE_TILES],
        tileSize: 256,
        maxzoom: 15,
        attribution: HILLSHADE_ATTRIBUTION,
      });
      map.addLayer({
        id: 'hillshade-layer',
        type: 'raster',
        source: 'hillshade',
        paint: {
          'raster-opacity': 0.4,
          'raster-saturation': 0,
        },
      });
    }
    // Set visibility based on current setting
    const visible = showHillshade;
    if (map.getLayer('hillshade-layer')) {
      map.setLayoutProperty('hillshade-layer', 'visibility', visible ? 'visible' : 'none');
    }
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    if (!map.getSource('hillshade')) {
      addHillshadeLayer(map);
    } else if (map.getLayer('hillshade-layer')) {
      map.setLayoutProperty('hillshade-layer', 'visibility', showHillshade ? 'visible' : 'none');
    }
  }, [showHillshade]);

  // ─── Route line (with visibility toggle) ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    // Toggle visibility
    if (map.getLayer('route-line') && map.getLayer('route-glow')) {
      const vis = showRouteLine ? 'visible' : 'none';
      map.setLayoutProperty('route-line', 'visibility', vis);
      map.setLayoutProperty('route-glow', 'visibility', vis);
    }

    if (!route?.geometry || route.geometry.length < 2) {
      if (map.getSource('route')) {
        (map.getSource('route') as any).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} });
      }
      return;
    }

    if (!map.getSource('route')) addRouteLayers(map);
    (map.getSource('route') as any).setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: route.geometry },
      properties: {},
    });

    // Only fitBounds on actual route change, not on style reload
    if (!styleChangedRef.current) {
      const bounds = new maplibregl.LngLatBounds();
      route.geometry.forEach(([lng, lat]) => bounds.extend([Number(lng) || 0, Number(lat) || 0]));
      const isMobile = window.innerWidth < 768;
      const padding = isMobile
        ? { top: 60, bottom: 60, left: 40, right: 40 }
        : { top: 80, bottom: 80, left: 80, right: 400 };
      map.fitBounds(bounds, { padding, duration: 1000 });
    }
    styleChangedRef.current = false;
  }, [route, showRouteLine, styleLoadCount]);

  // ─── Alternative routes (with visibility toggle) ────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    // Toggle visibility — hide alt routes during navigation regardless of setting
    const altVisible = showAltRoutes && !isNavigating;
    for (let i = 0; i < 3; i++) {
      const layerId = `alt-route-line-${i}`;
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', altVisible ? 'visible' : 'none');
      }
    }

    const colors = ['#3B82F6', '#F59E0B', '#10B981'];
    for (let i = 0; i < 3; i++) {
      const srcId = `alt-route-${i}`;
      if (!map.getSource(srcId)) {
        map.addSource(srcId, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
        map.addLayer({
          id: `alt-route-line-${i}`, type: 'line', source: srcId,
          paint: { 'line-color': colors[i], 'line-width': 3, 'line-opacity': 0.6, 'line-dasharray': [4, 2] },
          layout: { 'line-join': 'round', 'line-cap': 'round' },
        });
      }
      const alt = alternativeRoutes?.[i];
      if (alt?.geometry && alt.geometry.length >= 2) {
        (map.getSource(srcId) as any).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: alt.geometry }, properties: {} });
      } else {
        (map.getSource(srcId) as any).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} });
      }
    }
  }, [alternativeRoutes, showAltRoutes, isNavigating, styleLoadCount]);

  // ─── Route Selection Mode: highlight styling ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    if (!routeSelectionMode) {
      // Restore original styling
      if (map.getLayer('route-line')) {
        map.setPaintProperty('route-line', 'line-color', '#00FF88');
        map.setPaintProperty('route-line', 'line-width', 5);
        map.setPaintProperty('route-line', 'line-opacity', 0.9);
      }
      if (map.getLayer('route-glow')) {
        map.setPaintProperty('route-glow', 'line-color', '#00FF88');
        map.setPaintProperty('route-glow', 'line-opacity', 0.15);
      }
      // Restore alt route colors
      const colors = ['#3B82F6', '#F59E0B', '#10B981'];
      for (let i = 0; i < 3; i++) {
        const layerId = `alt-route-line-${i}`;
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'line-color', colors[i]);
          map.setPaintProperty(layerId, 'line-width', 3);
          map.setPaintProperty(layerId, 'line-opacity', 0.6);
        }
      }
      return;
    }

    // In selection mode: highlight selected in BLUE, fade others in semi-transparent gray
    const HIGHLIGHT_COLOR = '#3B82F6'; // bold blue for selected route
    const HIGHLIGHT_GLOW = '#3B82F6';
    const FADED_COLOR = '#888888'; // semi-transparent gray for unselected
    const FADED_GLOW = '#888888';

    // Main route layer
    if (highlightedRouteIdx === 0) {
      // Main route is highlighted (blue)
      if (map.getLayer('route-line')) {
        map.setPaintProperty('route-line', 'line-color', HIGHLIGHT_COLOR);
        map.setPaintProperty('route-line', 'line-width', 6);
        map.setPaintProperty('route-line', 'line-opacity', 1.0);
      }
      if (map.getLayer('route-glow')) {
        map.setPaintProperty('route-glow', 'line-color', HIGHLIGHT_GLOW);
        map.setPaintProperty('route-glow', 'line-opacity', 0.3);
      }
    } else {
      // Main route is faded (gray, semi-transparent)
      if (map.getLayer('route-line')) {
        map.setPaintProperty('route-line', 'line-color', FADED_COLOR);
        map.setPaintProperty('route-line', 'line-width', 3);
        map.setPaintProperty('route-line', 'line-opacity', 0.35);
      }
      if (map.getLayer('route-glow')) {
        map.setPaintProperty('route-glow', 'line-color', FADED_GLOW);
        map.setPaintProperty('route-glow', 'line-opacity', 0.08);
      }
    }

    // Alt route layers (indices 1-3 in store correspond to alt-route-0/1/2 layers)
    for (let i = 0; i < 3; i++) {
      const layerId = `alt-route-line-${i}`;
      if (!map.getLayer(layerId)) continue;

      const routeStoreIdx = i + 1; // alt-route-0 = route index 1, etc.
      if (routeStoreIdx === highlightedRouteIdx) {
        // This alt route is highlighted (blue, bold)
        map.setPaintProperty(layerId, 'line-color', HIGHLIGHT_COLOR);
        map.setPaintProperty(layerId, 'line-width', 6);
        map.setPaintProperty(layerId, 'line-opacity', 1.0);
        map.setLayoutProperty(layerId, 'line-dasharray', [0, 0]); // solid
      } else {
        // Faded (gray, semi-transparent)
        map.setPaintProperty(layerId, 'line-color', FADED_COLOR);
        map.setPaintProperty(layerId, 'line-width', 3);
        map.setPaintProperty(layerId, 'line-opacity', 0.35);
      }
    }
  }, [routeSelectionMode, highlightedRouteIdx]);

  // ─── Waypoint markers (with visibility toggle) ──────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    wpRef.current.forEach(m => m.remove());
    wpRef.current = [];

    // If waypoints are hidden, don't add them
    if (!showWaypoints) return;

    const colors: Record<string, string> = { start: '#00D4AA', via: '#3B82F6', finish: '#E74C3C' };
    const labels: Record<string, string> = { start: 'A', via: 'VIA', finish: 'B' };

    waypoints.forEach((wp, idx) => {
      const el = document.createElement('div');
      el.style.cssText = `width:32px;height:32px;border-radius:50%;background:${colors[wp.type]};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:grab;z-index:10;`;
      el.textContent = labels[wp.type] || `${idx + 1}`;

      // Defensive: coerce to number (Nominatim may return strings)
      const lng = Number(wp.lon) || 0;
      const lat = Number(wp.lat) || 0;
      const marker = new maplibregl.Marker({
        element: el,
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(map);

      // On drag end, update waypoint position in store
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        useNavigationStore.getState().updateWaypoint(wp.id, {
          lat: lngLat.lat,
          lon: lngLat.lng,
        });
      });

      // Click to remove (except start)
      marker.getElement().addEventListener('click', () => {
        if (wp.type !== 'start') useNavigationStore.getState().removeWaypoint(wp.id);
      });

      wpRef.current.push(marker);
    });
  }, [waypoints, showWaypoints]);

  // ─── POI markers (with visibility toggle) ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    poiRef.current.forEach(m => m.remove());
    poiRef.current = [];

    // If POI markers are hidden, don't add them
    if (!showPOIMarkers) return;

    pois.forEach((poi) => {
      const config = POI_CATEGORY_CONFIG[poi.category];
      const color = config?.color || '#FF6B35';
      const label = config?.label.charAt(0) || 'P';

      const el = document.createElement('div');
      el.style.cssText = `width:26px;height:26px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer;z-index:10;`;
      el.textContent = label;

      const distText = poi.distance != null
        ? poi.distance > 1000 ? `${(poi.distance / 1000).toFixed(1)} km` : `${Math.round(poi.distance)} m`
        : '';

      const detailsHtml = formatPOIDetails(poi);

      const categoryLabel = escHtml(t('poi.' + poi.category) || config?.labelDE || config?.label || poi.category);
      const popupHtml = `<div style="font-family:system-ui,sans-serif;padding:2px 0">
        <div style="font-size:14px;font-weight:600;margin-bottom:2px">${escHtml(poi.name)}</div>
        <div style="display:flex;align-items:center;gap:6px;font-size:12px">
          <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span>
          <span style="color:${color};font-weight:500">${categoryLabel}</span>
        </div>
        ${distText ? `<div style="font-size:11px;color:var(--color-muted-foreground);margin-top:2px">📍 ${escHtml(distText)}</div>` : ''}
        ${detailsHtml}
      </div>`;

      const popup = new maplibregl.Popup({
        offset: [0, -32] as [number, number],
        closeButton: true,
        maxWidth: '300px',
        anchor: 'bottom',
      })
        .setHTML(popupHtml);

      // Defensive: coerce to number
      const poiLng = Number(poi.lon) || 0;
      const poiLat = Number(poi.lat) || 0;
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([poiLng, poiLat])
        .setPopup(popup)
        .addTo(map);

      poiRef.current.push(marker);
    });
  }, [pois, showPOIMarkers]);

  // GPS marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (currentLat === null || currentLon === null) { gpsRef.current?.remove(); gpsRef.current = null; return; }
    if (!gpsRef.current) {
      const el = document.createElement('div');
      el.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#00D4AA;border:3px solid #fff;box-shadow:0 0 0 0 rgba(0,212,170,0.7);animation:gps-pulse 2s infinite;';
      // Defensive: coerce to number
      const gpsLng = Number(currentLon) || 0;
      const gpsLat = Number(currentLat) || 0;
      gpsRef.current = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([gpsLng, gpsLat]).addTo(map);
    } else {
      const gpsLng = Number(currentLon) || 0;
      const gpsLat = Number(currentLat) || 0;
      gpsRef.current.setLngLat([gpsLng, gpsLat]);
      // Auto-center map when navigating or in demo mode (only if Follow-Cam is OFF)
      if ((isNavigating || isDemoMode) && !followCamEnabled) {
        map.easeTo({ center: [gpsLng, gpsLat], duration: 500 });
      }
    }
  }, [currentLat, currentLon, isNavigating, isDemoMode, followCamEnabled]);

  // ─── Driven path (with visibility toggle) ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    // Toggle visibility
    if (map.getLayer('driven-path-line')) {
      map.setLayoutProperty('driven-path-line', 'visibility', showDrivenPath ? 'visible' : 'none');
    }

    if (!map.getSource('driven-path')) {
      map.addSource('driven-path', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
      map.addLayer({
        id: 'driven-path-line', type: 'line', source: 'driven-path',
        paint: { 'line-color': '#FF6B35', 'line-width': 4, 'line-opacity': 0.8 },
        layout: { 'line-join': 'round', 'line-cap': 'round' },
      });
    }
    if (drivenPath.length >= 2) {
      (map.getSource('driven-path') as any).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: drivenPath }, properties: {} });
    }
  }, [drivenPath, showDrivenPath, styleLoadCount]);

  function addRouteLayers(map: maplibregl.Map) {
    if (!map.getSource('route')) {
      map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
      map.addLayer({
        id: 'route-line', type: 'line', source: 'route',
        paint: { 'line-color': '#00FF88', 'line-width': 5, 'line-opacity': 0.9 },
        layout: { 'line-join': 'round', 'line-cap': 'round' },
      });
      map.addLayer({
        id: 'route-glow', type: 'line', source: 'route',
        paint: { 'line-color': '#00FF88', 'line-width': 12, 'line-opacity': 0.15, 'line-blur': 8 },
        layout: { 'line-join': 'round', 'line-cap': 'round' },
      });
    }
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Map is ALWAYS rendered — never unmount it */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {/* Star overlay on top of the map when stars mode is active */}
      {mapStyle === 'stars' && (
        <>
          <SkyChart />
          {/* Dim the underlying dark map */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(2, 4, 12, 0.75)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        </>
      )}
      {/* Custom right-click context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
          }}
          className="rounded-lg border border-sidebar-border bg-sidebar shadow-lg py-1 min-w-[140px] overflow-hidden"
        >
          <button
            onClick={() => handleSetWaypoint('start')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-foreground/10 transition-colors flex items-center gap-2 cursor-pointer text-sidebar-foreground"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D4AA] shrink-0" />
            {t('map.setStart')}
          </button>
          <button
            onClick={() => handleSetWaypoint('via')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-foreground/10 transition-colors flex items-center gap-2 cursor-pointer text-sidebar-foreground"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
            {t('map.setVia')}
          </button>
          <button
            onClick={() => handleSetWaypoint('finish')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-foreground/10 transition-colors flex items-center gap-2 cursor-pointer text-sidebar-foreground"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#E74C3C] shrink-0" />
            {t('map.setDest')}
          </button>
        </div>
      )}
    </div>
  );
}
