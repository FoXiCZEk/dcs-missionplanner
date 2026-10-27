import type { Group, Theater, Unit, Waypoint } from '../types/dcs';
import { latLonToDcs, dcsToLatLon } from '../utils/coordinates';

export interface SamComponent {
  type: string;
  name: string;
  offsetX: number; // meters from battery center
  offsetY: number; // meters from battery center
}

export interface SamBatteryTemplate {
  id: string;
  name: string;
  shortName: string;
  coalition: 'blue' | 'red';
  threatRadius: number; // meters
  description: string;
  components: SamComponent[];
}

export interface SupportFlightTemplate {
  id: string;
  name: string;
  type: string;
  category: 'plane';
  coalition: 'blue' | 'red';
  role: 'tanker' | 'awacs';
  callsignName: string;
  frequencyHz: number; // Hz
  tacan?: {
    channel: number;
    mode: 'Y' | 'X';
    callsign: string;
  };
  altitudeM: number;
  speedMs: number;
  orbitLengthNm: number;
  description: string;
}

export interface CarrierEscortComponent {
  type: string;
  name: string;
  role: string;
  offsetX: number; // forward along heading in meters
  offsetY: number; // starboard / right of heading in meters
}

export interface CarrierGroupTemplate {
  id: string;
  name: string;
  shortName: string;
  carrierType: string;
  carrierName: string;
  coalition: 'blue' | 'red';
  isSupercarrier: boolean;
  tacan: {
    channel: number;
    mode: 'X' | 'Y';
    callsign: string;
  };
  icls?: {
    channel: number;
  };
  link4?: {
    frequencyHz: number;
  };
  atcFrequencyHz: number; // Hz
  speedKnots: number;
  routeLengthNm: number;
  defaultBrcDeg: number;
  escorts: CarrierEscortComponent[];
  includeRescueHeli: boolean;
  rescueHeliType?: string;
  description: string;
}

export const SAM_BATTERY_TEMPLATES: SamBatteryTemplate[] = [
  // --- BLUE SAMs ---
  {
    id: 'patriot_battery',
    name: 'MIM-104 Patriot Battery (Long Range)',
    shortName: 'Patriot PAC-2/3',
    coalition: 'blue',
    threatRadius: 100000,
    description: 'Dálkový raketový systém PVO (radar AN/MPQ-65, ECS/ICC, 4x PAC-2 launcher)',
    components: [
      { type: 'Patriot str', name: 'Patriot Radar MPQ-65', offsetX: 0, offsetY: 0 },
      { type: 'Patriot cp', name: 'Patriot ECS Command Post', offsetX: -35, offsetY: -20 },
      { type: 'Patriot epp', name: 'Patriot EPP Power Plant', offsetX: -55, offsetY: -10 },
      { type: 'Patriot ln', name: 'Patriot Launcher #1', offsetX: 60, offsetY: 70 },
      { type: 'Patriot ln', name: 'Patriot Launcher #2', offsetX: 90, offsetY: 10 },
      { type: 'Patriot ln', name: 'Patriot Launcher #3', offsetX: 70, offsetY: -60 },
      { type: 'Patriot ln', name: 'Patriot Launcher #4', offsetX: -40, offsetY: 80 },
    ],
  },
  {
    id: 'hawk_battery',
    name: 'MIM-23 Hawk Battery (Medium Range)',
    shortName: 'MIM-23 Hawk',
    coalition: 'blue',
    threatRadius: 45000,
    description: 'Střednědosahový systém PVO (vyhledávací PAR, sledovací HPI, PCP, 3x odpalovací rampa)',
    components: [
      { type: 'Hawk sr', name: 'Hawk PAR Search Radar', offsetX: 0, offsetY: 0 },
      { type: 'Hawk tr', name: 'Hawk HPI Tracking Radar', offsetX: 30, offsetY: -20 },
      { type: 'Hawk pcp', name: 'Hawk Platoon Command Post', offsetX: -25, offsetY: -15 },
      { type: 'Hawk ln', name: 'Hawk Launcher #1', offsetX: 50, offsetY: 40 },
      { type: 'Hawk ln', name: 'Hawk Launcher #2', offsetX: 65, offsetY: -35 },
      { type: 'Hawk ln', name: 'Hawk Launcher #3', offsetX: -45, offsetY: 50 },
    ],
  },
  {
    id: 'gepard_section',
    name: 'Gepard SPAAG Air Defense Section',
    shortName: '2x Flakpanzer Gepard',
    coalition: 'blue',
    threatRadius: 4000,
    description: 'Samohybný protiletadlový systém pro krytí vojsk (2x 35mm Oerlikon kanóny)',
    components: [
      { type: 'Gepard', name: 'Gepard SPAAG #1', offsetX: -25, offsetY: 0 },
      { type: 'Gepard', name: 'Gepard SPAAG #2', offsetX: 25, offsetY: 0 },
    ],
  },

  // --- RED SAMs ---
  {
    id: 'sa10_s300_site',
    name: 'SA-10 Grumble (S-300PS Site)',
    shortName: 'SA-10 S-300PS',
    coalition: 'red',
    threatRadius: 90000,
    description: 'Těžký dálkový systém PVO (přehledový Big Bird, naváděcí Flap Lid, velitelský 54K6, 4x TEL)',
    components: [
      { type: 'SA-10 S-300PS 64N6E', name: 'SA-10 Big Bird SR', offsetX: 0, offsetY: 0 },
      { type: 'SA-10 S-300PS 40B6M', name: 'SA-10 Flap Lid TR', offsetX: 50, offsetY: 20 },
      { type: 'SA-10 S-300PS 54K6', name: 'SA-10 Command Post 54K6', offsetX: -40, offsetY: -20 },
      { type: 'SA-10 S-300PS 5P85C', name: 'SA-10 Launcher 5P85C #1', offsetX: 80, offsetY: 70 },
      { type: 'SA-10 S-300PS 5P85C', name: 'SA-10 Launcher 5P85C #2', offsetX: 110, offsetY: 0 },
      { type: 'SA-10 S-300PS 5P85D', name: 'SA-10 Launcher 5P85D #3', offsetX: 85, offsetY: -70 },
      { type: 'SA-10 S-300PS 5P85D', name: 'SA-10 Launcher 5P85D #4', offsetX: -60, offsetY: 60 },
    ],
  },
  {
    id: 'sa11_buk_battery',
    name: 'SA-11 Gadfly (Buk-M1 Battery)',
    shortName: 'SA-11 Buk-M1',
    coalition: 'red',
    threatRadius: 32000,
    description: 'Střednědosahový raketový systém (radar Snow Drift, CP, 3x TELAR 9A310M1)',
    components: [
      { type: 'SA-11 Buk SR 9S18M1', name: 'SA-11 Snow Drift Radar', offsetX: 0, offsetY: 0 },
      { type: 'SA-11 Buk CC 9S470M1', name: 'SA-11 Command Post', offsetX: -30, offsetY: -20 },
      { type: 'SA-11 Buk LN 9A310M1', name: 'SA-11 TELAR #1', offsetX: 50, offsetY: 45 },
      { type: 'SA-11 Buk LN 9A310M1', name: 'SA-11 TELAR #2', offsetX: 60, offsetY: -40 },
      { type: 'SA-11 Buk LN 9A310M1', name: 'SA-11 TELAR #3', offsetX: -40, offsetY: 50 },
    ],
  },
  {
    id: 'sa15_tor_platoon',
    name: 'SA-15 Gauntlet (Tor-M1 Platoon)',
    shortName: 'SA-15 Tor-M1 (2x)',
    coalition: 'red',
    threatRadius: 12000,
    description: 'Autonomní protiletadlový raketový systém krátkého dosahu pro ochranu kolon a objektů',
    components: [
      { type: 'SA-15 Tor 9A331', name: 'SA-15 Tor-M1 #1', offsetX: -35, offsetY: 0 },
      { type: 'SA-15 Tor 9A331', name: 'SA-15 Tor-M1 #2', offsetX: 35, offsetY: 0 },
    ],
  },
  {
    id: 'tunguska_section',
    name: '2S6 Tunguska (SA-19 Grison Section)',
    shortName: '2S6 Tunguska (2x)',
    coalition: 'red',
    threatRadius: 8000,
    description: 'Kombinovaný kanónový a raketový systém SHORAD (2x 30mm + 8x rakety 9M311)',
    components: [
      { type: '2S6 Tunguska', name: '2S6 Tunguska #1', offsetX: -30, offsetY: 0 },
      { type: '2S6 Tunguska', name: '2S6 Tunguska #2', offsetX: 30, offsetY: 0 },
    ],
  },
];

export const SUPPORT_FLIGHT_TEMPLATES: SupportFlightTemplate[] = [
  // --- BLUE TANKERS & AWACS ---
  {
    id: 'kc135_boom',
    name: 'KC-135 Stratotanker (Boom - F-16, F-15, A-10)',
    type: 'KC-135',
    category: 'plane',
    coalition: 'blue',
    role: 'tanker',
    callsignName: 'Texaco 1-1',
    frequencyHz: 251000000, // 251.000 MHz
    tacan: { channel: 25, mode: 'Y', callsign: 'TKR' },
    altitudeM: 6096, // 20,000 ft (FL200)
    speedMs: 154,    // ~300 kts
    orbitLengthNm: 30,
    description: 'Tanker s tankovacím ráhnem (Boom) pro letouny USAF. TACAN 25Y (TKR), rádio 251.000 MHz, FL200.',
  },
  {
    id: 'kc135_mprs',
    name: 'KC-135 MPRS (Drogue - F/A-18, AV-8B)',
    type: 'KC135MPRS',
    category: 'plane',
    coalition: 'blue',
    role: 'tanker',
    callsignName: 'Arco 1-1',
    frequencyHz: 252000000, // 252.000 MHz
    tacan: { channel: 26, mode: 'Y', callsign: 'ARC' },
    altitudeM: 5486, // 18,000 ft (FL180)
    speedMs: 144,    // ~280 kts
    orbitLengthNm: 25,
    description: 'Tanker s koši (Drogue / Probe-and-Drogue) pro F/A-18C a AV-8B. TACAN 26Y (ARC), 252.000 MHz, FL180.',
  },
  {
    id: 'kc130_hercules',
    name: 'KC-130 Hercules (Drogue - Helikoptéry & Harrier)',
    type: 'KC-130',
    category: 'plane',
    coalition: 'blue',
    role: 'tanker',
    callsignName: 'Shell 1-1',
    frequencyHz: 253000000, // 253.000 MHz
    tacan: { channel: 27, mode: 'Y', callsign: 'SHL' },
    altitudeM: 3658, // 12,000 ft
    speedMs: 118,    // ~230 kts
    orbitLengthNm: 20,
    description: 'Turbovrtulový tanker pro nižší hladiny a pomalejší letouny. TACAN 27Y (SHL), 253.000 MHz, 12,000 ft.',
  },
  {
    id: 'e3a_awacs',
    name: 'E-3A Sentry AWACS (Magic)',
    type: 'E-3A',
    category: 'plane',
    coalition: 'blue',
    role: 'awacs',
    callsignName: 'Magic 1-1',
    frequencyHz: 255000000, // 255.000 MHz
    altitudeM: 8534, // 28,000 ft (FL280)
    speedMs: 165,    // ~320 kts
    orbitLengthNm: 40,
    description: 'Létající středisko včasné výstrahy a velení (AWACS). Rádio 255.000 MHz, FL280, 40 NM okruh.',
  },

  // --- RED TANKERS & AWACS ---
  {
    id: 'il78_midas',
    name: 'Il-78M Midas Tanker (Su-33, Su-27, MiG-29)',
    type: 'IL-78M',
    category: 'plane',
    coalition: 'red',
    role: 'tanker',
    callsignName: '901 (Buran)',
    frequencyHz: 130000000, // 130.000 MHz
    altitudeM: 5486, // 18,000 ft
    speedMs: 144,    // ~280 kts
    orbitLengthNm: 30,
    description: 'Dálkový tankovací letoun pro východní stíhačky. Frekvence 130.000 MHz, FL180.',
  },
  {
    id: 'a50_awacs',
    name: 'A-50 Mainstay AWACS (Grozny)',
    type: 'A-50',
    category: 'plane',
    coalition: 'red',
    role: 'awacs',
    callsignName: '905 (Grozny)',
    frequencyHz: 133000000, // 133.000 MHz
    altitudeM: 7925, // 26,000 ft (FL260)
    speedMs: 165,    // ~320 kts
    orbitLengthNm: 35,
    description: 'Východní radarové letadlo včasné výstrahy (AWACS). Frekvence 133.000 MHz, FL260.',
  },
];

/**
 * Creates a complete SAM Battery Group from a template at the specified location
 */
export function createSamBatteryGroup(
  template: SamBatteryTemplate,
  theater: Theater,
  centerLat: number,
  centerLon: number,
  groupId: number,
  startUnitId: number
): Group {
  const centerDcs = latLonToDcs(theater, centerLat, centerLon);

  const units: Unit[] = template.components.map((comp, idx) => {
    const uX = centerDcs.x + comp.offsetX;
    const uY = centerDcs.y + comp.offsetY;
    // Offset lat/lon approx (1 deg lat ~= 111,000m, 1 deg lon ~= 80,000m)
    const uLat = centerLat + comp.offsetX / 111000;
    const uLon = centerLon + comp.offsetY / (111000 * Math.cos((centerLat * Math.PI) / 180));

    return {
      unitId: startUnitId + idx,
      name: `${template.shortName} - ${comp.name} #${startUnitId + idx}`,
      type: comp.type,
      skill: 'Excellent',
      heading: 0,
      x: uX,
      y: uY,
      lat: uLat,
      lon: uLon,
      alt: 0,
    };
  });

  return {
    groupId,
    name: `${template.name} #${groupId}`,
    category: 'vehicle',
    coalition: template.coalition,
    countryId: template.coalition === 'blue' ? 2 : 0,
    countryName: template.coalition === 'blue' ? 'USA' : 'Russia',
    units,
    route: {
      points: [
        {
          id: 1,
          name: 'Site Center',
          x: centerDcs.x,
          y: centerDcs.y,
          lat: centerLat,
          lon: centerLon,
          alt: 0,
          speed: 0,
          action: 'Off Road',
          type: 'Turning Point',
        },
      ],
    },
  };
}

/**
 * Creates a complete Support Flight (Tanker or AWACS) with Racetrack Orbit & DCS ComboTasks
 */
export function createSupportFlightGroup(
  template: SupportFlightTemplate,
  theater: Theater,
  anchorLat: number,
  anchorLon: number,
  groupId: number,
  unitId: number
): Group {
  const anchorDcs = latLonToDcs(theater, anchorLat, anchorLon);

  // Orbit endpoint offset (East by orbitLengthNm, 1 NM = 1852m)
  const offsetMeters = template.orbitLengthNm * 1852;
  const endDcs = {
    x: anchorDcs.x,
    y: anchorDcs.y + offsetMeters,
  };
  const endLon = anchorLon + offsetMeters / (111000 * Math.cos((anchorLat * Math.PI) / 180));
  const endLat = anchorLat;

  // Build DCS Waypoint Tasks
  const comboTasks: any[] = [];
  let taskNum = 1;

  // 1. TACAN Beacon task if tanker
  if (template.tacan) {
    comboTasks.push({
      number: taskNum++,
      auto: false,
      id: 'WrappedAction',
      enabled: true,
      action: {
        id: 'ActivateBeacon',
        params: {
          type: 4, // TACAN
          system: 3,
          callsign: template.tacan.callsign,
          channel: template.tacan.channel,
          modeChannel: template.tacan.mode,
          bearing: true,
          frequency: 1175000000,
        },
      },
    });
  }

  // 2. AWACS / Tanker task
  if (template.role === 'tanker') {
    comboTasks.push({
      number: taskNum++,
      auto: false,
      id: 'Tanker',
      enabled: true,
      params: {},
    });
  } else if (template.role === 'awacs') {
    comboTasks.push({
      number: taskNum++,
      auto: false,
      id: 'AWACS',
      enabled: true,
      params: {},
    });
  }

  // 3. Racetrack Orbit task
  comboTasks.push({
    number: taskNum++,
    auto: false,
    id: 'Orbit',
    enabled: true,
    params: {
      pattern: 'Race-Track',
      speed: template.speedMs,
      altitude: template.altitudeM,
    },
  });

  const waypoints: Waypoint[] = [
    {
      id: 1,
      name: `WP 1 - Anchor (${template.callsignName})`,
      x: anchorDcs.x,
      y: anchorDcs.y,
      lat: anchorLat,
      lon: anchorLon,
      alt: template.altitudeM,
      alt_type: 'BARO',
      speed: template.speedMs,
      action: 'Turning Point',
      type: 'Turning Point',
      task: {
        id: 'ComboTask',
        params: {
          tasks: comboTasks,
        },
      },
    },
    {
      id: 2,
      name: `WP 2 - Orbit Turn (${template.orbitLengthNm} NM)`,
      x: endDcs.x,
      y: endDcs.y,
      lat: endLat,
      lon: endLon,
      alt: template.altitudeM,
      alt_type: 'BARO',
      speed: template.speedMs,
      action: 'Turning Point',
      type: 'Turning Point',
    },
  ];

  const unit: Unit = {
    unitId,
    name: `${template.callsignName} #${unitId}`,
    type: template.type,
    skill: 'Excellent',
    heading: 1.57, // East
    x: anchorDcs.x,
    y: anchorDcs.y,
    lat: anchorLat,
    lon: anchorLon,
    alt: template.altitudeM,
    speed: template.speedMs,
    radio: {
      frequency: template.frequencyHz,
      modulation: 0, // AM
    },
    callsign: {
      [1]: 1,
      [2]: 1,
      [3]: 1,
      name: template.callsignName,
    },
  };

  return {
    groupId,
    name: `${template.name} #${groupId}`,
    category: 'plane',
    coalition: template.coalition,
    countryId: template.coalition === 'blue' ? 2 : 0,
    countryName: template.coalition === 'blue' ? 'USA' : 'Russia',
    units: [unit],
    route: {
      points: waypoints,
    },
  };
}

export const CARRIER_GROUP_TEMPLATES: CarrierGroupTemplate[] = [
  // --- BLUE CSG (SUPERCARRIER & TARAWA) ---
  {
    id: 'cvn71_roosevelt_csg',
    name: 'USS Theodore Roosevelt CSG (CVN-71 Supercarrier)',
    shortName: 'CVN-71 Roosevelt CSG',
    carrierType: 'CVN_71',
    carrierName: 'USS Theodore Roosevelt',
    coalition: 'blue',
    isSupercarrier: true,
    tacan: { channel: 71, mode: 'X', callsign: 'ROO' },
    icls: { channel: 11 },
    link4: { frequencyHz: 336000000 },
    atcFrequencyHz: 127500000, // 127.500 MHz
    speedKnots: 25,
    routeLengthNm: 60,
    defaultBrcDeg: 270,
    includeRescueHeli: true,
    rescueHeliType: 'SH-60B',
    description: 'Kompletní úderná skupina Supercarrier (CVN-71) s animovanou posádkou paluby, křižníkem Ticonderoga, 2 torpédoborci Arleigh Burke, fregatou Perry a záchranným vrtulníkem Pedro (Plane Guard).',
    escorts: [
      { type: 'TICONDEROG', name: 'USS Normandy (CG-60)', role: 'Aegis Air Defense Cruiser', offsetX: 3800, offsetY: 800 },
      { type: 'ArleighBurke', name: 'USS Arleigh Burke (DDG-51)', role: 'Guided Missile Destroyer', offsetX: 1600, offsetY: 2600 },
      { type: 'ArleighBurke', name: 'USS Higgins (DDG-76)', role: 'Guided Missile Destroyer', offsetX: 1600, offsetY: -2600 },
      { type: 'PERRY', name: 'USS Ingraham (FFG-61)', role: 'ASW Frigate', offsetX: -3600, offsetY: 0 },
    ],
  },
  {
    id: 'cvn73_washington_csg',
    name: 'USS George Washington CSG (CVN-73 Supercarrier)',
    shortName: 'CVN-73 Washington CSG',
    carrierType: 'CVN_73',
    carrierName: 'USS George Washington',
    coalition: 'blue',
    isSupercarrier: true,
    tacan: { channel: 73, mode: 'X', callsign: 'GW' },
    icls: { channel: 13 },
    link4: { frequencyHz: 337000000 },
    atcFrequencyHz: 128500000, // 128.500 MHz
    speedKnots: 25,
    routeLengthNm: 60,
    defaultBrcDeg: 270,
    includeRescueHeli: true,
    rescueHeliType: 'SH-60B',
    description: 'Úderný svaz Supercarrier (CVN-73) pro F/A-18C a F-14B/A. TACAN 73X (GW), ICLS 13, Link 4 337.000 MHz, křižník Ticonderoga a torpédoborce Arleigh Burke.',
    escorts: [
      { type: 'TICONDEROG', name: 'USS Cowpens (CG-63)', role: 'Aegis Air Defense Cruiser', offsetX: 3800, offsetY: -800 },
      { type: 'ArleighBurke', name: 'USS John S. McCain (DDG-56)', role: 'Guided Missile Destroyer', offsetX: 1600, offsetY: 2600 },
      { type: 'ArleighBurke', name: 'USS Mustin (DDG-89)', role: 'Guided Missile Destroyer', offsetX: 1600, offsetY: -2600 },
      { type: 'PERRY', name: 'USS Gary (FFG-51)', role: 'ASW Frigate', offsetX: -3600, offsetY: 0 },
    ],
  },
  {
    id: 'cvn75_truman_csg',
    name: 'USS Harry S. Truman CSG (CVN-75 Supercarrier)',
    shortName: 'CVN-75 Truman CSG',
    carrierType: 'CVN_75',
    carrierName: 'USS Harry S. Truman',
    coalition: 'blue',
    isSupercarrier: true,
    tacan: { channel: 75, mode: 'X', callsign: 'HST' },
    icls: { channel: 15 },
    link4: { frequencyHz: 338000000 },
    atcFrequencyHz: 129500000, // 129.500 MHz
    speedKnots: 25,
    routeLengthNm: 60,
    defaultBrcDeg: 270,
    includeRescueHeli: true,
    rescueHeliType: 'SH-60B',
    description: 'Supercarrier CVN-75 s plným doprovodem křižníku Aegis, dvojicí moderních torpédoborců Flight IIA a plavbou proti větru pro stabilní letové operace.',
    escorts: [
      { type: 'TICONDEROG', name: 'USS San Jacinto (CG-56)', role: 'Aegis Air Defense Cruiser', offsetX: 3800, offsetY: 800 },
      { type: 'ArleighBurke', name: 'USS Bulkeley (DDG-84)', role: 'Guided Missile Destroyer', offsetX: 1600, offsetY: 2600 },
      { type: 'ArleighBurke', name: 'USS Forrest Sherman (DDG-98)', role: 'Guided Missile Destroyer', offsetX: 1600, offsetY: -2600 },
      { type: 'PERRY', name: 'USS Simpson (FFG-56)', role: 'ASW Frigate', offsetX: -3600, offsetY: 0 },
    ],
  },
  {
    id: 'cvn72_lincoln_csg',
    name: 'USS Abraham Lincoln CSG (CVN-72 Supercarrier)',
    shortName: 'CVN-72 Lincoln CSG',
    carrierType: 'CVN_72',
    carrierName: 'USS Abraham Lincoln',
    coalition: 'blue',
    isSupercarrier: true,
    tacan: { channel: 72, mode: 'X', callsign: 'LCN' },
    icls: { channel: 12 },
    link4: { frequencyHz: 339000000 },
    atcFrequencyHz: 130500000, // 130.500 MHz
    speedKnots: 25,
    routeLengthNm: 60,
    defaultBrcDeg: 270,
    includeRescueHeli: true,
    rescueHeliType: 'SH-60B',
    description: 'Úderná skupina CVN-72 Lincoln se Supercarrier posádkou a doprovodem Ticonderoga a Arleigh Burke.',
    escorts: [
      { type: 'TICONDEROG', name: 'USS Mobile Bay (CG-53)', role: 'Aegis Air Defense Cruiser', offsetX: 3800, offsetY: 0 },
      { type: 'ArleighBurke', name: 'USS Spruance (DDG-111)', role: 'Guided Missile Destroyer', offsetX: 1600, offsetY: 2600 },
      { type: 'ArleighBurke', name: 'USS Michael Murphy (DDG-112)', role: 'Guided Missile Destroyer', offsetX: 1600, offsetY: -2600 },
    ],
  },
  {
    id: 'cvn74_stennis_csg',
    name: 'USS John C. Stennis CSG (CVN-74 Supercarrier / Base)',
    shortName: 'CVN-74 Stennis CSG',
    carrierType: 'CVN_74',
    carrierName: 'USS John C. Stennis',
    coalition: 'blue',
    isSupercarrier: true,
    tacan: { channel: 74, mode: 'X', callsign: 'STN' },
    icls: { channel: 14 },
    atcFrequencyHz: 127000000, // 127.000 MHz
    speedKnots: 25,
    routeLengthNm: 60,
    defaultBrcDeg: 270,
    includeRescueHeli: true,
    rescueHeliType: 'SH-60B',
    description: 'Klasický nosič CVN-74 kompatibilní se základním DCS i Supercarrier modulem. TACAN 74X (STN), ICLS 14, křižník a torpédoborec.',
    escorts: [
      { type: 'TICONDEROG', name: 'USS Lake Champlain (CG-57)', role: 'Aegis Air Defense Cruiser', offsetX: 3800, offsetY: 0 },
      { type: 'ArleighBurke', name: 'USS Decatur (DDG-73)', role: 'Guided Missile Destroyer', offsetX: 1600, offsetY: 2600 },
      { type: 'PERRY', name: 'USS Rodney M. Davis (FFG-60)', role: 'ASW Frigate', offsetX: -3600, offsetY: 0 },
    ],
  },
  {
    id: 'tarawa_arg',
    name: 'USS Tarawa Amphibious Ready Group (LHA-1 ARG)',
    shortName: 'LHA-1 Tarawa ARG',
    carrierType: 'LHA_Tarawa',
    carrierName: 'USS Tarawa',
    coalition: 'blue',
    isSupercarrier: false,
    tacan: { channel: 1, mode: 'X', callsign: 'TWR' },
    atcFrequencyHz: 127500000, // 127.500 MHz
    speedKnots: 20,
    routeLengthNm: 50,
    defaultBrcDeg: 270,
    includeRescueHeli: true,
    rescueHeliType: 'UH-1H',
    description: 'Výsadková skupina pro letouny s kolmým vzletem AV-8B Harrier a vrtulníky (UH-1H, AH-64D). Doprovod Ticonderoga a Arleigh Burke.',
    escorts: [
      { type: 'TICONDEROG', name: 'USS Mobile Bay (CG-53)', role: 'Air Defense Cruiser', offsetX: 3200, offsetY: 600 },
      { type: 'ArleighBurke', name: 'USS Arleigh Burke (DDG-51)', role: 'Destroyer', offsetX: 1400, offsetY: 2200 },
      { type: 'PERRY', name: 'USS Ford (FFG-54)', role: 'Frigate', offsetX: -3200, offsetY: 0 },
    ],
  },

  // --- RED CARRIER BATTLE GROUP ---
  {
    id: 'kuznetsov_cbg',
    name: 'Admiral Kuznetsov Carrier Battle Group (KUZ-063)',
    shortName: 'Admiral Kuznetsov CBG',
    carrierType: 'KUZNECOW',
    carrierName: 'Admiral Flota Sovetskogo Soyuza Kuznetsov',
    coalition: 'red',
    isSupercarrier: false,
    tacan: { channel: 0, mode: 'X', callsign: 'KUZ' },
    atcFrequencyHz: 127500000,
    speedKnots: 22,
    routeLengthNm: 50,
    defaultBrcDeg: 270,
    includeRescueHeli: true,
    rescueHeliType: 'Ka-27',
    description: 'Těžký letadlový křižník Admirál Kuzněcov pro palubní stíhačky Su-33 s doprovodem raketového křižníku Moskva (Slava-class), korvet Albatros a záchranným vrtulníkem Ka-27 Helix.',
    escorts: [
      { type: 'MOSKVA', name: 'Moskva (Slava-class Cruiser)', role: 'Heavy Guided Missile Cruiser', offsetX: 3500, offsetY: 1200 },
      { type: 'ALBATROS', name: 'MPK-118 Suzdalets (Grisha)', role: 'ASW Corvette', offsetX: 1500, offsetY: -2000 },
      { type: 'ALBATROS', name: 'MPK-199 Kasimov (Grisha)', role: 'ASW Corvette', offsetX: -2500, offsetY: 1800 },
    ],
  },
];

export interface CreatedCarrierStrikeGroupResult {
  carrierGroup: Group;
  rescueHeliGroup: Group | null;
  totalUnitsCount: number;
  totalGroupsCount: number;
}

/**
 * Creates a complete Carrier Strike Group (CSG) with Supercarrier/CVN, escorts, and optional Pedro rescue helicopter
 */
export function createCarrierStrikeGroup(
  template: CarrierGroupTemplate,
  theater: Theater,
  centerLat: number,
  centerLon: number,
  brcHeadingDeg: number,
  startGroupId: number,
  startUnitId: number
): CreatedCarrierStrikeGroupResult {
  const centerDcs = latLonToDcs(theater, centerLat, centerLon);
  const brcRad = (brcHeadingDeg * Math.PI) / 180;
  const cosH = Math.cos(brcRad);
  const sinH = Math.sin(brcRad);

  const speedMs = template.speedKnots * 0.514444; // knots to m/s
  const routeMeters = template.routeLengthNm * 1852; // NM to meters

  let currentUnitId = startUnitId;
  const carrierUnitId = currentUnitId++;

  // 1. Carrier Lead Unit
  const carrierUnit: Unit = {
    unitId: carrierUnitId,
    name: `${template.carrierName} #${carrierUnitId}`,
    type: template.carrierType,
    skill: 'Excellent',
    heading: brcRad,
    x: centerDcs.x,
    y: centerDcs.y,
    lat: centerLat,
    lon: centerLon,
    alt: 0,
    speed: speedMs,
    radio: {
      frequency: template.atcFrequencyHz,
      modulation: 0, // AM
    },
    callsign: {
      [1]: 1,
      [2]: 1,
      [3]: 1,
      name: template.tacan.callsign,
    },
  };

  // 2. Escort Units
  const escortUnits: Unit[] = template.escorts.map((escort) => {
    const uId = currentUnitId++;
    // Rotate offset by carrier BRC heading
    const dcsX = centerDcs.x + escort.offsetX * cosH - escort.offsetY * sinH;
    const dcsY = centerDcs.y + escort.offsetX * sinH + escort.offsetY * cosH;
    const pos = dcsToLatLon(theater, dcsX, dcsY);

    return {
      unitId: uId,
      name: `${escort.name} #${uId}`,
      type: escort.type,
      skill: 'Excellent',
      heading: brcRad,
      x: dcsX,
      y: dcsY,
      lat: pos.lat,
      lon: pos.lon,
      alt: 0,
      speed: speedMs,
      radio: {
        frequency: template.atcFrequencyHz,
        modulation: 0,
      },
    };
  });

  const allShipUnits = [carrierUnit, ...escortUnits];

  // 3. Carrier Waypoints & Tasks (TACAN, ICLS, Link 4)
  const carrierTasks: any[] = [];
  let taskNum = 1;

  // TACAN
  if (template.tacan && template.tacan.channel > 0) {
    carrierTasks.push({
      number: taskNum++,
      auto: false,
      id: 'WrappedAction',
      enabled: true,
      action: {
        id: 'ActivateBeacon',
        params: {
          type: 4, // TACAN
          system: 3,
          channel: template.tacan.channel,
          modeChannel: template.tacan.mode,
          callsign: template.tacan.callsign,
          bearing: true,
          frequency: 1030000000,
        },
      },
    });
  }

  // ICLS (Supercarrier Instrument Carrier Landing System)
  if (template.icls) {
    carrierTasks.push({
      number: taskNum++,
      auto: false,
      id: 'WrappedAction',
      enabled: true,
      action: {
        id: 'ActivateICLS',
        params: {
          type: 131072,
          channel: template.icls.channel,
          unitId: carrierUnitId,
        },
      },
    });
  }

  // Link 4 Datalink (F-14 Tomcat / F/A-18C Hornet)
  if (template.link4) {
    carrierTasks.push({
      number: taskNum++,
      auto: false,
      id: 'WrappedAction',
      enabled: true,
      action: {
        id: 'ActivateLink4',
        params: {
          frequency: template.link4.frequencyHz,
        },
      },
    });
  }

  // Endpoint along BRC
  const endDcsX = centerDcs.x + routeMeters * cosH;
  const endDcsY = centerDcs.y + routeMeters * sinH;
  const endPos = dcsToLatLon(theater, endDcsX, endDcsY);

  const waypoints: Waypoint[] = [
    {
      id: 1,
      name: `WP 1 - BRC Anchor (${template.carrierName})`,
      x: centerDcs.x,
      y: centerDcs.y,
      lat: centerLat,
      lon: centerLon,
      alt: 0,
      alt_type: 'BARO',
      speed: speedMs,
      action: 'Turning Point',
      type: 'Turning Point',
      task: {
        id: 'ComboTask',
        params: {
          tasks: carrierTasks,
        },
      },
    },
    {
      id: 2,
      name: `WP 2 - Recovery Leg End (${template.routeLengthNm} NM @ ${template.speedKnots} kts)`,
      x: endDcsX,
      y: endDcsY,
      lat: endPos.lat,
      lon: endPos.lon,
      alt: 0,
      alt_type: 'BARO',
      speed: speedMs,
      action: 'Turning Point',
      type: 'Turning Point',
    },
  ];

  const carrierGroupId = startGroupId;
  const carrierGroup: Group = {
    groupId: carrierGroupId,
    name: `${template.name} #${carrierGroupId}`,
    category: 'ship',
    coalition: template.coalition,
    countryId: template.coalition === 'blue' ? 2 : 0,
    countryName: template.coalition === 'blue' ? 'USA' : 'Russia',
    units: allShipUnits,
    route: {
      points: waypoints,
    },
  };

  // 4. Rescue Helicopter (Pedro / Plane Guard)
  let rescueHeliGroup: Group | null = null;
  if (template.includeRescueHeli) {
    const heliGroupId = startGroupId + 1;
    const heliUnitId = currentUnitId++;
    const heliType = template.rescueHeliType || (template.coalition === 'blue' ? 'SH-60B' : 'Ka-27');

    // Stationed 600m forward and 450m starboard of the carrier
    const heliDcsX = centerDcs.x + 600 * cosH - 450 * sinH;
    const heliDcsY = centerDcs.y + 600 * sinH + 450 * cosH;
    const heliPos = dcsToLatLon(theater, heliDcsX, heliDcsY);

    const heliEndDcsX = heliDcsX + routeMeters * cosH;
    const heliEndDcsY = heliDcsY + routeMeters * sinH;
    const heliEndPos = dcsToLatLon(theater, heliEndDcsX, heliEndDcsY);

    const heliUnit: Unit = {
      unitId: heliUnitId,
      name: `Pedro 1-1 (${heliType} Plane Guard) #${heliUnitId}`,
      type: heliType,
      skill: 'Excellent',
      heading: brcRad,
      x: heliDcsX,
      y: heliDcsY,
      lat: heliPos.lat,
      lon: heliPos.lon,
      alt: 60, // 200 ft MSL
      speed: speedMs,
      radio: {
        frequency: template.atcFrequencyHz,
        modulation: 0,
      },
      callsign: {
        [1]: 1,
        [2]: 1,
        [3]: 1,
        name: 'Pedro 1-1',
      },
    };

    rescueHeliGroup = {
      groupId: heliGroupId,
      name: `Pedro 1-1 Plane Guard (${template.shortName}) #${heliGroupId}`,
      category: 'helicopter',
      coalition: template.coalition,
      countryId: template.coalition === 'blue' ? 2 : 0,
      countryName: template.coalition === 'blue' ? 'USA' : 'Russia',
      units: [heliUnit],
      route: {
        points: [
          {
            id: 1,
            name: `WP 1 - Plane Guard Station (${template.carrierName})`,
            x: heliDcsX,
            y: heliDcsY,
            lat: heliPos.lat,
            lon: heliPos.lon,
            alt: 60,
            alt_type: 'RADIO',
            speed: speedMs,
            action: 'Turning Point',
            type: 'Turning Point',
          },
          {
            id: 2,
            name: `WP 2 - Plane Guard Recovery End`,
            x: heliEndDcsX,
            y: heliEndDcsY,
            lat: heliEndPos.lat,
            lon: heliEndPos.lon,
            alt: 60,
            alt_type: 'RADIO',
            speed: speedMs,
            action: 'Turning Point',
            type: 'Turning Point',
          },
        ],
      },
    };
  }

  const totalGroups = rescueHeliGroup ? 2 : 1;
  const totalUnits = allShipUnits.length + (rescueHeliGroup ? 1 : 0);

  return {
    carrierGroup,
    rescueHeliGroup,
    totalUnitsCount: totalUnits,
    totalGroupsCount: totalGroups,
  };
}
