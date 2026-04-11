import { create } from 'zustand';
import type { Waypoint, RouteInfo } from '@/types';

// Route result with category for overlay display
export interface RouteResult {
  routeIndex: number;
  distance: number;
  duration: number;
  ascent: number;
  descent: number;
  geometry: [number, number][];
  profile: string;
  category: 'shortest' | 'fastest' | 'safest';
}

// Defensive: ensure lat/lon are always numbers (Nominatim returns strings)
function coerceWaypointNums(wp: Waypoint): Waypoint {
  return {
    ...wp,
    lat: Number(wp.lat) || 0,
    lon: Number(wp.lon) || 0,
  };
}

interface NavigationState {
  waypoints: Waypoint[];
  route: RouteInfo | null;
  alternativeRoutes: RouteInfo[];
  selectedVehicle: { name: string; color: string };
  isNavigating: boolean;
  isDemoMode: boolean;
  isRerouting: boolean;
  gpsStatus: 'idle' | 'requesting' | 'active';
  currentSpeed: number;
  currentLat: number | null;
  currentLon: number | null;
  currentHeading: number | null;
  remainingDistance: number;
  eta: string;
  ascent: number;
  descent: number;
  avgSpeed: number;
  drivenPath: [number, number][];

  // Actions
  setWaypoints: (wps: Waypoint[]) => void;
  addWaypoint: (wp: Waypoint) => void;
  removeWaypoint: (id: string) => void;
  updateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
  clearWaypoints: () => void;
  setRoute: (route: RouteInfo | null) => void;
  setAlternativeRoutes: (routes: RouteInfo[]) => void;

  setIsNavigating: (v: boolean) => void;
  setIsDemoMode: (v: boolean) => void;
  setIsRerouting: (v: boolean) => void;
  setGpsStatus: (s: 'idle' | 'requesting' | 'active') => void;
  setCurrentSpeed: (v: number) => void;
  setCurrentPosition: (lat: number, lon: number, heading?: number) => void;
  setRemainingDistance: (d: number) => void;
  setEta: (e: string) => void;
  setAscent: (a: number) => void;
  setDescent: (d: number) => void;
  setAvgSpeed: (s: number) => void;
  addDrivenPoint: (p: [number, number]) => void;
  resetNavigation: () => void;
  // Remote sync actions (for OBS overlay receiving data)
  setRemoteVehicle: (name: string, color: string) => void;
  setKmToday: (km: number) => void;
  setRouteProgress: (p: number) => void;
  setRouteExists: (v: boolean) => void;
  setRemoteWaypoints: (start: string, finish: string) => void;
  _kmToday: number;
  _routeProgress: number;
  _routeExists: boolean;
  _remoteStartName: string;
  _remoteFinishName: string;
  _remoteRouteGeometry: [number, number][] | null;
  setRemoteRouteGeometry: (geom: [number, number][] | null) => void;
  // Remote route info (for OBS overlay when not navigating)
  _remoteRouteDistance: number;
  _remoteRouteAscent: number;
  _remoteRouteDescent: number;
  _remoteRouteDuration: number;
  setRemoteRouteInfo: (distance: number, ascent: number, descent: number, duration: number) => void;
  // Route selection mode
  routeSelectionMode: boolean;
  setRouteSelectionMode: (v: boolean) => void;
  highlightedRouteIdx: number;
  setHighlightedRouteIdx: (idx: number) => void;
  allRouteResults: RouteResult[];
  setAllRouteResults: (routes: RouteResult[]) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  waypoints: [],
  route: null,
  alternativeRoutes: [],
  selectedVehicle: { name: 'FRANKY', color: '#00D4AA' },
  isNavigating: false,
  isDemoMode: false,
  isRerouting: false,
  gpsStatus: 'idle',
  currentSpeed: 0,
  currentLat: null,
  currentLon: null,
  currentHeading: null,
  remainingDistance: 0,
  eta: '--:--',
  ascent: 0,
  descent: 0,
  avgSpeed: 0,
  drivenPath: [],

  setWaypoints: (waypoints) => set({ waypoints: waypoints.map(coerceWaypointNums) }),
  addWaypoint: (wp) => set((s) => ({ waypoints: [...s.waypoints, coerceWaypointNums(wp)] })),
  removeWaypoint: (id) => set((s) => ({ waypoints: s.waypoints.filter(w => w.id !== id) })),
  updateWaypoint: (id, updates) => set((s) => ({
    waypoints: s.waypoints.map(w => w.id === id ? coerceWaypointNums({ ...w, ...updates }) : w),
  })),
  clearWaypoints: () => set({ waypoints: [], route: null, alternativeRoutes: [] }),
  setRoute: (route) => set({ route }),
  setAlternativeRoutes: (routes) => set({ alternativeRoutes: routes }),

  setIsNavigating: (v) => set({ isNavigating: v }),
  setIsDemoMode: (v) => set({ isDemoMode: v }),
  setIsRerouting: (v) => set({ isRerouting: v }),
  setGpsStatus: (s) => set({ gpsStatus: s }),
  setCurrentSpeed: (v) => set({ currentSpeed: v }),
  setCurrentPosition: (lat, lon, heading) => set({ currentLat: Number(lat) || 0, currentLon: Number(lon) || 0, currentHeading: heading ?? null }),
  setRemainingDistance: (d) => set({ remainingDistance: d }),
  setEta: (e) => set({ eta: e }),
  setAscent: (a) => set({ ascent: a }),
  setDescent: (d) => set({ descent: d }),
  setAvgSpeed: (s) => set({ avgSpeed: s }),
  addDrivenPoint: (p) => set((s) => ({ drivenPath: s.drivenPath.length >= 5000 ? [...s.drivenPath.slice(-4000), p] : [...s.drivenPath, p] })),
  resetNavigation: () => set({
    isNavigating: false, isDemoMode: false, isRerouting: false,
    currentSpeed: 0, avgSpeed: 0, drivenPath: [],
    remainingDistance: 0, eta: '--:--', ascent: 0, descent: 0,
  }),
  // Remote sync actions
  _kmToday: 0,
  _routeProgress: 0,
  _routeExists: false,
  _remoteStartName: 'Start',
  _remoteFinishName: 'Ziel',
  _remoteRouteGeometry: null,
  _remoteRouteDistance: 0,
  _remoteRouteAscent: 0,
  _remoteRouteDescent: 0,
  _remoteRouteDuration: 0,
  setRemoteVehicle: (name, color) => set({ selectedVehicle: { name, color } }),
  setKmToday: (km) => set({ _kmToday: km }),
  setRouteProgress: (p) => set({ _routeProgress: p }),
  setRouteExists: (v) => set({ _routeExists: v }),
  setRemoteWaypoints: (start, finish) => set({ _remoteStartName: start, _remoteFinishName: finish }),
  setRemoteRouteGeometry: (geom) => set({ _remoteRouteGeometry: geom }),
  setRemoteRouteInfo: (distance, ascent, descent, duration) => set({
    _remoteRouteDistance: distance,
    _remoteRouteAscent: ascent,
    _remoteRouteDescent: descent,
    _remoteRouteDuration: duration,
  }),
  // Route selection mode
  routeSelectionMode: false,
  setRouteSelectionMode: (v) => set({ routeSelectionMode: v }),
  highlightedRouteIdx: -1,
  setHighlightedRouteIdx: (idx) => set({ highlightedRouteIdx: idx }),
  allRouteResults: [],
  setAllRouteResults: (routes) => set({ allRouteResults: routes }),
}));
