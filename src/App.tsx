import { useEffect, useCallback, useState } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import ChatOverlay from '@/components/chat/ChatOverlay';
import VotingPanel from '@/components/chat/VotingPanel';
import DriveInfoPanel from '@/components/navigation/DriveInfoPanel';
import MuteButton from '@/components/navigation/MuteButton';
import WeatherWidget from '@/components/navigation/WeatherWidget';
import POIShortcuts from '@/components/navigation/POIShortcuts';
import NavArrow from '@/components/map/NavArrow';
import TwitchChatManager from '@/components/chat/TwitchChatManager';
import MapContainer, { mapInstanceRef } from '@/components/map/MapContainer';
import RouteSelectionOverlay from '@/components/map/RouteSelectionOverlay';
import OBSOverlayPage from '@/components/overlay/OBSOverlayPage';
import { DraggableWrapper } from '@/hooks/useDraggable';
import { useNavSyncSender, useSyncReceiver } from '@/hooks/useNavSync';
import { useAutoReroute } from '@/hooks/useAutoReroute';
import { useNavTTS } from '@/hooks/useNavTTS';
import { useLiveNavigation } from '@/hooks/useLiveNavigation';
import { OverlaySyncBadge } from '@/components/sync/SyncPanel';
import { peerSync } from '@/lib/peerSync';
import { useSyncStore } from '@/store/useSyncStore';
import { setLanguage, t } from '@/lib/i18n';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTwitchStore } from '@/store/useTwitchStore';
import { Plus, Minus, Compass, Pencil, Check } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Theme color definitions - dark and light variants
// Keys use --xxx (no --color- prefix) so @theme var(--xxx) resolves at runtime
const THEME_COLORS = {
  twitch: {
    dark: {
      '--background': 'oklch(0.12 0.02 270)',
      '--foreground': 'oklch(0.95 0 0)',
      '--muted': 'oklch(0.15 0.02 270)',
      '--muted-foreground': 'oklch(0.55 0.01 270)',
      '--popover': 'oklch(0.18 0.02 270)',
      '--popover-foreground': 'oklch(0.95 0 0)',
      '--card': 'oklch(0.14 0.02 270)',
      '--card-foreground': 'oklch(0.95 0 0)',
      '--input': 'oklch(0.25 0.02 270)',
      '--ring': 'oklch(0.55 0.01 270)',
      '--destructive': '#E74C3C',
      '--destructive-foreground': '#ffffff',
      '--primary': '#9146FF',
      '--primary-foreground': '#ffffff',
      '--accent': '#00D4AA',
      '--accent-foreground': '#000000',
      '--danger': '#E74C3C',
      '--warning': '#F39C12',
      '--success': '#27AE60',
      '--sidebar': 'oklch(0.15 0.02 270)',
      '--sidebar-foreground': 'oklch(0.95 0 0)',
      '--sidebar-border': 'oklch(0.25 0.02 270)',
      '--surface': 'oklch(0.18 0.02 270)',
      '--surface-foreground': 'oklch(0.95 0 0)',
      '--border': 'oklch(0.3 0.02 270)',
    },
    light: {
      '--background': 'oklch(0.97 0 0)',
      '--foreground': 'oklch(0.13 0.02 270)',
      '--muted': 'oklch(0.93 0 0)',
      '--muted-foreground': 'oklch(0.45 0.01 270)',
      '--popover': 'oklch(1.0 0 0)',
      '--popover-foreground': 'oklch(0.13 0.02 270)',
      '--card': 'oklch(0.97 0 0)',
      '--card-foreground': 'oklch(0.13 0.02 270)',
      '--input': 'oklch(0.85 0.01 270)',
      '--ring': 'oklch(0.45 0.01 270)',
      '--destructive': '#E74C3C',
      '--destructive-foreground': '#ffffff',
      '--primary': '#9146FF',
      '--primary-foreground': '#ffffff',
      '--accent': '#00D4AA',
      '--accent-foreground': '#000000',
      '--danger': '#E74C3C',
      '--warning': '#F39C12',
      '--success': '#27AE60',
      '--sidebar': 'oklch(0.97 0.005 270)',
      '--sidebar-foreground': 'oklch(0.13 0.02 270)',
      '--sidebar-border': 'oklch(0.88 0.01 270)',
      '--surface': 'oklch(0.98 0.005 270)',
      '--surface-foreground': 'oklch(0.13 0.02 270)',
      '--border': 'oklch(0.88 0.01 270)',
    },
  },
  cargo: {
    dark: {
      '--background': 'oklch(0.12 0.03 150)',
      '--foreground': 'oklch(0.95 0 0)',
      '--muted': 'oklch(0.15 0.02 150)',
      '--muted-foreground': 'oklch(0.55 0.01 150)',
      '--popover': 'oklch(0.18 0.02 150)',
      '--popover-foreground': 'oklch(0.95 0 0)',
      '--card': 'oklch(0.14 0.02 150)',
      '--card-foreground': 'oklch(0.95 0 0)',
      '--input': 'oklch(0.25 0.02 150)',
      '--ring': 'oklch(0.55 0.01 150)',
      '--destructive': '#E74C3C',
      '--destructive-foreground': '#ffffff',
      '--primary': '#00ff00',
      '--primary-foreground': '#000000',
      '--accent': '#00ff00',
      '--accent-foreground': '#000000',
      '--danger': '#E74C3C',
      '--warning': '#F39C12',
      '--success': '#27AE60',
      '--sidebar': 'oklch(0.15 0.02 150)',
      '--sidebar-foreground': 'oklch(0.95 0 0)',
      '--sidebar-border': 'oklch(0.25 0.02 150)',
      '--surface': 'oklch(0.18 0.02 150)',
      '--surface-foreground': 'oklch(0.95 0 0)',
      '--border': 'oklch(0.3 0.02 150)',
    },
    light: {
      '--background': 'oklch(0.97 0 0)',
      '--foreground': 'oklch(0.13 0.02 150)',
      '--muted': 'oklch(0.93 0 0)',
      '--muted-foreground': 'oklch(0.45 0.01 150)',
      '--popover': 'oklch(1.0 0 0)',
      '--popover-foreground': 'oklch(0.13 0.02 150)',
      '--card': 'oklch(0.97 0 0)',
      '--card-foreground': 'oklch(0.13 0.02 150)',
      '--input': 'oklch(0.85 0.01 150)',
      '--ring': 'oklch(0.45 0.01 150)',
      '--destructive': '#E74C3C',
      '--destructive-foreground': '#ffffff',
      '--primary': '#00ff00',
      '--primary-foreground': '#000000',
      '--accent': '#00ff00',
      '--accent-foreground': '#000000',
      '--danger': '#E74C3C',
      '--warning': '#F39C12',
      '--success': '#27AE60',
      '--sidebar': 'oklch(0.97 0.005 150)',
      '--sidebar-foreground': 'oklch(0.13 0.02 150)',
      '--sidebar-border': 'oklch(0.88 0.01 150)',
      '--surface': 'oklch(0.98 0.005 150)',
      '--surface-foreground': 'oklch(0.13 0.02 150)',
      '--border': 'oklch(0.88 0.01 150)',
    },
  },
  electric: {
    dark: {
      '--background': 'oklch(0.12 0.03 230)',
      '--foreground': 'oklch(0.95 0 0)',
      '--muted': 'oklch(0.15 0.02 230)',
      '--muted-foreground': 'oklch(0.55 0.01 230)',
      '--popover': 'oklch(0.18 0.02 230)',
      '--popover-foreground': 'oklch(0.95 0 0)',
      '--card': 'oklch(0.14 0.02 230)',
      '--card-foreground': 'oklch(0.95 0 0)',
      '--input': 'oklch(0.25 0.02 230)',
      '--ring': 'oklch(0.55 0.01 230)',
      '--destructive': '#E74C3C',
      '--destructive-foreground': '#ffffff',
      '--primary': '#00BFFF',
      '--primary-foreground': '#000000',
      '--accent': '#00BFFF',
      '--accent-foreground': '#000000',
      '--danger': '#E74C3C',
      '--warning': '#F39C12',
      '--success': '#27AE60',
      '--sidebar': 'oklch(0.15 0.02 230)',
      '--sidebar-foreground': 'oklch(0.95 0 0)',
      '--sidebar-border': 'oklch(0.25 0.02 230)',
      '--surface': 'oklch(0.18 0.02 230)',
      '--surface-foreground': 'oklch(0.95 0 0)',
      '--border': 'oklch(0.3 0.02 230)',
    },
    light: {
      '--background': 'oklch(0.97 0 0)',
      '--foreground': 'oklch(0.13 0.02 230)',
      '--muted': 'oklch(0.93 0 0)',
      '--muted-foreground': 'oklch(0.45 0.01 230)',
      '--popover': 'oklch(1.0 0 0)',
      '--popover-foreground': 'oklch(0.13 0.02 230)',
      '--card': 'oklch(0.97 0 0)',
      '--card-foreground': 'oklch(0.13 0.02 230)',
      '--input': 'oklch(0.85 0.01 230)',
      '--ring': 'oklch(0.45 0.01 230)',
      '--destructive': '#E74C3C',
      '--destructive-foreground': '#ffffff',
      '--primary': '#00BFFF',
      '--primary-foreground': '#000000',
      '--accent': '#00BFFF',
      '--accent-foreground': '#000000',
      '--danger': '#E74C3C',
      '--warning': '#F39C12',
      '--success': '#27AE60',
      '--sidebar': 'oklch(0.97 0.005 230)',
      '--sidebar-foreground': 'oklch(0.13 0.02 230)',
      '--sidebar-border': 'oklch(0.88 0.01 230)',
      '--surface': 'oklch(0.98 0.005 230)',
      '--surface-foreground': 'oklch(0.13 0.02 230)',
      '--border': 'oklch(0.88 0.01 230)',
    },
  },
  sunset: {
    dark: {
      '--background': 'oklch(0.12 0.03 40)',
      '--foreground': 'oklch(0.95 0 0)',
      '--muted': 'oklch(0.15 0.02 40)',
      '--muted-foreground': 'oklch(0.55 0.01 40)',
      '--popover': 'oklch(0.18 0.02 40)',
      '--popover-foreground': 'oklch(0.95 0 0)',
      '--card': 'oklch(0.14 0.02 40)',
      '--card-foreground': 'oklch(0.95 0 0)',
      '--input': 'oklch(0.25 0.02 40)',
      '--ring': 'oklch(0.55 0.01 40)',
      '--destructive': '#E74C3C',
      '--destructive-foreground': '#ffffff',
      '--primary': '#FF6B35',
      '--primary-foreground': '#ffffff',
      '--accent': '#FF6B35',
      '--accent-foreground': '#ffffff',
      '--danger': '#E74C3C',
      '--warning': '#F39C12',
      '--success': '#27AE60',
      '--sidebar': 'oklch(0.15 0.02 40)',
      '--sidebar-foreground': 'oklch(0.95 0 0)',
      '--sidebar-border': 'oklch(0.25 0.02 40)',
      '--surface': 'oklch(0.18 0.02 40)',
      '--surface-foreground': 'oklch(0.95 0 0)',
      '--border': 'oklch(0.3 0.02 40)',
    },
    light: {
      '--background': 'oklch(0.97 0 0)',
      '--foreground': 'oklch(0.13 0.02 40)',
      '--muted': 'oklch(0.93 0 0)',
      '--muted-foreground': 'oklch(0.45 0.01 40)',
      '--popover': 'oklch(1.0 0 0)',
      '--popover-foreground': 'oklch(0.13 0.02 40)',
      '--card': 'oklch(0.97 0 0)',
      '--card-foreground': 'oklch(0.13 0.02 40)',
      '--input': 'oklch(0.85 0.01 40)',
      '--ring': 'oklch(0.45 0.01 40)',
      '--destructive': '#E74C3C',
      '--destructive-foreground': '#ffffff',
      '--primary': '#FF6B35',
      '--primary-foreground': '#ffffff',
      '--accent': '#FF6B35',
      '--accent-foreground': '#ffffff',
      '--danger': '#E74C3C',
      '--warning': '#F39C12',
      '--success': '#27AE60',
      '--sidebar': 'oklch(0.97 0.005 40)',
      '--sidebar-foreground': 'oklch(0.13 0.02 40)',
      '--sidebar-border': 'oklch(0.88 0.01 40)',
      '--surface': 'oklch(0.98 0.005 40)',
      '--surface-foreground': 'oklch(0.13 0.02 40)',
      '--border': 'oklch(0.88 0.01 40)',
    },
  },
  pink: {
    dark: {
      '--background': 'oklch(0.12 0.03 330)',
      '--foreground': 'oklch(0.95 0 0)',
      '--muted': 'oklch(0.15 0.02 330)',
      '--muted-foreground': 'oklch(0.55 0.01 330)',
      '--popover': 'oklch(0.18 0.02 330)',
      '--popover-foreground': 'oklch(0.95 0 0)',
      '--card': 'oklch(0.14 0.02 330)',
      '--card-foreground': 'oklch(0.95 0 0)',
      '--input': 'oklch(0.25 0.02 330)',
      '--ring': 'oklch(0.55 0.01 330)',
      '--destructive': '#E74C3C',
      '--destructive-foreground': '#ffffff',
      '--primary': '#ff00ff',
      '--primary-foreground': '#ffffff',
      '--accent': '#ff00ff',
      '--accent-foreground': '#ffffff',
      '--danger': '#E74C3C',
      '--warning': '#F39C12',
      '--success': '#27AE60',
      '--sidebar': 'oklch(0.15 0.02 330)',
      '--sidebar-foreground': 'oklch(0.95 0 0)',
      '--sidebar-border': 'oklch(0.25 0.02 330)',
      '--surface': 'oklch(0.18 0.02 330)',
      '--surface-foreground': 'oklch(0.95 0 0)',
      '--border': 'oklch(0.3 0.02 330)',
    },
    light: {
      '--background': 'oklch(0.97 0 0)',
      '--foreground': 'oklch(0.13 0.02 330)',
      '--muted': 'oklch(0.93 0 0)',
      '--muted-foreground': 'oklch(0.45 0.01 330)',
      '--popover': 'oklch(1.0 0 0)',
      '--popover-foreground': 'oklch(0.13 0.02 330)',
      '--card': 'oklch(0.97 0 0)',
      '--card-foreground': 'oklch(0.13 0.02 330)',
      '--input': 'oklch(0.85 0.01 330)',
      '--ring': 'oklch(0.45 0.01 330)',
      '--destructive': '#E74C3C',
      '--destructive-foreground': '#ffffff',
      '--primary': '#ff00ff',
      '--primary-foreground': '#ffffff',
      '--accent': '#ff00ff',
      '--accent-foreground': '#ffffff',
      '--danger': '#E74C3C',
      '--warning': '#F39C12',
      '--success': '#27AE60',
      '--sidebar': 'oklch(0.97 0.005 330)',
      '--sidebar-foreground': 'oklch(0.13 0.02 330)',
      '--sidebar-border': 'oklch(0.88 0.01 330)',
      '--surface': 'oklch(0.98 0.005 330)',
      '--surface-foreground': 'oklch(0.13 0.02 330)',
      '--border': 'oklch(0.88 0.01 330)',
    },
  },
} as const;

type ThemeKey = keyof typeof THEME_COLORS;

function applyThemeToDOM(theme: string, darkMode: boolean) {
  const root = document.documentElement;
  const themeKey = (theme || 'twitch') as ThemeKey;
  const mode = darkMode ? 'dark' : 'light';
  const colors = THEME_COLORS[themeKey]?.[mode] || THEME_COLORS.twitch.dark;

  // Set each CSS variable directly as inline style (highest priority)
  for (const [varName, value] of Object.entries(colors)) {
    root.style.setProperty(varName, value);
  }

  // Also set data-theme and dark class for non-CSS-variable uses
  root.setAttribute('data-theme', theme);
  if (darkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export default function App() {
  const language = useSettingsStore((s) => s.language);
  const theme = useSettingsStore((s) => s.theme);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const twitchConnected = useTwitchStore((s) => s.connected);
  const showDriveInfo = useSettingsStore((s) => s.showDriveInfo);
  const showWeather = useSettingsStore((s) => s.showWeather);
  const showPOIShortcuts = useSettingsStore((s) => s.showPOIShortcuts);
  const showNavArrow = useSettingsStore((s) => s.showNavArrow);
  const showChat = useSettingsStore((s) => s.showChat);
  const showVoting = useSettingsStore((s) => s.showVoting);
  const overlaySpeedSize = useSettingsStore((s) => s.overlaySpeedSize);
  const overlayWeatherSize = useSettingsStore((s) => s.overlayWeatherSize);
  const overlayChatSize = useSettingsStore((s) => s.overlayChatSize);
  const overlayVotingSize = useSettingsStore((s) => s.overlayVotingSize);
  const [editMode, setEditMode] = useState(false);

  // Check if this is the OBS overlay
  const isOverlay = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('overlay') === 'true';

  useEffect(() => {
    setLanguage(language);
    document.documentElement.lang = language;
    applyThemeToDOM(theme, darkMode);
  }, [language, theme, darkMode]);

  const handleZoomIn = useCallback(() => mapInstanceRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapInstanceRef.current?.zoomOut(), []);
  const handleResetNorth = useCallback(() => {
    const map = mapInstanceRef.current;
    if (map) map.easeTo({ bearing: 0, pitch: 0, duration: 500 });
  }, []);

  // OBS Overlay mode — create PeerJS host + receive nav data
  useEffect(() => {
    if (!isOverlay) return;
    let destroyed = false;

    // Listen for connection events from peerSync
    const unsubConnected = peerSync.on('connected', () => {
      console.log('[App] OBS: Client connected via PeerJS');
      useSyncStore.getState().setConnected(true);
      useSyncStore.getState().setHost(true);
    });
    const unsubDisconnected = peerSync.on('disconnected', () => {
      console.log('[App] OBS: Client disconnected');
      if (!destroyed) {
        // Don't fully reset — keep the peerId so the code stays visible
        useSyncStore.getState().setConnected(false);
      }
    });
    const unsubError = peerSync.on('error', (msg) => {
      console.warn('[App] OBS: PeerJS error:', msg);
      if (!destroyed) {
        useSyncStore.getState().setError(String(msg));
      }
    });

    peerSync.createHost().then((id) => {
      if (!destroyed) useSyncStore.getState().setPeerId(id);
    }).catch((err) => {
      console.error('[App] Could not create sync host:', err);
      if (!destroyed) useSyncStore.getState().setError(String(err?.message || err));
    });

    return () => {
      destroyed = true;
      unsubConnected();
      unsubDisconnected();
      unsubError();
      peerSync.destroy();
      useSyncStore.getState().reset();
    };
  }, [isOverlay]);

  // Sync: receive data ONLY in overlay mode, send data ONLY in normal mode
  // This prevents the phone from receiving its own MQTT messages back (self-receive loop)
  useSyncReceiver(isOverlay);
  useNavSyncSender(!isOverlay);

  // Auto-rerouting + TTS navigation announcements + live navigation stats (main app only, not overlay)
  useAutoReroute();
  useNavTTS();
  useLiveNavigation();

  if (isOverlay) {
    return (
      <>
        <TwitchChatManager />
        <OBSOverlayPage />
        <OverlaySyncBadge />
      </>
    );
  }

  return (
    <ErrorBoundary>
    <div className="flex h-screen w-screen">
      <TwitchChatManager />
      <Sidebar />
      <main className="flex-1 relative bg-background">
        <MapContainer />
        <RouteSelectionOverlay />
        {showNavArrow && (
        <DraggableWrapper id="nav-arrow" editMode={editMode} defaultPosition={{ top: 16, left: 300 }} zIndex={50}>
          <NavArrow />
        </DraggableWrapper>
        )}

        {/* Top-left: Mute + Weather (shifted right on mobile to clear hamburger) */}
        {showWeather && (
        <DraggableWrapper id="mute-weather" editMode={editMode} defaultPosition={{ top: 16, left: 56 }}>
          <div className="flex flex-col gap-2" style={{ transform: `scale(${overlayWeatherSize / 100})`, transformOrigin: 'top left' }}>
            <MuteButton />
            <WeatherWidget />
          </div>
        </DraggableWrapper>
        )}

        {/* Top-right: POI shortcuts + Zoom controls (stacked vertically) */}
        <DraggableWrapper id="poi-zoom" editMode={editMode} defaultPosition={{ top: 16, right: 16 }}>
          <div className="flex flex-col items-end gap-2">
            {showPOIShortcuts && <POIShortcuts />}
            <div className="flex flex-row gap-1">
              <button
                onClick={handleZoomIn}
                className="glass rounded-lg w-9 h-9 flex items-center justify-center cursor-pointer hover:bg-foreground/10 transition-all active:scale-95"
                title={t('map.zoomIn')}
              >
                <Plus className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={handleZoomOut}
                className="glass rounded-lg w-9 h-9 flex items-center justify-center cursor-pointer hover:bg-foreground/10 transition-all active:scale-95"
                title={t('map.zoomOut')}
              >
                <Minus className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={handleResetNorth}
                className="glass rounded-lg w-9 h-9 flex items-center justify-center cursor-pointer hover:bg-foreground/10 transition-all active:scale-95"
                title={t('map.resetNorth')}
              >
                <Compass className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
        </DraggableWrapper>

        {/* Bottom-left: Speed display */}
        {showDriveInfo && (
        <DraggableWrapper id="drive-info" editMode={editMode} defaultPosition={{ bottom: 16, left: 16 }}>
          <div className="w-36 md:w-48" style={{ transform: `scale(${overlaySpeedSize / 100})`, transformOrigin: 'bottom left' }}>
            <DriveInfoPanel />
          </div>
        </DraggableWrapper>
        )}

        {/* Voting panel (above chat and speed) */}
        {showVoting && (
        <DraggableWrapper id="voting-panel" editMode={editMode} defaultPosition={{ bottom: 210, left: 16 }}>
          <div className="w-56 md:w-72 max-h-[280px] md:max-h-[320px] overflow-y-auto custom-scrollbar" style={{ transform: `scale(${overlayVotingSize / 100})`, transformOrigin: 'bottom left' }}>
            <VotingPanel />
          </div>
        </DraggableWrapper>
        )}

        {/* Bottom-right: Chat (hidden when not connected) */}
        {twitchConnected && showChat && (
          <DraggableWrapper id="chat-overlay" editMode={editMode} defaultPosition={{ bottom: 16, right: 16 }}>
            <div style={{ transform: `scale(${overlayChatSize / 100})`, transformOrigin: 'bottom right' }}>
              <ChatOverlay />
            </div>
          </DraggableWrapper>
        )}

        {/* Edit Mode Toggle */}
        <button
          onClick={() => setEditMode(!editMode)}
          className={`fixed glass rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-foreground/10 transition-all active:scale-95 ${editMode ? 'bottom-4 right-4 z-[200]' : 'bottom-4 right-4 z-[100]'}`}
          title={editMode ? t('layout.saveLayout') : t('layout.editLayout')}
        >
          {editMode ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Pencil className="w-4 h-4 text-foreground/70" />
          )}
          <span className="text-xs text-foreground/70">
            {editMode ? t('layout.save') : t('layout.layout')}
          </span>
        </button>
      </main>
    </div>
    </ErrorBoundary>
  );
}

// Export for use in other components (SettingsPanel, Sidebar)
export { applyThemeToDOM };
