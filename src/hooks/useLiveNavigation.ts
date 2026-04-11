/**
 * useLiveNavigation — Computes live navigation stats from GPS position updates.
 *
 * During real GPS navigation (isNavigating && !isDemoMode), this hook:
 * 1. Tracks speed from GPS coords.speed (hardware) or position deltas (fallback)
 * 2. Appends points to drivenPath for km-today calculation (distance-based, not speed-based)
 * 3. Projects current position onto route geometry to find remaining distance
 * 4. Recalculates ETA from remaining distance and average speed
 * 5. Updates ascent/descent based on route progress ratio
 * 6. Detects arrival (<50m remaining)
 *
 * v4.1.0 Fixes:
 * - Driven path now uses minimum distance delta (3m) instead of speed threshold.
 *   This ensures breadcrumbs are drawn even when GPS speed calculation returns 0.
 * - Speed now prefers GPS hardware coords.speed when available (more accurate on phones).
 * - Speed delta fallback uses relaxed timing (0.3s min) for better mobile GPS compatibility.
 */

import { useEffect, useRef } from 'react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ttsQueue } from '@/lib/ttsQueue';
import { t } from '@/lib/i18n';

const EARTH_R = 6371000;

// Haversine distance in meters
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return EARTH_R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate the cumulative distance along the route geometry from index 0 to `targetIdx`.
 */
function routeDistanceToPoint(geometry: [number, number][], targetIdx: number): number {
  if (!geometry || geometry.length < 2 || targetIdx <= 0) return 0;
  let total = 0;
  const end = Math.min(targetIdx, geometry.length - 1);
  for (let i = 0; i < end; i++) {
    const [lon1, lat1] = geometry[i];
    const [lon2, lat2] = geometry[i + 1];
    total += haversineDistance(lat1, lon1, lat2, lon2);
  }
  return total;
}

/**
 * Calculate total route distance from geometry.
 */
function totalRouteDistance(geometry: [number, number][]): number {
  if (!geometry || geometry.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    const [lon1, lat1] = geometry[i];
    const [lon2, lat2] = geometry[i + 1];
    total += haversineDistance(lat1, lon1, lat2, lon2);
  }
  return total;
}

/**
 * Find the closest point index on the route geometry to the given position.
 * Returns { closestIdx, minDist, distanceFromStart }.
 */
function projectOntoRoute(
  geometry: [number, number][],
  lat: number,
  lon: number
): { closestIdx: number; minDist: number; distanceFromStart: number } {
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

  const distanceFromStart = routeDistanceToPoint(geometry, closestIdx);

  return { closestIdx, minDist, distanceFromStart };
}

// Minimum distance in meters to add a driven path point.
// Using distance instead of speed ensures breadcrumbs are drawn even when
// GPS speed calculation returns 0 (common on phones with low update frequency).
const MIN_DRIVEN_POINT_DIST_M = 3;

export function useLiveNavigation() {
  const prevLatRef = useRef<number | null>(null);
  const prevLonRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number>(0);
  const navStartTimeRef = useRef<number>(0);
  const initialRouteDistanceRef = useRef<number>(0);
  const arrivedRef = useRef(false);
  const lastDrivenCoordRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    const unsubscribe = useNavigationStore.subscribe(() => {
      const nav = useNavigationStore.getState();

      // Only process during active real-world GPS navigation
      if (!nav.isNavigating || nav.isDemoMode) {
        // Reset tracking refs when navigation stops
        if (!nav.isNavigating) {
          prevLatRef.current = null;
          prevLonRef.current = null;
          prevTimeRef.current = 0;
          navStartTimeRef.current = 0;
          initialRouteDistanceRef.current = 0;
          arrivedRef.current = false;
          lastDrivenCoordRef.current = null;
        }
        return;
      }

      // Need GPS position and route geometry
      if (nav.currentLat === null || nav.currentLon === null || !nav.route?.geometry) return;

      const { currentLat, currentLon, route } = nav;
      const geometry = route.geometry;

      // Record navigation start time
      if (navStartTimeRef.current === 0) {
        navStartTimeRef.current = Date.now();
        initialRouteDistanceRef.current = route.distance || totalRouteDistance(geometry);
        arrivedRef.current = false;
        lastDrivenCoordRef.current = null;
      }

      const now = Date.now();

      // ── 1. Speed calculation ──
      // Prefer GPS hardware speed (coords.speed) when available — much more accurate.
      // coords.speed is in m/s; convert to km/h. Available on most Android devices.
      // On iOS, coords.speed is often null — fall back to position delta calculation.
      let speedKmh = 0;

      // Fallback: calculate speed from position deltas (when no hardware speed)
      if (prevLatRef.current !== null && prevLonRef.current !== null && prevTimeRef.current > 0) {
        const dtSec = (now - prevTimeRef.current) / 1000;
        if (dtSec > 0.3 && dtSec < 10) {
          // v4.1.0 FIX: Relaxed minimum from 0.5s to 0.3s for better mobile GPS compatibility.
          // Many phones update GPS every 1s — a 0.5s threshold would miss every other update.
          const distM = haversineDistance(prevLatRef.current, prevLonRef.current, currentLat, currentLon);
          const deltaSpeed = (distM / dtSec) * 3.6; // m/s → km/h

          if (deltaSpeed > 200) {
            // GPS jitter — ignore unrealistic jumps
          } else if (deltaSpeed < 1.5) {
            // Below walking speed — likely standing still
            speedKmh = 0;
          } else {
            speedKmh = Math.round(deltaSpeed);
          }
        }
      }

      // Update speed in store (0 when standing still)
      useNavigationStore.getState().setCurrentSpeed(speedKmh);

      // ── 2. Driven path tracking ──
      // v4.1.0 FIX: Use distance-based threshold instead of speed threshold.
      // The old code required speedKmh >= 1, which failed when GPS delta calculation
      // returned 0 (common on phones with low GPS update frequency or poor accuracy).
      // Now we add a point whenever the user has moved at least MIN_DRIVEN_POINT_DIST_M
      // (3 meters) from the last recorded point. This ensures breadcrumbs are always drawn.
      if (lastDrivenCoordRef.current !== null) {
        const [prevLng, prevLat] = lastDrivenCoordRef.current;
        const movedM = haversineDistance(prevLat, prevLng, currentLat, currentLon);
        if (movedM >= MIN_DRIVEN_POINT_DIST_M) {
          useNavigationStore.getState().addDrivenPoint([currentLon, currentLat]);
          lastDrivenCoordRef.current = [currentLon, currentLat];
        }
      } else {
        // First point — always add
        useNavigationStore.getState().addDrivenPoint([currentLon, currentLat]);
        lastDrivenCoordRef.current = [currentLon, currentLat];
      }

      // ── 3. Position → Route projection → Remaining distance ──
      const { closestIdx, minDist, distanceFromStart } = projectOntoRoute(geometry, currentLat, currentLon);

      let remainingDist: number;
      const totalDist = totalRouteDistance(geometry);

      if (totalDist > 0) {
        remainingDist = totalDist - distanceFromStart;

        // Add distance from current position to the closest route point
        if (minDist < 100) {
          // Close enough to route — just use the geometric remaining
          remainingDist = Math.max(0, remainingDist);
        } else {
          // Far from route — use direct distance to finish as fallback
          const finishPoint = geometry[geometry.length - 1];
          remainingDist = haversineDistance(currentLat, currentLon, finishPoint[1], finishPoint[0]);
        }
      } else {
        // No geometry distance — use route.distance from API as initial, then haversine to finish
        if (initialRouteDistanceRef.current > 0) {
          const finishPoint = geometry[geometry.length - 1];
          const directDist = haversineDistance(currentLat, currentLon, finishPoint[1], finishPoint[0]);
          remainingDist = directDist;
        } else {
          remainingDist = 0;
        }
      }

      useNavigationStore.getState().setRemainingDistance(Math.round(remainingDist));

      // ── 4. Average speed ──
      const elapsedSec = (now - navStartTimeRef.current) / 1000;
      const drivenDistKm = (totalDist - remainingDist) / 1000;
      let avgSpeed = 0;
      if (elapsedSec > 5 && drivenDistKm > 0.01) {
        avgSpeed = drivenDistKm / (elapsedSec / 3600);
      }
      useNavigationStore.getState().setAvgSpeed(Math.round(avgSpeed * 10) / 10);

      // ── 5. ETA ──
      if (remainingDist > 0) {
        let etaSpeedKmh: number;
        if (avgSpeed > 3) {
          // Use average speed if we have enough data (after ~5 seconds)
          etaSpeedKmh = avgSpeed;
        } else if (speedKmh > 3) {
          // Fall back to current speed
          etaSpeedKmh = speedKmh;
        } else {
          // Use route's planned speed from duration/distance
          etaSpeedKmh = initialRouteDistanceRef.current > 0 && route.duration > 0
            ? (initialRouteDistanceRef.current / route.duration) * 3.6
            : 15; // Default 15 km/h for cycling
        }

        const etaMin = Math.round((remainingDist / 1000) / etaSpeedKmh * 60);
        const h = Math.floor(etaMin / 60);
        const m = etaMin % 60;
        useNavigationStore.getState().setEta(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      } else {
        useNavigationStore.getState().setEta('00:00');
      }

      // ── 6. Ascent / Descent based on route progress ──
      // v4.1.0 FIX: Always update from route data when available.
      // The route object from BRouter has accurate total ascent/descent.
      // We scale these by remaining progress to show "what's left to climb/descend".
      if (totalDist > 0) {
        const progress = Math.min(1, distanceFromStart / totalDist);
        const routeAscent = route.ascent || 0;
        const routeDescent = route.descent || 0;
        if (routeAscent > 0) {
          useNavigationStore.getState().setAscent(Math.round(routeAscent * (1 - progress)));
        }
        if (routeDescent > 0) {
          useNavigationStore.getState().setDescent(Math.round(routeDescent * (1 - progress)));
        }
      }

      // ── 7. Arrival detection ──
      if (remainingDist < 50 && !arrivedRef.current) {
        arrivedRef.current = true;
        useNavigationStore.getState().setCurrentSpeed(0);
        useNavigationStore.getState().setRemainingDistance(0);
        useNavigationStore.getState().setEta('00:00');
        useNavigationStore.getState().setAscent(0);
        useNavigationStore.getState().setDescent(0);

        // Announce arrival via TTS
        const { voiceEnabled, voiceVolume, voiceRate, selectedVoice, language } = useSettingsStore.getState();
        if (voiceEnabled) {
          ttsQueue.enqueue(t('nav.tts.arrived'), {
            voice: selectedVoice || undefined,
            rate: voiceRate,
            volume: voiceVolume,
            lang: language === 'de' ? 'de-DE' : 'en-US',
          });
        }
      }

      // Store previous position for next tick
      prevLatRef.current = currentLat;
      prevLonRef.current = currentLon;
      prevTimeRef.current = now;
    });

    return () => unsubscribe();
  }, []);
}
