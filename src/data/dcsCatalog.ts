export interface CatalogItem {
  id: string;
  name: string;
  category: 'plane' | 'helicopter' | 'vehicle' | 'ship' | 'static';
  coalition?: 'blue' | 'red' | 'all';
  role?: string;
  threatRadius?: number; // meters (for SAMs)
}

export const DCS_CATALOG: CatalogItem[] = [
  // --- BLUE / NATO AIRCRAFT ---
  { id: 'F/A-18C_hornet', name: 'F/A-18C Hornet', category: 'plane', coalition: 'blue', role: 'Multirole Fighter' },
  { id: 'F-16C_50', name: 'F-16C Viper Block 50', category: 'plane', coalition: 'blue', role: 'Multirole Fighter' },
  { id: 'A-10C_2', name: 'A-10C II Tank Killer', category: 'plane', coalition: 'blue', role: 'Close Air Support' },
  { id: 'F-15E', name: 'F-15E Strike Eagle', category: 'plane', coalition: 'blue', role: 'Strike Fighter' },
  { id: 'F-14B', name: 'F-14B Tomcat', category: 'plane', coalition: 'blue', role: 'Fleet Air Defense' },
  { id: 'F-4E-45MC', name: 'F-4E Phantom II', category: 'plane', coalition: 'blue', role: 'Fighter / Bomber' },
  { id: 'AV8BNA', name: 'AV-8B Night Attack V/STOL', category: 'plane', coalition: 'blue', role: 'Ground Attack' },
  { id: 'M-2000C', name: 'Mirage 2000C', category: 'plane', coalition: 'blue', role: 'Interceptor / Fighter' },
  { id: 'Mirage-F1EE', name: 'Mirage F1EE', category: 'plane', coalition: 'blue', role: 'Multirole' },
  { id: 'AJS37', name: 'AJS-37 Viggen', category: 'plane', coalition: 'blue', role: 'Strike / Anti-Ship' },
  { id: 'JF-17', name: 'JF-17 Thunder', category: 'plane', coalition: 'all', role: 'Multirole Fighter' },

  // --- BLUE SUPPORT & TANKERS ---
  { id: 'KC-135', name: 'KC-135 Stratotanker (Boom)', category: 'plane', coalition: 'blue', role: 'Aerial Refueling' },
  { id: 'KC135MPRS', name: 'KC-135 MPRS (Drogue)', category: 'plane', coalition: 'blue', role: 'Aerial Refueling' },
  { id: 'KC-130', name: 'KC-130 Hercules (Drogue)', category: 'plane', coalition: 'blue', role: 'Aerial Refueling' },
  { id: 'E-3A', name: 'E-3A Sentry (AWACS)', category: 'plane', coalition: 'blue', role: 'Airborne Early Warning' },
  { id: 'E-2C', name: 'E-2C Hawkeye (AWACS)', category: 'plane', coalition: 'blue', role: 'Carrier AWACS' },

  // --- RED / EASTERN AIRCRAFT ---
  { id: 'Su-27', name: 'Su-27 Flanker', category: 'plane', coalition: 'red', role: 'Air Superiority' },
  { id: 'Su-33', name: 'Su-33 Flanker-D', category: 'plane', coalition: 'red', role: 'Carrier Fighter' },
  { id: 'MiG-29S', name: 'MiG-29S Fulcrum-C', category: 'plane', coalition: 'red', role: 'Air Superiority' },
  { id: 'Su-25T', name: 'Su-25T Frogfoot', category: 'plane', coalition: 'red', role: 'Ground Attack' },
  { id: 'MiG-21Bis', name: 'MiG-21bis Fishbed', category: 'plane', coalition: 'red', role: 'Interceptor' },
  { id: 'J-11A', name: 'J-11A', category: 'plane', coalition: 'red', role: 'Air Superiority' },
  { id: 'IL-78M', name: 'Il-78M Midas (Tanker)', category: 'plane', coalition: 'red', role: 'Aerial Refueling' },
  { id: 'A-50', name: 'A-50 Mainstay (AWACS)', category: 'plane', coalition: 'red', role: 'Airborne Early Warning' },

  // --- HELICOPTERS ---
  { id: 'AH-64D_BLK_II', name: 'AH-64D Apache Longbow', category: 'helicopter', coalition: 'blue', role: 'Attack Helicopter' },
  { id: 'UH-1H', name: 'UH-1H Huey', category: 'helicopter', coalition: 'blue', role: 'Utility / Transport' },
  { id: 'OH-58D', name: 'OH-58D Kiowa Warrior', category: 'helicopter', coalition: 'blue', role: 'Scout / Attack' },
  { id: 'Ka-50_3', name: 'Ka-50 Black Shark III', category: 'helicopter', coalition: 'red', role: 'Attack Helicopter' },
  { id: 'Mi-24P', name: 'Mi-24P Hind', category: 'helicopter', coalition: 'red', role: 'Gunship / Transport' },
  { id: 'Mi-8MT', name: 'Mi-8MTV2 Hip', category: 'helicopter', coalition: 'red', role: 'Transport / Gunship' },

  // --- AIR DEFENSE (SAM & AAA) ---
  { id: 'Patriot ln', name: 'MIM-104 Patriot LN (PAC-2/3)', category: 'vehicle', coalition: 'blue', role: 'Long Range SAM', threatRadius: 100000 },
  { id: 'Patriot str', name: 'MIM-104 Patriot Radar AN/MPQ-65', category: 'vehicle', coalition: 'blue', role: 'SAM Radar', threatRadius: 100000 },
  { id: 'Patriot cp', name: 'MIM-104 Patriot Command Post', category: 'vehicle', coalition: 'blue', role: 'Command' },
  { id: 'Patriot epp', name: 'MIM-104 Patriot Power Plant', category: 'vehicle', coalition: 'blue', role: 'Support' },
  { id: 'Hawk ln', name: 'MIM-23 Hawk LN', category: 'vehicle', coalition: 'blue', role: 'Medium Range SAM', threatRadius: 45000 },
  { id: 'Hawk sr', name: 'MIM-23 Hawk PAR Search Radar', category: 'vehicle', coalition: 'blue', role: 'SAM Radar', threatRadius: 45000 },
  { id: 'Hawk tr', name: 'MIM-23 Hawk HPI Tracking Radar', category: 'vehicle', coalition: 'blue', role: 'SAM Radar', threatRadius: 45000 },
  { id: 'Hawk pcp', name: 'MIM-23 Hawk Command Post', category: 'vehicle', coalition: 'blue', role: 'Command' },
  { id: 'M1097 Avenger', name: 'M1097 Avenger (Stinger)', category: 'vehicle', coalition: 'blue', role: 'SHORAD', threatRadius: 5000 },
  { id: 'Gepard', name: 'Flakpanzer Gepard (35mm SPAAG)', category: 'vehicle', coalition: 'blue', role: 'SPAAG', threatRadius: 4000 },

  { id: 'SA-10 S-300PS 5P85C', name: 'SA-10 S-300PS TEL 5P85C', category: 'vehicle', coalition: 'red', role: 'Long Range SAM', threatRadius: 90000 },
  { id: 'SA-10 S-300PS 5P85D', name: 'SA-10 S-300PS TEL 5P85D', category: 'vehicle', coalition: 'red', role: 'Long Range SAM', threatRadius: 90000 },
  { id: 'SA-10 S-300PS 64N6E', name: 'SA-10 Big Bird Search Radar', category: 'vehicle', coalition: 'red', role: 'SAM Radar', threatRadius: 90000 },
  { id: 'SA-10 S-300PS 40B6M', name: 'SA-10 Flap Lid Tracking Radar', category: 'vehicle', coalition: 'red', role: 'SAM Radar', threatRadius: 90000 },
  { id: 'SA-10 S-300PS 54K6', name: 'SA-10 Command Post 54K6', category: 'vehicle', coalition: 'red', role: 'Command' },

  { id: 'SA-11 Buk LN 9A310M1', name: 'SA-11 Buk-M1 TELAR 9A310M1', category: 'vehicle', coalition: 'red', role: 'Medium Range SAM', threatRadius: 32000 },
  { id: 'SA-11 Buk SR 9S18M1', name: 'SA-11 Snow Drift Radar', category: 'vehicle', coalition: 'red', role: 'SAM Radar', threatRadius: 32000 },
  { id: 'SA-11 Buk CC 9S470M1', name: 'SA-11 Command Post 9S470M1', category: 'vehicle', coalition: 'red', role: 'Command' },

  { id: 'SA-8 Osa 9A33', name: 'SA-8 Gecko (Osa LN)', category: 'vehicle', coalition: 'red', role: 'Short Range SAM', threatRadius: 10000 },
  { id: 'SA-15 Tor 9A331', name: 'SA-15 Gauntlet (Tor-M1)', category: 'vehicle', coalition: 'red', role: 'SHORAD', threatRadius: 12000 },
  { id: '2S6 Tunguska', name: '2S6 Tunguska (SA-19)', category: 'vehicle', coalition: 'red', role: 'SPAAG / SAM', threatRadius: 8000 },
  { id: 'ZSU-23-4 Shilka', name: 'ZSU-23-4 Shilka (23mm)', category: 'vehicle', coalition: 'red', role: 'SPAAG', threatRadius: 2500 },

  // --- ARMOR & VEHICLES ---
  { id: 'M-1 Abrams', name: 'M1A2 Abrams MBT', category: 'vehicle', coalition: 'blue', role: 'Main Battle Tank' },
  { id: 'M2A2 Bradley', name: 'M2A2 Bradley IFV', category: 'vehicle', coalition: 'blue', role: 'Infantry Fighting Vehicle' },
  { id: 'T-90', name: 'T-90 Vladimir MBT', category: 'vehicle', coalition: 'red', role: 'Main Battle Tank' },
  { id: 'T-72B', name: 'T-72B MBT', category: 'vehicle', coalition: 'red', role: 'Main Battle Tank' },
  { id: 'BMP-3', name: 'BMP-3 IFV', category: 'vehicle', coalition: 'red', role: 'Infantry Fighting Vehicle' },
  { id: 'BTR-82A', name: 'BTR-82A APC', category: 'vehicle', coalition: 'red', role: 'Armored Personnel Carrier' },

  // --- SHIPS & CARRIERS (DCS SUPERCARRIER & FLEET) ---
  { id: 'CVN_71', name: 'USS Theodore Roosevelt (CVN-71) [Supercarrier]', category: 'ship', coalition: 'blue', role: 'Nuclear Aircraft Carrier' },
  { id: 'CVN_72', name: 'USS Abraham Lincoln (CVN-72) [Supercarrier]', category: 'ship', coalition: 'blue', role: 'Nuclear Aircraft Carrier' },
  { id: 'CVN_73', name: 'USS George Washington (CVN-73) [Supercarrier]', category: 'ship', coalition: 'blue', role: 'Nuclear Aircraft Carrier' },
  { id: 'CVN_74', name: 'USS John C. Stennis (CVN-74) [Supercarrier]', category: 'ship', coalition: 'blue', role: 'Nuclear Aircraft Carrier' },
  { id: 'CVN_75', name: 'USS Harry S. Truman (CVN-75) [Supercarrier]', category: 'ship', coalition: 'blue', role: 'Nuclear Aircraft Carrier' },
  { id: 'Stennis', name: 'USS John C. Stennis (Base Carrier)', category: 'ship', coalition: 'blue', role: 'Aircraft Carrier' },
  { id: 'Forrestal', name: 'USS Forrestal (CV-59)', category: 'ship', coalition: 'blue', role: 'Aircraft Carrier' },
  { id: 'LHA_Tarawa', name: 'USS Tarawa (LHA-1)', category: 'ship', coalition: 'blue', role: 'Amphibious Assault Ship' },
  { id: 'TICONDEROG', name: 'Ticonderoga CG-47 Aegis Cruiser', category: 'ship', coalition: 'blue', role: 'Guided Missile Cruiser', threatRadius: 80000 },
  { id: 'ArleighBurke', name: 'Arleigh Burke DDG-51 Flight IIA Destroyer', category: 'ship', coalition: 'blue', role: 'Guided Missile Destroyer', threatRadius: 75000 },
  { id: 'PERRY', name: 'Oliver Hazard Perry FFG-7 Frigate', category: 'ship', coalition: 'blue', role: 'Guided Missile Frigate', threatRadius: 35000 },
  { id: 'SH-60B', name: 'SH-60B Seahawk (Plane Guard / SAR)', category: 'helicopter', coalition: 'blue', role: 'Carrier SAR & ASW' },

  { id: 'KUZNECOW', name: 'Admiral Kuznetsov CV', category: 'ship', coalition: 'red', role: 'Heavy Aircraft Cruiser' },
  { id: 'MOSKVA', name: 'Moskva Slava-class Cruiser', category: 'ship', coalition: 'red', role: 'Guided Missile Cruiser', threatRadius: 90000 },
  { id: 'PIOTR', name: 'Pyotr Velikiy (Kirov-class Battlecruiser)', category: 'ship', coalition: 'red', role: 'Heavy Missile Battlecruiser', threatRadius: 120000 },
  { id: 'NEUSTRASH', name: 'Neustrashimy-class Frigate', category: 'ship', coalition: 'red', role: 'Frigate', threatRadius: 40000 },
  { id: 'ALBATROS', name: 'Grisha Albatros Corvette', category: 'ship', coalition: 'red', role: 'ASW Corvette', threatRadius: 15000 },
  { id: 'Ka-27', name: 'Ka-27 Helix (SAR / ASW)', category: 'helicopter', coalition: 'red', role: 'Carrier SAR & ASW' },
];
