import React, { useState, useMemo } from 'react';
import type { Group, Waypoint } from '../types/dcs';
import { calculateDistance } from '../utils/coordinates';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Gauge,
  Navigation,
  ShieldAlert,
  Target,
} from 'lucide-react';

interface FlightProfileDrawerProps {
  group: Group;
  selectedWaypointId: number | null;
  onSelectWaypoint: (wpId: number) => void;
  missionStartTime?: number; // seconds from 00:00 (e.g. 36000 = 10:00)
}

interface ProfilePoint {
  wp: Waypoint;
  legDistanceNM: number;
  cumDistanceNM: number;
  legTimeSec: number;
  cumTimeSec: number;
  altFt: number;
  terrainFt: number;
}

export const FlightProfileDrawer: React.FC<FlightProfileDrawerProps> = ({
  group,
  selectedWaypointId,
  onSelectWaypoint,
  missionStartTime = 36000,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [totInput, setTotInput] = useState<string>('10:25:00');
  const [targetWpIndex, setTargetWpIndex] = useState<number>(() => {
    const pts = group.route.points;
    const targetIdx = pts.findIndex(
      (p) =>
        p.name?.toLowerCase().includes('target') ||
        p.name?.toLowerCase().includes('strike') ||
        p.name?.toLowerCase().includes('cas')
    );
    return targetIdx >= 0 ? targetIdx : Math.max(0, pts.length - 2);
  });

  const waypoints = group.route.points;

  // Calculate cumulative distances, times, and profile points
  const { profilePoints, totalDistanceNM, totalTimeSec, estFuelLbs, minClearanceFt } = useMemo(() => {
    if (waypoints.length === 0) {
      return { profilePoints: [], totalDistanceNM: 0, totalTimeSec: 0, estFuelLbs: 0, minClearanceFt: 99999 };
    }

    let cumDist = 0;
    let cumTime = 0;
    let minClearance = 99999;
    const pts: ProfilePoint[] = [];

    // Synthetic terrain baseline based on waypoint elevation / location
    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      let legDistM = 0;
      let legTime = 0;

      if (i > 0) {
        const prevWp = waypoints[i - 1];
        legDistM = calculateDistance(prevWp.lat, prevWp.lon, wp.lat, wp.lon);
        const speedMs = wp.speed > 0 ? wp.speed : 220; // default 220 m/s (~430 kts)
        legTime = legDistM / speedMs;
      }

      const legNM = legDistM / 1852;
      cumDist += legNM;
      cumTime += legTime;

      const altFt = Math.round(wp.alt * 3.28084);
      // Approximate terrain elevation (base elevation between 50 ft and 3000 ft depending on coords)
      const terrainApproxM = Math.max(10, Math.min(2200, Math.abs(Math.sin(wp.lat * 12) * Math.cos(wp.lon * 15)) * 1400));
      const terrainFt = Math.round(terrainApproxM * 3.28084);

      const clearance = altFt - terrainFt;
      if (clearance < minClearance) minClearance = clearance;

      pts.push({
        wp,
        legDistanceNM: parseFloat(legNM.toFixed(1)),
        cumDistanceNM: parseFloat(cumDist.toFixed(1)),
        legTimeSec: Math.round(legTime),
        cumTimeSec: Math.round(cumTime),
        altFt,
        terrainFt,
      });
    }

    // Fuel burn estimate (approx 65 lbs/min for modern fighter at cruise)
    const fuelRatePerMin = group.category === 'helicopter' ? 22 : 65;
    const estFuel = Math.round((cumTime / 60) * fuelRatePerMin * group.units.length);

    return {
      profilePoints: pts,
      totalDistanceNM: parseFloat(cumDist.toFixed(1)),
      totalTimeSec: Math.round(cumTime),
      estFuelLbs: estFuel,
      minClearanceFt: minClearance,
    };
  }, [waypoints, group.units.length, group.category]);

  if (waypoints.length < 2) return null;

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const targetPoint = profilePoints[targetWpIndex] || profilePoints[profilePoints.length - 1];

  // TOT calculation
  let requiredPushTimeStr = '---';
  let requiredSpeedKts = 0;
  try {
    const [tH, tM, tS] = totInput.split(':').map(Number);
    if (!isNaN(tH) && !isNaN(tM)) {
      const desiredTotSec = tH * 3600 + tM * 60 + (tS || 0);
      const enrouteToTargetSec = targetPoint ? targetPoint.cumTimeSec : 0;
      const pushSec = desiredTotSec - enrouteToTargetSec;
      if (pushSec > 0) {
        requiredPushTimeStr = `${formatTime(pushSec)} Z`;
      }
      if (targetPoint && targetPoint.cumDistanceNM > 0 && enrouteToTargetSec > 0) {
        requiredSpeedKts = Math.round((targetPoint.cumDistanceNM / (enrouteToTargetSec / 3600)));
      }
    }
  } catch {
    requiredPushTimeStr = 'Chybný formát';
  }

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 130;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 15;
  const padBottom = 25;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const maxAltFt = Math.max(30000, ...profilePoints.map((p) => p.altFt + 5000));

  const getX = (cumNM: number) => {
    return padLeft + (totalDistanceNM > 0 ? (cumNM / totalDistanceNM) * plotW : 0);
  };

  const getY = (alt: number) => {
    return padTop + plotH - (maxAltFt > 0 ? (Math.max(0, alt) / maxAltFt) * plotH : 0);
  };

  // Generate SVG path for Flight Line
  const flightPathD = profilePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.cumDistanceNM).toFixed(1)} ${getY(p.altFt).toFixed(1)}`)
    .join(' ');

  // Generate SVG path for Terrain Polygon
  const terrainPathD =
    profilePoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.cumDistanceNM).toFixed(1)} ${getY(p.terrainFt).toFixed(1)}`)
      .join(' ') +
    ` L ${padLeft + plotW} ${padTop + plotH} L ${padLeft} ${padTop + plotH} Z`;

  const isBlue = group.coalition === 'blue';
  const flightColor = isBlue ? '#38bdf8' : '#f87171';

  return (
    <div className="absolute bottom-2 left-2 right-2 md:left-72 md:right-80 z-20 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl overflow-hidden transition-all text-slate-100">
      
      {/* HEADER BAR (CLICK TO COLLAPSE/EXPAND) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none hover:bg-slate-850"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-400/30 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <span className="text-xs font-bold font-mono tracking-wide">
            VÝŠKOVÝ PROFIL TRASY & TOT // {group.name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            ({profilePoints.length} bodů | {totalDistanceNM} NM)
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Quick Metrics in Header */}
          <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono">
            <span className="text-sky-300">
              DIST: <strong>{totalDistanceNM} NM</strong>
            </span>
            <span className="text-amber-300">
              ETE: <strong>{formatTime(totalTimeSec)}</strong>
            </span>
            <span className="text-emerald-300">
              FUEL: <strong>~{estFuelLbs.toLocaleString()} lbs</strong>
            </span>
            {minClearanceFt < 1000 && (
              <span className="text-red-400 flex items-center gap-1 font-bold">
                <ShieldAlert className="w-3.5 h-3.5" /> LOW CLR
              </span>
            )}
          </div>

          <button className="p-1 text-slate-400 hover:text-white rounded">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* EXPANDABLE BODY */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          
          {/* TOP METRICS & TOT SYNCHRONIZER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono">
            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
              <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                <Navigation className="w-3 h-3 text-sky-400" /> VZDÁLENOST TRASY
              </span>
              <span className="text-sm font-bold text-sky-300">{totalDistanceNM} NM</span>
              <span className="text-[10px] text-slate-500 block">{(totalDistanceNM * 1.852).toFixed(1)} km</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
              <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> CELKOVÝ ČAS (ETE)
              </span>
              <span className="text-sm font-bold text-amber-300">{formatTime(totalTimeSec)}</span>
              <span className="text-[10px] text-slate-500 block">Start: {formatTime(missionStartTime)} Z</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
              <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" /> ODHAD PALIVA
              </span>
              <span className="text-sm font-bold text-orange-300">~{estFuelLbs.toLocaleString()} lbs</span>
              <span className="text-[10px] text-slate-500 block">~{Math.round(estFuelLbs * 0.453592)} kg</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
              <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                <Gauge className="w-3 h-3 text-emerald-400" /> MIN. VÝŠKA NAD ZEMÍ
              </span>
              <span
                className={`text-sm font-bold ${
                  minClearanceFt < 1000 ? 'text-red-400 font-extrabold' : 'text-emerald-300'
                }`}
              >
                {minClearanceFt.toLocaleString()} ft AGL
              </span>
              <span className="text-[10px] text-slate-500 block">
                {minClearanceFt < 1000 ? '⚠️ Nebezpečí nárazu' : 'Bezpečný odstup'}
              </span>
            </div>

            {/* TOT INPUT & CALCULATOR */}
            <div className="col-span-2 bg-slate-900/90 border border-indigo-900/60 p-2 rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-indigo-400 font-bold flex items-center gap-1">
                  <Target className="w-3 h-3" /> TOT KALKULÁTOR (TIME ON TARGET)
                </span>
                <select
                  value={targetWpIndex}
                  onChange={(e) => setTargetWpIndex(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300"
                >
                  {profilePoints.map((pt, idx) => (
                    <option key={pt.wp.id} value={idx}>
                      WP {pt.wp.id}: {pt.wp.name || `Waypoint ${pt.wp.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">TOT:</span>
                  <input
                    type="text"
                    value={totInput}
                    onChange={(e) => setTotInput(e.target.value)}
                    placeholder="HH:MM:SS"
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-sky-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  $\rightarrow$ PUSH ČAS: <strong className="text-amber-300">{requiredPushTimeStr}</strong>
                  {requiredSpeedKts > 0 && (
                    <span className="text-slate-400 text-[10px] ml-1">(@ {requiredSpeedKts} kts)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE SVG PROFILE GRAPH */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-32 select-none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="flightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={flightColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={flightColor} stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#453229" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#1a1411" stopOpacity="0.95" />
                </linearGradient>
              </defs>

              {/* Grid Lines (Altitude ft) */}
              {[10000, 20000, 30000].map((alt) => {
                if (alt > maxAltFt) return null;
                const y = getY(alt);
                return (
                  <g key={alt}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + plotW}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="3 3"
                      strokeWidth="0.8"
                    />
                    <text
                      x={padLeft - 6}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {alt / 1000}k
                    </text>
                  </g>
                );
              })}

              {/* Ground level line */}
              <line
                x1={padLeft}
                y1={padTop + plotH}
                x2={padLeft + plotW}
                y2={padTop + plotH}
                stroke="#475569"
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={padTop + plotH + 3}
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
              >
                0 ft
              </text>

              {/* Terrain Surface Polygon */}
              <path d={terrainPathD} fill="url(#terrainGrad)" stroke="#785c47" strokeWidth="1" />

              {/* Flight Profile Area & Line */}
              <path
                d={flightPathD + ` L ${padLeft + plotW} ${padTop + plotH} L ${padLeft} ${padTop + plotH} Z`}
                fill="url(#flightGrad)"
              />
              <path d={flightPathD} fill="none" stroke={flightColor} strokeWidth="2.5" />

              {/* Waypoint Nodes and Pins */}
              {profilePoints.map((pt) => {
                const x = getX(pt.cumDistanceNM);
                const y = getY(pt.altFt);
                const isSelected = selectedWaypointId === pt.wp.id;
                const isTarget = pt.wp.id === targetPoint?.wp.id;

                return (
                  <g
                    key={pt.wp.id}
                    className="cursor-pointer group"
                    onClick={() => onSelectWaypoint(pt.wp.id)}
                  >
                    {/* Vertical Dash Line */}
                    <line
                      x1={x}
                      y1={y}
                      x2={x}
                      y2={padTop + plotH}
                      stroke={isSelected ? '#38bdf8' : '#334155'}
                      strokeDasharray="2 2"
                      strokeWidth={isSelected ? '1.5' : '0.7'}
                    />

                    {/* Point Circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 6 : 4}
                      fill={isTarget ? '#f59e0b' : isSelected ? '#38bdf8' : '#0f172a'}
                      stroke={isSelected ? '#ffffff' : flightColor}
                      strokeWidth={isSelected ? 2 : 1.5}
                    />

                    {/* WP Label Top */}
                    <text
                      x={x}
                      y={Math.max(12, y - 8)}
                      fill={isTarget ? '#fbbf24' : isSelected ? '#38bdf8' : '#cbd5e1'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      WP{pt.wp.id}
                    </text>

                    {/* Distance on bottom */}
                    <text
                      x={x}
                      y={padTop + plotH + 16}
                      fill="#64748b"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {pt.cumDistanceNM} NM
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* WAYPOINT TABLE ROW SUMMARY */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[11px] font-mono">
            {profilePoints.map((pt) => {
              const isSelected = selectedWaypointId === pt.wp.id;
              const spdKts = Math.round(pt.wp.speed * 1.94384);
              return (
                <button
                  key={pt.wp.id}
                  onClick={() => onSelectWaypoint(pt.wp.id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-left shrink-0 transition-all ${
                    isSelected
                      ? 'bg-sky-950/70 border-sky-400 ring-1 ring-sky-400 text-sky-200'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <span>WP {pt.wp.id}: {pt.wp.name?.slice(0, 15) || 'Waypoint'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {pt.altFt.toLocaleString()} ft | {spdKts} kts | +{pt.cumDistanceNM} NM
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
};
