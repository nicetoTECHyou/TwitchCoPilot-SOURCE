import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GripHorizontal } from 'lucide-react';

const STORAGE_KEY = 'twitch-copilot-layout';

interface Position {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

interface DraggableWrapperProps {
  id: string;
  defaultPosition?: Position;
  editMode?: boolean;
  children: React.ReactNode;
  className?: string;
  zIndex?: number;
}

function getStoredPosition(id: string): Position | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const all = JSON.parse(stored);
    return all[id] || null;
  } catch {
    return null;
  }
}

function setStoredPosition(id: string, pos: Position) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) : {};
    all[id] = pos;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function getSidebarWidth(): number {
  try {
    const v = parseInt(localStorage.getItem('twitch-copilot-sidebar-width') || '', 10);
    if (v >= 280 && v <= 800) return v;
  } catch {}
  return 420;
}

function isDesktop(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
}

function clampPosition(pos: Position, elW: number, elH: number): Position {
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;
  const w = Math.min(elW, vpW);
  const h = Math.min(elH, vpH);
  const clamped: Position = {};
  const minLeft = isDesktop() ? getSidebarWidth() + 8 : 0;

  if (pos.top !== undefined) {
    clamped.top = Math.max(0, Math.min(pos.top, vpH - h));
  }
  if (pos.bottom !== undefined) {
    clamped.bottom = Math.max(0, Math.min(pos.bottom, vpH - h));
  }
  if (pos.left !== undefined) {
    clamped.left = Math.max(minLeft, Math.min(pos.left, vpW - w));
  }
  if (pos.right !== undefined) {
    clamped.right = Math.max(0, Math.min(pos.right, vpW - w));
  }
  return clamped;
}

export function DraggableWrapper({
  id,
  defaultPosition,
  editMode = false,
  children,
  className = '',
  zIndex = 40,
}: DraggableWrapperProps) {
  const [position, setPosition] = useState<Position>(() => {
    return getStoredPosition(id) || defaultPosition || {};
  });
  const isDraggingRef = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const elRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // Compute style from position object
  // CRITICAL FIX v4.2.0: Container must shrink to content (no ghost bounding box)
  // - width/height: 'fit-content' ensures container follows child size
  // - min-width/min-height: 'auto' prevents minimum size from blocking edge movement
  // - border/outline/boxShadow always 'none' when NOT in editMode to prevent
  //   visible colored borders (pink/blue/ring) from persisting after edit mode exits
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: editMode ? Math.max(zIndex, 110) : zIndex,
    ...position,
    width: 'fit-content',
    height: 'fit-content',
    minWidth: 'auto',
    minHeight: 'auto',
    maxWidth: 'calc(100vw - 8px)',
    maxHeight: 'calc(100vh - 8px)',
    outline: 'none',
    border: 'none',
    boxShadow: 'none',
    overflow: 'visible',
    padding: 0,
    margin: 0,
  };

  // Reset to default position
  const resetPosition = useCallback(() => {
    const def = defaultPosition || {};
    setPosition(def);
    setStoredPosition(id, def);
  }, [id, defaultPosition]);

  // Clamp position on window resize so panels never go off-screen
  useEffect(() => {
    const onResize = () => {
      const el = elRef.current;
      if (!el) return;
      // Force layout recalculation to get actual size after scale
      const rect = el.getBoundingClientRect();
      const w = rect.width || 200;
      const h = rect.height || 50;
      const clamped = clampPosition(position, w, h);
      setPosition(clamped);
      setStoredPosition(id, clamped);
    };
    window.addEventListener('resize', onResize);
    // Also clamp once on mount (e.g. stored pos from larger screen)
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [position, id]);

  // Set up drag using native pointer events (mouse + touch) on the handle element
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const getPointerPos = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if ('changedTouches' in e && e.changedTouches.length > 0) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      }
      return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    };

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!editMode) return;
      e.preventDefault();
      e.stopPropagation();

      const el = elRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const pos = getPointerPos(e);
      dragOffset.current = {
        x: pos.x - rect.left,
        y: pos.y - rect.top,
      };
      isDraggingRef.current = true;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();

      const pos = getPointerPos(e);
      const newLeft = pos.x - dragOffset.current.x;
      const newTop = pos.y - dragOffset.current.y;
      const vpW = window.innerWidth;
      const vpH = window.innerHeight;

      const el = elRef.current;
      const elW = el ? el.getBoundingClientRect().width : 200;
      const elH = el ? el.getBoundingClientRect().height : 50;
      const minLeft = isDesktop() ? getSidebarWidth() + 8 : 0;
      const clampedLeft = Math.max(minLeft, Math.min(newLeft, vpW - elW));
      const clampedTop = Math.max(0, Math.min(newTop, vpH - elH));

      const newPos: Position = { top: clampedTop, left: clampedLeft };
      setPosition(newPos);
    };

    const onPointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const el = elRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const finalPos: Position = { top: rect.top, left: rect.left };
        setPosition(finalPos);
        setStoredPosition(id, finalPos);
      }
    };

    // Attach to handle: mousedown + touchstart
    handle.addEventListener('mousedown', onPointerDown);
    handle.addEventListener('touchstart', onPointerDown, { passive: false });

    // Attach to document: mousemove/touchmove + mouseup/touchend
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);
    document.addEventListener('touchcancel', onPointerUp);

    return () => {
      handle.removeEventListener('mousedown', onPointerDown);
      handle.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchend', onPointerUp);
      document.removeEventListener('touchcancel', onPointerUp);
    };
  }, [editMode, id]);

  return (
    <div
      ref={elRef}
      style={style}
      className={`${className} ${editMode ? 'ring-2 ring-dashed ring-primary/50 rounded-lg' : 'rounded-none'}`}
    >
      {/* Edit mode: drag handle bar */}
      {editMode && (
        <div
          ref={handleRef}
          className="relative z-10 flex items-center justify-between px-2 py-1.5 bg-primary/20 rounded-t-lg cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal className="w-3.5 h-3.5 text-primary/70" />
            <span className="text-[10px] text-primary font-mono font-semibold">{id}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); resetPosition(); }}
            className="text-[10px] text-muted-foreground hover:text-danger transition-colors px-1"
            title="Reset position"
          >
            ✕
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
