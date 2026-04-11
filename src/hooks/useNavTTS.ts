/**
 * useNavTTS — Announces turn-by-turn navigation instructions via TTS.
 *
 * TTS Verbosity levels (ttsVerbosity setting):
 * - 'off':      No announcements at all
 * - 'beep':     Only a short beep at the turn moment (no speech)
 * - 'compact':  200m before turn + "Jetzt" at turn. No 500m warning. No "continue straight".
 * - 'full':     500m + 200m + 50m turn announcements. Continue straight. Start/arrival/reroute.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTwitchStore } from '@/store/useTwitchStore';
import { ttsQueue } from '@/lib/ttsQueue';
import { t } from '@/lib/i18n';

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

function normalizeAngle(angle: number): number {
  let a = angle;
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
}

type TurnDirection = 'straight' | 'slight-left' | 'slight-right' | 'left' | 'right' | 'uturn';

interface TurnInfo {
  direction: TurnDirection;
  distanceToTurnM: number;
  distanceToFinishM: number;
  closestIdx: number;
}

function getTurnInfo(
  geometry: [number, number][],
  currentLat: number,
  currentLon: number
): TurnInfo {
  if (!geometry || geometry.length < 2) {
    return { direction: 'straight', distanceToTurnM: 0, distanceToFinishM: 0, closestIdx: 0 };
  }

  // Find closest point on route
  let minDist = Infinity;
  let closestIdx = 0;
  for (let i = 0; i < geometry.length; i++) {
    const [glon, glat] = geometry[i];
    const d = haversineDistance(currentLat, currentLon, glat, glon);
    if (d < minDist) {
      minDist = d;
      closestIdx = i;
    }
  }

  const lastPoint = geometry[geometry.length - 1];
  const distanceToFinishM = haversineDistance(currentLat, currentLon, lastPoint[1], lastPoint[0]);

  // Too far from route
  if (minDist > 200) {
    return { direction: 'straight', distanceToTurnM: 0, distanceToFinishM, closestIdx };
  }

  // Near finish
  if (distanceToFinishM < 50) {
    return { direction: 'straight', distanceToTurnM: 0, distanceToFinishM: 0, closestIdx };
  }

  // Walk forward from closest point to find next turn
  const startIdx = Math.min(closestIdx, geometry.length - 2);
  const [startLon, startLat] = geometry[startIdx];
  const [nextLon, nextLat] = geometry[startIdx + 1];
  const initialBearing = calculateBearing(startLat, startLon, nextLat, nextLon);

  let prevBearing = initialBearing;
  let accumDist = 0;
  let segmentAccum = 0;
  const SAMPLE_INTERVAL = 30;
  const TURN_ANGLE_THRESHOLD = 35;

  for (let i = startIdx + 1; i < geometry.length - 1; i++) {
    const [lon1, lat1] = geometry[i];
    const [lon2, lat2] = geometry[i + 1];
    const segDist = haversineDistance(lat1, lon1, lat2, lon2);
    accumDist += segDist;
    segmentAccum += segDist;

    if (segmentAccum < SAMPLE_INTERVAL) continue;
    segmentAccum = 0;

    const bearing = calculateBearing(lat1, lon1, lat2, lon2);

    if (prevBearing !== null) {
      const angleDiff = normalizeAngle(bearing - prevBearing);

      if (Math.abs(angleDiff) > TURN_ANGLE_THRESHOLD) {
        let direction: TurnDirection;
        const absAngle = Math.abs(angleDiff);

        if (absAngle > 150) direction = 'uturn';
        else if (angleDiff > 80) direction = 'right';
        else if (angleDiff > TURN_ANGLE_THRESHOLD) direction = 'slight-right';
        else if (angleDiff < -80) direction = 'left';
        else direction = 'slight-left';

        return { direction, distanceToTurnM: accumDist, distanceToFinishM, closestIdx };
      }
    }

    prevBearing = bearing;
    if (accumDist > 2000) break;
  }

  return { direction: 'straight', distanceToTurnM: 0, distanceToFinishM, closestIdx };
}

function getTurnTextKey(direction: TurnDirection): string {
  switch (direction) {
    case 'left': return 'nav.turnLeft';
    case 'right': return 'nav.turnRight';
    case 'slight-left': return 'nav.slightLeft';
    case 'slight-right': return 'nav.slightRight';
    case 'uturn': return 'nav.uturn';
    default: return 'nav.continue';
  }
}

// Announcement zones — distances in meters
const ZONE_FAR = 500;    // "In 500 Metern..."
const ZONE_MID = 200;    // "In 200 Metern..."
const ZONE_NEAR = 50;    // "Jetzt..."

// Helper: send navigation announcement to Twitch chat (if connected).
// sendNavChat delegates ALL connection checks to sendChat() in TwitchChatManager.
// sendChat has a triple-guard (client exists, store.connected, tmi.js IRC state).
// We only check _sendChatFn existence here — no redundant connected check.
function sendNavChat(text: string) {
  const store = useTwitchStore.getState();
  if (!store._sendChatFn) return;
  try {
    store._sendChatFn(text);
  } catch (err) {
    console.warn('[useNavTTS] sendNavChat error:', err);
  }
}

/** Play a short beep tone for 'beep' mode */
function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // AudioContext not available
  }
}

export function useNavTTS() {
  const wasNavigatingRef = useRef(false);
  const lastAnnouncedZoneRef = useRef<string>('');
  const arrivedAnnouncedRef = useRef(false);
  const continueAnnouncedIdxRef = useRef<number>(-1);

  const speak = useCallback((text: string) => {
    const { voiceEnabled, voiceVolume, voiceRate, selectedVoice, language } = useSettingsStore.getState();
    if (!voiceEnabled) return;
    ttsQueue.enqueue(text, {
      voice: selectedVoice || undefined,
      rate: voiceRate,
      volume: voiceVolume,
      lang: language === 'de' ? 'de-DE' : 'en-US',
    });
    // World Translator: also output navigation announcements in chat
    sendNavChat('🗺️ ' + text);
  }, []);

  useEffect(() => {
    const unsubscribe = useNavigationStore.subscribe(() => {
      const nav = useNavigationStore.getState();
      const settings = useSettingsStore.getState();
      const verbosity = settings.ttsVerbosity || 'compact';

      // ── Navigation started — ALWAYS send chat message, regardless of TTS setting ──
      if (nav.isNavigating && !wasNavigatingRef.current) {
        wasNavigatingRef.current = true;
        arrivedAnnouncedRef.current = false;
        lastAnnouncedZoneRef.current = '';
        continueAnnouncedIdxRef.current = -1;

        // Build route summary from route data (not live nav data which is 0 at start)
        const finishWp = nav.waypoints.find(w => w.type === 'finish');
        const finishName = finishWp?.name || t('nav.destination');
        let routeSummary = '';
        if (nav.route) {
          const distKm = (nav.route.distance / 1000).toFixed(1);
          const totalMin = Math.round(nav.route.duration / 60);
          const durStr = totalMin >= 60
            ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}min`
            : `~${totalMin}min`;
          routeSummary = ` | ${distKm}km | ${durStr} | ↑${nav.route.ascent}m ↓${nav.route.descent}m`;
        }
        const startMsg = t('nav.tts.navStarted') + ' ' + finishName + '.' + routeSummary;

        // Always send to chat (even if TTS is off)
        sendNavChat('🗺️ ' + startMsg);

        // Only speak via TTS if enabled
        if (verbosity !== 'off' && settings.voiceEnabled && verbosity !== 'beep') {
          speak(startMsg);
        }
        return;
      }

      // ── Navigation stopped ──
      if (!nav.isNavigating && wasNavigatingRef.current) {
        wasNavigatingRef.current = false;
        ttsQueue.clear();
        return;
      }

      // ── Nothing to do if TTS is off (only applies to ongoing announcements) ──
      if (verbosity === 'off' || !settings.voiceEnabled) return;

      // Only process during active navigation
      if (!nav.isNavigating) return;
      if (nav.currentLat === null || nav.currentLon === null || !nav.route?.geometry) return;

      const info = getTurnInfo(nav.route.geometry, nav.currentLat, nav.currentLon);

      // ── Arrival announcement ──
      if (info.distanceToFinishM < 50 && info.distanceToFinishM >= 0 && !arrivedAnnouncedRef.current) {
        arrivedAnnouncedRef.current = true;
        if (verbosity === 'beep') {
          // Triple beep for arrival
          playBeep();
          setTimeout(() => playBeep(), 200);
          setTimeout(() => playBeep(), 400);
        } else {
          speak(t('nav.tts.arrived'));
        }
        return;
      }

      // ── Turn announcements ──
      if (info.direction !== 'straight' && info.distanceToTurnM > 0) {
        let zone = '';
        if (info.distanceToTurnM <= ZONE_NEAR) {
          zone = `near_${info.direction}`;
        } else if (info.distanceToTurnM <= ZONE_MID) {
          zone = `mid_${info.direction}`;
        } else if (info.distanceToTurnM <= ZONE_FAR) {
          zone = `far_${info.direction}`;
        }

        // Only announce if entering a new zone or new turn
        if (zone && zone !== lastAnnouncedZoneRef.current) {
          lastAnnouncedZoneRef.current = zone;

          if (verbosity === 'beep') {
            // Only beep at the turn moment (near zone)
            if (info.distanceToTurnM <= ZONE_NEAR) {
              playBeep();
            }
            return;
          }

          const turnText = t(getTurnTextKey(info.direction));

          if (info.distanceToTurnM <= ZONE_NEAR) {
            // All modes except 'beep' announce at turn moment
            speak(t('nav.tts.turnNow') + ' ' + turnText + '.');
          } else if (verbosity === 'full' && info.distanceToTurnM <= ZONE_FAR) {
            // Full mode: announce at 500m
            const distText = info.distanceToTurnM >= 1000
              ? `${(info.distanceToTurnM / 1000).toFixed(1)}`
              : `${Math.round(info.distanceToTurnM)}`;
            const unit = info.distanceToTurnM >= 1000 ? 'km' : 'm';
            speak(t('nav.tts.inXMeters', { distance: distText, unit }) + ' ' + turnText + '.');
          } else if (verbosity === 'compact' && info.distanceToTurnM <= ZONE_MID) {
            // Compact mode: only 200m warning (no 500m)
            const distText = `${Math.round(info.distanceToTurnM)}`;
            speak(t('nav.tts.inXMeters', { distance: distText, unit: 'm' }) + ' ' + turnText + '.');
          }
        }
      } else if (info.direction === 'straight' && info.distanceToTurnM === 0) {
        // No turn ahead — reset zone so we can announce the next turn
        lastAnnouncedZoneRef.current = '';
      }

      // ── "Continue straight" — only in full mode ──
      if (verbosity === 'full' &&
          info.closestIdx !== continueAnnouncedIdxRef.current &&
          info.direction === 'straight' &&
          info.distanceToFinishM > 100) {
        continueAnnouncedIdxRef.current = info.closestIdx;
        // Only announce every ~500 index steps to avoid spamming
        if (info.closestIdx % 500 === 0 && info.closestIdx > 0) {
          speak(t('nav.tts.continueStraight'));
        }
      }
    });

    return () => unsubscribe();
  }, [speak]);
}
