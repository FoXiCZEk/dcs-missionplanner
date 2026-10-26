import React, { useState } from 'react';
import type { MissionData, Group, Unit } from '../types/dcs';
import { DCS_CATALOG } from '../data/dcsCatalog';
import { getTheaterConfig, latLonToDcs } from '../utils/coordinates';
import {
  Users,
  Plus,
  Plane,
  Trash2,
  Radio,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface MultiplayerSlotsProps {
  missionData: MissionData;
  onUpdateMissionData: (data: MissionData) => void;
}

export const MultiplayerSlots: React.FC<MultiplayerSlotsProps> = ({
  missionData,
  onUpdateMissionData,
}) => {
  const [filterCoalition, setFilterCoalition] = useState<'all' | 'blue' | 'red'>('all');
  const theaterConfig = getTheaterConfig(missionData.theatre);
  const [quickSpawnType, setQuickSpawnType] = useState('F/A-18C_hornet');
  const [quickSpawnCount, setQuickSpawnCount] = useState<number>(4);
  const [quickSpawnAirbase, setQuickSpawnAirbase] = useState<string>(
    theaterConfig.airbases[0]?.id || ''
  );

  // Extract all client/player units across all groups
  const allClientUnits: { group: Group; unit: Unit }[] = [];
  (missionData.groups || []).forEach((group) => {
    (group.units || []).forEach((unit) => {
      if (unit.skill === 'Client' || unit.skill === 'Player') {
        if (filterCoalition === 'all' || group.coalition === filterCoalition) {
          allClientUnits.push({ group, unit });
        }
      }
    });
  });

  const totalClientSlots = (missionData.groups || []).reduce(
    (acc, g) => acc + (g.units || []).filter((u) => u.skill === 'Client' || u.skill === 'Player').length,
    0
  );
  const blueSlots = (missionData.groups || [])
    .filter((g) => g.coalition === 'blue')
    .reduce((acc, g) => acc + (g.units || []).filter((u) => u.skill === 'Client' || u.skill === 'Player').length, 0);
  const redSlots = (missionData.groups || [])
    .filter((g) => g.coalition === 'red')
    .reduce((acc, g) => acc + (g.units || []).filter((u) => u.skill === 'Client' || u.skill === 'Player').length, 0);

  // Quick Spawn Flight
  const handleQuickSpawnFlight = (coalition: 'blue' | 'red') => {
    const selectedAb = theaterConfig.airbases.find((ab) => ab.id === quickSpawnAirbase) || theaterConfig.airbases[0];
    const catalogItem = DCS_CATALOG.find((c) => c.id === quickSpawnType);
    const category = catalogItem?.category || 'plane';

    const baseLat = selectedAb.lat;
    const baseLon = selectedAb.lon;
    const baseDcs = latLonToDcs(missionData.theatre, baseLat, baseLon);

    const callsignPrefix = coalition === 'blue' ? 'Chevy' : '101';
    const groupName = `${callsignPrefix} ${missionData.groups.length + 1} (${catalogItem?.name || quickSpawnType})`;

    const newUnits: Unit[] = [];
    const maxExistingUnitId = Math.max(
      ...missionData.groups.flatMap((g) => g.units.map((u) => u.unitId)),
      0
    );

    for (let i = 0; i < quickSpawnCount; i++) {
      const uId = maxExistingUnitId + i + 1;
      const offsetLat = baseLat + (i * 0.0008);
      const offsetLon = baseLon + (i * 0.0008);
      const offsetDcs = latLonToDcs(missionData.theatre, offsetLat, offsetLon);

      newUnits.push({
        unitId: uId,
        name: `${groupName} #${i + 1}`,
        type: quickSpawnType,
        skill: 'Client', // Server multiplayer client slot!
        heading: 1.57,
        x: offsetDcs.x,
        y: offsetDcs.y,
        lat: offsetLat,
        lon: offsetLon,
        alt: selectedAb.elevation + 2,
        speed: 0,
        radio: {
          frequency: coalition === 'blue' ? 305000000 : 124000000,
          modulation: 0,
        },
      });
    }

    const newGroup: Group = {
      groupId: Math.max(...missionData.groups.map((g) => g.groupId), 0) + 1,
      name: groupName,
      category,
      coalition,
      countryId: coalition === 'blue' ? 2 : 0,
      countryName: coalition === 'blue' ? 'USA' : 'Russia',
      units: newUnits,
      route: {
        points: [
          {
            id: 1,
            name: `Ramp - ${selectedAb.name}`,
            lat: baseLat,
            lon: baseLon,
            x: baseDcs.x,
            y: baseDcs.y,
            alt: selectedAb.elevation,
            speed: 0,
            action: 'Takeoff Parking',
            type: 'Takeoff Parking',
          },
        ],
      },
    };

    onUpdateMissionData({
      ...missionData,
      groups: [...missionData.groups, newGroup],
    });
  };

  const handleUpdateUnit = (groupId: number, unitId: number, partial: Partial<Unit>) => {
    const updatedGroups = missionData.groups.map((g) => {
      if (g.groupId !== groupId) return g;
      return {
        ...g,
        units: g.units.map((u) => (u.unitId === unitId ? { ...u, ...partial } : u)),
      };
    });
    onUpdateMissionData({ ...missionData, groups: updatedGroups });
  };

  const handleDeleteUnit = (groupId: number, unitId: number) => {
    const group = missionData.groups.find((g) => g.groupId === groupId);
    if (!group) return;

    if (group.units.length <= 1) {
      // delete entire group
      const updated = missionData.groups.filter((g) => g.groupId !== groupId);
      onUpdateMissionData({ ...missionData, groups: updated });
    } else {
      const updatedUnits = group.units.filter((u) => u.unitId !== unitId);
      const updatedGroups = missionData.groups.map((g) =>
        g.groupId === groupId ? { ...g, units: updatedUnits } : g
      );
      onUpdateMissionData({ ...missionData, groups: updatedGroups });
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-200 overflow-hidden text-xs">
      {/* Top Header & Slot Statistics */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Správa Multiplayer Slotů</span>
          </h2>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Konfigurace hráčských slotů (Client/Player) pro DCS dedikovaný server na mapě {missionData.theatre}.
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-400">Celkem slotů:</span>
            <span className="font-bold text-amber-400 text-sm">{totalClientSlots}</span>
          </div>

          <div className="bg-sky-950/50 border border-sky-800/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-sky-300">Modrá (Blue):</span>
            <span className="font-bold text-sky-400 text-sm">{blueSlots}</span>
          </div>

          <div className="bg-red-950/50 border border-red-800/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-red-300">Červená (Red):</span>
            <span className="font-bold text-red-400 text-sm">{redSlots}</span>
          </div>
        </div>
      </div>

      {/* Quick Generator Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Rychlé generování letky:</span>
          </span>

          <select
            value={quickSpawnType}
            onChange={(e) => setQuickSpawnType(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-semibold"
          >
            {DCS_CATALOG.filter((c) => c.category === 'plane' || c.category === 'helicopter').map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={quickSpawnCount}
            onChange={(e) => setQuickSpawnCount(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100"
          >
            <option value={1}>1x letoun (Solo)</option>
            <option value={2}>2x letouny (Dvojice)</option>
            <option value={4}>4x letouny (Čtyřka)</option>
          </select>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={quickSpawnAirbase}
              onChange={(e) => setQuickSpawnAirbase(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100"
            >
              {theaterConfig.airbases.map((ab) => (
                <option key={ab.id} value={ab.id}>
                  {ab.name} (RWY {ab.runway})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuickSpawnFlight('blue')}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1 rounded transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Modrá letka (Blue)</span>
          </button>
          <button
            onClick={() => handleQuickSpawnFlight('red')}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Červená letka (Red)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'blue', 'red'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilterCoalition(c)}
              className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                filterCoalition === c
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {c === 'all' ? 'Všechny koalice' : c === 'blue' ? 'Modré sloty' : 'Červené sloty'}
            </button>
          ))}
        </div>

        <span className="text-slate-500 text-[11px]">
          Zobrazeno {allClientUnits.length} slotů
        </span>
      </div>

      {/* Slots Table */}
      <div className="flex-1 overflow-y-auto p-4">
        {allClientUnits.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Plane className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="font-semibold text-sm">Žádné multiplayer sloty</p>
            <p className="text-xs mt-1 text-slate-500">
              Použijte generátor výše pro přidání nových klientských slotů.
            </p>
          </div>
        ) : (
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Koalice</th>
                  <th className="py-2.5 px-3">Skupina & Letoun</th>
                  <th className="py-2.5 px-3">Typ modulu</th>
                  <th className="py-2.5 px-3">Režim slotu</th>
                  <th className="py-2.5 px-3">Rádio (MHz)</th>
                  <th className="py-2.5 px-3">Výška (m)</th>
                  <th className="py-2.5 px-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {allClientUnits.map(({ group, unit }) => {
                  const isBlue = group.coalition === 'blue';
                  const isRed = group.coalition === 'red';

                  return (
                    <tr key={unit.unitId} className="hover:bg-slate-850/60 transition-colors">
                      {/* Coalition indicator */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isBlue
                              ? 'bg-sky-950 text-sky-400 border border-sky-800/60'
                              : isRed
                              ? 'bg-red-950 text-red-400 border border-red-800/60'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isBlue ? 'bg-sky-400' : isRed ? 'bg-red-400' : 'bg-slate-400'
                            }`}
                          />
                          <span>{group.coalition}</span>
                        </span>
                      </td>

                      {/* Group & Unit Name */}
                      <td className="py-2.5 px-3">
                        <div className="font-sans font-bold text-slate-200">{unit.name}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{group.name}</div>
                      </td>

                      {/* Aircraft Type */}
                      <td className="py-2.5 px-3">
                        <select
                          value={unit.type}
                          onChange={(e) => handleUpdateUnit(group.groupId, unit.unitId, { type: e.target.value })}
                          className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-xs font-sans"
                        >
                          {DCS_CATALOG.filter((c) => c.category === group.category).map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Skill / Slot mode */}
                      <td className="py-2.5 px-3">
                        <select
                          value={unit.skill}
                          onChange={(e) => handleUpdateUnit(group.groupId, unit.unitId, { skill: e.target.value as any })}
                          className="bg-amber-950/60 border border-amber-600/80 rounded px-2 py-1 text-amber-300 font-bold text-xs"
                        >
                          <option value="Client">Client (Multiplayer)</option>
                          <option value="Player">Player (SP Solo)</option>
                        </select>
                      </td>

                      {/* Radio Frequency */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Radio className="w-3.5 h-3.5 text-sky-400" />
                          <input
                            type="number"
                            value={unit.radio ? (unit.radio.frequency / 1000000).toFixed(3) : '124.000'}
                            onChange={(e) =>
                              handleUpdateUnit(group.groupId, unit.unitId, {
                                radio: {
                                  frequency: Math.round(Number(e.target.value) * 1000000),
                                  modulation: unit.radio?.modulation ?? 0,
                                },
                              })
                            }
                            step="0.025"
                            className="w-24 bg-slate-950 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs text-sky-300"
                          />
                        </div>
                      </td>

                      {/* Altitude */}
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          value={unit.alt}
                          onChange={(e) =>
                            handleUpdateUnit(group.groupId, unit.unitId, { alt: Number(e.target.value) })
                          }
                          className="w-20 bg-slate-950 border border-slate-700/80 rounded px-1.5 py-0.5 text-xs text-slate-200"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteUnit(group.groupId, unit.unitId)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                          title="Smazat slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
