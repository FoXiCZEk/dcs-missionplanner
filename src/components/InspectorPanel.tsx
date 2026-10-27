import React, { useState } from 'react';
import type { Group, TriggerZone, Unit, Waypoint } from '../types/dcs';
import { DCS_CATALOG } from '../data/dcsCatalog';
import { calculateDistance, calculateBearing } from '../utils/coordinates';
import {
  X,
  Trash2,
  Plus,
  Navigation,
  Sliders,
  Users,
  ArrowUp,
  ArrowDown,
  Compass,
  Clock,
  Crosshair,
  Radio,
  Zap,
} from 'lucide-react';
import { LoadoutEditor } from './LoadoutEditor';

interface InspectorPanelProps {
  selectedGroup: Group | null;
  selectedZone: TriggerZone | null;
  selectedWaypointId: number | null;
  onSelectWaypoint: (wpId: number | null) => void;
  onClose: () => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (groupId: number) => void;
  onUpdateZone: (zone: TriggerZone) => void;
  onDeleteZone: (zoneId: number) => void;
  onStartAddWaypointMode?: () => void;
}

type GroupTab = 'units' | 'route' | 'loadout' | 'comms';
type UnitSystem = 'imperial' | 'metric'; // imperial = ft/kts, metric = m/kmh

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedGroup,
  selectedZone,
  selectedWaypointId,
  onSelectWaypoint,
  onClose,
  onUpdateGroup,
  onDeleteGroup,
  onUpdateZone,
  onDeleteZone,
  onStartAddWaypointMode,
}) => {
  const [activeGroupTab, setActiveGroupTab] = useState<GroupTab>('route');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');

  if (!selectedGroup && !selectedZone) return null;

  // --- GROUP EDITING ---
  if (selectedGroup) {
    const isBlue = selectedGroup.coalition === 'blue';
    const isRed = selectedGroup.coalition === 'red';

    // Route statistics
    const points = selectedGroup.route?.points || [];
    let totalDistanceM = 0;
    let totalTimeSec = 0;

    const legDetails: {
      distanceM: number;
      distanceNM: string;
      distanceKm: string;
      bearing: number;
      eteSec: number;
    }[] = [];

    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        legDetails.push({ distanceM: 0, distanceNM: '0', distanceKm: '0', bearing: 0, eteSec: 0 });
      } else {
        const prev = points[i - 1];
        const curr = points[i];
        const dM = calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon);
        const brg = Math.round(calculateBearing(prev.lat, prev.lon, curr.lat, curr.lon));
        const ete = curr.speed > 0 ? dM / curr.speed : 0;

        totalDistanceM += dM;
        totalTimeSec += ete;

        legDetails.push({
          distanceM: dM,
          distanceNM: (dM / 1852).toFixed(1),
          distanceKm: (dM / 1000).toFixed(1),
          bearing: brg,
          eteSec: Math.round(ete),
        });
      }
    }

    const totalNM = (totalDistanceM / 1852).toFixed(1);
    const totalKm = (totalDistanceM / 1000).toFixed(1);
    const totalMin = Math.round(totalTimeSec / 60);

    // Unit handlers
    const handleAddUnit = () => {
      const leadUnit = selectedGroup.units[0];
      const newUnitId = Math.max(...selectedGroup.units.map((u) => u.unitId), 0) + 1;
      const count = selectedGroup.units.length + 1;

      const newUnit: Unit = {
        unitId: newUnitId,
        name: `${selectedGroup.name.replace(/\s+\d+$/, '')} ${count}`,
        type: leadUnit ? leadUnit.type : 'F/A-18C_hornet',
        skill: 'Client',
        heading: leadUnit ? leadUnit.heading : 1.57,
        x: leadUnit ? leadUnit.x - 200 * count : 0,
        y: leadUnit ? leadUnit.y - 200 * count : 0,
        lat: leadUnit ? leadUnit.lat - 0.001 * count : 42.0,
        lon: leadUnit ? leadUnit.lon - 0.001 * count : 42.0,
        alt: leadUnit ? leadUnit.alt : 2000,
        speed: leadUnit ? leadUnit.speed : 200,
        radio: leadUnit?.radio,
      };

      onUpdateGroup({
        ...selectedGroup,
        units: [...selectedGroup.units, newUnit],
      });
    };

    const handleRemoveUnit = (unitId: number) => {
      if (selectedGroup.units.length <= 1) return;
      onUpdateGroup({
        ...selectedGroup,
        units: selectedGroup.units.filter((u) => u.unitId !== unitId),
      });
    };

    const handleUpdateUnit = (unitId: number, partial: Partial<Unit>) => {
      onUpdateGroup({
        ...selectedGroup,
        units: selectedGroup.units.map((u) => (u.unitId === unitId ? { ...u, ...partial } : u)),
      });
    };

    // Waypoint handlers
    const handleUpdateWaypoint = (wpId: number, partial: Partial<Waypoint>) => {
      onUpdateGroup({
        ...selectedGroup,
        route: {
          points: selectedGroup.route.points.map((p) => (p.id === wpId ? { ...p, ...partial } : p)),
        },
      });
    };

    const handleRemoveWaypoint = (wpId: number) => {
      if (selectedGroup.route.points.length <= 1) return;
      const updated = selectedGroup.route.points
        .filter((p) => p.id !== wpId)
        .map((p, idx) => ({ ...p, id: idx + 1 }));

      onUpdateGroup({
        ...selectedGroup,
        route: { points: updated },
      });

      if (selectedWaypointId === wpId) {
        onSelectWaypoint(updated[0]?.id || null);
      }
    };

    const handleInsertWaypointAfter = (wpId: number) => {
      const idx = points.findIndex((p) => p.id === wpId);
      if (idx === -1) return;

      const curr = points[idx];
      const next = points[idx + 1];

      // Interpolate midpoint if next exists, otherwise offset East
      const newLat = next ? (curr.lat + next.lat) / 2 : curr.lat + 0.05;
      const newLon = next ? (curr.lon + next.lon) / 2 : curr.lon + 0.08;

      const newPoint: Waypoint = {
        id: wpId + 1,
        name: `WP ${points.length + 1}`,
        lat: newLat,
        lon: newLon,
        x: curr.x + 5000,
        y: curr.y + 5000,
        alt: curr.alt,
        alt_type: curr.alt_type || 'BARO',
        speed: curr.speed,
        action: 'Turning Point',
        type: 'Turning Point',
      };

      const newPoints = [...points.slice(0, idx + 1), newPoint, ...points.slice(idx + 1)].map((p, i) => ({
        ...p,
        id: i + 1,
      }));

      onUpdateGroup({
        ...selectedGroup,
        route: { points: newPoints },
      });
      onSelectWaypoint(idx + 2);
    };

    const handleMoveWaypoint = (wpIndex: number, direction: 'up' | 'down') => {
      if (direction === 'up' && wpIndex === 0) return;
      if (direction === 'down' && wpIndex === points.length - 1) return;

      const targetIndex = direction === 'up' ? wpIndex - 1 : wpIndex + 1;
      const newPoints = [...points];
      const temp = newPoints[wpIndex];
      newPoints[wpIndex] = newPoints[targetIndex];
      newPoints[targetIndex] = temp;

      // Re-index points sequentially 1..N
      const reindexed = newPoints.map((p, i) => ({ ...p, id: i + 1 }));

      onUpdateGroup({
        ...selectedGroup,
        route: { points: reindexed },
      });
      onSelectWaypoint(targetIndex + 1);
    };

    return (
      <div className="absolute top-16 right-4 bottom-4 w-[420px] max-w-[95vw] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl flex flex-col z-20 overflow-hidden text-xs text-slate-300">
        {/* Header */}
        <div className="p-3 border-b border-slate-700/80 bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                isBlue ? 'bg-sky-400 ring-2 ring-sky-500/40' : isRed ? 'bg-red-500 ring-2 ring-red-500/40' : 'bg-emerald-400'
              }`}
            />
            <span className="font-bold text-slate-100 text-sm truncate">{selectedGroup.name}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onDeleteGroup(selectedGroup.groupId)}
              title="Smazat skupinu"
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switcher: Route vs Units vs Loadout */}
        <div className="flex border-b border-slate-700/80 bg-slate-950/50 p-1 gap-1">
          <button
            onClick={() => setActiveGroupTab('route')}
            className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
              activeGroupTab === 'route'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Trasa ({points.length})</span>
          </button>

          <button
            onClick={() => setActiveGroupTab('units')}
            className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
              activeGroupTab === 'units'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Letka ({selectedGroup.units.length})</span>
          </button>

          {(selectedGroup.category === 'plane' || selectedGroup.category === 'helicopter') && (
            <>
              <button
                onClick={() => setActiveGroupTab('loadout')}
                className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                  activeGroupTab === 'loadout'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Výzbroj</span>
              </button>
              <button
                onClick={() => setActiveGroupTab('comms')}
                className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                  activeGroupTab === 'comms'
                    ? 'bg-indigo-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Rádio</span>
              </button>
            </>
          )}
        </div>

        {/* TAB 1: ROUTE & WAYPOINTS */}
        {activeGroupTab === 'route' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Route summary & unit switcher */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                {/* Distance & ETE stats */}
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-amber-300">{totalNM} NM</span>
                    <span className="text-slate-500">({totalKm} km)</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>~{totalMin} min</span>
                  </span>
                </div>

                {/* Imperial / Metric switcher */}
                <div className="flex items-center bg-slate-950 rounded border border-slate-700/80 p-0.5 text-[10px]">
                  <button
                    onClick={() => setUnitSystem('imperial')}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      unitSystem === 'imperial' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    ft / kts
                  </button>
                  <button
                    onClick={() => setUnitSystem('metric')}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      unitSystem === 'metric' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    m / km/h
                  </button>
                </div>
              </div>

              {/* Action buttons: Add on map & Add next */}
              <div className="flex items-center gap-2">
                {onStartAddWaypointMode && (
                  <button
                    onClick={onStartAddWaypointMode}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600/80 hover:bg-amber-500 text-white font-bold py-1.5 px-2.5 rounded transition-colors text-[11px] shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Přidat WP klikem na mapu</span>
                  </button>
                )}
                <button
                  onClick={() => handleInsertWaypointAfter(selectedWaypointId || points[points.length - 1].id)}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-1.5 px-2.5 rounded transition-colors text-[11px] border border-slate-700"
                >
                  <Plus className="w-3 h-3" />
                  <span>Vložit za vybraný</span>
                </button>
              </div>
            </div>

            {/* Scrollable Waypoints List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {points.map((wp, wpIdx) => {
                const isSelected = selectedWaypointId === wp.id || (!selectedWaypointId && wpIdx === 0);
                const leg = legDetails[wpIdx];
                const isFirst = wpIdx === 0;

                // Units conversion
                const altM = Math.round(wp.alt);
                const altFt = Math.round(wp.alt * 3.28084);
                const spdMs = Math.round(wp.speed);
                const spdKts = Math.round(wp.speed * 1.94384);
                const spdKmh = Math.round(wp.speed * 3.6);

                return (
                  <div
                    key={wp.id}
                    onClick={() => onSelectWaypoint(wp.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-amber-950/20 border-amber-500 shadow-lg ring-1 ring-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Waypoint Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                            isSelected ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {wpIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={wp.name || `Waypoint ${wpIdx + 1}`}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateWaypoint(wp.id, { name: e.target.value })}
                          className="bg-transparent font-bold text-slate-100 hover:bg-slate-900 focus:bg-slate-900 border-b border-transparent focus:border-amber-500 px-1 py-0.5 rounded focus:outline-none"
                        />
                      </div>

                      {/* Move Up / Down & Delete */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleMoveWaypoint(wpIdx, 'up')}
                          disabled={isFirst}
                          title="Posunout nahoru v trase"
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveWaypoint(wpIdx, 'down')}
                          disabled={wpIdx === points.length - 1}
                          title="Posunout dolů v trase"
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {points.length > 1 && (
                          <button
                            onClick={() => handleRemoveWaypoint(wp.id)}
                            title="Smazat waypoint"
                            className="p-1 text-slate-400 hover:text-red-400 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Leg Info (if not first WP) */}
                    {!isFirst && leg && (
                      <div className="flex items-center gap-3 bg-slate-900/60 px-2 py-1 rounded text-[10px] text-slate-400 font-mono">
                        <span>
                          Úsek od WP {wpIdx}: <strong className="text-amber-300">{leg.distanceNM} NM</strong> ({leg.distanceKm} km)
                        </span>
                        <span>•</span>
                        <span>
                          Kurz: <strong className="text-sky-300">{leg.bearing.toString().padStart(3, '0')}°</strong>
                        </span>
                        <span>•</span>
                        <span>Čas: ~{Math.round(leg.eteSec / 60)} min</span>
                      </div>
                    )}

                    {/* Action Selector */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Typ akce (DCS Action)</label>
                      <select
                        value={wp.action}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleUpdateWaypoint(wp.id, { action: e.target.value, type: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-semibold"
                      >
                        <option value="Turning Point">Turning Point (Běžný otočný bod)</option>
                        <option value="Fly Over">Fly Over (Přelet bez předčasného zatáčení)</option>
                        <option value="Takeoff Parking">Takeoff Parking (Start ze stojánky - Cold)</option>
                        <option value="Takeoff Parking Hot">Takeoff Parking Hot (Start - Nastartováno)</option>
                        <option value="Takeoff Runway">Takeoff Runway (Start z dráhy)</option>
                        <option value="Landing">Landing (Přistání na letišti)</option>
                        <option value="Refueling">Refueling (Tankování za letu)</option>
                      </select>

                      {wp.action.includes('Parking') && (
                        <div className="mt-1.5 flex items-center justify-between bg-slate-900/60 p-1.5 rounded border border-slate-700/60">
                          <label className="text-[10px] text-slate-400">Číslo stání (Ramp / Parking #):</label>
                          <input
                            type="number"
                            min={1}
                            max={999}
                            value={wp.parking || 1}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateWaypoint(wp.id, { parking: Number(e.target.value) })}
                            className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-slate-100 font-bold"
                          />
                        </div>
                      )}
                    </div>

                    {/* Altitude & Speed Grid */}
                    <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Altitude */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Výška ({unitSystem === 'imperial' ? 'ft' : 'm'})</span>
                          <button
                            onClick={() =>
                              handleUpdateWaypoint(wp.id, {
                                alt_type: wp.alt_type === 'RADIO' ? 'BARO' : 'RADIO',
                              })
                            }
                            className="text-[9px] text-sky-400 hover:underline uppercase font-bold"
                          >
                            {wp.alt_type || 'BARO'}
                          </button>
                        </div>
                        <input
                          type="number"
                          value={unitSystem === 'imperial' ? altFt : altM}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const inMeters = unitSystem === 'imperial' ? Math.round(val / 3.28084) : val;
                            handleUpdateWaypoint(wp.id, { alt: inMeters });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-100"
                        />
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          {unitSystem === 'imperial' ? `${altM} m MSL` : `${altFt} ft MSL`}
                        </div>
                      </div>

                      {/* Speed */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span>Rychlost ({unitSystem === 'imperial' ? 'kts' : 'km/h'})</span>
                          <span className="text-[9px] text-slate-500 font-mono">{spdMs} m/s</span>
                        </div>
                        <input
                          type="number"
                          value={unitSystem === 'imperial' ? spdKts : spdKmh}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const inMs = unitSystem === 'imperial' ? Math.round(val / 1.94384) : Math.round(val / 3.6);
                            handleUpdateWaypoint(wp.id, { speed: inMs });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-100"
                        />
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          {unitSystem === 'imperial' ? `${spdKmh} km/h` : `${spdKts} kts`}
                        </div>
                      </div>
                    </div>

                    {/* Coordinates Readout */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                      <span>Lat: {wp.lat.toFixed(4)}°</span>
                      <span>Lon: {wp.lon.toFixed(4)}°</span>
                      <span>DCS: {Math.round(wp.x / 1000)}k, {Math.round(wp.y / 1000)}k</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: UNITS & FLIGHT SETTINGS */}
        {activeGroupTab === 'units' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Group General info */}
            <div className="space-y-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Základní konfigurace letky</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Název skupiny</label>
                <input
                  type="text"
                  value={selectedGroup.name}
                  onChange={(e) => onUpdateGroup({ ...selectedGroup, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Koalice</label>
                  <select
                    value={selectedGroup.coalition}
                    onChange={(e) => onUpdateGroup({ ...selectedGroup, coalition: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="blue">Blue (Modrá)</option>
                    <option value="red">Red (Červená)</option>
                    <option value="neutrals">Neutral (Neutrální)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Kategorie</label>
                  <select
                    value={selectedGroup.category}
                    onChange={(e) => onUpdateGroup({ ...selectedGroup, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="plane">Letadla</option>
                    <option value="helicopter">Vrtulníky</option>
                    <option value="vehicle">Pozemní technika</option>
                    <option value="ship">Lodě</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Units list */}
            <div className="space-y-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Jednotky v letce ({selectedGroup.units.length})</span>
                </div>
                <button
                  onClick={handleAddUnit}
                  className="flex items-center gap-1 bg-emerald-600/80 hover:bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Číslo</span>
                </button>
              </div>

              <div className="space-y-2">
                {selectedGroup.units.map((unit, index) => (
                  <div key={unit.unitId} className="bg-slate-950/70 p-2.5 rounded border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-slate-800 text-slate-300 text-[10px] flex items-center justify-center font-mono">
                          {index + 1}
                        </span>
                        <span>{unit.name}</span>
                      </span>
                      {selectedGroup.units.length > 1 && (
                        <button
                          onClick={() => handleRemoveUnit(unit.unitId)}
                          className="text-slate-500 hover:text-red-400"
                          title="Odebrat jednotku"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Typ modulu</label>
                        <select
                          value={unit.type}
                          onChange={(e) => handleUpdateUnit(unit.unitId, { type: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-200 text-[11px]"
                        >
                          {DCS_CATALOG.filter((item) => item.category === selectedGroup.category).map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Dovednost / Slot</label>
                        <select
                          value={unit.skill}
                          onChange={(e) => handleUpdateUnit(unit.unitId, { skill: e.target.value as any })}
                          className={`w-full border rounded px-1.5 py-1 font-bold text-[11px] ${
                            unit.skill === 'Client'
                              ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                              : 'bg-slate-900 border-slate-700 text-slate-200'
                          }`}
                        >
                          <option value="Client">⭐ Client (MP Slot)</option>
                          <option value="Player">Player (Singleplayer)</option>
                          <option value="Excellent">AI: Excellent</option>
                          <option value="High">AI: High</option>
                          <option value="Good">AI: Good</option>
                          <option value="Average">AI: Average</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Výška (m)</label>
                        <input
                          type="number"
                          value={unit.alt}
                          onChange={(e) => handleUpdateUnit(unit.unitId, { alt: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Rychlost (m/s)</label>
                        <input
                          type="number"
                          value={unit.speed || 200}
                          onChange={(e) => handleUpdateUnit(unit.unitId, { speed: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Kurz (°)</label>
                        <input
                          type="number"
                          min="0"
                          max="360"
                          value={Math.round(((unit.heading * 180) / Math.PI + 360) % 360)}
                          onChange={(e) =>
                            handleUpdateUnit(unit.unitId, {
                              heading: (Number(e.target.value) * Math.PI) / 180,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOADOUT & WEAPONS */}
        {activeGroupTab === 'loadout' && (
          <LoadoutEditor group={selectedGroup} onUpdateGroup={onUpdateGroup} />
        )}

        {/* TAB 4: COMMS & RADIO PRESETS */}
        {activeGroupTab === 'comms' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Primary Radio Frequency */}
            {(() => {
              const leadUnit = selectedGroup.units[0];
              const curFreqMhz = leadUnit?.radio?.frequency
                ? (leadUnit.radio.frequency / 1000000).toFixed(3)
                : '305.000';
              const curMod = leadUnit?.radio?.modulation ?? 0;
              const channels = leadUnit?.radio?.channels || {};

              const handleSetFreq = (mhz: number) => {
                const hz = Math.round(mhz * 1000000);
                const updatedUnits = selectedGroup.units.map((u) => ({
                  ...u,
                  radio: {
                    ...u.radio,
                    frequency: hz,
                    modulation: u.radio?.modulation ?? 0,
                  },
                }));
                onUpdateGroup({ ...selectedGroup, units: updatedUnits });
              };

              const handleSetModulation = (mod: number) => {
                const updatedUnits = selectedGroup.units.map((u) => ({
                  ...u,
                  radio: {
                    frequency: u.radio?.frequency ?? 305000000,
                    modulation: mod,
                    channels: u.radio?.channels,
                  },
                }));
                onUpdateGroup({ ...selectedGroup, units: updatedUnits });
              };

              const handleSetChannel = (chNum: number, mhz: number) => {
                const hz = Math.round(mhz * 1000000);
                const newChannels = { ...channels, [chNum]: hz };
                const updatedUnits = selectedGroup.units.map((u) => ({
                  ...u,
                  radio: {
                    frequency: u.radio?.frequency ?? 305000000,
                    modulation: u.radio?.modulation ?? 0,
                    channels: newChannels,
                  },
                }));
                onUpdateGroup({ ...selectedGroup, units: updatedUnits });
              };

              const handleAutoFillPresets = () => {
                const defaultPresets: Record<number, number> = {
                  1: 127500000, // Tower / ATC (127.500)
                  2: leadUnit?.radio?.frequency || 305000000, // Flight TAC
                  3: 255000000, // AWACS Magic (255.000)
                  4: 251000000, // Tanker Texaco (251.000)
                  5: 252000000, // Tanker Arco (252.000)
                  6: 133000000, // JTAC Playboy (133.000)
                  7: 260000000, // Strike Ops (260.000)
                  8: 265000000, // Package Lead (265.000)
                  16: 243000000, // Guard Emergency (243.000)
                };
                const updatedUnits = selectedGroup.units.map((u) => ({
                  ...u,
                  radio: {
                    frequency: u.radio?.frequency ?? 305000000,
                    modulation: u.radio?.modulation ?? 0,
                    channels: defaultPresets,
                  },
                }));
                onUpdateGroup({ ...selectedGroup, units: updatedUnits });
              };

              const channelLabels: Record<number, string> = {
                1: 'Věž / ATC (Tower)',
                2: 'Taktická letky (Flight TAC)',
                3: 'AWACS (Magic / Overlord)',
                4: 'Tanker Boom (Texaco)',
                5: 'Tanker Drogue (Arco)',
                6: 'JTAC (Playboy)',
                7: 'Strike Primary',
                8: 'Package Lead',
                16: 'Guard Emergency (UHF)',
              };

              return (
                <div className="space-y-4">
                  {/* Primary Radio */}
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                        <Radio className="w-4 h-4 text-sky-400" />
                        <span>Primární frekvence letky (PRI)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Sdíleno pro {selectedGroup.units.length} letounů
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Frekvence (MHz)</label>
                        <input
                          type="number"
                          step="0.025"
                          value={curFreqMhz}
                          onChange={(e) => handleSetFreq(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Modulace</label>
                        <select
                          value={curMod}
                          onChange={(e) => handleSetModulation(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-sky-500"
                        >
                          <option value={0}>AM (VHF / UHF letecká)</option>
                          <option value={1}>FM (Pozemní návodčí / JTAC)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Radio Presets Channels 1 - 20 */}
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Předvolby rádia (Presets Ch 1 - 20)</span>
                      </span>

                      <button
                        onClick={handleAutoFillPresets}
                        className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold transition-colors flex items-center gap-1"
                        title="Automaticky nastavit kanály pro Věž, AWACS, Tanker, JTAC a Guard"
                      >
                        <Zap className="w-3 h-3" />
                        <span>⚡ Vyplnit z mise</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Tyto kanály budou nahrány přímo do rádia letounu v kokpitu (F/A-18C, F-16C, A-10C, F-15E).
                    </p>

                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((ch) => {
                        const freqHz = channels[ch];
                        const freqMhz = freqHz ? (freqHz / 1000000).toFixed(3) : '';
                        const label = channelLabels[ch] || `Kanál ${ch}`;

                        return (
                          <div
                            key={ch}
                            className="flex items-center justify-between bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px] font-mono"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-5 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-[10px]">
                                {ch}
                              </span>
                              <span className="text-slate-300 text-xs truncate max-w-[170px]">{label}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.025"
                                placeholder="---.---"
                                value={freqMhz}
                                onChange={(e) => handleSetChannel(ch, Number(e.target.value))}
                                className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-right text-sky-300 font-bold focus:outline-none focus:border-sky-500"
                              />
                              <span className="text-[10px] text-slate-500">MHz</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  // --- TRIGGER ZONE EDITING ---
  if (selectedZone) {
    return (
      <div className="absolute top-16 right-4 bottom-4 w-96 max-w-[90vw] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl flex flex-col z-20 overflow-hidden text-xs text-slate-300">
        <div className="p-3 border-b border-slate-700/80 bg-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-500/40" />
            <span className="font-bold text-slate-100 text-sm truncate">{selectedZone.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDeleteZone(selectedZone.zoneId)}
              title="Smazat zónu"
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Název trigger zóny</label>
              <input
                type="text"
                value={selectedZone.name}
                onChange={(e) => onUpdateZone({ ...selectedZone, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Poloměr zóny (metry): <span className="text-amber-400 font-bold">{selectedZone.radius.toLocaleString()} m</span> (
                {(selectedZone.radius / 1000).toFixed(1)} km)
              </label>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={selectedZone.radius}
                onChange={(e) => onUpdateZone({ ...selectedZone, radius: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div>
                <span className="block text-[10px] uppercase">Zeměpisná šířka (Lat)</span>
                <span className="text-slate-200 font-mono">{selectedZone.lat.toFixed(5)}°</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">Zeměpisná délka (Lon)</span>
                <span className="text-slate-200 font-mono">{selectedZone.lon.toFixed(5)}°</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">DCS X (Sever, m)</span>
                <span className="text-slate-200 font-mono">{Math.round(selectedZone.x)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">DCS Y (Východ, m)</span>
                <span className="text-slate-200 font-mono">{Math.round(selectedZone.y)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
