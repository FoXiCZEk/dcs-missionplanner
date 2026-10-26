export type Theater = 'Caucasus' | 'Syria';

export type CoalitionType = 'blue' | 'red' | 'neutrals';

export type UnitSkill = 'Client' | 'Player' | 'Excellent' | 'High' | 'Good' | 'Average';

export type UnitCategory = 'plane' | 'helicopter' | 'vehicle' | 'ship' | 'static';

export interface WaypointTaskItem {
  id: string; // e.g. 'WrappedAction', 'Orbit', 'NoTask'
  number: number;
  auto: boolean;
  name?: string;
  enabled: boolean;
  params: Record<string, any>;
}

export interface Waypoint {
  id: number;
  name?: string;
  x: number; // DCS X (Northing, meters)
  y: number; // DCS Y (Easting, meters)
  lat: number;
  lon: number;
  alt: number; // meters
  alt_type?: 'BARO' | 'RADIO'; // Barometric MSL vs Radar AGL
  speed: number; // m/s
  action: string;
  type: string;
  formation?: string;
  task?: {
    id: 'ComboTask';
    params: {
      tasks: any[];
    };
  };
}

export interface Unit {
  unitId: number;
  name: string;
  type: string;
  skill: UnitSkill;
  heading: number; // radians (0 to 2*PI, 0 = North, PI/2 = East)
  x: number;
  y: number;
  lat: number;
  lon: number;
  alt: number;
  speed?: number;
  livery_id?: string;
  on_board_num?: string;
  callsign?: {
    [key: number]: number | string;
    name?: string;
  };
  radio?: {
    frequency: number; // MHz or Hz
    modulation: number; // 0 = AM, 1 = FM
  };
  payload?: {
    pylons?: { [pylonId: number]: { clsid: string } };
    fuel?: number;
    flare?: number;
    chaff?: number;
    gun?: number;
  };
}

export interface Group {
  groupId: number;
  name: string;
  category: UnitCategory;
  coalition: CoalitionType;
  countryId: number;
  countryName: string;
  units: Unit[];
  route: {
    points: Waypoint[];
  };
  hidden?: boolean;
  uncontrolled?: boolean;
}

export interface TriggerZone {
  zoneId: number;
  name: string;
  x: number; // DCS X
  y: number; // DCS Y
  lat: number;
  lon: number;
  radius: number; // meters
  color: [number, number, number, number]; // [r, g, b, a] 0-1
  type?: number; // 0 = circle, 2 = polygon
  verticies?: { x: number; y: number }[];
}

export type TriggerType = 'ONCE' | 'MISSION START' | 'REPETITIVE' | 'TIME MORE';
export type TriggerEvent = 'NONE' | 'ON CRASH' | 'ON EJECT' | 'ON KILL' | 'ON SHOT' | 'ON TAKEOFF' | 'ON LAND';

export type ConditionRuleType =
  | 'FLAG_IS_TRUE'
  | 'FLAG_IS_FALSE'
  | 'FLAG_MORE'
  | 'FLAG_LESS'
  | 'FLAG_EQUALS'
  | 'UNIT_INSIDE_ZONE'
  | 'UNIT_OUTSIDE_ZONE'
  | 'PART_OF_COALITION_IN_ZONE'
  | 'ALL_OF_COALITION_IN_ZONE'
  | 'TIME_MORE'
  | 'TIME_SINCE_FLAG'
  | 'LUA_PREDICATE'
  | 'RANDOM';

export interface TriggerCondition {
  id: string;
  type: ConditionRuleType;
  flag?: string;
  value?: number;
  unit?: string;
  zone?: string;
  coalition?: CoalitionType;
  luaCode?: string;
  seconds?: number;
  percent?: number;
}

export type ActionRuleType =
  | 'DO_SCRIPT'
  | 'DO_SCRIPT_FILE'
  | 'MESSAGE_TO_ALL'
  | 'MESSAGE_TO_COALITION'
  | 'FLAG_SET'
  | 'FLAG_OFF'
  | 'FLAG_INCREASE'
  | 'FLAG_DECREASE'
  | 'GROUP_ACTIVATE'
  | 'GROUP_DEACTIVATE'
  | 'SOUND_TO_ALL'
  | 'SMOKE'
  | 'FLARE';

export interface TriggerAction {
  id: string;
  type: ActionRuleType;
  script?: string;
  file?: string;
  message?: string;
  duration?: number;
  flag?: string;
  value?: number;
  group?: string;
  coalition?: CoalitionType;
  zone?: string;
  color?: string;
}

export interface MissionTrigger {
  id: string;
  name: string;
  type: TriggerType;
  event: TriggerEvent;
  conditions: TriggerCondition[];
  actions: TriggerAction[];
  enabled: boolean;
}

export interface MissionScriptFile {
  name: string;
  content: string;
  size?: number;
  lastModified?: number;
}

export interface AirbaseInfo {
  id: string;
  name: string;
  lat: number;
  lon: number;
  runway: string;
  tacan?: string;
  ils?: string;
  atc?: string;
  elevation: number; // meters
}

export interface WeatherSettings {
  atmosphere_type: number;
  wind: {
    atGround: { speed: number; dir: number };
    at2000: { speed: number; dir: number };
    at8000: { speed: number; dir: number };
  };
  season: {
    temperature: number; // Celsius
  };
  clouds: {
    thickness: number;
    density: number; // 0 to 8
    base: number; // meters
    iprecptns: number; // 0 = None, 1 = Rain, 2 = Thunderstorm, etc.
  };
  visibility: {
    distance: number; // meters
  };
  qnh: number; // mmHg (e.g. 760)
}

export interface MissionData {
  theatre: Theater;
  title: string;
  description: string;
  descriptionBlue: string;
  descriptionRed: string;
  date: {
    year: number;
    month: number;
    day: number;
  };
  startTime: number; // seconds from 00:00:00 (e.g. 28800 = 08:00)
  weather: WeatherSettings;
  zones: TriggerZone[];
  triggers: MissionTrigger[];
  groups: Group[];
  scriptFiles: MissionScriptFile[];
  nextId: {
    groupId: number;
    unitId: number;
    zoneId: number;
  };
}
