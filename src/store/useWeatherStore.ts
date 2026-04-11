import { create } from 'zustand';

interface WeatherState {
  temperature: number | null;
  windSpeed: number | null;
  weatherCode: number | null;
  isDay: number;
  lastUpdated: number;

  setWeather: (data: {
    temperature: number;
    windSpeed: number;
    weatherCode: number;
    isDay: number;
  }) => void;
  clearWeather: () => void;
  // Remote sync actions
  setTemperature: (t: number | null) => void;
  setWindSpeed: (w: number | null) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  temperature: null,
  windSpeed: null,
  weatherCode: null,
  isDay: 1,
  lastUpdated: 0,

  setWeather: (data) =>
    set({
      temperature: data.temperature,
      windSpeed: data.windSpeed,
      weatherCode: data.weatherCode,
      isDay: data.isDay,
      lastUpdated: Date.now(),
    }),

  clearWeather: () =>
    set({
      temperature: null,
      windSpeed: null,
      weatherCode: null,
      isDay: 1,
      lastUpdated: 0,
    }),
  // Remote sync actions
  setTemperature: (t) => set({ temperature: t }),
  setWindSpeed: (w) => set({ windSpeed: w }),
}));
