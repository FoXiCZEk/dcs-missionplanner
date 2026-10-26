export interface WeaponItem {
  clsid: string;
  name: string;
  category: 'A2A' | 'A2G_GUIDED' | 'A2G_UNGUIDED' | 'POD' | 'FUEL' | 'EMPTY';
  weightKg: number;
  description?: string;
}

export const COMMON_WEAPONS: Record<string, WeaponItem> = {
  EMPTY: { clsid: '<CLEAN>', name: 'Prázdný závěsník (Clean)', category: 'EMPTY', weightKg: 0 },

  // Air to Air - Western
  AIM_9X: { clsid: '{4B26C8D7-E7A9-4A7B-9D06-03F678E20E2F}', name: 'AIM-9X Sidewinder (High-Off-Boresight IR)', category: 'A2A', weightKg: 85 },
  AIM_9M: { clsid: 'AIM-9M', name: 'AIM-9M Sidewinder (All-Aspect IR)', category: 'A2A', weightKg: 86 },
  AIM_120C: { clsid: '{AIM-120C}', name: 'AIM-120C AMRAAM (Active Radar BVR)', category: 'A2A', weightKg: 156 },
  AIM_120B: { clsid: 'AIM-120B', name: 'AIM-120B AMRAAM (Active Radar BVR)', category: 'A2A', weightKg: 157 },
  AIM_7M: { clsid: 'AIM-7M', name: 'AIM-7M Sparrow (Semi-Active Radar)', category: 'A2A', weightKg: 231 },
  AIM_54C: { clsid: '{AIM-54C}', name: 'AIM-54C Phoenix (Long Range Active Radar)', category: 'A2A', weightKg: 463 },

  // Air to Air - Eastern
  R_73: { clsid: '{BCE429E8-3CDE-4856-AA51-508780E8842F}', name: 'R-73 (AA-11 Archer Dogfight IR)', category: 'A2A', weightKg: 105 },
  R_27ER: { clsid: '{R-27ER}', name: 'R-27ER (AA-10 Alamo-C Radar BVR)', category: 'A2A', weightKg: 350 },
  R_27ET: { clsid: '{R-27ET}', name: 'R-27ET (AA-10 Alamo-D Long Range IR)', category: 'A2A', weightKg: 343 },
  R_77: { clsid: '{R-77}', name: 'R-77 (AA-12 Adder Active Radar)', category: 'A2A', weightKg: 175 },
  R_60M: { clsid: '{R-60M}', name: 'R-60M (AA-8 Aphid Close IR)', category: 'A2A', weightKg: 44 },

  // Air to Ground Guided - Western
  GBU_12: { clsid: '{GBU-12}', name: 'GBU-12 Paveway II (500 lb Laser)', category: 'A2G_GUIDED', weightKg: 275 },
  GBU_38: { clsid: '{GBU-38}', name: 'GBU-38 JDAM (500 lb INS/GPS)', category: 'A2G_GUIDED', weightKg: 250 },
  GBU_31: { clsid: '{GBU-31}', name: 'GBU-31 JDAM (2000 lb Penetrator GPS)', category: 'A2G_GUIDED', weightKg: 950 },
  GBU_10: { clsid: '{GBU-10}', name: 'GBU-10 Paveway II (2000 lb Laser)', category: 'A2G_GUIDED', weightKg: 940 },
  GBU_24: { clsid: '{GBU-24}', name: 'GBU-24 Paveway III (2000 lb Low-Level Laser)', category: 'A2G_GUIDED', weightKg: 1050 },
  AGM_65D: { clsid: '{AGM-65D}', name: 'AGM-65D Maverick (Infrared Imaging)', category: 'A2G_GUIDED', weightKg: 220 },
  AGM_65E: { clsid: '{AGM-65E}', name: 'AGM-65E Maverick (Laser Guided)', category: 'A2G_GUIDED', weightKg: 290 },
  AGM_65H: { clsid: '{AGM-65H}', name: 'AGM-65H Maverick (CCD Optical)', category: 'A2G_GUIDED', weightKg: 215 },
  AGM_88C: { clsid: '{AGM-88C}', name: 'AGM-88C HARM (Anti-Radiation Radar Killer)', category: 'A2G_GUIDED', weightKg: 360 },
  AGM_84D: { clsid: '{AGM-84D}', name: 'AGM-84D Harpoon (Anti-Ship Cruise)', category: 'A2G_GUIDED', weightKg: 540 },
  AGM_84H: { clsid: '{AGM-84H}', name: 'AGM-84H SLAM-ER (Standoff Land Attack)', category: 'A2G_GUIDED', weightKg: 680 },
  AGM_154C: { clsid: '{AGM-154C}', name: 'AGM-154C JSOW (Glide Weapon)', category: 'A2G_GUIDED', weightKg: 485 },
  AGM_114K: { clsid: '{AGM-114K}', name: 'AGM-114K Hellfire (Semi-Active Laser)', category: 'A2G_GUIDED', weightKg: 48 },

  // Air to Ground Guided - Eastern
  VIKHR: { clsid: '{9A4172}', name: '9A4172 Vikhr (AT-16 Scallion Beam-Rider)', category: 'A2G_GUIDED', weightKg: 59 },
  KH_25ML: { clsid: '{KH-25ML}', name: 'Kh-25ML (AS-10 Karen Laser)', category: 'A2G_GUIDED', weightKg: 300 },
  KH_29T: { clsid: '{KH-29T}', name: 'Kh-29T (AS-14 Kedge TV Guided)', category: 'A2G_GUIDED', weightKg: 680 },
  KH_58: { clsid: '{KH-58}', name: 'Kh-58U (AS-11 Kilter Anti-Radiation)', category: 'A2G_GUIDED', weightKg: 640 },

  // Air to Ground Unguided & Rockets
  MK_82: { clsid: '{BCE429E8-3CDE-4856-AA51-508780E88482}', name: 'Mk-82 (500 lb LDGP Free-Fall)', category: 'A2G_UNGUIDED', weightKg: 241 },
  MK_82AIR: { clsid: '{BCE429E8-3CDE-4856-AA51-508780E88483}', name: 'Mk-82 AIR (500 lb Ballute High-Drag)', category: 'A2G_UNGUIDED', weightKg: 245 },
  MK_83: { clsid: '{BCE429E8-3CDE-4856-AA51-508780E88483}', name: 'Mk-83 (1000 lb LDGP Free-Fall)', category: 'A2G_UNGUIDED', weightKg: 450 },
  MK_84: { clsid: '{BCE429E8-3CDE-4856-AA51-508780E88484}', name: 'Mk-84 (2000 lb LDGP Heavy)', category: 'A2G_UNGUIDED', weightKg: 900 },
  CBU_97: { clsid: '{CBU-97}', name: 'CBU-97 SFW (Sensor Fuzed Armor Cluster)', category: 'A2G_UNGUIDED', weightKg: 420 },
  HYDRA_70: { clsid: '{HYDRA-70}', name: 'LAU-68 (7x Hydra 70 M151 HE)', category: 'A2G_UNGUIDED', weightKg: 100 },
  HYDRA_19: { clsid: '{LAU-61}', name: 'LAU-61 (19x Hydra 70 HE)', category: 'A2G_UNGUIDED', weightKg: 230 },
  S_8: { clsid: '{B-8M1}', name: 'B-8M1 (20x S-8 80mm Unguided Rockets)', category: 'A2G_UNGUIDED', weightKg: 160 },
  FAB_250: { clsid: '{FAB-250}', name: 'FAB-250 (250 kg HE Bomb)', category: 'A2G_UNGUIDED', weightKg: 250 },
  FAB_500: { clsid: '{FAB-500}', name: 'FAB-500 (500 kg HE Bomb)', category: 'A2G_UNGUIDED', weightKg: 500 },

  // Pods & Sensors
  LITENING: { clsid: '{AN_AAQ_28}', name: 'AN/AAQ-28 Litening Targeting Pod', category: 'POD', weightKg: 200 },
  ATFLIR: { clsid: '{ATFLIR}', name: 'AN/ASQ-228 ATFLIR FLIR/Laser Pod', category: 'POD', weightKg: 190 },
  SNIPER: { clsid: '{SNIPER_XR}', name: 'Sniper Advanced Targeting Pod', category: 'POD', weightKg: 202 },
  HTS_POD: { clsid: '{AN_ASQ_213}', name: 'AN/ASQ-213 HARM Targeting System (HTS)', category: 'POD', weightKg: 45 },
  ALQ_184: { clsid: '{AN_ALQ_184}', name: 'AN/ALQ-184 ECM Jamming Pod', category: 'POD', weightKg: 210 },
  ALQ_131: { clsid: '{AN_ALQ_131}', name: 'AN/ALQ-131 Deep ECM Pod', category: 'POD', weightKg: 260 },
  SMOKE_POD: { clsid: '{SMOKE_WHITE}', name: 'Smoke Generator Pod (White)', category: 'POD', weightKg: 35 },

  // Fuel Tanks
  TANK_330G: { clsid: '{FPU-8A}', name: '330 Gal External Fuel Tank (F/A-18)', category: 'FUEL', weightKg: 1050 },
  TANK_370G: { clsid: '{FPU-12}', name: '370 Gal Wing External Fuel Tank (F-16)', category: 'FUEL', weightKg: 1170 },
  TANK_300G: { clsid: '{FPU-11}', name: '300 Gal Centerline Fuel Tank (F-16)', category: 'FUEL', weightKg: 950 },
  TANK_600G: { clsid: '{FPU-13}', name: '600 Gal Heavy External Fuel Tank (F-15)', category: 'FUEL', weightKg: 1850 },
  TANK_600G_A10: { clsid: '{TK-600}', name: '600 Gal Fuel Tank (A-10C)', category: 'FUEL', weightKg: 1850 },
  TANK_800L: { clsid: '{PTB-800}', name: 'PTB-800 External Fuel Tank (800 L)', category: 'FUEL', weightKg: 700 },
  TANK_1150L: { clsid: '{PTB-1150}', name: 'PTB-1150 External Fuel Tank (1150 L)', category: 'FUEL', weightKg: 980 },
};

export interface PylonDefinition {
  station: number;
  name: string;
  allowedCategories: WeaponItem['category'][];
  defaultWeapon?: WeaponItem;
}

export interface AircraftLoadoutProfile {
  type: string;
  displayName: string;
  emptyWeightKg: number;
  maxGrossWeightKg: number;
  maxFuelKg: number;
  maxFlares: number;
  maxChaff: number;
  hasGun: boolean;
  gunMaxRounds?: number;
  pylons: PylonDefinition[];
  presets: {
    id: string;
    name: string;
    description: string;
    pylons: { [station: number]: WeaponItem };
  }[];
}

export const AIRCRAFT_LOADOUT_PROFILES: Record<string, AircraftLoadoutProfile> = {
  'F/A-18C_hornet': {
    type: 'F/A-18C_hornet',
    displayName: 'F/A-18C Hornet',
    emptyWeightKg: 10455,
    maxGrossWeightKg: 23541,
    maxFuelKg: 4900,
    maxFlares: 60,
    maxChaff: 60,
    hasGun: true,
    gunMaxRounds: 578,
    pylons: [
      { station: 1, name: 'Sta 1 (Left Wingtip)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_9X },
      { station: 2, name: 'Sta 2 (Left Outboard)', allowedCategories: ['A2A', 'A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_120C },
      { station: 3, name: 'Sta 3 (Left Inboard)', allowedCategories: ['A2A', 'A2G_GUIDED', 'A2G_UNGUIDED', 'FUEL', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.TANK_330G },
      { station: 4, name: 'Sta 4 (Left Cheek)', allowedCategories: ['A2A', 'POD', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.ATFLIR },
      { station: 5, name: 'Sta 5 (Centerline)', allowedCategories: ['FUEL', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.TANK_330G },
      { station: 6, name: 'Sta 6 (Right Cheek)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_120C },
      { station: 7, name: 'Sta 7 (Right Inboard)', allowedCategories: ['A2A', 'A2G_GUIDED', 'A2G_UNGUIDED', 'FUEL', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.TANK_330G },
      { station: 8, name: 'Sta 8 (Right Outboard)', allowedCategories: ['A2A', 'A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_120C },
      { station: 9, name: 'Sta 9 (Right Wingtip)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_9X },
    ],
    presets: [
      {
        id: 'cap',
        name: 'CAP / Air Superiority (6x AMRAAM + 2x Sidewinder)',
        description: 'Vzdušná nadvláda pro stíhací hlídku: 2x AIM-9X, 6x AIM-120C, 1x přídavná nádrž',
        pylons: {
          1: COMMON_WEAPONS.AIM_9X,
          2: COMMON_WEAPONS.AIM_120C,
          3: COMMON_WEAPONS.AIM_120C,
          4: COMMON_WEAPONS.AIM_120C,
          5: COMMON_WEAPONS.TANK_330G,
          6: COMMON_WEAPONS.AIM_120C,
          7: COMMON_WEAPONS.AIM_120C,
          8: COMMON_WEAPONS.AIM_120C,
          9: COMMON_WEAPONS.AIM_9X,
        },
      },
      {
        id: 'cas',
        name: 'CAS / Precision Strike (GBU-12 + Maverick + ATFLIR)',
        description: 'Podpora pozemních sil: Laserem naváděné pumy GBU-12, AGM-65E Maverick, ATFLIR pod',
        pylons: {
          1: COMMON_WEAPONS.AIM_9X,
          2: COMMON_WEAPONS.GBU_12,
          3: COMMON_WEAPONS.TANK_330G,
          4: COMMON_WEAPONS.ATFLIR,
          5: COMMON_WEAPONS.TANK_330G,
          6: COMMON_WEAPONS.AIM_120C,
          7: COMMON_WEAPONS.AGM_65E,
          8: COMMON_WEAPONS.GBU_12,
          9: COMMON_WEAPONS.AIM_9X,
        },
      },
      {
        id: 'sead',
        name: 'SEAD / DEAD (2x HARM + 2x AMRAAM + Tanks)',
        description: 'Potlačení nepřátelské PVO: 2x AGM-88C HARM, AIM-120C, nádrže',
        pylons: {
          1: COMMON_WEAPONS.AIM_9X,
          2: COMMON_WEAPONS.AGM_88C,
          3: COMMON_WEAPONS.TANK_330G,
          4: COMMON_WEAPONS.ATFLIR,
          5: COMMON_WEAPONS.TANK_330G,
          6: COMMON_WEAPONS.AIM_120C,
          7: COMMON_WEAPONS.TANK_330G,
          8: COMMON_WEAPONS.AGM_88C,
          9: COMMON_WEAPONS.AIM_9X,
        },
      },
      {
        id: 'anti_ship',
        name: 'Anti-Ship (2x Harpoon + 2x AMRAAM)',
        description: 'Boj proti námořním cílům s protilodními střelami AGM-84D Harpoon',
        pylons: {
          1: COMMON_WEAPONS.AIM_9X,
          2: COMMON_WEAPONS.AGM_84D,
          3: COMMON_WEAPONS.TANK_330G,
          4: COMMON_WEAPONS.AIM_120C,
          5: COMMON_WEAPONS.TANK_330G,
          6: COMMON_WEAPONS.AIM_120C,
          7: COMMON_WEAPONS.TANK_330G,
          8: COMMON_WEAPONS.AGM_84D,
          9: COMMON_WEAPONS.AIM_9X,
        },
      },
      {
        id: 'clean',
        name: 'Clean (Bez výzbroje)',
        description: 'Prázdné závěsníky pro akrobacii nebo trénink',
        pylons: {
          1: COMMON_WEAPONS.EMPTY,
          2: COMMON_WEAPONS.EMPTY,
          3: COMMON_WEAPONS.EMPTY,
          4: COMMON_WEAPONS.EMPTY,
          5: COMMON_WEAPONS.EMPTY,
          6: COMMON_WEAPONS.EMPTY,
          7: COMMON_WEAPONS.EMPTY,
          8: COMMON_WEAPONS.EMPTY,
          9: COMMON_WEAPONS.EMPTY,
        },
      },
    ],
  },

  'F-16C_50': {
    type: 'F-16C_50',
    displayName: 'F-16C Viper Block 50',
    emptyWeightKg: 8570,
    maxGrossWeightKg: 19200,
    maxFuelKg: 3200,
    maxFlares: 60,
    maxChaff: 60,
    hasGun: true,
    gunMaxRounds: 511,
    pylons: [
      { station: 1, name: 'Sta 1 (Left Wingtip)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_120C },
      { station: 2, name: 'Sta 2 (Left Outboard)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_9X },
      { station: 3, name: 'Sta 3 (Left Midboard)', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.GBU_38 },
      { station: 4, name: 'Sta 4 (Left Inboard)', allowedCategories: ['FUEL', 'A2G_GUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.TANK_370G },
      { station: 5, name: 'Sta 5 (Centerline)', allowedCategories: ['FUEL', 'POD', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.TANK_300G },
      { station: 6, name: 'Sta 6 (Right Inboard)', allowedCategories: ['FUEL', 'A2G_GUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.TANK_370G },
      { station: 7, name: 'Sta 7 (Right Midboard)', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.GBU_38 },
      { station: 8, name: 'Sta 8 (Right Outboard)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_9X },
      { station: 9, name: 'Sta 9 (Right Wingtip)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_120C },
    ],
    presets: [
      {
        id: 'cap',
        name: 'CAP / Air-to-Air (4x AMRAAM + 2x Sidewinder)',
        description: 'Stíhací konfigurace pro vybojování vzdušné nadvlády',
        pylons: {
          1: COMMON_WEAPONS.AIM_120C,
          2: COMMON_WEAPONS.AIM_9X,
          3: COMMON_WEAPONS.AIM_120C,
          4: COMMON_WEAPONS.TANK_370G,
          5: COMMON_WEAPONS.TANK_300G,
          6: COMMON_WEAPONS.TANK_370G,
          7: COMMON_WEAPONS.AIM_120C,
          8: COMMON_WEAPONS.AIM_9X,
          9: COMMON_WEAPONS.AIM_120C,
        },
      },
      {
        id: 'strike',
        name: 'Strike / CAS (2x GBU-38 + Litening + Tanks)',
        description: 'Přesný úder na pozemní cíle s JDAM a zaměřovacím kontejnerem',
        pylons: {
          1: COMMON_WEAPONS.AIM_120C,
          2: COMMON_WEAPONS.AIM_9X,
          3: COMMON_WEAPONS.GBU_38,
          4: COMMON_WEAPONS.TANK_370G,
          5: COMMON_WEAPONS.LITENING,
          6: COMMON_WEAPONS.TANK_370G,
          7: COMMON_WEAPONS.GBU_38,
          8: COMMON_WEAPONS.AIM_9X,
          9: COMMON_WEAPONS.AIM_120C,
        },
      },
      {
        id: 'sead',
        name: 'SEAD / Wild Weasel (2x HARM + Tanks)',
        description: 'Ničení nepřátelských radarů a raketových systémů PVO',
        pylons: {
          1: COMMON_WEAPONS.AIM_120C,
          2: COMMON_WEAPONS.AIM_9X,
          3: COMMON_WEAPONS.AGM_88C,
          4: COMMON_WEAPONS.TANK_370G,
          5: COMMON_WEAPONS.TANK_300G,
          6: COMMON_WEAPONS.TANK_370G,
          7: COMMON_WEAPONS.AGM_88C,
          8: COMMON_WEAPONS.AIM_9X,
          9: COMMON_WEAPONS.AIM_120C,
        },
      },
      {
        id: 'clean',
        name: 'Clean (Bez výzbroje)',
        description: 'Prázdný letoun',
        pylons: {
          1: COMMON_WEAPONS.EMPTY,
          2: COMMON_WEAPONS.EMPTY,
          3: COMMON_WEAPONS.EMPTY,
          4: COMMON_WEAPONS.EMPTY,
          5: COMMON_WEAPONS.EMPTY,
          6: COMMON_WEAPONS.EMPTY,
          7: COMMON_WEAPONS.EMPTY,
          8: COMMON_WEAPONS.EMPTY,
          9: COMMON_WEAPONS.EMPTY,
        },
      },
    ],
  },

  'A-10C_2': {
    type: 'A-10C_2',
    displayName: 'A-10C II Tank Killer',
    emptyWeightKg: 11321,
    maxGrossWeightKg: 22700,
    maxFuelKg: 5000,
    maxFlares: 240,
    maxChaff: 240,
    hasGun: true,
    gunMaxRounds: 1150,
    pylons: [
      { station: 1, name: 'Sta 1 (Left Outboard)', allowedCategories: ['A2A', 'POD', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_9M },
      { station: 2, name: 'Sta 2', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.HYDRA_70 },
      { station: 3, name: 'Sta 3', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AGM_65D },
      { station: 4, name: 'Sta 4', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.GBU_12 },
      { station: 5, name: 'Sta 5', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.GBU_38 },
      { station: 6, name: 'Sta 6 (Centerline)', allowedCategories: ['EMPTY', 'FUEL'], defaultWeapon: COMMON_WEAPONS.EMPTY },
      { station: 7, name: 'Sta 7', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.GBU_38 },
      { station: 8, name: 'Sta 8', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.GBU_12 },
      { station: 9, name: 'Sta 9', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AGM_65D },
      { station: 10, name: 'Sta 10', allowedCategories: ['POD', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.LITENING },
      { station: 11, name: 'Sta 11 (Right Outboard)', allowedCategories: ['A2A', 'POD', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_9M },
    ],
    presets: [
      {
        id: 'tank_killer',
        name: 'Tank Killer (4x Maverick + 4x GBU + Litening)',
        description: 'Těžký úder proti obrněným kolonám: AGM-65 Maverick, laserové i GPS pumy',
        pylons: {
          1: COMMON_WEAPONS.AIM_9M,
          2: COMMON_WEAPONS.HYDRA_70,
          3: COMMON_WEAPONS.AGM_65D,
          4: COMMON_WEAPONS.GBU_12,
          5: COMMON_WEAPONS.GBU_38,
          6: COMMON_WEAPONS.EMPTY,
          7: COMMON_WEAPONS.GBU_38,
          8: COMMON_WEAPONS.GBU_12,
          9: COMMON_WEAPONS.AGM_65D,
          10: COMMON_WEAPONS.LITENING,
          11: COMMON_WEAPONS.AIM_9M,
        },
      },
      {
        id: 'heavy_cluster',
        name: 'Cluster & Rockets (CBU-97 + Hydra)',
        description: 'Plošné ničení lehkých vozidel a pěchoty',
        pylons: {
          1: COMMON_WEAPONS.AIM_9M,
          2: COMMON_WEAPONS.HYDRA_19,
          3: COMMON_WEAPONS.CBU_97,
          4: COMMON_WEAPONS.CBU_97,
          5: COMMON_WEAPONS.GBU_12,
          6: COMMON_WEAPONS.EMPTY,
          7: COMMON_WEAPONS.GBU_12,
          8: COMMON_WEAPONS.CBU_97,
          9: COMMON_WEAPONS.CBU_97,
          10: COMMON_WEAPONS.LITENING,
          11: COMMON_WEAPONS.AIM_9M,
        },
      },
      {
        id: 'clean',
        name: 'Clean (Bez výzbroje)',
        description: 'Prázdný letoun',
        pylons: {
          1: COMMON_WEAPONS.EMPTY,
          2: COMMON_WEAPONS.EMPTY,
          3: COMMON_WEAPONS.EMPTY,
          4: COMMON_WEAPONS.EMPTY,
          5: COMMON_WEAPONS.EMPTY,
          6: COMMON_WEAPONS.EMPTY,
          7: COMMON_WEAPONS.EMPTY,
          8: COMMON_WEAPONS.EMPTY,
          9: COMMON_WEAPONS.EMPTY,
          10: COMMON_WEAPONS.EMPTY,
          11: COMMON_WEAPONS.EMPTY,
        },
      },
    ],
  },

  'Su-27': {
    type: 'Su-27',
    displayName: 'Su-27 Flanker',
    emptyWeightKg: 16380,
    maxGrossWeightKg: 30450,
    maxFuelKg: 9400,
    maxFlares: 96,
    maxChaff: 96,
    hasGun: true,
    gunMaxRounds: 150,
    pylons: [
      { station: 1, name: 'Sta 1 (Levý konec křídla)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.R_73 },
      { station: 2, name: 'Sta 2 (Levé vnější)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.R_73 },
      { station: 3, name: 'Sta 3 (Levé vnitřní)', allowedCategories: ['A2A', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.R_27ER },
      { station: 4, name: 'Sta 4 (Levá gondola)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.R_27ER },
      { station: 5, name: 'Sta 5 (Centrální přední)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.R_27ER },
      { station: 6, name: 'Sta 6 (Centrální zadní)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.R_27ET },
      { station: 7, name: 'Sta 7 (Pravá gondola)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.R_27ER },
      { station: 8, name: 'Sta 8 (Pravé vnitřní)', allowedCategories: ['A2A', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.R_27ER },
      { station: 9, name: 'Sta 9 (Pravé vnější)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.R_73 },
      { station: 10, name: 'Sta 10 (Pravý konec křídla)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.R_73 },
    ],
    presets: [
      {
        id: 'air_superiority',
        name: 'Air Superiority (6x R-27 + 4x R-73)',
        description: 'Standardní konfigurace pro záchyt vzdušných cílů na velké vzdálenosti',
        pylons: {
          1: COMMON_WEAPONS.R_73,
          2: COMMON_WEAPONS.R_73,
          3: COMMON_WEAPONS.R_27ER,
          4: COMMON_WEAPONS.R_27ER,
          5: COMMON_WEAPONS.R_27ER,
          6: COMMON_WEAPONS.R_27ET,
          7: COMMON_WEAPONS.R_27ER,
          8: COMMON_WEAPONS.R_27ER,
          9: COMMON_WEAPONS.R_73,
          10: COMMON_WEAPONS.R_73,
        },
      },
      {
        id: 'strike_bombs',
        name: 'Strike / Unguided (6x FAB-500 + 4x R-73)',
        description: 'Těžký úder klasickými pumami FAB-500 s vlastní obranou R-73',
        pylons: {
          1: COMMON_WEAPONS.R_73,
          2: COMMON_WEAPONS.R_73,
          3: COMMON_WEAPONS.FAB_500,
          4: COMMON_WEAPONS.FAB_500,
          5: COMMON_WEAPONS.FAB_500,
          6: COMMON_WEAPONS.FAB_500,
          7: COMMON_WEAPONS.FAB_500,
          8: COMMON_WEAPONS.FAB_500,
          9: COMMON_WEAPONS.R_73,
          10: COMMON_WEAPONS.R_73,
        },
      },
      {
        id: 'clean',
        name: 'Clean (Bez výzbroje)',
        description: 'Prázdný letoun',
        pylons: {
          1: COMMON_WEAPONS.EMPTY,
          2: COMMON_WEAPONS.EMPTY,
          3: COMMON_WEAPONS.EMPTY,
          4: COMMON_WEAPONS.EMPTY,
          5: COMMON_WEAPONS.EMPTY,
          6: COMMON_WEAPONS.EMPTY,
          7: COMMON_WEAPONS.EMPTY,
          8: COMMON_WEAPONS.EMPTY,
          9: COMMON_WEAPONS.EMPTY,
          10: COMMON_WEAPONS.EMPTY,
        },
      },
    ],
  },

  'F-15E': {
    type: 'F-15E',
    displayName: 'F-15E Strike Eagle',
    emptyWeightKg: 14300,
    maxGrossWeightKg: 36700,
    maxFuelKg: 6100,
    maxFlares: 60,
    maxChaff: 120,
    hasGun: true,
    gunMaxRounds: 512,
    pylons: [
      { station: 1, name: 'Sta 1 (Left Wing Outboard)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_9X },
      { station: 2, name: 'Sta 2 (Left Wing Inboard)', allowedCategories: ['FUEL', 'A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.TANK_600G },
      { station: 3, name: 'Sta 3 (Left CFT Upper)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_120C },
      { station: 4, name: 'Sta 4 (Left CFT Lower)', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.GBU_38 },
      { station: 5, name: 'Sta 5 (Centerline)', allowedCategories: ['FUEL', 'A2G_GUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.TANK_600G },
      { station: 6, name: 'Sta 6 (Right CFT Lower)', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.GBU_38 },
      { station: 7, name: 'Sta 7 (Right CFT Upper)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_120C },
      { station: 8, name: 'Sta 8 (Right Wing Inboard)', allowedCategories: ['FUEL', 'A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.TANK_600G },
      { station: 9, name: 'Sta 9 (Right Wing Outboard)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_9X },
    ],
    presets: [
      {
        id: 'strike',
        name: 'Heavy Strike (GBU-38 + 4x AMRAAM + Tanks)',
        description: 'Těžký dálkový úder s JDAM a velkou zásobou paliva',
        pylons: {
          1: COMMON_WEAPONS.AIM_9X,
          2: COMMON_WEAPONS.TANK_600G,
          3: COMMON_WEAPONS.AIM_120C,
          4: COMMON_WEAPONS.GBU_38,
          5: COMMON_WEAPONS.TANK_600G,
          6: COMMON_WEAPONS.GBU_38,
          7: COMMON_WEAPONS.AIM_120C,
          8: COMMON_WEAPONS.TANK_600G,
          9: COMMON_WEAPONS.AIM_9X,
        },
      },
    ],
  },

  'F-14B': {
    type: 'F-14B',
    displayName: 'F-14B Tomcat',
    emptyWeightKg: 19900,
    maxGrossWeightKg: 33720,
    maxFuelKg: 7350,
    maxFlares: 60,
    maxChaff: 60,
    hasGun: true,
    gunMaxRounds: 676,
    pylons: [
      { station: 1, name: 'Sta 1A (Left Glove Pylon IR)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_9M },
      { station: 2, name: 'Sta 1B (Left Glove Pylon Radar)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_7M },
      { station: 3, name: 'Sta 3 (Left Belly Front)', allowedCategories: ['A2A', 'A2G_GUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_54C },
      { station: 4, name: 'Sta 4 (Right Belly Front)', allowedCategories: ['A2A', 'A2G_GUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_54C },
      { station: 5, name: 'Sta 5 (Left Belly Rear)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_54C },
      { station: 6, name: 'Sta 6 (Right Belly Rear)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_54C },
      { station: 7, name: 'Sta 8B (Right Glove Pylon Radar)', allowedCategories: ['A2A', 'POD', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_7M },
      { station: 8, name: 'Sta 8A (Right Glove Pylon IR)', allowedCategories: ['A2A', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AIM_9M },
    ],
    presets: [
      {
        id: 'fleet_defense',
        name: 'Fleet Air Defense (4x Phoenix + 2x Sparrow + 2x Sidewinder)',
        description: 'Ikonická konfigurace pro ochranu letadlové lodi na extrémní vzdálenost',
        pylons: {
          1: COMMON_WEAPONS.AIM_9M,
          2: COMMON_WEAPONS.AIM_7M,
          3: COMMON_WEAPONS.AIM_54C,
          4: COMMON_WEAPONS.AIM_54C,
          5: COMMON_WEAPONS.AIM_54C,
          6: COMMON_WEAPONS.AIM_54C,
          7: COMMON_WEAPONS.AIM_7M,
          8: COMMON_WEAPONS.AIM_9M,
        },
      },
    ],
  },

  'AH-64D_BLK_II': {
    type: 'AH-64D_BLK_II',
    displayName: 'AH-64D Apache Longbow',
    emptyWeightKg: 5165,
    maxGrossWeightKg: 10433,
    maxFuelKg: 1150,
    maxFlares: 60,
    maxChaff: 60,
    hasGun: true,
    gunMaxRounds: 1200,
    pylons: [
      { station: 1, name: 'Sta 1 (Levé vnější)', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AGM_114K },
      { station: 2, name: 'Sta 2 (Levé vnitřní)', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.HYDRA_70 },
      { station: 3, name: 'Sta 3 (Pravé vnitřní)', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.HYDRA_70 },
      { station: 4, name: 'Sta 4 (Pravé vnější)', allowedCategories: ['A2G_GUIDED', 'A2G_UNGUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.AGM_114K },
    ],
    presets: [
      {
        id: 'heavy_armor',
        name: 'Heavy Anti-Armor (8x Hellfire + 38x Hydra)',
        description: 'Těžká protitanková konfigurace s raketami Hellfire a neřízenými raketami Hydra',
        pylons: {
          1: COMMON_WEAPONS.AGM_114K,
          2: COMMON_WEAPONS.HYDRA_70,
          3: COMMON_WEAPONS.HYDRA_70,
          4: COMMON_WEAPONS.AGM_114K,
        },
      },
      {
        id: 'all_hellfires',
        name: 'Max Hellfire (16x AGM-114K)',
        description: 'Plná palba protitankových střel Hellfire na všech závěsnících',
        pylons: {
          1: COMMON_WEAPONS.AGM_114K,
          2: COMMON_WEAPONS.AGM_114K,
          3: COMMON_WEAPONS.AGM_114K,
          4: COMMON_WEAPONS.AGM_114K,
        },
      },
    ],
  },

  'Ka-50_3': {
    type: 'Ka-50_3',
    displayName: 'Ka-50 Black Shark III',
    emptyWeightKg: 7700,
    maxGrossWeightKg: 10800,
    maxFuelKg: 1450,
    maxFlares: 128,
    maxChaff: 128,
    hasGun: true,
    gunMaxRounds: 460,
    pylons: [
      { station: 1, name: 'Sta 1 (Levé vnější)', allowedCategories: ['A2A', 'A2G_GUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.VIKHR },
      { station: 2, name: 'Sta 2 (Levé vnitřní)', allowedCategories: ['A2G_UNGUIDED', 'FUEL', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.S_8 },
      { station: 3, name: 'Sta 3 (Pravé vnitřní)', allowedCategories: ['A2G_UNGUIDED', 'FUEL', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.S_8 },
      { station: 4, name: 'Sta 4 (Pravé vnější)', allowedCategories: ['A2A', 'A2G_GUIDED', 'EMPTY'], defaultWeapon: COMMON_WEAPONS.VIKHR },
    ],
    presets: [
      {
        id: 'standard_combat',
        name: 'Combat Standard (12x Vikhr + 40x S-8)',
        description: 'Vyvážená protitanková a palebná podpora',
        pylons: {
          1: COMMON_WEAPONS.VIKHR,
          2: COMMON_WEAPONS.S_8,
          3: COMMON_WEAPONS.S_8,
          4: COMMON_WEAPONS.VIKHR,
        },
      },
    ],
  },
};

/**
 * Finds weapon by its CLSID identifier
 */
export function findWeaponByClsid(clsid?: string): WeaponItem {
  if (!clsid || clsid === '<CLEAN>' || clsid.trim() === '') {
    return COMMON_WEAPONS.EMPTY;
  }
  for (const item of Object.values(COMMON_WEAPONS)) {
    if (item.clsid === clsid) return item;
  }
  return {
    clsid,
    name: `Custom (${clsid.slice(0, 10)}...)`,
    category: 'A2G_GUIDED',
    weightKg: 100,
  };
}

/**
 * Returns compatible weapon list for a given pylon station
 */
export function getWeaponOptionsForStation(pylon: PylonDefinition): WeaponItem[] {
  return Object.values(COMMON_WEAPONS).filter((wp) => {
    if (wp.category === 'EMPTY') return true;
    return pylon.allowedCategories.includes(wp.category);
  });
}

/**
 * Gets loadout profile for an aircraft or generates generic fallback
 */
export function getLoadoutProfile(aircraftType: string): AircraftLoadoutProfile {
  if (AIRCRAFT_LOADOUT_PROFILES[aircraftType]) {
    return AIRCRAFT_LOADOUT_PROFILES[aircraftType];
  }

  // Fallback profile for unlisted modules (e.g. Su-25, Mirage, etc.)
  const defaultPylons: PylonDefinition[] = Array.from({ length: 6 }, (_, i) => ({
    station: i + 1,
    name: `Závěsník ${i + 1}`,
    allowedCategories: ['A2A', 'A2G_GUIDED', 'A2G_UNGUIDED', 'FUEL', 'POD', 'EMPTY'],
    defaultWeapon: i % 2 === 0 ? COMMON_WEAPONS.AIM_120C : COMMON_WEAPONS.GBU_12,
  }));

  return {
    type: aircraftType,
    displayName: aircraftType,
    emptyWeightKg: 10000,
    maxGrossWeightKg: 22000,
    maxFuelKg: 4000,
    maxFlares: 60,
    maxChaff: 60,
    hasGun: true,
    gunMaxRounds: 500,
    pylons: defaultPylons,
    presets: [
      {
        id: 'balanced',
        name: 'Vyvážená výzbroj',
        description: 'Základní výzbroj',
        pylons: defaultPylons.reduce((acc, p) => ({ ...acc, [p.station]: p.defaultWeapon || COMMON_WEAPONS.EMPTY }), {}),
      },
      {
        id: 'clean',
        name: 'Clean (Prázdný)',
        description: 'Všechny závěsníky prázdné',
        pylons: defaultPylons.reduce((acc, p) => ({ ...acc, [p.station]: COMMON_WEAPONS.EMPTY }), {}),
      },
    ],
  };
}

/**
 * Calculates weights and takeoff metrics
 */
export function calculateLoadoutMetrics(
  profile: AircraftLoadoutProfile,
  pylons: { [station: number]: { clsid: string } } = {},
  internalFuelKg: number = profile.maxFuelKg
) {
  let weaponsWeightKg = 0;
  let externalFuelKg = 0;

  for (const pylon of profile.pylons) {
    const stationPylon = pylons[pylon.station];
    if (stationPylon && stationPylon.clsid) {
      const weapon = findWeaponByClsid(stationPylon.clsid);
      if (weapon.category === 'FUEL') {
        externalFuelKg += weapon.weightKg;
      } else {
        weaponsWeightKg += weapon.weightKg;
      }
    }
  }

  const totalFuelKg = Math.round(internalFuelKg + externalFuelKg);
  const totalGrossWeightKg = Math.round(profile.emptyWeightKg + weaponsWeightKg + internalFuelKg + externalFuelKg);
  const maxGrossWeightKg = profile.maxGrossWeightKg;
  const isOverweight = totalGrossWeightKg > maxGrossWeightKg;
  const weightPct = Math.round((totalGrossWeightKg / maxGrossWeightKg) * 100);

  return {
    emptyWeightKg: profile.emptyWeightKg,
    weaponsWeightKg,
    internalFuelKg: Math.round(internalFuelKg),
    externalFuelKg,
    totalFuelKg,
    totalGrossWeightKg,
    maxGrossWeightKg,
    isOverweight,
    weightPct,
  };
}
