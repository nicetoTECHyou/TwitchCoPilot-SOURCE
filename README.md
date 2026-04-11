<div align="center">

# 🛠️ Twitch CoPilot — Entwickler-Dokumentation

### Source Code, Build, Deployment, Architektur

**Diese Datei ist fur Entwickler gedacht. Die Benutzer-Dokumentation findet sich in [README.md](./README.md).**

<br>

[![Version](https://img.shields.io/badge/Version-4.2.1-9146FF)](./CHANGELOG.md)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-CC_BY_NC_SA_4.0-green)](#-lizenz)

</div>

---

## ⚡ Quick Start

```bash
# 1. Repository klonen
git clone https://github.com/nicetoTECHyou/TwitchCoPilot.git
cd TwitchCoPilot

# 2. Abhangigkeiten installieren
npm install

# 3. Dev-Server starten (localhost:5173)
npm run dev

# 4. Production Build
npm run build
```

---

## 🛠️ Tech Stack

| Technologie | Zweck |
|-----------|-------|
| ![React](https://img.shields.io/badge/React-61DAFB?logo=react) | UI-Framework (v19) |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript) | Type Safety (v5.8) |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss) | Styling (v4) |
| ![Zustand](https://img.shields.io/badge/Zustand-764ABC) | State Management (v5) |
| ![MapLibre GL](https://img.shields.io/badge/MapLibre-1AAC71?logo=maplibre) | Karten-Rendering (v5.22) |
| ![Radix UI](https://img.shields.io/badge/Radix_UI-6E56CF?logo=radixui) | UI-Komponenten |
| ![tmi.js](https://img.shields.io/badge/tmi.js-5C3A7E) | Twitch IRC (v1.8.5) |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite) | Build-Tool (v8) |
| ![Workbox](https://img.shields.io/badge/Workbox-FF6B35?logo=google) | Service Worker (PWA) |
| ![MQTT](https://img.shields.io/badge/MQTT-EMQX-660066?logo=eclipse-mosquitto) | Multi-Device-Sync |

---

## 🏗️ Architektur

```
┌──────────────────────────────────────────────────────────────────┐
│                        Twitch CoPilot                            │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐ │
│  │   🗺️ MapLibre   │  │  📺 Twitch IRC  │  │   🎛️ Sidebar     │ │
│  │   GL JS Karte    │  │   tmi.js Bot    │  │  Route / POI /   │ │
│  │                  │  │                 │  │  Streamer / Nav  │ │
│  └────────┬─────────┘  └────────┬────────┘  └────────┬─────────┘ │
│           │                     │                    │            │
│           ▼                     ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                    ⚡ Zustand Stores                         ││
│  │  useNavigationStore  │  useTwitchStore  │  usePOIStore      ││
│  │  useSettingsStore    │  (persisted)     │  (Kategorien)     ││
│  └──────────────────────────────────────────────────────────────┘│
│           │                     │                    │            │
│           ▼                     ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                    🌐 External APIs                          ││
│  │  BRouter (Routing)  │  Nominatim (Geocode)  │  Overpass    ││
│  │  Open-Meteo (Wetter)│  MyMemory (Translate)  │  MQTT Sync   ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                    📱 PWA / Service Worker                    ││
│  │  Offline-Karten · Precaching · Background-Sync               ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔌 APIs

| API | Zweck | Cache-Strategie |
|-----|-------|-----------------|
| [BRouter](https://brouter.de) | Routenberechnung (7 Profile) | NetworkFirst, 1h |
| [Nominatim](https://nominatim.org) | Geocoding / Adresssuche | NetworkFirst, 7d |
| [Overpass](https://overpass-api.de) | POI-Suche (16 Kategorien) | NetworkFirst, 1d |
| [Open-Meteo](https://open-meteo.com) | Wetterdaten | NetworkFirst, 15m |
| [MyMemory](https://mymemory.translated.net) | Ubersetzung (30+ Sprachen) | NetworkOnly |
| [Map Tiles](https://cartocdn.com) | Strasse/Satellit/Topo/Dunkel | CacheFirst, 30d |

---

## 📁 Projektstruktur

```
src/
├── components/
│   ├── chat/
│   │   └── TwitchChatManager.tsx    # Twitch Bot Logic, Command Handler
│   ├── map/
│   │   ├── MapContainer.tsx          # MapLibre Karte, Waypoint/POI-Marker
│   │   ├── SkyChart.tsx              # Sternkarte mit Sternbildern & Planeten
│   │   └── NavArrow.tsx              # Navigations-Richtungspfeil
│   ├── navigation/
│   │   ├── WeatherWidget.tsx         # Wetter-Widget (Open-Meteo)
│   │   ├── DriveInfoPanel.tsx        # Fahr-Info-Overlay (Speed, ETA, Hohe)
│   │   ├── MuteButton.tsx            # TTS Stummschaltung
│   │   └── POIShortcuts.tsx          # POI-Schnellfilter Overlay
│   ├── sidebar/
│   │   ├── Sidebar.tsx               # Sidebar Layout, Tab-Navigation
│   │   ├── SettingsPanel.tsx         # App-Einstellungen, Overlay-Konfiguration
│   │   └── tabs/
│   │       ├── RouteTab.tsx          # Routing, Geocoding, GPX/KML/TCX Export
│   │       ├── POITab.tsx            # POI Suche mit Overpass API
│   │       ├── StreamerTab.tsx       # Twitch Connection, Alerts, Commands
│   │       └── NavigateTab.tsx       # GPS-Tracking, Demo-Modus
│   ├── sync/
│   │   └── SyncPanel.tsx             # MQTT Multi-Device-Sync Panel
│   ├── overlay/
│   │   └── OBSOverlayPage.tsx        # Vollstandiges OBS-Overlay
│   └── ui/                           # Radix UI + shadcn/ui Komponenten
├── store/
│   ├── useTwitchStore.ts             # Twitch State (Messages, Alerts, Commands, Votes)
│   ├── useNavigationStore.ts         # Navigation State (Waypoints, Route, GPS)
│   ├── useSettingsStore.ts           # App-Einstellungen (persisted in localStorage)
│   └── usePOIStore.ts                # POI State (Kategorien, Suche, Ergebnisse)
├── lib/
│   ├── i18n.ts                       # Deutsch/Englisch Ubersetzungen (~200+ Keys)
│   ├── ttsQueue.ts                   # TTS Warteschlange mit Prioritaten
│   └── overpass.ts                   # Overpass API mit Retry + Fallback
├── App.tsx                           # Main App + ErrorBoundary
└── types/
    └── index.ts                      # TypeScript Interfaces
```

---

## 📦 Release & Deployment

### GitHub Pages
Static-Files werden auf GitHub Pages deployed:
**https://nicetotechyou.github.io/TwitchCoPilot/**

### Tar-Struktur
```
twitch-copilot-vX.Y.Z.tar              ← Release-Tar (alles in einem)
├── twitch-copilot-vX.Y.Z-source.tar   ← Kompletter Source + README + CHANGELOG + VERSION
├── twitch-copilot-vX.Y.Z-static.tar   ← Production Build (dist/) + README + CHANGELOG + VERSION
└── VERSION
```

### Release-Prozess

> **WICHTIG — Static-Tar Inhalts-Regel:** Nach jedem Build MUSSEN die Dateien `README.md`, `CHANGELOG.md` und `VERSION` in den `dist/` Ordner kopiert werden, bevor der Static-Tar erstellt wird.

```bash
# 1. Version in allen Dateien aktualisieren:
#    VERSION, package.json, CHANGELOG.md, README.md, !version Command

# 2. Production Build erstellen
npm run build

# 3. Docs in dist/ kopieren (PFLICHT!)
cp VERSION CHANGELOG.md README.md dist/

# 4. Source-Tar packen
tar -cf twitch-copilot-vX.Y.Z-source.tar \
  --exclude='dist' --exclude='download' --exclude='node_modules' \
  --exclude='.git' --exclude='upload' --exclude='.vite' \
  -C /pfad/zum/projekt src/ public/ index.html package.json \
  package-lock.json bun.lock tsconfig.json vite.config.ts \
  VERSION README.md CHANGELOG.md docs/

# 5. Static-Tar packen
tar -cf twitch-copilot-vX.Y.Z-static.tar -C /pfad/zum/projekt dist/

# 6. Combined-Tar erstellen
tar -cf twitch-copilot-vX.Y.Z.tar \
  twitch-copilot-vX.Y.Z-source.tar \
  twitch-copilot-vX.Y.Z-static.tar \
  VERSION README.md CHANGELOG.md
```

### Build testen

```bash
# Build erstellen
npm run build

# Lokal testen
npx serve dist

# Lint prufen
npm run lint
```

### Browser-Support
[![Chrome](https://img.shields.io/badge/Chrome-90+-4285F4?logo=googlechrome&logoColor=white)](https://www.google.com/chrome/)
[![Firefox](https://img.shields.io/badge/Firefox-90+-FF7139?logo=firefoxbrowser&logoColor=white)](https://www.mozilla.org/firefox/)
[![Safari](https://img.shields.io/badge/Safari-15+-006CFF?logo=safari&logoColor=white)](https://www.apple.com/safari/)
[![Edge](https://img.shields.io/badge/Edge-90+-0078D7?logo=microsoftedge&logoColor=white)](https://www.microsoft.com/edge)

### Wichtige Hinweise
- **GPS** erfordert HTTPS (auf localhost funktioniert es auch ohne)
- **TTS** benotigt Chrome Speech Synthesis API
- **PWA** wird automatisch installiert (Service Worker)

---

## 🔗 Links

| | |
|---|---|
| 📖 **Benutzer-Dokumentation** | [README.md](./README.md) |
| 📖 **Anleitung** | [Anleitung.md](./Anleitung.md) |
| 📋 **Changelog** | [CHANGELOG.md](./CHANGELOG.md) |
| 💻 **GitHub Repository** | [nicetoTECHyou/TwitchCoPilot](https://github.com/nicetoTECHyou/TwitchCoPilot) |

---

## 📜 Lizenz

CC BY-NC-SA 4.0 — siehe [README.md](./README.md#-lizenz) fur Details.

---

<div align="center">

**Built with 💜 for the bike streaming community**

**by [nicetoTECHyou](https://github.com/nicetoTECHyou)**

</div>
