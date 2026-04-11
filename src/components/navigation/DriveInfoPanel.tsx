
import { useMemo } from 'react';
import { Gauge, MapPin, Clock, Mountain, TrendingDown, Navigation } from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { t } from '@/lib/i18n';

export default function DriveInfoPanel() {
  const {
    currentSpeed,
    remainingDistance,
    eta,
    ascent,
    descent,
    avgSpeed,
    isNavigating,
    isDemoMode,
    drivenPath,
    route,
  } = useNavigationStore();

  const showFull = isNavigating || isDemoMode;

  // After route calculation (but before navigation start), show route summary
  const hasRoute = !!route && !isNavigating && !isDemoMode;

  // Compute display values: prefer live navigation values, fall back to route summary
  const displayDistance = isNavigating || isDemoMode ? remainingDistance : (route?.distance ?? 0);
  const displayAscent = isNavigating || isDemoMode ? ascent : (route?.ascent ?? 0);
  const displayDescent = isNavigating || isDemoMode ? descent : (route?.descent ?? 0);

  const displayEta = useMemo(() => {
    if (isNavigating || isDemoMode) return eta;
    if (route) {
      const totalMin = Math.round(route.duration / 60);
      if (totalMin >= 60) {
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return `${h}:${m.toString().padStart(2, '0')}`;
      }
      return `0:${totalMin.toString().padStart(2, '0')}`;
    }
    return '--:--';
  }, [isNavigating, isDemoMode, eta, route]);

  const kmToday = useMemo(() => {
    if (drivenPath.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < drivenPath.length; i++) {
      const [lon1, lat1] = drivenPath[i - 1];
      const [lon2, lat2] = drivenPath[i];
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return total / 1000;
  }, [drivenPath]);

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} ${t('general.km')}`;
    }
    return `${Math.round(meters)} ${t('general.m')}`;
  };

  const speedColor = useMemo(() => {
    if (currentSpeed === 0) return 'text-foreground';
    if (currentSpeed < 10) return 'text-accent';
    if (currentSpeed < 25) return 'text-green-400';
    if (currentSpeed < 50) return 'text-yellow-400';
    return 'text-danger';
  }, [currentSpeed]);

  return (
    <div className={`glass rounded-xl transition-all duration-500 ${showFull ? 'p-4' : 'p-3'}`}>
      {/* Speed display */}
      <div className="flex items-end justify-center gap-1 mb-2">
        <Gauge className="w-4 h-4 text-primary mb-1" />
        <span className={`text-4xl font-black tabular-nums leading-none ${speedColor} transition-colors`}>
          {currentSpeed}
        </span>
        <span className="text-xs text-muted-foreground mb-1">{t('general.kmh')}</span>
      </div>

      {/* KM today + Avg speed row */}
      <div className="flex items-center justify-center gap-3 mb-1">
        <div className="flex items-center gap-1">
          <Navigation className="w-3 h-3 text-accent" />
          <span className="text-[11px] text-foreground/70">{kmToday.toFixed(1)} {t('general.km')}</span>
        </div>
        {isDemoMode && <span className="text-[10px] text-warning">{t('nav.demo')}</span>}
      </div>

      {/* Extended info (2x3 grid) - when navigating OR when route is calculated */}
      {(showFull || hasRoute) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <div>
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                {showFull ? t('nav.remaining') : t('nav.routeDistance')}
              </div>
              <div className="text-xs font-semibold text-foreground/90 tabular-nums">
                {formatDistance(displayDistance)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-accent shrink-0" />
            <div>
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                {showFull ? t('nav.eta') : t('nav.duration')}
              </div>
              <div className="text-xs font-semibold text-foreground/90 tabular-nums">{displayEta}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Mountain className="w-3 h-3 text-green-400 shrink-0" />
            <div>
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{t('nav.ascent')}</div>
              <div className="text-xs font-semibold text-foreground/90 tabular-nums">{displayAscent} {t('general.m')}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-orange-400 shrink-0" />
            <div>
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{t('nav.descent')}</div>
              <div className="text-xs font-semibold text-foreground/90 tabular-nums">{displayDescent} {t('general.m')}</div>
            </div>
          </div>

          {/* Avg Speed - full width */}
          <div className="col-span-2 flex items-center gap-1.5">
            <Gauge className="w-3 h-3 text-primary shrink-0" />
            <div>
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                {t('nav.avgSpeed')}
              </div>
              <div className="text-xs font-semibold text-foreground/90 tabular-nums">
                {avgSpeed > 0 ? `${avgSpeed.toFixed(1)} ${t('general.kmh')}` : '--'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
