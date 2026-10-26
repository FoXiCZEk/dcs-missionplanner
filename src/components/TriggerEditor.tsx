import React, { useState } from 'react';
import type {
  MissionData,
  MissionTrigger,
  TriggerCondition,
  TriggerAction,
  TriggerType,
  ConditionRuleType,
  ActionRuleType,
} from '../types/dcs';
import {
  Zap,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Circle,
  Sliders,
  Code,
  Search,
} from 'lucide-react';

interface TriggerEditorProps {
  missionData: MissionData;
  onUpdateTriggers: (triggers: MissionTrigger[]) => void;
  onOpenScriptEditorWithFile?: (fileName: string) => void;
}

export const TriggerEditor: React.FC<TriggerEditorProps> = ({
  missionData,
  onUpdateTriggers,
}) => {
  const [selectedTriggerId, setSelectedTriggerId] = useState<string>(
    missionData.triggers[0]?.id || ''
  );
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedTrigger = missionData.triggers.find((t) => t.id === selectedTriggerId) || missionData.triggers[0];

  const handleAddTrigger = () => {
    const newId = `trig-${Date.now()}`;
    const newTrig: MissionTrigger = {
      id: newId,
      name: `Trigger ${missionData.triggers.length + 1}`,
      type: 'ONCE',
      event: 'NONE',
      enabled: true,
      conditions: [
        {
          id: `c-${Date.now()}`,
          type: 'FLAG_IS_TRUE',
          flag: '1',
        },
      ],
      actions: [
        {
          id: `a-${Date.now()}`,
          type: 'MESSAGE_TO_ALL',
          message: 'Trigger Executed!',
          duration: 10,
        },
      ],
    };

    onUpdateTriggers([...missionData.triggers, newTrig]);
    setSelectedTriggerId(newId);
  };

  const handleDuplicateTrigger = (trig: MissionTrigger) => {
    const dupId = `trig-${Date.now()}`;
    const duplicate: MissionTrigger = {
      ...trig,
      id: dupId,
      name: `${trig.name} (Copy)`,
      conditions: trig.conditions.map((c) => ({ ...c, id: `c-${Date.now()}-${Math.random()}` })),
      actions: trig.actions.map((a) => ({ ...a, id: `a-${Date.now()}-${Math.random()}` })),
    };
    onUpdateTriggers([...missionData.triggers, duplicate]);
    setSelectedTriggerId(dupId);
  };

  const handleDeleteTrigger = (id: string) => {
    const updated = missionData.triggers.filter((t) => t.id !== id);
    onUpdateTriggers(updated);
    if (selectedTriggerId === id && updated.length > 0) {
      setSelectedTriggerId(updated[0].id);
    }
  };

  const handleUpdateCurrentTrigger = (partial: Partial<MissionTrigger>) => {
    if (!selectedTrigger) return;
    const updated = missionData.triggers.map((t) =>
      t.id === selectedTrigger.id ? { ...t, ...partial } : t
    );
    onUpdateTriggers(updated);
  };

  // Conditions helpers
  const handleAddCondition = () => {
    if (!selectedTrigger) return;
    const newCond: TriggerCondition = {
      id: `c-${Date.now()}`,
      type: 'FLAG_IS_TRUE',
      flag: '1',
    };
    handleUpdateCurrentTrigger({
      conditions: [...selectedTrigger.conditions, newCond],
    });
  };

  const handleUpdateCondition = (condId: string, partial: Partial<TriggerCondition>) => {
    if (!selectedTrigger) return;
    const updated = selectedTrigger.conditions.map((c) => (c.id === condId ? { ...c, ...partial } : c));
    handleUpdateCurrentTrigger({ conditions: updated });
  };

  const handleDeleteCondition = (condId: string) => {
    if (!selectedTrigger) return;
    handleUpdateCurrentTrigger({
      conditions: selectedTrigger.conditions.filter((c) => c.id !== condId),
    });
  };

  // Actions helpers
  const handleAddAction = (type: ActionRuleType = 'MESSAGE_TO_ALL') => {
    if (!selectedTrigger) return;
    const newAct: TriggerAction = {
      id: `a-${Date.now()}`,
      type,
      message: type === 'MESSAGE_TO_ALL' ? 'Nová zpráva...' : undefined,
      duration: 10,
      script: type === 'DO_SCRIPT' ? `-- Vložte Lua kód zde\nenv.info("Trigger executed!")\n` : undefined,
      file: type === 'DO_SCRIPT_FILE' ? missionData.scriptFiles[0]?.name || 'script.lua' : undefined,
    };
    handleUpdateCurrentTrigger({
      actions: [...selectedTrigger.actions, newAct],
    });
  };

  const handleUpdateAction = (actId: string, partial: Partial<TriggerAction>) => {
    if (!selectedTrigger) return;
    const updated = selectedTrigger.actions.map((a) => (a.id === actId ? { ...a, ...partial } : a));
    handleUpdateCurrentTrigger({ actions: updated });
  };

  const handleDeleteAction = (actId: string) => {
    if (!selectedTrigger) return;
    handleUpdateCurrentTrigger({
      actions: selectedTrigger.actions.filter((a) => a.id !== actId),
    });
  };

  // Filter triggers
  const filteredTriggers = missionData.triggers.filter((t) => {
    const matchesFilter = filterType === 'ALL' || t.type === filterType;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.actions.some((a) => a.message?.toLowerCase().includes(searchQuery.toLowerCase()) || a.script?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Extract all unit names & zone names for select dropdowns
  const allUnitNames = missionData.groups.flatMap((g) => g.units.map((u) => u.name));
  const allZoneNames = missionData.zones.map((z) => z.name);
  const allGroupNames = missionData.groups.map((g) => g.name);

  return (
    <div className="flex w-full h-full bg-slate-950 text-slate-200 overflow-hidden text-xs">
      {/* Sidebar: Triggers list */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/70 flex flex-col h-full shrink-0">
        {/* Search & Actions Header */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Triggery ({missionData.triggers.length})</span>
            </span>
            <button
              onClick={handleAddTrigger}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded transition-colors text-xs shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nový trigger</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Hledat triggery, skripty, zprávy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded pl-8 pr-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Type filters */}
          <div className="flex gap-1 overflow-x-auto pt-1">
            {['ALL', 'ONCE', 'MISSION START', 'REPETITIVE'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors whitespace-nowrap ${
                  filterType === t
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Triggers list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredTriggers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">Žádné odpovídající triggery</div>
          ) : (
            filteredTriggers.map((trig) => {
              const isSelected = trig.id === selectedTrigger?.id;
              const hasScript = trig.actions.some((a) => a.type === 'DO_SCRIPT' || a.type === 'DO_SCRIPT_FILE');

              return (
                <div
                  key={trig.id}
                  onClick={() => setSelectedTriggerId(trig.id)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/60 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = missionData.triggers.map((t) =>
                            t.id === trig.id ? { ...t, enabled: !t.enabled } : t
                          );
                          onUpdateTriggers(updated);
                        }}
                        className="text-slate-400 hover:text-amber-400"
                        title={trig.enabled ? 'Zakázat trigger' : 'Povolit trigger'}
                      >
                        {trig.enabled ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </button>
                      <span>{trig.name}</span>
                    </span>

                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                        trig.type === 'MISSION START'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                          : trig.type === 'REPETITIVE'
                          ? 'bg-blue-950/80 text-blue-300 border border-blue-800/50'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {trig.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span className="flex items-center gap-2">
                      <span>{trig.conditions.length} podmínek</span>
                      <span>•</span>
                      <span>{trig.actions.length} akcí</span>
                    </span>
                    {hasScript && (
                      <span className="flex items-center gap-0.5 text-amber-400 bg-amber-950/40 px-1 rounded border border-amber-800/40">
                        <Code className="w-2.5 h-2.5" />
                        <span>Lua</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main trigger detail workspace */}
      {selectedTrigger ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
          {/* Header of selected trigger */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <input
                type="text"
                value={selectedTrigger.name}
                onChange={(e) => handleUpdateCurrentTrigger({ name: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-base font-bold text-slate-100 focus:outline-none focus:border-amber-500 w-full max-w-md font-mono"
              />

              <select
                value={selectedTrigger.type}
                onChange={(e) => handleUpdateCurrentTrigger({ type: e.target.value as TriggerType })}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-semibold text-amber-400 focus:outline-none focus:border-amber-500 uppercase tracking-wider"
              >
                <option value="ONCE">ONCE (1x po splnění)</option>
                <option value="MISSION START">MISSION START (Start mise)</option>
                <option value="REPETITIVE">REPETITIVE (Opakovaně)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDuplicateTrigger(selectedTrigger)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition-colors"
                title="Duplikovat trigger"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplikovat</span>
              </button>
              <button
                onClick={() => handleDeleteTrigger(selectedTrigger.id)}
                className="flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/50 px-3 py-1.5 rounded transition-colors"
                title="Smazat trigger"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Smazat</span>
              </button>
            </div>
          </div>

          {/* 2-Column Rules Grid (Conditions & Actions) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
            {/* COLUMN 1: CONDITIONS */}
            <div className="flex flex-col h-full overflow-hidden bg-slate-900/20">
              <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>PODMÍNKY (RULES)</span>
                  <span className="text-slate-500 font-normal">({selectedTrigger.conditions.length})</span>
                </span>
                <button
                  onClick={handleAddCondition}
                  className="flex items-center gap-1 bg-sky-600/80 hover:bg-sky-500 text-white font-semibold px-2.5 py-1 rounded text-xs transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Přidat podmínku</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {selectedTrigger.conditions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p className="font-semibold">Žádné podmínky</p>
                    <p className="text-[11px] mt-1">
                      {selectedTrigger.type === 'MISSION START'
                        ? 'Trigger se spustí okamžitě při startu serveru / mise.'
                        : 'Trigger se provede okamžitě.'}
                    </p>
                  </div>
                ) : (
                  selectedTrigger.conditions.map((cond, index) => (
                    <div
                      key={cond.id}
                      className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-400 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-sky-950 border border-sky-800 flex items-center justify-center text-[10px] text-sky-300">
                            {index + 1}
                          </span>
                          <span>Typ podmínky</span>
                        </span>
                        <button
                          onClick={() => handleDeleteCondition(cond.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Rule Type Selector */}
                      <select
                        value={cond.type}
                        onChange={(e) => handleUpdateCondition(cond.id, { type: e.target.value as ConditionRuleType })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-semibold"
                      >
                        <option value="FLAG_IS_TRUE">FLAG IS TRUE (Flag je pravda / 1)</option>
                        <option value="FLAG_IS_FALSE">FLAG IS FALSE (Flag je nepravda / 0)</option>
                        <option value="FLAG_MORE">FLAG MORE (Flag hodnota větší než...)</option>
                        <option value="FLAG_LESS">FLAG LESS (Flag hodnota menší než...)</option>
                        <option value="FLAG_EQUALS">FLAG EQUALS (Flag se rovná...)</option>
                        <option value="UNIT_INSIDE_ZONE">UNIT INSIDE ZONE (Jednotka uvnitř zóny)</option>
                        <option value="UNIT_OUTSIDE_ZONE">UNIT OUTSIDE ZONE (Jednotka mimo zónu)</option>
                        <option value="PART_OF_COALITION_IN_ZONE">PART OF COALITION IN ZONE (Koalice v zóně)</option>
                        <option value="TIME_MORE">TIME MORE (Uběhlo více než X sekund od startu)</option>
                        <option value="TIME_SINCE_FLAG">TIME SINCE FLAG (Uběhlo X sekund od nastavení flagu)</option>
                        <option value="LUA_PREDICATE">LUA PREDICATE (Vlastní Lua kód vrací true)</option>
                        <option value="RANDOM">RANDOM (Pravděpodobnost v %)</option>
                      </select>

                      {/* Contextual Inputs based on rule type */}
                      {['FLAG_IS_TRUE', 'FLAG_IS_FALSE'].includes(cond.type) && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Číslo nebo název Flag</label>
                          <input
                            type="text"
                            value={cond.flag || '1'}
                            onChange={(e) => handleUpdateCondition(cond.id, { flag: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300"
                          />
                        </div>
                      )}

                      {['FLAG_MORE', 'FLAG_LESS', 'FLAG_EQUALS'].includes(cond.type) && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Flag</label>
                            <input
                              type="text"
                              value={cond.flag || '1'}
                              onChange={(e) => handleUpdateCondition(cond.id, { flag: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Hodnota (Value)</label>
                            <input
                              type="number"
                              value={cond.value || 0}
                              onChange={(e) => handleUpdateCondition(cond.id, { value: Number(e.target.value) })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1"
                            />
                          </div>
                        </div>
                      )}

                      {['UNIT_INSIDE_ZONE', 'UNIT_OUTSIDE_ZONE'].includes(cond.type) && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Jednotka</label>
                            <select
                              value={cond.unit || allUnitNames[0] || ''}
                              onChange={(e) => handleUpdateCondition(cond.id, { unit: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1"
                            >
                              {allUnitNames.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Trigger Zóna</label>
                            <select
                              value={cond.zone || allZoneNames[0] || ''}
                              onChange={(e) => handleUpdateCondition(cond.id, { zone: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1"
                            >
                              {allZoneNames.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {cond.type === 'PART_OF_COALITION_IN_ZONE' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Koalice</label>
                            <select
                              value={cond.coalition || 'blue'}
                              onChange={(e) => handleUpdateCondition(cond.id, { coalition: e.target.value as any })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1"
                            >
                              <option value="blue">Blue (Modrá)</option>
                              <option value="red">Red (Červená)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Trigger Zóna</label>
                            <select
                              value={cond.zone || allZoneNames[0] || ''}
                              onChange={(e) => handleUpdateCondition(cond.id, { zone: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1"
                            >
                              {allZoneNames.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {cond.type === 'TIME_MORE' && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Čas v sekundách</label>
                          <input
                            type="number"
                            value={cond.seconds || 60}
                            onChange={(e) => handleUpdateCondition(cond.id, { seconds: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono"
                          />
                        </div>
                      )}

                      {cond.type === 'TIME_SINCE_FLAG' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Flag</label>
                            <input
                              type="text"
                              value={cond.flag || '1'}
                              onChange={(e) => handleUpdateCondition(cond.id, { flag: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Sekund od nastavení</label>
                            <input
                              type="number"
                              value={cond.seconds || 30}
                              onChange={(e) => handleUpdateCondition(cond.id, { seconds: Number(e.target.value) })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1"
                            />
                          </div>
                        </div>
                      )}

                      {cond.type === 'LUA_PREDICATE' && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Lua Predikát (musí vracet true pro splnění podmínky)
                          </label>
                          <textarea
                            rows={3}
                            value={cond.luaCode || 'return trigger.misc.getUserFlag("1") == 1'}
                            onChange={(e) => handleUpdateCondition(cond.id, { luaCode: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-[11px] text-emerald-300 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      )}

                      {cond.type === 'RANDOM' && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Šance na splnění (%)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={cond.percent || 50}
                            onChange={(e) => handleUpdateCondition(cond.id, { percent: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono"
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* COLUMN 2: ACTIONS */}
            <div className="flex flex-col h-full overflow-hidden bg-slate-900/20">
              <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>AKCE (ACTIONS)</span>
                  <span className="text-slate-500 font-normal">({selectedTrigger.actions.length})</span>
                </span>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleAddAction('DO_SCRIPT')}
                    className="flex items-center gap-1 bg-amber-600/80 hover:bg-amber-500 text-white font-semibold px-2 py-1 rounded text-xs transition-colors"
                  >
                    <Code className="w-3 h-3" />
                    <span>+ Do Script</span>
                  </button>
                  <button
                    onClick={() => handleAddAction('MESSAGE_TO_ALL')}
                    className="flex items-center gap-1 bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold px-2 py-1 rounded text-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Akce</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {selectedTrigger.actions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p className="font-semibold">Žádné akce</p>
                    <p className="text-[11px] mt-1">Klikněte na tlačítko výše a přidejte akci (zprávu, script, flag).</p>
                  </div>
                ) : (
                  selectedTrigger.actions.map((act, index) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-950 border border-amber-800 flex items-center justify-center text-[10px] text-amber-300">
                            {index + 1}
                          </span>
                          <span>Typ akce</span>
                        </span>
                        <button
                          onClick={() => handleDeleteAction(act.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Action Type Selector */}
                      <select
                        value={act.type}
                        onChange={(e) => handleUpdateAction(act.id, { type: e.target.value as ActionRuleType })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-semibold"
                      >
                        <option value="DO_SCRIPT">⚡ DO SCRIPT (Spustit vložený Lua kód)</option>
                        <option value="DO_SCRIPT_FILE">📁 DO SCRIPT FILE (Spustit přibalený .lua soubor)</option>
                        <option value="MESSAGE_TO_ALL">📢 MESSAGE TO ALL (Zpráva všem hráčům)</option>
                        <option value="MESSAGE_TO_COALITION">💬 MESSAGE TO COALITION (Zpráva koalici)</option>
                        <option value="FLAG_SET">🚩 FLAG SET (Nastavit flag na hodnotu)</option>
                        <option value="FLAG_OFF">❌ FLAG OFF (Vypnout flag)</option>
                        <option value="FLAG_INCREASE">➕ FLAG INCREASE (Zvýšit hodnotu flagu)</option>
                        <option value="GROUP_ACTIVATE">🚀 GROUP ACTIVATE (Aktivovat skupinu / spawn)</option>
                        <option value="GROUP_DEACTIVATE">🛑 GROUP DEACTIVATE (Deaktivovat skupinu)</option>
                      </select>

                      {/* DO SCRIPT (Code Editor) */}
                      {act.type === 'DO_SCRIPT' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Vložený Lua Skript
                            </label>
                            {/* Quick Lua snippets helper */}
                            <div className="flex gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const snippet = `trigger.action.outText("DCS Server Message!", 10)\n`;
                                  handleUpdateAction(act.id, { script: (act.script || '') + snippet });
                                }}
                                className="text-amber-400 hover:underline"
                              >
                                + Text
                              </button>
                              <span className="text-slate-600">•</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const snippet = `trigger.action.setUserFlag("1", 1)\n`;
                                  handleUpdateAction(act.id, { script: (act.script || '') + snippet });
                                }}
                                className="text-amber-400 hover:underline"
                              >
                                + SetFlag
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={5}
                            value={act.script || ''}
                            onChange={(e) => handleUpdateAction(act.id, { script: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 font-mono text-[11px] text-amber-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                            placeholder="-- Zde napište Lua kód (např. trigger.action.outText(...))"
                          />
                        </div>
                      )}

                      {/* DO SCRIPT FILE */}
                      {act.type === 'DO_SCRIPT_FILE' && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Název přibaleného .lua skriptu</label>
                          <select
                            value={act.file || missionData.scriptFiles[0]?.name || ''}
                            onChange={(e) => handleUpdateAction(act.id, { file: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-amber-300"
                          >
                            {missionData.scriptFiles.map((f) => (
                              <option key={f.name} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* MESSAGE TO ALL / COALITION */}
                      {['MESSAGE_TO_ALL', 'MESSAGE_TO_COALITION'].includes(act.type) && (
                        <div className="space-y-2">
                          {act.type === 'MESSAGE_TO_COALITION' && (
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">Cílová koalice</label>
                              <select
                                value={act.coalition || 'blue'}
                                onChange={(e) => handleUpdateAction(act.id, { coalition: e.target.value as any })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1"
                              >
                                <option value="blue">Blue (Modrá)</option>
                                <option value="red">Red (Červená)</option>
                              </select>
                            </div>
                          )}

                          <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-3">
                              <label className="text-[10px] text-slate-400 block mb-0.5">Text zprávy</label>
                              <input
                                type="text"
                                value={act.message || ''}
                                onChange={(e) => handleUpdateAction(act.id, { message: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1"
                                placeholder="Text zprávy zobrazené na obrazovce..."
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">Trvání (s)</label>
                              <input
                                type="number"
                                value={act.duration || 10}
                                onChange={(e) => handleUpdateAction(act.id, { duration: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FLAG SET / INCREASE */}
                      {['FLAG_SET', 'FLAG_INCREASE'].includes(act.type) && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Flag</label>
                            <input
                              type="text"
                              value={act.flag || '1'}
                              onChange={(e) => handleUpdateAction(act.id, { flag: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Hodnota</label>
                            <input
                              type="number"
                              value={act.value || 1}
                              onChange={(e) => handleUpdateAction(act.id, { value: Number(e.target.value) })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1"
                            />
                          </div>
                        </div>
                      )}

                      {act.type === 'FLAG_OFF' && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Flag k vypnutí</label>
                          <input
                            type="text"
                            value={act.flag || '1'}
                            onChange={(e) => handleUpdateAction(act.id, { flag: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono"
                          />
                        </div>
                      )}

                      {/* GROUP ACTIVATE / DEACTIVATE */}
                      {['GROUP_ACTIVATE', 'GROUP_DEACTIVATE'].includes(act.type) && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Vyberte skupinu</label>
                          <select
                            value={act.group || allGroupNames[0] || ''}
                            onChange={(e) => handleUpdateAction(act.id, { group: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5"
                          >
                            {allGroupNames.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
