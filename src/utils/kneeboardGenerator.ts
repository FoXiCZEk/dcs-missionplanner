import type { Group, MissionData } from '../types/dcs';
import {
  calculateBearing,
  calculateDistance,
  formatDdm,
  formatMgrs,
  formatBullseye,
  getTheaterConfig,
} from './coordinates';
import { DCS_CATALOG } from '../data/dcsCatalog';
import JSZip from 'jszip';

/**
 * Renders a high-resolution tactical kneeboard image onto an HTML5 Canvas
 */
export function renderKneeboardToCanvas(group: Group, missionData: MissionData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = 1024;
  const height = 1400;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const leadUnit = group.units[0];
  const catalogItem = leadUnit ? DCS_CATALOG.find((c) => c.id === leadUnit.type) : null;
  const aircraftName = catalogItem?.name || leadUnit?.type || 'Combat Aircraft';
  const theaterConfig = getTheaterConfig(missionData.theatre);

  // Background
  ctx.fillStyle = '#090d16'; // Deep tactical navy
  ctx.fillRect(0, 0, width, height);

  // Grid pattern overlay
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  for (let x = 40; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 40; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.setLineDash([]); // Reset dash

  // Outer border with corner brackets
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Corner accents
  ctx.lineWidth = 4;
  const cornerLen = 25;
  // Top-Left
  ctx.beginPath();
  ctx.moveTo(15, 15 + cornerLen);
  ctx.lineTo(15, 15);
  ctx.lineTo(15 + cornerLen, 15);
  ctx.stroke();
  // Top-Right
  ctx.beginPath();
  ctx.moveTo(width - 15 - cornerLen, 15);
  ctx.lineTo(width - 15, 15);
  ctx.lineTo(width - 15, 15 + cornerLen);
  ctx.stroke();
  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(15, height - 15 - cornerLen);
  ctx.lineTo(15, height - 15);
  ctx.lineTo(15 + cornerLen, height - 15);
  ctx.stroke();
  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(width - 15 - cornerLen, height - 15);
  ctx.lineTo(width - 15, height - 15);
  ctx.lineTo(width - 15, height - 15 - cornerLen);
  ctx.stroke();

  // --- HEADER SECTION ---
  let curY = 55;
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(30, curY, width - 60, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('DCS WORLD // TACTICAL FLIGHT CARD & NAV LOG', 45, curY + 32);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`THEATER: ${missionData.theatre.toUpperCase()}`, width - 45, curY + 32);
  ctx.textAlign = 'left';

  curY += 65;

  // Flight Info Banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(30, curY, width - 60, 85);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(30, curY, width - 60, 85);

  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(group.name, 45, curY + 32);

  ctx.font = '14px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`AIRFRAME: ${aircraftName.toUpperCase()}`, 45, curY + 56);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`FLIGHT SIZE: ${group.units.length} AIRCRAFT`, 45, curY + 74);

  // Time & Coalition Box
  const isBlue = group.coalition === 'blue';
  ctx.fillStyle = isBlue ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)';
  ctx.fillRect(width - 290, curY + 10, 245, 65);
  ctx.strokeStyle = isBlue ? '#0284c7' : '#b91c1c';
  ctx.strokeRect(width - 290, curY + 10, 245, 65);

  const startH = Math.floor(missionData.startTime / 3600);
  const startM = Math.floor((missionData.startTime % 3600) / 60);
  const timeStr = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')} ZULU`;

  ctx.fillStyle = isBlue ? '#38bdf8' : '#f87171';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(`COALITION: ${group.coalition.toUpperCase()}`, width - 275, curY + 34);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`T-0: ${timeStr}`, width - 275, curY + 58);

  curY += 105;

  // --- WAYPOINT NAVIGATION LOG (TABLE) ---
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('1. ROUTE & WAYPOINT NAVIGATION LOG', 30, curY);
  curY += 10;

  // Table Header
  const colX = [30, 80, 290, 430, 560, 670, 770, 870, width - 30];
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(30, curY, width - 60, 28);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('WP', colX[0] + 10, curY + 18);
  ctx.fillText('NAME', colX[1] + 10, curY + 18);
  ctx.fillText('ACTION', colX[2] + 10, curY + 18);
  ctx.fillText('ALT (FT/M)', colX[3] + 10, curY + 18);
  ctx.fillText('SPEED', colX[4] + 10, curY + 18);
  ctx.fillText('MAG BRG', colX[5] + 10, curY + 18);
  ctx.fillText('LEG NM', colX[6] + 10, curY + 18);
  ctx.fillText('TOTAL', colX[7] + 10, curY + 18);

  curY += 28;

  const points = group.route.points;
  let cumDistanceM = 0;

  points.forEach((wp, idx) => {
    let legDistM = 0;
    let brg = 0;

    if (idx > 0) {
      const prev = points[idx - 1];
      legDistM = calculateDistance(prev.lat, prev.lon, wp.lat, wp.lon);
      brg = Math.round(calculateBearing(prev.lat, prev.lon, wp.lat, wp.lon));
      cumDistanceM += legDistM;
    }

    const altFt = Math.round(wp.alt * 3.28084);
    const spdKts = Math.round(wp.speed * 1.94384);
    const legNM = (legDistM / 1852).toFixed(1);
    const cumNM = (cumDistanceM / 1852).toFixed(1);

    // Row background
    ctx.fillStyle = idx % 2 === 0 ? '#0b1120' : '#0f172a';
    ctx.fillRect(30, curY, width - 60, 26);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(30, curY, width - 60, 26);

    ctx.fillStyle = idx === 0 ? '#f59e0b' : '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${idx + 1}`, colX[0] + 12, curY + 18);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText((wp.name || `Waypoint ${idx + 1}`).slice(0, 20), colX[1] + 10, curY + 18);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText((wp.action || 'Turning Point').slice(0, 14), colX[2] + 10, curY + 18);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${altFt.toLocaleString()} ft`, colX[3] + 10, curY + 18);

    ctx.fillStyle = '#a3e635';
    ctx.fillText(`${spdKts} kts`, colX[4] + 10, curY + 18);

    ctx.fillStyle = idx > 0 ? '#fbbf24' : '#64748b';
    ctx.fillText(idx > 0 ? `${brg.toString().padStart(3, '0')}°` : '---', colX[5] + 10, curY + 18);

    ctx.fillStyle = idx > 0 ? '#f8fafc' : '#64748b';
    ctx.fillText(idx > 0 ? `${legNM} NM` : '---', colX[6] + 10, curY + 18);

    ctx.fillStyle = idx > 0 ? '#e2e8f0' : '#64748b';
    ctx.fillText(idx > 0 ? `${cumNM} NM` : '---', colX[7] + 10, curY + 18);

    curY += 26;
  });

  curY += 25;

  // --- TWO COLUMN SECTION: COMMS & SUPPORT ASSETS ---
  const colWidth = (width - 75) / 2;
  const leftX = 30;
  const rightX = leftX + colWidth + 15;

  // Box 1: COMMS & AIRBASES (Left)
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('2. COMMUNICATIONS & BASES', leftX, curY);

  const commsBoxY = curY + 10;
  const boxHeight = 220;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(leftX, commsBoxY, colWidth, boxHeight);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(leftX, commsBoxY, colWidth, boxHeight);

  let cY = commsBoxY + 24;
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('FLIGHT RADIO FREQUENCIES:', leftX + 15, cY);
  cY += 20;

  ctx.font = '12px monospace';
  ctx.fillStyle = '#f8fafc';
  const flightFreqMhz = leadUnit?.radio?.frequency ? (leadUnit.radio.frequency / 1000000).toFixed(3) : '251.000';
  ctx.fillText(`• PRI / FLIGHT TAC:  ${flightFreqMhz} MHz (AM)`, leftX + 20, cY);
  cY += 18;
  ctx.fillText(`• GUARD EMERGENCY:   243.000 MHz / 121.500 MHz`, leftX + 20, cY);
  cY += 26;

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('THEATER AIRBASES & NAVAIDS:', leftX + 15, cY);
  cY += 20;

  ctx.font = '11px monospace';
  ctx.fillStyle = '#cbd5e1';
  theaterConfig.airbases.slice(0, 4).forEach((ab) => {
    const tacanStr = ab.tacan ? `TCN: ${ab.tacan}` : '';
    const ilsStr = ab.ils ? `ILS: ${ab.ils}` : '';
    ctx.fillText(`${ab.name.padEnd(16, ' ')} RWY ${ab.runway.padEnd(5, ' ')} ${tacanStr} ${ilsStr}`, leftX + 20, cY);
    cY += 18;
  });

  // Box 2: SUPPORT ASSETS (Carriers, Tankers & AWACS) (Right)
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('3. SUPPORT ASSETS & CARRIERS (CSG / TKR / AWACS)', rightX, curY);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(rightX, commsBoxY, colWidth, boxHeight);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(rightX, commsBoxY, colWidth, boxHeight);

  let sY = commsBoxY + 22;

  // Search carriers in missionData
  const carrierGroups = missionData.groups.filter(
    (g) =>
      g.category === 'ship' &&
      g.units.some(
        (u) =>
          u.type.startsWith('CVN') ||
          u.type === 'Stennis' ||
          u.type === 'Forrestal' ||
          u.type === 'LHA_Tarawa' ||
          u.type.toUpperCase().includes('KUZNE')
      )
  );

  // Search tankers and AWACS in missionData
  const supportGroups = missionData.groups.filter(
    (g) =>
      g.units.some(
        (u) =>
          u.type.includes('135') ||
          u.type.includes('130') ||
          u.type.includes('78') ||
          u.type.includes('E-3') ||
          u.type.includes('A-50')
      )
  );

  // Check Pedro Plane Guard rescue helicopter
  const pedroHeli = missionData.groups.find(
    (g) =>
      g.name.toLowerCase().includes('pedro') ||
      g.units.some((u) => u.name?.toLowerCase().includes('pedro'))
  );

  let renderedSupportCount = 0;

  // 1. Render Carrier Strike Groups if present
  carrierGroups.forEach((cg) => {
    if (sY > commsBoxY + boxHeight - 45) return;
    const leadShip = cg.units[0];
    const catalogItem = DCS_CATALOG.find((c) => c.id === leadShip?.type);
    const shipName = catalogItem?.name || leadShip?.type || 'Aircraft Carrier';

    // Extract navaids from waypoint tasks
    let tacanStr = 'TCN: ---';
    let iclsStr = 'ICLS: ---';
    let link4Str = '';
    const wp1 = cg.route.points[0];
    const wp2 = cg.route.points[1];

    if (wp1?.task && (wp1.task as any).params?.tasks) {
      const tasks = (wp1.task as any).params.tasks as any[];
      for (const t of tasks) {
        if (t.id === 'ActivateBeacon' || t.key === 'ActivateBeacon') {
          const p = t.params;
          tacanStr = `TCN: ${p.channel}${p.modeChannel || 'X'}${p.callsign ? ' (' + p.callsign + ')' : ''}`;
        } else if (t.id === 'ActivateICLS' || t.key === 'ActivateICLS') {
          iclsStr = `ICLS: Ch ${t.params?.channel}`;
        } else if (t.id === 'ActivateLink4' || t.key === 'ActivateLink4') {
          const freqMhz = t.params?.frequency ? (t.params.frequency / 1000000).toFixed(1) : '';
          link4Str = freqMhz ? ` | LNK4: ${freqMhz}M` : '';
        }
      }
    }

    const towerMhz = leadShip?.radio?.frequency ? (leadShip.radio.frequency / 1000000).toFixed(3) : '127.500';
    let brcDeg = 270;
    let spdKts = 25;
    if (wp1 && wp2) {
      brcDeg = Math.round(calculateBearing(wp1.lat, wp1.lon, wp2.lat, wp2.lon));
      spdKts = Math.round((wp1.speed || 12.86) * 1.94384);
    } else if (leadShip?.heading !== undefined) {
      brcDeg = Math.round((leadShip.heading * 180) / Math.PI);
    }
    if (brcDeg < 0) brcDeg += 360;

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`⚓ CSG: ${shipName.slice(0, 30)}`, rightX + 15, sY);
    sY += 17;

    ctx.font = '11px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${tacanStr} | ${iclsStr}${link4Str}`, rightX + 18, sY);
    sY += 16;

    ctx.fillStyle = '#fbbf24';
    const pedroNote = pedroHeli ? ' | Pedro: ON STA' : '';
    ctx.fillText(`TWR: ${towerMhz} MHz | BRC: ${brcDeg.toString().padStart(3, '0')}° @ ${spdKts}kt${pedroNote}`, rightX + 18, sY);
    sY += 22;

    renderedSupportCount++;
  });

  // 2. Render Tankers & AWACS
  if (supportGroups.length > 0) {
    supportGroups.forEach((sg) => {
      if (sY > commsBoxY + boxHeight - 35) return;
      const sUnit = sg.units[0];
      const sFreq = sUnit.radio?.frequency ? (sUnit.radio.frequency / 1000000).toFixed(3) : '---';
      const sAltFt = Math.round(sUnit.alt * 3.28084);

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#a3e635';
      ctx.fillText(`• ${sg.name.slice(0, 28)}`, rightX + 15, sY);
      sY += 17;

      ctx.font = '11px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`  FREQ: ${sFreq} MHz | ALT: ${sAltFt} ft | SPD: ${Math.round(sUnit.speed || 150)} kts`, rightX + 15, sY);
      sY += 21;

      renderedSupportCount++;
    });
  }

  if (renderedSupportCount === 0) {
    ctx.font = '12px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Žádný CSG, tanker ani AWACS nebyl v misi nalezen.', rightX + 20, sY + 20);
    ctx.fillText('Použijte tlačítko "Nasazení jednotek" na mapě.', rightX + 20, sY + 40);
  }

  curY = commsBoxY + boxHeight + 25;

  // --- THREAT MATRIX & SAM SITES ---
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('4. AIR DEFENSE THREAT MATRIX (PVO INTEL)', leftX, curY);

  const threatBoxY = curY + 10;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(leftX, threatBoxY, width - 60, 160);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(leftX, threatBoxY, width - 60, 160);

  // Find enemy air defense units
  const enemyCoalition = group.coalition === 'blue' ? 'red' : 'blue';
  const threatGroups = missionData.groups.filter((g) => g.coalition === enemyCoalition && g.category === 'vehicle');

  let tY = threatBoxY + 25;
  let threatCount = 0;

  threatGroups.forEach((tg) => {
    tg.units.forEach((u) => {
      const cItem = DCS_CATALOG.find((ci) => ci.id === u.type);
      if (cItem?.threatRadius && threatCount < 5) {
        threatCount++;
        const ddm = formatDdm(u.lat, u.lon);
        const mgrs = formatMgrs(u.lat, u.lon);
        const bulls = formatBullseye(missionData.theatre, u.lat, u.lon, group.coalition === 'blue' ? 'blue' : 'red');

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`[THREAT ${threatCount}] ${cItem.name} (${Math.round(cItem.threatRadius / 1000)} km)`, leftX + 15, tY);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px monospace';
        ctx.fillText(`${ddm} | ${mgrs} | ${bulls.formatted}`, leftX + 380, tY);

        tY += 24;
      }
    });
  });

  if (threatCount === 0) {
    ctx.fillStyle = '#4ade80';
    ctx.font = '12px monospace';
    ctx.fillText('V operačním prostoru nebyly detekovány žádné těžké komplexy PVO (Airspace clear).', leftX + 20, tY + 10);
  }

  curY = threatBoxY + 185;

  // --- WEATHER & BULLSEYE REFERENCE (FOOTER) ---
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('5. FLIGHT WEATHER & BULLSEYE REFERENCE', leftX, curY);

  const footBoxY = curY + 10;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(leftX, footBoxY, width - 60, 130);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(leftX, footBoxY, width - 60, 130);

  const w = missionData.weather;
  const temp = w.season?.temperature ?? 20;
  const qnh = w.qnh ?? 760;
  const cloudsBase = w.clouds?.base ?? 2000;
  const wGround = w.wind?.atGround ? `${w.wind.atGround.dir}° / ${w.wind.atGround.speed} m/s` : 'CALM';
  const w2000 = w.wind?.at2000 ? `${w.wind.at2000.dir}° / ${w.wind.at2000.speed} m/s` : 'CALM';
  const w8000 = w.wind?.at8000 ? `${w.wind.at8000.dir}° / ${w.wind.at8000.speed} m/s` : 'CALM';

  let fY = footBoxY + 24;
  ctx.font = '12px monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(`• TEPLOTA: ${temp}°C  |  QNH: ${qnh} mmHg (${(qnh * 1.33322).toFixed(1)} hPa / ${(qnh * 0.03937).toFixed(2)} inHg)`, leftX + 20, fY);
  fY += 22;
  ctx.fillText(`• OBLAČNOST: Základna ${cloudsBase} m (~${Math.round(cloudsBase * 3.28084)} ft)  |  Viditelnost: ${(w.visibility?.distance ?? 80000) / 1000} km`, leftX + 20, fY);
  fY += 22;
  ctx.fillText(`• VÍTR: Přízemní: ${wGround}  |  2000 m: ${w2000}  |  8000 m: ${w8000}`, leftX + 20, fY);
  fY += 26;

  // Bullseye coords
  const safeTh = missionData.theatre === 'Syria' ? 'Syria' : 'Caucasus';
  const blueBulls = safeTh === 'Syria' ? 'Incirlik (37.002°N, 35.426°E)' : 'Kutaisi (42.176°N, 42.483°E)';
  const redBulls = safeTh === 'Syria' ? 'Damascus (33.415°N, 36.514°E)' : 'Nalchik (43.513°N, 43.636°E)';
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`• BULLSEYE REF: BLUE = ${blueBulls}  |  RED = ${redBulls}`, leftX + 20, fY);

  return canvas;
}

/**
 * Returns Kneeboard image as a Blob (image/png)
 */
export function renderKneeboardToBlob(group: Group, missionData: MissionData): Promise<Blob> {
  const canvas = renderKneeboardToCanvas(group, missionData);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Chyba při generování PNG kneeboardu'));
    }, 'image/png');
  });
}

/**
 * Packs customized kneeboard images directly into a .miz (ZIP) archive
 * under `Kneeboard/<aircraft_type>/` so they appear in-cockpit in DCS World.
 */
export async function packAllKneeboardsIntoZip(zip: JSZip, missionData: MissionData): Promise<void> {
  if (typeof document === 'undefined') {
    return;
  }

  const planeGroups = missionData.groups.filter((g) => g.category === 'plane' || g.category === 'helicopter');

  for (const group of planeGroups) {
    if (group.units.length === 0) continue;
    try {
      const leadType = group.units[0].type;
      const blob = await renderKneeboardToBlob(group, missionData);
      const arrayBuffer = await blob.arrayBuffer();

      // DCS looks for kneeboard images under:
      // Kneeboard/<aircraft_module_name>/<filename>.png
      const sanitizedGroupName = group.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const path = `Kneeboard/${leadType}/${sanitizedGroupName}_flight_card.png`;
      zip.file(path, arrayBuffer);
    } catch (e) {
      console.warn(`Could not render kneeboard for group ${group.name}:`, e);
    }
  }
}
