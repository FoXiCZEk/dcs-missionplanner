import proj4 from 'proj4';
import type { AirbaseInfo, Theater } from '../types/dcs';

// Proj4 definitions for DCS Theatres (from dcs-projections standard)
const THEATER_PROJECTIONS: Record<Theater, string> = {
  Caucasus: '+proj=tmerc +lat_0=0 +lon_0=33 +k_0=0.9996 +x_0=-99516.9999999732 +y_0=-4998114.999999984 +towgs84=0,0,0,0,0,0,0 +units=m +vunits=m +ellps=WGS84 +no_defs +axis=neu',
  Syria: '+proj=tmerc +lat_0=0 +lon_0=39 +k_0=0.9996 +x_0=282801.00000003993 +y_0=-3879865.9999999935 +towgs84=0,0,0,0,0,0,0 +units=m +vunits=m +ellps=WGS84 +no_defs +axis=neu',
  PersianGulf: '+proj=tmerc +lat_0=0 +lon_0=57 +k_0=0.9996 +x_0=-138656.9999999887 +y_0=-2745300.999999993 +towgs84=0,0,0,0,0,0,0 +units=m +vunits=m +ellps=WGS84 +no_defs +axis=neu',
  Nevada: '+proj=tmerc +lat_0=0 +lon_0=-115 +k_0=0.9996 +x_0=-134465.0000000078 +y_0=-4009772.000000015 +towgs84=0,0,0,0,0,0,0 +units=m +vunits=m +ellps=WGS84 +no_defs +axis=neu',
};

// Initialized projector cache
const projectors: Record<string, proj4.Converter> = {};

function getProjector(theater: Theater): proj4.Converter {
  const str = String(theater).toLowerCase();
  let safeTheater: Theater = 'Caucasus';
  if (str.includes('syria')) safeTheater = 'Syria';
  else if (str.includes('gulf') || str.includes('persian')) safeTheater = 'PersianGulf';
  else if (str.includes('nevada') || str.includes('nttr')) safeTheater = 'Nevada';

  if (!projectors[safeTheater]) {
    projectors[safeTheater] = proj4(THEATER_PROJECTIONS[safeTheater] || THEATER_PROJECTIONS.Caucasus);
  }
  return projectors[safeTheater];
}

/**
 * Convert WGS84 Lat/Lon to DCS Flat Cartesian Coordinates (x, y) in meters.
 * In DCS:
 *  - x is Northing (meters)
 *  - y is Easting (meters)
 */
export function latLonToDcs(theater: Theater, lat: number, lon: number): { x: number; y: number } {
  try {
    const validLat = isFinite(lat) ? lat : 42.0;
    const validLon = isFinite(lon) ? lon : 42.0;
    const projector = getProjector(theater);
    const [easting, northing] = projector.forward([validLon, validLat]);
    return {
      x: isFinite(northing) ? northing : 0,
      y: isFinite(easting) ? easting : 0,
    };
  } catch {
    return { x: 0, y: 0 };
  }
}

/**
 * Convert DCS Flat Coordinates (x = Northing, y = Easting) to WGS84 Lat/Lon
 */
export function dcsToLatLon(theater: Theater, x: number, y: number): { lat: number; lon: number } {
  try {
    const validX = isFinite(x) ? x : 0;
    const validY = isFinite(y) ? y : 0;
    const projector = getProjector(theater);
    const [lon, lat] = projector.inverse([validY, validX]);
    const safeCenter =
      theater === 'Syria'
        ? [35.401, 35.949]
        : theater === 'PersianGulf'
        ? [25.253, 55.364]
        : theater === 'Nevada'
        ? [36.236, -115.034]
        : [42.238, 42.048];
    return {
      lat: isFinite(lat) ? lat : safeCenter[0],
      lon: isFinite(lon) ? lon : safeCenter[1],
    };
  } catch {
    const safeCenter =
      theater === 'Syria'
        ? [35.401, 35.949]
        : theater === 'PersianGulf'
        ? [25.253, 55.364]
        : theater === 'Nevada'
        ? [36.236, -115.034]
        : [42.238, 42.048];
    return { lat: safeCenter[0], lon: safeCenter[1] };
  }
}

/**
 * Calculate distance in meters between two lat/lon points (Haversine)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate initial bearing in degrees from point 1 to point 2 (0 = North, 90 = East)
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const lambda1 = (lon1 * Math.PI) / 180;
  const lambda2 = (lon2 * Math.PI) / 180;

  const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);
  const theta = Math.atan2(y, x);
  const bearing = ((theta * 180) / Math.PI + 360) % 360;
  return bearing;
}

export interface TheaterConfig {
  name: Theater;
  displayName: string;
  defaultCenter: [number, number]; // [lat, lon]
  defaultZoom: number;
  bounds: [[number, number], [number, number]];
  airbases: AirbaseInfo[];
}

export const THEATER_CONFIGS: Record<Theater, TheaterConfig> = {
  Caucasus: {
    name: 'Caucasus',
    displayName: 'Kavkaz (Caucasus)',
    defaultCenter: [42.238, 42.048], // Near Senaki / Kutaisi
    defaultZoom: 8,
    bounds: [
      [41.0, 36.5],
      [46.0, 46.5],
    ],
    airbases: [
      { id: 'anapa', name: 'Anapa-Vityazevo', lat: 45.002, lon: 37.347, runway: '04/22', tacan: '41X', elevation: 53 },
      { id: 'krymsk', name: 'Krymsk', lat: 44.964, lon: 37.997, runway: '04/22', elevation: 18 },
      { id: 'krasnodar_c', name: 'Krasnodar-Center', lat: 45.083, lon: 38.983, runway: '09/27', elevation: 33 },
      { id: 'krasnodar_p', name: 'Krasnodar-Pashkovsky', lat: 45.034, lon: 39.170, runway: '05/23', elevation: 35 },
      { id: 'maykop', name: 'Maykop-Khanskaya', lat: 44.680, lon: 40.035, runway: '04/22', elevation: 184 },
      { id: 'gelendzhik', name: 'Gelendzhik', lat: 44.576, lon: 38.012, runway: '01/19', elevation: 23 },
      { id: 'sochi', name: 'Sochi-Adler', lat: 43.444, lon: 39.957, runway: '06/24', elevation: 27 },
      { id: 'gudauta', name: 'Gudauta', lat: 43.105, lon: 40.612, runway: '15/33', elevation: 20 },
      { id: 'sukhumi', name: 'Sukhumi-Babushara', lat: 42.861, lon: 41.128, runway: '12/30', elevation: 16 },
      { id: 'senaki', name: 'Senaki-Kolkhi', lat: 42.238, lon: 42.048, runway: '09/27', tacan: '31X', elevation: 11 },
      { id: 'kobuleti', name: 'Kobuleti', lat: 41.859, lon: 41.866, runway: '07/25', tacan: '67X', elevation: 14 },
      { id: 'batumi', name: 'Batumi', lat: 41.610, lon: 41.599, runway: '13/31', tacan: '16X', ils: '110.30', elevation: 10 },
      { id: 'kutaisi', name: 'Kutaisi-Kopitnari', lat: 42.176, lon: 42.483, runway: '08/26', tacan: '44X', elevation: 45 },
      { id: 'tbilisi_l', name: 'Tbilisi-Lochini', lat: 41.669, lon: 44.954, runway: '13/31', elevation: 495 },
      { id: 'tbilisi_s', name: 'Tbilisi-Soganlug', lat: 41.649, lon: 44.939, runway: '14/32', elevation: 455 },
      { id: 'vaziani', name: 'Vaziani', lat: 41.628, lon: 45.029, runway: '14/32', tacan: '22X', elevation: 457 },
      { id: 'mozdok', name: 'Mozdok', lat: 43.787, lon: 44.600, runway: '08/26', elevation: 153 },
      { id: 'nalchik', name: 'Nalchik', lat: 43.513, lon: 43.636, runway: '06/24', elevation: 443 },
      { id: 'min_vody', name: 'Mineralnye Vody', lat: 44.225, lon: 43.082, runway: '12/30', elevation: 321 },
      { id: 'beslan', name: 'Beslan', lat: 43.205, lon: 44.606, runway: '10/28', elevation: 512 },
    ],
  },
  Syria: {
    name: 'Syria',
    displayName: 'Sýrie (Syria)',
    defaultCenter: [35.401, 35.949], // Bassel Al-Assad / Mediterranean coast
    defaultZoom: 8,
    bounds: [
      [31.5, 31.5],
      [38.5, 43.0],
    ],
    airbases: [
      { id: 'incirlik', name: 'Incirlik Air Base', lat: 37.002, lon: 35.426, runway: '05/23', tacan: '21X', ils: '109.30', elevation: 67 },
      { id: 'hatay', name: 'Hatay', lat: 36.363, lon: 36.282, runway: '04/22', elevation: 84 },
      { id: 'hmeimim', name: 'Bassel Al-Assad (Hmeimim)', lat: 35.401, lon: 35.949, runway: '17/35', elevation: 48 },
      { id: 'aleppo', name: 'Aleppo Intl (Nayrab)', lat: 36.181, lon: 37.224, runway: '09/27', elevation: 389 },
      { id: 'kuweires', name: 'Kuweires', lat: 36.187, lon: 37.583, runway: '10/28', elevation: 371 },
      { id: 'jirah', name: 'Jirah', lat: 36.097, lon: 37.940, runway: '11/29', elevation: 342 },
      { id: 'tabqa', name: 'Tabqa', lat: 35.754, lon: 38.567, runway: '08/26', elevation: 323 },
      { id: 'palmyra', name: 'Palmyra', lat: 34.557, lon: 38.317, runway: '08/26', elevation: 403 },
      { id: 'deir_ez_zor', name: 'Deir ez-Zor', lat: 35.283, lon: 40.176, runway: '10/28', elevation: 213 },
      { id: 'hama', name: 'Hama Military', lat: 35.179, lon: 36.711, runway: '09/27', elevation: 309 },
      { id: 'dumayr', name: 'Al-Dumayr', lat: 33.609, lon: 36.749, runway: '07/25', elevation: 610 },
      { id: 'damascus', name: 'Damascus Intl', lat: 33.415, lon: 36.514, runway: '05/23', elevation: 616 },
      { id: 'beirut', name: 'Beirut-Rafic Hariri', lat: 33.821, lon: 35.488, runway: '16/34', elevation: 26 },
      { id: 'rayak', name: 'Rayak', lat: 33.852, lon: 35.989, runway: '04/22', elevation: 923 },
      { id: 'akrotiri', name: 'RAF Akrotiri (Cyprus)', lat: 34.590, lon: 32.988, runway: '10/28', tacan: '107X', elevation: 23 },
      { id: 'larnaca', name: 'Larnaca (Cyprus)', lat: 34.875, lon: 33.625, runway: '04/22', elevation: 3 },
      { id: 'paphos', name: 'Paphos (Cyprus)', lat: 34.718, lon: 32.486, runway: '11/29', elevation: 12 },
      { id: 'ramat_david', name: 'Ramat David', lat: 32.665, lon: 35.179, runway: '09/27', tacan: '84X', elevation: 56 },
    ],
  },
  PersianGulf: {
    name: 'PersianGulf',
    displayName: 'Perský záliv (Persian Gulf)',
    defaultCenter: [25.253, 55.364], // Dubai / Hormuz center
    defaultZoom: 8,
    bounds: [
      [22.0, 51.0],
      [30.0, 60.5],
    ],
    airbases: [
      { id: 'al_dhafra', name: 'Al Dhafra Air Base', lat: 24.248, lon: 54.547, runway: '13/31', tacan: '96X', ils: '110.70', elevation: 23 },
      { id: 'dubai_intl', name: 'Dubai Intl', lat: 25.253, lon: 55.364, runway: '12/30', ils: '110.10', elevation: 19 },
      { id: 'al_maktoum', name: 'Al Maktoum Intl', lat: 24.896, lon: 55.161, runway: '12/30', elevation: 52 },
      { id: 'sharjah', name: 'Sharjah Intl', lat: 25.328, lon: 55.517, runway: '12/30', elevation: 34 },
      { id: 'fujairah', name: 'Fujairah Intl', lat: 25.112, lon: 56.324, runway: '11/29', elevation: 46 },
      { id: 'khasab', name: 'Khasab (Oman / Hormuz)', lat: 26.171, lon: 56.241, runway: '01/19', elevation: 30 },
      { id: 'bandar_abbas', name: 'Bandar Abbas Intl (Iran)', lat: 27.218, lon: 56.377, runway: '03/21', elevation: 10 },
      { id: 'qeshm', name: 'Qeshm Island (Dayrestan)', lat: 26.754, lon: 55.903, runway: '05/23', elevation: 14 },
      { id: 'havadarya', name: 'Bandar Abbas Havadarya', lat: 27.155, lon: 56.171, runway: '08/26', elevation: 7 },
      { id: 'sirri', name: 'Sirri Island (Iran Navy)', lat: 25.909, lon: 54.540, runway: '06/24', elevation: 13 },
      { id: 'abu_musa', name: 'Abu Musa Island', lat: 25.875, lon: 55.033, runway: '08/26', elevation: 7 },
      { id: 'lar', name: 'Lar Air Base', lat: 27.673, lon: 54.382, runway: '09/27', elevation: 915 },
      { id: 'al_ain', name: 'Al Ain Intl', lat: 24.261, lon: 55.609, runway: '01/19', elevation: 262 },
    ],
  },
  Nevada: {
    name: 'Nevada',
    displayName: 'Nevada NTTR (Red Flag)',
    defaultCenter: [36.236, -115.034], // Nellis AFB
    defaultZoom: 8,
    bounds: [
      [34.5, -118.0],
      [38.5, -113.5],
    ],
    airbases: [
      { id: 'nellis', name: 'Nellis AFB (Red Flag)', lat: 36.236, lon: -115.034, runway: '03/21', tacan: '12X', ils: '109.10', elevation: 569 },
      { id: 'creech', name: 'Creech AFB (Indian Springs)', lat: 36.583, lon: -115.673, runway: '08/26', tacan: '87X', elevation: 966 },
      { id: 'mccarran', name: 'McCarran Intl (Las Vegas)', lat: 36.084, lon: -115.153, runway: '01/19', ils: '111.75', elevation: 665 },
      { id: 'groom_lake', name: 'Groom Lake (Area 51 / Homey)', lat: 37.248, lon: -115.811, runway: '14/32', tacan: '18X', elevation: 1360 },
      { id: 'tonopah', name: 'Tonopah Test Range', lat: 37.798, lon: -116.780, runway: '14/32', tacan: '77X', elevation: 1690 },
      { id: 'boulder_city', name: 'Boulder City Muni', lat: 35.948, lon: -114.861, runway: '15/33', elevation: 671 },
      { id: 'laughlin', name: 'Laughlin / Bullhead Intl', lat: 35.156, lon: -114.559, runway: '16/34', elevation: 208 },
      { id: 'lincoln_county', name: 'Lincoln County', lat: 37.790, lon: -114.423, runway: '17/35', elevation: 1478 },
      { id: 'beatty', name: 'Beatty Airport', lat: 36.861, lon: -116.786, runway: '16/34', elevation: 966 },
    ],
  },
};

/**
 * Returns safe TheaterConfig for a given theater identifier, always falling back to Caucasus if undefined or unknown.
 */
export function getTheaterConfig(theater?: string): TheaterConfig {
  const str = String(theater || '').toLowerCase();
  if (str.includes('syria')) return THEATER_CONFIGS.Syria;
  if (str.includes('gulf') || str.includes('persian')) return THEATER_CONFIGS.PersianGulf;
  if (str.includes('nevada') || str.includes('nttr')) return THEATER_CONFIGS.Nevada;
  return THEATER_CONFIGS.Caucasus;
}

/**
 * Bullseye coordinates for theaters
 */
export const THEATER_BULLSEYE: Record<Theater, { blue: { lat: number; lon: number; name: string }; red: { lat: number; lon: number; name: string } }> = {
  Caucasus: {
    blue: { lat: 42.176, lon: 42.483, name: 'Kutaisi Bulls' },
    red: { lat: 43.513, lon: 43.636, name: 'Nalchik Bulls' },
  },
  Syria: {
    blue: { lat: 37.002, lon: 35.426, name: 'Incirlik Bulls' },
    red: { lat: 33.415, lon: 36.514, name: 'Damascus Bulls' },
  },
  PersianGulf: {
    blue: { lat: 24.248, lon: 54.547, name: 'Al Dhafra Bulls' },
    red: { lat: 27.218, lon: 56.377, name: 'Bandar Abbas Bulls' },
  },
  Nevada: {
    blue: { lat: 36.236, lon: -115.034, name: 'Nellis Bulls' },
    red: { lat: 37.798, lon: -116.780, name: 'Tonopah Bulls' },
  },
};

/**
 * Format coordinates as DMS (Degrees Minutes Seconds)
 * e.g. N 42°14'17" E 042°02'53"
 */
export function formatDms(lat: number, lon: number): string {
  const latH = lat >= 0 ? 'N' : 'S';
  const aLat = Math.abs(lat);
  const latD = Math.floor(aLat);
  const latM = Math.floor((aLat - latD) * 60);
  const latS = Math.round(((aLat - latD) * 60 - latM) * 60);

  const lonH = lon >= 0 ? 'E' : 'W';
  const aLon = Math.abs(lon);
  const lonD = Math.floor(aLon);
  const lonM = Math.floor((aLon - lonD) * 60);
  const lonS = Math.round(((aLon - lonD) * 60 - lonM) * 60);

  return `${latH} ${latD.toString().padStart(2, '0')}°${latM.toString().padStart(2, '0')}'${latS.toString().padStart(2, '0')}" ${lonH} ${lonD.toString().padStart(3, '0')}°${lonM.toString().padStart(2, '0')}'${lonS.toString().padStart(2, '0')}"`;
}

/**
 * Format coordinates as DDM (Degrees Decimal Minutes)
 * Standard for Hornet / Viper UFC
 * e.g. N 42°14.280' E 042°02.880'
 */
export function formatDdm(lat: number, lon: number): string {
  const latH = lat >= 0 ? 'N' : 'S';
  const aLat = Math.abs(lat);
  const latD = Math.floor(aLat);
  const latM = ((aLat - latD) * 60).toFixed(3);

  const lonH = lon >= 0 ? 'E' : 'W';
  const aLon = Math.abs(lon);
  const lonD = Math.floor(aLon);
  const lonM = ((aLon - lonD) * 60).toFixed(3);

  return `${latH} ${latD.toString().padStart(2, '0')}°${latM}' ${lonH} ${lonD.toString().padStart(3, '0')}°${lonM}'`;
}

/**
 * Format coordinates as MGRS (Military Grid Reference System)
 * e.g. 38T KM 56424 80421
 */
export function formatMgrs(lat: number, lon: number): string {
  try {
    const zone = Math.floor((lon + 180) / 6) + 1;
    const utmDef = `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`;
    const [easting, northing] = proj4(utmDef).forward([lon, lat]);

    const latBands = 'CDEFGHJKLMNPQRSTUVWX';
    const bandIdx = Math.min(latBands.length - 1, Math.max(0, Math.floor((lat + 80) / 8)));
    const band = latBands[bandIdx];

    const colLetterTable = [
      'ABCDEFGH', // Set 1: zones 1, 4, 7...
      'JKLMNPQR', // Set 2: zones 2, 5, 8...
      'STUVWXYZ', // Set 3: zones 3, 6, 9...
    ];
    const colSet = (zone - 1) % 3;
    const colIdx = Math.max(0, Math.floor(easting / 100000) - 1);
    const colLetter = colLetterTable[colSet][colIdx % 8] || 'A';

    const rowLettersOdd = 'ABCDEFGHJKLMNPQRSTUV';
    const rowLettersEven = 'FGHJKLMNPQRSTUVABCDE';
    const rowSet = zone % 2 === 1 ? rowLettersOdd : rowLettersEven;
    const rowIdx = Math.floor((northing % 2000000) / 100000);
    const rowLetter = rowSet[Math.abs(rowIdx) % 20] || 'A';

    const e5 = Math.floor(Math.abs(easting) % 100000).toString().padStart(5, '0');
    const n5 = Math.floor(Math.abs(northing) % 100000).toString().padStart(5, '0');

    return `${zone}${band} ${colLetter}${rowLetter} ${e5} ${n5}`;
  } catch {
    return 'MGRS N/A';
  }
}

/**
 * Calculate bearing and distance in Nautical Miles from Coalition Bullseye
 */
export function formatBullseye(
  theater: Theater,
  lat: number,
  lon: number,
  coalition: 'blue' | 'red' = 'blue'
): { bearing: number; distanceNM: number; formatted: string } {
  const cfg = getTheaterConfig(theater);
  const safeTh = cfg.name;
  const bulls = THEATER_BULLSEYE[safeTh]?.[coalition] || THEATER_BULLSEYE.Caucasus[coalition];
  const distM = calculateDistance(bulls.lat, bulls.lon, lat, lon);
  const brg = Math.round(calculateBearing(bulls.lat, bulls.lon, lat, lon));
  const nm = parseFloat((distM / 1852).toFixed(1));

  return {
    bearing: brg,
    distanceNM: nm,
    formatted: `BULLS ${brg.toString().padStart(3, '0')}° / ${nm} NM`,
  };
}
