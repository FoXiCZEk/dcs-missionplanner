import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type {
  MissionData,
  Theater,
  Group,
  Unit,
  Waypoint,
  TriggerZone,
  MissionTrigger,
  MissionScriptFile,
  CoalitionType,
  UnitCategory,
} from '../types/dcs';
import { serializeNamedLuaTable } from './dcsLuaSerializer';
import { parseLuaTable } from './dcsLuaParser';
import { dcsToLatLon, latLonToDcs } from './coordinates';
import { packAllKneeboardsIntoZip } from './kneeboardGenerator';

/**
 * Creates default initial mission data
 */
export function createDefaultMission(theater: Theater = 'Caucasus'): MissionData {
  const isCaucasus = theater === 'Caucasus';

  // Default Player / Client slot (e.g. F/A-18C Hornet or F-16C ready for multiplayer)
  const defaultUnitLatLon = isCaucasus ? { lat: 42.238, lon: 42.048 } : { lat: 37.002, lon: 35.426 }; // Senaki or Incirlik
  const defaultUnitDcs = latLonToDcs(theater, defaultUnitLatLon.lat, defaultUnitLatLon.lon);

  const defaultGroup: Group = {
    groupId: 1,
    name: 'Chevy 1 (CAP)',
    category: 'plane',
    coalition: 'blue',
    countryId: 2, // USA
    countryName: 'USA',
    units: [
      {
        unitId: 1,
        name: 'Chevy 1-1',
        type: 'F/A-18C_hornet',
        skill: 'Client', // Multiplayer slot!
        heading: 1.57, // East
        x: defaultUnitDcs.x,
        y: defaultUnitDcs.y,
        lat: defaultUnitLatLon.lat,
        lon: defaultUnitLatLon.lon,
        alt: 2500,
        speed: 220,
        callsign: {
          [1]: 1,
          [2]: 1,
          [3]: 1,
          name: 'Chevy 1-1',
        },
        radio: {
          frequency: 305000000,
          modulation: 0,
        },
        payload: {
          pylons: {
            1: { clsid: '{4B26C8D7-E7A9-4A7B-9D06-03F678E20E2F}' },
            2: { clsid: '{AIM-120C}' },
            3: { clsid: '{AIM-120C}' },
            4: { clsid: '{ATFLIR}' },
            5: { clsid: '{FPU-8A}' },
            6: { clsid: '{AIM-120C}' },
            7: { clsid: '{AIM-120C}' },
            8: { clsid: '{AIM-120C}' },
            9: { clsid: '{4B26C8D7-E7A9-4A7B-9D06-03F678E20E2F}' },
          },
          fuel: 4900,
          flare: 60,
          chaff: 60,
          gun: 100,
        },
      },
      {
        unitId: 2,
        name: 'Chevy 1-2',
        type: 'F/A-18C_hornet',
        skill: 'Client', // Multiplayer slot!
        heading: 1.57,
        x: defaultUnitDcs.x - 200,
        y: defaultUnitDcs.y - 200,
        lat: defaultUnitLatLon.lat - 0.0018,
        lon: defaultUnitLatLon.lon - 0.0024,
        alt: 2500,
        speed: 220,
        callsign: {
          [1]: 1,
          [2]: 1,
          [3]: 2,
          name: 'Chevy 1-2',
        },
        radio: {
          frequency: 305000000,
          modulation: 0,
        },
        payload: {
          pylons: {
            1: { clsid: '{4B26C8D7-E7A9-4A7B-9D06-03F678E20E2F}' },
            2: { clsid: '{AIM-120C}' },
            3: { clsid: '{AIM-120C}' },
            4: { clsid: '{ATFLIR}' },
            5: { clsid: '{FPU-8A}' },
            6: { clsid: '{AIM-120C}' },
            7: { clsid: '{AIM-120C}' },
            8: { clsid: '{AIM-120C}' },
            9: { clsid: '{4B26C8D7-E7A9-4A7B-9D06-03F678E20E2F}' },
          },
          fuel: 4900,
          flare: 60,
          chaff: 60,
          gun: 100,
        },
      },
    ],
    route: {
      points: [
        {
          id: 1,
          name: 'WP 1 - Ingress',
          x: defaultUnitDcs.x,
          y: defaultUnitDcs.y,
          lat: defaultUnitLatLon.lat,
          lon: defaultUnitLatLon.lon,
          alt: 2500,
          speed: 220,
          action: 'Turning Point',
          type: 'Turning Point',
        },
        {
          id: 2,
          name: 'WP 2 - Patrol Area',
          x: defaultUnitDcs.x + 35000,
          y: defaultUnitDcs.y + 40000,
          lat: defaultUnitLatLon.lat + 0.3,
          lon: defaultUnitLatLon.lon + 0.45,
          alt: 6500,
          speed: 250,
          action: 'Turning Point',
          type: 'Turning Point',
        },
      ],
    },
  };

  // Sample Trigger Zone
  const zoneCenterLatLon = isCaucasus ? { lat: 42.5, lon: 42.5 } : { lat: 36.0, lon: 36.5 };
  const zoneDcs = latLonToDcs(theater, zoneCenterLatLon.lat, zoneCenterLatLon.lon);
  const defaultZone: TriggerZone = {
    zoneId: 1,
    name: 'Combat_Zone_Alpha',
    x: zoneDcs.x,
    y: zoneDcs.y,
    lat: zoneCenterLatLon.lat,
    lon: zoneCenterLatLon.lon,
    radius: 30000, // 30 km
    color: [0.1, 0.6, 1.0, 0.25],
    type: 0,
  };

  // Sample Triggers
  const defaultTriggers: MissionTrigger[] = [
    {
      id: 'trig-1',
      name: 'Server Startup Announcement',
      type: 'MISSION START',
      event: 'NONE',
      enabled: true,
      conditions: [],
      actions: [
        {
          id: 'act-1',
          type: 'MESSAGE_TO_ALL',
          message: 'DCS Multiplayer Server Online! Check Kneeboard / F10 map for objectives.',
          duration: 20,
        },
        {
          id: 'act-2',
          type: 'DO_SCRIPT',
          script: `-- Mission Initialization Script\nenv.info(">>> DCS Mission Planner: Server mission initialized successfully! <<<")\ntrigger.action.setUserFlag("1", 1)`,
        },
      ],
    },
    {
      id: 'trig-2',
      name: 'Blue Ingress Combat Zone',
      type: 'ONCE',
      event: 'NONE',
      enabled: true,
      conditions: [
        {
          id: 'cond-1',
          type: 'PART_OF_COALITION_IN_ZONE',
          coalition: 'blue',
          zone: 'Combat_Zone_Alpha',
        },
      ],
      actions: [
        {
          id: 'act-3',
          type: 'MESSAGE_TO_COALITION',
          coalition: 'blue',
          message: 'WARNING: Blue forces have entered Combat Zone Alpha! Stay alert for enemy contacts.',
          duration: 15,
        },
        {
          id: 'act-4',
          type: 'FLAG_SET',
          flag: '10',
          value: 1,
        },
      ],
    },
  ];

  // Default Lua Script Files
  const defaultScripts: MissionScriptFile[] = [
    {
      name: 'server_rules.lua',
      content: `-- =========================================================
-- DCS World Multiplayer Server - Script Module
-- =========================================================

env.info("Loading Server Rules & Utilities...")

local ServerConfig = {
    autoRestartHours = 4,
    enableSRS = true,
    welcomeMessage = "Welcome to the Multiplayer Server!",
}

function OnPlayerConnect(name)
    env.info("Player connected: " .. tostring(name))
end

-- Custom helper functions for triggers
function CheckAirspaceClear(zoneName)
    -- Add custom logic or MIST/MOOSE calls here
    return true
end

env.info("Server rules module ready.")
`,
    },
  ];

  return {
    theatre: theater,
    title: `Multiplayer Operation - ${theater}`,
    description: `Tactical multiplayer mission for DCS World on ${theater} theater.\nPrepared with DCS Mission Planner.`,
    descriptionBlue: `Blue Coalition Tasks:\n1. Maintain CAP over northern sectors.\n2. Engage designated hostiles.\n3. Protect friendly forward bases.`,
    descriptionRed: `Red Coalition Tasks:\n1. Intercept enemy strikes.\n2. Defend territorial airspace.`,
    date: {
      year: 2026,
      month: 6,
      day: 21,
    },
    startTime: 28800, // 08:00 AM
    weather: {
      atmosphere_type: 0,
      season: {
        temperature: 24,
      },
      clouds: {
        base: 2200,
        density: 2,
        thickness: 600,
        iprecptns: 0,
      },
      visibility: {
        distance: 80000,
      },
      qnh: 760,
      wind: {
        atGround: { speed: 2, dir: 180 },
        at2000: { speed: 5, dir: 220 },
        at8000: { speed: 12, dir: 250 },
      },
    },
    zones: [defaultZone],
    triggers: defaultTriggers,
    groups: [defaultGroup],
    scriptFiles: defaultScripts,
    nextId: {
      groupId: 2,
      unitId: 3,
      zoneId: 2,
    },
  };
}

/**
 * Packs a MissionData object into a fully compatible .miz ZIP archive
 */
export async function exportMissionToMiz(missionData: MissionData): Promise<Blob> {
  const zip = new JSZip();

  // 1. theatre file (text)
  zip.file('theatre', missionData.theatre);

  // 2. l10n/DEFAULT/dictionary
  const dictionary: Record<string, string> = {
    DictKey_descriptionText_1: missionData.description,
    DictKey_descriptionBlueTask_2: missionData.descriptionBlue,
    DictKey_descriptionRedTask_3: missionData.descriptionRed,
    DictKey_descriptionNeutralsTask_4: '',
  };

  // 3. l10n/DEFAULT/mapResource
  const mapResource: Record<string, string> = {};

  // 4. Pack embedded Lua script files into l10n/DEFAULT/
  missionData.scriptFiles.forEach((file, index) => {
    zip.file(`l10n/DEFAULT/${file.name}`, file.content);
    const resKey = `ResKey_Script_${index + 1}`;
    mapResource[resKey] = file.name;
  });

  zip.file('l10n/DEFAULT/dictionary', serializeNamedLuaTable('dictionary', dictionary));
  zip.file('l10n/DEFAULT/mapResource', serializeNamedLuaTable('mapResource', mapResource));

  // 5. warehouses file
  const warehouses = {
    airports: {},
    warehouses: {},
  };
  zip.file('warehouses', serializeNamedLuaTable('warehouses', warehouses));

  // 6. options file
  const options = {
    difficulty: {
      birds: 0,
      cockpitStatusBarAllowed: false,
      cockpitVisualRM: true,
      controlsIndicator: true,
      easyCommunication: false,
      easyFlight: false,
      externalViews: true,
      fuel: false,
      geffect: 'realistic',
      hideLabels: false,
      iconsTheme: 'nato',
      labels: 0,
      map: true,
      miniHUD: false,
      optionsView: 'optview_all',
      permitCrash: true,
      radio: false,
      reports: true,
      setGlobal: false,
      spectatorExternalViews: true,
      tips: false,
      units: 'imperial',
      userSnapView: true,
      wakeTurbulence: true,
      weapons: false,
    },
    forcedOptions: {},
    format: 1,
    graphics: {},
    plugins: {},
    sound: {},
    views: {
      cockpit: {
        mirrors: false,
        reflections: false,
      },
    },
  };
  zip.file('options', serializeNamedLuaTable('options', options));

  // 7. Assemble DCS `mission` Lua table
  const bullseyeBlue = latLonToDcs(missionData.theatre, 42.176, 42.483);
  const bullseyeRed = latLonToDcs(missionData.theatre, 43.513, 43.636);

  // Group sorting by coalition and category
  const blueGroups = missionData.groups.filter((g) => g.coalition === 'blue');
  const redGroups = missionData.groups.filter((g) => g.coalition === 'red');
  const neutralGroups = missionData.groups.filter((g) => g.coalition === 'neutrals');

  function buildCountryGroupData(groups: Group[]) {
    const planes = groups.filter((g) => g.category === 'plane');
    const helis = groups.filter((g) => g.category === 'helicopter');
    const vehicles = groups.filter((g) => g.category === 'vehicle');
    const ships = groups.filter((g) => g.category === 'ship');
    const statics = groups.filter((g) => g.category === 'static');

    return {
      plane: { group: planes.map((g) => formatGroupForDcs(g, missionData.theatre)) },
      helicopter: { group: helis.map((g) => formatGroupForDcs(g, missionData.theatre)) },
      vehicle: { group: vehicles.map((g) => formatGroupForDcs(g, missionData.theatre)) },
      ship: { group: ships.map((g) => formatGroupForDcs(g, missionData.theatre)) },
      static: { group: statics.map((g) => formatGroupForDcs(g, missionData.theatre)) },
    };
  }

  // Construct coalition tables
  const coalitionData = {
    blue: {
      name: 'blue',
      bullseye: bullseyeBlue,
      nav_points: {},
      country: [
        {
          id: 2, // USA
          name: 'USA',
          ...buildCountryGroupData(blueGroups),
        },
      ],
    },
    red: {
      name: 'red',
      bullseye: bullseyeRed,
      nav_points: {},
      country: [
        {
          id: 0, // Russia
          name: 'Russia',
          ...buildCountryGroupData(redGroups),
        },
      ],
    },
    neutrals: {
      name: 'neutrals',
      bullseye: bullseyeBlue,
      nav_points: {},
      country: [
        {
          id: 70, // Georgia / Neutral
          name: 'Georgia',
          ...buildCountryGroupData(neutralGroups),
        },
      ],
    },
  };

  // Convert trigger zones
  const zonesData = missionData.zones.map((zone, idx) => ({
    zoneId: zone.zoneId || idx + 1,
    name: zone.name,
    x: zone.x,
    y: zone.y,
    radius: zone.radius,
    color: zone.color,
    type: zone.type ?? 0,
  }));

  // Convert mission triggers to trigrules
  const trigrules = missionData.triggers
    .filter((t) => t.enabled)
    .map((trig) => {
      let predicate = 'triggerOnce';
      let event = 'visual';
      if (trig.type === 'MISSION START') {
        predicate = 'triggerStart';
        event = 'start';
      } else if (trig.type === 'REPETITIVE') {
        predicate = 'triggerRepeat';
      }

      // Convert conditions
      const rules = trig.conditions.map((cond) => {
        switch (cond.type) {
          case 'FLAG_IS_TRUE':
            return { predicate: 'c_flag_is_true', flag: cond.flag || '1' };
          case 'FLAG_IS_FALSE':
            return { predicate: 'c_flag_is_false', flag: cond.flag || '1' };
          case 'FLAG_MORE':
            return { predicate: 'c_flag_more', flag: cond.flag || '1', val: cond.value || 0 };
          case 'FLAG_LESS':
            return { predicate: 'c_flag_less', flag: cond.flag || '1', val: cond.value || 0 };
          case 'FLAG_EQUALS':
            return { predicate: 'c_flag_equals', flag: cond.flag || '1', val: cond.value || 0 };
          case 'UNIT_INSIDE_ZONE':
            return { predicate: 'c_unit_in_zone', unit: cond.unit || '', zone: cond.zone || '' };
          case 'UNIT_OUTSIDE_ZONE':
            return { predicate: 'c_unit_out_zone', unit: cond.unit || '', zone: cond.zone || '' };
          case 'PART_OF_COALITION_IN_ZONE':
            return {
              predicate: 'c_part_of_coalition_in_zone',
              coalition: cond.coalition === 'red' ? 1 : cond.coalition === 'blue' ? 2 : 0,
              zone: cond.zone || '',
            };
          case 'TIME_MORE':
            return { predicate: 'c_time_more', seconds: cond.seconds || 10 };
          case 'TIME_SINCE_FLAG':
            return { predicate: 'c_time_since_flag', flag: cond.flag || '1', seconds: cond.seconds || 10 };
          case 'LUA_PREDICATE':
            return { predicate: 'c_predicate', text: cond.luaCode || 'return true' };
          case 'RANDOM':
            return { predicate: 'c_random', val: cond.percent || 50 };
          default:
            return { predicate: 'c_flag_is_true', flag: '1' };
        }
      });

      // Convert actions
      const actions = trig.actions.map((act) => {
        switch (act.type) {
          case 'DO_SCRIPT':
            return { predicate: 'a_do_script', text: act.script || '' };
          case 'DO_SCRIPT_FILE':
            return { predicate: 'a_do_script_file', file: act.file || '' };
          case 'MESSAGE_TO_ALL':
            return { predicate: 'a_out_text', text: act.message || '', seconds: act.duration || 10 };
          case 'MESSAGE_TO_COALITION':
            return {
              predicate: 'a_out_text_coalition',
              coalition: act.coalition === 'red' ? 1 : act.coalition === 'blue' ? 2 : 0,
              text: act.message || '',
              seconds: act.duration || 10,
            };
          case 'FLAG_SET':
            return { predicate: 'a_set_flag', flag: act.flag || '1', val: act.value ?? 1 };
          case 'FLAG_OFF':
            return { predicate: 'a_clear_flag', flag: act.flag || '1' };
          case 'FLAG_INCREASE':
            return { predicate: 'a_inc_flag', flag: act.flag || '1', val: act.value ?? 1 };
          case 'FLAG_DECREASE':
            return { predicate: 'a_dec_flag', flag: act.flag || '1', val: act.value ?? 1 };
          case 'GROUP_ACTIVATE':
            return { predicate: 'a_group_activate', group: act.group || '' };
          case 'GROUP_DEACTIVATE':
            return { predicate: 'a_group_deactivate', group: act.group || '' };
          default:
            return { predicate: 'a_do_script', text: '' };
        }
      });

      return {
        comment: trig.name,
        event,
        predicate,
        rules,
        actions,
      };
    });

  const mission = {
    theatre: missionData.theatre,
    version: 22,
    maxDictId: 100,
    start_time: missionData.startTime,
    date: {
      Year: missionData.date.year,
      Month: missionData.date.month,
      Day: missionData.date.day,
    },
    descriptionText: 'DictKey_descriptionText_1',
    descriptionBlueTask: 'DictKey_descriptionBlueTask_2',
    descriptionRedTask: 'DictKey_descriptionRedTask_3',
    descriptionNeutralsTask: 'DictKey_descriptionNeutralsTask_4',
    weather: missionData.weather,
    drawings: {},
    triggers: {
      zones: zonesData,
    },
    trigrules,
    trig: {
      actions: {},
      events: {},
      flag: {},
      func: {},
      funcMap: {},
      custom: {},
    },
    coalition: coalitionData,
    groundControl: {
      isPilotControlVehicles: true,
      roles: {
        artillery_commander: { blue: 1, red: 1 },
        instructor: { blue: 1, red: 1 },
        forward_observer: { blue: 1, red: 1 },
        observer: { blue: 1, red: 1 },
      },
    },
  };

  zip.file('mission', serializeNamedLuaTable('mission', mission));

  // Generate and pack tactical Kneeboard flight cards for all aircraft into .miz
  try {
    await packAllKneeboardsIntoZip(zip, missionData);
  } catch (kneeboardErr) {
    console.warn('Could not auto-generate kneeboards for .miz export:', kneeboardErr);
  }

  // Generate .miz archive as a Blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return blob;
}

/**
 * Downloads a MissionData object as a .miz file
 */
export async function downloadMissionMiz(missionData: MissionData, fileName?: string): Promise<void> {
  const blob = await exportMissionToMiz(missionData);
  const safeName = (fileName || missionData.title || 'dcs_mission')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();
  saveAs(blob, `${safeName}.miz`);
}

/**
 * Formats and cleans unit payload for DCS World Lua serialization
 */
function formatPayloadForDcs(payload?: Unit['payload']): any {
  if (!payload) return {};
  const pylonsObj: Record<number, { clsid: string }> = {};
  if (payload.pylons) {
    const pylonEntries = Object.entries(payload.pylons) as [string, { clsid?: string } | undefined][];
    for (const [st, pylon] of pylonEntries) {
      const stationNum = Number(st);
      if (pylon && pylon.clsid && pylon.clsid !== '<CLEAN>' && pylon.clsid.trim() !== '') {
        pylonsObj[stationNum] = { clsid: pylon.clsid };
      }
    }
  }

  const res: any = {
    pylons: pylonsObj,
  };
  if (payload.fuel !== undefined) res.fuel = Math.round(payload.fuel);
  if (payload.flare !== undefined) res.flare = Math.round(payload.flare);
  if (payload.chaff !== undefined) res.chaff = Math.round(payload.chaff);
  if (payload.gun !== undefined) res.gun = Math.round(payload.gun);

  return res;
}

/**
 * Formats an internal Group into DCS Mission Editor group structure
 */
function formatGroupForDcs(group: Group, theater: Theater): any {
  return {
    groupId: group.groupId,
    name: group.name,
    hidden: group.hidden || false,
    uncontrolled: group.uncontrolled || false,
    units: group.units.map((u) => {
      // Ensure coordinates in DCS meters
      const dcsCoords = latLonToDcs(theater, u.lat, u.lon);
      return {
        unitId: u.unitId,
        name: u.name,
        type: u.type,
        skill: u.skill,
        heading: u.heading,
        x: dcsCoords.x,
        y: dcsCoords.y,
        alt: u.alt,
        speed: u.speed || 150,
        callsign: u.callsign || { [1]: 1, [2]: 1, [3]: 1, name: u.name },
        radio: u.radio || { frequency: 124000000, modulation: 0 },
        payload: formatPayloadForDcs(u.payload),
      };
    }),
    route: {
      points: group.route.points.map((pt, idx) => {
        const dcsCoords = latLonToDcs(theater, pt.lat, pt.lon);
        return {
          id: idx + 1,
          name: pt.name || `WP ${idx + 1}`,
          x: dcsCoords.x,
          y: dcsCoords.y,
          alt: pt.alt,
          alt_type: pt.alt_type || 'BARO',
          speed: pt.speed,
          action: pt.action || 'Turning Point',
          type: pt.type || 'Turning Point',
          formation: pt.formation || '',
          task: pt.task || { id: 'ComboTask', params: { tasks: [] } },
        };
      }),
    },
  };
}

/**
 * Imports an uploaded .miz file and converts it into a MissionData object
 */
export async function importMissionFromMiz(file: File): Promise<MissionData> {
  const zip = await JSZip.loadAsync(file);

  // 1. Read mission Lua
  const missionFile = zip.file('mission');
  if (!missionFile) {
    throw new Error('Neplatný .miz soubor: Chybí soubor "mission"');
  }
  const missionLua = await missionFile.async('string');
  const missionObj = parseLuaTable(missionLua, 'mission');
  if (!missionObj) {
    throw new Error('Nelze zpracovat DCS mission tabulku z .miz souboru');
  }

  // 2. Read theatre from 'theatre' file or missionObj.theatre
  let theatre: Theater = 'Caucasus';
  const theatreFile = zip.file('theatre') || zip.file('theater');
  let rawTheater = '';
  if (theatreFile) {
    rawTheater = (await theatreFile.async('string')).trim();
  } else if (missionObj.theatre) {
    rawTheater = String(missionObj.theatre).trim();
  }

  if (rawTheater.toLowerCase().includes('syria')) {
    theatre = 'Syria';
  } else {
    theatre = 'Caucasus';
  }

  // 3. Read dictionary
  const dictFile = zip.file('l10n/DEFAULT/dictionary');
  let dictObj: Record<string, string> = {};
  if (dictFile) {
    const dictLua = await dictFile.async('string');
    dictObj = parseLuaTable(dictLua, 'dictionary') || {};
  }

  // 4. Extract embedded Lua script files from l10n/DEFAULT/
  const scriptFiles: MissionScriptFile[] = [];
  const defaultDir = zip.folder('l10n/DEFAULT');
  if (defaultDir) {
    for (const relativePath of Object.keys(zip.files)) {
      if (relativePath.startsWith('l10n/DEFAULT/') && relativePath.endsWith('.lua')) {
        const f = zip.file(relativePath);
        if (f) {
          const content = await f.async('string');
          const fileName = relativePath.replace('l10n/DEFAULT/', '');
          if (fileName !== 'dictionary' && fileName !== 'mapResource') {
            scriptFiles.push({
              name: fileName,
              content,
              size: content.length,
            });
          }
        }
      }
    }
  }

  // 5. Extract Groups from Coalitions
  const groups: Group[] = [];
  let maxGroupId = 1;
  let maxUnitId = 1;

  if (missionObj.coalition) {
    const coalitions: CoalitionType[] = ['blue', 'red', 'neutrals'];
    for (const coal of coalitions) {
      const coalData = missionObj.coalition[coal];
      if (!coalData || !coalData.country) continue;

      const countries = Array.isArray(coalData.country)
        ? coalData.country
        : Object.values(coalData.country);

      for (const country of countries) {
        if (!country) continue;
        const countryId = Number(country.id) || 0;
        const countryName = String(country.name || '');

        const categories: UnitCategory[] = ['plane', 'helicopter', 'vehicle', 'ship', 'static'];
        for (const cat of categories) {
          if (!country[cat] || !country[cat].group) continue;
          const rawGroups = Array.isArray(country[cat].group)
            ? country[cat].group
            : Object.values(country[cat].group);

          for (const rawG of rawGroups) {
            if (!rawG) continue;
            const gId = Number(rawG.groupId) || maxGroupId++;
            if (gId >= maxGroupId) maxGroupId = gId + 1;

            const rawUnits = rawG.units
              ? Array.isArray(rawG.units)
                ? rawG.units
                : Object.values(rawG.units)
              : [];

            const units: Unit[] = rawUnits.map((u: any) => {
              const uId = Number(u.unitId) || maxUnitId++;
              if (uId >= maxUnitId) maxUnitId = uId + 1;
              const uX = Number(u.x) || 0;
              const uY = Number(u.y) || 0;
              const latLon = dcsToLatLon(theatre, uX, uY);

              return {
                unitId: uId,
                name: String(u.name || `Unit #${uId}`),
                type: String(u.type || 'F/A-18C_hornet'),
                skill: u.skill || 'Client',
                heading: Number(u.heading) || 0,
                x: uX,
                y: uY,
                lat: latLon.lat,
                lon: latLon.lon,
                alt: Number(u.alt) || 2000,
                speed: Number(u.speed) || 150,
                callsign: u.callsign,
                radio: u.radio,
                payload: u.payload,
              };
            });

            // Extract route points
            const rawPoints = rawG.route?.points
              ? Array.isArray(rawG.route.points)
                ? rawG.route.points
                : Object.values(rawG.route.points)
              : [];

            const points: Waypoint[] = rawPoints.map((pt: any, ptIdx: number) => {
              const pX = Number(pt.x) || 0;
              const pY = Number(pt.y) || 0;
              const latLon = dcsToLatLon(theatre, pX, pY);
              return {
                id: Number(pt.id) || ptIdx + 1,
                name: String(pt.name || `WP ${ptIdx + 1}`),
                x: pX,
                y: pY,
                lat: latLon.lat,
                lon: latLon.lon,
                alt: Number(pt.alt) || 2000,
                alt_type: (pt.alt_type as any) || 'BARO',
                speed: Number(pt.speed) || 150,
                action: String(pt.action || 'Turning Point'),
                type: String(pt.type || 'Turning Point'),
                formation: pt.formation ? String(pt.formation) : undefined,
                task: pt.task,
              };
            });

            // Ensure group always has at least 1 waypoint at lead unit position
            if (points.length === 0 && units.length > 0) {
              const lead = units[0];
              points.push({
                id: 1,
                name: 'WP 1',
                x: lead.x,
                y: lead.y,
                lat: lead.lat,
                lon: lead.lon,
                alt: lead.alt,
                alt_type: 'BARO',
                speed: lead.speed || 150,
                action: 'Turning Point',
                type: 'Turning Point',
              });
            }

            groups.push({
              groupId: gId,
              name: String(rawG.name || `Group #${gId}`),
              category: cat,
              coalition: coal,
              countryId,
              countryName,
              units,
              route: { points },
              hidden: Boolean(rawG.hidden),
              uncontrolled: Boolean(rawG.uncontrolled),
            });
          }
        }
      }
    }
  }

  // 6. Extract Trigger Zones with guaranteed [r, g, b, a] array
  const zones: TriggerZone[] = [];
  let maxZoneId = 1;
  const rawZones = missionObj.triggers?.zones;
  if (rawZones) {
    const zoneList = Array.isArray(rawZones) ? rawZones : Object.values(rawZones);
    for (const z of zoneList) {
      if (!z) continue;
      const zId = Number(z.zoneId) || maxZoneId++;
      if (zId >= maxZoneId) maxZoneId = zId + 1;
      const zX = Number(z.x) || 0;
      const zY = Number(z.y) || 0;
      const latLon = dcsToLatLon(theatre, zX, zY);

      // Safe color conversion: guaranteed 4-element number array [r, g, b, a]
      let color: [number, number, number, number] = [1, 0.6, 0.1, 0.25];
      if (z.color) {
        if (Array.isArray(z.color)) {
          color = [
            Number(z.color[0]) || 1,
            Number(z.color[1]) || 0.6,
            Number(z.color[2]) || 0.1,
            Number(z.color[3]) || 0.25,
          ];
        } else if (typeof z.color === 'object') {
          color = [
            Number(z.color[1] ?? z.color['1'] ?? z.color.r ?? 1),
            Number(z.color[2] ?? z.color['2'] ?? z.color.g ?? 0.6),
            Number(z.color[3] ?? z.color['3'] ?? z.color.b ?? 0.1),
            Number(z.color[4] ?? z.color['4'] ?? z.color.a ?? 0.25),
          ];
        }
      }

      zones.push({
        zoneId: zId,
        name: String(z.name || `Zone_${zId}`),
        x: zX,
        y: zY,
        lat: latLon.lat,
        lon: latLon.lon,
        radius: Number(z.radius) || 1000,
        color,
        type: Number(z.type) || 0,
      });
    }
  }

  // 7. Extract Triggers
  const triggers: MissionTrigger[] = [];
  const rawTrigrules = missionObj.trigrules;
  if (rawTrigrules) {
    const trigList = Array.isArray(rawTrigrules) ? rawTrigrules : Object.values(rawTrigrules);
    trigList.forEach((trig: any, idx: number) => {
      if (!trig) return;
      let type: MissionTrigger['type'] = 'ONCE';
      if (trig.predicate === 'triggerStart') type = 'MISSION START';
      else if (trig.predicate === 'triggerRepeat') type = 'REPETITIVE';

      const conditions = (trig.rules ? (Array.isArray(trig.rules) ? trig.rules : Object.values(trig.rules)) : []).map(
        (r: any, rIdx: number) => {
          let condType: any = 'FLAG_IS_TRUE';
          if (r.predicate === 'c_flag_is_false') condType = 'FLAG_IS_FALSE';
          else if (r.predicate === 'c_flag_more') condType = 'FLAG_MORE';
          else if (r.predicate === 'c_flag_less') condType = 'FLAG_LESS';
          else if (r.predicate === 'c_unit_in_zone') condType = 'UNIT_INSIDE_ZONE';
          else if (r.predicate === 'c_unit_out_zone') condType = 'UNIT_OUTSIDE_ZONE';
          else if (r.predicate === 'c_time_more') condType = 'TIME_MORE';
          else if (r.predicate === 'c_predicate') condType = 'LUA_PREDICATE';
          else if (r.predicate === 'c_random') condType = 'RANDOM';

          return {
            id: `c-${idx}-${rIdx}`,
            type: condType,
            flag: r.flag?.toString(),
            value: r.val,
            unit: r.unit,
            zone: r.zone,
            coalition: r.coalition === 1 ? 'red' : r.coalition === 2 ? 'blue' : 'neutrals',
            luaCode: r.text,
            seconds: r.seconds,
            percent: r.val,
          };
        }
      );

      const actions = (trig.actions ? (Array.isArray(trig.actions) ? trig.actions : Object.values(trig.actions)) : []).map(
        (a: any, aIdx: number) => {
          let actType: any = 'DO_SCRIPT';
          if (a.predicate === 'a_do_script_file') actType = 'DO_SCRIPT_FILE';
          else if (a.predicate === 'a_out_text') actType = 'MESSAGE_TO_ALL';
          else if (a.predicate === 'a_out_text_coalition') actType = 'MESSAGE_TO_COALITION';
          else if (a.predicate === 'a_set_flag') actType = 'FLAG_SET';
          else if (a.predicate === 'a_clear_flag') actType = 'FLAG_OFF';
          else if (a.predicate === 'a_inc_flag') actType = 'FLAG_INCREASE';
          else if (a.predicate === 'a_group_activate') actType = 'GROUP_ACTIVATE';
          else if (a.predicate === 'a_group_deactivate') actType = 'GROUP_DEACTIVATE';

          return {
            id: `a-${idx}-${aIdx}`,
            type: actType,
            script: a.text,
            file: a.file,
            message: a.text,
            duration: a.seconds,
            flag: a.flag?.toString(),
            value: a.val,
            group: a.group,
            coalition: a.coalition === 1 ? 'red' : a.coalition === 2 ? 'blue' : 'neutrals',
          };
        }
      );

      triggers.push({
        id: `trig-${idx + 1}`,
        name: trig.comment || `Trigger ${idx + 1}`,
        type,
        event: 'NONE',
        enabled: true,
        conditions,
        actions,
      });
    });
  }

  // 8. Resolve localized text from dictionary
  const descKey = missionObj.descriptionText;
  const descText = descKey && dictObj[descKey] ? dictObj[descKey] : file.name.replace('.miz', '');

  // 9. Weather Deep Merge to guarantee all nested properties
  const rawWeather = missionObj.weather || {};
  const seasonTemp =
    typeof rawWeather.season === 'object' && rawWeather.season !== null
      ? Number(rawWeather.season.temperature) || 20
      : Number(rawWeather.season) || 20;

  const weather = {
    atmosphere_type: Number(rawWeather.atmosphere_type) || 0,
    season: {
      temperature: seasonTemp,
    },
    clouds: {
      base: Number(rawWeather.clouds?.base) || 2000,
      density: Number(rawWeather.clouds?.density) || 1,
      thickness: Number(rawWeather.clouds?.thickness) || 500,
      iprecptns: Number(rawWeather.clouds?.iprecptns) || 0,
    },
    visibility: {
      distance: Number(rawWeather.visibility?.distance) || 80000,
    },
    qnh: Number(rawWeather.qnh) || 760,
    wind: {
      atGround: {
        speed: Number(rawWeather.wind?.atGround?.speed) || 0,
        dir: Number(rawWeather.wind?.atGround?.dir) || 0,
      },
      at2000: {
        speed: Number(rawWeather.wind?.at2000?.speed) || 0,
        dir: Number(rawWeather.wind?.at2000?.dir) || 0,
      },
      at8000: {
        speed: Number(rawWeather.wind?.at8000?.speed) || 0,
        dir: Number(rawWeather.wind?.at8000?.dir) || 0,
      },
    },
  };

  return {
    theatre,
    title: file.name.replace('.miz', ''),
    description: descText,
    descriptionBlue: dictObj['DictKey_descriptionBlueTask_2'] || '',
    descriptionRed: dictObj['DictKey_descriptionRedTask_3'] || '',
    date: {
      year: Number(missionObj.date?.Year ?? missionObj.date?.year) || 2026,
      month: Number(missionObj.date?.Month ?? missionObj.date?.month) || 6,
      day: Number(missionObj.date?.Day ?? missionObj.date?.day) || 21,
    },
    startTime: Number(missionObj.start_time) || 28800,
    weather,
    zones,
    triggers,
    groups,
    scriptFiles,
    nextId: {
      groupId: maxGroupId,
      unitId: maxUnitId,
      zoneId: maxZoneId,
    },
  };
}
