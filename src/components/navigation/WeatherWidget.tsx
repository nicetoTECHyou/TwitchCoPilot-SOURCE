
import { useState, useEffect, useCallback } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  Snowflake,
  CloudLightning,
  Wind,
  Thermometer,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useWeatherStore } from '@/store/useWeatherStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { t } from '@/lib/i18n';

interface WeatherResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    is_day: number;
  };
}

function getWeatherIcon(code: number, isDay: boolean) {
  if (!isDay) {
    if (code === 0) return Cloud;
    if (code <= 3) return Cloud;
    if (code === 45 || code === 48) return Cloud;
    if (code <= 55) return CloudDrizzle;
    if (code <= 67) return CloudRain;
    if (code <= 77) return Snowflake;
    if (code <= 82) return CloudRain;
    return CloudLightning;
  }
  switch (code) {
    case 0: return Sun;
    case 1:
    case 2:
    case 3: return CloudSun;
    case 45:
    case 48: return Cloud;
    case 51:
    case 53:
    case 55: return CloudDrizzle;
    case 61:
    case 63:
    case 65: return CloudRain;
    case 66:
    case 67: return CloudRain;
    case 71:
    case 73:
    case 75:
    case 77: return Snowflake;
    case 80:
    case 81:
    case 82: return CloudRain;
    case 95:
    case 96:
    case 99: return CloudLightning;
    default: return Sun;
  }
}

function getWeatherDescription(code: number): string {
  const map: Record<number, string> = {
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
  return t(map[code] || 'weather.unknown');
}

export default function WeatherWidget() {
  const currentLat = useNavigationStore((s) => s.currentLat);
  const currentLon = useNavigationStore((s) => s.currentLon);
  const sharedSetWeather = useWeatherStore((s) => s.setWeather);
  const weatherCollapsed = useSettingsStore((s) => s.weatherCollapsed);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(false);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API error');
      const data: WeatherResponse = await res.json();
      setWeather(data);
      setLastUpdated(Date.now());
      // Save to shared store for OBS overlay and other consumers
      sharedSetWeather({
        temperature: data.current_weather.temperature,
        windSpeed: data.current_weather.windspeed,
        weatherCode: data.current_weather.weathercode,
        isDay: data.current_weather.is_day,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch weather on position change or every 15 minutes
  useEffect(() => {
    const lat = currentLat ?? 52.52;
    const lon = currentLon ?? 13.405;

    const shouldFetch = !lastUpdated || Date.now() - lastUpdated > 900000;

    if (shouldFetch) {
      fetchWeather(lat, lon);
    }
  }, [currentLat, currentLon, fetchWeather, lastUpdated, sharedSetWeather]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const lat = currentLat ?? 52.52;
      const lon = currentLon ?? 13.405;
      fetchWeather(lat, lon);
    }, 900000);
    return () => clearInterval(interval);
  }, [currentLat, currentLon, fetchWeather, sharedSetWeather]);

  const WeatherIcon = weather
    ? getWeatherIcon(weather.current_weather.weathercode, weather.current_weather.is_day === 1)
    : Sun;

  const temperature = weather?.current_weather?.temperature ?? '--';
  const windSpeed = weather?.current_weather?.windspeed ?? '--';
  const weatherCode = weather?.current_weather?.weathercode ?? 0;

  return (
    <div className="glass rounded-xl min-w-[140px]">
      <div className="flex items-center justify-between p-3 pb-0">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3 h-3 text-primary" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('safety.weather')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const lat = currentLat ?? 52.52;
              const lon = currentLon ?? 13.405;
              fetchWeather(lat, lon);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => updateSetting('weatherCollapsed', !weatherCollapsed)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {weatherCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {!weatherCollapsed && (
        <div className="px-3 pb-3 pt-2">
          {error ? (
            <div className="text-xs text-muted-foreground/60 text-center py-1">
              {t('poi.noResults')}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <WeatherIcon className="w-8 h-8 text-yellow-300 shrink-0" />
              <div className="space-y-1">
                <div className="text-lg font-bold text-foreground tabular-nums leading-none">
                  {temperature}°C
                </div>
                <div className="text-[10px] text-muted-foreground/80 leading-tight">
                  {getWeatherDescription(weatherCode)}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                  <Wind className="w-2.5 h-2.5" />
                  <span>{windSpeed} {t('general.kmh')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
