import React, { useState } from 'react';
import {
  SAM_BATTERY_TEMPLATES,
  SUPPORT_FLIGHT_TEMPLATES,
  type SamBatteryTemplate,
  type SupportFlightTemplate,
} from '../data/dcsPresets';
import {
  ShieldAlert,
  Fuel,
  X,
  Plus,
  Crosshair,
  Zap,
} from 'lucide-react';

interface TacticalSpawnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSamTemplate: (template: SamBatteryTemplate) => void;
  onSelectSupportTemplate: (template: SupportFlightTemplate) => void;
}

export const TacticalSpawnerModal: React.FC<TacticalSpawnerModalProps> = ({
  isOpen,
  onClose,
  onSelectSamTemplate,
  onSelectSupportTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'sam' | 'support'>('sam');
  const [filterCoalition, setFilterCoalition] = useState<'all' | 'blue' | 'red'>('all');

  if (!isOpen) return null;

  const filteredSams = SAM_BATTERY_TEMPLATES.filter(
    (s) => filterCoalition === 'all' || s.coalition === filterCoalition
  );

  const filteredSupport = SUPPORT_FLIGHT_TEMPLATES.filter(
    (s) => filterCoalition === 'all' || s.coalition === filterCoalition
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-slate-100">
                1-CLICK TAKTICKÝ GENERÁTOR OBJEKTŮ
              </h2>
              <p className="text-xs text-slate-400">
                Okamžité umístění kompletních baterií PVO nebo tankerů a AWACS s vyčkávacími okruhy
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

        {/* Tab Switcher & Coalition Filter */}
        <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('sam')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                activeTab === 'sam'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Kompletní Baterie PVO ({SAM_BATTERY_TEMPLATES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                activeTab === 'support'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Tankery & AWACS Okruhy ({SUPPORT_FLIGHT_TEMPLATES.length})</span>
            </button>
          </div>

          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800 text-xs">
            <button
              onClick={() => setFilterCoalition('all')}
              className={`px-2 py-1 rounded font-semibold ${
                filterCoalition === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              Vše
            </button>
            <button
              onClick={() => setFilterCoalition('blue')}
              className={`px-2 py-1 rounded font-semibold ${
                filterCoalition === 'blue' ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'text-slate-400'
              }`}
            >
              Blue
            </button>
            <button
              onClick={() => setFilterCoalition('red')}
              className={`px-2 py-1 rounded font-semibold ${
                filterCoalition === 'red' ? 'bg-red-950 text-red-400 border border-red-800' : 'text-slate-400'
              }`}
            >
              Red
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* TAB 1: SAM BATTERIES */}
          {activeTab === 'sam' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSams.map((template) => {
                const isBlue = template.coalition === 'blue';
                return (
                  <div
                    key={template.id}
                    className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isBlue
                              ? 'bg-sky-950 text-sky-400 border border-sky-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {template.coalition}
                        </span>

                        <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1">
                          <Crosshair className="w-3 h-3" />
                          <span>Dosah: {Math.round(template.threatRadius / 1000)} km</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-100 text-sm">{template.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">{template.description}</p>

                      <div className="mt-2 text-[11px] text-slate-500 font-mono">
                        Komponenty: {template.components.map((c) => c.name).join(', ')}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectSamTemplate(template)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow ${
                        isBlue
                          ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Umístit baterii na mapu</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SUPPORT FLIGHTS */}
          {activeTab === 'support' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSupport.map((template) => {
                const isBlue = template.coalition === 'blue';
                const freqMhz = (template.frequencyHz / 1000000).toFixed(3);
                const altFt = Math.round(template.altitudeM * 3.28084);

                return (
                  <div
                    key={template.id}
                    className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isBlue
                              ? 'bg-sky-950 text-sky-400 border border-sky-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {template.coalition} // {template.role.toUpperCase()}
                        </span>

                        {template.tacan && (
                          <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-700/80 px-1.5 py-0.2 rounded">
                            TCN: {template.tacan.channel}
                            {template.tacan.mode} ({template.tacan.callsign})
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-100 text-sm">{template.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">{template.description}</p>

                      <div className="mt-2.5 grid grid-cols-3 gap-1 bg-slate-900 p-2 rounded text-[10px] font-mono text-slate-300">
                        <div>
                          <span className="text-slate-500 block">RÁDIO:</span>
                          <span className="text-sky-300 font-bold">{freqMhz} MHz</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">VÝŠKA:</span>
                          <span className="text-amber-300 font-bold">{altFt.toLocaleString()} ft</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">OKRUH:</span>
                          <span className="text-emerald-300 font-bold">{template.orbitLengthNm} NM</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectSupportTemplate(template)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow ${
                        isBlue
                          ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Vytvořit vyčkávací okruh na mapě</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
