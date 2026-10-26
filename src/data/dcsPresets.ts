import type { Group, Theater, Unit, Waypoint } from '../types/dcs';
import { latLonToDcs } from '../utils/coordinates';

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
