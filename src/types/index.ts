export interface Waypoint {
  id: string;
  lat: number;
  lon: number;
  name?: string;
  type: 'start' | 'via' | 'finish';
  address?: string;
}

export interface RouteInfo {
  distance: number;    // meters
  duration: number;    // seconds
  ascent: number;      // meters
  descent: number;     // meters
  geometry: [number, number][];  // [lon, lat][]
}

export interface POI {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: POICategory;
  address?: string;
  distance?: number;   // meters from current position
  tags?: Record<string, string>;
  description?: string;
  imageUrl?: string;
}

export type POICategory = 
  | 'charging' | 'camping' | 'sightseeing' | 'shopping' 
  | 'hardware' | 'fuel' | 'toilets' | 'wildcamping'
  | 'water' | 'bicycle_repair' | 'hospital' | 'pharmacy'
  | 'restaurant' | 'cafe' | 'shelter' | 'hostel';

export const POI_CATEGORY_CONFIG: Record<POICategory, { label: string; labelDE: string; icon: string; color: string }> = {
  charging: { label: 'Charging Station', labelDE: 'Ladesäule', icon: 'Zap', color: '#FFD700' },
  camping: { label: 'Camping', labelDE: 'Campingplatz', icon: 'Tent', color: '#27AE60' },
  sightseeing: { label: 'Sightseeing', labelDE: 'Sehenswürdigkeit', icon: 'Camera', color: '#9B59B6' },
  shopping: { label: 'Shopping', labelDE: 'Einkaufen', icon: 'ShoppingCart', color: '#E74C3C' },
  hardware: { label: 'Hardware Store', labelDE: 'Baumarkt', icon: 'Wrench', color: '#F39C12' },
  fuel: { label: 'Gas Station', labelDE: 'Tankstelle', icon: 'Fuel', color: '#E67E22' },
  toilets: { label: 'Public Toilets', labelDE: 'Öffentliche Toiletten', icon: 'DoorOpen', color: '#95A5A6' },
  wildcamping: { label: 'Wild Camping', labelDE: 'Wildcamping', icon: 'Trees', color: '#1ABC9C' },
  water: { label: 'Drinking Water', labelDE: 'Trinkwasser', icon: 'Droplets', color: '#3498DB' },
  bicycle_repair: { label: 'Bike Repair', labelDE: 'Fahrradwerkstatt', icon: 'Bike', color: '#FF7043' },
  hospital: { label: 'Hospital', labelDE: 'Krankenhaus', icon: 'Cross', color: '#E74C3C' },
  pharmacy: { label: 'Pharmacy', labelDE: 'Apotheke', icon: 'Pill', color: '#00D4AA' },
  restaurant: { label: 'Restaurant', labelDE: 'Restaurant', icon: 'UtensilsCrossed', color: '#D35400' },
  cafe: { label: 'Cafe', labelDE: 'Café', icon: 'Coffee', color: '#8D6E63' },
  shelter: { label: 'Shelter', labelDE: 'Schutzhütte', icon: 'Home', color: '#795548' },
  hostel: { label: 'Hostel', labelDE: 'Unterkunft', icon: 'Hotel', color: '#607D8B' },
};

export interface TwitchAlert {
  id: string;
  type: 'follow' | 'subscribe' | 'gifted_sub' | 'bits' | 'raid';
  message: string;
  ttsVoice?: string;
  ttsRate?: number;
  volume?: number;
  duration?: number;
  enabled: boolean;
  color?: string;
  soundUrl?: string;
}

export interface BotCommand {
  id: string;
  trigger: string;
  responses: string[];
  cooldown: number;
  accessLevel: 'everyone' | 'follower' | 'vip' | 'subscriber' | 'mod' | 'broadcaster';
  isActive: boolean;
  aliases: string[];
  isSystem?: boolean;
}

export interface BanRecord {
  id: string;
  username: string;
  reason: string;
  bannedBy: string;
  timestamp: number;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  username: string;
  displayName: string;
  color: string;
  message: string;
  timestamp: number;
  isAction: boolean;
}

export interface VoteSession {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;  // optionIndex -> count
  voters: Record<string, boolean>;
  startTime: number;
  duration: number;  // seconds
  isActive: boolean;
  winner?: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  weatherCode: number;
  humidity: number;
  precipitation: number;
  sunset?: string;
  sunrise?: string;
  isDay?: boolean;
}

export interface AppSettings {
  language: 'de' | 'en';
  theme: 'twitch' | 'cargo' | 'electric' | 'sunset' | 'pink';
  darkMode: boolean;
  voiceEnabled: boolean;
  voiceVolume: number;
  voiceRate: number;
  selectedVoice: string;
  selectedVoiceLang: string; // stored voice language code (e.g. 'zh', 'ja', 'de') for reliable detection without getVoices()
  ttsVerbosity: 'off' | 'beep' | 'compact' | 'full';
  mapStyle: 'street' | 'satellite' | 'topo' | 'dark' | 'stars';
  routeProfile: string;
  twitchChannel: string;
  twitchBotName: string;
  twitchToken: string;
  autoConnect: boolean;
  commandPrefix: string;
  cooldown: number;
  maxPerUser: number;
  maxTotal: number;
  badWordFilter: boolean;
  addressValidation: boolean;
  maxChars: number;
  autoApprove: boolean;
  weatherCollapsed: boolean;
  showDriveInfo: boolean;
  showWeather: boolean;
  showPOIShortcuts: boolean;
  showNavArrow: boolean;
  showChat: boolean;
  showVoting: boolean;
  // Map overlays
  showRouteLine: boolean;
  showAltRoutes: boolean;
  showPOIMarkers: boolean;
  showWaypoints: boolean;
  showDrivenPath: boolean;
  showHillshade: boolean;
  // Overlay element sizes (percentage, 50-200, default 100)
  overlaySpeedSize: number;
  overlayRouteInfoSize: number;
  overlayWeatherSize: number;
  overlayChatSize: number;
  overlayVotingSize: number;
  overlayProgressBarSize: number;
  // Overlay minimap
  showOverlayMap: boolean;
  overlayMapSize: number;
  // Follow-Cam (3D Navigation Camera)
  followCamEnabled: boolean;
  followCamPitch: number;
  followCamZoom: number;
}
