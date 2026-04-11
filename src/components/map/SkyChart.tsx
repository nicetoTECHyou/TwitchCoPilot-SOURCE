import { useEffect, useRef, useCallback, useState } from 'react';
import { computeSky, type SkyData, type HorizontalCoord } from '@/lib/astronomy';
import { mapInstanceRef } from './MapContainer';

/**
 * SkyChart — Canvas-based star map rendered as an overlay on the map.
 * Shows: stars, constellation lines, planets, moon, compass.
 * Uses azimuthal projection centered on the zenith.
 * Coordinates are taken from the map center (viewport), so panning
 * the map changes which area's sky is displayed.
 */
export default function SkyChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const lastCenterRef = useRef<{ lat: number; lon: number } | null>(null);
  const skyCacheRef = useRef<SkyData | null>(null);

  // Track map center for location-based sky computation
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({ lat: 52.52, lon: 13.38 });

  // Listen for map move events to update center
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Get initial center
    const c = map.getCenter();
    setMapCenter({ lat: c.lat, lon: c.lng });

    const onUpdate = () => {
      const c = map.getCenter();
      setMapCenter({ lat: c.lat, lon: c.lng });
    };

    map.on('moveend', onUpdate);
    // Also update during drag for responsiveness
    map.on('move', onUpdate);

    return () => {
      map.off('moveend', onUpdate);
      map.off('move', onUpdate);
    };
  }, []);

  const lat = mapCenter.lat;
  const lon = mapCenter.lon;

  const draw = useCallback((sky: SkyData, w: number, h: number, ctx: CanvasRenderingContext2D) => {
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 20;

    // Clear canvas — transparent so dark map shows through
    ctx.clearRect(0, 0, w, h);

    // Semi-transparent dark background for the chart circle area
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    bgGrad.addColorStop(0, 'rgba(6, 8, 22, 0.88)');
    bgGrad.addColorStop(0.85, 'rgba(4, 6, 16, 0.92)');
    bgGrad.addColorStop(1, 'rgba(2, 4, 12, 0.95)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Horizon circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(100, 140, 200, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    // Azimuthal projection: center = zenith, edge = horizon
    // N(0°) at top, S(180°) at bottom, E(90°) at right, W(270°) at left
    const project = (alt: number, az: number): [number, number] => {
      const r = radius * (1 - alt / 90);
      const azRad = az * Math.PI / 180;
      return [cx + r * Math.sin(azRad), cy - r * Math.cos(azRad)];
    };

    // Day/night factor for star brightness
    const isDark = sky.sunAlt < 0;
    const isTwilight = sky.sunAlt >= 0 && sky.sunAlt < 12;
    const starAlpha = isDark ? 1 : Math.max(0, 1 + sky.sunAlt / 12);
    // Show constellations during night + twilight (sunAlt < 12)
    const showConstellations = sky.sunAlt < 12;

    // Milky Way band (simplified) — only at night
    if (isDark) {
      ctx.save();
      ctx.globalAlpha = 0.06 * starAlpha;
      for (let i = -30; i <= 30; i += 5) {
        const pts: [number, number][] = [];
        for (let az = 0; az < 360; az += 10) {
          const mwAlt = 30 + i + 8 * Math.sin((az + 60) * Math.PI / 180);
          if (mwAlt > 0 && mwAlt < 90) {
            pts.push(project(mwAlt, az));
          }
        }
        if (pts.length > 2) {
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (const p of pts) ctx.lineTo(p[0], p[1]);
          ctx.strokeStyle = '#8888cc';
          ctx.lineWidth = 12;
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Constellation lines — show during night and twilight
    if (showConstellations) {
      ctx.save();
      ctx.globalAlpha = isDark ? 0.35 : 0.15;
      ctx.strokeStyle = '#4466aa';
      ctx.lineWidth = 1;

      const starMap = new Map(sky.stars.map(s => [s.name, s]));
      for (const con of sky.constellations) {
        for (const [nameA, nameB] of con.pairs) {
          const sA = starMap.get(nameA);
          const sB = starMap.get(nameB);
          if (sA && sB && sA.alt > 0 && sB.alt > 0) {
            const [xA, yA] = project(sA.alt, sA.az);
            const [xB, yB] = project(sB.alt, sB.az);
            ctx.beginPath();
            ctx.moveTo(xA, yA);
            ctx.lineTo(xB, yB);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // Stars
    for (const star of sky.stars) {
      if (star.alt < 0) continue;
      const [x, y] = project(star.alt, star.az);
      const dimFactor = Math.min(1, star.alt / 10);
      const alpha = starAlpha * dimFactor;
      const size = Math.max(0.5, 3.5 - star.mag * 0.7);

      // Glow for bright stars
      if (star.mag < 1.5 && isDark) {
        ctx.save();
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        ctx.fillStyle = '#aabbff';
        ctx.fill();
        ctx.restore();
      }

      // Star dot
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      if (star.mag < 1) {
        ctx.fillStyle = '#eef4ff';
      } else if (star.mag < 2) {
        ctx.fillStyle = '#dde6f8';
      } else {
        ctx.fillStyle = '#c8d0e0';
      }
      ctx.fill();
      ctx.restore();

      // Star names for brightest — always show when constellations visible
      if (star.mag < 0.5 && showConstellations) {
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = '#8899cc';
        ctx.font = '10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(star.name, x + size + 3, y + 3);
        ctx.restore();
      }
    }

    // Planets
    for (const planet of sky.planets) {
      if (planet.alt < 0) continue;
      const [x, y] = project(planet.alt, planet.az);

      ctx.save();
      ctx.globalAlpha = 0.4 * starAlpha;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = planet.color;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = starAlpha;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = planet.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.85 * starAlpha;
      ctx.fillStyle = planet.color;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(planet.name, x + 8, y + 4);
      ctx.restore();
    }

    // Moon
    if (sky.moon.alt > -5) {
      const [mx, my] = project(Math.max(0, sky.moon.alt), sky.moon.az);
      const moonAlpha = sky.moon.alt > 0 ? starAlpha : 0.3;

      ctx.save();
      ctx.globalAlpha = moonAlpha * 0.2;
      ctx.beginPath();
      ctx.arc(mx, my, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffcc';
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = moonAlpha;
      ctx.beginPath();
      ctx.arc(mx, my, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffdd';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,200,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (sky.moon.phase > 0.01 && sky.moon.phase < 0.99) {
        ctx.beginPath();
        const phase = sky.moon.phase;
        if (phase <= 0.5) {
          const xOffset = 12 * Math.cos(phase * 2 * Math.PI);
          ctx.beginPath();
          ctx.arc(mx, my, 12, -Math.PI / 2, Math.PI / 2, false);
          ctx.ellipse(mx, my, Math.abs(xOffset), 12, 0, Math.PI / 2, -Math.PI / 2, phase > 0.25);
        } else {
          const xOffset = 12 * Math.cos(phase * 2 * Math.PI);
          ctx.beginPath();
          ctx.arc(mx, my, 12, Math.PI / 2, -Math.PI / 2, false);
          ctx.ellipse(mx, my, Math.abs(xOffset), 12, 0, -Math.PI / 2, Math.PI / 2, phase < 0.75);
        }
        ctx.fillStyle = 'rgba(5, 8, 20, 0.85)';
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = moonAlpha * 0.8;
      ctx.fillStyle = '#ffffcc';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Mond', mx, my + 24);
      ctx.restore();
    }

    ctx.restore(); // restore clip

    // Compass labels (outside the circle)
    ctx.save();
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labels = [
      { text: 'N', az: 0 },
      { text: 'O', az: 90 },
      { text: 'S', az: 180 },
      { text: 'W', az: 270 },
    ];
    for (const l of labels) {
      const [lx, ly] = project(0, l.az);
      const dist = Math.sqrt((lx - cx) ** 2 + (ly - cy) ** 2);
      const nx = cx + (lx - cx) / dist * (radius + 16);
      const ny = cy + (ly - cy) / dist * (radius + 16);
      ctx.fillStyle = l.text === 'N' ? '#ff6666' : 'rgba(180, 200, 240, 0.7)';
      ctx.fillText(l.text, nx, ny);
    }
    ctx.restore();

    // Zenith marker
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100, 140, 200, 0.3)';
    ctx.fill();
    ctx.restore();

    // Info overlay — top left
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(6, 8, 22, 0.9)';
    const boxPad = 8;
    const boxH = 70;
    const boxW = 195;
    ctx.beginPath();
    ctx.roundRect(boxPad, boxPad, boxW, boxH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 140, 200, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#8899cc';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lstH = Math.floor(sky.siderealTime);
    const lstM = Math.floor((sky.siderealTime - lstH) * 60);
    ctx.fillText(`Sternzeit: ${lstH}h ${lstM}m`, boxPad + 10, boxPad + 8);
    ctx.fillText(`Sonne: ${sky.sunAlt > 0 ? '↑ Tag' : '↓ Nacht'}`, boxPad + 10, boxPad + 22);
    ctx.fillText(`Mond: ${sky.moon.ageDays.toFixed(1)}d (${Math.round(sky.moon.illumination * 100)}%)`, boxPad + 10, boxPad + 36);
    ctx.fillStyle = '#667799';
    ctx.fillText(`${Number(lat).toFixed(2)}°N ${Number(lon).toFixed(2)}°E`, boxPad + 10, boxPad + 52);
    ctx.restore();

    // "Sternkarte" watermark bottom-right
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#8899cc';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('✦ Sternkarte', w - 12, h - 12);
    ctx.restore();
  }, [lat, lon]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mounted = true;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const getSky = (): SkyData => {
      // Check if center changed (map panned) — recompute immediately
      const centerKey = `${Number(lat).toFixed(4)}_${Number(lon).toFixed(4)}`;
      const prevKey = lastCenterRef.current ? `${Number(lastCenterRef.current.lat).toFixed(4)}_${Number(lastCenterRef.current.lon).toFixed(4)}` : '';
      const now = Date.now();
      const timeExpired = now - lastUpdateRef.current > 30000;

      if (!skyCacheRef.current || centerKey !== prevKey || timeExpired) {
        skyCacheRef.current = computeSky(lat, lon, new Date());
        lastCenterRef.current = { lat, lon };
        lastUpdateRef.current = now;
      }
      return skyCacheRef.current;
    };

    const render = () => {
      if (!mounted) return;
      resize();
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const sky = getSky();
      draw(sky, w, h, ctx);
      animRef.current = requestAnimationFrame(render);
    };

    // Initial render immediately
    resize();
    skyCacheRef.current = null; // force recompute
    lastUpdateRef.current = 0;
    render();

    window.addEventListener('resize', resize);

    return () => {
      mounted = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [lat, lon, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none', zIndex: 1, pointerEvents: 'none' }}
    />
  );
}
