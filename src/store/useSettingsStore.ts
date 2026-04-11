import { create } from 'zustand';
import type { AppSettings } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'de',
  theme: 'twitch',
  darkMode: true,
  voiceEnabled: true,
  voiceVolume: 80,
  voiceRate: 1.0,
  selectedVoice: '',
  selectedVoiceLang: '',
  ttsVerbosity: 'compact' as const,
  mapStyle: 'street',
  routeProfile: 'trekking',
  twitchChannel: '',
  twitchBotName: '',
  twitchToken: '',
  autoConnect: false,
  commandPrefix: '!',
  cooldown: 30,
  maxPerUser: 3,
  maxTotal: 20,
  badWordFilter: true,
  addressValidation: true,
  maxChars: 100,
  autoApprove: true,
  weatherCollapsed: false,
  showDriveInfo: true,
  showWeather: true,
  showPOIShortcuts: true,
  showNavArrow: true,
  showChat: true,
  showVoting: true,
  // Map overlays
  showRouteLine: true,
  showAltRoutes: true,
  showPOIMarkers: true,
  showWaypoints: true,
  showDrivenPath: true,
  showHillshade: false,
  // Overlay element sizes
  overlaySpeedSize: 100,
  overlayRouteInfoSize: 100,
  overlayWeatherSize: 100,
  overlayChatSize: 100,
  overlayVotingSize: 100,
  overlayProgressBarSize: 100,
  // Overlay minimap
  showOverlayMap: false,
  overlayMapSize: 100,
  // Follow-Cam (3D Navigation Camera)
  followCamEnabled: false,
  followCamPitch: 50,
  followCamZoom: 16,
};

interface SettingsState extends AppSettings {
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  
  updateSetting: (key, value) => {
    set({ [key]: value });
    try { localStorage.setItem('twitch-copilot-settings', JSON.stringify(get())); } catch {}
  },
  
  resetSettings: () => {
    set(DEFAULT_SETTINGS);
    localStorage.setItem('twitch-copilot-settings', JSON.stringify(DEFAULT_SETTINGS));
  },
  
  exportSettings: () => {
    const current = { ...get() };
    const { updateSetting: _us, resetSettings: _rs, exportSettings: _es, importSettings: _is, ...data } = current as any;
    void _us; void _rs; void _es; void _is;
    return JSON.stringify(data, null, 2);
  },
  
  importSettings: (json) => {
    try {
      const data = JSON.parse(json);
      const valid = { ...DEFAULT_SETTINGS, ...data };
      set(valid);
      localStorage.setItem('twitch-copilot-settings', JSON.stringify(valid));
      return true;
    } catch { return false; }
  },
}));

// Load settings from localStorage on init
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('twitch-copilot-settings');
    if (saved) {
      const data = JSON.parse(saved);
      useSettingsStore.setState({ ...DEFAULT_SETTINGS, ...data });
    }
  } catch {}
}
