/**
 * useFollowCam — Dynamische Navigations-Kamera (Follow-Cam / Chase Cam)
 *
 * Features:
 * - Heading-Up Modus: Karte dreht sich so, dass Fahrtrichtung immer nach oben zeigt
 * - 3D Perspektive mit konfigurierbarem Neigungswinkel (Pitch)
 * - Geschwindigkeitsabhängiger Auto-Zoom (schnell = raus, langsam = rein)
 * - Smooth Interpolation (Lerp) für Bearing-Rotation — verhindert Schwindel
 * - GPS AN → Kamera folgt aktueller GPS-Position
 * - GPS AUS → Kamera fokussiert Routen-Startpunkt
 * - Street-View Zoom-Level beim Aktivieren
 */

import { useEffect, useRef } from 'react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { mapInstanceRef } from '@/components/map/MapContainer';

// ─── Haversine distance in meters ─────────────────────────────────────────
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

// ─── Calculate bearing from point1 to point2 (degrees, 0-360) ──────────
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// ─── Find closest point index on route geometry ─────────────────────────
function findClosestIdx(
  geometry: [number, number][],
  lat: number,
  lon: number
): number {
  let minDist = Infinity;
  let closestIdx = 0;
  for (let i = 0; i < geometry.length; i++) {
    const [glon, glat] = geometry[i];
    const d = haversineDistance(lat, lon, glat, glon);
    if (d < minDist) {
      minDist = d;
      closestIdx = i;
    }
  }
  return closestIdx;
}

// ─── Calculate bearing from route geometry at current position ──────────
function getBearingFromRoute(
  geometry: [number, number][],
  lat: number,
  lon: number
): number | null {
  if (!geometry || geometry.length < 2) return null;

  const idx = findClosestIdx(geometry, lat, lon);
  // Look ahead several points for a stable bearing
  const lookahead = Math.min(idx + 8, geometry.length - 1);
  if (lookahead <= idx) return null;

  const [lon1, lat1] = geometry[idx];
  const [lon2, lat2] = geometry[lookahead];
  return calculateBearing(lat1, lon1, lat2, lon2);
}

// ─── Lerp bearing with 360° wrap-around handling ────────────────────────
function lerpBearing(current: number, target: number, factor: number): number {
  let diff = target - current;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return ((current + diff * factor) % 360 + 360) % 360;
}

export function useFollowCam() {
  // Smoothed bearing ref — persists across renders for continuous interpolation
  const smoothedBearingRef = useRef<number | null>(null);
  // Track whether Follow-Cam was previously active (for cleanup)
  const wasActiveRef = useRef(false);
  // Throttle ref to prevent excessive easeTo calls
  const lastUpdateRef = useRef(0);
  // Refs to latest values for use in the animation loop
  const rafRef = useRef<number>(0);
  const isActiveRef = useRef(false);
  const targetStateRef = useRef({
    lat: 0,
    lon: 0,
    bearing: null as number | null,
    speed: 0,
    pitch: 50,
    zoom: 16,
    hasTarget: false,
  });

  useEffect(() => {
    // Subscribe to stores for latest values
    const unsubNav = useNavigationStore.subscribe(() => {
      const nav = useNavigationStore.getState();
      const settings = useSettingsStore.getState();

      isActiveRef.current = settings.followCamEnabled && (nav.isNavigating || nav.isDemoMode);

      if (!isActiveRef.current) return;

      // Determine target position
      let lat: number;
      let lon: number;

      if (nav.currentLat !== null && nav.currentLon !== null) {
        // GPS active → track current position
        lat = nav.currentLat;
        lon = nav.currentLon;
      } else if (nav.route?.geometry && nav.route.geometry.length > 0) {
        // GPS inactive → track route start point
        const [startLon, startLat] = nav.route.geometry[0];
        lat = startLat;
        lon = startLon;
      } else {
        targetStateRef.current.hasTarget = false;
        return;
      }

      // Determine bearing: GPS heading first, then route geometry fallback
      let bearing: number | null = nav.currentHeading;
      if (bearing === null && nav.route?.geometry) {
        bearing = getBearingFromRoute(nav.route.geometry, lat, lon);
      }

      targetStateRef.current = {
        lat,
        lon,
        bearing,
        speed: nav.currentSpeed,
        pitch: settings.followCamPitch,
        zoom: settings.followCamZoom,
        hasTarget: true,
      };
    });

    // Animation loop for smooth camera updates
    const animate = () => {
      const map = mapInstanceRef.current;
      if (!map || !isActiveRef.current || !targetStateRef.current.hasTarget) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const now = Date.now();
      // Throttle to ~20fps for smooth but performant updates
      if (now - lastUpdateRef.current < 50) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      lastUpdateRef.current = now;

      const { lat, lon, bearing, speed, pitch, zoom } = targetStateRef.current;

      // Smooth bearing interpolation (Lerp)
      if (bearing !== null) {
        if (smoothedBearingRef.current === null) {
          smoothedBearingRef.current = bearing;
        } else {
          // Lower factor = smoother rotation (less sensitive = no dizziness)
          // 0.08 → very smooth, ~12 frames to converge halfway
          smoothedBearingRef.current = lerpBearing(smoothedBearingRef.current, bearing, 0.08);
        }
      }

      // Speed-based auto-zoom
      let targetZoom = zoom;
      if (speed > 50) targetZoom = Math.max(zoom - 2, 13);
      else if (speed > 30) targetZoom = Math.max(zoom - 1, 14);
      else if (speed > 20) targetZoom = zoom;
      else if (speed < 5 && speed > 0) targetZoom = Math.min(zoom + 1, 18);
      else if (speed === 0) targetZoom = zoom;

      // Apply camera via easeTo for smooth MapLibre animation
      const cameraOpts: { center: [number, number]; zoom: number; pitch: number; bearing?: number; duration: number } = {
        center: [lon, lat],
        zoom: targetZoom,
        pitch,
        duration: 200, // Short duration — the rAF loop provides the smoothing
      };

      if (smoothedBearingRef.current !== null) {
        cameraOpts.bearing = smoothedBearingRef.current;
      }

      map.easeTo(cameraOpts);

      rafRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    rafRef.current = requestAnimationFrame(animate);

    // Cleanup: stop animation loop, reset camera
    return () => {
      cancelAnimationFrame(rafRef.current);
      unsubNav();
      if (wasActiveRef.current) {
        // Reset pitch and bearing when Follow-Cam is deactivated
        mapInstanceRef.current?.easeTo({ pitch: 0, bearing: 0, duration: 500 });
        smoothedBearingRef.current = null;
      }
    };
  }, []);

  // Track activation state for cleanup
  useEffect(() => {
    const settings = useSettingsStore.getState();
    const nav = useNavigationStore.getState();
    wasActiveRef.current = settings.followCamEnabled && (nav.isNavigating || nav.isDemoMode);
  });
}
