import React, { useState } from 'react';
import type { Group, Unit } from '../types/dcs';
import {
  getLoadoutProfile,
  findWeaponByClsid,
  getWeaponOptionsForStation,
  calculateLoadoutMetrics,
  COMMON_WEAPONS,
  type WeaponItem,
} from '../data/dcsWeapons';
import {
  Crosshair,
  Fuel,
  Shield,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  Flame,
  ChevronDown,
} from 'lucide-react';

interface LoadoutEditorProps {
  group: Group;
  onUpdateGroup: (group: Group) => void;
}

export const LoadoutEditor: React.FC<LoadoutEditorProps> = ({ group, onUpdateGroup }) => {
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);

  // If group is not an aircraft / helicopter flight
  if (group.category !== 'plane' && group.category !== 'helicopter') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
        <Shield className="w-12 h-12 text-slate-600" />
        <h3 className="text-sm font-bold text-slate-300">Konfigurace výzbroje není pro pozemní jednotky dostupná</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Loadout editor se závěsníky a municí je určen pro letadla a vrtulníky.
        </p>
      </div>
    );
  }

  const units = group.units;
  const currentUnitIndex = Math.min(selectedUnitIndex, units.length - 1);
  const currentUnit = units[currentUnitIndex];
  if (!currentUnit) return null;

  const profile = getLoadoutProfile(currentUnit.type);

  // Read current payload or fallback to defaults
  const currentPayload = currentUnit.payload || {};
  const currentPylons = currentPayload.pylons || {};
  const currentFuel = currentPayload.fuel ?? profile.maxFuelKg;
  const currentFlares = currentPayload.flare ?? profile.maxFlares;
  const currentChaff = currentPayload.chaff ?? profile.maxChaff;
  const currentGun = currentPayload.gun ?? 100;

  // Calculate metrics
  const metrics = calculateLoadoutMetrics(profile, currentPylons, currentFuel);

  // Helper to update current unit's payload
  const handleUpdateCurrentUnitPayload = (partialPayload: Partial<NonNullable<Unit['payload']>>) => {
    const updatedPayload = {
      pylons: currentPylons,
      fuel: currentFuel,
      flare: currentFlares,
      chaff: currentChaff,
      gun: currentGun,
      ...partialPayload,
    };

    const updatedUnits = units.map((u, idx) =>
      idx === currentUnitIndex ? { ...u, payload: updatedPayload } : u
    );

    onUpdateGroup({
      ...group,
      units: updatedUnits,
    });
  };

  // Change weapon on a specific pylon
  const handleSetPylonWeapon = (station: number, weapon: WeaponItem) => {
    const newPylons = {
      ...currentPylons,
      [station]: { clsid: weapon.clsid },
    };

    handleUpdateCurrentUnitPayload({ pylons: newPylons });
  };

  // Apply a preset
  const handleApplyPreset = (presetId: string) => {
    const preset = profile.presets.find((p) => p.id === presetId);
    if (!preset) return;

    const newPylons: Record<number, { clsid: string }> = {};
    for (const [stStr, weapon] of Object.entries(preset.pylons)) {
      const st = Number(stStr);
      newPylons[st] = { clsid: weapon.clsid };
    }

    handleUpdateCurrentUnitPayload({ pylons: newPylons });
  };

  // Clear all pylons to clean
  const handleClearAllPylons = () => {
    const cleanPylons: Record<number, { clsid: string }> = {};
    for (const p of profile.pylons) {
      cleanPylons[p.station] = { clsid: COMMON_WEAPONS.EMPTY.clsid };
    }
    handleUpdateCurrentUnitPayload({ pylons: cleanPylons });
  };

  // Copy current unit's loadout to all units in the group
  const handleCopyToAllUnits = () => {
    const payloadToClone = {
      pylons: { ...currentPylons },
      fuel: currentFuel,
      flare: currentFlares,
      chaff: currentChaff,
      gun: currentGun,
    };

    const updatedUnits = units.map((u) => ({
      ...u,
      payload: { ...payloadToClone },
    }));

    onUpdateGroup({
      ...group,
      units: updatedUnits,
    });

    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

  const fuelPct = Math.min(100, Math.max(0, Math.round((currentFuel / profile.maxFuelKg) * 100)));

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs text-slate-300">
      {/* Flight Unit Selector Header */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-900/80 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Aircraft / Flight selector */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Letoun:</span>
            <div className="relative flex-1">
              <select
                value={currentUnitIndex}
                onChange={(e) => setSelectedUnitIndex(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 font-medium appearance-none pr-6 truncate text-xs focus:outline-none focus:border-amber-500"
              >
                {units.map((u, idx) => (
                  <option key={u.unitId} value={idx}>
                    #{idx + 1} {u.name} ({u.type})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Copy to entire flight button */}
          {units.length > 1 && (
            <button
              onClick={handleCopyToAllUnits}
              title="Aplikovat výzbroj a palivo tohoto letadla na všechny členy letky"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all shrink-0 shadow ${
                copiedFeedback
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40'
              }`}
            >
              {copiedFeedback ? (
                <>
                  <Check className="w-3 h-3 text-white" />
                  <span>Aplikováno!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Kopírovat na letku</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Quick Loadout Presets */}
        {profile.presets.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Přednastavené konfigurace (Presets)
            </span>
            <div className="flex flex-wrap gap-1">
              {profile.presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  title={preset.description}
                  className="bg-slate-950 hover:bg-slate-800 hover:border-amber-500/70 border border-slate-700/80 text-slate-300 hover:text-amber-300 px-2 py-0.5 rounded text-[10px] font-medium transition-all"
                >
                  {preset.name.split('(')[0].trim()}
                </button>
              ))}
              <button
                onClick={handleClearAllPylons}
                title="Odstranit výzbroj ze všech závěsníků"
                className="bg-slate-950 hover:bg-red-950/40 hover:border-red-500/50 border border-slate-800 text-slate-400 hover:text-red-300 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Clean</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Weight & Takeoff Balance Card */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>Vzletová hmotnost (TOW)</span>
            </span>
            <span
              className={`font-mono font-bold ${
                metrics.isOverweight ? 'text-red-400 flex items-center gap-1' : 'text-slate-200'
              }`}
            >
              {metrics.isOverweight && <AlertTriangle className="w-3 h-3 text-red-400" />}
              {metrics.totalGrossWeightKg.toLocaleString()} kg /{' '}
              {Math.round(metrics.totalGrossWeightKg * 2.20462).toLocaleString()} lbs
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                metrics.isOverweight
                  ? 'bg-red-500'
                  : metrics.weightPct > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, metrics.weightPct)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-slate-400 font-mono border-t border-slate-800/80">
            <div>
              <span className="text-slate-500 block">Palivo:</span>
              <span className="text-sky-300">{metrics.totalFuelKg.toLocaleString()} kg</span>
            </div>
            <div>
              <span className="text-slate-500 block">Výzbroj:</span>
              <span className="text-amber-300">{metrics.weaponsWeightKg.toLocaleString()} kg</span>
            </div>
            <div>
              <span className="text-slate-500 block">Max MTOW:</span>
              <span className="text-slate-300">{metrics.maxGrossWeightKg.toLocaleString()} kg</span>
            </div>
          </div>
        </div>

        {/* Pylon Stations List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Závěsníky & Výzbroj ({profile.pylons.length} stanic)
            </span>
          </div>

          <div className="space-y-1.5">
            {profile.pylons.map((pylon) => {
              const assigned = currentPylons[pylon.station];
              const weapon = findWeaponByClsid(assigned?.clsid);
              const isClean = weapon.category === 'EMPTY';
              const options = getWeaponOptionsForStation(pylon);

              return (
                <div
                  key={pylon.station}
                  className={`p-2 rounded border transition-all ${
                    !isClean
                      ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                      : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-slate-800 text-amber-400 font-bold flex items-center justify-center font-mono text-[10px] border border-slate-700">
                        {pylon.station}
                      </span>
                      <span className="font-semibold text-slate-200 text-[11px]">{pylon.name}</span>
                    </div>

                    {/* Weight and Category indicator */}
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      {!isClean && (
                        <span className="text-amber-400 font-bold">{weapon.weightKg} kg</span>
                      )}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                          weapon.category === 'A2A'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800'
                            : weapon.category === 'A2G_GUIDED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : weapon.category === 'A2G_UNGUIDED'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : weapon.category === 'FUEL'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800'
                            : weapon.category === 'POD'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {weapon.category}
                      </span>
                    </div>
                  </div>

                  {/* Weapon Dropdown */}
                  <div className="flex items-center gap-1">
                    <select
                      value={weapon.clsid}
                      onChange={(e) => {
                        const selectedClsid = e.target.value;
                        const found = findWeaponByClsid(selectedClsid);
                        handleSetPylonWeapon(pylon.station, found);
                      }}
                      className={`flex-1 bg-slate-950 border rounded px-2 py-1 text-[11px] font-medium transition-colors focus:outline-none focus:border-amber-500 ${
                        !isClean
                          ? 'border-slate-700 text-slate-100 font-semibold'
                          : 'border-slate-800 text-slate-500'
                      }`}
                    >
                      {options.map((opt) => (
                        <option key={opt.clsid} value={opt.clsid}>
                          {opt.name} {opt.weightKg > 0 ? `(${opt.weightKg} kg)` : ''}
                        </option>
                      ))}
                    </select>

                    {!isClean && (
                      <button
                        onClick={() => handleSetPylonWeapon(pylon.station, COMMON_WEAPONS.EMPTY)}
                        title="Vyčistit stanici"
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Consumables (Fuel, Flares, Chaff, Gun) */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-sky-400" />
            <span>Palivo a spotřební materiál</span>
          </div>

          {/* Internal Fuel */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-semibold">Vnitřní palivo ({fuelPct}%)</span>
              <span className="font-mono text-sky-300 font-bold">
                {Math.round(currentFuel).toLocaleString()} kg /{' '}
                {Math.round(currentFuel * 2.20462).toLocaleString()} lbs
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={profile.maxFuelKg}
              step="50"
              value={currentFuel}
              onChange={(e) => handleUpdateCurrentUnitPayload({ fuel: Number(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between gap-1 pt-0.5">
              {[100, 75, 50, 25].map((pct) => (
                <button
                  key={pct}
                  onClick={() =>
                    handleUpdateCurrentUnitPayload({
                      fuel: Math.round((profile.maxFuelKg * pct) / 100),
                    })
                  }
                  className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded py-0.5 text-[9px] text-slate-400 hover:text-slate-200 font-mono transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Countermeasures: Chaff & Flares */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-850">
            {/* Chaff */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Chaff (Radar)</span>
                <span className="font-mono text-slate-200 font-bold">
                  {currentChaff} / {profile.maxChaff}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={profile.maxChaff}
                step="2"
                value={currentChaff}
                onChange={(e) => handleUpdateCurrentUnitPayload({ chaff: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Flare */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5 text-amber-500" />
                  <span>Flares (IR)</span>
                </span>
                <span className="font-mono text-slate-200 font-bold">
                  {currentFlares} / {profile.maxFlares}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={profile.maxFlares}
                step="2"
                value={currentFlares}
                onChange={(e) => handleUpdateCurrentUnitPayload({ flare: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Gun Ammo */}
          {profile.hasGun && (
            <div className="space-y-1 pt-1 border-t border-slate-850">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Munice do palubního kanónu</span>
                <span className="font-mono text-slate-200 font-bold">
                  {currentGun}%{' '}
                  {profile.gunMaxRounds
                    ? `(~${Math.round((profile.gunMaxRounds * currentGun) / 100)} nábojů)`
                    : ''}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={currentGun}
                onChange={(e) => handleUpdateCurrentUnitPayload({ gun: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
