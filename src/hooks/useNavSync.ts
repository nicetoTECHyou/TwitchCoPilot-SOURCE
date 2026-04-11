import { useEffect, useRef } from 'react';
import { peerSync, type SyncMessage, type SyncNavData, type SyncTwitchData, type SyncWeatherData } from '@/lib/peerSync';
import { useSyncStore } from '@/store/useSyncStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useTwitchStore } from '@/store/useTwitchStore';
import { useWeatherStore } from '@/store/useWeatherStore';

/**
 * useNavSyncSender — Call in the MAIN APP (phone side).
 * Subscribes to nav/twitch/weather stores and sends data via MQTT when connected.
 * @param enabled — only active in non-overlay mode (phone sends, overlay receives)
 */
export function useNavSyncSender(enabled = true) {
  const isConnected = useSyncStore((s) => s.isConnected);
  const lastSendRef = useRef(0);
  const navUnsub = useRef<(() => void) | null>(null);
  const twitchUnsub = useRef<(() => void) | null>(null);
  const weatherUnsub = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !isConnected) {
      // Stop sending when disconnected
      navUnsub.current?.();
      navUnsub.current = null;
      twitchUnsub.current?.();
      twitchUnsub.current = null;
      weatherUnsub.current?.();
      weatherUnsub.current = null;
      return;
    }

    // Throttle: max 1 send per second
    const canSend = () => {
      const now = Date.now();
      if (now - lastSendRef.current < 1000) return false;
      lastSendRef.current = now;
      return true;
    };

    const sendNav = () => {
      if (!canSend()) return;
      const nav = useNavigationStore.getState();
      const wps = nav.waypoints;
      const startWp = wps.find(w => w.type === 'start');
      const finishWp = wps.find(w => w.type === 'finish');

      // Calculate route progress
      let routeProgress = 0;
      if (nav.route?.geometry && nav.route.geometry.length > 2 && nav.drivenPath.length > 2) {
        let totalDist = 0;
        for (let i = 1; i < nav.route.geometry.length; i++) {
          const [lon1, lat1] = nav.route.geometry[i - 1];
          const [lon2, lat2] = nav.route.geometry[i];
          const R = 6371000;
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
          totalDist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        let drivenDist = 0;
        for (let i = 1; i < nav.drivenPath.length; i++) {
          const [lon1, lat1] = nav.drivenPath[i - 1];
          const [lon2, lat2] = nav.drivenPath[i];
          const R = 6371000;
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
          drivenDist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        if (totalDist > 0) routeProgress = Math.min(drivenDist / totalDist, 1);
      }

      // Calculate km today
      let kmToday = 0;
      if (nav.drivenPath.length > 2) {
        for (let i = 1; i < nav.drivenPath.length; i++) {
          const [lon1, lat1] = nav.drivenPath[i - 1];
          const [lon2, lat2] = nav.drivenPath[i];
          const R = 6371000;
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
          kmToday += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        kmToday /= 1000;
      }

      // Simplify route geometry for overlay minimap (every 5th point max ~400 points)
      let routeGeometry: [number, number][] | null = null;
      const geom = nav.route?.geometry;
      if (geom && geom.length > 1) {
        const step = Math.max(1, Math.floor(geom.length / 400));
        routeGeometry = geom.filter((_, i) => i % step === 0 || i === geom.length - 1);
      }

      const msg: SyncNavData = {
        type: 'nav',
        currentSpeed: nav.currentSpeed,
        currentLat: nav.currentLat,
        currentLon: nav.currentLon,
        remainingDistance: nav.remainingDistance,
        eta: nav.eta,
        ascent: nav.ascent,
        descent: nav.descent,
        isNavigating: nav.isNavigating,
        isDemoMode: nav.isDemoMode,
        vehicleName: nav.selectedVehicle.name,
        vehicleColor: nav.selectedVehicle.color,
        startName: startWp?.name || 'Start',
        finishName: finishWp?.name || 'Ziel',
        kmToday,
        routeProgress,
        routeExists: !!nav.route?.geometry,
        routeGeometry,
        // Route info from calculated route (always sent when route exists)
        routeDistance: nav.route?.distance ?? 0,
        routeAscent: nav.route?.ascent ?? 0,
        routeDescent: nav.route?.descent ?? 0,
        routeDuration: nav.route?.duration ?? 0,
      };

      peerSync.send(msg);
    };

    const sendTwitch = () => {
      const twitch = useTwitchStore.getState();
      const msg: SyncTwitchData = {
        type: 'twitch',
        channel: twitch.channel,
        connected: twitch.connected,
        messages: twitch.messages.slice(-5).map(m => ({
          id: m.id,
          username: m.username,
          displayName: m.displayName,
          color: m.color,
          message: m.message,
        })),
        activeVote: twitch.activeVote ? {
          id: twitch.activeVote.id,
          question: twitch.activeVote.question,
          options: twitch.activeVote.options,
          votes: twitch.activeVote.votes,
          isActive: twitch.activeVote.isActive,
          winner: twitch.activeVote.winner,
        } : null,
      };
      peerSync.send(msg);
    };

    const sendWeather = () => {
      const weather = useWeatherStore.getState();
      const msg: SyncWeatherData = {
        type: 'weather',
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
      };
      peerSync.send(msg);
    };

    // Subscribe to store changes
    navUnsub.current = useNavigationStore.subscribe(sendNav);
    twitchUnsub.current = useTwitchStore.subscribe(sendTwitch);
    weatherUnsub.current = useWeatherStore.subscribe(sendWeather);

    // Send initial batch
    setTimeout(() => {
      sendNav();
      sendTwitch();
      sendWeather();
    }, 500);

    return () => {
      navUnsub.current?.();
      navUnsub.current = null;
      twitchUnsub.current?.();
      twitchUnsub.current = null;
      weatherUnsub.current?.();
      weatherUnsub.current = null;
    };
  }, [enabled, isConnected]);
}

/**
 * useSyncReceiver — Call in the OBS OVERLAY (PC side).
 * Receives data from MQTT and writes it into the local nav store.
 * @param enabled — only active in overlay mode (overlay receives, phone sends)
 */
export function useSyncReceiver(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    console.log('[SyncReceiver] Active — listening for incoming sync data');

    const unsubData = peerSync.on('data', (msg) => {
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'nav') {
        const d = msg as SyncNavData;
        const nav = useNavigationStore.getState();
        nav.setCurrentSpeed(d.currentSpeed);
        nav.setCurrentPosition(d.currentLat ?? 0, d.currentLon ?? 0);
        nav.setRemainingDistance(d.remainingDistance);
        nav.setEta(d.eta);
        nav.setAscent(d.ascent);
        nav.setDescent(d.descent);
        nav.setIsNavigating(d.isNavigating);
        nav.setIsDemoMode(d.isDemoMode);
        nav.setRemoteVehicle(d.vehicleName, d.vehicleColor);
        nav.setKmToday(d.kmToday);
        nav.setRouteProgress(d.routeProgress);
        nav.setRouteExists(d.routeExists);
        nav.setRemoteWaypoints(d.startName, d.finishName);
        nav.setRemoteRouteGeometry(d.routeGeometry);
        // Route info from calculated route
        nav.setRemoteRouteInfo(d.routeDistance, d.routeAscent, d.routeDescent, d.routeDuration);
      }

      if (msg.type === 'twitch') {
        const d = msg as SyncTwitchData;
        const twitch = useTwitchStore.getState();
        // Only update messages and vote from remote — don't overwrite connection state
        if (d.messages.length > 0) {
          const current = twitch.messages;
          const newMessages = [...current.slice(0, -5),
            ...d.messages.map(m => ({ ...m, timestamp: Date.now(), isAction: false }))
          ].slice(-500);
          useTwitchStore.setState({ messages: newMessages });
        }
        // Reconstruct VoteSession with required fields
        if (d.activeVote) {
          useTwitchStore.setState({
            activeVote: {
              ...d.activeVote,
              voters: {},
              startTime: Date.now(),
              duration: 60,
            },
          });
        } else {
          useTwitchStore.setState({ activeVote: null });
        }
      }

      if (msg.type === 'weather') {
        const d = msg as SyncWeatherData;
        useWeatherStore.getState().setTemperature(d.temperature);
        useWeatherStore.getState().setWindSpeed(d.windSpeed);
      }
    });

    return () => { unsubData(); };
  }, [enabled]);
}
