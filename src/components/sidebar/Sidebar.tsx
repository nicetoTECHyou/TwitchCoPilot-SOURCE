
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bike,
  Settings,
  MapPin,
  Navigation,
  MessageSquare,
  Menu,
  X,
  Sun,
  Moon,
  Languages,
  GripVertical,
} from 'lucide-react';
import { t, setLanguage } from '@/lib/i18n';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { applyThemeToDOM } from '@/App';
import { RouteTab } from './tabs/RouteTab';
import { POITab } from './tabs/POITab';
import { StreamerTab } from './tabs/StreamerTab';
import { SettingsPanel } from './SettingsPanel';

const SIDEBAR_WIDTH_KEY = 'twitch-copilot-sidebar-width';
const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 280;
const MAX_WIDTH = 800;

function loadWidth() {
  try {
    const v = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) || '', 10);
    if (v >= MIN_WIDTH && v <= MAX_WIDTH) return v;
  } catch {}
  return DEFAULT_WIDTH;
}

export function Sidebar() {
  const [activeTab, setActiveTab] = useState('route');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(loadWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );
  const { darkMode, language, updateSetting, theme } = useSettingsStore();
  const isNavigating = useNavigationStore((s) => s.isNavigating);
  const routeSelectionMode = useNavigationStore((s) => s.routeSelectionMode);
  const isCompact = routeSelectionMode && isDesktop;

  // Auto-close sidebar on mobile when navigation starts
  useEffect(() => {
    if (isNavigating && mobileOpen && !isDesktop) {
      setMobileOpen(false);
    }
  }, [isNavigating]);

  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Track desktop vs mobile via media query
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleDarkMode = () => {
    const newDark = !darkMode;
    updateSetting('darkMode', newDark);
    applyThemeToDOM(theme, newDark);
  };

  const toggleLanguage = () => {
    const newLang = language === 'de' ? 'en' : 'de';
    updateSetting('language', newLang);
    setLanguage(newLang);
    document.documentElement.lang = newLang;
  };

  // ── Resize drag (desktop) ──
  const onResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDesktop) return;
    e.preventDefault();
    const cx = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    startXRef.current = cx;
    startWidthRef.current = sidebarWidth;
    setIsResizing(true);

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const x = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      const delta = x - startXRef.current;
      setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta)));
    };

    const onUp = () => {
      setIsResizing(false);
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }, [isDesktop, sidebarWidth]);

  // Persist width
  useEffect(() => {
    if (isDesktop && !isResizing) {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
    }
  }, [isDesktop, isResizing, sidebarWidth]);

  // Prevent text selection while resizing
  useEffect(() => {
    if (isResizing) {
      const prev = document.body.style.userSelect;
      const prevCursor = document.body.style.cursor;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      return () => {
        document.body.style.userSelect = prev;
        document.body.style.cursor = prevCursor;
      };
    }
  }, [isResizing]);

  // ── Shared tab content JSX ──
  const tabContent = (
    <div className="flex-1 overflow-hidden mt-2 min-h-0 min-w-0">
      <div className={`h-full overflow-hidden ${activeTab === 'route' ? '' : 'hidden'}`}>
        <RouteTab />
      </div>
      <div className={`h-full overflow-hidden ${activeTab === 'poi' ? '' : 'hidden'}`}>
        <POITab />
      </div>
      <div className={`h-full overflow-hidden ${activeTab === 'chat' ? '' : 'hidden'}`}>
        <StreamerTab />
      </div>
      <div className={`h-full overflow-hidden ${activeTab === 'settings' ? '' : 'hidden'}`}>
        <SettingsPanel />
      </div>
    </div>
  );

  const tabBar = (
    <div className={`shrink-0 ${isCompact ? 'px-2 pt-3' : 'px-3 pt-3'}`}>
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v);
        if (routeSelectionMode) {
          useNavigationStore.getState().setRouteSelectionMode(false);
        }
      }} className="w-full">
        <TabsList className={`w-full h-9 bg-sidebar-foreground/10 rounded-lg p-1 ${isCompact ? 'flex-col gap-1' : ''}`}>
          <TabsTrigger value="route" className={`${isCompact ? 'flex-1 w-full' : 'flex-1'} gap-1 text-xs h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm`}>
            <Navigation className="size-3.5" />
            <span className={isCompact ? 'hidden' : (isDesktop ? 'hidden lg:inline' : '')}>{t('nav.navigate')}</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className={`${isCompact ? 'flex-1 w-full' : 'flex-1'} gap-1 text-xs h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm`}>
            <MessageSquare className="size-3.5" />
            <span className={isCompact ? 'hidden' : (isDesktop ? 'hidden md:inline' : '')}>{t('nav.chat')}</span>
          </TabsTrigger>
          <TabsTrigger value="poi" className={`${isCompact ? 'flex-1 w-full' : 'flex-1'} gap-1 text-xs h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm`}>
            <MapPin className="size-3.5" />
            <span className={isCompact ? 'hidden' : (isDesktop ? 'hidden md:inline' : '')}>{t('nav.poi')}</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className={`${isCompact ? 'flex-1 w-full' : 'flex-1'} gap-1 text-xs h-7 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm`}>
            <Settings className="size-3.5" />
            <span className={isCompact ? 'hidden' : (isDesktop ? 'hidden md:inline' : '')}>{t('settings.title')}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );

  const headerButtons = (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10" onClick={toggleLanguage} title="DE / EN">
        <Languages className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10" onClick={toggleDarkMode} title={darkMode ? t('general.off') : t('general.on')}>
        {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10" onClick={() => setMobileOpen(false)}>
        <X className="size-4" />
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button — always rendered for non-desktop, hidden on desktop via CSS */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-[60] bg-sidebar text-sidebar-foreground border border-sidebar-border rounded-lg shadow-lg md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      {/* Mobile backdrop */}
      {!isDesktop && mobileOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          h-full bg-sidebar text-sidebar-foreground
          border-r border-sidebar-border
          ${isDesktop
            ? 'flex flex-col shrink-0 relative'
            : mobileOpen
              ? 'fixed top-0 left-0 z-[80] w-screen h-full flex flex-col'
              : 'hidden'
          }
        `}
        style={isDesktop ? { width: isCompact ? 52 : sidebarWidth, minWidth: isCompact ? 52 : MIN_WIDTH, maxWidth: isCompact ? 52 : MAX_WIDTH, flexShrink: 0, transition: 'width 0.3s ease' } : undefined}
      >
        {/* Header */}
        <div className={`flex items-center justify-between shrink-0 ${isCompact ? 'p-2 px-2' : 'p-3 px-4'}`}>
          <div className="flex items-center gap-2">
            <div className={`rounded-lg bg-primary/20 flex items-center justify-center ${isCompact ? 'w-8 h-8' : 'w-8 h-8'}`}>
              <Bike className={`text-primary ${isCompact ? 'size-5' : 'size-5'}`} />
            </div>
            {!isCompact && <span className="font-bold text-lg tracking-tight">Twitch CoPilot</span>}
          </div>
          {!isCompact && headerButtons}
        </div>

        <Separator className="bg-sidebar-border" />

        {tabBar}
        {!isCompact && tabContent}

        {/* Resize handle — hidden in compact mode */}
        {!isCompact && (
        <div
          className="hidden md:flex absolute right-0 top-[50%] -translate-y-[50%] w-5 cursor-col-resize z-20 flex-col items-center justify-center rounded-l-md bg-sidebar-border/60 hover:bg-primary/40 active:bg-primary/60 transition-colors group -translate-x-1/2"
          onMouseDown={onResizeStart}
          onTouchStart={onResizeStart}
          title={t('map.resizeHint')}
        >
          <GripVertical className="size-5 text-sidebar-foreground/50 group-hover:text-white transition-colors" />
        </div>
        )}
      </aside>
    </>
  );
}
