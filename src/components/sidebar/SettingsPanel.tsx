
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Languages,
  Palette,
  Sun,
  Moon,
  Volume2,
  Play,
  Map,
  Download,
  Upload,
  RotateCcw,
  Check,
  Layers,
  Gauge,
  Thermometer,
  MapPin,
  Navigation,
  MessageSquare,
  Vote,
  Route,
  Mountain,
  Footprints,
  Eye,
  Wifi,
  MapPinned,
} from 'lucide-react';
import { t, setLanguage, getAvailableVoices } from '@/lib/i18n';
import { ttsQueue } from '@/lib/ttsQueue';
import { useSettingsStore } from '@/store/useSettingsStore';
import { applyThemeToDOM } from '@/App';
import { SyncPanel } from '@/components/sync/SyncPanel';

const THEMES = [
  { value: 'twitch' as const, label: 'Twitch Purple', color: '#9146FF' },
  { value: 'cargo' as const, label: 'Cargo Green', color: '#00ff00' },
  { value: 'electric' as const, label: 'Electric Blue', color: '#00BFFF' },
  { value: 'sunset' as const, label: 'Sunset Orange', color: '#FF6B35' },
  { value: 'pink' as const, label: 'Hot Pink', color: '#ff00ff' },
];

const getMapStyles = () => [
  { value: 'street' as const, label: t('settings.mapStreet') },
  { value: 'satellite' as const, label: t('settings.mapSatellite') },
  { value: 'topo' as const, label: t('settings.mapTopo') },
  { value: 'dark' as const, label: t('settings.mapDark') },
  { value: 'stars' as const, label: t('settings.mapStars') },
];

export function SettingsPanel() {
  const {
    language,
    theme,
    darkMode,
    voiceVolume,
    voiceRate,
    selectedVoice,
    ttsVerbosity,
    mapStyle,
    showDriveInfo,
    showWeather,
    showPOIShortcuts,
    showNavArrow,
    showChat,
    showVoting,
    showRouteLine,
    showAltRoutes,
    showPOIMarkers,
    showWaypoints,
    showDrivenPath,
    showHillshade,
    overlaySpeedSize,
    overlayRouteInfoSize,
    overlayWeatherSize,
    overlayChatSize,
    overlayVotingSize,
    overlayProgressBarSize,
    showOverlayMap,
    overlayMapSize,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
  } = useSettingsStore();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load voices — Chrome lazy-loads voices, so we poll + listen for voiceschanged
  useEffect(() => {
    const loadVoices = () => {
      const v = getAvailableVoices();
      if (v.length > 0) setVoices(v);
    };
    loadVoices();
    // Poll every 300ms for up to 3 seconds to catch Chrome's lazy voice loading
    let pollCount = 0;
    const pollTimer = setInterval(() => {
      pollCount++;
      const v = getAvailableVoices();
      if (v.length > 0) {
        setVoices(v);
        if (pollCount >= 10) clearInterval(pollTimer); // stop after 3s
      }
      if (pollCount >= 10) clearInterval(pollTimer);
    }, 300);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    }
    return () => {
      clearInterval(pollTimer);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      }
    };
  }, []);

  const handleLanguageToggle = useCallback(() => {
    const newLang = language === 'de' ? 'en' : 'de';
    updateSetting('language', newLang);
    setLanguage(newLang);
    document.documentElement.lang = newLang;
  }, [language, updateSetting]);

  const handleThemeChange = useCallback(
    (newTheme: string) => {
      updateSetting('theme', newTheme as any);
      document.documentElement.setAttribute('data-theme', newTheme);
    },
    [updateSetting]
  );

  const handleDarkModeToggle = useCallback(() => {
    const newDark = !darkMode;
    updateSetting('darkMode', newDark);
    applyThemeToDOM(theme, newDark);
  }, [darkMode, theme, updateSetting]);

  const handleExport = useCallback(() => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'twitch-copilot-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportSettings]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const json = ev.target?.result as string;
        const success = importSettings(json);
        if (success) {
          setImportSuccess(true);
          // Apply theme and dark mode
          const s = useSettingsStore.getState();
          applyThemeToDOM(s.theme, s.darkMode);
          setLanguage(s.language);
          document.documentElement.lang = s.language;
          setTimeout(() => setImportSuccess(false), 2000);
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be imported again
      e.target.value = '';
    },
    [importSettings]
  );

  const handleReset = useCallback(() => {
    resetSettings();
    setResetConfirm(false);
    applyThemeToDOM('twitch', true);
    setLanguage('de');
    document.documentElement.lang = 'de';
  }, [resetSettings]);

  return (
    <ScrollArea className="h-full custom-scrollbar">
      <div className="flex flex-col gap-5 p-3 pb-8 max-w-full overflow-hidden">
        {/* Language */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1.5">
            <Languages className="size-3.5" />
            {t('settings.language')}
          </Label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLanguageToggle}
              className={`
                flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all
                ${
                  language === 'de'
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground/50 hover:bg-sidebar-foreground/10'
                }
              `}
            >
              🇩🇪 Deutsch
            </button>
            <button
              onClick={handleLanguageToggle}
              className={`
                flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all
                ${
                  language === 'en'
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground/50 hover:bg-sidebar-foreground/10'
                }
              `}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Theme */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1.5">
            <Palette className="size-3.5" />
            {t('settings.theme')}
          </Label>
          <div className="flex gap-3 justify-center">
            {THEMES.map((th) => (
              <button
                key={th.value}
                onClick={() => handleThemeChange(th.value)}
                title={th.label}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className={`
                    w-10 h-10 rounded-full border-2 transition-all
                    ${theme === th.value ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'}
                  `}
                  style={{ backgroundColor: th.color }}
                />
                <span className="text-[9px] text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70 transition-colors">
                  {th.label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1.5">
            {darkMode ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
            {t('settings.darkMode')}
          </Label>
          <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} />
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Voice settings */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1.5">
            <Volume2 className="size-3.5" />
            {t('settings.voice')}
          </Label>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-sidebar-foreground/50">{t('settings.volume')}</Label>
              <span className="text-[10px] text-sidebar-foreground/70">{voiceVolume}%</span>
            </div>
            <Slider
              value={[voiceVolume]}
              onValueChange={([v]) => updateSetting('voiceVolume', v)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-sidebar-foreground/50">{t('settings.rate')}</Label>
              <span className="text-[10px] text-sidebar-foreground/70">{voiceRate.toFixed(1)}</span>
            </div>
            <Slider
              value={[voiceRate * 100]}
              onValueChange={([v]) => updateSetting('voiceRate', v / 100)}
              min={50}
              max={150}
              step={10}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-sidebar-foreground/50">{t('settings.voiceSelect')}</Label>
            <Select value={selectedVoice} onValueChange={(v) => {
              updateSetting('selectedVoice', v);
              // Store voice language code for reliable detection in TwitchChatManager
              const voiceObj = voices.find(voice => voice.name === v);
              if (voiceObj) {
                updateSetting('selectedVoiceLang', voiceObj.lang.split('-')[0]);
              } else {
                updateSetting('selectedVoiceLang', '');
              }
            }}>
              <SelectTrigger className="h-8 text-xs bg-surface border-border w-full">
                <SelectValue placeholder={t('general.default')} />
              </SelectTrigger>
              <SelectContent className="bg-surface border-border max-h-[400px]">
                {voices.length === 0 && (
                  <SelectItem value="__loading" disabled>
                    {language === 'de' ? 'Stimmen werden geladen...' : 'Loading voices...'}
                  </SelectItem>
                )}
                {voices
                  .sort((a, b) => {
                    const langA = a.lang.split('-')[0];
                    const langB = b.lang.split('-')[0];
                    const priA = langA === 'de' ? 0 : langA === 'en' ? 1 : 2;
                    const priB = langB === 'de' ? 0 : langB === 'en' ? 1 : 2;
                    if (priA !== priB) return priA - priB;
                    return a.lang.localeCompare(b.lang);
                  })
                  .map((v) => {
                    const langCode = v.lang.split('-')[0];
                    const flagMap: Record<string, string> = {
                      de: '🇩🇪', en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹', pt: '🇵🇹', nl: '🇳🇱', pl: '🇵🇱', ru: '🇷🇺', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳', ar: '🇸🇦', hi: '🇮🇳', sv: '🇸🇪', da: '🇩🇰', fi: '🇫🇮', no: '🇳🇴', tr: '🇹🇷', cs: '🇨🇿', sk: '🇸🇰', hu: '🇭🇺', ro: '🇷🇴', el: '🇬🇷', he: '🇮🇱', th: '🇹🇭', vi: '🇻🇳', id: '🇮🇩', uk: '🇺🇦', bg: '🇧🇬', hr: '🇭🇷', ms: '🇲🇾', tl: '🇵🇭', ca: '🇪🇸', eu: '🇪🇺', gl: '🇪🇸',
                    };
                    const flag = flagMap[langCode] || '🌐';
                    return (
                      <SelectItem key={v.name} value={v.name}>
                        <span className="truncate max-w-[220px] block">
                          {flag} {v.name}
                        </span>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {/* Voice test button */}
          <Button
            variant="outline"
            size="sm"
            disabled={isSpeaking}
            onClick={() => {
              setIsSpeaking(true);
              ttsQueue.clear();
              ttsQueue.enqueue(t('nav.voiceTestMsg'), {
                voice: selectedVoice || undefined,
                rate: voiceRate,
                volume: voiceVolume,
                lang: language === 'de' ? 'de-DE' : 'en-US',
              });
              // Auto-clear isSpeaking state after a reasonable delay
              setTimeout(() => setIsSpeaking(false), 3000);
            }}
            className="w-full h-8 text-xs gap-2 border-sidebar-border justify-center"
          >
            <Play className={`size-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
            {t('nav.testVoice')}
          </Button>

          {/* TTS Verbosity */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-sidebar-foreground/70">
              {t('settings.ttsVerbosity')}
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['off', 'beep', 'compact', 'full'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => updateSetting('ttsVerbosity', v)}
                  className={`
                    py-1.5 px-2 rounded-md border text-[11px] font-medium transition-all
                    ${
                      ttsVerbosity === v
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground/50 hover:bg-sidebar-foreground/10'
                    }
                  `}
                >
                  {t(`settings.ttsVerbosity${v.charAt(0).toUpperCase() + v.slice(1)}` as any)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Map style */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1.5">
            <Map className="size-3.5" />
            {t('settings.mapStyle')}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {getMapStyles().map((ms) => (
              <button
                key={ms.value}
                onClick={() => updateSetting('mapStyle', ms.value)}
                className={`
                  py-2 px-3 rounded-lg border text-xs font-medium transition-all
                  ${
                    mapStyle === ms.value
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground/50 hover:bg-sidebar-foreground/10'
                  }
                `}
              >
                {ms.label}
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Map overlays */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1.5">
            <Layers className="size-3.5" />
            {t('settings.overlays')}
          </Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><Gauge className="size-3" />{t('settings.showDriveInfo')}</span>
              <Switch checked={showDriveInfo} onCheckedChange={(v) => updateSetting('showDriveInfo', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><Thermometer className="size-3" />{t('settings.showWeather')}</span>
              <Switch checked={showWeather} onCheckedChange={(v) => updateSetting('showWeather', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><MapPin className="size-3" />{t('settings.showPOIShortcuts')}</span>
              <Switch checked={showPOIShortcuts} onCheckedChange={(v) => updateSetting('showPOIShortcuts', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><Navigation className="size-3" />{t('settings.showNavArrow')}</span>
              <Switch checked={showNavArrow} onCheckedChange={(v) => updateSetting('showNavArrow', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><MessageSquare className="size-3" />{t('settings.showChat')}</span>
              <Switch checked={showChat} onCheckedChange={(v) => updateSetting('showChat', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><Vote className="size-3" />{t('settings.showVoting')}</span>
              <Switch checked={showVoting} onCheckedChange={(v) => updateSetting('showVoting', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><MapPinned className="size-3" />{t('overlay.showMap')}</span>
              <Switch checked={showOverlayMap} onCheckedChange={(v) => updateSetting('showOverlayMap', v)} />
            </div>
          </div>

          {/* Overlay size sliders */}
          <div className="space-y-2 mt-3 pt-3 border-t border-sidebar-border">
            <Label className="text-[10px] font-medium text-sidebar-foreground/50 uppercase tracking-wider">{t('overlay.size')}</Label>

            {showDriveInfo && (
              <div className="space-y-1 pl-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-sidebar-foreground/50">{t('overlay.speedSize')}</Label>
                  <span className="text-[10px] text-sidebar-foreground/70">{overlaySpeedSize}%</span>
                </div>
                <Slider value={[overlaySpeedSize]} onValueChange={([v]) => updateSetting('overlaySpeedSize', v)} min={50} max={200} step={10} className="w-full" />
              </div>
            )}

            {showDriveInfo && (
              <div className="space-y-1 pl-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-sidebar-foreground/50">{t('overlay.routeInfoSize')}</Label>
                  <span className="text-[10px] text-sidebar-foreground/70">{overlayRouteInfoSize}%</span>
                </div>
                <Slider value={[overlayRouteInfoSize]} onValueChange={([v]) => updateSetting('overlayRouteInfoSize', v)} min={50} max={200} step={10} className="w-full" />
              </div>
            )}

            {showWeather && (
              <div className="space-y-1 pl-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-sidebar-foreground/50">{t('overlay.weatherSize')}</Label>
                  <span className="text-[10px] text-sidebar-foreground/70">{overlayWeatherSize}%</span>
                </div>
                <Slider value={[overlayWeatherSize]} onValueChange={([v]) => updateSetting('overlayWeatherSize', v)} min={50} max={200} step={10} className="w-full" />
              </div>
            )}

            {showChat && (
              <div className="space-y-1 pl-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-sidebar-foreground/50">{t('overlay.chatSize')}</Label>
                  <span className="text-[10px] text-sidebar-foreground/70">{overlayChatSize}%</span>
                </div>
                <Slider value={[overlayChatSize]} onValueChange={([v]) => updateSetting('overlayChatSize', v)} min={50} max={200} step={10} className="w-full" />
              </div>
            )}

            {showVoting && (
              <div className="space-y-1 pl-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-sidebar-foreground/50">{t('overlay.votingSize')}</Label>
                  <span className="text-[10px] text-sidebar-foreground/70">{overlayVotingSize}%</span>
                </div>
                <Slider value={[overlayVotingSize]} onValueChange={([v]) => updateSetting('overlayVotingSize', v)} min={50} max={200} step={10} className="w-full" />
              </div>
            )}

            <div className="space-y-1 pl-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-sidebar-foreground/50">{t('overlay.progressSize')}</Label>
                <span className="text-[10px] text-sidebar-foreground/70">{overlayProgressBarSize}%</span>
              </div>
              <Slider value={[overlayProgressBarSize]} onValueChange={([v]) => updateSetting('overlayProgressBarSize', v)} min={50} max={200} step={10} className="w-full" />
            </div>

            {showOverlayMap && (
              <div className="space-y-1 pl-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-sidebar-foreground/50">{t('overlay.mapSize')}</Label>
                  <span className="text-[10px] text-sidebar-foreground/70">{overlayMapSize}%</span>
                </div>
                <Slider value={[overlayMapSize]} onValueChange={([v]) => updateSetting('overlayMapSize', v)} min={50} max={200} step={10} className="w-full" />
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Map feature overlays */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1.5">
            <Eye className="size-3.5" />
            {language === 'de' ? 'Karten-Elemente' : 'Map Elements'}
          </Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><Route className="size-3" />{t('settings.showRouteLine')}</span>
              <Switch checked={showRouteLine} onCheckedChange={(v) => updateSetting('showRouteLine', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><Route className="size-3" />{t('settings.showAltRoutes')}</span>
              <Switch checked={showAltRoutes} onCheckedChange={(v) => updateSetting('showAltRoutes', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><MapPin className="size-3" />{t('settings.showPOIMarkers')}</span>
              <Switch checked={showPOIMarkers} onCheckedChange={(v) => updateSetting('showPOIMarkers', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><Navigation className="size-3" />{t('settings.showWaypoints')}</span>
              <Switch checked={showWaypoints} onCheckedChange={(v) => updateSetting('showWaypoints', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><Footprints className="size-3" />{t('settings.showDrivenPath')}</span>
              <Switch checked={showDrivenPath} onCheckedChange={(v) => updateSetting('showDrivenPath', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-sidebar-foreground/70 flex items-center gap-1.5"><Mountain className="size-3" />{t('settings.showHillshade')}</span>
              <Switch checked={showHillshade} onCheckedChange={(v) => updateSetting('showHillshade', v)} />
            </div>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* OBS Sync */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1.5">
            <Wifi className="size-3.5" />
            OBS Sync
          </Label>
          <SyncPanel />
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Export/Import/Reset */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs gap-2 border-sidebar-border justify-start"
            onClick={handleExport}
          >
            <Download className="size-3.5" />
            {t('settings.export')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs gap-2 border-sidebar-border justify-start"
            onClick={handleImport}
          >
            {importSuccess ? (
              <>
                <Check className="size-3.5 text-success" />
                <span className="text-success">{t('settings.imported')}</span>
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                {t('settings.import')}
              </>
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />

          {!resetConfirm ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs gap-2 border-danger/30 text-danger hover:bg-danger/10 hover:text-danger justify-start"
              onClick={() => setResetConfirm(true)}
            >
              <RotateCcw className="size-3.5" />
              {t('settings.reset')}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs border-sidebar-border"
                onClick={() => setResetConfirm(false)}
              >
                {t('bot.cancel')}
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 text-xs bg-danger text-white hover:bg-danger/90"
                onClick={handleReset}
              >
                {t('settings.reset')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
