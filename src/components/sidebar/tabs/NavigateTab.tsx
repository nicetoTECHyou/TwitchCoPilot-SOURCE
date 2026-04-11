
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Square,
  Maximize,
  Minimize,
  Crosshair,
  AlertTriangle,
  Check,
  X,
  MapPin,
  Users,
  Clock,
  Video,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTwitchStore } from '@/store/useTwitchStore';
import { mapInstanceRef } from '@/components/map/MapContainer';

// Haversine distance in meters between two coordinates
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function NavigateTab() {
  return (
    <ScrollArea className="h-full custom-scrollbar">
      <NavigateSection />
    </ScrollArea>
  );
}

export function NavigateSection() {
  const {
    isNavigating,
    isDemoMode,
    gpsStatus,
    currentSpeed,
    remainingDistance,
    ascent,
    descent,
    route,
    setIsNavigating,
    setIsDemoMode,
    setGpsStatus,
    setCurrentSpeed,
    setRemainingDistance,
    setEta,
    setAscent,
    setDescent,
    setAvgSpeed,
    resetNavigation,
  } = useNavigationStore();

  const { language, followCamEnabled, followCamPitch, followCamZoom, updateSetting } = useSettingsStore();

  const {
    connected: twitchConnected,
    pendingWaypoints,
    approvedWaypoints,
    approveWaypoint,
    rejectWaypoint,
  } = useTwitchStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const gpsWatchRef = useRef<number | null>(null);

  // GPS enable with start waypoint setting
  const enableGPS = useCallback(() => {
    setGpsError('');
    useNavigationStore.getState().setGpsStatus('requesting');

    if (!navigator.geolocation) {
      setGpsError(t('nav.gpsNotSupported'));
      useNavigationStore.getState().setGpsStatus('idle');
      return;
    }

    // Check if page is served over HTTPS (required for GPS on mobile)
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) {
      setGpsError(t('nav.gpsHttpsRequired'));
      useNavigationStore.getState().setGpsStatus('idle');
      return;
    }

    // v4.1.0 FIX: Strict GPS options — force GPS hardware, no WiFi/network fallback.
    // - maximumAge: 0 = Always request fresh GPS position (no cached WiFi/cell position).
    //   This is CRITICAL: maximumAge > 0 allows the browser to return a stale WiFi-based
    //   position, which is inaccurate and causes the "wrong location source" bug.
    // - enableHighAccuracy: true = Forces GPS chip usage (not WiFi/cell tower triangulation).
    // - timeout: 20s = Give GPS chip enough time to acquire satellites (first fix is slow).
    const initialGeoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,        // v4.1.0: Force fresh GPS — no cached WiFi positions!
    };

    // Strict options for continuous tracking (watchPosition)
    // maximumAge: 1000 = Allow 1s cache to prevent GPS jitter on phones.
    //   This is a compromise: too low (0) causes excessive power drain and jitter,
    //   too high (>2s) risks stale positions.
    const watchGeoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 1000,     // v4.1.0: Reduced from 2s to 1s for better accuracy
    };

    // v4.1.0 FIX: No more aggressive retry with low accuracy fallback!
    // The old code tried getCurrentPosition again with enableHighAccuracy=false
    // when the high-accuracy call failed. This caused:
    //   1. "Eingabe wiederholen" popups on phones (re-triggered permission dialog)
    //   2. Network/WiFi-based positions instead of GPS (inaccurate for navigation)
    //   3. Endless retry loop if the user kept dismissing the permission dialog
    // Now we simply show an error and let the user retry manually.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const heading = pos.coords.heading || undefined;

        useNavigationStore.getState().setCurrentPosition(lat, lon, heading);

        // Set as start waypoint
        const store = useNavigationStore.getState();
        const existingStart = store.waypoints.find(w => w.type === 'start');
        if (!existingStart || existingStart.lat !== lat || existingStart.lon !== lon) {
          const wp = {
            id: 'start',
            lat, lon,
            name: t('nav.currentLocation'),
            type: 'start' as const,
          };
          const others = store.waypoints.filter(w => w.type !== 'start');
          store.setWaypoints([wp, ...others]);
        }

        mapInstanceRef.current?.easeTo({ center: [Number(lon), Number(lat)], zoom: 15, duration: 1000 });

        if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = navigator.geolocation.watchPosition(
          (watchPos) => {
            useNavigationStore.getState().setCurrentPosition(
              watchPos.coords.latitude, watchPos.coords.longitude,
              watchPos.coords.heading || undefined
            );
            const { isNavigating: nav, isDemoMode: demo } = useNavigationStore.getState();
            const { followCamEnabled: fc } = useSettingsStore.getState();
            if (nav || demo) {
              if (!fc) {
                mapInstanceRef.current?.easeTo({
                  center: [Number(watchPos.coords.longitude), Number(watchPos.coords.latitude)], duration: 500,
                });
              }
            }
          },
          (watchErr) => {
            // Don't immediately show error on watch errors — GPS can temporarily lose signal
            console.warn('[GPS] watchPosition error:', watchErr.code, watchErr.message);
            if (watchErr.code === 1) {
              useNavigationStore.getState().setGpsStatus('idle');
              setGpsError(t('nav.gpsPermissionDenied'));
            }
            // For code 2 (unavailable) and 3 (timeout), keep tracking — signal may return
          },
          watchGeoOptions
        );
        useNavigationStore.getState().setGpsStatus('active');
        setTimeout(() => setGpsError(''), 5000);
      },
      (err) => {
        // v4.1.0 FIX: No retry — just show the error and stop.
        // The old code had an aggressive fallback with enableHighAccuracy=false
        // that caused "Eingabe wiederholen" popups and inaccurate WiFi positioning.
        console.warn('[GPS] Position acquisition failed (code ' + err.code + '):', err.message);
        useNavigationStore.getState().setGpsStatus('idle');

        const errMsgs: Record<number, string> = {
          1: t('nav.gpsPermissionDenied'),
          2: t('nav.gpsPositionUnavailable'),
          3: t('nav.gpsTimeout'),
        };
        setGpsError(errMsgs[err.code] || t('nav.gpsNotAvailable'));
        setTimeout(() => setGpsError(''), 10000);
      },
      initialGeoOptions
    );
  }, [language]);

  // GPS disable — stops the watch and resets status
  const disableGPS = useCallback(() => {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
    useNavigationStore.getState().setGpsStatus('idle');
    setGpsError('');
    // Clear position from store so map marker disappears
    useNavigationStore.setState({ currentLat: null, currentLon: null, currentHeading: null });
  }, []);

  // GPS toggle — switches between enable and disable
  const toggleGPS = useCallback(() => {
    if (gpsStatus === 'active') {
      disableGPS();
    } else {
      enableGPS();
    }
  }, [gpsStatus, enableGPS, disableGPS]);

  // Demo mode simulation — writes avgSpeed to store
  useEffect(() => {
    if (!isDemoMode || !isNavigating || !route) return;

    const totalDistance = route.distance;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;
      const progress = Math.min(elapsed / 120, 1);
      const simSpeed = 18 + Math.sin(elapsed * 0.1) * 5;
      setCurrentSpeed(Math.round(simSpeed));
      const remaining = totalDistance * (1 - progress);
      setRemainingDistance(remaining);
      setAscent(route.ascent * (1 - progress));
      setDescent(route.descent * (1 - progress));

      if (remaining <= 0) {
        setEta('00:00');
        setAvgSpeed(simSpeed);
      } else {
        const etaMin = Math.round(remaining / 1000 / simSpeed * 60);
        const h = Math.floor(etaMin / 60);
        const m = etaMin % 60;
        setEta(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        const elapsedHours = elapsed / 3600;
        const drivenKm = (totalDistance - remaining) / 1000;
        setAvgSpeed(elapsedHours > 0 ? drivenKm / elapsedHours : 0);
      }

      if (progress >= 1) {
        clearInterval(interval);
        setCurrentSpeed(0);
        setAvgSpeed(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemoMode, isNavigating, route, setCurrentSpeed, setRemainingDistance, setEta, setAscent, setDescent, setAvgSpeed]);

  const handleStartNav = useCallback(() => {
    if (!route) return;
    setIsNavigating(true);
    // Set initial navigation values for BOTH demo and real GPS mode
    setRemainingDistance(route.distance);
    setAscent(route.ascent);
    setDescent(route.descent);
    if (route.duration > 0) {
      const h = Math.floor(route.duration / 3600);
      const m = Math.round((route.duration % 3600) / 60);
      setEta(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }, [route, isDemoMode, setIsNavigating, setRemainingDistance, setAscent, setDescent, setEta]);

  const handleStopNav = useCallback(() => {
    setIsNavigating(false);
    setCurrentSpeed(0);
    setAvgSpeed(0);
    resetNavigation();
  }, [setIsNavigating, setCurrentSpeed, setAvgSpeed, resetNavigation]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // ── Smart routing: approve waypoint ──
  const handleApprove = useCallback((wpId: string) => {
    const wp = pendingWaypoints.find(w => w.id === wpId);
    if (!wp) return;

    const navStore = useNavigationStore.getState();
    const currentWps = [...navStore.waypoints];
    const currentDest = currentWps.find(w => w.type === 'finish');
    const currentStart = currentWps.find(w => w.type === 'start');

    // If no current destination, just add as destination
    if (!currentDest) {
      navStore.addWaypoint({
        id: `wp-${Date.now()}`,
        lat: wp.lat,
        lon: wp.lon,
        name: wp.name,
        type: 'finish',
        address: wp.address,
      });
      approveWaypoint(wpId);
      // Announce in chat (only if connected)
      {
        const twitchStore = useTwitchStore.getState();
        if (twitchStore._sendChatFn) {
          const wp = pendingWaypoints.find(w => w.id === wpId);
          if (wp) {
            twitchStore._sendChatFn(t('nav.approveWpChat', { name: wp.name, user: wp.suggestedBy }));
          }
        }
      }
      return;
    }

    // Haversine distance: new waypoint vs current destination (from start or GPS)
    const refLat = currentStart?.lat || navStore.currentLat || 52.52;
    const refLon = currentStart?.lon || navStore.currentLon || 13.405;

    const distToNew = haversineDistance(refLat, refLon, wp.lat, wp.lon);
    const distToCurrent = haversineDistance(refLat, refLon, currentDest.lat, currentDest.lon);

    if (distToNew > distToCurrent) {
      // New waypoint is farther → make it the new destination, old dest → via
      navStore.updateWaypoint(currentDest.id, { type: 'via' as const });
      navStore.addWaypoint({
        id: `wp-${Date.now()}`,
        lat: wp.lat,
        lon: wp.lon,
        name: wp.name,
        type: 'finish',
        address: wp.address,
      });
    } else {
      // Closer → add as via only (before destination)
      const viaWp = {
        id: `wp-${Date.now()}`,
        lat: wp.lat,
        lon: wp.lon,
        name: wp.name,
        type: 'via' as const,
        address: wp.address,
      };
      // Insert before finish
      const withoutFinish = currentWps.filter(w => w.type !== 'finish');
      navStore.setWaypoints([...withoutFinish, viaWp, currentDest]);
    }

    approveWaypoint(wpId);
    // Announce in chat (connection guard is inside _sendChatFn/sendChat)
    {
      const twitchStore = useTwitchStore.getState();
      if (twitchStore._sendChatFn) {
        const wp = pendingWaypoints.find(w => w.id === wpId);
        if (wp) {
          twitchStore._sendChatFn(t('nav.approveWpChat', { name: wp.name, user: wp.suggestedBy }));
        }
      }
    }
  }, [pendingWaypoints, approveWaypoint]);

  const handleReject = useCallback((wpId: string) => {
    rejectWaypoint(wpId);
    {
      const twitchStore = useTwitchStore.getState();
      if (twitchStore._sendChatFn) {
        const wp = pendingWaypoints.find(w => w.id === wpId);
        if (wp) {
          twitchStore._sendChatFn(t('nav.rejectWpChat', { name: wp.name }));
        }
      }
    }
  }, [rejectWaypoint]);

  const handleApproveAll = useCallback(() => {
    pendingWaypoints.forEach(wp => handleApprove(wp.id));
  }, [pendingWaypoints, handleApprove]);

  const handleRejectAll = useCallback(() => {
    pendingWaypoints.forEach(wp => rejectWaypoint(wp.id));
  }, [pendingWaypoints, rejectWaypoint]);

  // Cleanup GPS watch on unmount
  useEffect(() => {
    return () => {
      if (gpsWatchRef.current) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      switch (e.code) {
        case 'Space': e.preventDefault(); isNavigating ? handleStopNav() : handleStartNav(); break;
        case 'KeyD': e.preventDefault(); setIsDemoMode(!isDemoMode); if (!isDemoMode && isNavigating) handleStartNav(); break;
        case 'KeyM': e.preventDefault(); break;
        case 'KeyF': e.preventDefault(); toggleFullscreen(); break;
        case 'Escape': if (isNavigating) { e.preventDefault(); handleStopNav(); } else if (document.fullscreenElement) document.exitFullscreen(); break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isNavigating, isDemoMode, handleStartNav, handleStopNav, toggleFullscreen, setIsDemoMode]);

  return (
    <div className="flex flex-col gap-3 pb-4 max-w-full overflow-hidden">

        {/* ── Community Waypoints (pending from Twitch chat) ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1.5">
              <Users className="size-3.5" />
              {t('nav.communityWaypoints')}
            </Label>
            <div className="flex items-center gap-1">
              {pendingWaypoints.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/15 text-warning font-medium">
                  {pendingWaypoints.length}
                </span>
              )}
              {!twitchConnected && (
                <span className="text-[10px] text-sidebar-foreground/30">
                  {t('nav.botOff')}
                </span>
              )}
            </div>
          </div>

          {pendingWaypoints.length === 0 ? (
            <div className="text-[10px] text-sidebar-foreground/30 px-1 py-2 rounded-lg bg-sidebar-foreground/5 text-center">
              {t('nav.noPendingWaypoints')}
            </div>
          ) : (
            <div className="space-y-1.5">
              {pendingWaypoints.map((wp: any) => (
                <div key={wp.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-sidebar-foreground/5 text-xs group">
                  <MapPin className="size-3 text-warning shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{wp.name || t('nav.unknown')}</div>
                    <div className="text-[10px] text-sidebar-foreground/40 flex items-center gap-1.5">
                      <span>@{wp.suggestedBy || '?'}</span>
                      {wp.timestamp && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="size-2.5" />
                          {new Date(wp.timestamp).toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleApprove(wp.id)}
                    className="shrink-0 size-6 rounded flex items-center justify-center bg-success/15 text-success hover:bg-success/25 transition-colors"
                    title={t('nav.approve')}
                  >
                    <Check className="size-3" />
                  </button>
                  <button
                    onClick={() => handleReject(wp.id)}
                    className="shrink-0 size-6 rounded flex items-center justify-center bg-danger/15 text-danger hover:bg-danger/25 transition-colors"
                    title={t('nav.reject')}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}

              {/* Approve all / Reject all */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[10px] gap-1 border-success/30 text-success hover:bg-success/10"
                  onClick={handleApproveAll}
                >
                  <Check className="size-3" />
                  {t('nav.approveAll')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[10px] gap-1 border-danger/30 text-danger hover:bg-danger/10"
                  onClick={handleRejectAll}
                >
                  <X className="size-3" />
                  {t('nav.rejectAll')}
                </Button>
              </div>
            </div>
          )}

          {/* Approved history */}
          {approvedWaypoints.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] text-sidebar-foreground/30 px-1">
                {t('nav.approvedCount', { n: approvedWaypoints.length })}
              </div>
              {approvedWaypoints.slice(-3).map((wp: any) => (
                <div key={wp.id} className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-sidebar-foreground/40">
                  <Check className="size-2.5 text-success/60" />
                  <span className="truncate">{wp.name}</span>
                  <span className="ml-auto shrink-0">@{wp.suggestedBy}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* ── GPS ── */}
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleGPS}
            variant="outline"
            disabled={gpsStatus === 'requesting'}
            className={`flex-1 h-9 gap-2 border-sidebar-border ${gpsStatus === 'active' ? 'bg-accent/15 border-accent text-accent' : ''}`}
          >
            <Crosshair className={`size-4 ${gpsStatus === 'active' ? 'text-accent' : 'text-accent'}`} />
            {gpsStatus === 'active'
              ? t('nav.gpsActive')
              : gpsStatus === 'requesting'
                ? '...'
                : t('nav.currentLocation')
            }
          </Button>
        </div>

        {gpsError && (
          <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg">
            <AlertTriangle className="size-3.5 shrink-0" />
            {gpsError}
          </div>
        )}

        {/* ── Start/Stop ── */}
        <div className="flex gap-2">
          <Button
            onClick={handleStartNav}
            disabled={isNavigating || !route}
            className="flex-1 h-9 gap-2 bg-success text-white hover:bg-success/90"
          >
            <Play className="size-4" />
            {t('nav.startNav')}
          </Button>
          <Button
            onClick={handleStopNav}
            disabled={!isNavigating}
            variant="outline"
            className="flex-1 h-9 gap-2 border-danger/50 text-danger hover:bg-danger/10 hover:text-danger"
          >
            <Square className="size-4" />
            {t('nav.stopNav')}
          </Button>
        </div>

        {/* ── Demo mode toggle ── */}
        <div className="flex items-center justify-between px-1">
          <Label className="text-xs text-sidebar-foreground/70">
            {t('nav.demo')}
          </Label>
          <Switch
            checked={isDemoMode}
            onCheckedChange={(v) => {
              setIsDemoMode(v);
              if (v && isNavigating) handleStartNav();
            }}
          />
        </div>

        <Separator className="bg-sidebar-border" />

        {/* ── Follow-Cam (3D Navigation Camera) ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <Label className="text-xs text-sidebar-foreground/70 flex items-center gap-1.5">
              <Video className="size-3.5" />
              {t('nav.followCam')}
            </Label>
            <Switch
              checked={followCamEnabled}
              onCheckedChange={(v) => updateSetting('followCamEnabled', v)}
            />
          </div>
          {followCamEnabled && (
            <div className="space-y-2 pl-1 border-l-2 border-accent/30 ml-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-sidebar-foreground/50">{t('nav.followCamPitch')}</Label>
                  <span className="text-[10px] text-sidebar-foreground/70">{followCamPitch}°</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={80}
                  step={5}
                  value={followCamPitch}
                  onChange={(e) => updateSetting('followCamPitch', Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-sidebar-foreground/20 accent-accent cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-sidebar-foreground/30">
                  <span>2D</span>
                  <span>3D</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-sidebar-foreground/50">{t('nav.followCamZoom')}</Label>
                  <span className="text-[10px] text-sidebar-foreground/70">z{followCamZoom}</span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={18}
                  step={0.5}
                  value={followCamZoom}
                  onChange={(e) => updateSetting('followCamZoom', Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-sidebar-foreground/20 accent-accent cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-sidebar-foreground/30">
                  <span>{t('nav.followCamZoomOut')}</span>
                  <span>{t('nav.followCamZoomIn')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* ── Fullscreen ── */}
        <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5 border-sidebar-border" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
          {t('nav.fullscreen')}
        </Button>

        <Separator className="bg-sidebar-border" />

        {/* ── Keyboard shortcuts ── */}
        <div>
          <button
            className="flex items-center gap-1.5 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors w-full"
            onClick={() => setShowHelp(!showHelp)}
          >
            {t('nav.shortcuts')}
            <span className="ml-auto">{showHelp ? '▲' : '▼'}</span>
          </button>
          {showHelp && (
            <div className="mt-2 space-y-1.5">
              {[
                { key: 'Space', desc: `${t('nav.startNav')} / ${t('nav.stopNav')}` },
                { key: 'D', desc: t('nav.demo') },
                { key: 'M', desc: t('general.off') },
                { key: 'F', desc: t('nav.fullscreen') },
                { key: 'Esc', desc: t('nav.stopNav') },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-sidebar-foreground/5">
                  <span className="text-sidebar-foreground/60">{s.desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-sidebar-foreground/10 text-sidebar-foreground/80 font-mono text-[10px]">{s.key}</kbd>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
