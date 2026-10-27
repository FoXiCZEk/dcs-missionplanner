import React, { useState } from 'react';
import type { MissionData } from '../types/dcs';
import {
  FRAMEWORK_DEFINITIONS,
  isFrameworkEnabled,
  enableFramework,
  disableFramework,
  getActiveFrameworksCount,
  type FrameworkId,
} from '../utils/frameworkManager';
import {
  Box,
  Cpu,
  Anchor,
  ShieldAlert,
  Fuel,
  MessageSquare,
  Globe,
  CheckCircle2,
  X,
  Sparkles,
  Info,
  Code,
} from 'lucide-react';

interface FrameworkManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionData: MissionData;
  onUpdateMissionData: (updated: MissionData) => void;
  onOpenCodeEditor?: (fileName: string) => void;
}

export const FrameworkManagerModal: React.FC<FrameworkManagerModalProps> = ({
  isOpen,
  onClose,
  missionData,
  onUpdateMissionData,
  onOpenCodeEditor,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeCount = getActiveFrameworksCount(missionData);

  const handleToggleFramework = (id: FrameworkId) => {
    const isCurrentlyActive = isFrameworkEnabled(id, missionData);
    let updated: MissionData;

    if (isCurrentlyActive) {
      updated = disableFramework(id, missionData);
      setNotification(`Framework byl odebrán z mise.`);
    } else {
      updated = enableFramework(id, missionData);
      const def = FRAMEWORK_DEFINITIONS.find((f) => f.id === id);
      setNotification(`✓ ${def?.shortName || 'Framework'} byl aktivován včetně startovního triggeru!`);
    }

    onUpdateMissionData(updated);
    setTimeout(() => setNotification(null), 3000);
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Box':
        return <Box className="w-5 h-5 text-sky-400" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-indigo-400" />;
      case 'Anchor':
        return <Anchor className="w-5 h-5 text-cyan-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-emerald-400" />;
      case 'Fuel':
        return <Fuel className="w-5 h-5 text-amber-400" />;
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5 text-slate-400" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-purple-400" />;
      default:
        return <Box className="w-5 h-5 text-sky-400" />;
    }
  };

  const filteredFrameworks = FRAMEWORK_DEFINITIONS.filter((f) => {
    if (filterCategory === 'ALL') return true;
    return f.category === filterCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-wide uppercase font-mono">
                  Správce frameworků & serverových skriptů
                </h2>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  {activeCount} / {FRAMEWORK_DEFINITIONS.length} AKTIVNÍ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Jednoduchá aktivace knihoven (MIST, MOOSE, Airboss, CSAR) přepínačem bez nutnosti ručně psát kód.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="bg-emerald-950/90 border-b border-emerald-600/60 px-5 py-2 text-xs font-mono font-bold text-emerald-300 flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* FILTER CATEGORIES & INFO BANNER */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Kategorie:</span>
            {[
              { id: 'ALL', label: 'Všechny' },
              { id: 'core', label: 'Jádro (MIST / MOOSE)' },
              { id: 'naval', label: 'Námořnictvo (Supercarrier)' },
              { id: 'gameplay', label: 'Záchrana (CSAR)' },
              { id: 'utility', label: 'Nástroje serveru' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterCategory === cat.id
                    ? 'bg-sky-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
            Triggery se automaticky zařadí do MISSION START
          </span>
        </div>

        {/* FRAMEWORKS LIST (SCROLLABLE CARDS) */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {filteredFrameworks.map((def) => {
            const isEnabled = isFrameworkEnabled(def.id, missionData);

            return (
              <div
                key={def.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isEnabled
                    ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Icon & Description */}
                <div className="flex items-start gap-3.5 flex-1">
                  <div
                    className={`p-2.5 rounded-xl border mt-0.5 ${
                      isEnabled
                        ? 'bg-emerald-950/60 border-emerald-700'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {renderIcon(def.iconName)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-100">{def.name}</h3>
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-mono px-1.5 py-0.2 rounded border border-slate-700">
                        {def.version}
                      </span>
                      {isEnabled ? (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] font-bold px-2 py-0.2 rounded uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Aktivní v T+{def.triggerSeconds}s</span>
                        </span>
                      ) : (
                        <span className="bg-slate-900 text-slate-500 border border-slate-800 text-[10px] font-bold px-2 py-0.2 rounded uppercase">
                          Neaktivní
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-sky-400/90 font-medium">{def.tagline}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl">
                      {def.description}
                    </p>

                    {/* Dependency info */}
                    {def.dependencies && def.dependencies.length > 0 && (
                      <div className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1 pt-0.5">
                        <Info className="w-3 h-3 text-amber-400" />
                        <span>
                          Vyžaduje: {def.dependencies.map((d) => d.toUpperCase()).join(', ')} (aktivuje se automaticky)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Toggle Switch & View Code Button */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0 border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
                  {onOpenCodeEditor && (
                    <button
                      onClick={() => {
                        onOpenCodeEditor(def.fileName);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-1.5"
                      title="Zobrazit a upravit zdrojový Lua kód"
                    >
                      <Code className="w-3.5 h-3.5 text-slate-400" />
                      <span className="hidden sm:inline">Kód</span>
                    </button>
                  )}

                  {/* Clean Toggle Switch */}
                  <button
                    onClick={() => handleToggleFramework(def.id)}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-emerald-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <span className={`text-xs font-bold w-16 ${isEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isEnabled ? 'ZAPNUTO' : 'VYPNUTO'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 font-mono">
            Všechny aktivované frameworky jsou automaticky zabaleny do souboru <code>.miz</code> při exportu.
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all shadow"
          >
            Hotovo
          </button>
        </div>

      </div>
    </div>
  );
};
