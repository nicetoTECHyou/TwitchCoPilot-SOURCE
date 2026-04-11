# TwitchCoPilot — Vollständige Anleitung

## 📖 Inhaltsverzeichnis

1. [Was ist TwitchCoPilot?](#1-was-ist-twitchcopilot)
2. [Die gehostete Version nutzen — Schnellstart für Neulinge](#2-die-gehostete-version-nutzen--schnellstart-für-neulinge)
3. [Die Benutzeroberfläche verstehen](#3-die-benutzeroberfläche-verstehen)
4. [Navigation — Routen planen und fahren](#4-navigation--routen-planen-und-fahren)
5. [POI-Suche — Points of Interest finden](#5-poi-suche--points-of-interest-finden)
6. [Twitch-Chat-Integration — Der Bot](#6-twitch-chat-integration--der-bot)
7. [Alle Chat-Befehle im Detail](#7-alle-chat-befehle-im-detail)
8. [Voting-System — Live-Abstimmungen](#8-voting-system--live-abstimmungen)
9. [TTS Sprachausgabe](#9-tts-sprachausgabe)
10. [Übersetzungssystem — 30+ Sprachen](#10-übersetzungssystem--30-sprachen)
11. [Browser-Source Overlay — Navi im Stream anzeigen](#11-browser-source-overlay--navi-im-stream-anzeigen)
12. [Multi-Device-Sync — Handy + PC verbinden](#12-multi-device-sync--handy--pc-verbinden)
13. [Einstellungen — Alles anpassen](#13-einstellungen--alles-anpassen)
14. [Themen und Farbschemata](#14-themen-und-farbschemata)
15. [PWA — Als App installieren](#15-pwa--als-app-installieren)
16. [Route JSON Import/Export](#16-route-json-importexport)
17. [Routen-Export — GPX, KML, TCX](#17-routen-export--gpx-kml-tcx)
18. [Tastenkürzel](#18-tastenkürzel)
19. [Command-Berechtigungen und Moderation](#19-command-berechtigungen-und-moderation)
20. [Alert-System — Follows, Subs, Raids](#20-alert-system--follows-subs-raids)
21. [Für Entwickler — Eigenen Server aufsetzen](#21-für-entwickler--eigenen-server-aufsetzen)
22. [Projektstruktur und Sourcecode erklärt](#22-projektstruktur-und-sourcecode-erklärt)
23. [Versionierung und Updates](#23-versionierung-und-updates)
24. [Technischer Hintergrund — APIs und Services](#24-technischer-hintergrund--apis-und-services)
25. [FAQ — Häufig gestellte Fragen](#25-faq--häufig-gestellte-fragen)
26. [Neuerungen in v3.0.6–v4.2.1 (Changelog)](#26-neuerungen-in-v306v420-changelog)

---

## 1. Was ist TwitchCoPilot?

TwitchCoPilot ist eine **vollständig kostenlose, Open-Source** interaktive Navigations-Anwendung, die speziell für Twitch-Streamer entwickelt wurde. Sie verwandelt eine normale Fahrradtour, Roadtrip oder Camping-Reise in ein **interaktives Live-Streaming-Erlebnis**, bei dem deine Zuschauer aktiv teilnehmen können.

### Was macht es besonders?

- **Deine Zuschauer steuern mit** — Sie schlagen Ziele vor, stimmen über Routen ab, entdecken POIs und interagieren in Echtzeit über den Twitch-Chat
- **Kein eigener Server nötig** — Die gehostete Version auf der Webseite funktioniert sofort, keine Anmeldung, keine Installation, kein Cloud-Hosting erforderlich
- **Vollständig kostenlos** — Alle verwendeten APIs (Routing, Geocoding, Wetter, Übersetzung) sind kostenlos und Open Source. Keine API-Keys nötig
- **Offline-fähig** — Dank PWA (Progressive Web App) mit Service Worker-Caching funktioniert die App auch teilweise ohne Internetverbindung
- **Sprach-Support** — Deutsch und Englisch als Oberflächensprache, 30+ Sprachen für den Chat-Übersetzer

### Wer ist es für?

| Zielgruppe | Beschreibung |
|---|---|
| **Twitch-Streamer** | Die Hauptzielgruppe. Verbinde deinen Kanal und lass deine Zuschauer interagieren |
| **Cargo-Bike Fahrer** | Speziell optimiert für Lastenfahrräder mit Ladesäulen-Suche und E-Bike-Routing |
| **Camping-Enthusiasten** | Wildcamping-Plätze, Wohnmobil-Stellplätze und POI-Suche direkt auf der Karte |
| **Fahrrad-Tourer** | GPX/KML/TCX Export für Garmin, Wahoo, Komoot und andere Navigationsgeräte |
| **Community** | Jeder der einfach eine kostenlose, schöne Karte mit Twitch-Integration nutzen möchte |

### Technologie

Gebaut mit modernen Web-Technologien: React 19, TypeScript, Vite 8, Tailwind CSS 4, MapLibre GL für die Karte, Zustand für den State, Radix UI für Komponenten, tmi.js für Twitch IRC, und vieles mehr. Der komplette Sourcecode ist auf GitHub verfügbar (CC BY-NC-SA 4.0 — Non-Commercial Open Source).

---

## 2. Die gehostete Version nutzen — Schnellstart für Neulinge

**Du brauchst nichts zu installieren. Keinen Server. Keine Datenbank. Nichts.**

Die einfachste Möglichkeit ist die gehostete Version, die immer auf dem neuesten Stand ist und automatisch erweitert wird.

### Schritt 1: Öffne die Webseite

Gehe einfach auf die gehostete URL im Browser:
```
https://nicetotechyou.github.io/TwitchCoPilot/
```

Das ist alles. Die App lädt direkt im Browser — kein Download, kein Account, keine Anmeldung.

### Schritt 2: Erlaube den Standortzugriff

Wenn dein Browser nach dem Standort fragt, klicke auf **"Erlauben"**. Das wird benötigt für:
- Deine aktuelle Position auf der Karte anzeigen
- Wetterdaten für deinen Standort
- GPS-Navigation während der Fahrt

> **Wichtig auf Mobilgeräten:** GPS funktioniert nur über HTTPS. Die gehostete Version läuft automatisch über HTTPS, also kein Problem. Auf dem eigenen PC mit `localhost` funktioniert GPS auch ohne HTTPS.

### Schritt 3: App installieren (optional aber empfohlen)

Die App ist eine **PWA (Progressive Web App)**. Du kannst sie wie eine native App auf deinem Gerät installieren:

- **Android Chrome:** Tippe auf das Menü (⋮) → "Zum Startbildschirm hinzufügen"
- **iOS Safari:** Tippe auf das Teilen-Symbol (↑) → "Zum Startbildschirm"
- **Desktop Chrome/Edge:** Klicke auf das Install-Icon in der Adressleiste

Dadurch wird die App wie eine normale App angezeigt, hat ein eigenes Icon auf dem Startbildschirm und öffnet sich im Vollbild ohne Browser-Leiste.

### Schritt 4: Loslegen!

Jetzt kannst du:
- Auf der Karte navigieren und Routen planen
- In der Seitenleiste (links) zwischen den Tabs wechseln
- POIs in deiner Nähe suchen
- Das Wetter abfragen
- Den Twitch-Chat verbinden (siehe Kapitel 6)

### Was passiert mit meinen Daten?

**Nichts.** TwitchCoPilot speichert keine Daten auf externen Servern. Alle Einstellungen und der State werden **lokal in deinem Browser** gespeichert (localStorage / IndexedDB). Die einzige externe Kommunikation ist:
- Twitch IRC (für den Chat-Bot, nur wenn du dich verbindest)
- API-Abfragen (Routing, Wetter, POI-Suche, Übersetzung) — diese sind öffentlich und kostenlos

---

## 3. Die Benutzeroberfläche verstehen

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [☰]                                       [🔍] [+] [−] [🧭]   │  ← Karten-Controls
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                        │
│ SIDEBAR  │                   KARTE                               │
│ (links)  │               (MapLibre GL)                           │
│          │                                                        │
│ ┌──────┐ │   [Wegpunkte]  [POI-Marker]  [GPS-Punkt]              │
│ │Route │ │                                                        │
│ │Nav   │ │   [Weather-Widget]    [Drive-Info-Panel]              │
│ │Strmr │ │                                                        │
│ │POI   │ │   [POI-Shortcuts]      [Nav-Pfeil]                   │
│ │Einst │ │                                                        │
│ └──────┘ │   [Chat-Overlay]       [Voting-Panel]                │
│          │                                                        │
└──────────┴───────────────────────────────────────────────────────┘
```

### Seitenleiste (Sidebar)

Die linke Seitenleiste hat **5 Tabs**:

| Tab | Icon | Beschreibung |
|-----|------|-------------|
| **Route** | 🗺️ | Routenplanung mit Start, Via-Stopps und Ziel. Geocoding-Suche, Routing-Profile, GPX/KML/TCX Export |
| **Navigation** | 🧭 | GPS-Tracking, Demo-Modus, Community-Wegpunkte (von Chat-Vorschlägen), Live-Navigation mit TTS |
| **Streamer Bot** | 📺 | Twitch-Verbindung, Alert-System, Custom Commands, Moderation, Ban-History |
| **POI** | 🔍 | POI-Suche mit 16 Kategorien, Filter, Ergebnisse auf der Karte, Detail-Popups |
| **Einstellungen** | ⚙️ | Sprache, Theme, Dark/Light-Modus, Sprachausgabe, Kartenstil, Overlay-Toggles, OBS-Sync, Export/Import |

Die Sidebar ist **resizable** — ziehe am rechten Rand um sie breiter oder schmaler zu machen. Auf mobilen Geräten wird sie als Vollbild-Overlay geöffnet.

### Karten-Controls

Oben rechts auf der Karte findest du vier Buttons:

| Button | Funktion | Tastenkürzel |
|--------|----------|--------------|
| 🔍+ | Karte vergrößern | `+` oder Scroll |
| 🔍− | Karte verkleinern | `−` oder Scroll |
| 🧭 | Karte nach Norden ausrichten | `M` |
| □ | Vollbild-Modus | `F` |

### Kontextmenü (Rechtsklick)

Ein **Rechtsklick** (bzw. Long-Press auf Mobil) auf eine beliebige Stelle der Karte öffnet ein Kontextmenü mit drei Optionen:

- **Start setzen** — Setzt den Startpunkt der Route an diese Position
- **Via setzen** — Fügt einen Zwischenstopp hinzu
- **Ziel setzen** — Setzt das Ziel der Route an diese Position

---

## 4. Navigation — Routen planen und fahren

### Route eingeben

1. Öffne den Tab **"Route"** in der Seitenleiste
2. Gib in das Feld **"Start"** eine Adresse ein (z.B. "Berlin Hauptbahnhof")
3. Die Autovervollständigung zeigt Vorschläge — klicke auf einen um ihn auszuwählen
4. Gib in das Feld **"Ziel"** deine Zieladresse ein
5. Optional: Füge **Via-Stopps** hinzu (bis zu 10 Zwischenstopps)
6. Wähle ein **Routing-Profil** (siehe unten)
7. Klicke auf **"Route berechnen"**

### Routing-Profile

Es gibt **7 Routing-Profile** für verschiedene Verkehrsmittel:

| Profil | Icon | Beschreibung | Ideal für |
|--------|------|-------------|-----------|
| **Fast Bike** | 🚴 | Schnellste Radroute auf Straßen und Wegen | Pendler, E-Bike |
| **Trekking** | 🚵 | Fahrrad-Touren, Routen über Feldwege und Forststraßen | Radtouristen |
| **MTB** | 🏔️ | Mountainbike-Routen über Trails und unbefestigte Wege | Mountainbiker |
| **Safety** | 🛡️ | Sicherste Route, vermeidet große Straßen | Familien, Kinder |
| **Car Fast** | 🚗 | Schnellste Autoroute | Auto-Fahrer |
| **Car Eco** | 🌿 | Energieeffiziente Autoroute | E-Auto |
| **Walk** | 🚶 | Fußgänger-Route | Spaziergänger, Wanderer |

### Alternative Routen

Nach der Routenberechnung werden **bis zu 3 Routenoptionen** angezeigt:

- **Route 1 (Haupt)** — Die kürzeste/schnellste Route
- **Route 2** — Alternative Route (anderes Profil als Fallback)
- **Route 3** — Weitere Alternative

Jede Route zeigt:
- **Entfernung** in km
- **Dauer** in Stunden und Minuten
- **Aufstieg** in Metern
- **Abstieg** in Metern

Klicke auf eine Route um sie auf der Karte anzuzeigen. Die aktive Route wird in Farbe dargestellt, Alternativen in Grau. Wenn du zwischen Alternativrouten hin- und herschaltest, wird die Hauptroute beim Zurück-Klicken auf "Kürzeste" immer zuverlässig wiederhergestellt.

> **Hinweis (v3.1.6+):** Die Erkennung von Alternativrouten basiert nun auf einem **geometriebasierten Algorithmus**. Anstatt nur die Gesamtdistanz zu vergleichen, werden die tatsächlichen Koordinaten-Punkte beider Routen abgeglichen (~40 Sample-Punkte, 50m Toleranz). Nur Routen mit über 85% Geometrie-Overlap werden als "ähnlich" eingestuft und gefiltert. Das bedeutet: Zwei Routen mit ähnlicher Länge aber völlig unterschiedlichem Verlauf werden jetzt korrekt als separate Alternativen angezeigt.

### Via-Stopps

Du kannst **beliebig viele Zwischenstopps** hinzufügen:

1. Klicke auf **"+"** neben "Via"
2. Gib die Adresse ein
3. Die Route wird automatisch über den Zwischenstopp berechnet
4. Via-Stopps können per Drag & Drop umsortiert werden
5. Klicke auf das **×** um einen Via-Stop zu entfernen

### Navigation starten

Sobald eine Route berechnet ist:

1. Klicke auf **"Navigation starten"**
2. Der Nav-Pfeil (grüner Pfeil oben links) zeigt die nächste Abbiegung
3. TTS-Ansagen sagen dir rechtzeitig wo du abbiegen musst
4. Das Drive-Info-Panel zeigt Geschwindigkeit, ETA, Reststrecke — **auch ohne aktive Navigation!** Nach der Routenberechnung werden Distanz, Dauer und Auf-/Abstieg direkt aus dem Route-Objekt angezeigt (v3.1.2+)

### GPS-Tracking

Während der Navigation wird deine GPS-Position in Echtzeit auf der Karte angezeigt:

- **Grüner Punkt mit Puls-Animation** — Deine aktuelle Position
- **Auto-Center** — Die Karte folgt automatisch deiner Position
- **Geschwindigkeitsanzeige** — Aktuelle Geschwindigkeit in km/h

### Demo-Modus

Kein GPS? Kein Problem! Der **Demo-Modus** simuliert eine Fahrt:

1. Berechne eine Route
2. Klicke auf **"Demo-Modus"** (Tastenkürzel: `D`)
3. Die Simulation fährt 120 Sekunden lang die berechnete Route
4. Geschwindigkeit oszilliert zwischen 13-23 km/h
5. Alle Navigations-Features funktionieren (TTS, Nav-Pfeil, ETA)

### Follow-Cam (3D Navigations-Kamera)

Die Follow-Cam ist eine dynamische Verfolger-Kamera, die die Karte in eine professionelle 3D-Navigationsansicht verwandelt — vergleichbar mit Google Maps Navigation oder Apple Maps.

**Aktivierung:** NavigateTab → Follow-Cam (3D) Switch einschalten. Die Follow-Cam wird automatisch aktiv, sobald die Navigation (GPS oder Demo-Modus) läuft.

**Funktionen:**
- **Heading-Up Modus:** Die Karte dreht sich automatisch so, dass die Fahrtrichtung immer nach oben zeigt. Bei Kurvenfahrten rotiert die Kamera flüssig mit.
- **3D Perspektive:** Die Karte wird geneigt (Pitch), um eine Bird's Eye-Ansicht zu erzeugen. Neigungswinkel konfigurierbar (20°-80°, Standard: 50°).
- **Auto-Zoom:** Der Zoom passt sich automatisch an die Geschwindigkeit an — schnell = weiter rauszoomen, langsam = detaillierter reinzoomen.
- **Smooth Rotation:** Die Rotation ist bewusst leicht verzögert (Lerp-Interpolation), um ein professionelles, ruckelfreies Bild ohne Schwindel zu erzeugen.
- **GPS-Fokus:** Bei GPS-Signal wird die aktuelle Position verfolgt. Ohne GPS springt die Kamera zum Routen-Startpunkt.

**Einstellungen:**
- **Pitch (Neigung):** Regelt den 3D-Winkel der Karte. 20° = fast 2D, 80° = steile Vogelperspektive. Standard: 50°.
- **Basis-Zoom:** Der Grund-Zoom-Level für die Navigationsansicht. z14 = Übersicht, z18 = Straßendetail. Standard: z16.

**Tastenkombination:** Der Compass-Button ( oben rechts ) setzt die Follow-Cam zurück und richtet die Karte wieder nach Norden aus.

### Auto-Rerouting

Wenn du von der geplanten Route abkommst:

1. Die App erkennt automatisch, dass du nicht mehr auf der Route bist
2. Nach kurzer Verzögerung wird eine neue Route berechnet — **von deiner aktuellen Position zum Ziel**
3. Die neue Route wird auf der Karte angezeigt
4. TTS sagt "Route wird neu berechnet"

### Kartenstile

Wechsle den Kartenstil in den Einstellungen (Tab ⚙️ → Kartenstil):

| Stil | Beschreibung | Datenquelle |
|------|-------------|-------------|
| **Straße** | Standard-Karte mit Straßen, Gebäuden, Labels | CARTO Positron |
| **Satellit** | Satelliten-/Luftbild mit Straßen-Overlay | ESRI World Imagery |
| **Topo** | Topographische Karte mit Höhenlinien und Wegen | OpenTopoMap |
| **Dunkel** | Dunkles Farbschema für Nachtfahrten | CARTO Dark Matter |
| **✦ Sterne** | Live-Sternkarte mit Sternbildern, Planeten & Mond | Eigener Canvas-Renderer |

### Hillshade (Geländeschattierung)

Aktiviere **Höhenrelief** in den Einstellungen um eine 3D-Geländedarstellung auf jedem Kartenstil zu sehen. Nutzt Stadia Maps Hillshade Tiles.

---

## 5. POI-Suche — Points of Interest finden

POIs (Points of Interest) sind interessante Orte in deiner Nähe — Ladesäulen, Restaurants, Krankenhäuser, Campingplätze und vieles mehr.

### 16 POI-Kategorien

| Kategorie | Chat-Keyword | Beschreibung |
|-----------|-------------|-------------|
| ⚡ **Ladesäulen** | `ladesaeule` | E-Bike / E-Auto Ladestationen mit Anschlusstypen (Typ2, CCS, CHAdeMO, Schuko), Kapazität, Stromstärke |
| 🍕 **Restaurant** | `restaurant` | Restaurants mit Küche, Öffnungszeiten, Telefon, Liefer- und Mitnahmemöglichkeit |
| ☕ **Café** | `cafe` | Cafés mit Außensitzplätzen, Öffnungszeiten |
| 🛒 **Einkaufen** | `shopping` | Supermärkte mit Öffnungszeiten und Marken |
| 🔧 **Baumärkte** | `hardware` | Baumärkte und Baumarkt-Großhändler |
| ⛽ **Tankstellen** | `fuel` | Tankstellen mit Marken und Öffnungszeiten |
| 🚑 **Krankenhaus** | `hospital` | Krankenhäuser mit Notaufnahme-Info und Telefon |
| 💊 **Apotheke** | `pharmacy` | Apotheken mit Öffnungszeiten und Notdienst-Status |
| ⛺ **Camping** | `camping` | Campingplätze mit Zelt/Wohnwagen-Info, Gebühren, Betreiber |
| 🏕️ **Wildcamping** | `wildcamping` | Offizielle Wildcamping-Standorte |
| 🏛️ **Sehenswürdigkeit** | `sightseeing` | Touristische Sehenswürdigkeiten |
| 🚰 **Trinkwasser** | `water` | Öffentliche Trinkwasser-Stellen |
| 🔧 **Fahrradwerkstatt** | `bicycle_repair` | Fahrradwerkstätten mit Reparatur-Service (Farbe: Orange #FF7043, gut sichtbar in Dark & Light Mode) |
| 🏠 **Unterkunft** | `hostel` | Hostels, Herbergen, Unterkünfte |
| 🏔️ **Schutzhütte** | `shelter` | Notunterkünfte und Schutzhütten |
| 🚻 **Toiletten** | `toilets` | Öffentliche Toiletten |

### POIs suchen

**Über die Karte:**
1. Öffne den Tab **"POI"** in der Seitenleiste
2. Wähle eine Kategorie aus den Filtern (oder lass alle aktiv)
3. POIs in deiner Nähe werden automatisch auf der Karte angezeigt als farbige Markierungen
4. Klicke auf einen Marker um die Details zu sehen (Name, Adresse, Telefon, Öffnungszeiten)
5. Nutze die Buttons im Popup: **"Zur Route hinzufügen"** oder **"Als Ziel setzen"**

**Über den Chat:**
```
!poi ladesaeule      → Zeigt alle Ladesäulen in der Nähe
!poi camping         → Zeigt Campingplätze in der Nähe
!poi restaurant      → Zeigt Restaurants in der Nähe
```

**Notfall-Suche:**
```
!notfall             → Zeigt Krankenhäuser UND Polizei in der Nähe
```

### POI-Shortcuts

Aktiviere **"POI-Shortcuts"** in den Einstellungen (Karten-Overlays). Dann erscheinen kleine farbige Buttons auf der Karte als Schnellfilter:

- Klicke auf einen Button um sofort alle POIs dieser Kategorie anzuzeigen
- Klicke erneut um die Filter zu entfernen

### POI-Popups

Jeder POI-Marker hat ein **Detail-Popup** beim Anklicken mit folgenden Informationen (abhängig von der Kategorie):

- **Name** und **Kategorie** mit farbigem Icon
- **Entfernung** von deiner aktuellen Position
- **Adresse** (Straße, Hausnummer, PLZ, Stadt)
- **Telefon**
- **Öffnungszeiten**
- **Website**
- **Betreiber**
- **Spezifische Details:**
  - Ladesäulen: Typ (Typ2/CCS/CHAdeMO/Schuko), Kapazität, Spannung, Stromstärke, Gebühr
  - Restaurants: Küche, Mitnahme, Lieferung, Außensitzplätze
  - Camping: Zelte erlaubt, Wohnwagen, Gebühr, Betreiber, Website
  - Krankenhaus: Notaufnahme, Telefon
  - Apotheke: Notdienst, Öffnungszeiten

---

## 6. Twitch-Chat-Integration — Der Bot

TwitchCoPilot hat einen **vollständigen Twitch IRC-Bot** eingebaut, der sich direkt mit deinem Twitch-Kanal verbindet. Deine Zuschauer können dann Befehle im Chat eingeben und die App reagiert darauf.

### Verbindung einrichten

1. Öffne den Tab **"Streamer Bot"** in der Seitenleiste
2. Fülle die Felder aus:
   - **Kanal:** Dein Twitch-Kanalname (ohne das #, z.B. `deinkanal`)
   - **Bot-Name:** Der Username deines Bots (muss ein registrierter Twitch-Account sein)
   - **OAuth Token:** Ein Twitch OAuth Token für den Bot (siehe unten)
3. Aktiviere **"Auto-Verbinden"** damit der Bot sich beim nächsten Seitenladen automatisch verbindet
4. Klicke auf **"Verbinden"**

### OAuth Token erstellen

Du brauchst einen OAuth Token für deinen Bot. Verwende dafür den **Twitch Token Generator**:

1. Gehe auf [twitchtokengenerator.com](https://twitchtokengenerator.com/)
2. Klicke auf **"Bot Chat Token"** (oder den entsprechenden Button für Bot-Token)
3. Logge dich mit dem **Bot-Account** ein (NICHT deinem Haupt-Account)
4. Wähle bei **Scopes** die folgenden Berechtigungen aus:
   - ✅ `chat:read` — Den Chat lesen können
   - ✅ `chat:edit` — Nachrichten im Chat senden können (Befehle, Antworten, Voting)
   - ✅ `channel:moderate` — Moderator-Fähigkeiten nutzen können (Timeout, Ban, etc.)
5. Klicke auf **"Generate Token"** oder **"Authorize"**
6. Kopiere den generierten Token
7. Füge ihn in das Feld "OAuth Token" ein

> **Wichtig:** Der Bot-Account muss ein **separater Twitch-Account** sein. Teile deinen OAuth Token mit niemandem — er gibt Zugriff auf den Account.
>
> **Hinweis — Moderation:** Damit der Bot Moderations-Befehle (Timeout, Ban, Löschen von Nachrichten) ausführen kann, **müssen alle drei Scopes (`chat:read`, `chat:edit`, `channel:moderate`)** ausgewählt sein. Ohne `channel:moderate` funktionieren nur Lese- und Schreibzugriff auf den Chat, aber keine Moderations-Aktionen.
>
> **Hinweis — twitchapps.com:** Die alte Seite twitchapps.com/tmi existiert zwar noch, der Service wurde jedoch eingestellt. Nutze stattdessen twitchtokengenerator.com.

### Chat-Overlay

Wenn du verbunden bist, wird ein **Chat-Overlay** auf der Karte angezeigt:

- Zeigt die letzten Chat-Nachrichten
- Echtzeit-Updates ohne Seiten Reload
- Klick auf den Chat um ihn aufzuklappen/zuzuklappen
- Nachrichten-Feld um selbst in den Chat zu schreiben
- Aktivierbar/Deaktivierbar in den Einstellungen

### Community-Wegpunkte

Wenn ein Zuschauer den Befehl `!navi` verwendet (z.B. `!navi Brandenburger Tor`):

1. Die Adresse wird über Nominatim gesucht
2. Der Wegpunkt erscheint unter **"Ausstehende Wegpunkte"** im Navigation-Tab
3. Du (der Streamer) kannst jeden Wegpunkt **bestätigen** oder **ablehnen**
4. Bestätigte Wegpunkte werden zur Route hinzugefügt
5. Im Chat erscheint eine Bestätigungsmeldung

### Auto-Approve (v3.1.5+)

Wenn der Streamer **"Wegpunkte auto-akzeptieren"** in den Optionen aktiviert hat (Streamer Bot → Toggle), werden Wegpunkte unter bestimmten Bedingungen automatisch akzeptiert:

- **Moderatoren und der Broadcaster** werden IMMER automatisch akzeptiert — unabhängig von der Einstellung
- **Normale Viewer** mit aktiviertem Auto-Approve werden ebenfalls direkt akzeptiert
- Der Wegpunkt wird per Smart-Routing-Logik einsortiert: Ist er näher am aktuellen Standort als das Ziel, wird er als Zwischenstopp (Via) eingefügt; sonst als neues Ziel
- Im Chat erscheint dann: `✅ @user Wegpunkt hinzugefügt: "Adresse"` statt der Wartend-Meldung

So können deine Zuschauer aktiv an der Routenplanung teilnehmen — mit oder ohne manuelle Bestätigung!

---

## 7. Alle Chat-Befehle im Detail

Hier ist die **komplette Liste aller Befehle** mit detaillierter Erklärung, Beispielen, und Berechtigungen. Neben den 16 integrierten Befehlen können im Streamer Bot Tab beliebig viele **Custom Commands** erstellt werden.

### Info-Befehle

| Befehl | Beschreibung | Beispiel | Zugriff |
|--------|-------------|----------|---------|
| `!help` | Zeigt alle verfügbaren Befehle an | `!help` | Alle |
| `!commands` | Alias für !help | `!commands` | Alle |
| `!version` | Zeigt die aktuelle Build-Version | `!version` | Alle |
| `!rank` | Zeigt dein persönliches Command-Ranking (Platz, Anzahl deiner Befehle, Top 3) | `!rank` | Alle |

### Navigations-Befehle

| Befehl | Beschreibung | Beispiel | Zugriff |
|--------|-------------|----------|---------|
| `!position` | Zeigt deine aktuelle GPS-Position (Koordinaten + Geschwindigkeit) | `!position` | Alle |
| `!stats` | Zeigt Fahrstatistiken: Geschwindigkeit, Strecke, Auf-/Abstieg | `!stats` | Alle |
| `!route` | Zeigt die aktuelle Route mit allen **Wegpunkt-Namen** als Kette, Distanz, **ETE** (Restfahrzeit statt ETA), und bei aktiver Navigation einen **Fortschritts-Prozentwert** `[XX%]`. Bereits abgefahrene Wegpunkte werden automatisch ausgeblendet. Wenn alle Wegpunkte erreicht wurden: `🏁 Route abgeschlossen` | `!route` | Alle |
| `!navi [Adresse]` | Schlägt eine Adresse als Navigations-Wegpunkt vor (muss vom Streamer bestätigt werden) | `!navi Brandenburger Tor Berlin` | Follower |

### Wetter & POI

| Befehl | Beschreibung | Beispiel | Zugriff |
|--------|-------------|----------|---------|
| `!wetter` | Zeigt das aktuelle Wetter an deiner GPS-Position (Temperatur, Beschreibung, Wind) | `!wetter` | Alle |
| `!poi [Kategorie]` | Sucht POIs in der Nähe. Kategorien: ladesaeule, camping, restaurant, cafe, supermarket, fuel, water, hospital, pharmacy, sightseeing, bicycle_repair | `!poi ladesaeule` | Alle |
| `!sightseeing` | Sucht Sehenswürdigkeiten in der Nähe (Shortcut für `!poi sightseeing`) | `!sightseeing` | Alle |
| `!camping` | Sucht Campingplätze in der Nähe | `!camping` | Alle |
| `!ladesaeule` | Sucht Ladesäulen in der Nähe | `!ladesaeule` | Alle |
| `!notfall` | Zeigt Krankenhäuser und Polizei in der Nähe — Notfall-Suche | `!notfall` | Alle |

### Voting

| Befehl | Beschreibung | Beispiel | Zugriff |
|--------|-------------|----------|---------|
| `!vote [Frage]` | Startet eine einfache Ja/Nein-Abstimmung | `!vote Pause machen?` | Alle |
| `!vote start [F] \| [O1] \| [O2]` | Startet eine Multi-Option-Abstimmung (bis zu 6 Optionen, getrennt mit `\|`) | `!vote start Essen? \| Döner \| Pizza \| Sushi` | Alle |
| `!vote [Nummer]` | Stimmt bei einer aktiven Abstimmung ab (Nummer der Option, beginnend bei 1) | `!vote 2` | Alle |

### TTS & Übersetzung

| Befehl | Beschreibung | Beispiel | Zugriff |
|--------|-------------|----------|---------|
| `!tts <Text>` | Spricht den Text per Text-to-Speech in der eingestellten UI-Sprache (Deutsch oder Englisch). Maximale 200 Zeichen. | `!tts Hallo Chat, wie geht es euch?` | Subscriber |
| `!tts-t <Text>` | Übersetzt den Text in die Sprache der eingestellten Stimme, spricht ihn per TTS UND zeigt die Übersetzung im Chat. Maximale 200 Zeichen. | `!tts-t Hello everyone!` | Subscriber |
| `!translate <Sprache> <Text>` | Übersetzt den Text in die angegebene Sprache und zeigt das Ergebnis im Chat. Keine Zeichen-Begrenzung. | `!translate ja Hallo, wie geht es dir?` | Alle |
| `!translator` | Alias für !translate | `!translator en Guten Morgen` | Alle |
| `!übersetzer` | Alias für !translate | `!übersetzer fr Bonjour` | Alle |

### Custom Commands (eigene Befehle erstellen)

Du kannst im **Streamer Bot → Commands** Tab eigene Befehle erstellen, die von deinen Zuschauern im Chat genutzt werden können.

**So funktioniert es:**

1. Öffne den **Streamer Bot** Tab in der Sidebar
2. Klicke auf **"Neuen Command erstellen"**
3. Trage einen **Trigger** ein — das ist das Wort nach dem `!` (z.B. `!pizza`)
4. Gib **Antworten** ein — eine pro Zeile. Bei jeder Nutzung wird zufällig eine der Antworten ausgewählt
5. Setze eine **Zugriffsebene** (everyone, follower, vip, subscriber, mod, broadcaster)
6. Optional: Trage **Aliases** ein (alternative Trigger-Namen, z.B. `!pizz` für `!pizza`)
7. Optional: Setze einen individuellen **Cooldown** in Sekunden
8. Klicke auf **Speichern**

**Platzhalter in Antworten:**

- `{user}` — Wird durch den Nutzernamen ersetzt

**Beispiel:** Trigger: `!pizza`, Antworten:
```
Hey {user}, heute gibt es Salami! 🍕
{user} will Pizza? Nur wenn du beim Stream bleiben willst! 😄
Mamma Mia, {user}! Die beste Pizza gibt's hier! 🇮🇹
```

Jedes Mal wenn jemand `!pizza` schreibt, wird eine der drei Antworten zufällig ausgewählt und `{user}` durch den Nutzernamen ersetzt. Custom Commands überschreiben niemals integrierte Befehle — sie funktionieren nur mit eigenen Triggern.

### Berechtigungs-System

Jeder Befehl hat eine **Zugriffsebene** (Access Level). Das System liest die Twitch IRC Tags um die Rolle des Users zu erkennen:

| Zugriffsebene | Wer hat Zugriff? |
|---|---|
| **Alle** | Jeder Zuschauer, auch nicht-eingeloggte |
| **Follower** | Follower des Kanals |
| **Subscriber** | Subscriber (Paid/Prime) |
| **VIP** | VIPs des Kanals (eigener Rang seit v3.0.9, zwischen Follower und Subscriber) |
| **Moderator** | Mods des Kanals |
| **Broadcaster** | Nur der Streamer |

Die Hierarchie der Zugriffsebenen lautet: `everyone → follower → vip → subscriber → mod → broadcaster`. Ein Moderator hat also automatisch Zugriff auf alle Befehle der darunterliegenden Ebenen. VIPs wurden in v3.0.9 als eigenständiger Rang eingeführt — zuvor wurden sie fälschlicherweise als "Subscriber" eingestuft.

Der Streamer kann die Zugriffsebene für jeden Befehl **einzeln anpassen** im "Streamer Bot" → "Commands" Tab.

### Cooldown und Rate-Limit

- **Cooldown:** Jeder Befehl hat eine einstellbare Cooldown-Zeit in Sekunden (Standard: meist 5-30s)
- **Rate-Limit:** Maximal 10 Befehle pro 30 Sekunden pro User
- Wenn ein User gegen das Limit verstößt, wird er im Chat darauf hingewiesen

> **Wichtig:** **Broadcaster und Moderatoren sind komplett von Cooldown und Rate-Limit befreit.** Sie können Befehle ohne Verzögerung ausführen. VIPs haben ebenfalls eingeschränkten oder keinen Cooldown (konfigurierbar).

---

## 8. Voting-System — Live-Abstimmungen

Das Voting-System erlaubt es deinen Zuschauern, über Entscheidungen abzustimmen — ganz einfach über den Chat.

### Einfache Ja/Nein-Abstimmung

Jeder Viewer kann eine Abstimmung starten:
```
!vote Sollten wir eine Pause machen?
```

Daraufhin erscheint im Chat:
```
🗳️ Abstimmung: Sollten wir eine Pause machen? - Bitte mit !vote [Nummer] abstimmen!
   Option 1: Ja
   Option 2: Nein
```

Zuschauer stimmen ab mit:
```
!vote 1     → Stimmt für "Ja"
!vote 2     → Stimmt für "Nein"
```

### Multi-Option-Abstimmung

Bis zu **6 Optionen** sind möglich. Trenne die Optionen mit `|`:
```
!vote start Was essen wir? | Döner | Pizza | Sushi | Nudeln
```

Das Voting-Panel auf der Karte zeigt alle Optionen mit Echtzeit-Stimmen und Fortschrittsbalken.

### Voting-Panel

Wenn eine Abstimmung aktiv ist, erscheint das **Voting-Panel** auf der Karte:

- Zeigt Frage und alle Optionen
- Echtzeit-Fortschrittsbalken für jede Option
- Gesamtanzahl der Stimmen
- Aktiver Timer mit verbleibender Zeit
- Gewinner-Anzeige am Ende

### Voting erstellen (im UI)

Alternativ zum Chat-Befehl kannst du auch im UI eine Abstimmung erstellen:

1. Öffne den Tab **"Streamer Bot"** oder das Voting-Panel auf der Karte
2. Klicke auf **"Abstimmung starten"**
3. Gib die Frage ein
4. Füge 2-6 Optionen hinzu (+/- Buttons)
5. Setze die Dauer (10-300 Sekunden)
6. Klicke auf **"Abstimmung starten"**

### Ergebnis

Am Ende der Abstimmung:
- Gewinner wird im Chat und per TTS angesagt
- Ergebnis wird im Voting-Panel angezeigt
- **Jeder Zuschauer kann nur einmal abstimmen** (Doppelt-Stimmen werden blockiert)
- Das Ergebnis-Kart verschwindet automatisch nach 10 Sekunden (v3.1.1+)
- Ein ✕ Schließen-Button erlaubt das manuelle Schließen des Ergebnisses

---

## 9. TTS Sprachausgabe

TwitchCoPilot hat eine vollständige **Text-to-Speech** Engine mit Warteschlange.

### Navigations-TTS

Während der aktiven Navigation werden Abbiegeansagen gesprochen:

| Distanz | Ansage |
|---------|--------|
| 500m vorher | "In 500 Metern, bitte rechts abbiegen" |
| 200m vorher | "In 200 Metern, jetzt rechts abbiegen" |
| 50m vorher | "Jetzt bitte rechts abbiegen" |
| Am Ziel | "Sie haben Ihr Ziel erreicht" |
| Geradeaus | "Bitte weiter geradeaus" |

### TTS-Ansagen-Art (Verbosity)

In den Einstellungen → "Ansagen-Art" wählst du:

| Stufe | Beschreibung |
|-------|-------------|
| **Aus** | Keine Ansagen |
| **Nur Piepton** | Nur ein akustisches Signal bei Abbiegungen |
| **Kompakt** | Ansagen bei 200m und beim Abbiegen |
| **Voll** | Ansagen bei 500m, 200m, beim Abbiegen + Streckeninfo |

### TTS für Chat-Befehle

- **`!tts`** — Spricht Text in der UI-Sprache (DE/EN)
- **`!tts-t`** — Übersetzt UND spricht Text (跨境-Chat)

### TTS-Stummschaltung

Auf der Karte gibt es einen **Mute-Button** (🎯 Icon) um TTS schnell ein-/auszuschalten.

### Stimme einstellen

1. Gehe zu **Einstellungen** → **Sprachausgabe**
2. Wähle eine Stimme aus dem Dropdown (abhängig von deinem Browser/OS)
3. Passe **Lautstärke** und **Sprechgeschwindigkeit** an
4. Klicke auf **"Stimme testen"** um sie anzuhören

---

### !translate — Drei Modi (v3.0.8+)

Der `!translate` Befehl unterstützt **drei Modi**:

**1. Einmalige Übersetzung:**
```
!translate en Hallo, wie geht es dir?
```
Übersetzt den Text und zeigt das Ergebnis im Chat.

**2. Auto-Übersetzungs-Modus aktivieren:**
```
!translate english
```
Aktiviert die automatische Übersetzung — ALLE Chat-Nachrichten in dieser Sprache werden automatisch übersetzt und im Chat-Overlay angezeigt.

**3. Auto-Übersetzungs-Modus deaktivieren:**
```
!translate off
```

Die Aliase `!translator` und `!übersetzer` funktionieren exakt gleich.

## 10. Übersetzungssystem — 30+ Sprachen

TwitchCoPilot hat einen **integrierten Universal-Übersetzer** powered by MyMemory API — kostenlos, kein API-Key nötig.

### Unterstützte Sprachen

Deutsch, Englisch, Französisch, Spanisch, Italienisch, Portugiesisch, Niederländisch, Polnisch, Russisch, Japanisch, Chinesisch (Vereinfacht), Koreanisch, Arabisch, Türkisch, Schwedisch, Tschechisch, Dänisch, Finnisch, Griechisch, Hebräisch, Hindi, Thai, Vietnamesisch, Indonesisch, Ukrainisch, Rumänisch, Ungarisch, Norwegisch und mehr.

### Sprach-Aliase

Du kannst Sprachen auf verschiedene Arten angeben:

| Sprache | Codes | Namen |
|---------|-------|-------|
| Deutsch | `de`, `deu` | `deutsch`, `german` |
| Englisch | `en`, `eng` | `englisch`, `english` |
| Japanisch | `ja`, `jpn` | `japanisch`, `japanese`, `日本語` |
| Chinesisch | `zh`, `chi` | `chinesisch`, `chinese`, `中文` |
| Französisch | `fr`, `fra` | `französisch`, `french`, `français` |
| Spanisch | `es`, `esp` | `spanisch`, `spanish`, `español` |

### !translate — Der Universal-Übersetzer

```
!translate en Hallo zusammen, wie geht es euch?
```

Ergebnis im Chat:
```
🌍 [en] Hello everyone, how are you?
```

### !tts-t — Übersetzen UND Sprechen

```
!tts-t Hello Chat, this is a test!
```

Dieses Kommando macht drei Dinge gleichzeitig:
1. Übersetzt den Text in die Sprache der eingestellten Stimme (z.B. Deutsch)
2. Spricht den übersetzten Text per TTS
3. Zeigt die Übersetzung im Chat:
```
🌍 [de] Hallo Chat, das ist ein Test!
```

---

## 11. Browser-Source Overlay — Navi im Stream anzeigen

Das **Browser-Source Overlay** ist eine spezielle Ansicht von TwitchCoPilot, die du als **Browser-Source** in jeder Streaming-Software einfügst. Sie zeigt Navi-Daten, Chat, Voting und mehr direkt in deinem Stream — transparent, ohne Hintergrund. Das Overlay funktioniert mit **jeder App, die Browser-Sources unterstützt**, nicht nur mit OBS.

### Kompatible Apps

| App | Plattform | Browser-Source Name | Hinweis |
|-----|-----------|---------------------|--------|
| **OBS Studio** | Windows, macOS, Linux | Browser | Der Klassiker — voller Funktionsumfang |
| **Moblin** | iOS, Android | Web-Widget / Browser Source | Perfekt zum Streamen vom Handy! |
| **Streamlabs Desktop** | Windows, macOS | Browser Source | Basiert auf OBS, gleiche Bedienung |
| **TikTok Live Studio** | Windows, macOS | Browser | Für TikTok-Streamer |
| **Aragon Live** | Windows | Browser | Leichtgewichtige Alternative |
| **Prism Live Studio** | Windows, macOS, iOS, Android | Browser | Auch auf Mobilgeräten |
| **Andere Apps** | — | Browser / Web / Widget | Jede App mit Webview/Browser-Source funktioniert |

> **Tipp:** Grundsätzlich gilt: Wenn deine Streaming-App eine Funktion namens "Browser", "Browser Source", "Web-Widget" oder "Webview" hat, kannst du das TwitchCoPilot Overlay dort einfügen!

### Einrichten (allgemein)

1. Öffne die TwitchCoPilot-URL mit dem Parameter `?overlay=true`:
   ```
   https://nicetotechyou.github.io/TwitchCoPilot/?overlay=true
   ```
2. In deiner Streaming-App: Füge eine **Browser-Source** hinzu (der Name variiert je nach App — siehe Tabelle oben)
3. URL: Die Overlay-URL von oben
4. Breite: `1920`, Höhe: `1080` (oder deine Stream-Auflösung)
5. Falls vorhanden: Option "Lokale Datei" deaktivieren
6. Bestätigen / OK klicken

### Einrichten in OBS Studio

1. Rechtsklick auf eine Quelle → **Hinzufügen** → **Browser**
2. URL: `https://nicetotechyou.github.io/TwitchCoPilot/?overlay=true`
3. Breite: `1920`, Höhe: `1080`
4. "Lokale Datei" deaktivieren
5. Klicke auf **OK**

### Einrichten in Moblin (Handy)

1. Öffne die Moblin-App auf deinem iPhone oder Android-Gerät
2. Tippe auf **Widgets** oder **Web-Widget** hinzufügen
3. Wähle **Browser Source** oder **Webview**
4. URL: `https://nicetotechyou.github.io/TwitchCoPilot/?overlay=true`
5. Passe die Größe an (ziehe die Ecken des Widgets)
6. Das Overlay erscheint live in deinem Moblin-Stream!

> **Moblin-Vorteil:** Da Moblin direkt auf dem Handy läuft, kannst du die Navi-App und den Stream auf demselben Gerät nutzen — kein zweites Gerät nötig!

### Overlay-Elemente

Das Overlay zeigt folgende Elemente (alle einzeln ein-/ausschaltbar):

| Element | Beschreibung | Toggle |
|---------|-------------|--------|
| **Fortschrittsbalken** | Horizontaler Fortschritt der Route (oben) | Einstellungen → Route anzeigen |
| **Geschwindigkeits-Panel** | Aktuelle Geschwindigkeit mit farblicher Anzeige (grün/gelb/rot) | Einstellungen → Geschwindigkeit |
| **Routen-Info-Panel** | Reststrecke, ETA, Auf-/Abstieg | Einstellungen → Routen-Info |
| **Wetter-Panel** | Temperatur und Wetter-Beschreibung | Einstellungen → Wetter |
| **Kanal-Info-Badge** | Aktueller Kanalname | Immer sichtbar |
| **Chat-Feed** | Letzte Chat-Nachrichten scrollen von rechts | Einstellungen → Chat |
| **Voting-Panel** | Aktive Abstimmung mit Fortschrittsbalken | Einstellungen → Abstimmung |
| **Minimap** | Kleine Karte mit Route und GPS-Position | Einstellungen → Minimap |
| **Navigations-Pfeil** | Zeigt die nächste Abbiegung | Einstellungen → Nav-Pfeil |

### Overlay-Größen

In den Einstellungen kannst du die **Größe jedes Elements** einzeln anpassen (50%–200%):

- Geschwindigkeits-Größe
- Routen-Info-Größe
- Wetter-Größe
- Chat-Größe
- Abstimmungs-Größe
- Fortschritts-Größe
- Minimap-Größe

### Edit-Modus

Klicke auf das **Stift-Icon** (✏️) oben links um den Edit-Modus zu aktivieren. In diesem Modus kannst du:

- Overlay-Elemente per **Drag & Drop** verschieben
- Größe mit dem Schieberegler anpassen
- Klicke auf das **Häkchen** (✓) um die Positionen zu speichern

### Design

Das Overlay ist **intentional dunkel** gestaltet — es ist für die Verwendung auf dem Stream optimiert:
- Halbtransparente schwarze Panels (`bg-black/70`) mit Blur-Effekt
- Weiße/graue Textfarben für optimalen Kontrast auf dem Stream
- Farbcodierte Elemente (grün für Speed, gelb für Warnung, rot für Gefahr, lila für Akzente)
- Alle Elemente frei positionierbar

---

## 12. Multi-Device-Sync — Handy + PC verbinden

Das **Multi-Device-Sync** ermöglicht es dir, die Navi auf dem Handy zu nutzen und die Daten gleichzeitig an den PC zu senden — ideal für das Browser-Source Overlay in OBS, Moblin oder jeder anderen Streaming-App.

### Wie es funktioniert

```
┌──────────────┐         MQTT         ┌──────────────────┐
│   HANDY      │ ──────────────────→  │    PC / STREAM    │
│  (Navi-App)  │  GPS, Speed, Route  │  (Overlay-Ansicht)│
│              │  Wetter, Chat, Vote │                    │
└──────────────┘                      └──────────────────┘
```

1. Öffne das Overlay auf dem PC (oder dem Streaming-Gerät): `?overlay=true`
2. Ein **6-stelliger Raum-Code** erscheint auf dem Overlay
3. Auf dem Handy: **Einstellungen** → **OBS Sync** → Code eingeben → **Verbinden**
4. Alle Navi-Daten strömen live vom Handy zum Overlay-Gerät

> **Hinweis:** Der Menüpunkt heißt in der App "OBS Sync", funktioniert aber mit **jeder** Streaming-App die eine Browser-Source unterstützt — OBS, Moblin, Streamlabs und alle anderen.

### Was wird synchronisiert?

| Daten | Beschreibung |
|-------|-------------|
| **GPS-Position** | Aktuelle Koordinaten und Geschwindigkeit |
| **Routenfortschritt** | Verbleibende Distanz, ETA |
| **Fahrdaten** | Geschwindigkeit, Distanz heute, Auf-/Abstieg |
| **Wetter** | Temperatur, Wetter-Beschreibung, Windgeschwindigkeit |
| **Chat-Nachrichten** | Alle Twitch-Chat-Nachrichten |
| **Voting** | Aktive Abstimmungen und Ergebnisse |

### Technologie

- **MQTT** über den öffentlichen EMQX Broker
- Publish/Subscribe-Modell — geringe Latenz (unter 1 Sekunde)
- Raum-Code als Topic: `twitch-copilot/sync/{code}`
- Self-Receive-Schutz: Der Sender bekommt seine eigenen Nachrichten nicht zurück

---

## 13. Einstellungen — Alles anpassen

### Sprachen

| Option | Beschreibung |
|--------|-------------|
| **Deutsch** | Komplette Oberfläche auf Deutsch (~500 i18n Keys) |
| **English** | Komplette Oberfläche auf Englisch |

Ändert alle Labels, Buttons, Navigationsansagen, Bot-Antworten und Wetter-Beschreibungen.

### Farbschema / Theme

5 Farbthemen, jeweils mit Dark und Light Mode:

| Theme | Primärfarbe | Stil |
|-------|-------------|------|
| **Twitch** | #9146FF (Lila) | Standard, Twitch-inspiriert |
| **Fahrrad** | #00FF00 (Grün) | Natur, Frisch, Grün |
| **Electric** | #00BFFF (Blau) | Technisch, Modern, E-Mobility |
| **Sunset** | #FF6B35 (Orange) | Warm, Wanderlust |
| **Pink** | #FF00FF (Pink) | Fun, Bunt, Einzigartig |

### Dark / Light Mode

Jedes Theme hat einen **Dark** und einen **Light** Modus. Umschalten in den Einstellungen oder per Toggle-Button.

### Karten-Overlays

| Toggle | Beschreibung |
|--------|-------------|
| **Geschwindigkeitsanzeige** | Speed-Panel auf der Karte |
| **Wetter-Widget** | Temperatur und Wetter-Icon |
| **POI-Shortcuts** | Schnellfilter-Buttons auf der Karte |
| **Navigations-Pfeil** | Grüner Pfeil mit Abbiegehinweis |
| **Chat-Overlay** | Chat-Nachrichten auf der Karte |
| **Abstimmungs-Panel** | Voting-Ergebnisse auf der Karte |
| **Routenlinie** | Die geplante Route auf der Karte |
| **Alternativrouten** | Alternative Routenoptionen |
| **POI-Marker** | Gefundene POIs auf der Karte |
| **Wegpunkte** | Start/Ziel/Via-Marker |
| **Fahrspur** | Die bereits gefahrene Strecke |
| **Höhenrelief** | Hillshade/Geländeschattierung |

### Sprachausgabe

| Einstellung | Beschreibung |
|-------------|-------------|
| **Stimme** | Browser-Sprachsynthese Stimme wählen |
| **Lautstärke** | 0-100% |
| **Sprechgeschwindigkeit** | 0.5x – 2.0x |
| **Ansagen-Art** | Aus / Nur Piepton / Kompakt / Voll |
| **TTS-Limit** | Maximale Zeichen pro !tts/!tts-t (Standard: 200) |

### Einstellungen Export/Import

- **Exportieren:** Sichert alle Einstellungen als JSON-String
- **Importieren:** Stellt Einstellungen aus einem JSON-String wieder her
- **Zurücksetzen:** Setzt alle Einstellungen auf Standardwerte

### Wegpunkte auto-akzeptieren

- **Toggle:** Schalter unter den Connection-Buttons im Streamer Bot Tab
- **Standard:** AN (aktiviert)
- **Funktion:** Wenn aktiv, werden !navi Wegpunkte von Mods/Broadcastern automatisch akzeptiert
- **Hinweis:** Normale Viewer werden ebenfalls auto-akzeptiert wenn aktiv — deaktivieren um manuelle Bestätigung zu erzwingen

### OBS-Sync
- **Raum-Code eingeben** um mit dem Overlay zu verbinden (funktioniert mit OBS, Moblin und allen Browser-Source kompatiblen Apps)
- **Verbinden/Trennen** Button
- Verbindungsstatus-Anzeige

---

## 14. Themen und Farbschemata

Die Farbthemen sind nicht nur "Hintergrundfarben" — sie beeinflussen das **gesamte Farbsystem** der App. Jedes Theme definiert **22 CSS-Variablen** die alle Komponenten steuern:

- `--background` / `--foreground` — Haupt-Hintergrund und Textfarbe
- `--sidebar` / `--sidebar-foreground` / `--sidebar-border` — Sidebar-Farben
- `--surface` / `--surface-foreground` — Popup- und Kartenfarben
- `--popover` / `--popover-foreground` — Dropdown, Tooltip, Dialog-Farben
- `--card` / `--card-foreground` — Karten-Farben
- `--muted` / `--muted-foreground` — Inaktive Elemente
- `--input` / `--ring` — Formular-Inputs und Focus-Rings
- `--primary` / `--primary-foreground` — Buttons und Akzente
- `--accent` / `--accent-foreground` — Sekundäre Akzente
- `--destructive` / `--destructive-foreground` — Fehler und Warnungen
- `--border` — Rahmenfarben

Jedes Theme hat einen **eigenen Hue-Wert** im OKLCH-Farbraum, der alle 22 Variablen bestimmt. So sieht die App in jedem Theme konsistent aus — in Dark UND Light.

---

## 15. PWA — Als App installieren

TwitchCoPilot ist eine **Progressive Web App** (PWA). Das bedeutet:

### Features

- **Installierbar** auf Android, iOS und Desktop (Chrome, Edge, Safari, Firefox)
- **Service Worker** cached alle wichtigen Dateien für schnelles Laden
- **Offline-Fähigkeit** — Kartentiles werden für 30 Tage gecacht
- **Responsive** — Funktioniert auf jedem Bildschirm (Handy, Tablet, Desktop)
- **Touch-optimiert** — Kein unerwünschtes Zoomen, Pinch-to-Zoom nur auf der Karte

### Installieren

| Plattform | Methode |
|-----------|---------|
| **Android (Chrome)** | Menü (⋮) → "Zum Startbildschirm hinzufügen" |
| **iOS (Safari)** | Teilen (↑) → "Zum Startbildschirm" |
| **Desktop (Chrome)** | Install-Icon in der Adressleiste |
| **Desktop (Edge)** | Menü (⋯) → "Apps" → "Diese Website als App installieren" |

### Cache-Strategie

| Ressource | Strategie | Dauer |
|-----------|-----------|-------|
| Karten-Tiles | CacheFirst | 30 Tage |
| BRouter Routing | NetworkFirst | 1 Stunde |
| Nominatim Geocoding | NetworkFirst | 7 Tage |
| Overpass POI-Suche | NetworkFirst | 1 Tag |
| Open-Meteo Wetter | NetworkFirst | 15 Minuten |
| MyMemory Übersetzung | NetworkOnly | Kein Cache |
| App-Dateien (JS/CSS) | Precache | Bei Build |

---

## 16. Route JSON Import/Export (v3.0.6+)

Du kannst eine **komplette berechnete Route als JSON** exportieren und auf einem anderen Gerät importieren — ohne Neuberechnung!

### Was enthält die JSON-Datei?

- App-Name und Version
- Zeitstempel
- Alle Wegpunkte (Namen, Koordinaten)
- Die **komplette Routengeometrie** (jeder Koordinatenpunkt)
- Distanz, Dauer, Auf-/Abstieg
- Gewähltes Routing-Profil
- Bis zu 2 Alternativrouten

### Exportieren

1. Berechne eine Route (oder habe bereits eine)
2. Klicke auf **"Exportieren"** im Route-Tab
3. Wähle **"JSON"** aus dem Dropdown (oberster Eintrag mit `{ }` Icon)
4. Die `.json`-Datei wird heruntergeladen


### Importieren

1. Klicke auf den **Import-Button** (Icon mit aufwärts-Pfeil, neben dem Export-Button)
2. Wähle die `.json`-Datei auf deinem Gerät aus
3. Die Route wird automatisch auf der Karte angezeigt und im Store wiederhergestellt
4. Das Routing-Profil wird wiederhergestellt falls im JSON enthalten

Die Route muss **nicht neu berechnet werden** — sie ist ein 1:1-Klon der ursprünglichen Berechnung!

> **Tipp:** Perfekt für Route-Sharing per WhatsApp, zwischen Handy und PC, oder als Backup.

### Routen-Export — GPX, KML, TCX

Du kannst deine berechneten Routen auch in Standardformaten exportieren, um sie in anderen Navigations-Apps oder Geräten zu verwenden.

### Formate

| Format | Dateiendung | Beschreibung | Kompatibel mit |
|--------|-------------|-------------|----------------|
| **GPX** | `.gpx` | GPS Exchange Format — Standard für GPS-Geräte | Garmin, Wahoo, Komoot, OsmAnd |
| **KML** | `.kml` | Keyhole Markup Language — Google Earth Format | Google Earth, Google Maps |
| **TCX** | `.tcx` | Training Center XML — Fitness-Format | Garmin Edge, Forerunner, Strava |

### Exportieren

1. Berechne eine Route
2. Klicke auf **"Exportieren"** im Route-Tab
3. Wähle das gewünschte Format
4. Die Datei wird automatisch heruntergeladen

### GPX-Details

Die GPX-Datei enthält:
- Routenname (Start → Ziel)
- Alle Wegpunkte (Start, Via, Ziel) mit Koordinaten
- Kompletter Routenverlauf mit Höhendaten (sofern vom Router bereitgestellt)
- Waypoint-Typen (Start=Waypoint, Via=ViaPoint, Ziel=Waypoint)

---

## 17. Tastenkürzel

| Taste | Funktion |
|------|----------|
| `Leertaste` | Navigation starten/stoppen |
| `D` | Demo-Modus starten/stoppen |
| `M` | Karte nach Norden ausrichten |
| `F` | Vollbild-Modus |
| `Esc` | Panels/Popups schließen |
| `+` / `Scroll` | Karte vergrößern |
| `−` / `Scroll` | Karte verkleinern |

---

## 19. Command-Berechtigungen und Moderation

### Command-Management

Im **Streamer Bot** → **"Commands"** Tab findest du ALLE 18 Built-in Commands:

Für jeden Command kannst du einstellen:
- **Aktiv/Inaktiv** — Toggle um den Command ein-/auszuschalten
- **Zugriffsebene** — Wer den Command nutzen darf (Alle, Follower, Subscriber, VIP, Moderator, Broadcaster)
- **Cooldown** — Mindestabstand in Sekunden zwischen zwei Nutzungen
- **Aliases** — Alternative Trigger-Wörter für den Command

### Eigene Custom Commands

Du kannst **eigene Befehle** erstellen:

1. Klicke auf **"Command hinzufügen"**
2. Gib den **Trigger** ein (z.B. `!regeln`)
3. Gib die **Antwort** ein (eine oder mehrere Zeilen — bei mehreren wird zufällig eine ausgewählt)
4. Setze **Cooldown** und **Zugriffsebene**
5. Speichern

Beispiel:
- Trigger: `!regeln`
- Antwort Zeile 1: `1. Seid nett zueinander`
- Antwort Zeile 2: `2. Kein Spam`
- Antwort Zeile 3: `3. Habt Spaß!`

### Moderation

Im **Streamer Bot** → **"Moderation"** Tab:

- **Letzte Nachrichten** — Verlauf der letzten Chat-Nachrichten
- **Ban-Verlauf** — Liste aller Bans mit Grund
- **Benutzer sperren** — Ban einen User mit Grund
- **Suche** — Suche im Ban-Verlauf

---

## 20. Alert-System — Follows, Subs, Raids

Das Alert-System reagiert auf Twitch-Events und zeigt sie im Stream an.

### Unterstützte Events

| Event | Auslösung | Platzhalter |
|-------|-----------|-------------|
| **Follow** | Jemand folgt dem Kanal | `{user}` |
| **Subscribe** | Neuer Subscriber | `{user}` |
| **Re-Sub** | Subscription erneuert | `{user}`, `{months}` |
| **Gifted Sub** | Geschenktes Sub | `{user}`, `{target}` |
| **Raid** | Jemand raidet | `{user}`, `{viewers}` |
| **Bits** | Bits gespendet | `{user}`, `{amount}`, `{message}` |

### Alert konfigurieren

Für jeden Alert-Typ kannst du einstellen:
- **Nachrichtenvorlage** — Der Text der angezeigt wird (mit Platzhaltern)
- **Farbe** — Hintergrundfarbe des Alerts
- **Sound URL** — MP3/WAV URL für einen Sound
- **Lautstärke** — Lautstärke des Alert-Sounds
- **Dauer** — Anzeigedauer in Sekunden
- **TTS** — Ob der Alert per TTS angesagt wird

### Event Queue

Im **Streamer Bot** → **"Event Queue"** Tab siehst du alle eingehenden Events. Sie werden in der Reihenfolge verarbeitet, in der sie eintreffen.

---

## 21. Für Entwickler — Eigenen Server aufsetzen

Wenn du deine eigene Version von TwitchCoPilot hosten möchtest, brauchst du **keinen teuren Server**. Da die App komplett clientseitig läuft (Static Site), reicht ein einfacher Webhosting-Service.

### Voraussetzungen

| Was du brauchst | Beispiel |
|-----------------|----------|
| **Node.js** (zum Bauen) | v18 oder neuer |
| **npm** | Kommt mit Node.js |
| **Einen Webhoster** | GitHub Pages, Netlify, Vercel, Cloudflare Pages — alle kostenlos |

### Schritt-für-Schritt

#### 1. Sourcecode herunterladen

Lade den Source-Tar von GitHub herunter:
```
twitch-copilot-v4.2.1-source.tar
```

Oder klone das Repository:
```bash
git clone https://github.com/deinuser/TwitchCoPilot.git
cd TwitchCoPilot
```

#### 2. Abhängigkeiten installieren

```bash
npm install
```

Das installiert alle benötigten Pakete (React, Vite, Tailwind CSS, MapLibre, tmi.js, Zustand, Radix UI, und alle anderen Dependencies).

#### 3. Development-Server starten

```bash
npm run dev
```

Der Dev-Server startet auf `http://localhost:5173`. Änderungen am Code werden sofort im Browser sichtbar (Hot Module Replacement).

#### 4. Production Build erstellen

```bash
npm run build
```

Das erstellt den `dist/` Ordner mit allen optimierten Dateien:
- `index.html` — Die Haupt-HTML-Datei
- `assets/index-*.js` — JavaScript Bundle (~1.7 MB gzipped ~473 KB)
- `assets/index-*.css` — Stylesheet (~204 KB gzipped ~30 KB)
- `sw.js` — Service Worker für Offline-Caching
- `manifest.webmanifest` — PWA-Manifest
- `registerSW.js` — Service Worker Registration

#### 5. Deploy

**GitHub Pages:**
```bash
npm run build
# dist/ Ordner auf GitHub Pages deployen
# Oder GitHub Actions Workflow konfigurieren
```

**Netlify:**
```bash
npm run build
# dist/ Ordner auf Netlify ziehen (Drag & Drop)
# Oder netlify.toml konfigurieren:
# [build]
#   command = "npm run build"
#   publish = "dist"
```

**Vercel:**
```bash
npm run build
# vercel --prod
```

**Beliebiger Webspace:**
Lade einfach den Inhalt des `dist/` Ordners per FTP auf deinen Webspace. Fertig!

#### 6. Anpassen

Wenn du die App anpassen möchtest, sind die wichtigsten Dateien:

| Datei | Ändern für |
|-------|-----------|
| `src/App.tsx` | Themes, Layout, globale Logik |
| `src/lib/i18n.ts` | Übersetzungen (Deutsch/Englisch) |
| `src/components/chat/TwitchChatManager.tsx` | Bot-Logik, Befehle, Berechtigungen |
| `src/components/map/MapContainer.tsx` | Karte, Marker, POI-Popups |
| `src/components/sidebar/tabs/RouteTab.tsx` | Routing-Logik |
| `src/components/overlay/OBSOverlayPage.tsx` | OBS-Overlay |
| `src/store/useSettingsStore.ts` | Einstellungen |
| `src/store/useTwitchStore.ts` | Twitch-State |
| `src/store/useNavigationStore.ts` | Navigations-State |

### TypeScript

Das Projekt ist komplett in **TypeScript** geschrieben. Bei jedem Build wird der TypeScript-Compiler ausgeführt (`tsc -b`). Bei Fehlern wird der Build abgebrochen. So wird sichergestellt, dass keine Typfehler in die Produktion gelangen.

---

## 22. Projektstruktur und Sourcecode erklärt

### Ordnerstruktur

```
src/
├── components/
│   ├── chat/
│   │   ├── TwitchChatManager.tsx    ← Twitch Bot, Command Handler, Permissions
│   │   ├── ChatOverlay.tsx          ← Chat-Popup auf der Karte
│   │   └── VotingPanel.tsx          ← Voting-UI und Logic
│   ├── map/
│   │   ├── MapContainer.tsx         ← MapLibre GL Karte, Marker, POI-Popups
│   │   ├── SkyChart.tsx             ← Sternkarte (Canvas-Renderer)
│   │   └── NavArrow.tsx             ← Navigations-Richtungspfeil
│   ├── navigation/
│   │   ├── WeatherWidget.tsx        ← Wetter (Open-Meteo API)
│   │   ├── DriveInfoPanel.tsx       ← Speed/ETA/Höhe Panel
│   │   ├── MuteButton.tsx           ← TTS Stummschaltung
│   │   └── POIShortcuts.tsx         ← POI-Schnellfilter
│   ├── sidebar/
│   │   ├── Sidebar.tsx              ← Sidebar Layout + Tab-Navigation
│   │   ├── SettingsPanel.tsx        ← Alle Einstellungen
│   │   └── tabs/
│   │       ├── RouteTab.tsx         ← Routing + Geocoding + GPX/KML/TCX Export
│   │       ├── POITab.tsx           ← POI-Suche (Overpass API, 16 Kategorien)
│   │       ├── StreamerTab.tsx      ← Twitch Connection, Alerts, Commands, Moderation
│   │       └── NavigateTab.tsx      ← GPS-Tracking, Demo, Community Waypoints
│   ├── sync/
│   │   └── SyncPanel.tsx            ← MQTT Multi-Device-Sync
│   ├── overlay/
│   │   └── OBSOverlayPage.tsx       ← Vollständiges OBS-Overlay
│   └── ui/                          ← Radix UI + shadcn/ui Komponenten (~30 Dateien)
│       ├── dialog.tsx, alert-dialog.tsx, sheet.tsx, drawer.tsx
│       ├── dropdown-menu.tsx, context-menu.tsx, popover.tsx
│       ├── tooltip.tsx, hover-card.tsx, menubar.tsx
│       ├── select.tsx, checkbox.tsx, radio-group.tsx, switch.tsx
│       ├── input.tsx, textarea.tsx, button.tsx, tabs.tsx
│       ├── calendar.tsx, command.tsx, avatar.tsx, card.tsx
│       ├── slider.tsx, progress.tsx, separator.tsx
│       ├── table.tsx, toast.tsx, sonner.tsx
│       └── ... (weitere)
├── store/
│   ├── useTwitchStore.ts            ← Twitch State (Messages, Alerts, Commands, Votes)
│   ├── useNavigationStore.ts        ← Navigation (Waypoints, Route, GPS, Auto-Rerouting)
│   ├── useSettingsStore.ts          ← Einstellungen (persisted in localStorage)
│   └── usePOIStore.ts               ← POI State (Kategorien, Ergebnisse)
├── lib/
│   ├── i18n.ts                      ← Deutsch/Englisch Übersetzungen (~500 Keys)
│   ├── ttsQueue.ts                  ← TTS Warteschlange mit Prioritäten
│   └── overpass.ts                  ← Overpass API Wrapper mit Retry + Fallback
├── hooks/
│   ├── useDraggable.ts              ← Drag & Drop für Overlay-Elemente
│   ├── useNavSync.ts                ← MQTT Sync Sender/Empfänger
│   ├── useAutoReroute.ts            ← Automatische Neuberechnung bei Abweichung
│   ├── useNavTTS.ts                 ← Navigations-TTS mit Distanz-Trigger
│   └── useLiveNavigation.ts         ← GPS-Tracking + Live-Nav Logic
├── App.tsx                          ← Main App + Theme System + ErrorBoundary
├── globals.css                      ← Tailwind CSS + Theme CSS-Variablen + Glassmorphism
├── main.tsx                         ← React Entry Point + Service Worker Registration
└── types/
    └── index.ts                     ← TypeScript Interfaces (Waypoint, POI, Command, etc.)
```

### State Management (Zustand)

Die App verwendet **Zustand** als State-Management. Alle Stores sind in `src/store/`:

| Store | Persistiert? | Beschreibung |
|-------|-------------|-------------|
| `useNavigationStore` | Ja (IndexedDB) | Wegpunkte, Route-Geometrie, GPS-Position, Fahrstatistiken |
| `useTwitchStore` | Ja (IndexedDB) | Chat-Nachrichten, Alerts, Commands, Votes, Ban-History |
| `useSettingsStore` | Ja (localStorage) | Sprache, Theme, Dark Mode, Stimme, Overlay-Toggles, OBS-Sync |
| `usePOIStore` | Nein | Aktive POI-Suche, Ergebnisse, Filter |

### Theme System

Das Theme-System in `App.tsx` definiert **22 CSS-Variablen pro Theme × Modus**:

```typescript
// 5 Themes × 2 Modi = 10 Sätze × 22 Variablen = 220 CSS-Variable-Definitionen
const THEME_COLORS = {
  twitch:   { dark: {...}, light: {...} },
  cargo:    { dark: {...}, light: {...} },
  electric: { dark: {...}, light: {...} },
  sunset:   { dark: {...}, light: {...} },
  pink:     { dark: {...}, light: {...} },
}
```

Die Funktion `applyThemeToDOM()` setzt alle CSS-Variablen als Inline-Styles auf dem `<html>` Element. So funktionieren Themes in Echtzeit ohne Reload.

### CSS Variablen → Tailwind Mapping

In `globals.css` werden die CSS-Variablen mit Tailwind-Klassen verknüpft:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-popover: var(--popover);
  --color-surface: var(--surface);
  --color-primary: var(--primary);
  /* ... und alle anderen */
}
```

So kann man `bg-popover`, `text-foreground`, `border-border` etc. in Tailwind-Klassen nutzen und sie reagieren automatisch auf Theme-Änderungen.

### Glassmorphism

Die `.glass` CSS-Klasse erzeugt den typischen "Frosted Glass" Effekt:

- **Dark Mode:** Dunkler Hintergrund (rgba(20, 20, 40, 0.82)) mit Blur
- **Light Mode:** Heller Hintergrund (rgba(255, 255, 255, 0.82)) mit Blur
- Hover-Effekt in beiden Modi

Verwendet für: Nav-Pfeil, Drive-Info-Panel, Wetter-Widget, POI-Shortcuts, Voting-Panel, Chat-Overlay, Mute-Button.

### Security

| Maßnahme | Beschreibung |
|----------|-------------|
| **Command Permissions** | Per-Command Zugriffskontrolle basierend auf Twitch-Rollen |
| **TTS Text-Limit** | Maximale Zeichenanzahl pro TTS-Befehl (Standard: 200) |
| **No window.globals** | Keine sensitiven Funktionen im globalen Scope |
| **Input Sanitization** | HTML in Map-Popups wird escapet (XSS-Schutz) |
| **Rate Limiting** | Max 10 Befehle pro 30 Sekunden pro User |
| **TypeScript Strict** | Type-Safety verhindert viele Kategorien von Bugs |

---

## 23. Versionierung und Updates

### Versionierungsschema

| Typ | Format | Beispiel | Beschreibung |
|-----|--------|----------|-------------|
| **Patch** | `x.x.Z` | 3.0.4 → 3.0.5 | Bug Fixes, kleine Korrekturen |
| **Minor** | `x.Y.0` | 3.0.5 → 3.1.0 | Große Fixes, Security-Updates |
| **Major** | `X.0.0` | 3.0.5 → 4.0.0 | Neue Features, Breaking Changes |

### Release-Tar Struktur

Jede Version wird als **kombinierte Tar-Datei** veröffentlicht:

```
twitch-copilot-v4.2.1.tar              ← Die EINE Datei zum Download
├── twitch-copilot-v4.2.1-source.tar   ← Kompletter Source Code + README + CHANGELOG + VERSION
├── twitch-copilot-v4.2.1-static.tar   ← Production Build (dist/) + README + CHANGELOG + VERSION
├── README.md                           ← Entwickler-Dokumentation
├── CHANGELOG.md                        ← Versionshistorie
└── VERSION                             ← Versionsnummer
```

### Updates

- Die **gehostete Version** wird immer automatisch aktualisiert — keine Aktion nötig
- **PWA:** Der Service Worker lädt neue Versionen automatisch im Hintergrund
- **Self-Hosted:** Neue Version auf GitHub → Pull → `npm run build` → Deploy

---

## 24. Technischer Hintergrund — APIs und Services

### Externe APIs

| API | Anbieter | Zweck | Kosten | Rate-Limit |
|-----|----------|-------|--------|------------|
| **BRouter** | brouter.de | Routenberechnung (7 Profile) | Kostenlos (Spende) | ~1 Req/s |
| **Nominatim** | OpenStreetMap | Geocoding / Adresssuche | Kostenlos | 1 Req/s (Policy) |
| **Overpass** | OpenStreetMap | POI-Suche (16 Kategorien) | Kostenlos | Variabel |
| **Open-Meteo** | open-meteo.com | Wetterdaten | Kostenlos | 10.000 Req/Tag |
| **MyMemory** | mymemory.translated.net | Übersetzung (30+ Sprachen) | Kostenlos | 5.000 Req/Tag (ohne Key) |
| **Map Tiles** | CARTO / ESRI / OpenTopoMap | Karten-Darstellung | Kostenlos | Keins (CDN) |
| **EMQX** | emqx.com | MQTT Multi-Device-Sync | Kostenlos (Public Broker) | Variabel |
| **Twitch IRC** | twitch.tv | Chat-Bot Verbindung | Kostenlos | IRC Standard |
| **Chrome TTS** | Browser | Text-to-Speech | Kostenlos | Keins |
| **Geolocation** | Browser/W3C API | GPS-Position | Kostenlos | Keins |

### Interne Architektur

```
Browser
├── React App (Client-Side Rendering)
│   ├── MapLibre GL JS     ← Karten-Rendering (WebGL)
│   ├── Zustand Stores     ← State Management
│   ├── Service Worker     ← Offline-Caching (Workbox)
│   ├── IndexedDB          ← Persistenz (Settings, Nav-Data)
│   └── WebSocket (MQTT)   ← Multi-Device-Sync
├── External APIs (HTTPS)
│   ├── BRouter REST       ← Routing
│   ├── Nominatim REST     ← Geocoding
│   ├── Overpass REST      ← POI-Suche
│   ├── Open-Meteo REST    ← Wetter
│   ├── MyMemory REST      ← Übersetzung
│   └── Map Tile CDN       ← Karten-Tiles
└── Twitch IRC (WebSocket)
    └── tmi.js             ← Chat-Bot
```

### Build-Größen

| Datei | Größe (uncompressed) | Größe (gzipped) |
|-------|---------------------|-----------------|
| JavaScript Bundle | ~1.7 MB | ~473 KB |
| CSS Stylesheet | ~204 KB | ~30 KB |
| Service Worker | ~243 KB | — |
| Map Tiles (cached) | Variabel | — |
| **Gesamt (initial load)** | — | **~503 KB** |

---

## 25. FAQ — Häufig gestellte Fragen

### Allgemeines

**F: Muss ich mich registrieren?**
A: Nein. Kein Account, keine Anmeldung, keine E-Mail. Öffne die Seite und los.

**F: Was kostet TwitchCoPilot?**
A: Nichts. Komplett kostenlos. Open Source unter CC BY-NC-SA 4.0 (Non-Commercial). Alle verwendeten APIs sind kostenlos. Das Projekt darf frei verwendet und modifiziert werden, aber nicht kommerziell verwertet werden.

**F: Funktioniert das auch offline?**
A: Teilweise. Die PWA cached Kartentiles für 30 Tage. Routing, Wetter und Übersetzung brauchen Internet. Der Service Worker sorgt dafür, dass die App auch ohne Netz geladen wird.

**F: Welche Browser werden unterstützt?**
A: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+. Wichtig: Safari hat Einschränkungen bei TTS und bestimmten PWA-Features.

### Navigation

**F: Wie genau ist das GPS?**
A: Abhängig von deinem Gerät. Smartphones sind sehr genau (2-5m). Desktop-Browser nutzen IP-basierte Lokalisierung (ungenau, oft mehrere Kilometer abweichend). Für genaue Navigation nimm ein Smartphone.

**F: Warum funktioniert GPS nicht?**
A: GPS braucht HTTPS. Die gehostete Version läuft automatisch über HTTPS. Auf localhost funktioniert es auch ohne HTTPS. Über HTTP auf einem Handy wird GPS vom Browser blockiert.

**F: Was ist Auto-Rerouting?**
A: Wenn du während der Navigation von der geplanten Route abkommst, berechnet die App automatisch eine neue Route von deiner aktuellen Position zum Ziel.

### Twitch

**F: Brauche ich einen eigenen Bot-Account?**
A: Ja. Erstelle einen separaten Twitch-Account für den Bot. Gehe auf [twitchtokengenerator.com](https://twitchtokengenerator.com/), logge dich mit dem Bot-Account ein und generiere einen Token mit den Scopes `chat:read`, `chat:edit` und `channel:moderate`.

**F: Welche Scopes brauche ich für den Token?**
A: Du benötigst drei Scopes: `chat:read` (Chat lesen), `chat:edit` (Nachrichten senden) und `channel:moderate` (Moderation). Alle drei sind zwingend erforderlich — ohne `channel:moderate` kann der Bot keine Moderations-Aktionen ausführen.

**F: Können alle Zuschauer alle Befehle nutzen?**
A: Nein. Jeder Befehl hat eine Zugriffsebene (Alle, Follower, Subscriber, VIP, Moderator, Broadcaster). Du kannst die Berechtigungen im Streamer Bot Tab anpassen.

**F: Was passiert wenn jemand spammt?**
A: Rate-Limit: Maximal 10 Befehle pro 30 Sekunden pro User. Zusätzlich hat jeder Befehl einen einstellbaren Cooldown.

### Browser-Source Overlay

**F: Wie bekomme ich das Overlay in meinen Stream?**
A: Füge eine Browser-Source mit der URL `https://nicetotechyou.github.io/TwitchCoPilot/?overlay=true` hinzu. Breite: 1920, Höhe: 1080. Das funktioniert in OBS Studio, Moblin (Handy), Streamlabs Desktop, TikTok Live Studio und jeder anderen App, die Browser-Sources unterstützt.

**F: Kann ich das Overlay auf dem Handy nutzen?**
A: Ja! Mit Moblin auf iOS oder Android kannst du das Overlay direkt als Web-Widget hinzufügen. Alternativ nutze Multi-Device-Sync: Navi auf dem Handy, Overlay auf einem anderen Gerät.

**F: Welcher Browser wird im Overlay verwendet?**
A: Die Streaming-App nutzt ihren integrierten Browser (Chromium-basiert bei OBS/Streamlabs, WebKit bei Moblin). Das Overlay ist auf beide Browser-Engines optimiert.

**F: Kann ich die Overlay-Elemente verschieben?**
A: Ja! Klicke auf das Stift-Icon (✏️) im Overlay um den Edit-Modus zu aktivieren. Dann kannst du alle Elemente per Drag & Drop verschieben und ihre Größe anpassen.

**F: Warum ist das Overlay dunkel?**
A: Das Overlay ist speziell für den Stream optimiert. Die dunklen Panels mit weißem Text haben optimalen Kontrast auf dem Stream. Du kannst das nicht ändern — es ist by Design.

### Entwickler

**F: Kann ich TwitchCoPilot forked und selbst hosten?**
A: Ja! CC BY-NC-SA 4.0. Fork auf GitHub, anpassen, deployen. Du kannst alles ändern — Themes, Befehle, APIs, UI. Bitte beachte: Keine kommerzielle Nutzung ohne separate Vereinbarung. Namensnennung von nicetoTECHyou ist erforderlich.

**F: Wie lange dauert ein Build?**
A: Auf einem durchschnittlichen PC: ~25 Sekunden für den TypeScript-Check + Vite Build.

**F: Kann ich eigene Routing-Profile hinzufügen?**
A: Ja. Die Routing-Profile sind in `RouteTab.tsx` definiert. Füge einfach ein neues Profil mit der BRouter-URL hinzu.

---

<div align="center">

**TwitchCoPilot** — Interaktive Navigation für Twitch Streamer

Built with 💜 for the bike streaming community

[GitHub](https://github.com) · [CC BY-NC-SA 4.0](LICENSE)

</div>

---

## 26. Neuerungen in v3.0.6–v4.2.1 (Changelog)

Diese Sektion fasst alle wichtigen Änderungen zusammen, die seit Anleitung v3.0.5 eingefügt wurden.

### v4.2.1 — Complete Icon Redesign

- **Neues App-Icon (512x512):** Fahrrad-Wohnmobil im Flat-Comic-Style mit Twitch-Lila (#9146FF) Hintergrund und Neon-Grün (#39FF14) Navigations-Route. Bold Outlines, klare geometrische Formen — optimiert für PWA und App-Store.
- **Neues Favicon (SVG + PNG):** Minimalistisches Fahrrad-Rad mit GPS-Pin in Neon-Grün auf Twitch-Lila. Squircle-Form, hochkontrast, erkennbar ab 32x32 Pixel.
- **Neues Logo SVG:** TwitchCoPilot Branding mit Rad-Icon + Text (Twitch in Lila, CoPilot in Neon-Grün).
- **Maskable Icon:** 192x192 Maskable-Variante mit Safe-Zone für Android Adaptive Icons.
- **Apple Touch Icon:** 180x180 für iOS Home Screen.
- **Funktions-Icon-Satz:** 4 neue Icons (Start, Ziel, Settings, Route) im Flat-Comic-Style mit Neon-Grün auf Twitch-Lila — Twitch-Stream-Overlay-Ästhetik.
- **Design-Stil:** Angelehnt an Flat-Vector/Cartoon-Ästhetik — klare Formen, bold Outlines, keine Gradienten, hohe Erkennbarkeit bei kleinen Größen.

### v4.2.0 — Fluid Route Selection UI

- **Route Selection Overlay:** Neues Floating-Overlay am unteren Kartenrand zeigt alle berechneten Routen-Alternativen nach der Routenberechnung
- **Auto-Minimize Sidebar:** Die Sidebar schaltet automatisch in den Kompakt-Modus (nur Icons), um mehr Kartenfläche freizugeben
- **Dynamisches Highlighting:** Die ausgewählte Route wird farblich hervorgehoben (Bold-Blau), andere Routen werden semi-transparent ausgegraut
- **Map-Fokus:** Die Karte zentriert automatisch alle Routen-Alternativen im Viewport
- **Smart Start-Button:** "Navigation starten" erscheint erst nach Auswahl einer spezifischen Route
- **Smooth Animations:** Framer-Motion Slide-Up/Down Animationen für das Overlay
- **Bug Fixes:** Layout-Bounding-Box Fix (rosa Umrandung entfernt), Overlay-Container passen sich dynamisch an, Edit-Mode Ring wird korrekt zurückgesetzt

### v3.0.6 — Route JSON Import/Export

- **Neues Feature:** Berechnete Routen können als JSON exportiert und importiert werden (1:1 identische Route auf einem anderen Gerät)
- Der Import-Button ist jetzt immer sichtbar, auch ohne geladene Route
- Der Export ist im Dropdown als oberster Eintrag mit Braces-Icon zu finden
- Enthält: Alle Koordinaten, Geometrie, Distanz, Dauer, Auf-/Abstieg, Wegpunkte, Profil, Alternativrouten
- Validierung: Prüft auf korrekte Struktur vor dem Import

### v3.0.8 — !translate Auto-Übersetzungs-Modus & Voting-Popout Fix

- **!translate** unterstützt jetzt drei Modi: Einmalige Übersetzung, Auto-Übersetzungs-Modus (alle Chat-Nachrichten automatisch übersetzen), und `off` zum Deaktivieren
- Aliase `!translator` und `!übersetzer` nutzen exakt dasselbe dreimodige Verhalten
- **Voting-Popout:** Dialog-Fenster nutzt jetzt opaken Hintergrund statt halbtransparentem Glas-Effekt (bessere Lesbarkeit)

### v3.0.9 — VIP-Rang, Cooldown-Befreiung & Alias-Fix

- **VIP als eigenständiger Rang** eingeführt (vorher als Subscriber eingestuft)
- **VIP im Access-Level-Dropdown** der Command-Verwaltung verfügbar
- **Cooldown-Befreiung:** Broadcaster, Moderatoren und VIPs sind komplett von Cooldown und Rate-Limit befreit
- **!translator/!übersetzer** nutzen jetzt identisches dreimodiges Verhalten wie `!translate`
- **Default-User-Level** korrigiert: Normale Chatter ohne Badge sind jetzt `everyone` statt `follower`
- **AbortSignal-Kompatibilität:** Normale AbortController + setTimeout statt `AbortSignal.timeout()` für ältere Browser

### v3.1.0 — Critical Badge-Crash Fix

- **Root Cause:** Alle Commands stürzten ab wenn ein User Twitch-Badges hatte (Broadcaster, Mod, VIP, Subscriber) — `TypeError: n.includes is not a function`, da tmi.js 1.8.5 Badges als Objekt statt String liefert
- **Fix:** `hasBadge()` Helper mit Typ-Prüfung — funktioniert mit Objekt, String und null
- **Defensive Aliase-Prüfung** verhindert Crash bei fehlendem `aliases`-Feld

### v3.1.2 — Fahr-Info-Panel & Voting-Ergebnis Fix

- **Fahr-Info-Panel** zeigt Route-Daten auch ohne aktive Navigation (Distanz, Dauer, Auf-/Abstieg direkt nach Routenberechnung)
- **Voting-Ergebnis** verschwindet automatisch nach 10 Sekunden, zusätzlich mit Schließen-Button

### v3.1.3 — Navigations-Start-Nachricht verbessert

- "Navigation gestartet" zeigt jetzt Route-Summary statt leerer ETA: Ziel, Distanz, Dauer, Aufstieg, Abstieg

### v3.1.4 — Routenlinie bleibt bei Kartenwechsel erhalten

- **Fix:** Beim Wechsel des Kartenstils verschwand die Routenlinie, Alternativrouten und der gefahrene Pfad (MapLibre `setStyle()` zerstörte alle Sources/Layers)
- **Lösung:** `styleLoadCount` State-Counter re-populiert alle Routen-Daten automatisch nach jedem Stilwechsel
- **Bonus:** Viewport-Sprung wird beim reinen Kartenwechsel übersprungen (nur bei tatsächlicher Route-Änderung)

### v3.1.5 — GPS-Status-Store & Auto-Approve aktiviert

- **GPS-Status** wurde vom lokalen Component-State in den globalen NavigationStore verschoben (alle Komponenten können GPS-Status lesen, überlebt Remounts, verfügbar für OBS-Overlay-Sync)
- **Auto-Approve** wurde tatsächlich aktiviert: `!navi` liest jetzt `autoApprove`-Setting und Benutzerrang, Mods/Broadcaster werden immer direkt akzeptiert
- Smart-Routing-Logik: Wegpunkte werden automatisch als Via oder Ziel einsortiert (Haversine-Distanz-Vergleich)

### v3.1.6 — Alternativ-Routen Geometrie-Fix

- **Fix:** Alternativ-Routen verschwanden (oft nur 1 von 3 angezeigt), da der alte Algorithmus nur Gesamtdistanz verglich
- **Neuer Algorithmus:** Geometriebasiert — vergleicht ~40 Sample-Punkte beider Routen mit 50m Toleranz, nur >85% Overlap gilt als "ähnlich"
- **`selectAlternative` Fix:** Hauptroute wird beim Zurück-Klicken zuverlässig wiederhergestellt (`originalMainRouteRef`)
- **Error-Logging:** Fehlgeschlagene BRouter API-Calls werden jetzt mit `console.warn()` protokolliert

### v3.1.7 — POI Fahrrad-Werkstatt Farbkorrektur

- Neue Farbe für Fahrrad-Werkstatt-Marker: `#FF7043` (Material Deep Orange) statt `#2C3E50` (fast schwarz, unsichtbar auf dunkler Karte)

### v3.1.8 — !route Chat-Output komplett überarbeitet

- **Wegpunkt-Namen** anstatt nur Anzahl
- **Dynamische Fortschrittsfilterung:** Bereits abgefahrene Wegpunkte werden ausgeblendet
- **ETE statt ETA:** Verbleibende Fahrzeit statt Ankunftszeit
- **Fortschritts-Prozentwert** `[XX%]` bei aktiver Navigation
- **`🏁 Route abgeschlossen`** wenn alle Wegpunkte erreicht wurden
- Lange Namen auf 25 Zeichen gekürzt, Strecken >1h im `1h 23min` Format

### v3.1.9 — Auto-Approve UI-Toggle

- **Toggle "Wegpunkte auto-akzeptieren"** in der StreamerTab hinzugefügt (unterhalb der Connection-Sektion)
- Der Streamer kann Auto-Approve jetzt ein-/ausschalten — die Einstellung wird persistent gespeichert
- Standard: AN (aktiviert)

### v3.1.10 — Versions-Konsistenz & Build-Stabilisierung

- **`!version` Command** zeigt jetzt die korrekte Versionsnummer (vorher hardcoded auf v3.1.3)
- **Alle Versions-Instanzen** synchronisiert: VERSION, package.json, README Badge, `!version` Command
- **Konsistenter Release-Prozess** definiert: Source-Tar (~1.5 MB), Static-Tar (~2.5 MB), Release-Tar (~4 MB)
- Clean Build Test: Source-Tar enthält alle Dateien für `npm install && npm run build`
