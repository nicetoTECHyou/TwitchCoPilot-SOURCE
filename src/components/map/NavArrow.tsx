
import { useMemo } from 'react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { t } from '@/lib/i18n';
import { ArrowUp, ArrowLeft, ArrowRight, ArrowUpLeft, ArrowUpRight, Undo2, RefreshCw } from 'lucide-react';

type TurnDirection = 'straight' | 'slight-left' | 'slight-right' | 'left' | 'right' | 'uturn';

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

// Calculate bearing from point1 to point2 (degrees, 0-360)
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

// Normalize angle to -180..180
function normalizeAngle(angle: number): number {
  let a = angle;
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
}

// Find the next significant turn on the route geometry
function getNextTurnInfo(
  geometry: [number, number][],
  currentLat: number,
  currentLon: number
): { direction: TurnDirection; distanceToTurnM: number; distanceToFinishM: number } {
  if (!geometry || geometry.length < 2) {
    return { direction: 'straight', distanceToTurnM: 0, distanceToFinishM: 0 };
  }

  // Find closest point on route to current position
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

  // Calculate distance from current position to finish (last point)
  const lastPoint = geometry[geometry.length - 1];
  const distanceToFinishM = haversineDistance(
    currentLat,
    currentLon,
    lastPoint[1],
    lastPoint[0]
  );

  // If too far from route, just show straight
  if (minDist > 200) {
    return { direction: 'straight', distanceToTurnM: 0, distanceToFinishM };
  }

  // If we're within 50m of the finish, show arrived
  if (distanceToFinishM < 50) {
    return { direction: 'straight', distanceToTurnM: 0, distanceToFinishM: 0 };
  }

  // Get initial bearing from closest point forward
  const startIdx = Math.min(closestIdx, geometry.length - 2);
  const [startLon, startLat] = geometry[startIdx];
  const [nextLon, nextLat] = geometry[startIdx + 1];
  const initialBearing = calculateBearing(startLat, startLon, nextLat, nextLon);

  let prevBearing = initialBearing;
  let accumDist = 0;
  let segmentAccum = 0;
  const SAMPLE_INTERVAL = 30; // meters between bearing samples
  const TURN_ANGLE_THRESHOLD = 35; // degrees to consider a turn

  for (let i = startIdx + 1; i < geometry.length - 1; i++) {
    const [lon1, lat1] = geometry[i];
    const [lon2, lat2] = geometry[i + 1];
    const segDist = haversineDistance(lat1, lon1, lat2, lon2);
    accumDist += segDist;
    segmentAccum += segDist;

    // Only sample bearing at intervals
    if (segmentAccum < SAMPLE_INTERVAL) continue;
    segmentAccum = 0;

    const bearing = calculateBearing(lat1, lon1, lat2, lon2);

    if (prevBearing !== null) {
      const angleDiff = normalizeAngle(bearing - prevBearing);

      if (Math.abs(angleDiff) > TURN_ANGLE_THRESHOLD) {
        // Found a significant direction change
        let direction: TurnDirection;
        const absAngle = Math.abs(angleDiff);

        if (absAngle > 150) {
          direction = 'uturn';
        } else if (angleDiff > 80) {
          direction = 'right';
        } else if (angleDiff > TURN_ANGLE_THRESHOLD) {
          direction = 'slight-right';
        } else if (angleDiff < -80) {
          direction = 'left';
        } else {
          direction = 'slight-left';
        }

        return {
          direction,
          distanceToTurnM: accumDist,
          distanceToFinishM,
        };
      }
    }

    prevBearing = bearing;

    // Don't look further than 2km ahead
    if (accumDist > 2000) break;
  }

  // No turn found ahead, just continue straight
  return {
    direction: 'straight',
    distanceToTurnM: 0,
    distanceToFinishM,
  };
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} ${t('general.km')}`;
  }
  return `${Math.round(meters)} ${t('general.m')}`;
}

interface NavArrowProps {
  geometry?: [number, number][] | null;
}

export default function NavArrow({ geometry: externalGeometry }: NavArrowProps = {}) {
  const { isNavigating, isRerouting, remainingDistance, route, currentLat, currentLon, _remoteRouteGeometry } =
    useNavigationStore();

  // Use external geometry (overlay), remote geometry (synced), or local route geometry
  const geometry = externalGeometry ?? _remoteRouteGeometry ?? route?.geometry ?? null;

  const turnInfo = useMemo(() => {
    if (
      !isNavigating ||
      !geometry ||
      geometry.length < 2 ||
      currentLat === null ||
      currentLon === null
    ) {
      return null;
    }
    return getNextTurnInfo(geometry, currentLat, currentLon);
  }, [isNavigating, geometry, currentLat, currentLon]);

  if (!isNavigating) return null;

  // ── Rerouting indicator ──
  if (isRerouting) {
    return (
      <div className="glass rounded-xl px-5 py-3 flex items-center gap-3 nav-glow border border-yellow-500/30">
        <RefreshCw className="w-6 h-6 text-yellow-400 animate-spin" />
        <span className="font-semibold text-sm text-yellow-400">{t('nav.rerouting')}</span>
      </div>
    );
  }

  // Determine direction
  let direction: TurnDirection = 'straight';
  let displayDistance = remainingDistance;
  let instructionText: string;
  let isArriving = false;

  if (turnInfo) {
    direction = turnInfo.direction;

    if (turnInfo.distanceToFinishM < 50 && turnInfo.distanceToFinishM > 0) {
      isArriving = true;
      instructionText = t('nav.arrived');
      displayDistance = turnInfo.distanceToFinishM;
    } else if (turnInfo.distanceToTurnM > 0) {
      // There's a turn ahead, show distance to that turn
      displayDistance = turnInfo.distanceToTurnM;
      const turnKey = getTurnTranslationKey(direction);
      instructionText = t(turnKey);
    } else {
      // No turn ahead, show remaining distance to finish
      displayDistance = remainingDistance;
      instructionText = t('nav.continue');
    }
  } else {
    // Fallback when no turn info available
    instructionText = t('nav.continue');
  }

  const distText = formatDistance(displayDistance);

  const DirectionIcon =
    direction === 'left'
      ? ArrowLeft
      : direction === 'right'
        ? ArrowRight
        : direction === 'uturn'
          ? Undo2
          : direction === 'slight-left'
            ? ArrowUpLeft
            : direction === 'slight-right'
              ? ArrowUpRight
              : ArrowUp;

  return (
    <div className="glass rounded-xl px-5 py-3 flex items-center gap-3 nav-glow">
      <div className="flex flex-col items-center text-[#00FF88]">
        <DirectionIcon className="w-8 h-8" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col">
        <span
          className={`font-semibold text-sm leading-tight ${
            isArriving ? 'text-[#00FF88]' : 'text-foreground'
          }`}
        >
          {instructionText}
        </span>
        <span className="text-[#00FF88] text-xs font-medium">{distText}</span>
      </div>
    </div>
  );
}

function getTurnTranslationKey(direction: TurnDirection): string {
  switch (direction) {
    case 'left':
      return 'nav.turnLeft';
    case 'right':
      return 'nav.turnRight';
    case 'slight-left':
      return 'nav.slightLeft';
    case 'slight-right':
      return 'nav.slightRight';
    case 'uturn':
      return 'nav.uturn';
    case 'straight':
    default:
      return 'nav.continue';
  }
}
