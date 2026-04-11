<div align="center">

# 🚲✨ Twitch CoPilot

### Interaktive Bike Navigation für Jedermann — mit Chat-Anbindung für Twitch Streamer

**Dein Chat steuert deine Route · POIs entdecken · Community-Abenteuer · Live-Übersetzung in 30+ Sprachen**

**von [nicetoTECHyou](https://github.com/nicetotechyou)**

<br>

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL-5.22-1AAC71?logo=maplibre&logoColor=white)](https://maplibre.org)
[![Zustand](https://img.shields.io/badge/Zustand-5-764ABC?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtMyAxMSAxOC02LTktMCIvPjxwYXRoIGQ9Im0zIDE1IDE4IDYtOSAwIi8+PC9zdmc+&logoColor=white)](https://github.com/pmndrs/zustand)
[![tmi.js](https://img.shields.io/badge/tmi.js-1.8.5-5C3A7E)](https://github.com/tmijs/tmi.js)
[![Version](https://img.shields.io/badge/Version-4.2.1-9146FF)](./CHANGELOG.md)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-9146FF?logo=pwa&logoColor=white)](https://web.dev/learn/pwa/)
[![License](https://img.shields.io/badge/License-CC_BY_NC_SA_4.0-green)](#-lizenz)

<br>

[![App Ready to use](https://img.shields.io/badge/APP-READY%20TO%20USE-blue?style=for-the-badge&logo=rocket&logoColor=white)](https://nicetotechyou.github.io/TwitchCoPilot/)
&nbsp;&nbsp;
[![Anleitung](https://img.shields.io/badge/DOKUMENTATION-ZUR%20ANLEITUNG-purple?style=for-the-badge&logo=twitch&logoColor=white)](https://github.com/nicetoTECHyou/TwitchCoPilot/blob/main/Anleitung.md)

<br>
<br>

<img src="https://img.shields.io/badge/Installieren-0%20€-success?style=flat-square" /> &nbsp;
<img src="https://img.shields.io/badge/Account_nötig-NEIN-success?style=flat-square" /> &nbsp;
<img src="https://img.shields.io/badge/API_Key_nötig-NEIN-success?style=flat-square" /> &nbsp;
<img src="https://img.shields.io/badge/Deutsch_&_Englisch-✓-informational?style=flat-square" /> &nbsp;
<img src="https://img.shields.io/badge/100%25_Open_Source-✓-9146FF?style=flat-square" />

</div>

---

## 🚀 In 30 Sekunden loslegen

Twitch CoPilot ist eine Web-App — **nichts installieren, nichts registrieren**. Einfach öffnen und losfahren.

> **1.** App öffnen: [**nicetotechyou.github.io/TwitchCoPilot**](https://nicetotechyou.github.io/TwitchCoPilot/)
>
> **2.** Start und Ziel eingeben — Route wird berechnet
>
> **3.** Auf dem Handy zum Startbildschirm hinzufügen (PWA) — fertig

**Als Streamer?** Twitch-Zugangsdaten in den Einstellungen eingeben — der Bot verbindet sich automatisch und reagiert auf Chat-Befehle.

---

## 🗺️ Übersicht

Twitch CoPilot verwandelt deine Fahrradtour in ein **interaktives Live-Streaming-Erlebnis** — oder dient einfach als vollwertige Bike-Navigation für Jedermann. Dein Twitch-Chat kann Ziele vorschlagen, über Routen abstimmen, POIs entdecken und deine Navigation steuern — alles in **Echtzeit**.

Dein internationales Publikum? Kein Problem! Mit dem integrierten **Universal-Übersetzer** werden Chat-Nachrichten und TTS-Ansagen in **30+ Sprachen** übersetzt — powered by MyMemory API, komplett kostenlos.

Gebaut als **vollständig offline-fähige PWA** mit Service-Worker-Caching für Karten, Routen und API-Daten.

---

## ✨ Features

### 🧭 Navigation
| Feature | Beschreibung |
|---------|-------------|
| 🗺️ **6 Kartenstile** | Straße, Satellit, Topographisch, Dunkel, Hillshade — powered by MapLibre GL, plus **✦ Sterne** — Live-Sternkarte mit Sternbildern, Planeten & Mond |
| 📍 **Routenplanung** | BRouter API mit 7 Routing-Profilen (Fast Bike, Trekking, MTB, Safety, Car, Walk) |
| 🔀 **Via-Stopps** | Unbegrenzte Zwischenstopps per Rechtsklick auf der Karte hinzufügen |
| 📊 **Höhendaten** | Robuste Auf-/Abstiegs-Parsing von BRouter mit Multi-Key-Fallback |
| 🅰️ **Alternative Routen** | Bis zu 3 Routenoptionen garantiert — Fallback-Profile wenn BRouter weniger liefert |
| 📤 **Routen-Export/Import** | JSON (1:1 Route), GPX, KML, TCX für Garmin/Wahoo/Komoot — Route per WhatsApp teilen oder PC→Handy übertragen |
| 🎯 **GPS-Tracking** | Live-Position mit Puls-Animation + Auto-Center während der Navigation |
| 🎮 **Demo-Modus** | 120s simulierte Fahrt mit realistischer Geschwindigkeits-Oszillation |
| 🔄 **Auto-Rerouting** | Automatische Neuberechnung von der aktuellen Position zum Ziel wenn du von der Route abkommst |
| 🔊 **TTS-Navigation** | Abbiegeansagen bei 500m, 200m, 50m + Ankunftsansage per Stimme |

### 📺 Twitch-Integration
| Feature | Beschreibung |
|---------|-------------|
| 🤖 **Twitch Bot** | Vollständiger IRC-Bot mit tmi.js — Auto-Connect beim Seitenladen |
| 💬 **16 Chat-Befehle** | `!navi`, `!poi`, `!vote`, `!wetter`, `!help`, `!tts`, `!translate` + mehr |
| 👍 **Community-Wegpunkte** | Zuschauer schlagen Ziele vor — Streamer bestätigt/lehnt ab |
| 🗳️ **Live-Voting** | Umfragen erstellen, Zuschauer stimmen per Chat ab, Echtzeit-Ergebnisse |
| 🔔 **Alert-System** | Eigene Alerts für Follow, Sub, Gift, Raid, Bits mit TTS |
| 🛡️ **Moderation** | Ban/Timeout-Befehle + eigene Bot-Befehle mit Cooldown |
| 📡 **TTS-Queue** | Prioritätsbasierte Text-to-Speech für Navigation + Events |

### 🌐 Universal-Übersetzer (v3.0.1+)
| Feature | Beschreibung |
|---------|-------------|
| 🌍 **30+ Sprachen** | Deutsch, Englisch, Französisch, Spanisch, Italienisch, Portugiesisch, Niederländisch, Polnisch, Russisch, Japanisch, Chinesisch, Koreanisch, Arabisch, Türkisch, Schwedisch, Tschechisch, Dänisch, Finnisch, Griechisch, Hebräisch, Hindi, Thai, Vietnamesisch, Indonesisch, Ukrainisch, Rumänisch, Ungarisch, Norwegisch + mehr |
| 🔤 **!translate** | `!translate en Hallo Welt` → übersetzt sofort und zeigt im Chat |
| 🔊 **!tts-t** | Text übersetzen + per TTS in der Streamer-Sprache sprechen + Chat-Output |
| 🧠 **MyMemory API** | Kostenloser Übersetzungsservice — kein API-Key nötig, kein Rate-Limit-Problem |
| 🎤 **Sprach-Sync** | TTS nutzt automatisch die eingestellte Sprecher-Sprache für übersetzte Ausgaben |

### 🔍 POI-Entdeckung
| Feature | Beschreibung |
|---------|-------------|
| ⚡ **16 Kategorien** | Ladesäule, Restaurant, Café, Supermarkt, Krankenhaus, Apotheke, Camping, Sehenswürdigkeit, Tankstelle, Trinkwasser, Fahrradwerkstatt, Polizei, Feuerwehr, ATM, Bäckerei + mehr |
| 🌍 **Overpass API** | Echte OpenStreetMap-Daten mit detaillierten Popups (Name, Adresse, Öffnungszeiten) |
| 🎨 **POI-Shortcuts** | Schnellfilter-Karten-Overlay für nahegelegene POIs |
| 📍 **Kontextmenü** | Rechtsklick überall auf der Karte um Wegpunkte hinzuzufügen |
| 🚨 **!notfall** | Chat-Befehl — zeigt Krankenhäuser & Polizei im Umkreis |

### 📡 Multi-Device-Sync
| Feature | Beschreibung |
|---------|-------------|
| 📡 **MQTT-Sync** | Echtzeit-Sync zwischen Handy und PC via EMQX Public MQTT-Broker |
| 🔗 **Raum-Code** | Code eingeben um Geräte zu koppeln — abonniert `twitch-copilot/sync/{code}` |
| 🚀 **Geringe Latenz** | Publish/Subscribe-Modell, Daten fließen Handy → PC in Echtzeit |
| 🛡️ **Self-Receive-Schutz** | Sender (Handy) und Empfänger (Overlay) sind strikt getrennt |
| 📊 **Voller Nav-Sync** | Geschwindigkeit, GPS, Routenfortschritt, ETA, Höhe, km heute — alles live synchronisiert |
| 💬 **Chat + Voting-Sync** | Twitch-Chat-Nachrichten und aktive Votes erscheinen im OBS-Overlay |
| 🌤️ **Wetter-Sync** | Temperatur und Windgeschwindigkeit vom Handy im Overlay angezeigt |

**So funktioniert's:**
1. OBS-Overlay-URL (`?overlay=true`) auf dem PC öffnen — ein Raum-Code erscheint
2. Auf dem Handy: Einstellungen → OBS Sync → Code eingeben → verbinden
3. Alle Navi-Daten strömen live über MQTT zum OBS-Overlay

```
┌──────────────────┐         MQTT         ┌──────────────────┐
│   📱 NAVI-GERÄT   │                      │  🖥️ OVERLAY-GERÄT │
│                  │    Raum-Code          │                  │
│  • GPS-Position  │──────────────────▶   │  • Speedometer   │
│  • Geschwindigkeit│     Echtzeit        │  • Route + Karte │
│  • Routendaten   │                      │  • Twitch Chat   │
│  • Wetter        │◀──────────────────   │  • Voting        │
│                  │                      │  • Wetter        │
│  Handy auf dem   │    nicetotechyou.     │  OBS / Moblin /  │
│  Fahrrad 🚲      │    github.io/...     │  Streamlabs 🎬   │
└──────────────────┘                      └──────────────────┘
```

### 📱 Mobile & PWA
| Feature | Beschreibung |
|---------|-------------|
| 📲 **Installierbare PWA** | Zum Startbildschirm hinzufügen auf iOS, Android, Desktop |
| 🗺️ **Offline-Karten** | Service Worker cached Kartentiles für 30 Tage |
| 📱 **Mobile-First** | Touch-optimiert, kein unerwünschtes Zoomen, Vollbild-Karte |
| 🔐 **HTTPS-Ready** | Erforderlich für GPS auf mobilen Geräten |
| 🌙 **Dark/Light-Modus** | 5 Farbthemen: Twitch, Fahrrad, Electric, Sunset, Pink |
| 🌍 **DE/EN i18n** | Vollständige Deutsch/Englisch-Übersetzung (~200+ Keys) |

### 🎛️ Einstellungen & Overlays
| Feature | Beschreibung |
|---------|-------------|
| 🎚️ **Overlay-Toggles** | 7 unabhängige Schalter für Speed, Wetter, POI, Nav-Pfeil, Chat, Voting, Minimap |
| 📐 **Overlay-Größe** | Pro-Element Schieberegler (50%–200%) für OBS-Overlay-Elemente |
| 🗺️ **Overlay-Minimap** | Kleine dunkle Karte im OBS mit Route + 300m GPS-Radius-Kreis, ein-/ausschaltbar |
| 📺 **OBS-Overlay** | Transparente Browser-Source — respektiert Toggles, skalierbar, hoher Kontrast |
| 🗻 **Hillshade-Overlay** | Geländeschattierung auf jedem Kartenstil |
| 🌤️ **Wetter-Widget** | Live-Wetter von der Open-Meteo API |
| 📐 **Fahr-Info-Panel** | Verschiebbares Overlay: Speed, ETA, Distanz, Höhe, Durchschnitt, km heute |
| 🎨 **5 Themes** | Twitch Lila, Fahrrad Grün, Electric Blau, Sunset Orange, Pink |
| 🌍 **DE/EN i18n** | Vollständige Deutsch/Englisch-Übersetzung (~200+ Keys) |
| ⌨️ **Tastenkürzel** | Leertaste (Navi), D (Demo), M (Karte), F (Vollbild), Esc (Schließen) |

---

## 📺 Twitch-Chat-Steuerung

Deine Zuschauer steuern deine Navigation direkt per Chat — der Bot reagiert auf Befehle in Echtzeit.

```
┌─────────────────────────────────────────────────────────┐
│                    TWITCH CHAT                           │
│                                                          │
│  Zuschauer:  !navi Brandenburger Tor                     │
│       │                                                  │
│       ▼                                                  │
│  ┌─────────┐     ┌──────────┐     ┌──────────────────┐  │
│  │ tmi.js   │────▶│  Bot     │────▶│  Wegpunkt        │  │
│  │ IRC Bot  │     │  prüft   │     │  erscheint auf   │  │
│  │          │◀────│  & antw. │     │  der Karte ✅    │  │
│  └─────────┘     └──────────┘     └──────────────────┘  │
│                                                          │
│  Bot:  ✅ @viewer Wegpunkt hinzugefügt: Brandenburger Tor│
└─────────────────────────────────────────────────────────┘
```

### 💬 Alle Chat-Befehle

| Befehl | Beschreibung | Beispiel |
|--------|-------------|----------|
| `!help` | Alle verfügbaren Befehle anzeigen | `!help` |
| `!version` | Build-Version anzeigen | `!version` |
| `!navi [Adresse]` | Adresse als Navigations-Wegpunkt vorschlagen | `!navi Brandenburger Tor` |
| `!poi [Kategorie]` | POIs suchen | `!poi ladesaeule` |
| `!wetter` | Aktuelles Wetter an GPS-Position | `!wetter` |
| `!position` | Aktuelle GPS-Position anzeigen | `!position` |
| `!stats` | Fahrstatistiken (Speed, Distanz, Höhe) | `!stats` |
| `!route` | Aktuelle Route mit Fortschritt anzeigen | `!route` |
| `!notfall` | Krankenhäuser & Polizei in der Nähe | `!notfall` |
| `!vote [Frage]` | Ja/Nein-Abstimmung starten | `!vote Pause machen?` |
| `!vote start [F] \| [O1] \| [O2]` | Multi-Option-Abstimmung | `!vote start Essen? \| Döner \| Pizza \| Sushi` |
| `!tts <Text>` | Text per TTS sprechen | `!tts Hallo Chat!` |
| `!tts-t <Text>` | Text übersetzen + sprechen + Chat | `!tts-t Hello Chat!` |
| `!translate <Sprache> <Text>` | Universal-Übersetzer (30+ Sprachen) | `!translate en Guten Morgen` |
| `!rank` | Command-Ranking der Zuschauer | `!rank` |

---

## 🌐 Universal-Übersetzer

Dein internationales Publikum? Kein Problem — Chat-Nachrichten werden automatisch übersetzt.

```
🇩🇪 Zuschauer:   "wie spät ist es?"
         │
         ▼  !translate de auto ON
┌──────────────────┐
│  MyMemory API    │
│  (kostenlos,     │
│   kein Key)      │
└──────┬───────────┘
       ▼
🇬🇧 Chat:  "what time is it?"  ← automatically shown
```

- **30+ Sprachen** unterstützt — DE, EN, FR, ES, IT, PT, NL, PL, RU, JA, ZH, KO, AR, TR, SV + mehr
- **3 Modi:** `!translate <sprache>` = Auto-Übersetzung AN / `!translate <sprache> <text>` = Einmal / `!translate off` = AUS
- **TTS-Integration:** `!tts-t` übersetzt UND spricht den Text in der Streamer-Sprache

---

## 🔍 POI-Entdeckung

16 Kategorien — echte OpenStreetMap-Daten mit detaillierten Popups.

| | | | |
|---|---|---|---|
| ⚡ Ladesäule | 🍕 Restaurant | ☕ Café | 🛒 Supermarkt |
| 🏥 Krankenhaus | 💊 Apotheke | ⛺ Camping | 🏛️ Sehenswürdigkeit |
| ⛽ Tankstelle | 💧 Trinkwasser | 🔧 Fahrradwerkstatt | 🚓 Polizei |
| 🚒 Feuerwehr | 🏧 ATM | 🥐 Bäckerei | + mehr |

- **Kartensuche** per Rechtsklick auf der Karte
- **POI-Shortcuts** als Schnellfilter-Overlay
- **!notfall** Chat-Befehl zeigt Krankenhäuser & Polizei sofort

---

## 🎛️ Themes

Wähle dein Farbthema in den Einstellungen:

| Theme | Beschreibung |
|-------|-------------|
| 🟣 **Twitch** | Klassisch Lila — perfekt für Streaming |
| 🟢 **Fahrrad** | Grün — naturverbunden, frisch |
| 🔵 **Electric** | Blau — technisch, clean |
| 🟠 **Sunset** | Orange — warm, energiegeladen |
| 🩷 **Pink** | Pink — auffallend, stylisch |

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

## 🔌 APIs

| API | Zweck | Cache-Strategie |
|-----|-------|-----------------|
| [BRouter](https://brouter.de) | Routenberechnung (7 Profile) | NetworkFirst, 1h |
| [Nominatim](https://nominatim.org) | Geocoding / Adresssuche | NetworkFirst, 7d |
| [Overpass](https://overpass-api.de) | POI-Suche (16 Kategorien) | NetworkFirst, 1d |
| [Open-Meteo](https://open-meteo.com) | Wetterdaten | NetworkFirst, 15m |
| [MyMemory](https://mymemory.translated.net) | Übersetzung (30+ Sprachen) | NetworkOnly |
| [Map Tiles](https://cartocdn.com) | Straße/Satellit/Topo/Dunkel | CacheFirst, 30d |

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

## 📁 Projektstruktur

```
src/
├── components/
│   ├── chat/
│   │   └── TwitchChatManager.tsx    # Twitch Bot Logic, Command Handler, Diagnostik
│   ├── map/
│   │   ├── MapContainer.tsx          # MapLibre Karte, Waypoint/POI-Marker, ErrorBoundary
│   │   ├── SkyChart.tsx              # Sternkarte mit Sternbildern & Planeten
│   │   └── NavArrow.tsx              # Navigations-Richtungspfeil
│   ├── navigation/
│   │   ├── WeatherWidget.tsx         # Wetter-Widget (Open-Meteo)
│   │   ├── DriveInfoPanel.tsx        # Fahr-Info-Overlay (Speed, ETA, Höhe)
│   │   ├── MuteButton.tsx            # TTS Stummschaltung
│   │   └── POIShortcuts.tsx          # POI-Schnellfilter Overlay
│   ├── sidebar/
│   │   ├── Sidebar.tsx               # Sidebar Layout, Tab-Navigation
│   │   ├── SettingsPanel.tsx         # App-Einstellungen, Overlay-Konfiguration
│   │   └── tabs/
│   │       ├── RouteTab.tsx          # Routing, Geocoding, GPX/KML/TCX Export
│   │       ├── POITab.tsx            # POI Suche mit Overpass API (16 Kategorien)
│   │       ├── StreamerTab.tsx       # Twitch Connection, Alerts, Commands, Moderation
│   │       └── NavigateTab.tsx       # GPS-Tracking, Demo-Modus, Community Waypoints
│   ├── sync/
│   │   └── SyncPanel.tsx             # MQTT Multi-Device-Sync Panel
│   ├── overlay/
│   │   └── OBSOverlayPage.tsx        # Vollständiges OBS-Overlay
│   └── ui/                           # Radix UI + shadcn/ui Komponenten
├── store/
│   ├── useTwitchStore.ts             # Twitch State (Messages, Alerts, Commands, Votes, Bans)
│   ├── useNavigationStore.ts         # Navigation State (Waypoints, Route, GPS)
│   ├── useSettingsStore.ts           # App-Einstellungen (persisted in localStorage)
│   └── usePOIStore.ts                # POI State (Kategorien, Suche, Ergebnisse)
├── lib/
│   ├── i18n.ts                       # Deutsch/Englisch Übersetzungen (~200+ Keys)
│   ├── ttsQueue.ts                   # TTS Warteschlange mit Prioritäten
│   └── overpass.ts                   # Overpass API mit Retry + Fallback
├── App.tsx                           # Main App + ErrorBoundary
└── types/
    └── index.ts                      # TypeScript Interfaces
```

---

## 🛠️ Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Dev-Server starten (localhost:5173)
npm run dev

# Production Build erstellen → dist/
npm run build

# Build lokal testen
npx serve dist
```

---

## 📦 Deployment

Static-Files werden auf GitHub Pages deployed:
**https://nicetotechyou.github.io/TwitchCoPilot/**

### Tar-Struktur
```
twitch-copilot-vX.Y.Z.tar              ← Release-Tar (alles in einem)
├── twitch-copilot-vX.Y.Z-source.tar   ← Kompletter Source + README + CHANGELOG + VERSION
├── twitch-copilot-vX.Y.Z-static.tar   ← Production Build (dist/) + README + CHANGELOG + VERSION
└── VERSION
```

> **WICHTIG — Static-Tar Inhalts-Regel:** Nach jedem Build MÜSSEN die Dateien `README.md`, `CHANGELOG.md` und `VERSION` in den `dist/` Ordner kopiert werden, bevor der Static-Tar erstellt wird. Ohne diesen Schritt enthält der Static-Tar keine Dokumentation.
>
> **Schritte nach Release-Vorbereitung:**
> 1. `VERSION`, `CHANGELOG.md`, `README.md`, `package.json` mit neuer Version aktualisieren
> 2. `npm run build` → erzeugt `dist/`
> 3. `cp VERSION CHANGELOG.md README.md dist/` ← **PFLICHT** — docs in den Build-Ordner
> 4. Source-Tar und Static-Tar packen
> 5. Combined-Tar erstellen
>
> **Beide Tars enthalten README.md und CHANGELOG.md** — Source-Tar hat die vollständige Entwickler-Dokumentation, Static-Tar hat die Deployment-Dokumentation.

### Browser-Support
[![Chrome](https://img.shields.io/badge/Chrome-90+-4285F4?logo=googlechrome&logoColor=white)](https://www.google.com/chrome/)
[![Firefox](https://img.shields.io/badge/Firefox-90+-FF7139?logo=firefoxbrowser&logoColor=white)](https://www.mozilla.org/firefox/)
[![Safari](https://img.shields.io/badge/Safari-15+-006CFF?logo=safari&logoColor=white)](https://www.apple.com/safari/)
[![Edge](https://img.shields.io/badge/Edge-90+-0078D7?logo=microsoftedge&logoColor=white)](https://www.microsoft.com/edge)

### Wichtige Hinweise
- **GPS** erfordert HTTPS (auf localhost funktioniert es auch ohne)
- **TTS** (Text-to-Speech) benötigt Chrome Speech Synthesis API
- **PWA** wird automatisch installiert (Service Worker)

---

## ❓ Häufig gestellte Fragen

<details>
<summary><strong>📌 Was brauche ich um Twitch CoPilot zu nutzen?</strong></summary>
<br>

Nichts außer einem Browser. Die App läuft im Browser — auf dem Handy, Tablet oder PC. Für GPS brauchst du HTTPS (funktioniert automatisch auf der gehosteten Version). Für die Twitch-Integration brauchst du einen Twitch-Account und einen OAuth-Token (wird in den Einstellungen generiert).

</details>

<details>
<summary><strong>📌 Kostet das etwas?</strong></summary>
<br>

Nein. Twitch CoPilot ist **100% kostenlos** — keine In-App-Käufe, keine Werbung, keine Premium-Features. Alle APIs die genutzt werden (BRouter, Nominatim, Overpass, Open-Meteo, MyMemory) sind kostenlos und offen. Das Projekt ist unter CC BY-NC-SA 4.0 lizenziert.

</details>

<details>
<summary><strong>📌 Muss ich mich registrieren?</strong></summary>
<br>

Nein. Kein Account, keine Registrierung, keine E-Mail-Adresse. Einfach die App öffnen und loslegen. Nur für die Twitch-Integration brauchst du deine Twitch-Zugangsdaten — die bleiben auf deinem Gerät (localStorage), nichts wird an uns gesendet.

</details>

<details>
<summary><strong>📌 Funktioniert das auch ohne Twitch?</strong></summary>
<br>

Ja! Twitch CoPilot ist eine vollständige Bike-Navigation — auch ohne Stream. Routen berechnen, GPS-Tracking, POI-Suche, Wetter, Export/Import — alles funktioniert ohne Twitch. Die Chat-Befehle sind ein Bonus für Streamer.

</details>

<details>
<summary><strong>📌 Wie funktioniert das Overlay beim Streaming vom Handy?</strong></summary>
<br>

Wenn du mit Apps wie **Moblin** oder **Streamlabs** vom Handy streamst, öffne die Overlay-URL auf einem **zweiten Gerät** (z.B. einem Laptop oder Tablet) als Browser-Source in deiner Streaming-Software. Dein Handy auf dem Rad sendet die Navi-Daten über MQTT an das Overlay-Gerät. Der Raum-Code koppelt beide Geräte.

</details>

<details>
<summary><strong>📌 Welche Browser werden unterstützt?</strong></summary>
<br>

Chrome 90+, Firefox 90+, Safari 15+, Edge 90+. Für GPS-Funktionen wird Chrome empfohlen. TTS (Text-to-Speech) funktioniert am besten in Chrome.

</details>

<details>
<summary><strong>📌 Kann ich meine eigenen Routen importieren?</strong></summary>
<br>

Ja! Unterstützte Formate: **JSON** (1:1 identische Route), **GPX**, **KML**, **TCX**. Du kannst auch eine berechnete Route exportieren und auf einem anderen Gerät importieren — z.B. Route auf dem PC planen, als JSON an dich selbst per WhatsApp senden, auf dem Handy öffnen und losfahren.

</details>

---

## 📋 Versionshistorie

Alle Änderungen sind detailliert in der [CHANGELOG.md](./CHANGELOG.md) dokumentiert.

| Typ | Format | Beschreibung |
|-----|--------|-------------|
| **Patch** | x.x.Z | Bug Fixes, kleine Korrekturen |
| **Minor** | x.Y.0 | Große Fixes, Security, Route-Änderungen |
| **Major** | X.0.0 | Neue Features, Breaking Changes |

---

## 🔗 Links

| | |
|---|---|
| 🚀 **App starten** | [nicetotechyou.github.io/TwitchCoPilot](https://nicetotechyou.github.io/TwitchCoPilot/) |
| 📖 **Anleitung** | [Anleitung.md](./Anleitung.md) |
| 📋 **Changelog** | [CHANGELOG.md](./CHANGELOG.md) |
| 🛠️ **Entwickler-Doku** | [README.SOURCE.md](./README.SOURCE.md) |
| 💻 **Quellcode** | [GitHub Repository](https://github.com/nicetoTECHyou/TwitchCoPilot) |

---

## 📜 Lizenz

Dieses Projekt ist **Open Source** und darf frei verwendet, studiert und modifiziert werden — jedoch **nicht kommerziell verwertet**.

**Non-Commercial Open Source (CC BY-NC-SA 4.0)**

- ✅ Quellcode einsehen, lernen und modifizieren
- ✅ Privat nutzen und weitergeben (nicht-kommerziell)
- ✅ Eigene Projekte darauf aufbauen (nicht-kommerziell)
- ❌ **Nicht verkaufen** — das Projekt darf nicht als Produkt oder Service gegen Bezahlung angeboten werden
- ❌ **Nicht als kostenpflichtige App, SaaS oder kommerzielles Produkt** verwenden oder weiterverkaufen
- 📝 Namensnennung erforderlich: "Basierend auf TwitchCoPilot von [nicetoTECHyou](https://github.com/nicetotechyou)"
- 🔄 Abgeleitete Werke müssen unter derselben Lizenz stehen

Solltest du das Projekt kommerziell nutzen wollen, kontaktiere uns für eine separate Vereinbarung.

---

<div align="center">

**Built with 💜 for the bike streaming community**

**by [nicetoTECHyou](https://github.com/nicetotechyou)**

</div>
