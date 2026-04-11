
import { useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Gauge,
  Navigation,
  Mountain,
  Thermometer,
  Wind,
  Trophy,
  MessageCircle,
  Clock,
  TrendingDown,
  MapPin,
} from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useTwitchStore } from '@/store/useTwitchStore';
import { useWeatherStore } from '@/store/useWeatherStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { t } from '@/lib/i18n';
import NavArrow from '@/components/map/NavArrow';
import { DraggableWrapper } from '@/hooks/useDraggable';

/** Format seconds to HH:MM or MM:SS string */
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}h`;
  return `${m} min`;
}

/** Generate a GeoJSON circle polygon (64 segments) around a center point */
function generateCircleGeoJSON(lat: number, lon: number, radiusMeters: number) {
  const coordinates: [number, number][] = [];
  const numPoints = 64;
  const R = 6371000;
  const d = radiusMeters / R;
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    const newLat = Math.asin(
      Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(angle)
    );
    const newLon =
      lonRad +
      Math.atan2(
        Math.sin(angle) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(newLat)
      );
    coordinates.push([(newLon * 180) / Math.PI, (newLat * 180) / Math.PI]);
  }
  return {
    type: 'Feature' as const,
    properties: { radius: radiusMeters },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coordinates],
    },
  };
}

/** Mini map component for OBS overlay — shows route + 300m GPS radius */
function OverlayMiniMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const routeSourceRef = useRef<string | null>(null);
  const circleSourceRef = useRef<string | null>(null);

  const currentLat = useNavigationStore((s) => s.currentLat);
  const currentLon = useNavigationStore((s) => s.currentLon);
  const currentHeading = useNavigationStore((s) => s.currentHeading);
  const _remoteRouteGeometry = useNavigationStore((s) => s._remoteRouteGeometry);
  const route = useNavigationStore((s) => s.route);
  const overlayMapSize = useSettingsStore((s) => s.overlayMapSize);

  // Use remote geometry (from sync) or local route geometry
  const routeGeometry = _remoteRouteGeometry || route?.geometry || null;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: 'overlay-dark',
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '',
          },
        },
        layers: [
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [currentLon ?? 13.38, currentLat ?? 52.52],
      zoom: 14,
      attributionControl: false,
      interactive: false,
      pitchWithRotate: false,
      dragRotate: false,
      scrollZoom: false,
      dragPan: false,
      touchZoomRotate: false,
      boxZoom: false,
      doubleClickZoom: false,
      keyboard: false,
    });

    map.on('load', () => {
      // Add route source + layer
      map.addSource('overlay-route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });
      map.addLayer({
        id: 'overlay-route-line',
        type: 'line',
        source: 'overlay-route',
        paint: {
          'line-color': '#9146FF',
          'line-width': 4,
          'line-opacity': 0.9,
          'line-dasharray': [2, 1],
        },
      });

      // Add GPS circle source + layer
      map.addSource('overlay-circle', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[]] } },
      });
      map.addLayer({
        id: 'overlay-circle-fill',
        type: 'fill',
        source: 'overlay-circle',
        paint: {
          'fill-color': '#9146FF',
          'fill-opacity': 0.08,
        },
      });
      map.addLayer({
        id: 'overlay-circle-line',
        type: 'line',
        source: 'overlay-circle',
        paint: {
          'line-color': '#9146FF',
          'line-width': 2,
          'line-opacity': 0.4,
          'line-dasharray': [3, 2],
        },
      });

      // Add GPS dot source + layer
      map.addSource('overlay-position', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
      });
      map.addLayer({
        id: 'overlay-position-dot',
        type: 'circle',
        source: 'overlay-position',
        paint: {
          'circle-radius': 8,
          'circle-color': '#00D4AA',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });
      map.addLayer({
        id: 'overlay-position-glow',
        type: 'circle',
        source: 'overlay-position',
        paint: {
          'circle-radius': 16,
          'circle-color': '#00D4AA',
          'circle-opacity': 0.2,
          'circle-blur': 1,
        },
      });

      routeSourceRef.current = 'overlay-route';
      circleSourceRef.current = 'overlay-circle';
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('overlay-route')) return;
    (map.getSource('overlay-route') as maplibregl.GeoJSONSource).setData({
      type: 'Feature',
      properties: {},
      geometry: routeGeometry
        ? { type: 'LineString', coordinates: routeGeometry }
        : { type: 'LineString', coordinates: [] },
    });
  }, [routeGeometry]);

  // Update GPS position + circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !currentLat || !currentLon) return;

    if (!map.getSource('overlay-position') || !map.getSource('overlay-circle')) return;

    // Update GPS dot
    (map.getSource('overlay-position') as maplibregl.GeoJSONSource).setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [currentLon, currentLat] },
    });

    // Update 300m circle
    const circle = generateCircleGeoJSON(currentLat, currentLon, 300);
    (map.getSource('overlay-circle') as maplibregl.GeoJSONSource).setData(circle);

    // Smooth pan to position
    const shouldFly = !map.getBounds().contains([Number(currentLon) || 0, Number(currentLat) || 0]);
    if (shouldFly) {
      map.easeTo({
        center: [Number(currentLon) || 0, Number(currentLat) || 0],
        zoom: Math.max(map.getZoom(), 14),
        duration: 1000,
        easing: (t) => t * (2 - t), // ease-out
      });
    }

    // Update bearing to heading
    if (currentHeading !== null && currentHeading !== undefined) {
      map.easeTo({ bearing: currentHeading, duration: 1500 });
    }
  }, [currentLat, currentLon, currentHeading]);

  const scaledSize = overlayMapSize / 100;

  return (
    <div
      className="absolute bottom-20 left-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl"
      style={{
        width: `${280 * scaledSize}px`,
        height: `${200 * scaledSize}px`,
        transformOrigin: 'bottom left',
      }}
    >
      <div ref={mapContainer} className="w-full h-full" />
      {/* Overlay badge */}
      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-0.5 flex items-center gap-1 pointer-events-none">
        <MapPin className="w-3 h-3 text-purple-400" />
        <span className="text-[10px] text-white/70 font-medium">300m</span>
      </div>
    </div>
  );
}

export default function OBSOverlayPage() {
  const {
    currentSpeed,
    drivenPath,
    ascent,
    descent,
    eta,
    remainingDistance,
    waypoints,
    route,
    isNavigating,
    // Remote fields (from sync — used in overlay mode)
    _routeExists,
    _remoteStartName,
    _remoteFinishName,
    _remoteRouteDistance,
    _remoteRouteAscent,
    _remoteRouteDescent,
    _remoteRouteDuration,
    _routeProgress,
  } = useNavigationStore();

  const messages = useTwitchStore((s) => s.messages);
  const activeVote = useTwitchStore((s) => s.activeVote);
  const connected = useTwitchStore((s) => s.connected);
  const channel = useTwitchStore((s) => s.channel);

  const temperature = useWeatherStore((s) => s.temperature);
  const windSpeed = useWeatherStore((s) => s.windSpeed);

  // Settings toggles
  const showDriveInfo = useSettingsStore((s) => s.showDriveInfo);
  const showWeather = useSettingsStore((s) => s.showWeather);
  const showChat = useSettingsStore((s) => s.showChat);
  const showVoting = useSettingsStore((s) => s.showVoting);
  const showOverlayMap = useSettingsStore((s) => s.showOverlayMap);

  // Settings sizes
  const overlaySpeedSize = useSettingsStore((s) => s.overlaySpeedSize);
  const overlayRouteInfoSize = useSettingsStore((s) => s.overlayRouteInfoSize);
  const overlayWeatherSize = useSettingsStore((s) => s.overlayWeatherSize);
  const overlayChatSize = useSettingsStore((s) => s.overlayChatSize);
  const overlayVotingSize = useSettingsStore((s) => s.overlayVotingSize);
  const overlayProgressBarSize = useSettingsStore((s) => s.overlayProgressBarSize);
  const showNavArrow = useSettingsStore((s) => s.showNavArrow);

  // Route progress calculation (prefer synced progress from main app)
  const routeProgress = useMemo(() => {
    // Use synced progress if available (overlay mode)
    if (_routeProgress > 0) return _routeProgress;
    // Fallback: local calculation
    if (!route?.geometry || route.geometry.length < 2 || drivenPath.length < 2) return 0;

    let totalDist = 0;
    for (let i = 1; i < route.geometry.length; i++) {
      const [lon1, lat1] = route.geometry[i - 1];
      const [lon2, lat2] = route.geometry[i];
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      totalDist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    if (totalDist === 0) return 0;

    let drivenDist = 0;
    for (let i = 1; i < drivenPath.length; i++) {
      const [lon1, lat1] = drivenPath[i - 1];
      const [lon2, lat2] = drivenPath[i];
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      drivenDist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    return Math.min(drivenDist / totalDist, 1);
  }, [route, drivenPath, _routeProgress]);


  const lastMessages = messages.slice(-5);

  // Use remote waypoint names (from sync) — fallback to local waypoints
  const startWp = waypoints.find(w => w.type === 'start');
  const finishWp = waypoints.find(w => w.type === 'finish');
  const startName = _remoteStartName || startWp?.name || 'Start';
  const finishName = _remoteFinishName || finishWp?.name || t('nav.destination');

  // Route info: prefer navigation data when navigating, otherwise use route info from sync
  const hasRoute = _routeExists || !!route;
  const displayDistance = (isNavigating && remainingDistance > 0)
    ? remainingDistance
    : _remoteRouteDistance;
  const displayAscent = (isNavigating && ascent > 0)
    ? ascent
    : _remoteRouteAscent;
  const displayDescent = (isNavigating && descent > 0)
    ? descent
    : _remoteRouteDescent;
  const displayEta = isNavigating ? eta : formatDuration(_remoteRouteDuration);

  const speedColor = currentSpeed === 0
    ? 'text-white/60'
    : currentSpeed < 25
      ? 'text-green-400'
      : currentSpeed < 50
        ? 'text-yellow-400'
        : 'text-red-400';

  const remainingKm = displayDistance > 0 ? (displayDistance / 1000).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 bg-transparent pointer-events-none z-[9999] select-none">
      {/* Route Progress Bar - always visible when route exists */}
      {hasRoute && (
        <div
          className="absolute top-0 left-0 right-0"
          style={{ transform: `scale(${overlayProgressBarSize / 100})`, transformOrigin: 'top center' }}
        >
          <div className="mx-4 mt-3">
            <div className="bg-black/70 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                <span className="truncate max-w-[200px] font-medium">{startName}</span>
                <span className="font-bold text-white">{remainingKm} km</span>
                <span className="truncate max-w-[200px] text-right font-medium">{finishName}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${routeProgress * 100}%`,
                    background: 'linear-gradient(90deg, #00D4AA, #9146FF)',
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-purple-500 shadow-lg transition-all duration-500"
                  style={{ left: `calc(${routeProgress * 100}% - 6px)` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top-left: Stats */}
      <div className="absolute top-16 left-4 space-y-2">
        {/* Speed */}
        {showDriveInfo && (
          <div
            style={{ transform: `scale(${overlaySpeedSize / 100})`, transformOrigin: 'top left' }}
          >
            <div className="bg-black/70 backdrop-blur-md rounded-lg px-4 py-2 flex items-end gap-2 border border-white/10">
              <Gauge className="w-5 h-5 text-accent mb-0.5" />
              <span className={`text-5xl font-black tabular-nums leading-none ${speedColor}`}>
                {currentSpeed}
              </span>
              <span className="text-sm text-white/70 mb-0.5">{t('general.kmh')}</span>
            </div>
          </div>
        )}

        {/* Route info — only shown when a route exists and showDriveInfo is enabled */}
        {showDriveInfo && hasRoute && (
          <div
            style={{ transform: `scale(${overlayRouteInfoSize / 100})`, transformOrigin: 'top left' }}
          >
            <div className="bg-black/70 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-center">
                <div>
                  <div className="text-xs text-white/70 uppercase flex items-center justify-center gap-1 font-medium">
                    <Navigation className="w-3 h-3" />
                    {t('nav.remaining')}
                  </div>
                  <div className="text-lg font-bold text-white tabular-nums">{remainingKm} km</div>
                </div>
                <div>
                  <div className="text-xs text-white/70 uppercase flex items-center justify-center gap-1 font-medium">
                    <Clock className="w-3 h-3" />
                    ETA
                  </div>
                  <div className="text-lg font-bold text-white tabular-nums">{displayEta}</div>
                </div>
                <div>
                  <div className="text-xs text-white/70 uppercase flex items-center justify-center gap-1 font-medium">
                    <Mountain className="w-3 h-3" />
                    {t('nav.ascent')}
                  </div>
                  <div className="text-lg font-bold text-green-400 tabular-nums">{displayAscent}m</div>
                </div>
                <div>
                  <div className="text-xs text-white/70 uppercase flex items-center justify-center gap-1 font-medium">
                    <TrendingDown className="w-3 h-3" />
                    {t('nav.descent')}
                  </div>
                  <div className="text-lg font-bold text-orange-400 tabular-nums">{displayDescent}m</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weather */}
        {showWeather && (
          <div
            style={{ transform: `scale(${overlayWeatherSize / 100})`, transformOrigin: 'top left' }}
          >
            <div className="bg-black/70 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10 flex items-center gap-3">
              <Thermometer className="w-4 h-4 text-yellow-300" />
              <span className="text-sm text-white/70">{t('safety.weather')}</span>
              <span className="text-sm text-white font-semibold">
                {temperature !== null ? `${temperature}°C` : '--°C'}
              </span>
              <Wind className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white font-semibold">
                {windSpeed !== null ? `${windSpeed} km/h` : '-- km/h'}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Top-center: NavArrow (draggable) */}
      {showNavArrow && (
      <div className="pointer-events-auto">
        <DraggableWrapper id="overlay-nav-arrow" defaultPosition={{ top: 60, left: 300 }} zIndex={10001}>
          <NavArrow />
        </DraggableWrapper>
      </div>
      )}

      {/* Top-right: Channel info */}
      <div className="absolute top-16 right-4">
        <div className="bg-black/70 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">{channel || 'Twitch CoPilot'}</span>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {connected && (
            <span className="text-xs text-green-400 font-bold ml-1">LIVE</span>
          )}
        </div>
      </div>

      {/* Mini Map - bottom left */}
      {showOverlayMap && <OverlayMiniMap />}

      {/* Bottom-left: Voting results */}
      {showVoting && activeVote && !activeVote.isActive && activeVote.winner && (
        <div
          className="absolute bottom-20 left-4"
          style={{ transform: `scale(${overlayVotingSize / 100})`, transformOrigin: 'bottom left' }}
        >
          <div className="bg-black/70 backdrop-blur-md rounded-lg px-4 py-3 border border-yellow-500/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white/70">{t('vote.winner')}</span>
            </div>
            <span className="text-xl font-bold text-yellow-400">{activeVote.winner}</span>
          </div>
        </div>
      )}

      {/* Active vote - bottom center */}
      {showVoting && activeVote?.isActive && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2"
          style={{ transform: `scale(${overlayVotingSize / 100})`, transformOrigin: 'bottom center' }}
        >
          <div className="bg-black/70 backdrop-blur-md rounded-lg px-6 py-3 border border-purple-500/30 min-w-[300px]">
            <div className="text-sm text-white/70 mb-1 font-medium">{t('vote.title')}</div>
            <div className="text-base font-semibold text-white mb-2">{activeVote.question}</div>
            <div className="flex gap-3">
              {activeVote.options.map((opt, idx) => {
                const count = activeVote.votes[String(idx)] || 0;
                return (
                  <div key={idx} className="flex-1 bg-white/5 rounded-md px-3 py-1.5 text-center">
                    <div className="text-sm text-white">{opt}</div>
                    <div className="text-xl font-bold text-accent tabular-nums">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom-right: Chat feed (last 5) */}
      {showChat && (
        <div
          className="absolute bottom-4 right-4"
          style={{ transform: `scale(${overlayChatSize / 100})`, transformOrigin: 'bottom right' }}
        >
          <div className="bg-black/70 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden max-w-[320px]">
            {lastMessages.length === 0 && (
              <div className="px-4 py-3 text-sm text-white/40 text-center">
                {connected ? t('chat.waiting') : t('chat.notConnected')}
              </div>
            )}
            {lastMessages.map((msg) => (
              <div
                key={msg.id}
                className="px-4 py-1.5 flex items-center gap-2 border-t border-white/5 last:border-0"
              >
                <span
                  className="text-sm font-bold whitespace-nowrap"
                  style={{ color: msg.color || '#fff' }}
                >
                  {msg.username === 'system' ? msg.displayName : msg.username}:
                </span>
                <span className="text-sm text-white/90 truncate">{msg.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branding */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-1.5 opacity-30">
          <Navigation className="w-3 h-3 text-accent" />
          <span className="text-xs text-white/50 font-medium">Twitch CoPilot</span>
        </div>
      </div>
    </div>
  );
}
