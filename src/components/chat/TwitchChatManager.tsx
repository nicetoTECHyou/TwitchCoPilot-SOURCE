
import { useEffect, useRef, useCallback } from 'react';
import tmi from 'tmi.js';
import { useTwitchStore } from '@/store/useTwitchStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { t } from '@/lib/i18n';
import { ttsQueue } from '@/lib/ttsQueue';
import { fetchOverpass } from '@/lib/overpass';
import type { ChatMessage, VoteSession, BotCommand } from '@/types';

const BAD_WORDS_DE = ['arsch', 'fuck', 'shit', 'scheiße', 'miststück', 'hure', 'idiot', 'bastard', 'fick', 'hitler', 'nazi'];
const BAD_WORDS_EN = ['asshole', 'bitch', 'dick', 'cunt', 'nigger', 'retard', 'faggot', 'slut'];
const BAD_WORDS = [...BAD_WORDS_DE, ...BAD_WORDS_EN];

// Determine user access level from Twitch IRC tags
// IMPORTANT: tmi.js 1.8.5 parses badges into an OBJECT (e.g. {broadcaster: "1"})
// NOT a string — so we must use `in` operator, NOT .includes()
function getUserAccessLevel(tags: Record<string, any>): 'broadcaster' | 'mod' | 'vip' | 'subscriber' | 'follower' | 'everyone' {
  const userType = tags['user-type']; // 'mod', 'admin', 'global_mod', '' (broadcaster has no user-type, use badges)
  const badges = tags['badges']; // tmi.js 1.8.5: parsed OBJECT {broadcaster: "1", vip: "1"} or null

  // Helper: safely check if a badge exists regardless of format
  const hasBadge = (name: string): boolean => {
    if (!badges) return false;
    if (typeof badges === 'object') return name in badges;
    if (typeof badges === 'string') return badges.includes(name);
    return false;
  };

  if (hasBadge('broadcaster')) return 'broadcaster';
  if (userType === 'mod' || hasBadge('moderator')) return 'mod';
  if (userType === 'admin' || userType === 'global_mod') return 'mod'; // treat as mod
  if (hasBadge('vip')) return 'vip';
  if (hasBadge('subscriber') || hasBadge('founder')) return 'subscriber';
  return 'everyone'; // default: all other chat users are 'everyone'
}

// Check if user is exempt from cooldown (broadcaster, mod, vip)
function isCooldownExempt(tags: Record<string, any>): boolean {
  const level = getUserAccessLevel(tags);
  return level === 'broadcaster' || level === 'mod' || level === 'vip';
}

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

// Parse ETA string "HH:MM" or "MM" to total seconds
function parseEtaToSeconds(eta: string): number {
  if (!eta || eta === '--:--') return 0;
  const parts = eta.split(':');
  if (parts.length === 2) {
    return (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60;
  }
  return (parseInt(parts[0], 10) || 0) * 60;
}

// Default access levels for built-in commands
const COMMAND_ACCESS_LEVELS: Record<string, BotCommand['accessLevel']> = {
  help: 'everyone',
  version: 'everyone',
  rank: 'everyone',
  position: 'everyone',
  stats: 'everyone',
  route: 'everyone',
  wetter: 'everyone',
  poi: 'everyone',
  notfall: 'everyone',
  vote: 'everyone',       // creating votes
  tts: 'subscriber',      // TTS costs streamer voice time
  'tts-t': 'subscriber',  // TTS + translation
  translate: 'everyone',
  translator: 'everyone',
  übersetzer: 'everyone',
  navi: 'follower',       // waypoint suggestions
  sightseeing: 'everyone',
  camping: 'everyone',
  ladesaeule: 'everyone',
};

// Extended POI Overpass queries - supports all requested categories
const POI_OVERPASS_QUERIES: Record<string, string> = {
  ladesaeule: `[out:json][timeout:10];(node["amenity"="charging"]({{bbox}}););out body 5;`,
  camping: `[out:json][timeout:10];(node["tourism"="camp_site"]({{bbox}}););out body 5;`,
  sightseeing: `[out:json][timeout:10];(node["tourism"~"attraction|viewpoint|museum|artwork"]({{bbox}});node["historic"]({{bbox}}););out body 5;`,
  restaurant: `[out:json][timeout:10];(node["amenity"="restaurant"]({{bbox}}););out body 5;`,
  cafe: `[out:json][timeout:10];(node["amenity"="cafe"]({{bbox}}););out body 5;`,
  supermarket: `[out:json][timeout:10];(node["shop"="supermarket"]({{bbox}}););out body 5;`,
  fuel: `[out:json][timeout:10];(node["amenity"="fuel"]({{bbox}}););out body 5;`,
  water: `[out:json][timeout:10];(node["amenity"="drinking_water"]({{bbox}}););out body 5;`,
  hospital: `[out:json][timeout:10];(node["amenity"="hospital"]({{bbox}}););out body 5;`,
  bicycle_repair: `[out:json][timeout:10];(node["amenity"="bicycle_repair_station"]({{bbox}});shop["bicycle"="repair"]({{bbox}}););out body 5;`,
};

// POI label i18n key mapping
const POI_LABEL_KEYS: Record<string, string> = {
  ladesaeule: 'bot.poiCharging',
  camping: 'bot.poiCamping',
  sightseeing: 'bot.poiSightseeing',
  restaurant: 'bot.poiRestaurant',
  cafe: 'bot.poiCafe',
  supermarket: 'bot.poiSupermarket',
  fuel: 'bot.poiFuel',
  water: 'bot.poiWater',
  hospital: 'bot.poiHospital',
  bicycle_repair: 'bot.poiBikeRepair',
};

function getPoiLabel(category: string): string {
  return t(POI_LABEL_KEYS[category] || 'general.unknown');
}

// Weather code to i18n key mapping
const WEATHER_CODE_KEYS: Record<number, string> = {
  0: 'weather.clear',
  1: 'weather.mainlyClear',
  2: 'weather.partlyCloudy',
  3: 'weather.cloudy',
  45: 'weather.fog',
  48: 'weather.rimeFog',
  51: 'weather.lightDrizzle',
  53: 'weather.drizzle',
  55: 'weather.heavyDrizzle',
  61: 'weather.lightRain',
  63: 'weather.rain',
  65: 'weather.heavyRain',
  66: 'weather.freezingRain',
  67: 'weather.heavyFreezingRain',
  71: 'weather.lightSnow',
  73: 'weather.snow',
  75: 'weather.heavySnow',
  77: 'weather.snowGrains',
  80: 'weather.lightShowers',
  81: 'weather.showers',
  82: 'weather.heavyShowers',
  85: 'weather.lightSnowShowers',
  86: 'weather.snowShowers',
  95: 'weather.thunderstorm',
  96: 'weather.thunderstormHail',
  99: 'weather.severeThunderstorm',
};

function getWeatherDesc(code: number): string {
  return t(WEATHER_CODE_KEYS[code] || 'weather.unknown');
}

// All available command names for !help (descriptions use i18n keys)
const ALL_COMMANDS: Array<{ cmd: string; descKey: string }> = [
  { cmd: 'wetter', descKey: 'bot.cmdWeatherDesc' },
  { cmd: 'poi [Kategorie]', descKey: 'bot.cmdPoiDesc' },
  { cmd: 'navi [Adresse]', descKey: 'bot.cmdNaviDesc' },
  { cmd: 'position', descKey: 'bot.cmdPositionDesc' },
  { cmd: 'stats', descKey: 'bot.cmdStatsDesc' },
  { cmd: 'route', descKey: 'bot.cmdRouteDesc' },
  { cmd: 'notfall', descKey: 'bot.cmdEmergencyDesc' },
  { cmd: 'vote [Frage]', descKey: 'bot.cmdVoteDesc' },
  { cmd: 'vote start [Frage] | [Opt1] | [Opt2]', descKey: 'bot.cmdVoteMultiDesc' },
  { cmd: 'vote [Nummer]', descKey: 'bot.cmdVoteCastDesc' },
  { cmd: 'rank', descKey: 'bot.cmdRankDesc' },
  { cmd: 'tts <Text>', descKey: 'bot.cmdTtsDesc' },
  { cmd: 'tts-t <Text>', descKey: 'bot.cmdTtsTDesc' },
  { cmd: 'translate <Sprache> <Text>', descKey: 'bot.cmdTranslateDesc' },
  { cmd: 'version', descKey: 'bot.cmdVersionDesc' },
  { cmd: 'help', descKey: 'bot.cmdHelpDesc' },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function containsBadWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BAD_WORDS.some(w => lower.includes(w));
}

function filterBadWords(text: string): string {
  let filtered = text;
  for (const w of BAD_WORDS) {
    const regex = new RegExp(w, 'gi');
    filtered = filtered.replace(regex, '****');
  }
  return filtered;
}

export default function TwitchChatManager() {
  const clientRef = useRef<tmi.Client | null>(null);
  const cooldownsRef = useRef<Map<string, number>>(new Map());
  const userLimitsRef = useRef<Map<string, number>>(new Map());
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const voteTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Track command usage per user for !rank
  const userCommandCountsRef = useRef<Map<string, number>>(new Map());
  // Ref to always have the latest handleCommand — avoids stale closure in TMI message handler
  const handleCommandRef = useRef<((username: string, command: string, args: string[], tags: Record<string, any>) => Promise<void>) | undefined>(undefined);
  // Auto-translate mode: stores target language code (e.g. 'en') when active, null when off
  const autoTranslateLangRef = useRef<string | null>(null);

  const {
    connected, channel, botName, token, autoConnect,
    setConnected, addMessage, activeVote, setVote, commands,
    alerts, addPendingWaypoint,
  } = useTwitchStore();

  const {
    currentLat, currentLon, currentSpeed, remainingDistance,
    ascent, descent, eta, waypoints, route, isNavigating, isDemoMode,
    drivenPath,
  } = useNavigationStore();

  const {
    cooldown, maxPerUser, badWordFilter, commandPrefix,
    voiceEnabled, voiceVolume, voiceRate, selectedVoice, selectedVoiceLang, language: uiLanguage,
  } = useSettingsStore();

  // sendChat uses clientRef (a ref, always current) instead of `connected` state.
  // The `connected` state was causing a stale closure bug: when connect() runs,
  // connected=false is captured; after connection succeeds, the handler still sees false.
  // CRITICAL: Triple-guard to prevent sending when not connected:
  //   1. clientRef.current must exist (TMI client created)
  //   2. Store connected state must be true (setConnected was called)
  //   3. tmi.js client.connected must be true (actual IRC WebSocket state)
  // NOTE: channel is read from the store directly (NOT from closure) to avoid stale reference.
  // FIX v4.1.1: Guard 3 now uses strict boolean check (client.connected !== true)
  //   to prevent undefined/falsy values from blocking all messages.
  const sendChat = useCallback((message: string) => {
    const client = clientRef.current;
    // Guard 1: Client object must exist
    if (!client) {
      console.warn('[TwitchChatManager] sendChat BLOCKED: no client');
      return;
    }
    // Read channel from store at call-time to avoid stale closure
    const currentChannel = useTwitchStore.getState().channel;
    if (!currentChannel) {
      console.warn('[TwitchChatManager] sendChat BLOCKED: no channel configured');
      return;
    }
    // Guard 2: Store connected state must be true
    if (!useTwitchStore.getState().connected) {
      console.warn('[TwitchChatManager] sendChat BLOCKED: store.connected is false');
      return;
    }
    // Guard 3: tmi.js internal WebSocket must be connected.
    // FIX v4.1.2: tmi.js does NOT have a .connected property (despite type def).
    // client.connected is always undefined! Use _isConnected() instead,
    // which checks ws !== null && ws.readyState === 1.
    // NOTE: _isConnected is an internal method but it's the ONLY reliable
    // way to check the actual IRC WebSocket state in tmi.js 1.8.5.
    if (!client._isConnected()) {
      console.warn('[TwitchChatManager] sendChat BLOCKED: client._isConnected() returned false (IRC WebSocket not open)');
      return;
    }
    const target = currentChannel.startsWith('#') ? currentChannel : `#${currentChannel}`;
    console.log('[TwitchChatManager] sendChat →', target, '| msg:', message?.substring(0, 80));
    client.say(target, message).catch((err: any) => {
      console.error('[TwitchChatManager] sendChat FAILED:', err?.message || err, '| channel:', target, '| msg:', message?.substring(0, 60));
    });
  }, []);

  // Helper: Enqueue TTS for a chat message response
  const enqueueResponseTTS = useCallback((text: string) => {
    if (!voiceEnabled) return;
    ttsQueue.enqueue(text, {
      voice: useSettingsStore.getState().selectedVoice || undefined,
      rate: useSettingsStore.getState().voiceRate,
      volume: useSettingsStore.getState().voiceVolume,
      lang: useSettingsStore.getState().language === 'de' ? 'de-DE' : 'en-US',
    });
  }, [voiceEnabled]);

  // Helper: Enqueue TTS for system events (sub, raid, bits, cheer)
  const enqueueEventTTS = useCallback((text: string) => {
    // Check if alerts are configured for this event type
    ttsQueue.enqueue(text, {
      voice: useSettingsStore.getState().selectedVoice || undefined,
      rate: useSettingsStore.getState().voiceRate,
      volume: useSettingsStore.getState().voiceVolume,
      lang: useSettingsStore.getState().language === 'de' ? 'de-DE' : 'en-US',
    });
  }, []);

  // Overpass API helper with retry + fallback
  const searchOverpass = useCallback(async (queryTemplate: string, lat: number, lon: number) => {
    const r = 0.01;
    const bbox = `${lat - r},${lon - r},${lat + r},${lon + r}`;
    const query = queryTemplate.replace('{{bbox}}', bbox);
    try {
      const data = await fetchOverpass(query, 15000);
      return (data.elements || []).slice(0, 5).map((el: any) => ({
        name: el.tags?.name || el.tags?.amenity || t('bot.unknown'),
        lat: el.lat,
        lon: el.lon,
        type: el.tags?.amenity || el.tags?.tourism || '',
      }));
    } catch {
      return [];
    }
  }, []);

  // Fetch weather from Open-Meteo API
  const fetchWeather = useCallback(async (lat: number, lon: number): Promise<string | null> => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const cw = data.current_weather;
      const desc = getWeatherDesc(cw.weathercode);
      return t('bot.weatherResponse', { temp: cw.temperature, desc, wind: cw.windspeed });
    } catch {
      return null;
    }
  }, []);

  // Geocode address using Nominatim
  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lon: number; displayName: string } | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Twitch-CoPilot/2.0' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.length === 0) return null;
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    } catch {
      return null;
    }
  }, []);

  // Handle command processing
  const handleCommand = useCallback(async (
    username: string,
    command: string,
    args: string[],
    tags: Record<string, any>
  ) => {
    const now = Date.now();
    const userAccessLevel = getUserAccessLevel(tags);
    console.log('[TwitchChatManager] handleCommand called:', { username, command, args, cooldown, maxPerUser, now, userAccessLevel });

    // Check cooldown — exempt for broadcaster, mod, vip
    if (!isCooldownExempt(tags)) {
      const lastUsed = cooldownsRef.current.get(username) || 0;
      if (now - lastUsed < cooldown * 1000) {
        console.log('[TwitchChatManager] Cooldown active for', username, '| remaining:', Math.ceil((cooldown * 1000 - (now - lastUsed)) / 1000), 's');
        sendChat(t('bot.cooldown', { user: username, time: Math.ceil((cooldown * 1000 - (now - lastUsed)) / 1000) }));
        return;
      }
      cooldownsRef.current.set(username, now);
    } else {
      console.log('[TwitchChatManager] Cooldown EXEMPT for', username, '(' + userAccessLevel + ')');
    }

    // Check user limit — exempt for broadcaster, mod, vip
    if (!isCooldownExempt(tags)) {
      const userCount = userLimitsRef.current.get(username) || 0;
      if (userCount >= maxPerUser) {
        console.log('[TwitchChatManager] Rate limit hit for', username, '| count:', userCount, '/ max:', maxPerUser);
        sendChat(t('bot.rateLimit', { user: username, max: maxPerUser }));
        return;
      }
      userLimitsRef.current.set(username, userCount + 1);
    }

    // Check if command is active (can be toggled in StreamerTab UI)
    const storeCmd = useTwitchStore.getState().commands.find(
      c => c.trigger === `!${command}` || (c.aliases && c.aliases.includes(`!${command}`))
    );
    if (storeCmd && !storeCmd.isActive) {
      console.log('[TwitchChatManager] Command', command, 'is DISABLED in UI, skipping');
      return;
    }

    // Check command access level (use store override if available, else default)
    const requiredLevel = storeCmd?.accessLevel || COMMAND_ACCESS_LEVELS[command];
    if (requiredLevel) {
      const userLevel = getUserAccessLevel(tags);
      const levelHierarchy = ['everyone', 'follower', 'vip', 'subscriber', 'mod', 'broadcaster'];
      const userIndex = levelHierarchy.indexOf(userLevel);
      const requiredIndex = levelHierarchy.indexOf(requiredLevel);
      if (userIndex < requiredIndex) {
        sendChat(t('bot.noPermission', { user: username, cmd: `${commandPrefix}${command}`, level: requiredLevel }));
        return;
      }
    }

    // Track command usage for !rank (excludes help itself to avoid inflation)
    if (command !== 'help') {
      const currentCount = userCommandCountsRef.current.get(username) || 0;
      userCommandCountsRef.current.set(username, currentCount + 1);
    }

    // Top-level error catch — no command error is ever silently swallowed
    try {
      switch (command) {
      // ── !version: Show build version (diagnostic) ──
      case 'version': {
        sendChat('🔧 TwitchCoPilot v4.2.1 — Build: 2026-04-11');
        console.log('[TwitchChatManager] !version handled, sendChat called');
        break;
      }

      // ── !wetter: Current weather ──
      case 'wetter': {
        if (currentLat === null || currentLon === null) {
          sendChat(t('bot.weatherNoGps'));
          break;
        }
        sendChat(t('bot.weatherLoading'));
        const weatherStr = await fetchWeather(currentLat, currentLon);
        if (weatherStr) {
          sendChat(weatherStr);
          enqueueResponseTTS(weatherStr);
        } else {
          sendChat(t('bot.weatherError'));
        }
        break;
      }

      // ── !poi [category]: Search POIs by category ──
      case 'poi': {
        if (currentLat === null || currentLon === null) {
          sendChat(t('bot.noGps'));
          break;
        }
        const category = (args[0] || '').toLowerCase();
        if (!category || !POI_OVERPASS_QUERIES[category]) {
          const available = Object.keys(POI_OVERPASS_QUERIES).join(', ');
          sendChat(t('bot.poiCategories', { cats: available }));
          break;
        }
        const label = getPoiLabel(category);
        sendChat(t('bot.poiSearching', { label }));
        const pois = await searchOverpass(POI_OVERPASS_QUERIES[category], currentLat, currentLon);
        if (pois.length > 0) {
          const top3 = pois.slice(0, 3);
          const list = top3.map((p: any, i: number) => `${i + 1}. ${p.name}`).join(' | ');
          sendChat(`📍 ${label}: ${list}`);
        } else {
          sendChat(t('bot.poiNoResults', { label }));
        }
        break;
      }

      // ── !navi [address]: Geocode and suggest waypoint ──
      case 'navi': {
        const address = args.join(' ').trim();
        if (!address) {
          sendChat(t('bot.naviUsage'));
          break;
        }
        sendChat(t('bot.naviSearching', { address }));
        const geoResult = await geocodeAddress(address);
        if (geoResult) {
          const shortName = geoResult.displayName.length > 60
            ? geoResult.displayName.substring(0, 60) + '...'
            : geoResult.displayName;
          const waypoint = {
            id: generateId(),
            lat: Number(geoResult.lat) || 0,
            lon: Number(geoResult.lon) || 0,
            name: shortName,
            address: geoResult.displayName,
            type: 'via' as const,
            suggestedBy: username,
            timestamp: Date.now(),
          };

          // Check auto-approve: setting enabled OR user is mod/broadcaster
          const settings = useSettingsStore.getState();
          const userLevel = getUserAccessLevel(tags);
          const shouldAutoApprove = settings.autoApprove || userLevel === 'broadcaster' || userLevel === 'mod';

          if (shouldAutoApprove) {
            // Auto-approve: add directly to navigation store + approved history
            const navStore = useNavigationStore.getState();
            const currentWps = [...navStore.waypoints];
            const currentDest = currentWps.find((w: any) => w.type === 'finish');
            const currentStart = currentWps.find((w: any) => w.type === 'start');

            if (!currentDest) {
              // No destination yet → add as destination
              navStore.addWaypoint({
                id: `wp-${Date.now()}`,
                lat: waypoint.lat, lon: waypoint.lon,
                name: waypoint.name,
                type: 'finish' as const,
                address: waypoint.address,
              });
            } else {
              // Smart routing: haversine distance to decide placement
              const refLat = currentStart?.lat || navStore.currentLat || 52.52;
              const refLon = currentStart?.lon || navStore.currentLon || 13.405;
              const distToNew = haversineDistance(refLat, refLon, waypoint.lat, waypoint.lon);
              const distToCurrent = haversineDistance(refLat, refLon, currentDest.lat, currentDest.lon);

              if (distToNew > distToCurrent) {
                // New waypoint is farther → make it the new destination, old dest → via
                navStore.updateWaypoint(currentDest.id, { type: 'via' as const });
                navStore.addWaypoint({
                  id: `wp-${Date.now()}`,
                  lat: waypoint.lat, lon: waypoint.lon,
                  name: waypoint.name,
                  type: 'finish' as const,
                  address: waypoint.address,
                });
              } else {
                // Closer → add as via before destination
                const viaWp = {
                  id: `wp-${Date.now()}`,
                  lat: waypoint.lat, lon: waypoint.lon,
                  name: waypoint.name,
                  type: 'via' as const,
                  address: waypoint.address,
                };
                const withoutFinish = currentWps.filter((w: any) => w.type !== 'finish');
                navStore.setWaypoints([...withoutFinish, viaWp, currentDest]);
              }
            }

            // Move to approved history
            useTwitchStore.getState().addPendingWaypoint(waypoint);
            useTwitchStore.getState().approveWaypoint(waypoint.id);
            sendChat(t('bot.naviAutoApproved', { user: username, name: shortName }));
          } else {
            // No auto-approve → add to pending queue for manual review
            addPendingWaypoint(waypoint);
            sendChat(t('bot.naviSuggested', { user: username, name: shortName }));
          }
        } else {
          sendChat(t('bot.naviNotFound', { address }));
        }
        break;
      }

      // ── !rank: Show user command stats ──
      case 'rank': {
        const userCount = userCommandCountsRef.current.get(username) || 0;
        // Build ranking: sort all users by command count descending
        const allUsers = Array.from(userCommandCountsRef.current.entries())
          .sort((a, b) => b[1] - a[1]);
        const userRank = allUsers.findIndex(([u]) => u === username) + 1;
        const totalUsers = allUsers.length;
        const rankText = userRank > 0
          ? t('bot.rank', { user: username, rank: userRank, total: totalUsers, count: userCount })
          : t('bot.noCommands', { user: username });
        sendChat(rankText);
        // Show top 3
        if (allUsers.length > 0 && userRank <= 5) {
          const top3 = allUsers.slice(0, 3).map(([u, c], i) => `${i + 1}. ${u} (${c})`).join(' | ');
          sendChat(t('bot.top3', { list: top3 }));
        }
        break;
      }

      // ── !help: List all commands ──
      case 'help': {
        const cmdList = ALL_COMMANDS.map(c => `  ${commandPrefix}${c.cmd} — ${t(c.descKey)}`).join('\n');
        const helpMsg = t('bot.helpHeader', { cmds: cmdList });
        // Send each line separately to avoid Twitch message length limits
        const lines = helpMsg.split('\n');
        console.log('[TwitchChatManager] !help handled, sending', lines.length, 'lines');
        for (const line of lines) {
          sendChat(line);
        }
        break;
      }

      case 'position': {
        if (currentLat !== null && currentLon !== null) {
          sendChat(t('bot.position', { lat: Number(currentLat).toFixed(5), lon: Number(currentLon).toFixed(5), speed: currentSpeed }));
        } else {
          sendChat(t('bot.noGpsShort'));
        }
        break;
      }

      case 'stats': {
        const distKm = route ? (route.distance / 1000).toFixed(1) : '0';
        // Prefer route object values for ascent/descent (accurate from BRouter).
        // Fall back to store values (live nav estimates based on progress ratio).
        const statsAscent = (route && route.ascent > 0) ? route.ascent : ascent;
        const statsDescent = (route && route.descent > 0) ? route.descent : descent;
        sendChat(t('bot.stats', { speed: currentSpeed, dist: distKm, ascent: statsAscent, descent: statsDescent }));
        break;
      }

      case 'route': {
        if (waypoints.length > 0 && route) {
          // Determine which waypoints are still ahead
          const lastDrivenPoint = drivenPath.length > 0 ? drivenPath[drivenPath.length - 1] : null;
          let passedCount = 0;
          if (isNavigating && lastDrivenPoint && drivenPath.length > 10) {
            // Find the last waypoint the user has passed (driven within 80m of)
            for (let i = 0; i < waypoints.length; i++) {
              const wp = waypoints[i];
              const wpLng = Number(wp.lon) || 0;
              const wpLat = Number(wp.lat) || 0;
              // Check if any recent driven point is within 80m of this waypoint
              const nearWp = drivenPath.slice(-50).some(
                ([dLng, dLat]) => Math.abs(Number(dLng) - wpLng) < 0.001 && Math.abs(Number(dLat) - wpLat) < 0.001
              );
              if (nearWp) passedCount = i + 1;
            }
          }

          const upcomingWps = waypoints.slice(passedCount);
          if (upcomingWps.length === 0) {
            sendChat(t('bot.routeArrived'));
            break;
          }

          // Build waypoint chain: "A → B → C"
          const wpNames = upcomingWps.map((wp, i) => {
            const name = wp.name || (wp.type === 'start' ? t('nav.currentLocation') : t('nav.destination'));
            // Truncate long names for chat readability
            return name.length > 25 ? name.substring(0, 22) + '...' : name;
          });
          const wpChain = wpNames.join(' → ');

          // Distance & time: use remaining data if navigating, total if not
          const distKm = isNavigating
            ? (remainingDistance / 1000).toFixed(1)
            : (route.distance / 1000).toFixed(1);
          const totalSec = isNavigating
            ? (eta !== '--:--' ? parseEtaToSeconds(eta) : Math.round(remainingDistance / 1000 / 20 * 3600))
            : route.duration;
          const totalMin = Math.max(1, Math.round(totalSec / 60));
          const timeStr = totalMin >= 60
            ? `${Math.floor(totalMin / 60)}h ${totalMin % 60}min`
            : `~${totalMin}min`;

          // Progress indicator
          const progressPct = route.distance > 0
            ? Math.min(100, Math.round((1 - remainingDistance / route.distance) * 100))
            : 0;
          const progressStr = isNavigating ? ` [${progressPct}%]` : '';

          // Elevation data: prefer route object (accurate), fall back to store (live nav)
          const routeAscent = (route.ascent > 0) ? route.ascent : ascent;
          const routeDescent = (route.descent > 0) ? route.descent : descent;
          const elevStr = (routeAscent > 0 || routeDescent > 0)
            ? ` | ↑${routeAscent}m ↓${routeDescent}m`
            : '';

          sendChat(`🗺️ ${wpChain} | ${distKm}km | ${timeStr}${progressStr}${elevStr}`);
        } else {
          sendChat(t('bot.noRoute'));
        }
        break;
      }

      case 'notfall': {
        if (currentLat === null || currentLon === null) {
          sendChat(t('bot.emergencyNoGps'));
          break;
        }
        sendChat(t('bot.emergencySearching'));
        const query = `[out:json][timeout:15];(node["amenity"="hospital"]({{bbox}});node["amenity"="police"]({{bbox}}););out body 3;`;
        const results = await searchOverpass(query, currentLat, currentLon);
        if (results.length > 0) {
          const list = results.map((r: any, i: number) => `${i + 1}. ${r.name} (${r.type})`).join(' | ');
          sendChat(t('bot.emergencyResults', { list }));
        } else {
          sendChat(t('bot.emergencyNoResults'));
        }
        break;
      }

      // ── !vote: Voting system (supports multi-option with pipe-separated syntax) ──
      case 'vote': {
        // Multi-option vote: !vote start [question] | [opt1] | [opt2] | [opt3]
        if (args.length > 0 && args[0].toLowerCase() === 'start' && !activeVote?.isActive) {
          const rest = args.slice(1).join(' ');
          // Split by pipe character
          const parts = rest.split('|').map(s => s.trim()).filter(Boolean);

          if (parts.length < 2) {
            sendChat(t('bot.voteUsage'));
            break;
          }

          const question = parts[0];
          const options = parts.slice(1);

          if (options.length < 2) {
            sendChat(t('bot.voteMinOptions'));
            break;
          }

          if (options.length > 6) {
            sendChat(t('bot.voteMaxOptions'));
            break;
          }

          const votes: Record<string, number> = {};
          options.forEach((_, i) => { votes[String(i)] = 0; });

          const newVote: VoteSession = {
            id: generateId(),
            question,
            options,
            votes,
            voters: {},
            startTime: Date.now(),
            duration: 60,
            isActive: true,
          };
          setVote(newVote);
          const optionList = options.map((o, i) => `${i + 1}. ${o}`).join(', ');
          sendChat(t('bot.voteStarted', { question, options: optionList }));
          sendChat(t('bot.voteHowTo'));

          enqueueEventTTS(t('bot.voteStartedTts', { question, options: optionList }));

          if (voteTimerRef.current) clearTimeout(voteTimerRef.current);
          voteTimerRef.current = setTimeout(() => {
            const currentVote = useTwitchStore.getState().activeVote;
            if (!currentVote || !currentVote.isActive) return;
            let maxVotes = 0;
            let winnerIndex = 0;
            for (const [key, count] of Object.entries(currentVote.votes)) {
              if (count > maxVotes) {
                maxVotes = count;
                winnerIndex = parseInt(key, 10);
              }
            }
            const winner = currentVote.options[winnerIndex] || '?';
            setVote({ ...currentVote, isActive: false, winner });
            sendChat(t('bot.voteEnded', { winner, votes: maxVotes }));
            enqueueEventTTS(t('bot.voteEndedTts', { winner, votes: maxVotes }));
          }, 60000);
          break;
        }

        // Simple yes/no vote: !vote [question]
        if (args.length > 0 && !activeVote?.isActive) {
          const question = args.join(' ');
          sendChat(t('bot.voteSimple', { question }));
          const newVote: VoteSession = {
            id: generateId(),
            question,
            options: [t('bot.voteYes'), t('bot.voteNo')],
            votes: { '0': 0, '1': 0 },
            voters: {},
            startTime: Date.now(),
            duration: 60,
            isActive: true,
          };
          setVote(newVote);
          if (voteTimerRef.current) clearTimeout(voteTimerRef.current);
          voteTimerRef.current = setTimeout(() => {
            const currentVote = useTwitchStore.getState().activeVote;
            if (!currentVote || !currentVote.isActive) return;
            const yesVotes = currentVote.votes['0'] || 0;
            const noVotes = currentVote.votes['1'] || 0;
            const winner = yesVotes >= noVotes ? t('bot.voteYes') : t('bot.voteNo');
            setVote({ ...currentVote, isActive: false, winner });
          }, 60000);
          break;
        }

        // Cast vote: !vote [number]
        if (activeVote?.isActive && args.length > 0) {
          const choice = parseInt(args[0], 10) - 1;
          if (!isNaN(choice) && choice >= 0 && choice < activeVote.options.length) {
            if (activeVote.voters[username]) {
              sendChat(`@${username} ${t('bot.voteAlreadyVoted')}`);
            } else {
              const key = String(choice);
              const newVotes = { ...activeVote.votes, [key]: (activeVote.votes[key] || 0) + 1 };
              const newVoters = { ...activeVote.voters, [username]: true };
              setVote({ ...activeVote, votes: newVotes, voters: newVoters });
              sendChat(t('bot.voteCast', { user: username, option: activeVote.options[choice] }));
            }
          } else {
            sendChat(t('bot.voteInvalid', { user: username, options: activeVote.options.map((o, i) => `${i + 1}. ${o}`).join(', ') }));
          }
          break;
        }

        // Show current vote info
        if (activeVote?.isActive) {
          sendChat(t('bot.voteStatus', { question: activeVote.question, options: activeVote.options.map((o, i) => `${i + 1}. ${o}`).join(', ') }));
        } else {
          sendChat(t('bot.voteInactive'));
        }
        break;
      }

      // ── !tts <text>: Speak text in UI language (de/en) ──
      case 'tts': {
        const text = args.join(' ').trim();
        if (!text) {
          sendChat(t('bot.ttsNoText'));
          break;
        }
        if (!voiceEnabled) {
          sendChat(t('bot.ttsVoiceNotSet'));
          break;
        }
        const maxChars = useSettingsStore.getState().maxChars || 200;
        if (text.length > maxChars) {
          sendChat(t('bot.textTooLong', { max: maxChars }));
          break;
        }
        const voiceLang = uiLanguage === 'de' ? 'de-DE' : 'en-US';
        ttsQueue.enqueue(text, {
          voice: selectedVoice || undefined,
          rate: voiceRate,
          volume: voiceVolume,
          lang: voiceLang,
        });
        sendChat(t('bot.ttsSpeaking', { user: username, text: text.substring(0, 80) }));
        break;
      }

      // ── !tts-t <text>: Translate text to voice language, then speak + chat output ──
      case 'tts-t': {
        const textT = args.join(' ').trim();
        console.log('[TwitchChatManager] !tts-t called:', { args: args.length, textT: textT?.substring(0, 40), voiceEnabled, selectedVoice, selectedVoiceLang, uiLanguage });
        if (!textT) {
          sendChat(t('bot.ttsNoTextT'));
          break;
        }
        if (!voiceEnabled) {
          console.log('[TwitchChatManager] !tts-t: voice is disabled, sending ttsVoiceNotSet');
          sendChat(t('bot.ttsVoiceNotSet'));
          break;
        }
        const maxCharsT = useSettingsStore.getState().maxChars || 200;
        if (textT.length > maxCharsT) {
          sendChat(t('bot.textTooLong', { max: maxCharsT }));
          break;
        }
        // Determine voice language — prefer stored lang, fallback to getVoices()
        const voiceName = selectedVoice || '';
        const storedVoiceLang = selectedVoiceLang || '';
        let voiceLangCode = uiLanguage === 'de' ? 'de' : 'en'; // default
        let matchedVoiceLang: string | null = null;
        // 1st: use stored voice language from settings (most reliable)
        if (storedVoiceLang) {
          voiceLangCode = storedVoiceLang;
        }
        // 2nd: try getVoices() as fallback
        if (!storedVoiceLang && voiceName && typeof window !== 'undefined' && window.speechSynthesis) {
          const allVoices = window.speechSynthesis.getVoices();
          console.log('[TwitchChatManager] !tts-t: getVoices() returned', allVoices.length, 'voices');
          const matchedVoice = allVoices.find(v => v.name === voiceName) || null;
          if (matchedVoice) {
            voiceLangCode = matchedVoice.lang.split('-')[0];
            matchedVoiceLang = matchedVoice.lang;
          }
        }
        console.log('[TwitchChatManager] !tts-t: voiceLangCode=', voiceLangCode, 'uiLanguage=', uiLanguage, 'storedVoiceLang=', storedVoiceLang, 'voiceName=', voiceName);
        // If voice language matches UI language, no translation needed — just speak
        if (voiceLangCode === uiLanguage) {
          console.log('[TwitchChatManager] !tts-t: voice == UI language, no translation needed, speaking directly');
          ttsQueue.enqueue(textT, {
            voice: voiceName || undefined,
            rate: voiceRate,
            volume: voiceVolume,
            lang: voiceLangCode === 'de' ? 'de-DE' : 'en-US',
          });
          sendChat(t('bot.ttsSpeaking', { user: username, text: textT.substring(0, 80) }));
          break;
        }
        // Translate text via MyMemory API (free, no key needed)
        sendChat(t('bot.ttsTranslating', { text: textT.substring(0, 40), lang: voiceLangCode.toUpperCase() }));
        try {
          const sourceLang = uiLanguage === 'de' ? 'de' : 'en';
          const targetLang = voiceLangCode;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          try {
            const translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textT.substring(0, 500))}&langpair=${sourceLang}|${targetLang}`;
            const translateRes = await fetch(translateUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            const translateData = await translateRes.json();
            const translatedText = translateData?.responseData?.translatedText || '';
            if (translatedText) {
              ttsQueue.enqueue(translatedText, {
                voice: voiceName || undefined,
                rate: voiceRate,
                volume: voiceVolume,
                lang: matchedVoiceLang || `${voiceLangCode}-${voiceLangCode.toUpperCase()}`,
              });
              // World Translator: output translated text in chat so viewers can read it
              sendChat(t('bot.ttsTranslatedChat', { lang: voiceLangCode.toUpperCase(), text: translatedText }));
            } else {
              // Fallback: speak original text
              ttsQueue.enqueue(textT, {
                voice: voiceName || undefined,
                rate: voiceRate,
                volume: voiceVolume,
                lang: uiLanguage === 'de' ? 'de-DE' : 'en-US',
              });
              sendChat(t('bot.ttsTranslateError'));
            }
          } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            console.error('[TwitchChatManager] !tts-t translate error:', fetchErr);
            ttsQueue.enqueue(textT, {
              voice: voiceName || undefined,
              rate: voiceRate,
              volume: voiceVolume,
              lang: uiLanguage === 'de' ? 'de-DE' : 'en-US',
            });
            sendChat(t('bot.ttsTranslateError'));
          }
        } catch (err) {
          console.error('[TwitchChatManager] !tts-t unexpected error:', err);
          sendChat(t('bot.ttsTranslateError'));
        }
        break;
      }

      // ── !translate <language> [text]: Universal translator ──
      // Modes:
      //   !translate english            → enable auto-translate to English
      //   !translate english hello       → translate "hello" to English (single shot)
      //   !translate off                 → disable auto-translate
      case 'translate': {
        console.log('[TwitchChatManager] !translate called:', { args, username, uiLanguage });
        // Normalize language code map
        const langMap: Record<string, string> = {
          'de': 'de', 'deutsch': 'de', 'german': 'de', 'alemán': 'de',
          'en': 'en', 'english': 'en', 'englisch': 'en', 'inglés': 'en',
          'fr': 'fr', 'french': 'fr', 'französisch': 'fr', 'français': 'fr',
          'es': 'es', 'spanish': 'es', 'spanisch': 'es', 'español': 'es',
          'it': 'it', 'italian': 'it', 'italienisch': 'it', 'italiano': 'it',
          'pt': 'pt', 'portuguese': 'pt', 'portugiesisch': 'pt', 'português': 'pt',
          'nl': 'nl', 'dutch': 'nl', 'niederländisch': 'nl', 'nederlands': 'nl',
          'pl': 'pl', 'polish': 'pl', 'polnisch': 'pl', 'polski': 'pl',
          'ru': 'ru', 'russian': 'ru', 'russisch': 'ru', 'русский': 'ru',
          'ja': 'ja', 'japanese': 'ja', 'japanisch': 'ja', '日本語': 'ja',
          'zh': 'zh', 'chinese': 'zh', 'chinesisch': 'zh', '中文': 'zh',
          'ko': 'ko', 'korean': 'ko', 'koreanisch': 'ko', '한국어': 'ko',
          'ar': 'ar', 'arabic': 'ar', 'arabisch': 'ar', 'العربية': 'ar',
          'tr': 'tr', 'turkish': 'tr', 'türkisch': 'tr', 'türkçe': 'tr',
          'sv': 'sv', 'swedish': 'sv', 'schwedisch': 'sv', 'svenska': 'sv',
          'cs': 'cs', 'czech': 'cs', 'tschechisch': 'cs', 'čeština': 'cs',
          'da': 'da', 'danish': 'da', 'dänisch': 'da', 'dansk': 'da',
          'fi': 'fi', 'finnish': 'fi', 'finnisch': 'fi', 'suomi': 'fi',
          'el': 'el', 'greek': 'el', 'griechisch': 'el', 'ελληνικά': 'el',
          'he': 'he', 'hebrew': 'he', 'hebräisch': 'he', 'עברית': 'he',
          'hi': 'hi', 'hindi': 'hi', 'indisch': 'hi', 'हिन्दी': 'hi',
          'th': 'th', 'thai': 'th', 'thailändisch': 'th', 'ไทย': 'th',
          'vi': 'vi', 'vietnamese': 'vi', 'vietnamesisch': 'vi', 'tiếng': 'vi',
          'id': 'id', 'indonesian': 'id', 'indonesisch': 'id', 'bahasa': 'id',
          'uk': 'uk', 'ukrainian': 'uk', 'ukrainisch': 'uk', 'українська': 'uk',
          'ro': 'ro', 'romanian': 'ro', 'rumänisch': 'ro', 'română': 'ro',
          'hu': 'hu', 'hungarian': 'hu', 'ungarisch': 'hu', 'magyar': 'hu',
          'no': 'no', 'norwegian': 'no', 'norwegisch': 'no', 'norsk': 'no',
          'off': 'off', 'aus': 'off', 'stop': 'off',
        };

        if (args.length === 0) {
          // No args at all — show current status or usage
          if (autoTranslateLangRef.current) {
            sendChat(t('bot.translateAutoStatus', { lang: autoTranslateLangRef.current.toUpperCase() }));
          } else {
            sendChat(t('bot.translateUsage'));
          }
          break;
        }

        const targetLangRaw = args[0].toLowerCase();
        const mappedLang = langMap[targetLangRaw];

        // !translate off / aus / stop → disable auto-translate
        if (mappedLang === 'off') {
          if (autoTranslateLangRef.current) {
            const prevLang = autoTranslateLangRef.current.toUpperCase();
            autoTranslateLangRef.current = null;
            sendChat(t('bot.translateAutoOff', { lang: prevLang }));
          } else {
            sendChat(t('bot.translateAutoNotActive'));
          }
          break;
        }

        // Unknown language
        if (!mappedLang) {
          sendChat(t('bot.translateUnknownLang', { lang: targetLangRaw }));
          break;
        }

        // Only language, no text → toggle auto-translate mode
        if (args.length === 1) {
          if (mappedLang === uiLanguage) {
            sendChat(t('bot.translateSameLang', { lang: mappedLang.toUpperCase(), text: '' }));
            break;
          }
          autoTranslateLangRef.current = mappedLang;
          sendChat(t('bot.translateAutoOn', { lang: mappedLang.toUpperCase() }));
          console.log('[TwitchChatManager] !translate: auto-translate ENABLED for', mappedLang);
          break;
        }

        // Language + text → single translation (existing behavior)
        const translateText = args.slice(1).join(' ').trim();
        if (!translateText) {
          sendChat(t('bot.translateNoText'));
          break;
        }
        if (mappedLang === uiLanguage) {
          sendChat(t('bot.translateSameLang', { lang: mappedLang.toUpperCase(), text: translateText.substring(0, 80) }));
          break;
        }
        sendChat(t('bot.translateTranslating', { text: translateText.substring(0, 40), lang: mappedLang.toUpperCase() }));
        console.log('[TwitchChatManager] !translate: sending to MyMemory API, sourceLang=', uiLanguage, 'targetLang=', mappedLang);
        try {
          const sourceLang = uiLanguage === 'de' ? 'de' : 'en';
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          try {
            const translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(translateText.substring(0, 500))}&langpair=${sourceLang}|${mappedLang}`;
            console.log('[TwitchChatManager] !translate: fetching', translateUrl);
            const translateRes = await fetch(translateUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            console.log('[TwitchChatManager] !translate: response status', translateRes.status);
            const translateData = await translateRes.json();
            const translatedText = translateData?.responseData?.translatedText || '';
            console.log('[TwitchChatManager] !translate: result', translatedText);
            if (translatedText) {
              sendChat(t('bot.translateResult', { lang: mappedLang.toUpperCase(), text: translatedText }));
            } else {
              sendChat(t('bot.translateError'));
            }
          } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            console.error('[TwitchChatManager] !translate fetch error:', fetchErr);
            sendChat(t('bot.translateError'));
          }
        } catch (err) {
          console.error('[TwitchChatManager] !translate unexpected error:', err);
          sendChat(t('bot.translateError'));
        }
        break;
      }

      // ── !translator / !übersetzer: Alias for !translate (same 3-mode behavior) ──
      case 'translator':
      case 'übersetzer': {
        // Redirect to the same logic as !translate via autoTranslateLangRef
        if (args.length === 0) {
          if (autoTranslateLangRef.current) {
            sendChat(t('bot.translateAutoStatus', { lang: autoTranslateLangRef.current.toUpperCase() }));
          } else {
            sendChat(t('bot.translateUsage'));
          }
          break;
        }
        const aliasLangRaw = args[0].toLowerCase();
        const langAliasMap: Record<string, string> = {
          'de': 'de', 'en': 'en', 'fr': 'fr', 'es': 'es', 'it': 'it', 'pt': 'pt',
          'nl': 'nl', 'pl': 'pl', 'ru': 'ru', 'ja': 'ja', 'zh': 'zh', 'ko': 'ko',
          'ar': 'ar', 'tr': 'tr', 'sv': 'sv', 'cs': 'cs', 'da': 'da', 'fi': 'fi',
          'el': 'el', 'he': 'he', 'hi': 'hi', 'th': 'th', 'vi': 'vi', 'id': 'id',
          'uk': 'uk', 'ro': 'ro', 'hu': 'hu', 'no': 'no',
          'off': 'off', 'aus': 'off', 'stop': 'off',
        };
        const aliasMapped = langAliasMap[aliasLangRaw];
        if (aliasMapped === 'off') {
          if (autoTranslateLangRef.current) {
            sendChat(t('bot.translateAutoOff', { lang: autoTranslateLangRef.current.toUpperCase() }));
            autoTranslateLangRef.current = null;
          } else {
            sendChat(t('bot.translateAutoNotActive'));
          }
          break;
        }
        if (!aliasMapped) {
          sendChat(t('bot.translateUnknownLang', { lang: aliasLangRaw }));
          break;
        }
        if (args.length === 1) {
          if (aliasMapped === uiLanguage) {
            sendChat(t('bot.translateSameLang', { lang: aliasMapped.toUpperCase(), text: '' }));
            break;
          }
          autoTranslateLangRef.current = aliasMapped;
          sendChat(t('bot.translateAutoOn', { lang: aliasMapped.toUpperCase() }));
          break;
        }
        // Language + text → single translation
        const aliasText = args.slice(1).join(' ').trim();
        if (!aliasText) { sendChat(t('bot.translateNoText')); break; }
        if (aliasMapped === uiLanguage) { sendChat(t('bot.translateSameLang', { lang: aliasMapped.toUpperCase(), text: aliasText.substring(0, 80) })); break; }
        sendChat(t('bot.translateTranslating', { text: aliasText.substring(0, 40), lang: aliasMapped.toUpperCase() }));
        try {
          const aliasSourceLang = uiLanguage === 'de' ? 'de' : 'en';
          const aliasController = new AbortController();
          const aliasTimeoutId = setTimeout(() => aliasController.abort(), 10000);
          try {
            const aliasUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(aliasText.substring(0, 500))}&langpair=${aliasSourceLang}|${aliasMapped}`;
            const aliasRes = await fetch(aliasUrl, { signal: aliasController.signal });
            clearTimeout(aliasTimeoutId);
            const aliasData = await aliasRes.json();
            const aliasTranslated = aliasData?.responseData?.translatedText || '';
            if (aliasTranslated) {
              sendChat(t('bot.translateResult', { lang: aliasMapped.toUpperCase(), text: aliasTranslated }));
            } else { sendChat(t('bot.translateError')); }
          } catch (fetchErr: any) {
            clearTimeout(aliasTimeoutId);
            console.error('[TwitchChatManager] !translator alias fetch error:', fetchErr);
            sendChat(t('bot.translateError'));
          }
        } catch (err) {
          console.error('[TwitchChatManager] !translator alias unexpected error:', err);
          sendChat(t('bot.translateError'));
        }
        break;
      }

      // Legacy POI shorthand commands (ladesaeule, camping, sightseeing)
      case 'sightseeing':
      case 'camping':
      case 'ladesaeule': {
        if (currentLat === null || currentLon === null) {
          sendChat(t('bot.noGps'));
          break;
        }
        const queryTemplate = POI_OVERPASS_QUERIES[command];
        if (!queryTemplate) {
          sendChat(t('bot.poiCategoryNotFound', { cat: command }));
          break;
        }
        const label = getPoiLabel(command);
        sendChat(t('bot.poiSearching', { label }));
        const pois = await searchOverpass(queryTemplate, currentLat, currentLon);
        if (pois.length > 0) {
          const list = pois.map((p: any, i: number) => `${i + 1}. ${p.name}`).join(' | ');
          sendChat(`${label}: ${list}`);
        } else {
          sendChat(t('bot.poiNoResults', { label }));
        }
        break;
      }

      default: {
        // Check custom commands (but NEVER override built-in commands like translate, translator, übersetzer)
        const reservedCmds = ['translate', 'translator', 'übersetzer'];
        if (reservedCmds.includes(command)) break;
        const customCmd = commands.find(
          c => c.isActive && (c.trigger === command || (c.aliases && c.aliases.includes(command)))
        );
        if (customCmd && customCmd.responses.length > 0) {
          const response = customCmd.responses[Math.floor(Math.random() * customCmd.responses.length)];
          sendChat(response.replace('{user}', username));
        }
        break;
      }
    }
    } catch (err) {
      console.error('[TwitchChatManager] Unhandled error in command', command, ':', err);
      sendChat('❌ Internal command error. Check browser console (F12).');
    }
  }, [currentLat, currentLon, currentSpeed, remainingDistance, ascent, descent, eta, waypoints, route, activeVote, commands, cooldown, maxPerUser, sendChat, searchOverpass, setVote, fetchWeather, geocodeAddress, addPendingWaypoint, enqueueResponseTTS, enqueueEventTTS, commandPrefix, voiceEnabled, voiceVolume, voiceRate, selectedVoice, selectedVoiceLang, uiLanguage]);

  // Always keep handleCommandRef pointing to the latest handleCommand.
  // The TMI message handler uses this ref to avoid stale closure issues.
  handleCommandRef.current = handleCommand;

  // Create message object
  const createMessage = useCallback((tags: any, message: string): ChatMessage => {
    return {
      id: generateId(),
      username: tags['username'] || 'unknown',
      displayName: tags['display-name'] || tags['username'] || 'Unknown',
      color: tags['color'] || '#ffffff',
      message: badWordFilter ? filterBadWords(message) : message,
      timestamp: Date.now(),
      isAction: message.startsWith('\x01ACTION'),
    };
  }, [badWordFilter]);

  // Check if an alert type is enabled
  const isAlertEnabled = useCallback((type: 'follow' | 'subscribe' | 'gifted_sub' | 'bits' | 'raid'): boolean => {
    return alerts.some(a => a.type === type && a.enabled);
  }, [alerts]);

  // Get alert config for a type
  const getAlertForType = useCallback((type: 'subscribe' | 'gifted_sub' | 'bits' | 'raid') => {
    return alerts.find(a => a.type === type && a.enabled);
  }, [alerts]);

  // Connect to Twitch
  const connect = useCallback(() => {
    if (clientRef.current) return;

    if (!channel || !botName || !token) {
      console.warn('[TwitchChatManager] Missing connection info');
      return;
    }

    const opts: tmi.Options = {
      identity: {
        username: botName,
        password: `oauth:${token.replace('oauth:', '')}`,
      },
      channels: [channel.startsWith('#') ? channel : `#${channel}`],
      connection: {
        reconnect: true,
        secure: true,
      },
      // CRITICAL FIX v3.0.3: Disable deprecated Kraken API emote fetching.
      // The Kraken API (api.twitch.tv/kraken) is deprecated since 2022 and blocks
      // CORS preflight from browser origins (github.io). This caused noisy console
      // errors and in some browser configurations could interfere with message handling.
      options: {
        skipUpdatingEmotesets: true,
      } as any,
    };

    const client = new tmi.Client(opts);
    clientRef.current = client;

    client.on('connected', (addr, port) => {
      console.log(`[TwitchChatManager] Connected to ${addr}:${port}`);
      setConnected(true);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    });

    client.on('disconnected', () => {
      console.log('[TwitchChatManager] Disconnected');
      setConnected(false);
      // Auto-reconnect after 10s
      reconnectTimerRef.current = setTimeout(() => {
        if (clientRef.current && !useTwitchStore.getState().connected) {
          client.connect().catch(() => {});
        }
      }, 10000);
    });

    client.on('message', (target, tags, msg, self) => {
      if (self) return;

      // FIX v4.1.1: Read badWordFilter from store at call-time instead of closure.
      // The closure captures the value from connect() time which may be stale.
      const currentBadWordFilter = useSettingsStore.getState().badWordFilter;
      if (currentBadWordFilter && containsBadWord(msg)) return;

      const chatMsg = createMessage(tags, msg);
      addMessage(chatMsg);

      // FIX v4.1.1: Read commandPrefix from store at call-time instead of closure.
      // This ensures the prefix is always current even if settings changed after connect.
      const prefix = useSettingsStore.getState().commandPrefix || '!';

      // Auto-translate: if a target language is set, translate non-command messages
      if (autoTranslateLangRef.current && !msg.startsWith(prefix)) {
        const targetLang = autoTranslateLangRef.current;
        const uiLang = useSettingsStore.getState().language === 'de' ? 'de' : 'en';
        if (targetLang !== uiLang) {
          const textToTranslate = msg.trim().substring(0, 500);
          if (textToTranslate.length > 0) {
            const sourceLang = uiLang;
            const displayName = tags['display-name'] || tags['username'] || 'Unknown';
            const autoController = new AbortController();
            const autoTimeoutId = setTimeout(() => autoController.abort(), 8000);
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=${sourceLang}|${targetLang}`, { signal: autoController.signal })
              .then(res => res.json())
              .then(data => {
                const translated = data?.responseData?.translatedText || '';
                if (translated) {
                  const translatedMsg = createMessage(
                    { ...tags, username: 'system', 'display-name': `🌍 ${targetLang.toUpperCase()}` },
                    `${displayName}: ${translated}`
                  );
                  addMessage(translatedMsg);
                }
              })
              .catch(() => { clearTimeout(autoTimeoutId); }); // silently ignore — don't spam errors for auto-translate
          }
        }
      }

      // Parse commands
      if (msg.startsWith(prefix)) {
        const parts = msg.slice(prefix.length).trim().split(/\s+/);
        const command = parts[0]?.toLowerCase() || '';
        const cmdArgs = parts.slice(1);
        console.log('[TwitchChatManager] Command received:', { command, args: cmdArgs, user: tags['username'], prefix, raw: msg });
        if (!handleCommandRef.current) {
          console.error('[TwitchChatManager] handleCommandRef.current is UNDEFINED — command dropped:', command);
        } else {
          handleCommandRef.current(tags['username'] || 'unknown', command, cmdArgs, tags);
        }
      }
    });

    client.on('usernotice', (target, tags, msg) => {
      const noticeType = tags['msg-id'];
      const username = tags['display-name'] || tags['login'] || 'Unknown';
      const color = tags['color'] || '#ffffff';
      let systemMsg = msg;
      let ttsMsg: string | null = null;

      switch (noticeType) {
        case 'sub': {
          systemMsg = t('bot.eventSub', { user: username });
          if (isAlertEnabled('subscribe')) {
            const alert = getAlertForType('subscribe');
            ttsMsg = alert?.message?.replace('{user}', username) || t('bot.eventSubTts', { user: username });
          }
          break;
        }
        case 'resub': {
          const months = tags['msg-param-months'] || '?';
          systemMsg = t('bot.eventResub', { user: username, months });
          if (isAlertEnabled('subscribe')) {
            const alert = getAlertForType('subscribe');
            ttsMsg = alert?.message?.replace('{user}', username)?.replace('{months}', months)
              || t('bot.eventResubTts', { user: username, months });
          }
          break;
        }
        case 'subgift': {
          const recipient = tags['msg-param-recipient-display-name'] || tags['msg-param-recipient-user-name'];
          systemMsg = t('bot.eventGift', { user: username, target: recipient });
          if (isAlertEnabled('gifted_sub')) {
            const alert = getAlertForType('gifted_sub');
            ttsMsg = alert?.message?.replace('{user}', username)?.replace('{recipient}', recipient || t('bot.someone'))
              || t('bot.eventGiftTts', { user: username });
          }
          break;
        }
        case 'anonsubgift': {
          const anonRecipient = tags['msg-param-recipient-display-name'];
          systemMsg = t('bot.eventAnonGift', { target: anonRecipient });
          break;
        }
        case 'raid': {
          const viewers = tags['msg-param-viewerCount'] || '?';
          systemMsg = t('bot.eventRaid', { user: username, viewers });
          if (isAlertEnabled('raid')) {
            const alert = getAlertForType('raid');
            ttsMsg = alert?.message?.replace('{user}', username)?.replace('{viewers}', viewers)
              || t('bot.eventRaidTts', { user: username, viewers });
          }
          break;
        }
        default:
          systemMsg = `📢 ${username}: ${msg || noticeType}`;
      }

      addMessage({
        id: generateId(),
        username: 'system',
        displayName: t('bot.system'),
        color: '#FFD700',
        message: systemMsg,
        timestamp: Date.now(),
        isAction: false,
      });

      // Enqueue TTS for the event if applicable
      if (ttsMsg && voiceEnabled) {
        enqueueEventTTS(ttsMsg);
      }
    });

    client.on('cheer', (channel, userstate, message) => {
      const username = userstate['display-name'] || userstate['username'] || 'Unknown';
      const bits = userstate.bits || 0;
      const systemMsg = t('bot.eventBits', { user: username, bits, message });

      addMessage({
        id: generateId(),
        username: 'system',
        displayName: '💎 Bits',
        color: '#9146FF',
        message: systemMsg,
        timestamp: Date.now(),
        isAction: false,
      });

      // Enqueue TTS for bits event
      if (isAlertEnabled('bits') && voiceEnabled) {
        const alert = getAlertForType('bits');
        const ttsMsg = alert?.message?.replace('{user}', username)?.replace('{bits}', String(bits))
          || t('bot.eventBitsTts', { user: username, bits });
        enqueueEventTTS(ttsMsg);
      }
    });

    client.connect().catch((err) => {
      console.error('[TwitchChatManager] Connection error:', err.message);
      setConnected(false);
    });
  // FIX v4.1.1: Removed handleCommand, badWordFilter, commandPrefix from dependency array.
  // handleCommand was causing connect() to be recreated on every nav store change
  // (currentSpeed, remainingDistance, etc. change every second during navigation).
  // This triggered the bridge useEffect to clear/reset _sendChatFn repeatedly,
  // causing message delivery failures. handleCommandRef.current is used inside
  // the message handler instead (ref, not closure), so it doesn't need to be a dep.
  // badWordFilter and commandPrefix are now read from stores at call-time in the
  // message handler, so they don't need to be deps either.
  }, [channel, botName, token, setConnected, addMessage, createMessage, isAlertEnabled, getAlertForType, enqueueEventTTS, voiceEnabled]);

  // Disconnect from Twitch
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect().catch(() => {});
      clientRef.current = null;
      setConnected(false);
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, [setConnected]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && channel && botName && token && !connected) {
      const timer = setTimeout(connect, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect().catch(() => {});
      }
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (voteTimerRef.current) clearTimeout(voteTimerRef.current);
      ttsQueue.clear();
    };
  }, []);

  // Reset user limits every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      userLimitsRef.current.clear();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  // Register connect/disconnect/sendChat in the twitch store so other components
  // (StreamerTab, useNavTTS, ChatOverlay, NavigateTab) can call them without window globals.
  // NOTE: _sendChatFn is always registered (even before connect) because other components
  // rely on its existence. The sendChat function itself has triple-guards that block
  // sending when not connected. This is safer than registering/unregistering dynamically.
  // FIX v4.1.1: sendChat has [] deps (stable), disconnect has [setConnected] (stable),
  // and connect deps no longer include handleCommand (nav store values). So this useEffect
  // should now only re-run when channel/botName/token change — not every second.
  useEffect(() => {
    useTwitchStore.setState({ _connectFn: connect, _disconnectFn: disconnect, _sendChatFn: sendChat });
    return () => {
      useTwitchStore.setState({ _connectFn: undefined, _disconnectFn: undefined, _sendChatFn: undefined });
    };
  }, [connect, disconnect, sendChat]);

  // Handle connect/disconnect from store changes
  useEffect(() => {
    // Sync connection info from settings store
    const settings = useSettingsStore.getState();
    if (settings.twitchChannel) {
      useTwitchStore.getState().setConnectionInfo(
        settings.twitchChannel,
        settings.twitchBotName,
        settings.twitchToken
      );
    }
  }, []);

  return null;
}
