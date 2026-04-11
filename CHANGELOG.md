# TwitchCoPilot — Änderungsprotokoll / Changelog

## v4.3.1 (2026-04-11)

### 🐛 Bug Fix: Dokumentation-Versionen im Static-Tar inkonsistent
- **dist/README.md enthielt alten Version-Badge (4.2.1)**: Die dist/README.md wurde aus upload/ kopiert welches noch die alte Version trug. Resultat: Source-Tar zeigte 4.3.0, Static-Tar zeigte 4.2.1 im README Badge.
- **dist/Anleitung.md referenzierte alte Version (v4.2.1)**: Gleicher Copy-Fehler — die Anleitung im dist/ Ordner hatte veraltete Versionsreferenzen im Changelog-Kapitel-Titel.
- **Fix**: Alle Dokumentations-Dateien (dist/README.md, dist/Anleitung.md, upload/README.md, upload/Anleitung.md, docs/Anleitung_TwitchCoPilot.md) auf v4.3.1 synchronisiert.
- **Prozess-Änderung**: Zukünftig werden Dokumente NACH dem Version-Bump aus den aktuellen Source-Dateien kopiert, nicht aus dem upload/ Ordner.

### Geänderte Dateien (Source)
- `VERSION` — v4.3.1
- `package.json` — v4.3.1
- `src/components/chat/TwitchChatManager.tsx` — `!version` → v4.3.1
- `README.md` — Badge v4.3.1
- `CHANGELOG.md` — v4.3.1
- `upload/README.md` — Badge v4.3.1
- `upload/Anleitung.md` — Version-Referenzen v4.3.1
- `docs/Anleitung_TwitchCoPilot.md` — Version-Referenzen v4.3.1

## v4.3.0 (2026-04-11)

### 🐛 Critical Bug Fix: Fluid Route Selection UI — Map-Fokus-Überschreibung
- **CRITICAL: Map fitBounds überschrieb combinedBounds während Route Selection Mode**: Nach der Routenberechnung wurden 3 Routen (Kürzeste, Schnellste, Sicherste) korrekt mit `combinedBounds` und Overlay-aware Padding (bottom: 200px) auf der Karte positioniert. Aber DANN triggerte der `route`-useEffect in MapContainer ein zweites `fitBounds` mit normalem Padding — ohne Berücksichtigung des Overlay-Bereichs. Die Karte sprang zurück und das Route Selection Overlay (unten am Kartenrand) verdeckte Teile der Routen.
  - **Ursache**: Der `route`-useEffect (MapContainer.tsx Zeile 382) feuerte bei JEDER Route-Änderung, auch wenn `routeSelectionMode` aktiv war. Die `combinedBounds`-Logik in RouteTab.calculateRoute() (Zeile 646) wurde sofort danach durch das zweite `fitBounds` mit normalem Padding überschrieben.
  - **Fix**: `routeSelectionMode` als Guard im fitBounds-Block hinzugefügt. Wenn Route Selection Mode aktiv ist, wird das fitBounds komplett übersprungen — die `combinedBounds` mit Overlay-Padding aus calculateRoute() bleibt erhalten.
  - **Betroffen**: Desktop UND Mobile. Auf Mobile war das Problem besonders gravierend weil das Overlay einen größeren Teil des kleinen Bildschirms verdeckte und die Routen nicht vollständig sichtbar waren.
  - **Effekt**: Karte bleibt korrekt auf alle Routen zentriert mit ausreichend Platz für das Route Selection Overlay am unteren Rand.

### 🎨 Route Selection Overlay — Enhanced UX
- **Overlay-Positionierung**: Von `fixed` auf `absolute` geändert — Overlay wird jetzt relativ zum `<main>` Container (Map-Bereich) positioniert statt relativ zum Viewport. Verhindert Positionierungs-Konflikte mit Sidebar auf Desktop.
- **Staggered Animation**: Route-Cards erscheinen jetzt mit einer kaskadierenden Verzögerung (80ms pro Karte) statt gleichzeitig. Jede Karte slidet von unten hoch mit Framer Motion Spring-Animation.
- **Close-Button**: Neues X-Icon (statt `Navigation rotate-180`) für klareres "Schließen"-Feedback.
- **Breite**: Von `calc(100vw-2rem)` auf `calc(100%-2rem)` geändert — passt sich jetzt korrekt an den Kartenbereich an statt an den Viewport.

### Geänderte Dateien (Source)
- `src/components/map/MapContainer.tsx` — `routeSelectionMode` Guard im route-fitBounds useEffect
- `src/components/map/RouteSelectionOverlay.tsx` — absolute Positionierung, staggered card animations, X Close-Button
- `VERSION` — v4.3.0
- `package.json` — v4.3.0
- `src/components/chat/TwitchChatManager.tsx` — `!version` → v4.3.0
- `CHANGELOG.md` — v4.3.0

## v4.2.1 (2026-04-11)

### 🎨 Complete Icon Redesign
- **Neues App-Icon (512x512)**: Fahrrad-Wohnmobil im Flat-Comic-Style mit Twitch-Lila (#9146FF) Hintergrund und Neon-Grün (#39FF14) Navigations-Route. Bold Outlines, klare Formen — optimiert für App-Store und PWA.
- **Neues Favicon (SVG + PNG)**: Minimalistisches Fahrrad-Rad mit GPS-Pin in Neon-Grün. Squircle-Form, hochkontrast, erkennbar ab 32x32.
- **Neues Logo SVG**: TwitchCoPilot Branding mit Rad-Icon + Text (Twitch in Lila, CoPilot in Neon-Grün).
- **Maskable Icon**: 192x192 Maskable-Variante mit Safe-Zone (75% Content Area auf Twitch-Lila Padding).
- **Apple Touch Icon**: 180x180 für iOS Home Screen.
- **Neuer Funktions-Icon-Satz**: Start (Pin+Play), Ziel (Flag+Check), Settings (Zahnrad), Route (Winding Path) — alle im Flat-Comic-Style mit Neon-Grün auf Twitch-Lila, Twitch-Stream-Overlay-Ästhetik.
- **Design-Stil**: Angelehnt an Flat-Vector/Cartoon-Ästhetik — klare geometrische Formen, bold Outlines, keine Gradienten, hohe Erkennbarkeit bei kleinen Größen. Inspiration durch Referenz-Design eines dreirädrigen Nutzfahrzeugs, adaptiert auf Fahrrad-Wohnmobil für Navi-Kontext.

### Geänderte Dateien (Source)
- `public/favicon.svg` — Komplett neu: Fahrrad-Rad + GPS-Pin SVG
- `public/logo.svg` — Komplett neu: TwitchCoPilot Branding SVG
- `public/icon-512.png` — Neues App-Icon 512x512
- `public/icon-192.png` — Neues App-Icon 192x192
- `public/icon-192-maskable.png` — Neue Maskable-Variante
- `public/apple-touch-icon.png` — Neues Apple Touch Icon 180x180
- `public/favicon.png` — Neues Favicon (PNG Fallback)
- `public/favicon-32.png` — Neues Favicon 32x32
- `VERSION` — v4.2.1
- `package.json` — v4.2.1
- `CHANGELOG.md` — v4.2.1
- `src/components/chat/TwitchChatManager.tsx` — `!version` → v4.2.1

## v4.2.0 (2026-04-11)

### 🎯 Fluid Route Selection UI
- **Auto-Minimize Sidebar**: Nach Routenberechnung schaltet die Sidebar automatisch in den Kompakt-Modus (nur Icons, 52px Breite)
- **Route Selection Overlay**: Neues Floating-Overlay am unteren Kartenrand mit allen Routen-Alternativen (Framer-Motion Slide-Up)
- **Dynamisches Highlighting BLAU**: Ausgewählte Route wird in Bold-Blau (#3B82F6) hervorgehoben, nicht ausgewählte Routen in Semi-Transparent Grau (#888888, 35% Opacity)
- **Map-Fokus**: Karte zentriert automatisch alle Routen-Alternativen im Viewport (combinedBounds + bottom padding für Overlay)
- **Smart Start-Button**: "Navigation starten" erscheint erst nach Auswahl einer spezifischen Route
- **Smooth Animations**: Framer-Motion Spring-Animationen für Overlay Slide-Up/Down

### 🐛 Bug Fixes
- **Pink Bounding Box Fix (useDraggable)**: Container hatte `border: editMode ? undefined : 'none'` — `undefined` verursachte dass Tailwind-Ringe oder Parent-Borders durchschlugen. Fix: `border: 'none'` IMMER, `minWidth: 'auto'`, `minHeight: 'auto'`, `padding: 0`, `margin: 0`, `overflow: 'visible'` hinzugefügt. Container schrumpft jetzt korrekt auf Inhalt und blockiert nicht mehr die Bildschirmkante.
- **Edit-Mode Ring Reset**: `ring-2 ring-dashed ring-primary/50 rounded-lg` wurde nie zurückgesetzt wenn Edit-Mode deaktiviert wurde. Fix: explizit `rounded-none` Class wenn Edit-Mode inaktiv.
- **Route Highlighting Colors**: Vorher Grün (#00FF88) für selektierte Route — schwer von der Standard-Route- Farbe zu unterscheiden. Jetzt eindeutiges Bold-Blau (#3B82F6) mit Glow, während nicht-selektierte Routen in semi-transparentem Grau dargestellt werden.

### 🔧 Internals
- Neue Store-States: `routeSelectionMode`, `highlightedRouteIdx`, `allRouteResults`
- Neue Komponente: `RouteSelectionOverlay.tsx`
- Sidebar Compact-Mode mit sanfter CSS-Transition

### Geänderte Dateien (Source)
- `VERSION` — v4.2.0
- `package.json` — v4.2.0
- `CHANGELOG.md` — v4.2.0

## v4.1.3 (2026-04-11)

### 📝 Dokumentation
- **Multi-Device-Sync Anleitung geräteunabhängig**: README-Beschreibung war PC-zentriert ("auf dem PC öffnen", "Handy → PC"). Overlay-Setup funktioniert aber auch mit Handy-Streaming-Apps (Moblin, Streamlabs) und beliebigen Browser-Source-fähigen Plattformen.
  - "Handy und PC" → "Navi-Gerät und Overlay-Gerät"
  - "OBS-Overlay-URL auf dem PC" → "Overlay-URL als Browser-Source in der Streaming-Software"
  - Neue Feature-Zeile: Funktioniert mit OBS, Moblin, Streamlabs und jeder App die Browser-Sources unterstützt
  - Beispiel-URLs mit GitHub Pages URL ergänzt

### Geänderte Dateien (Source)
- `README.md` — Multi-Device-Sync Sektion geräteunabhängig, Beispiel-URLs hinzugefügt
- `VERSION` — v4.1.3
- `package.json` — v4.1.3
- `CHANGELOG.md` — v4.1.3

## v4.1.2 (2026-04-11)

### 🐛 Critical Bug Fix
- **Bot konnte SEIT IMMER keine Chat-Nachrichten senden — tmi.js `.connected` Property existiert nicht**
  - **Root Cause**: Die TypeScript-Type-Definition `tmi.d.ts` deklariert `connected: boolean` als Property des tmi.js Client. In der Realität hat tmi.js 1.8.5 **KEIN** `.connected` Property — `client.connected` ist IMMER `undefined`.
  - **Auswirkung**: Guard 3 in `sendChat()` prüfte `client.connected !== true`. Da `undefined !== true` → `true`, wurde **JEDER** Sendeversuch blockiert. Der Bot konnte NIE eine einzige Nachricht senden — weder Befehls-Antworten (`!help`, `!version`, `!route`, `!stats`), noch Navigations-Updates, noch TTS-Events.
  - **Fix**: Guard 3 verwendet jetzt `client._isConnected()` — die interne tmi.js-Methode die `this.ws !== null && this.ws.readyState === 1` prüft. Dies ist der ZUVERLÄSSIGSTE Weg um den echten IRC-WebSocket-Status zu ermitteln.
  - **Fehlersuche**: `node -e "const tmi = require('tmi.js'); const c = new tmi.Client({...}); console.log(c.connected, typeof c.connected, typeof c._isConnected)"` → `undefined`, `"undefined"`, `"function"`. Die Type-Definition hat gelogen.
  - **Betroffen**: ALLE Twitch-Chat-Befehle seit v4.0.0. Der Bot empfing Nachrichten (IRC connect funktionierte), konnte aber nie antworten.

### Geänderte Dateien (Source)
- `src/components/chat/TwitchChatManager.tsx` — Guard 3: `client.connected !== true` → `!client._isConnected()`, `!version` → v4.1.2
- `src/types/tmi.d.ts` — `_isConnected(): boolean` Methode hinzugefügt
- `VERSION` — v4.1.2
- `package.json` — v4.1.2
- `CHANGELOG.md` — v4.1.2

## v4.1.1 (2026-04-11)

### 🐛 Bug Fixes
- **CRITICAL: Chat-Commands kamen nicht beim Bot an**: Während der aktiven Navigation erreichten keine Chat-Befehle (`!help`, `!version`, `!stats`, etc.) den Bot — Antworten wurden nicht gesendet.
  - **Ursache 1 — `handleCommand` in `connect()` Dependency-Array**: `connect()` war als `useCallback` deklariert mit `handleCommand` in seinen Dependencies. `handleCommand` hängt von allen Navigations-Store-Werten ab (`currentSpeed`, `remainingDistance`, `eta`, `ascent`, `descent`, `route`, `waypoints`, etc.). Während der Navigation ändern sich diese Werte sekündlich → `handleCommand` wird neu erstellt → `connect` wird neu erstellt. Der Bridge-Registration-`useEffect` (`[connect, disconnect, sendChat]`) lief daraufhin Cleanup (`_sendChatFn: undefined`) und re-Setup jede Sekunde. Während des Mikro-Gaps wurden alle Bridge-Aufrufe von anderen Komponenten (`useNavTTS`, `ChatOverlay`, `NavigateTab`) gedroppt.
  - **Fix 1**: `handleCommand`, `badWordFilter` und `commandPrefix` aus den Dependencies von `connect()` entfernt. Der Message-Handler verwendet bereits `handleCommandRef.current` (ein Ref, kein Closure-Wert), sodass `handleCommand` nicht als Dependency benötigt wird. `badWordFilter` und `commandPrefix` werden jetzt zur Laufzeit aus dem Store gelesen.
  - **Ursache 2 — Schwacher Boolean-Check auf `client.connected`**: Der Guard `if (!client.connected)` wertete `undefined` als `true` → blockierte ALLE Nachrichten wenn `client.connected` nicht initialisiert war (z.B. während Reconnect-Phase oder Edge-Cases in tmi.js).
  - **Fix 2**: Guard geändert auf strikte Prüfung `if (client.connected !== true)`. Nur exakt `true` lässt Nachrichten durch.
  - **Ursache 3 — Stale Closure für `commandPrefix` und `badWordFilter`**: Der `client.on('message', ...)` Handler capturte `commandPrefix` und `badWordFilter` aus dem Closure zur Connect-Zeit. Wenn Settings nachträglich geändert wurden, verwendete der Handler veraltete Werte.
  - **Fix 3**: `commandPrefix` und `badWordFilter` werden jetzt per `useSettingsStore.getState()` zur Laufzeit gelesen (kein Closure-Problem).

### Geänderte Dateien (Source)
- `src/components/chat/TwitchChatManager.tsx` — `connect()` Deps bereinigt, Message-Handler Store-basiert, `client.connected` strikter Check, `!version` → v4.1.1, Diagnostic-Logging
- `VERSION` — v4.1.1
- `package.json` — v4.1.1
- `CHANGELOG.md` — v4.1.1

## v4.1.0 (2026-04-10)

### 🔧 Route-Algorithmus: Korrektur der Routen-Priorisierung und Kosten-Gewichtung
- **Fehler: "Kürzeste" Route war nicht die kürzeste**: Die als "Kürzeste" markierte Route hatte manchmal eine größere geografische Distanz als die "Schnellste". Ursache: Die Routen-Kategorien wurden ausschließlich durch BRouter-Profile bestimmt (`trekking` = kürzeste, `fastbike` = schnellste, `safety` = sicherste). BRouter-Profile haben jedoch eigene Kostenfunktionen die neben der Distanz auch Straßentyp, Oberflächenqualität, Steigung und Zeitfaktoren berücksichtigen. Das `trekking`-Profil optimiert nicht zwingend für reinste Distanz — es bevorzugt z.B. Radwege und asphaltierte Straßen, was zu einem längeren aber "bequemerem" Weg führen kann.
  - **Fix: Post-Processing mit Validierung**: Nach dem Fetch aller Routen wird ein 5-Schritt-Post-Processing durchgeführt:
    1. **Distanz-Sortierung**: Die Route mit der kleinsten Distanz wird als "Kürzeste" deklariert (strikt nach Meter-Wert, keine Zeitfaktoren)
    2. **Zeit-Sortierung**: Die Route mit der kleinsten Dauer wird als "Schnellste" deklariert (berücksichtigt Geschwindigkeit, Straßentyp, Tempolimits)
    3. **Label-Korrektur**: Kategorien werden basierend auf ACTUELLEN Metriken neu zugewiesen (nicht mehr nur nach BRouter-Profil)
    4. **Re-Order**: Die kürzeste Route wird IMMER an Index 0 verschoben (Hauptroute)
    5. **Validierungs-Log**: Console-Output zeigt finale Zuordnung zur Diagnose
  - **Differenzierung der Routen-Typen**:
    - **Route A (Kürzeste)**: 100% Distanz-Priorität. Die Gewichtung ist ausschließlich der reale Meter-Wert. Keine Zeitfaktoren, keine Straßentypen.
    - **Route B (Schnellste)**: Zeit-Priorität. BRouter berechnet Zeit = Distanz / vmax mit Tempolimits und Straßentypen.
    - **Route C (Alternativ/Sicherste)**: Penalty-basierte Alternative. Verwendet das `safety`-Profil das Hauptstraßen, Autobahnen und Barrieren meidet.

### 🐛 Bug Fixes
- **REGRESSION: Bot schrieb gar nichts mehr nach Routen-Start**: Nach dem v4.0.2 Triple-Guard Fix sendete der Bot keine Chat-Nachrichten mehr (weder Navigations-Start noch Turn-By-Turn-Ansagen).
  - **Ursache 1 — Stale Closure für `channel`**: `sendChat()` capturte `channel` über `useCallback([channel])`. Wenn der Channel beim ersten Render noch leer war (Store-Initialisierung), wurde die alte `sendChat`-Funktion mit leerem Channel in die Bridge registriert. Nach `setConnectionInfo()` wurde `sendChat` neu erstellt, aber Race-Conditions zwischen Render-Zyklen konnten dazu führen dass `_sendChatFn` temporär eine veraltete Funktion referenzierte.
  - **Ursache 2 — Redundante `connected`-Prüfungen**: `sendNavChat()` prüfte `store.connected` UND `_sendChatFn` (Double-Guard). `sendChat()` prüfte zusätzlich `client.connected` (Triple-Guard). Insgesamt 4 Checks die bei Transitions-Zuständen (Reconnect, Tab-Wechsel) ALLE fehlschlagen konnten.
  - **Fix 1**: `sendChat()` liest `channel` jetzt direkt aus dem Store via `useTwitchStore.getState().channel` statt aus dem Closure. Kein Stale-Reference-Risiko mehr. `useCallback` hat leere Dependencies `[]` — die Funktion wird nie mehr neu erstellt und ist immer aktuell.
  - **Fix 2**: `sendNavChat()` hat nur noch EINEN Guard (`_sendChatFn` existence). Die `connected`-Prüfung ist OBsolet — `sendChat()` hat intern den Triple-Guard (client existiert, store.connected, IRC WebSocket State).
  - **Fix 3**: Alle anderen Caller (`NavigateTab`, `ChatOverlay`) ebenfalls von redundantem `&& connected` befreit. Single Source of Truth: `sendChat()` ist der einzige Ort der Verbindung prüft.
  - **Fix 4**: `client.connected()` → `client.connected` korrigiert (tmi.js 1.8.5 Property, keine Methode). Type-Declaration `tmi.d.ts` ergänzt.
  - **Fix 5**: `#`-Prefix für Channel wird jetzt explizit hinzugefügt (`channel.startsWith('#') ? channel : '#' + channel`).

### Geänderte Dateien (Source)
- `src/components/sidebar/tabs/RouteTab.tsx` — Post-Processing Validation, Label-Korrektur, Route Re-Order
- `src/components/chat/TwitchChatManager.tsx` — `sendChat()` Store-basiertes Channel, `useCallback([])`, `client.connected` Property-Fix, `!version` → v4.1.0
- `src/hooks/useNavTTS.ts` — `sendNavChat()` Single-Guard (nur `_sendChatFn` Check)
- `src/components/sidebar/tabs/NavigateTab.tsx` — Redundante `connected`-Prüfungen entfernt
- `src/components/chat/ChatOverlay.tsx` — Redundante `connected`-Prüfung entfernt
- `src/types/tmi.d.ts` — `connected: boolean` Property hinzugefügt
- `VERSION`, `package.json` — v4.1.0
- `CHANGELOG.md` — v4.1.0

## v4.0.2 (2026-04-10)

### 🐛 Bug Fixes
- **CRITICAL: Bot postete Nachrichten in Chat obwohl nicht verbunden**: Der Bot sendete Nachrichten an den Twitch-Chat, bevor die IRC-Verbindung vollständig hergestellt war.
  - **Ursache**: `sendChat()` prüfte nur `clientRef.current` (Objekt-Existenz) und `store.connected` (React State). Der tmi.js Client wird bei `connect()` sofort erstellt (`clientRef.current = client`), aber die IRC-Verbindung ist asynchron. Zwischen Client-Erstellung und `connected`-Event existierte das Client-Objekt, aber IRC war noch nicht bereit. Zudem wurde `setConnected(true)` vom tmi.js Event gesetzt, aber die interne WebSocket-Verbindung konnte in einem Übergangszustand sein.
  - **Fix**: `sendChat()` hat jetzt einen **Triple-Guard**:
    1. `clientRef.current` muss existieren (Client-Objekt erstellt)
    2. `store.connected` muss `true` sein (State-Guard)
    3. `client.connected()` muss `true` zurückgeben (tmi.js interner IRC WebSocket State — der zuverlässigste Indikator)
  - Zusätzlich: `console.warn()` bei jedem Block, sodass im Browser-Console sichtbar ist WARUM eine Nachricht blockiert wurde.
- **`!route` Command zeigte keinen Aufstieg/Abstieg**: Die `!route` Chat-Ausgabe (`🗺️ A → B | 12.5km | ~35min`) enthielt keine Höhendaten. Aufstieg und Abstieg waren zwar im Route-Objekt verfügbar, wurden aber nicht ausgegeben.
  - **Fix**: `!route` zeigt jetzt `↑85m ↓42m` am Ende der Nachricht (nur wenn Werte > 0 existieren).
- **`!stats` Command zeigte falsche/null Aufstieg/Abstieg**: `!stats` verwendete die Store-Werte `ascent`/`descent` welche während der Navigation als lineare Fortschritts-Interpolation berechnet werden (`totalAscent * (1 - progress)`). Vor der Navigation sind diese Werte 0. Nach der Navigation sind sie 0 (Reset).
  - **Fix**: `!stats` bevorzugt jetzt `route.ascent`/`route.descent` (BRouter-Daten, korrekt) und fällt nur auf Store-Werte zurück wenn keine Route existiert.

### Geänderte Dateien (Source)
- `src/components/chat/TwitchChatManager.tsx` — `sendChat()` Triple-Guard, `!stats` Route-Objekt-Bevorzugung, `!route` Höhendaten, `!version` → v4.0.2
- `src/hooks/useNavTTS.ts` — `sendNavChat()` Triple-Guard mit kommentierten Guards
- `VERSION`, `package.json` — v4.0.2
- `CHANGELOG.md` — v4.0.2

## v4.0.0 (2026-04-10)

### 🆕 Features
- **Dynamische Navigations-Kamera (Follow-Cam / Chase Cam)**: Neue 3D-Navigationsansicht mit Verfolger-Kamera, vergleichbar mit gängigen Navigationsgeräten (Google Maps Navigation, Apple Maps).
  - **Heading-Up Modus**: Die Karte dreht sich automatisch so, dass die Fahrtrichtung immer nach oben zeigt. Die Kamera rotiert bei Kurvenfahrten flüssig mit der Fahrzeugrotation mit, sodass die Strecke immer von unten nach oben verläuft.
  - **3D Perspektive**: Die Karte wird in einen flachen Winkel geneigt (Pitch), um eine Bird's Eye / Perspective View zu erzeugen. Der Neigungswinkel ist konfigurierbar (20°-80°, Standard: 50°).
  - **Smooth Rotation (Lerp)**: Die Rotation verwendet eine lineare Interpolation mit einem Faktor von 0.08, um ruckelfreie, professionelle Kamerabewegungen zu erzeugen. Ein leichter Delay verhindert Schwindel beim Zuschauen — die Rotation ist bewusst nicht zu empfindlich.
  - **Kontinuierliches Tracking**: Die Kamera-Position wird über einen `requestAnimationFrame`-Loop (~20fps) interpoliert und via `map.easeTo()` auf die MapLibre-Instanz angewendet. Ruckeln wird durch die Kombination aus rAF-Loop und MapLibres interner Easing-Animation vermieden.
  - **GPS-Fokus (Initial)**: Beim Aktivieren prüft Follow-Cam ob GPS aktiv ist. GPS AN → Kamera zoome flüssig auf aktuelle GPS-Position. GPS AUS → Kamera zoome auf den definierten Startpunkt der Route.
  - **Street-View Zoom**: Der Basis-Zoom-Level ist auf z16 (hoher Detailgrad) voreingestellt, konfigurierbar zwischen z14 und z18.
  - **Auto-Zoom (geschwindigkeitsabhängig)**: Die Kamera zoomt automatisch basierend auf der Geschwindigkeit:
    - `> 50 km/h`: Zoom 2 Stufen raus (weite Übersicht)
    - `> 30 km/h`: Zoom 1 Stufe raus
    - `> 20 km/h`: Basis-Zoom
    - `< 5 km/h`: Zoom 1 Stufe rein (Detailansicht an Kreuzungen)
    - `0 km/h`: Basis-Zoom (Stand)
  - **Bearing-Quelle**: GPS `coords.heading` (Hardware-Kompass) wird bevorzugt. Falls nicht verfügbar (GPS drift, iOS), wird der Bearing aus der Route-Geometrie berechnet (Lookahead 8 Punkte für stabile Richtung).
  - **Toggle + Einstellungen**: Follow-Cam kann per Switch in der NavigateTab ein-/ausgeschaltet werden. Bei Aktivierung erscheinen Slider für Pitch (Neigung) und Basis-Zoom. Einstellungen werden persistent im Settings-Store gespeichert.
  - **Kompatibilität**: Follow-Cam ist kompatibel mit MapLibre GLs `bearing` und `pitch` API. Der bestehende Compass-Reset-Button setzt Follow-Cam zurück (bearing=0, pitch=0). Wenn Follow-Cam deaktiviert wird, wird die Karte automatisch auf 2D-Ansicht (pitch=0, bearing=0) zurückgesetzt.
  - **Deaktiviert**: Wenn Follow-Cam aktiv ist, wird das Basic-Centering (altes `map.easeTo({center})`) in MapContainer und NavigateTab übersprungen, um Konflikte zu vermeiden. Follow-Cam übernimmt die volle Kamerakontrolle.

### Geänderte Dateien (Source)
- `src/hooks/useFollowCam.ts` — **NEU**: Follow-Cam Hook mit rAF-Loop, Lerp-Interpolation, Auto-Zoom, GPS-Fokus
- `src/types/index.ts` — `followCamEnabled`, `followCamPitch`, `followCamZoom` zu `AppSettings` hinzugefügt
- `src/store/useSettingsStore.ts` — Defaults: `followCamEnabled: false`, `followCamPitch: 50`, `followCamZoom: 16`
- `src/components/map/MapContainer.tsx` — `useFollowCam()` integriert, Basic-Centering mit `!followCamEnabled` Guard
- `src/components/sidebar/tabs/NavigateTab.tsx` — Follow-Cam Toggle + Pitch/Zoom Slider, watchPosition Guard
- `src/lib/i18n.ts` — 5 neue Keys DE + EN: `nav.followCam`, `nav.followCamPitch`, `nav.followCamZoom`, `nav.followCamZoomOut`, `nav.followCamZoomIn`
- `src/components/chat/TwitchChatManager.tsx` — `!version` → v4.0.0
- `VERSION`, `package.json` — v4.0.0

## v3.1.11 (2026-04-10)

### 🐛 Bug Fixes
- **Routen zeigten nur Aufstieg, keinen Abstieg (Elevation Descent Bug)**: Route Krainburg → Rijeka (durch Berge) zeigte Aufstieg aber Abstieg = 0m. Route geht durch alpines Gelände mit ~1400m+ Höhenunterschied — es MUSS Abstieg geben.
  - **Ursache**: BRouter 1.7.0 auf brouter.de liefert `filtered ascend` Property, aber **kein** `filtered descend`, `descend` oder `plain-descend`. Die Property existiert schlicht nicht im GeoJSON Response.
  - **Fix**: Neue `calcElevationFromMessages()` Funktion parst das BRouter Messages-Array (enthält Elevation-Daten für jeden Track-Punkt) und berechnet gefilterten Auf-/Abstieg (5m Threshold). Wird als Fallback verwendet wenn BRouter keine Descent-Property liefert. Zusätzlich wird der Aufstieg aus den Messages-Daten übernommen wenn er höher ist als der BRouter-Wert.
- **Dead Code: Vehicle Presets entfernt**: `VehicleConfig` Interface, `VEHICLES` Array (FRANKY, MTB, Rennrad, DeLorean) und `setSelectedVehicle` Action waren Überreste aus dem Demo-Modus der ersten Versionen. Keine UI-Komponente referenzierte sie. `selectedVehicle` im NavigationStore wurde auf `{ name: string; color: string }` vereinfacht (wird nur noch für Peer-Sync Name/Color benötigt). `selectedVehicle` String im SettingsStore komplett entfernt.

### 📦 Dependency Updates
- react: 19.2.3 → 19.2.5
- react-dom: 19.2.3 → 19.2.5
- zustand: 5.0.10 → 5.0.12
- vite: 8.0.4 → 8.0.8
- framer-motion: 12.26.2 → 12.38.0
- @tanstack/react-query: 5.90.19 → 5.97.0
- zod: 4.3.5 → 4.3.6
- tailwind-merge: 3.4.0 → 3.5.0
- react-hook-form: 7.71.1 → 7.72.1
- react-day-picker: 9.13.0 → 9.14.0
- @types/react: 19.2.8 → 19.2.14
- + 6 weitere Pakete aktualisiert

### Geänderte Dateien (Source)
- `src/components/sidebar/tabs/RouteTab.tsx` — `calcElevationFromMessages()` Fallback + Integration in Route-Fetch
- `src/types/index.ts` — `VehicleConfig` + `VEHICLES` entfernt, `selectedVehicle` aus `AppSettings` entfernt
- `src/store/useNavigationStore.ts` — `VehicleConfig` → `{ name, color }`, `VEHICLES` Import entfernt, `setSelectedVehicle` entfernt
- `src/store/useSettingsStore.ts` — `selectedVehicle: 'franky'` entfernt
- `src/components/chat/TwitchChatManager.tsx` — `!version` → v3.1.11
- `VERSION`, `package.json`, `README.md` — v3.1.11

## v3.1.10 (2026-04-10)

### 🐛 Bug Fixes
- **`!version` Command zeigte veraltete Versionsnummer (v3.1.3)**: Der String in `TwitchChatManager.tsx` Zeile 381 war hardcoded auf `v3.1.3` und wurde bei Versionssprüngen nie aktualisiert. Jeder `!version`-Aufruf im Chat zeigte falsche Daten.
  - **Fix**: Hardcoded String durch `v3.1.10` ersetzt.
- **Versions-Konsistenz über alle Dateien**: VERSION, package.json, README.md Badge waren bei mehreren Versionssprüngen nicht synchronisiert (README zeigte 3.1.3, Code zeigte 3.1.3, VERSION zeigte 3.1.9).
  - **Fix**: Alle Instanzen auf 3.1.10 synchronisiert. README.md Badge: 3.1.10. VERSION: 3.1.10. package.json: 3.1.10. `!version` Command: 3.1.10.

### 🔧 Release-Prozess
- **Build-Stabilisierung & Source-Integrität**: Erster konsistenter Release-Prozess definiert.
  - **Source-Tar** (~1.5 MB): Enthält `src/`, `public/`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `VERSION`, `CHANGELOG.md`, `README.md`. Ausschlüsse: `node_modules/`, `dist/`, `.git/`, `.vite/`, `*.tar`.
  - **Static-Tar** (~2.5 MB): Enthält den gesamten `dist/` Ordner inkl. `VERSION`, `CHANGELOG.md`, `README.md`.
  - **Release-Tar** (~4 MB): Enthält Source-Tar + Static-Tar + VERSION.
  - **4 MB vs 40 MB Analyse**: Die 40 MB Schwankung trat auf wenn `node_modules/` oder `dist/` nicht korrekt ausgeschlossen wurden. `node_modules/` = ~150 MB, `dist/` = ~3 MB. Ohne `--exclude='node_modules'` wird der Source-Tar ~150+ MB.
  - **Clean Build Test**: Source-Tar enthält alle notwendigen Dateien für `npm install && npm run build`.

### Geänderte Dateien (Source)
- `src/components/chat/TwitchChatManager.tsx` — `!version` String: v3.1.3 → v3.1.10
- `VERSION` — v3.1.10
- `package.json` — 3.1.10
- `README.md` — Version Badge 3.1.10

## v3.1.9 (2026-04-10)

### 🐛 Bug Fixes
- **`autoApprove`-Einstellung fehlte in der UI**: Die Einstellung `autoApprove` existierte im Settings-Store (default: `true`) und wurde im `!navi`-Handler gelesen, aber es gab keinen Toggle in den Optionen. Der Streamer konnte Auto-Akzeptieren nicht ein-/ausschalten — es war IMMER aktiv für alle Viewer. Mods/Broadcaster wurden immer auto-akzeptiert (unabhängig von der Einstellung).
  - **Fix**: Toggle "Wegpunkte auto-akzeptieren" in der StreamerTab unterhalb der Connection-Sektion hinzugefügt. Navigation-Icon + Label + Switch. Standard: AN (`true`). Einstellung wird per `updateSetting('autoApprove', v)` persistent gespeichert.

### Geänderte Dateien (Source)
- `src/components/sidebar/tabs/StreamerTab.tsx` — `autoApprove` Toggle + `Navigation` Icon import
- `src/lib/i18n.ts` — `twitch.autoApproveWaypoints` Keys (DE + EN)
- `VERSION` — v3.1.9
- `package.json` — 3.1.9

## v3.1.8 (2026-04-10)

### 🎨 UI/UX
- **`!route` Chat-Ausgabe überarbeitet**: Die bisherige Ausgabe (`🗺️ Route: 2 Wegpunkte | 2.9 km | ~8 min | ETA: --:--`) war zu minimalistisch und lieferte keine nachvollziehbaren Details.
  - **Wegpunkt-Namen**: Anstatt nur die Anzahl werden jetzt die einzelnen Wegpunkte mit Namen aufgelistet: `🗺️ Mein Start → VIA Punkt → Bahnhof | 2.9km | ~8min`
  - **Dynamische Fortschrittsfilterung**: Während der Navigation werden bereits abgefahrene Wegpunkte ausgeblendet. Die Nachricht zeigt nur noch die verbleibenden Stationen (basierend auf drivenPath-Koordinaten, 80m Toleranz).
  - **ETE statt ETA**: Die Ankunftszeit (`ETA: --:--`) wurde durch die verbleibende Fahrzeit (ETE) ersetzt. Während der Navigation werden Reststrecke + Restzeit angezeigt, vor der Navigation die Gesamtdaten.
  - **Fortschrittsanzeige**: Bei aktiver Navigation wird der Fortschritt als Prozentzahl angehängt: `[47%]`.
  - **Route abgeschlossen**: Wenn alle Wegpunkte erreicht wurden: `🏁 Route abgeschlossen — Alle Wegpunkte erreicht!`
  - **Lesbarkeit**: Lange Wegpunkt-Namen werden auf 25 Zeichen gekürzt. Strecken >1h zeigen `1h 23min` Format.

### Geänderte Dateien (Source)
- `src/components/chat/TwitchChatManager.tsx` — `!route` Handler komplett überarbeitet, `parseEtaToSeconds()` Helper, `drivenPath` destrukturiert
- `src/lib/i18n.ts` — `bot.routeArrived` Key (DE + EN)
- `VERSION` — v3.1.8
- `package.json` — 3.1.8

## v3.1.7 (2026-04-10)

### 🎨 UI/UX
- **POI "Fahrradwerkstatt" — mangelhafter Kontrast**: Die Farbe `#2C3E50` (fast schwarz) war auf dunkler Karte nahezu unsichtbar und verschmolz auf heller Karte mit Straßenbeschriftungen. Marker war praktisch nicht erkennbar.
  - **Neue Farbe**: `#FF7043` (Material Deep Orange) — kontraststark in Light Mode und Dark Mode, intuitiv mit "Reparatur/Werkstatt" assoziiert (Orange = mechanisch, Werkzeug), klar unterscheidbar von allen anderen POI-Farben.

### Geänderte Dateien (Source)
- `src/types/index.ts` — `bicycle_repair` Farbe: `#2C3E50` → `#FF7043`
- `VERSION` — v3.1.7
- `package.json` — 3.1.7

## v3.1.6 (2026-04-10)

### 🐛 Bug Fixes
- **Alternativ-Routen verschwanden (nur 1 von 3 angezeigt)**: Der Routing-Algorithmus sollte 3 Routen-Optionen berechnen (Kürzeste, Schnellste, Sicherste), aber oft wurde nur 1 Route angezeigt.
  - **Ursache 1 — Aggressiver Distanz-Filter**: `isSimilarRoute()` verglich nur die Gesamtdistanz (5% Schwelle). Zwei völlig unterschiedliche Routen (z.B. Trekking vs. Fastbike) mit ähnlicher Gesamtlänge wurden als "identisch" eingestuft und gefiltert. Beispiel: trekking=10.2km, fastbike=10.5km, safety=10.3km → alle innerhalb 5% → nur 1 überlebte.
  - **Fix 1**: `isSimilarRoute()` jetzt **geometriebasiert** — vergleicht tatsächliche Koordinaten-Punkte beider Routen (~40 Sample-Punkte, 50m Toleranz). Nur Routen mit >85% Geometrie-Overlap werden als ähnlich eingestuft. Schnelle Distanz-Prüfung (>20% Unterschied → sofort "anders") als Vorab-Filter.
  - **Ursache 2 — Doppelter Dedup-Pass**: Die Similaritätsprüfung wurde ZWEIMAL angewendet (einmal beim Fetch, einmal kaskadierend danach). Der zweite Pass machte es Routes noch schwerer zu überleben.
  - **Fix 2**: Zweiter Dedup-Pass komplett entfernt. Ein Pass im Fetch-Loop reicht.
- **`selectAlternative` verlor die Original-Route**: Wenn man zwischen Alternativrouten hin- und herschaltete, wurde die Hauptroute beim Zurück-Klicken auf "Kürzeste" nicht wiederhergestellt — stattdessen zeigte sie die zuletzt ausgewählte Alternativroute.
  - **Fix**: `originalMainRouteRef` speichert die Original-Hauptroute beim ersten Berechnen. Klick auf idx=0 stellt sie zuverlässig wieder her.
- **Silent Error Swallowing**: Fehlgeschlagene BRouter API-Calls (z.B. Profil nicht gefunden, Timeout) wurden komplett verschluckt. Keine Log-Ausgabe, keine Diagnosemöglichkeit.
  - **Fix**: `console.warn()` mit Profilname und Fehlerdetails.
- **Dead Code**: `cacheKey` Variable wurde berechnet aber nie verwendet. Entfernt.

### Geänderte Dateien (Source)
- `src/components/sidebar/tabs/RouteTab.tsx` — Geometrie-basiertes `isSimilarRoute()`, Dedup-Pass entfernt, `originalMainRouteRef`, Error-Logging, Dead Code entfernt
- `VERSION` — v3.1.6
- `package.json` — 3.1.6

## v3.1.5 (2026-04-10)

### 🐛 Bug Fixes
- **GPS-Status wurde nicht global geteilt**: `gpsStatus` war als lokaler `useState` in `NavigateSection` gespeichert. Andere Komponenten (DriveInfoPanel, OBSOverlay, MapContainer) konnten nicht erkennen ob GPS aktiv ist — sie sahen zwar die Positionsdaten (`currentLat`/`currentLon`) im Store, konnten aber nicht zwischen "GPS aktiv trackt" und "veraltete Koordinaten" unterscheiden. Bei Tab-Wechsel oder Remount resettete der lokale State auf `'idle'` obwohl `watchPosition` im Hintergrund weiterlief.
  - **Fix**: `gpsStatus` in den `useNavigationStore` Zustand Store verschoben. Alle Komponenten können jetzt GPS-Status lesen. Status überlebt Remounts und ist für OBS-Overlay-Sync verfügbar.

- **`!navi` Wegpunkte wurden nie automatisch angenommen (Dead Code)**: Die Einstellung `autoApprove: true` existierte im Settings-Store, wurde aber **niemals ausgelesen**. Der `!navi` Befehl fügte Wegpunkte immer in die `pendingWaypoints` Warteschlange ein — unabhängig von der Einstellung oder dem Benutzerrang. Es gab keinen Auto-Akzeptanz-Pfad für Mods/Broadcaster. Die Wegpunkte blieben dauerhaft in der Pending-Liste bis der Streamer manuell auf ✅ klickte.
  - **Fix**: `!navi` prüft jetzt `autoApprove`-Setting UND Benutzerrang (Mod/Broadcaster → immer Auto-Approve). Bei Auto-Approve wird der Wegpunkt direkt mit Smart-Routing-Logik in die Navigation eingefügt (Ziel oder Via, je nach Haversine-Distanz) und in die `approvedWaypoints` Historie verschoben. Normale Viewer mit aktiviertem Auto-Approve werden auch direkt akzeptiert.
  - **Neuer Chat-Output bei Auto-Approve**: `✅ @user Wegpunkt hinzugefügt: "Adresse"` statt `🗺️ @user schlägt vor: "Adresse" (Wartend auf Bestätigung)`

### Geänderte Dateien (Source)
- `src/store/useNavigationStore.ts` — `gpsStatus` State + `setGpsStatus` Action
- `src/components/sidebar/tabs/NavigateTab.tsx` — Lokales `gpsStatus` durch Store ersetzt
- `src/components/chat/TwitchChatManager.tsx` — Auto-Approve Logik + `haversineDistance()` Helper
- `src/lib/i18n.ts` — `bot.naviAutoApproved` Key (DE + EN)
- `VERSION` — v3.1.5
- `package.json` — 3.1.5

## v3.1.4 (2026-04-10)

### 🐛 Bug Fixes
- **Routenlinie verschwand beim Kartenwechsel**: Beim Wechsel des Kartenstils (Street → Satellite → Dark → Topo) verschwand die aktive Routenlinie, Alternativrouten und der gefahrene Pfad.
  - **Ursache**: MapLibre `map.setStyle()` zerstört ALLE Sources und Layers. Der `style.load`-Handler erstellte sie mit leeren Daten neu, aber die useEffects, die die Routendaten setzen (`[route, showRouteLine]`, `[alternativeRoutes, showAltRoutes, isNavigating]`, `[drivenPath, showDrivenPath]`), feuerten nicht erneut — ihre Dependencies hatten sich nicht geändert.
  - **Fix**: `styleLoadCount` State-Counter wird bei jedem `style.load` inkrementiert. Alle betroffenen useEffects haben `styleLoadCount` in ihren Dependency-Arrays → sie re-populieren ihre Daten automatisch nach jedem Stilwechsel.
  - **Bonus**: `fitBounds` (Viewport-Sprung auf Route) wird beim reinen Kartenwechsel übersprungen (`styleChangedRef`) — nur bei tatsächlicher Route-Änderung springt die Karte.

### Geänderte Dateien (Source)
- `src/components/map/MapContainer.tsx` — `styleLoadCount` State, `styleChangedRef` Flag, Dependency-Arrays erweitert
- `VERSION` — v3.1.4
- `package.json` — 3.1.4

## v3.1.3 (2026-04-10)

### 🐛 Bug Fixes
- **"Navigation gestartet" zeigte "ankunft: --:--"**: Beim Navigationsstart wurde die Navigations-Start-Nachricht mit `nav.eta` gesendet, was beim Start noch `--:--` ist (keine GPS-Position). Fix: Start-Nachricht zeigt jetzt Route-Daten direkt aus dem berechneten `route`-Objekt: Ziel, Distanz, Dauer, Aufstieg, Abstieg.
  - Vorher: `🗺️ Navigation gestartet. Ziel: Bahnhof. ankunft: --:--.`
  - Jetzt: `🗺️ Navigation gestartet. Ziel: Bahnhof. | 12.5km | ~35min | ↑85m ↓42m`

### Geänderte Dateien (Source)
- `src/hooks/useNavTTS.ts` — Navigations-Start-Nachricht mit Route-Summary
- `VERSION` — v3.1.3
- `package.json` — 3.1.3
- `README.md` — Version Badge aktualisiert
- `CHANGELOG.md` — v3.1.3

## v3.1.2 (2026-04-10)

### 🐛 Bug Fixes
- **Fahr-Info-Panel zeigte keine Daten nach Routenberechnung**: Das 2x3 Grid (Distanz, Dauer, Auf-/Abstieg) wurde nur während aktiver Navigation (`isNavigating || isDemoMode`) gerendert. Nach der Routenberechnung blieben alle Werte auf `0` / `--`. Fix: Das Grid wird jetzt auch angezeigt wenn eine Route berechnet wurde (`hasRoute`). Daten stammen dann direkt aus dem `route`-Objekt statt aus den Live-Navigations-Werten. Labels passen sich an: "Reststrecke" → "Distanz", "Ankunft" → "Dauer".
- **Abstimmungsergebnis blieb dauerhaft im Bild** (v3.1.1): Nach 10s wird `setVote(null)` aufgerufen + ✕ Schließen-Button.

### Geänderte Dateien (Source)
- `src/components/navigation/DriveInfoPanel.tsx` — Route-Data-Anzeige auch ohne aktive Navigation
- `src/components/chat/VotingPanel.tsx` — Auto-Clear + Schließen-Button
- `src/lib/i18n.ts` — `nav.routeDistance` Key (DE: "Distanz", EN: "Distance")
- `VERSION` — v3.1.2
- `package.json` — 3.1.2
- `README.md` — Version Badge aktualisiert
- `CHANGELOG.md` — v3.1.2

## v3.1.1 (2026-04-10)

### 🐛 Bug Fixes
- **Abstimmungsergebnis blieb dauerhaft im Bild**: Nach Ablauf der Vote-Zeit wurde der Gewinner angezeigt, verschwand aber nie — `activeVote` wurde nie aus dem Store gelöscht. Fix: Nach 10s wird `setVote(null)` aufgerufen, Ergebnis-Kart verschwindet automatisch. Zusätzlich: ✕ Schließen-Button für manuelles Schließen.

### Geänderte Dateien (Source)
- `src/components/chat/VotingPanel.tsx` — Auto-Clear nach 10s + Schließen-Button
- `VERSION` — v3.1.1
- `package.json` — 3.1.1
- `README.md` — Version Badge aktualisiert
- `CHANGELOG.md` — v3.1.1

## v3.1.0 (2026-04-10)

### 🐛 Critical Bug Fix
- **ROOT CAUSE: `!translate` (und ALLE Commands) crashsten bei Benutzern mit Twitch-Badges** — `TypeError: n.includes is not a function`
  - **Ursache**: tmi.js 1.8.5 parsed IRC-Badges in ein **Objekt** (`{broadcaster: "1", vip: "1"}`), NICHT in einen String (`"broadcaster/1,vip/1"`)
  - Unser Code rief `badges.includes('broadcaster')` auf → Objekte haben KEINE `.includes()` Methode → 💥 Crash
  - **Betroffen**: JEDER Command für User mit Twitch-Badges (Broadcaster, Moderator, VIP, Subscriber, Founder)
  - **Nicht betroffen**: User OHNE Badges (normale Viewer) → `badges` war `null` → `&&` Guard verhinderte den Aufruf
  - **Fix**: `getUserAccessLevel()` nutzt jetzt `hasBadge()` Helper mit Typ-Prüfung:
    - `typeof badges === 'object'` → `name in badges` (Objekt-Operator)
    - `typeof badges === 'string'` → `badges.includes(name)` (String-Methode)
    - `null`/`undefined` → `false`
- **Defensive `aliases`-Prüfung**: `commands.find()` nutzt jetzt `c.aliases && c.aliases.includes(...)` — verhindert Crash wenn `aliases` undefined/fehlt

### Geänderte Dateien (Source)
- `src/components/chat/TwitchChatManager.tsx` — `getUserAccessLevel()` komplett umgeschrieben mit `hasBadge()` Helper, defensive `aliases`-Guards
- `VERSION` — v3.1.0
- `package.json` — 3.1.0
- `README.md` — Version Badge aktualisiert
- `CHANGELOG.md` — v3.1.0

## v3.0.9 (2026-04-10)

### 🐛 Bug Fixes
- **Cooldown blockierte Broadcaster/Mod/VIP**: Cooldown (30s) und User-Limit (3/Befehl) galten für ALLE Nutzer — inkl. dem Streamer selbst. Dadurch wurde jeder Befehl nach dem ersten geblockt. Fix: Broadcaster, Moderatoren und VIPs sind komplett von Cooldown und User-Limit befreit (`isCooldownExempt()`).
- **VIP-Rang wurde nicht erkannt**: Twitch-VIPs wurden als 'subscriber' eingeordnet statt als eigener Rang 'vip'. Fix: `getUserAccessLevel()` erkennt jetzt VIP-Badge (`vip/1`) als eigenständigen Rang mit korrekter Hierarchie-Position (über Follower, unter Subscriber).
- **VIP fehlte als Access-Level-Option**: In der Command-Verwaltung (StreamerTab) gab es kein 'VIP' im Dropdown. Fix: VIP als Option hinzugefügt, Type `BotCommand['accessLevel']` erweitert, `levelHierarchy` aktualisiert auf `['everyone', 'follower', 'vip', 'subscriber', 'mod', 'broadcaster']`.
- **!translator/!übersetzer Alias nutzte alte Logik**: Alias-Befehle erforderten immer `<sprache> <text>` und boten keinen Auto-Modus. Fix: Identisches 3-Modus-Verhalten wie `!translate` (Auto-Übersetzung, Einzelübersetzung, Off).
- **AbortSignal.timeout() nicht kompatibel**: Auto-Translate im Message-Handler nutzte `AbortSignal.timeout(8000)` was in älteren Browsern fehlt. Fix: Normale `AbortController` + `setTimeout` Pattern.
- **Default-User-Level war 'follower' statt 'everyone'**: Normale Chatter ohne Badge wurden als 'follower' eingestuft — Befehle mit `accessLevel: 'follower'` waren für sie gesperrt. Fix: Default ist jetzt 'everyone', sodass Standard-Chatter auf alle 'everyone'-Befehle zugreifen können.

### Geänderte Dateien (Source)
- `src/types/index.ts` — 'vip' zu BotCommand.accessLevel hinzugefügt
- `src/components/chat/TwitchChatManager.tsx` — `isCooldownExempt()`, VIP-Erkennung, Cooldown/Limit-Befreiung, Alias-Update, AbortController-Fix
- `src/components/sidebar/tabs/StreamerTab.tsx` — VIP im Access-Level-Dropdown
- `VERSION` — v3.0.9
- `package.json` — 3.0.9
- `CHANGELOG.md` — v3.0.9

## v3.0.8 (2026-04-10)

### 🐛 Bug Fixes
- **Static-Tar enthielt keine Dokumentation**: README.md, CHANGELOG.md und VERSION fehlten im dist/ Ordner und damit im Static-Tar. Fix: Docs werden jetzt vor dem Tar-Packen in dist/ kopiert.
- **README: Pack-Anweisungen fehlten**: Keine klare Dokumentation der erforderlichen Schritte beim Release-Packen. Fix: Schritt-für-Schritt-Anleitung mit Pflicht-Hinweis (`cp VERSION CHANGELOG.md README.md dist/`) in die README aufgenommen.
- **Voting-Popout transparent**: Das Dialog-Fenster zum Erstellen einer Abstimmung nutzte die `glass`-Klasse (semi-transparent). Fix: `bg-background` statt `glass` → jetzt voll opaker, lesbarer Hintergrund.
- **!translate Command funktionierte nicht wie erwartet**: `!translate english` zeigte nur Usage-Hinweis statt die Auto-Übersetzung zu aktivieren.

### 🆕 Features
- **!translate Auto-Übersatz-Modus**: Der `!translate` Command unterstützt jetzt drei Modi:
  - `!translate <sprache>` — Aktiviert Auto-Übersetzung (alle Chat-Nachrichten werden automatisch übersetzt)
  - `!translate <sprache> <text>` — Einmalige Übersetzung eines Textes (bestehendes Verhalten)
  - `!translate off` — Deaktiviert die Auto-Übersetzung
  - Unterstützt 30+ Sprachen (de, en, fr, es, it, pt, nl, pl, ru, ja, zh, ko, ar, tr, sv, cs, da, fi, el, he, hi, th, vi, id, uk, ro, hu, no)
  - Übersetzte Nachrichten erscheinen als System-Nachricht im Chat-Overlay

### Geänderte Dateien (Source)
- `src/components/chat/TwitchChatManager.tsx` — Auto-Übersetzungs-Modus, Ref für Ziel-Sprache, Message-Handler erweitert
- `src/components/chat/VotingPanel.tsx` — Dialog Hintergrund von `glass` auf `bg-background` geändert
- `src/lib/i18n.ts` — 4 neue Keys: `translateAutoOn`, `translateAutoOff`, `translateAutoNotActive`, `translateAutoStatus`
- `src/components/sidebar/tabs/StreamerTab.tsx` — Beschreibung aktualisiert
- `VERSION` — v3.0.8
- `package.json` — 3.0.8

## v3.0.6 (2026-04-10)

### 🐛 Bug Fixes
- **Import-Button nicht sichtbar ohne geladene Route**: Der JSON-Import-Button war im `{route && (...)}` Block eingeschlossen und nur sichtbar wenn bereits eine Route berechnet war. Fix: Button nach außerhalb des Blocks verschoben — jetzt immer sichtbar, unabhängig vom Route-Zustand.

### 🆕 Features
- **Route JSON Import/Export**: Komplette berechnete Route als JSON exportieren/importieren
  - 1:1 identische Route auf einem anderen Gerät (Handy, PC, WhatsApp-Share)
  - Enthält: Alle Koordinaten, Geometrie, Distanz, Dauer, Auf-/Abstieg, Wegpunkte, Profil, Alternativrouten
  - Keine Neuberechnung nötig — Import stellt die exakte Route im Store + auf der Karte wieder her
  - Import-Button (FileUp Icon) immer sichtbar, Export im Dropdown als oberster Eintrag mit Braces-Icon
  - Profil wird automatisch wiederhergestellt wenn im JSON enthalten
  - Validierung: Prüft auf korrekte Struktur (app, selectedRoute, geometry >= 2 Punkte)

### Geänderte Dateien (Source)
- `src/components/sidebar/tabs/RouteTab.tsx` — `exportRouteJSON()`, `importRouteJSON()`, Import-Button außerhalb Route-Block, JSON im Export-Dropdown
- `src/lib/i18n.ts` — 4 neue Keys: `nav.importRoute`, `nav.exportJSON`, `nav.importSuccess`, `nav.importError`
- `VERSION` — v3.0.6
- `package.json` — 3.0.6

## v3.0.5 (2026-04-10)

### 🔒 Security
- **Command Permission System implementiert**: Jeder Built-in Command hat jetzt ein `accessLevel` (everyone/follower/subscriber/mod/broadcaster)
  - Twitch IRC `user-type` + `badges` Tags werden gelesen → Mod, Subscriber, Broadcaster, VIP erkannt
  - `!tts` und `!tts-t` → **Subscriber-only** (TTS kostet Streamer Sprechzeit)
  - `!navi` → **Follower** (Wegpunkt-Vorschläge)
  - Alle anderen Commands → **Everyone** (lesend, kein Missbrauchsrisiko)
  - Berechtigung wird auch aus dem Store gelesen (StreamerTab UI Override möglich)
- **window.__twitch* Globals entfernt**: `window.__twitchSendChat`, `window.__twitchConnect`, `window.__twitchDisconnect` waren ein XSS-Vektor — jeder injected Script konnte Chat senden
  - Stattdessen: Functions werden über `useTwitchStore.getState()._connectFn` etc. geteilt (kein globales Window-Objekt)
  - StreamerTab, ChatOverlay, NavigateTab, useNavTTS aktualisiert
- **TTS Text-Limit**: `!tts` und `!tts-t` prüfen jetzt `maxChars` aus den Einstellungen (Standard: 200 Zeichen)

### 🐛 Bug Fixes
- **Dark Mode: Popups/Overlays fast unlesbar** — KRITISCH: `--popover`, `--card`, `--muted`, `--input`, `--ring`, `--destructive` CSS-Variablen waren nirgends definiert
  - Alle shadcn/ui Popup-Komponenten (DropdownMenu, ContextMenu, Popover, Tooltip, HoverCard, Menubar, Command, etc.) hatten KEIN Background und KEINE Textfarbe → transparent/unsichtbar im Dark Mode
  - Fix: 8 fehlende CSS-Variablen zu ALLEN 5 Themes (twitch/cargo/electric/sunset/pink) × 2 Modi (dark/light) = 10 Sätze hinzugefügt
  - `@theme inline` Block in globals.css: 8 neue `--color-*` Mappings ergänzt
  - Map POI Popups: hardcoded `color:#333` (schwarz auf dunkel) → `color:inherit`, `color:#888` → `var(--color-muted-foreground)`, `border:#e5e5e5` → `var(--color-border)`
  - VotingPanel, ChatOverlay, NavArrow, DriveInfoPanel, MuteButton: `bg-white/5`, `border-white/10`, `text-white` → theme-adaptive Klassen (`bg-foreground/5`, `border-border`, `text-foreground`)
- **Vote-Timer Stale Closure**: Timer las gefangene `newVote` statt aktuellen Store-State → bei vielen Viewern wurden falsche Final-Ergebnisse angezeigt
  - Fix: Timer liest jetzt `useTwitchStore.getState().activeVote` (immer aktueller State)
  - Guard: Wenn Vote bereits inaktiv, wird Timer-Callback übersprungen
- **Command isActive Toggle**: Built-in Commands konnten in der UI deaktiviert werden, wurden aber trotzdem ausgeführt
  - Fix: `handleCommand` prüft jetzt `storeCmd.isActive` vor der Ausführung
- **StreamerTab DEFAULT_COMMANDS**: Nur 5 Commands sichtbar, restliche 14 Built-in Commands unsichtbar
  - Fix: ALLE 18 Built-in Commands jetzt in DEFAULT_COMMANDS (sichtbar, editierbar)

### 🆕 Features
- **18 Built-in Commands im Management-UI**: Alle Commands mit Toggle (AN/AUS), Access-Level, Cooldown, Aliases
  - Info: `!help`, `!commands`, `!version`, `!rank`
  - Navigation: `!position`, `!stats`, `!route`, `!navi`
  - Weather & POI: `!wetter`, `!poi`, `!notfall`, `!sightseeing`, `!camping`, `!ladesaeule`
  - Voting: `!vote`
  - TTS & Translation: `!tts`, `!tts-t`, `!translate`

### Geänderte Dateien (Source)
- `src/App.tsx` — 8 fehlende CSS-Variablen (`--popover`, `--card`, `--muted`, `--input`, `--ring`, `--destructive`, `--destructive-foreground`, `--popover-foreground`, `--card-foreground`) zu allen 5 Themes hinzugefügt
- `src/globals.css` — 8 neue `--color-*` Mappings im `@theme inline` Block + `:root` Defaults
- `src/components/map/MapContainer.tsx` — POI Popup hardcoded Farben → CSS-Variablen
- `src/components/chat/VotingPanel.tsx` — `bg-white/5` → `bg-foreground/5`, `border-white/10` → `border-border`
- `src/components/chat/ChatOverlay.tsx` — hover/bg/border → theme-adaptive Klassen
- `src/components/map/NavArrow.tsx` — `text-white` → `text-foreground`
- `src/components/navigation/DriveInfoPanel.tsx` — `border-white/10` → `border-border`
- `src/components/navigation/MuteButton.tsx` — `hover:bg-white/10` → `hover:bg-foreground/10`
- `src/components/chat/TwitchChatManager.tsx` — Permission System + isActive Check + Vote Timer Fix + TTS Limit + window globals entfernt
- `src/components/sidebar/tabs/StreamerTab.tsx` — 18 DEFAULT_COMMANDS + Zustand-basierte Connect/Disconnect
- `src/store/useTwitchStore.ts` — `_connectFn`, `_disconnectFn`, `_sendChatFn` Fields
- `VERSION` — v3.0.5

## v3.0.4 (2026-04-10)

### Bug Fixes
- **ROOT CAUSE: Instant Crash bei Sucheingabe und Wegpunkt-Auswahl (Komplett-Fix)**
  - Ursache: Nominatim Geocoding API gibt `lat`/`lon` als **Strings** zurück (z.B. `"52.52000"`), nicht als Numbers
  - Der Code speicherte diese Strings direkt als Waypoint-Koordinaten
  - MapLibre GL `.setLngLat([wp.lon, wp.lat])` akzeptierte Strings intern
  - Interner MapLibre-Code rief `.toFixed()` auf den String-Koordinaten auf → **TypeError: t.lat.toFixed is not a function**
  - Ergebnis: Kompletter App-Absturz (White Screen) nach Auswahl eines Suchergebnisses
  - **Fix #1 (RouteTab.tsx)**: `geocode()` parst alle Nominatim-Antworten mit `parseFloat()`
  - **Fix #2 (Store-Level)**: `coerceWaypointNums()` zwingt `lat`/`lon` in `addWaypoint()`, `setWaypoints()`, `updateWaypoint()` zu Numbers — Strings können NIE mehr in den Store gelangen
  - **Fix #3 (MapContainer.tsx)**: `Number()` Koersion bei ALLEN `.setLngLat()` Aufrufen (Wegpunkte, POIs, GPS-Marker)
  - **Fix #4 (MapContainer.tsx)**: `Number()` Koersion bei `fitBounds()` für Route-Geometry
  - **Fix #5 (SkyChart.tsx)**: `Number()` Wrapping bei `.toFixed()` Aufrufen auf Koordinaten
  - **Fix #6 (RouteTab.tsx)**: `Number()` Wrapping bei ALLEN `easeTo()` center-Parametern
  - **Fix #7 (NavigateTab.tsx)**: `Number()` Wrapping bei GPS `easeTo()` Aufrufen
  - **Fix #8 (OBSOverlayPage.tsx)**: `Number()` Wrapping bei GPS `easeTo()` + `contains()` Aufrufen
  - **Fix #9 (TwitchChatManager.tsx)**: `Number()` Wrapping bei `!position` Befehl
  - **Fix #10 (POITab.tsx)**: `Number()` Wrapping bei Overpass BBox-Berechnung
  - **Fix #11 (useNavigationStore.ts)**: `setCurrentPosition()` zwingt lat/lon zu Numbers
- **ErrorBoundary** (v3.0.3): Recovery-UI statt White Screen bei React-Fehlern
- **CORS-Fehler** (v3.0.3): `skipUpdatingEmotesets: true` eliminiert Kraken API Calls

### Geänderte Dateien (Source)
- `src/store/useNavigationStore.ts` — `coerceWaypointNums()` Helper + Number()-Koersion in addWaypoint/setWaypoints/updateWaypoint/setCurrentPosition
- `src/components/map/MapContainer.tsx` — Number() bei allen .setLngLat(), fitBounds(), easeTo() Calls
- `src/components/map/SkyChart.tsx` — Number() bei .toFixed() Calls
- `src/components/sidebar/tabs/RouteTab.tsx` — Number() bei easeTo() Calls
- `src/components/sidebar/tabs/NavigateTab.tsx` — Number() bei easeTo() Calls
- `src/components/overlay/OBSOverlayPage.tsx` — Number() bei easeTo() + contains()
- `src/components/chat/TwitchChatManager.tsx` — Number() bei !position + !version v3.0.4
- `src/components/sidebar/tabs/POITab.tsx` — Number() bei bounds-Berechnung
- `VERSION` — Build-Datum 2026-04-10
- `CHANGELOG.md` — v3.0.4 Sektion aktualisiert

## v3.0.3 (2026-04-09)

### Bug Fixes
- **Command-System komplett kaputt**: Alle Chat-Befehle (!help, !version, !translate, !TTS-T, usw.) funktionierten nicht — keine Bot-Antwort im Chat
  - Ursache: `sendChat()` schluckte alle Fehler still mit `.catch(() => {})` — kein Logging, keine Diagnose möglich
  - Fix: `sendChat()` loggt jetzt Fehler mit Details (Channel, Message, Error)
  - Fix: Diagnostik-Logging an allen Schritten der Command-Pipeline hinzugefügt
- **CORS-Fehler auf Twitch Kraken API**: `api.twitch.tv/kraken/chat/emoticon_images` liefert CORS-Fehler von browser origins (deprecated since 2022)
  - Fix: `skipUpdatingEmotesets: true` in tmi.js Options — eliminiert den Fehler komplett
- **Instant Crash bei Eingabe in Suchfeldern**: App stürzte ab (White Screen) wenn in Suchfelder getippt wurde
  - Fix: ErrorBoundary-Komponente hinzugefügt — zeigt Recovery-UI statt White Screen
  - Fix: Defensive Null-Guards in RouteTab (Waypoint-Sync, Wegpunkt-Rendering) und StreamerTab (Ban-Suche)
- **handleCommandRef.current undefined**: Optionale Chaining `?.` verschluckte Fehler still — nun explizite Null-Prüfung mit Error-Log

### Diagnostik (nur v3.0.3)
- `[TwitchChatManager] Command received:` — zeigt jeden eingehenden Befehl
- `[TwitchChatManager] handleCommand called:` — zeigt Handler-Aufruf mit Cooldown/Ratelimit-Daten
- `[TwitchChatManager] sendChat FAILED:` — zeigt Fehler beim Senden an Twitch
- `[TwitchChatManager] !version handled` / `!help handled` — bestätigt Handler-Ausführung

## v3.0.2 (2026-04-09)

### Bug Fixes (FEHLGESCHLAGEN — siehe v3.0.3)
- `!translate` Command: AbortController Timeout hinzugefügt (falsche Diagnose — API-Timeout war nicht das Problem)
- `!TTS-T` Command: `selectedVoiceLang` Setting hinzugefügt (falsche Diagnose — getVoices() war nicht das Problem)

## v3.0.1 (2026-04-09)

### Features
- Übersetzungs-System: `!translate <Sprache> <Text>`, `!translator`, `!übersetzer`
- TTS mit Übersetzung: `!TTS-T <Text>` — übersetzt und spricht Text in Stimmen-Sprache
- Sprach-Erkennung: 30+ Sprachen (de, en, fr, es, it, pt, nl, pl, ru, ja, zh, ko, ar, tr, sv, cs, da, fi, el, he, hi, th, vi, id, uk, ro, hu, no)
- MyMemory API (kostenlos, kein API-Key nötig)
- `!version` Command für Build-Diagnostik

## v3.0.0 (2026-04-08)

### Initial Release
- React + Vite + TypeScript + Tailwind CSS v4
- MapLibre GL Karten mit OpenStreetMap Tiles
- BRouter Routing (3 Profile: Shortest/Fastest/Safest)
- Twitch Chat Integration via tmi.js
- Chat-Befehle: !wetter, !poi, !navi, !vote, !tts, !stats, !route, !position, !notfall, !rank, !help
- POI-Suche: Ladesäulen, Camping, Sehenswürdigkeiten, Restaurants, Cafés, Supermärkte, Tankstellen, Trinkwasser, Krankenhäuser, Fahrradwerkstätten
- TTS-Sprachausgabe mit Chrome Speech Synthesis
- GPS-Tracking mit Demo-Modus
- Community-Wegpunkte via Twitch Chat
- GPX/KML/TCX Export
- OBS Overlay Sync
- Dark/Light Theme
- Deutsch/Englisch i18n
