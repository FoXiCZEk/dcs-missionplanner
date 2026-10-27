import type {
  MissionData,
  Group,
  Unit,
  Waypoint,
  TriggerZone,
  MissionTrigger,
  Theater,
  WeatherSettings,
} from '../types/dcs';
import { latLonToDcs, getTheaterConfig } from './coordinates';
import {
  CARRIER_GROUP_TEMPLATES,
  createCarrierStrikeGroup,
  SAM_BATTERY_TEMPLATES,
  createSamBatteryGroup,
  SUPPORT_FLIGHT_TEMPLATES,
  createSupportFlightGroup,
} from '../data/dcsPresets';
import { AIRCRAFT_LOADOUT_PROFILES, COMMON_WEAPONS } from '../data/dcsWeapons';

export type ScenarioType = 'sead' | 'strike' | 'cas' | 'cap' | 'anti_ship';
export type ScenarioDifficulty = 'easy' | 'medium' | 'hard';
export type ScenarioTimeWeather = 'day_clear' | 'golden_hour' | 'night_nvg' | 'overcast_rain';
export type ScenarioBaseType = 'airfield' | 'carrier';

export interface ScenarioGeneratorOptions {
  type: ScenarioType;
  difficulty: ScenarioDifficulty;
  timeWeather: ScenarioTimeWeather;
  playerAirframe: string;
  playerFlightCount: number; // 1 to 4 client slots
  baseType: ScenarioBaseType;
  theater: Theater;
  mode: 'replace' | 'append';
  customCenterLat?: number;
  customCenterLon?: number;
}

export interface ScenarioPresetDefinition {
  id: ScenarioType;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  defaultAirframes: string[];
  supportsCarrier: boolean;
  recommendedAirframe: string;
}

export const SCENARIO_PRESETS: ScenarioPresetDefinition[] = [
  {
    id: 'sead',
    title: 'SEAD / DEAD (Wild Weasel)',
    tagline: 'Potlačení a zničení nepřátelské raketové PVO',
    description: 'Vyhledejte radarové emise a zničte baterie PVO (SA-11 Buk / S-300 / SA-6) pomocí protiradiolokačních střel AGM-88C HARM / Kh-58 před příchodem hlavního úderného svazu.',
    iconName: 'Crosshair',
    defaultAirframes: ['F/A-18C_hornet', 'F-16C_50', 'Su-25T', 'F-4E-45MC'],
    supportsCarrier: true,
    recommendedAirframe: 'F/A-18C_hornet',
  },
  {
    id: 'strike',
    title: 'STRIKE (Přesný úder / Interdiction)',
    tagline: 'Chirurgický úder na strategické sklady a bunkry',
    description: 'Pronikněte hluboko do nepřátelského prostoru přes hornatý koridor a zničte opevněné velitelství a muniční sklady naváděnou municí GBU-38 JDAM / GBU-12 Paveway II pod ochranou SHORAD.',
    iconName: 'Bomb',
    defaultAirframes: ['F/A-18C_hornet', 'F-16C_50', 'F-15E', 'A-10C_2', 'Su-27'],
    supportsCarrier: true,
    recommendedAirframe: 'F-16C_50',
  },
  {
    id: 'cas',
    title: 'CAS (Blízká palebná podpora / Danger Close)',
    tagline: 'Ochrana přátelské mechanizované linie pod vedením JTAC',
    description: 'Vstupte do vyčkávacího okruhu, navažte spojení s předsunutým návodčím JTAC (Playboy 1-1 na 133.000 MHz) a zničte nepřátelskou obrněnou kolonu (T-72 / BMP-3) pomocí raket Maverick a kanónu GAU-8.',
    iconName: 'ShieldAlert',
    defaultAirframes: ['A-10C_2', 'AV8BNA', 'AH-64D_BLK_II', 'Su-25T', 'F/A-18C_hornet'],
    supportsCarrier: true,
    recommendedAirframe: 'A-10C_2',
  },
  {
    id: 'cap',
    title: 'CAP / Intercept (Bojové vzdušné hlídkování)',
    tagline: 'Vybojování vzdušné nadvlády a záchyt bombardérů BVR',
    description: 'Ostrý vzlet (Hot Scramble), vyčkávání na hlídkové trase a záchyt nepřátelské úderné formace (Su-24 / Tu-22M3 s doprovodem stíhačů) na pokyn střediska AWACS Magic 1-1.',
    iconName: 'PlaneTakeoff',
    defaultAirframes: ['F/A-18C_hornet', 'F-14B', 'F-16C_50', 'M-2000C', 'Su-27'],
    supportsCarrier: true,
    recommendedAirframe: 'F-14B',
  },
  {
    id: 'anti_ship',
    title: 'ASuW (Protilodní úder na námořní svaz)',
    tagline: 'Nízkoletmé přiblížení a salvový úder střelami Harpoon',
    description: 'Vzlet z letadlové lodi nebo pobřeží, nízkoletmý průnik (50 ft Sea-Skim) pod radiolokačním horizontem a odpal protilodních střel AGM-84D Harpoon na křižník Moskva a doprovodné korvety.',
    iconName: 'Anchor',
    defaultAirframes: ['F/A-18C_hornet', 'AJS37', 'F-16C_50', 'Su-33'],
    supportsCarrier: true,
    recommendedAirframe: 'F/A-18C_hornet',
  },
];

/**
 * Returns weather settings based on chosen preset
 */
function getWeatherSettings(timeWeather: ScenarioTimeWeather): {
  weather: WeatherSettings;
  startTime: number;
} {
  switch (timeWeather) {
    case 'golden_hour':
      return {
        startTime: 66600, // 18:30 (Golden Hour / Sunset)
        weather: {
          atmosphere_type: 0,
          wind: {
            atGround: { speed: 4, dir: 270 },
            at2000: { speed: 8, dir: 280 },
            at8000: { speed: 18, dir: 290 },
          },
          season: { temperature: 18 },
          clouds: { thickness: 800, density: 3, base: 2800, iprecptns: 0 },
          visibility: { distance: 60000 },
          qnh: 760,
        },
      };
    case 'night_nvg':
      return {
        startTime: 82800, // 23:00 (Night NVG / FLIR operations)
        weather: {
          atmosphere_type: 0,
          wind: {
            atGround: { speed: 2, dir: 240 },
            at2000: { speed: 5, dir: 250 },
            at8000: { speed: 12, dir: 260 },
          },
          season: { temperature: 12 },
          clouds: { thickness: 500, density: 1, base: 3500, iprecptns: 0 },
          visibility: { distance: 70000 },
          qnh: 762,
        },
      };
    case 'overcast_rain':
      return {
        startTime: 32400, // 09:00 (Heavy overcast, rain, low clouds)
        weather: {
          atmosphere_type: 0,
          wind: {
            atGround: { speed: 7, dir: 290 },
            at2000: { speed: 14, dir: 300 },
            at8000: { speed: 26, dir: 310 },
          },
          season: { temperature: 14 },
          clouds: { thickness: 1600, density: 7, base: 1100, iprecptns: 1 }, // Rain
          visibility: { distance: 15000 },
          qnh: 752,
        },
      };
    case 'day_clear':
    default:
      return {
        startTime: 36000, // 10:00 (Clear day)
        weather: {
          atmosphere_type: 0,
          wind: {
            atGround: { speed: 3, dir: 260 },
            at2000: { speed: 6, dir: 270 },
            at8000: { speed: 15, dir: 280 },
          },
          season: { temperature: 22 },
          clouds: { thickness: 600, density: 1, base: 3200, iprecptns: 0 },
          visibility: { distance: 80000 },
          qnh: 760,
        },
      };
  }
}

/**
 * Returns theater-specific geographic centers for default scenario generation
 */
function getTheaterScenarioPoints(theater: Theater, type: ScenarioType) {
  if (theater === 'Syria') {
    if (type === 'anti_ship') {
      return {
        baseAirfield: { name: 'RAF Akrotiri', lat: 34.590, lon: 32.988 },
        carrierPoint: { lat: 34.800, lon: 34.200 },
        targetPoint: { lat: 35.450, lon: 35.150 }, // Offshore Latakia
        holdingPoint: { lat: 35.100, lon: 34.600 },
      };
    }
    return {
      baseAirfield: { name: 'Incirlik Air Base', lat: 37.002, lon: 35.426 },
      carrierPoint: { lat: 35.200, lon: 34.800 },
      targetPoint: { lat: 35.250, lon: 36.850 }, // Hama / East Idlib corridor
      holdingPoint: { lat: 36.100, lon: 36.300 },
    };
  }

  // Caucasus default
  if (type === 'anti_ship') {
    return {
      baseAirfield: { name: 'Kobuleti', lat: 41.859, lon: 41.866 },
      carrierPoint: { lat: 42.150, lon: 40.800 },
      targetPoint: { lat: 43.150, lon: 40.100 }, // Black sea off Gudauta/Sukhumi
      holdingPoint: { lat: 42.500, lon: 40.500 },
    };
  }

  return {
    baseAirfield: { name: 'Senaki-Kolkhi', lat: 42.238, lon: 42.048 },
    carrierPoint: { lat: 42.200, lon: 40.900 },
    targetPoint: { lat: 43.100, lon: 40.800 }, // Gudauta / Kodori Gorge area
    holdingPoint: { lat: 42.600, lon: 41.500 },
  };
}

/**
 * Generates appropriate payload for player aircraft matching scenario archetype
 */
function getPlayerPylons(airframe: string, scenarioType: ScenarioType): Record<number, { clsid: string }> {
  const profile = AIRCRAFT_LOADOUT_PROFILES[airframe];
  if (!profile) {
    return {
      1: { clsid: COMMON_WEAPONS.AIM_9X.clsid },
      2: { clsid: COMMON_WEAPONS.AIM_120C.clsid },
      3: { clsid: COMMON_WEAPONS.GBU_12.clsid },
    };
  }

  // Search for ideal preset in profile
  let targetPresetId = 'cap';
  if (scenarioType === 'sead') targetPresetId = 'sead';
  else if (scenarioType === 'strike') targetPresetId = 'strike';
  else if (scenarioType === 'cas') targetPresetId = 'cas';
  else if (scenarioType === 'anti_ship') targetPresetId = 'anti_ship';
  else targetPresetId = 'cap';

  let foundPreset = profile.presets.find((p) => p.id === targetPresetId);
  if (!foundPreset) {
    foundPreset = profile.presets[0];
  }

  const result: Record<number, { clsid: string }> = {};
  if (foundPreset) {
    Object.entries(foundPreset.pylons).forEach(([st, wp]) => {
      if (wp && wp.clsid !== '<CLEAN>') {
        result[Number(st)] = { clsid: wp.clsid };
      }
    });
  }
  return result;
}

/**
 * Master generator function for full automated tactical scenarios
 */
export function generateTacticalScenario(
  options: ScenarioGeneratorOptions,
  currentMissionData?: MissionData
): MissionData {
  const theater = options.theater || 'Caucasus';
  const theaterPoints = getTheaterScenarioPoints(theater, options.type);
  const weatherSetup = getWeatherSettings(options.timeWeather);

  // Target Location
  const targetLat = options.customCenterLat || theaterPoints.targetPoint.lat;
  const targetLon = options.customCenterLon || theaterPoints.targetPoint.lon;
  const targetDcs = latLonToDcs(theater, targetLat, targetLon);

  // Base Location: Carrier at sea or Airfield
  const isCarrierBase = options.baseType === 'carrier';
  const departureLat = isCarrierBase ? theaterPoints.carrierPoint.lat : theaterPoints.baseAirfield.lat;
  const departureLon = isCarrierBase ? theaterPoints.carrierPoint.lon : theaterPoints.baseAirfield.lon;
  const departureDcs = latLonToDcs(theater, departureLat, departureLon);

  let currentGroupId = options.mode === 'append' && currentMissionData ? currentMissionData.nextId.groupId : 1;
  let currentUnitId = options.mode === 'append' && currentMissionData ? currentMissionData.nextId.unitId : 1;
  let currentZoneId = options.mode === 'append' && currentMissionData ? currentMissionData.nextId.zoneId : 1;

  const generatedGroups: Group[] = [];
  const generatedZones: TriggerZone[] = [];
  const generatedTriggers: MissionTrigger[] = [];

  // ==========================================
  // 1. CARRIER STRIKE GROUP (IF CARRIER BASE)
  // ==========================================
  let carrierGroup: Group | null = null;
  if (isCarrierBase) {
    const carrierTemplate = CARRIER_GROUP_TEMPLATES.find((t) => t.id === 'cvn71_roosevelt_csg') || CARRIER_GROUP_TEMPLATES[0];
    const carrierBrc = (weatherSetup.weather.wind.atGround.dir + 180) % 360;
    const csgResult = createCarrierStrikeGroup(
      carrierTemplate,
      theater,
      departureLat,
      departureLon,
      carrierBrc,
      currentGroupId,
      currentUnitId
    );
    carrierGroup = csgResult.carrierGroup;
    generatedGroups.push(carrierGroup);
    if (csgResult.rescueHeliGroup) {
      generatedGroups.push(csgResult.rescueHeliGroup);
    }
    currentGroupId += csgResult.totalGroupsCount;
    currentUnitId += csgResult.totalUnitsCount;
  }

  // ==========================================
  // 2. TARGET FORCE GENERATION (RED)
  // ==========================================
  if (options.type === 'sead') {
    // SEAD: SAM Radar Battery + Point Defense
    const samTemplateId =
      options.difficulty === 'hard'
        ? 'sa10_s300_site'
        : options.difficulty === 'medium'
        ? 'sa11_buk_battery'
        : 'sa15_tor_platoon';
    const samTemplate = SAM_BATTERY_TEMPLATES.find((t) => t.id === samTemplateId) || SAM_BATTERY_TEMPLATES[1];

    const samGroup = createSamBatteryGroup(
      samTemplate,
      theater,
      targetLat,
      targetLon,
      currentGroupId++,
      currentUnitId
    );
    currentUnitId += samGroup.units.length;
    generatedGroups.push(samGroup);

    // Optional SHORAD / Flak defense
    if (options.difficulty !== 'easy') {
      const shoradUnit: Unit = {
        unitId: currentUnitId++,
        name: `ZSU-23-4 Shilka Point Defense #${currentUnitId}`,
        type: 'ZSU-23-4 Shilka',
        skill: 'Excellent',
        heading: 0,
        x: targetDcs.x + 120,
        y: targetDcs.y - 80,
        lat: targetLat + 0.001,
        lon: targetLon - 0.001,
        alt: 0,
      };
      generatedGroups.push({
        groupId: currentGroupId++,
        name: `Airfield Point Defense (ZSU-23-4) #${currentGroupId}`,
        category: 'vehicle',
        coalition: 'red',
        countryId: 0,
        countryName: 'Russia',
        units: [shoradUnit],
        route: { points: [{ id: 1, x: targetDcs.x + 120, y: targetDcs.y - 80, lat: targetLat + 0.001, lon: targetLon - 0.001, alt: 0, speed: 0, action: 'Off Road', type: 'Turning Point' }] },
      });
    }
  } else if (options.type === 'strike') {
    // STRIKE: Ammunition Depot & Command HQ with Shilka & BMP defense
    const depotUnits: Unit[] = [
      {
        unitId: currentUnitId++,
        name: `SA-10 Command Post 54K6 (Primary HQ) #${currentUnitId}`,
        type: 'SA-10 S-300PS 54K6',
        skill: 'Excellent',
        heading: 0,
        x: targetDcs.x,
        y: targetDcs.y,
        lat: targetLat,
        lon: targetLon,
        alt: 0,
      },
      {
        unitId: currentUnitId++,
        name: `ZSU-23-4 Shilka AA Flak #${currentUnitId}`,
        type: 'ZSU-23-4 Shilka',
        skill: 'High',
        heading: 1.5,
        x: targetDcs.x + 60,
        y: targetDcs.y + 40,
        lat: targetLat + 0.0005,
        lon: targetLon + 0.0006,
        alt: 0,
      },
      {
        unitId: currentUnitId++,
        name: `SA-15 Tor SHORAD #${currentUnitId}`,
        type: 'SA-15 Tor 9A331',
        skill: 'High',
        heading: 3.1,
        x: targetDcs.x - 70,
        y: targetDcs.y - 30,
        lat: targetLat - 0.0006,
        lon: targetLon - 0.0004,
        alt: 0,
      },
      {
        unitId: currentUnitId++,
        name: `BMP-3 Armored Guard #${currentUnitId}`,
        type: 'BMP-3',
        skill: 'Average',
        heading: 4.2,
        x: targetDcs.x + 20,
        y: targetDcs.y - 80,
        lat: targetLat + 0.0002,
        lon: targetLon - 0.001,
        alt: 0,
      },
    ];

    generatedGroups.push({
      groupId: currentGroupId++,
      name: `Target Facility - Ammunition & Command Depot #${currentGroupId}`,
      category: 'vehicle',
      coalition: 'red',
      countryId: 0,
      countryName: 'Russia',
      units: depotUnits,
      route: { points: [{ id: 1, x: targetDcs.x, y: targetDcs.y, lat: targetLat, lon: targetLon, alt: 0, speed: 0, action: 'Off Road', type: 'Turning Point' }] },
    });
  } else if (options.type === 'cas') {
    // CAS: Friendly Frontline Platoon + Enemy Mechanized Column in Contact
    // 1. Friendly Platoon (Blue)
    const friendlyLat = targetLat - 0.025; // 2.5 km South
    const friendlyLon = targetLon;
    const friendlyDcs = latLonToDcs(theater, friendlyLat, friendlyLon);

    const friendlyUnits: Unit[] = [
      { unitId: currentUnitId++, name: 'M1A2 Abrams (Lead) #1', type: 'M-1 Abrams', skill: 'Excellent', heading: 0, x: friendlyDcs.x, y: friendlyDcs.y, lat: friendlyLat, lon: friendlyLon, alt: 0 },
      { unitId: currentUnitId++, name: 'M1A2 Abrams #2', type: 'M-1 Abrams', skill: 'High', heading: 0, x: friendlyDcs.x - 20, y: friendlyDcs.y + 40, lat: friendlyLat, lon: friendlyLon + 0.0005, alt: 0 },
      { unitId: currentUnitId++, name: 'M2A2 Bradley IFV #1', type: 'M2A2 Bradley', skill: 'High', heading: 0, x: friendlyDcs.x - 30, y: friendlyDcs.y - 40, lat: friendlyLat, lon: friendlyLon - 0.0005, alt: 0 },
    ];

    generatedGroups.push({
      groupId: currentGroupId++,
      name: `Friendly Platoon Alpha (FLOT Frontline) #${currentGroupId}`,
      category: 'vehicle',
      coalition: 'blue',
      countryId: 2,
      countryName: 'USA',
      units: friendlyUnits,
      route: { points: [{ id: 1, x: friendlyDcs.x, y: friendlyDcs.y, lat: friendlyLat, lon: friendlyLon, alt: 0, speed: 0, action: 'Off Road', type: 'Turning Point' }] },
    });

    // 2. Enemy Mechanized Column (Red)
    const enemyUnits: Unit[] = [
      { unitId: currentUnitId++, name: 'T-72B MBT Lead #1', type: 'T-72B', skill: 'High', heading: 3.14, x: targetDcs.x, y: targetDcs.y, lat: targetLat, lon: targetLon, alt: 0 },
      { unitId: currentUnitId++, name: 'T-72B MBT #2', type: 'T-72B', skill: 'Average', heading: 3.14, x: targetDcs.x + 30, y: targetDcs.y + 30, lat: targetLat + 0.0003, lon: targetLon + 0.0004, alt: 0 },
      { unitId: currentUnitId++, name: 'BMP-3 IFV #1', type: 'BMP-3', skill: 'Average', heading: 3.14, x: targetDcs.x - 20, y: targetDcs.y - 40, lat: targetLat - 0.0002, lon: targetLon - 0.0005, alt: 0 },
      { unitId: currentUnitId++, name: 'ZSU-23-4 Shilka Flak', type: 'ZSU-23-4 Shilka', skill: 'High', heading: 3.14, x: targetDcs.x + 80, y: targetDcs.y - 30, lat: targetLat + 0.0007, lon: targetLon - 0.0004, alt: 0 },
    ];

    generatedGroups.push({
      groupId: currentGroupId++,
      name: `Hostile Mechanized Column (Contact) #${currentGroupId}`,
      category: 'vehicle',
      coalition: 'red',
      countryId: 0,
      countryName: 'Russia',
      units: enemyUnits,
      route: { points: [{ id: 1, x: targetDcs.x, y: targetDcs.y, lat: targetLat, lon: targetLon, alt: 0, speed: 0, action: 'Off Road', type: 'Turning Point' }] },
    });
  } else if (options.type === 'cap') {
    // CAP: Inbound Hostile Strike & Fighter Sweep (Red)
    const redSpawnLat = targetLat + 0.45; // 50 km North
    const redSpawnLon = targetLon + 0.2;
    const redSpawnDcs = latLonToDcs(theater, redSpawnLat, redSpawnLon);

    const redFlightUnits: Unit[] = [
      {
        unitId: currentUnitId++,
        name: `Hostile Strike Lead (Su-27 Flanker) #${currentUnitId}`,
        type: 'Su-27',
        skill: options.difficulty === 'hard' ? 'Excellent' : 'High',
        heading: 3.6, // South-West towards Blue base
        x: redSpawnDcs.x,
        y: redSpawnDcs.y,
        lat: redSpawnLat,
        lon: redSpawnLon,
        alt: 8500, // FL280
        speed: 250, // ~500 kts
      },
      {
        unitId: currentUnitId++,
        name: `Hostile Wingman (Su-27 Flanker) #${currentUnitId}`,
        type: 'Su-27',
        skill: options.difficulty === 'hard' ? 'High' : 'Good',
        heading: 3.6,
        x: redSpawnDcs.x - 300,
        y: redSpawnDcs.y - 300,
        lat: redSpawnLat - 0.002,
        lon: redSpawnLon - 0.003,
        alt: 8500,
        speed: 250,
      },
    ];

    generatedGroups.push({
      groupId: currentGroupId++,
      name: `Hostile Fighter Sweep (2x Su-27) #${currentGroupId}`,
      category: 'plane',
      coalition: 'red',
      countryId: 0,
      countryName: 'Russia',
      units: redFlightUnits,
      route: {
        points: [
          { id: 1, name: 'WP 1 - Ingress Strike', x: redSpawnDcs.x, y: redSpawnDcs.y, lat: redSpawnLat, lon: redSpawnLon, alt: 8500, speed: 250, action: 'Turning Point', type: 'Turning Point' },
          { id: 2, name: 'WP 2 - Attack Corridor', x: targetDcs.x, y: targetDcs.y, lat: targetLat, lon: targetLon, alt: 7000, speed: 260, action: 'Turning Point', type: 'Turning Point' },
        ],
      },
    });
  } else if (options.type === 'anti_ship') {
    // ASuW: Enemy Surface Action Group (Moskva Cruiser + Escort Corvettes)
    const shipUnits: Unit[] = [
      {
        unitId: currentUnitId++,
        name: 'Moskva Slava-class Cruiser (Flagship)',
        type: 'MOSKVA',
        skill: 'Excellent',
        heading: 4.71, // West (270°)
        x: targetDcs.x,
        y: targetDcs.y,
        lat: targetLat,
        lon: targetLon,
        alt: 0,
        speed: 10,
      },
      {
        unitId: currentUnitId++,
        name: 'Neustrashimy-class Frigate (Escort)',
        type: 'NEUSTRASH',
        skill: 'High',
        heading: 4.71,
        x: targetDcs.x + 1200,
        y: targetDcs.y + 800,
        lat: targetLat + 0.01,
        lon: targetLon + 0.01,
        alt: 0,
        speed: 10,
      },
      {
        unitId: currentUnitId++,
        name: 'Grisha Albatros Corvette (Picket)',
        type: 'ALBATROS',
        skill: 'Good',
        heading: 4.71,
        x: targetDcs.x - 1000,
        y: targetDcs.y - 1200,
        lat: targetLat - 0.009,
        lon: targetLon - 0.015,
        alt: 0,
        speed: 10,
      },
    ];

    generatedGroups.push({
      groupId: currentGroupId++,
      name: `Hostile Surface Action Group (Moskva SAG) #${currentGroupId}`,
      category: 'ship',
      coalition: 'red',
      countryId: 0,
      countryName: 'Russia',
      units: shipUnits,
      route: {
        points: [
          { id: 1, name: 'WP 1 - SAG Anchor', x: targetDcs.x, y: targetDcs.y, lat: targetLat, lon: targetLon, alt: 0, speed: 10, action: 'Turning Point', type: 'Turning Point' },
          { id: 2, name: 'WP 2 - Patrol Leg (40 NM)', x: targetDcs.x - 50000, y: targetDcs.y, lat: targetLat - 0.45, lon: targetLon, alt: 0, speed: 10, action: 'Turning Point', type: 'Turning Point' },
        ],
      },
    });
  }

  // ==========================================
  // 3. SUPPORT FLIGHTS (AWACS & TANKER)
  // ==========================================
  // AWACS Orbit (E-3A Sentry Magic 1-1)
  const awacsLat = departureLat + (targetLat - departureLat) * 0.25;
  const awacsLon = departureLon + 0.15;
  const awacsTemplate = SUPPORT_FLIGHT_TEMPLATES.find((t) => t.role === 'awacs') || SUPPORT_FLIGHT_TEMPLATES[3];
  const awacsGroup = createSupportFlightGroup(
    awacsTemplate,
    theater,
    awacsLat,
    awacsLon,
    currentGroupId++,
    currentUnitId++
  );
  generatedGroups.push(awacsGroup);

  // Tanker Orbit (Texaco 1-1 / Arco 1-1)
  const isNavyJet = options.playerAirframe.includes('18') || options.playerAirframe.includes('14') || options.playerAirframe.includes('AV8B');
  const tankerTemplateId = isNavyJet ? 'kc135_mprs' : 'kc135_boom';
  const tankerTemplate = SUPPORT_FLIGHT_TEMPLATES.find((t) => t.id === tankerTemplateId) || SUPPORT_FLIGHT_TEMPLATES[0];
  const tankerLat = departureLat + (targetLat - departureLat) * 0.15;
  const tankerLon = departureLon - 0.1;
  const tankerGroup = createSupportFlightGroup(
    tankerTemplate,
    theater,
    tankerLat,
    tankerLon,
    currentGroupId++,
    currentUnitId++
  );
  generatedGroups.push(tankerGroup);

  // ==========================================
  // 4. PLAYER FLIGHT GENERATION (BLUE)
  // ==========================================
  const playerUnits: Unit[] = [];
  const flightSize = Math.max(1, Math.min(4, options.playerFlightCount));
  const flightName = `Chevy 1 (${options.type.toUpperCase()})`;
  const pylonLoadout = getPlayerPylons(options.playerAirframe, options.type);

  for (let i = 0; i < flightSize; i++) {
    const uLat = departureLat - i * 0.0006;
    const uLon = departureLon - i * 0.0008;
    const uDcs = latLonToDcs(theater, uLat, uLon);

    playerUnits.push({
      unitId: currentUnitId++,
      name: `Chevy 1-${i + 1} (${options.playerAirframe})`,
      type: options.playerAirframe,
      skill: 'Client', // Ready for Multiplayer Coop!
      heading: 1.57, // East
      x: uDcs.x,
      y: uDcs.y,
      lat: uLat,
      lon: uLon,
      alt: isCarrierBase ? 20 : 2500, // On deck or runway
      speed: isCarrierBase ? 0 : 220,
      callsign: {
        [1]: 1,
        [2]: 1,
        [3]: i + 1,
        name: `Chevy 1-${i + 1}`,
      },
      radio: {
        frequency: 305000000, // 305.000 MHz (AM)
        modulation: 0,
      },
      payload: {
        pylons: pylonLoadout,
        fuel: 4900,
        flare: 60,
        chaff: 60,
        gun: 100,
      },
    });
  }

  // Construct Realistic Flight Plan (Waypoints)
  const pushLat = departureLat + (targetLat - departureLat) * 0.6;
  const pushLon = departureLon + (targetLon - departureLon) * 0.6;
  const pushDcs = latLonToDcs(theater, pushLat, pushLon);

  const ingressLat = departureLat + (targetLat - departureLat) * 0.85;
  const ingressLon = departureLon + (targetLon - departureLon) * 0.85;
  const ingressDcs = latLonToDcs(theater, ingressLat, ingressLon);

  // Egress offset to flank away safely
  const egressLat = targetLat - 0.12;
  const egressLon = targetLon + 0.18;
  const egressDcs = latLonToDcs(theater, egressLat, egressLon);

  const playerWaypoints: Waypoint[] = [
    {
      id: 1,
      name: isCarrierBase ? 'WP 1 - Catapult Launch (CVN-71)' : 'WP 1 - Takeoff & Departure',
      x: departureDcs.x,
      y: departureDcs.y,
      lat: departureLat,
      lon: departureLon,
      alt: isCarrierBase ? 30 : 500,
      speed: 180,
      action: 'Turning Point',
      type: 'Turning Point',
    },
    {
      id: 2,
      name: 'WP 2 - PUSH POINT (Fence-In)',
      x: pushDcs.x,
      y: pushDcs.y,
      lat: pushLat,
      lon: pushLon,
      alt: options.type === 'anti_ship' ? 100 : 7500, // 24,000 ft or Sea Skim
      speed: 230,
      action: 'Turning Point',
      type: 'Turning Point',
    },
    {
      id: 3,
      name: options.type === 'cas' ? 'WP 3 - THE WHEEL (JTAC Orbit)' : 'WP 3 - INGRESS / STRIKE AXIS',
      x: ingressDcs.x,
      y: ingressDcs.y,
      lat: ingressLat,
      lon: ingressLon,
      alt: options.type === 'cas' ? 4000 : options.type === 'anti_ship' ? 30 : 6500,
      speed: 220,
      action: 'Turning Point',
      type: 'Turning Point',
    },
    {
      id: 4,
      name: `WP 4 - TARGET (${options.type.toUpperCase()} OBJECTIVE)`,
      x: targetDcs.x,
      y: targetDcs.y,
      lat: targetLat,
      lon: targetLon,
      alt: options.type === 'anti_ship' ? 300 : options.type === 'sead' ? 7500 : 4500,
      speed: 250,
      action: 'Turning Point',
      type: 'Turning Point',
      task: {
        id: 'ComboTask',
        params: {
          tasks: [
            {
              id: 'WrappedAction',
              params: {
                action: {
                  id: 'Option',
                  params: {
                    name: 1,
                    value: 2, // ROE: Open Fire
                  },
                },
              },
            },
          ],
        },
      },
    },
    {
      id: 5,
      name: 'WP 5 - EGRESS (Fence-Out)',
      x: egressDcs.x,
      y: egressDcs.y,
      lat: egressLat,
      lon: egressLon,
      alt: 5000,
      speed: 240,
      action: 'Turning Point',
      type: 'Turning Point',
    },
    {
      id: 6,
      name: isCarrierBase ? 'WP 6 - RECOVERY (Case I/III Trap)' : 'WP 6 - RTB / Airbase Approach',
      x: departureDcs.x,
      y: departureDcs.y,
      lat: departureLat,
      lon: departureLon,
      alt: 600,
      speed: 150,
      action: 'Land',
      type: 'Land',
    },
  ];

  const playerGroup: Group = {
    groupId: currentGroupId++,
    name: flightName,
    category: 'plane',
    coalition: 'blue',
    countryId: 2, // USA
    countryName: 'USA',
    units: playerUnits,
    route: {
      points: playerWaypoints,
    },
  };
  generatedGroups.push(playerGroup);

  // ==========================================
  // 5. TRIGGER ZONES & TACTICAL TRIGGERS
  // ==========================================
  // Target Zone
  const targetZone: TriggerZone = {
    zoneId: currentZoneId++,
    name: `ZONE // TARGET AREA (${options.type.toUpperCase()})`,
    x: targetDcs.x,
    y: targetDcs.y,
    lat: targetLat,
    lon: targetLon,
    radius: options.type === 'sead' ? 18000 : options.type === 'anti_ship' ? 25000 : 5000,
    color: [0.95, 0.2, 0.2, 0.25], // Semi-transparent Red
    type: 0,
  };
  generatedZones.push(targetZone);

  // Ingress Push Zone
  const pushZone: TriggerZone = {
    zoneId: currentZoneId++,
    name: 'ZONE // PUSH POINT (FENCE-IN)',
    x: pushDcs.x,
    y: pushDcs.y,
    lat: pushLat,
    lon: pushLon,
    radius: 8000,
    color: [0.2, 0.6, 0.95, 0.2], // Sky blue
    type: 0,
  };
  generatedZones.push(pushZone);

  // Trigger 1: Mission Start Audio / Briefing Alert
  const briefingMsg = `[MAGIC AWACS 255.000 MHz]: Chevy 1 flight, you are cleared for Operation ${options.type.toUpperCase()}. Push WP 2 when ready. Tanker Texaco at 251.000 MHz (TCN 25Y). Good hunting!`;
  generatedTriggers.push({
    id: `trigger_start_${Date.now()}`,
    name: '01 - Mission Start Briefing Broadcast',
    type: 'MISSION START',
    event: 'NONE',
    enabled: true,
    conditions: [{ id: 'cond_start', type: 'TIME_MORE', seconds: 3 }],
    actions: [
      { id: 'act_msg', type: 'MESSAGE_TO_COALITION', message: briefingMsg, duration: 25, coalition: 'blue' },
      { id: 'act_flag', type: 'FLAG_SET', flag: '1', value: 1 },
    ],
  });

  // Trigger 2: Ingress Warning inside Threat Zone
  generatedTriggers.push({
    id: `trigger_ingress_${Date.now()}`,
    name: '02 - Fence-In Threat Envelope Warning',
    type: 'ONCE',
    event: 'NONE',
    enabled: true,
    conditions: [
      { id: 'cond_zone', type: 'PART_OF_COALITION_IN_ZONE', coalition: 'blue', zone: targetZone.name },
    ],
    actions: [
      {
        id: 'act_warning',
        type: 'MESSAGE_TO_COALITION',
        message: `[MAGIC AWACS]: Chevy 1, you are inside the hostile engagement zone! Keep RWR monitored and weapons hot.`,
        duration: 15,
        coalition: 'blue',
      },
    ],
  });

  // ==========================================
  // 6. BUILD FINAL MISSION DATA & BRIEFINGS
  // ==========================================
  const theaterCfg = getTheaterConfig(theater);
  const scenarioTitle = `OP ${options.type.toUpperCase()} // ${theaterCfg.displayName.toUpperCase()}`;

  const missionBriefing = `TACTICAL OPERATION ORDER: ${scenarioTitle}
======================================================
1. SITUATION:
Enemy forces have established fortified positions in the area of operations. Coalition command has authorized an immediate tactical ${options.type.toUpperCase()} strike.

2. MISSION:
Flight: ${flightName} (${flightSize}x ${options.playerAirframe})
Objective: Ingress to WP 4, eliminate designated hostile targets, and safely RTB.

3. SUPPORT ASSETS:
• AWACS: Magic 1-1 | 255.000 MHz (AM) | FL280
• TANKER: ${tankerTemplate.callsignName} | ${(tankerTemplate.frequencyHz / 1000000).toFixed(3)} MHz | TACAN: ${tankerTemplate.tacan?.channel || 25}${tankerTemplate.tacan?.mode || 'Y'}
${carrierGroup ? `• CARRIER: CVN-71 Roosevelt | TACAN: 71X | ICLS: Ch 11 | LNK4: 336.000 MHz | TWR: 127.500 MHz` : `• DEPARTURE BASE: ${theaterPoints.baseAirfield.name}`}

4. EXECUTION:
• WP 1: Departure & Climb
• WP 2: Fence-In / Master Arm ON
• WP 3: Ingress / Target Acquisition
• WP 4: Weapon Release & Target Elimination
• WP 5: Fence-Out / Egress
• WP 6: Recovery`;

  if (options.mode === 'append' && currentMissionData) {
    return {
      ...currentMissionData,
      groups: [...currentMissionData.groups, ...generatedGroups],
      zones: [...currentMissionData.zones, ...generatedZones],
      triggers: [...currentMissionData.triggers, ...generatedTriggers],
      nextId: {
        groupId: currentGroupId,
        unitId: currentUnitId,
        zoneId: currentZoneId,
      },
    };
  }

  return {
    theatre: theater,
    title: scenarioTitle,
    description: missionBriefing,
    descriptionBlue: missionBriefing,
    descriptionRed: 'Defend territorial airspace against incoming Coalition air strike.',
    date: { year: 2026, month: 6, day: 15 },
    startTime: weatherSetup.startTime,
    weather: weatherSetup.weather,
    zones: generatedZones,
    triggers: generatedTriggers,
    groups: generatedGroups,
    scriptFiles: [],
    nextId: {
      groupId: currentGroupId,
      unitId: currentUnitId,
      zoneId: currentZoneId,
    },
  };
}
