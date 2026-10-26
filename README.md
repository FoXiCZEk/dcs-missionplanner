# DCS Mission Planner (Multiplayer Server Ready)

Moderní webový plánovač a editor misí pro **DCS World** multiplayer servery. Umožňuje vizuální plánování misí na mapách **Kavkaz** a **Sýrie**, plnou správu DCS triggerů, psaní Lua skriptů ve vestavěném Monaco IDE a obousměrný import a export do spustitelných `.miz` souborů.

---

## 🚀 Spuštění v Dockeru

Aplikace je připravena pro provoz v Docker kontejneru pomocí multi-stage `Dockerfile` a `docker-compose.yml` s optimalizovaným Nginx serverem a gzip kompresí.

### 1. Spuštění přes Docker Compose (Doporučeno)

```bash
docker compose up -d --build
```

Aplikace bude dostupná v prohlížeči na adrese:
👉 **`http://localhost:8080`**

Pro zastavení kontejneru:
```bash
docker compose down
```

### 2. Spuštění přes standardní Docker CLI

```bash
# Sestavení Docker image
docker build -t dcs-missionplanner .

# Spuštění kontejneru na portu 8080
docker run -d -p 8080:80 --name dcs-missionplanner dcs-missionplanner
```

---

## 💻 Lokální vývoj (bez Dockeru)

Požadavky: Node.js 20+ a npm.

```bash
# Instalace závislostí
npm install

# Spuštění vývojového serveru
npm run dev
```

Aplikace poběží na `http://localhost:5173`.

---

## 🛩️ Klíčové Vlastnosti

1. **Bojiště Kavkaz & Sýrie:**
   - Přepínač bojiště přímo v horní liště.
   - Matematická projekce Transverse Mercator (`tmerc`) pro obě mapy s přesným převodem WGS84 na DCS $x, y$ metry.
   - Databáze všech klíčových letišť (dráhy, TACAN, ILS, nadmořská výška).

2. **DCS Trigger Builder (1:1 s DCS ME):**
   - Typy triggerů: `ONCE`, `MISSION START`, `REPETITIVE`.
   - Podmínky: `FLAG IS TRUE/FALSE`, `FLAG MORE/LESS/EQUALS`, `UNIT IN ZONE`, `PART OF COALITION IN ZONE`, `TIME MORE`, `TIME SINCE FLAG`, `LUA PREDICATE`, `RANDOM`.
   - Akce: `DO SCRIPT`, `DO SCRIPT FILE`, `MESSAGE TO ALL`, `MESSAGE TO COALITION`, `FLAG SET/OFF/INC`, `GROUP ACTIVATE/DEACTIVATE`.

3. **Lua Skriptovací Studio:**
   - Plnohodnotný Monaco Editor (jádro VS Code) s podporou zvýrazňování Lua.
   - Automatické balení skriptů do archivu `.miz` pod `l10n/DEFAULT/<soubor>.lua`.
   - Předpřipravené šablony: *Server Watchdog & Zprávy*, *MIST Stub*, *MOOSE Starter*.

4. **Multiplayer Sloty:**
   - Snadné nastavení slotů `Client` (pro připojení hráčů na server) vs `Player` vs `AI`.
   - Generátor letek na 1 klik (1x, 2x, 4x letouny) na vybraných letištích.

5. **Export & Import `.miz`:**
   - Export 100% validního DCS `.miz` souboru pro okamžité nahrání na dedikovaný DCS server.
   - Možnost nahrát a parsovat existující misi `.miz` ze souborového systému.

6. **In-Cockpit Kneeboard & Flight Card Generator:**
   - Automatické generování grafických letových karet (1024 × 1400 px) pro každou letku v misi.
   - Zahrnuje kompletní navlog (WP, výšky, rychlosti, kurzy, DDM/MGRS), frekvence, TACAN kanály, threat matrix nepřátelské PVO a počasí.
   - Karty jsou automaticky zabaleny do `.miz` pod `Kneeboard/<aircraft_type>/` a v DCS se zobrazují přímo v kokpitu klávesami `[` a `]`.

7. **Živý taktický HUD se souřadnicemi & Bullseye:**
   - Zobrazení souřadnic pod kurzorem v reálném čase:
     - **WGS84** (desítkové stupně)
     - **DDM** (Degrees Decimal Minutes) formátované pro UFC stíhaček F/A-18C a F-16C
     - **MGRS** (Military Grid Reference System) pro A-10C, AH-64D Apache a JTAC
     - **Bullseye (BRAA)** azimut a vzdálenost v NM vůči koaličnímu Bullseye bodu
   - 1-click tlačítko pro zkopírování všech formátů do schránky.

8. **Taktické pravítko (Distance & Bearing Ruler):**
   - Měření vzdálenosti (NM a km) a kurzu (True / Reciprocal Bearing) mezi libovolnými body.
   - Odhadovaný čas letu (ETE) při rychlosti 350 kts.
   - Inteligentní přichytávání (snapping) na letiště, letadla, waypointy a zóny.

9. **1-Click Taktický Spawner (PVO & Tankery/AWACS):**
   - **Kompletní baterie PVO**: Patriot (radary, ECS, EPP, 4x M901), Hawk, Gepard, SA-10 S-300PS (Big Bird, Flap Lid, CP, 4x TEL), SA-11 Buk-M1, SA-15 Tor-M1, 2S6 Tunguska včetně threat rings.
   - **Tankery a AWACS**: KC-135 Boom (25Y TKR), KC-135 MPRS (26Y ARC), KC-130 (27Y SHL), E-3A Sentry, IL-78M, A-50 s automaticky nakonfigurovaným vyčkávacím okruhem (DCS Racetrack Orbit) a TACAN vysílačem.

10. **Loadout & Pylon Editor:**
    - Detailní konfigurace závěsníků pro jednotlivá letadla z rozsáhlého katalogu DCS výzbroje (AIM-120C, AIM-9X, AGM-88C HARM, GBU pumy, Maverick, palivové nádrže atd.).
    - Nastavení množství vnitřního paliva (%), klamných cílů (flares / chaffs) a munice kanónu.
