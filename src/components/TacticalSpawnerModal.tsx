import React, { useState } from 'react';
import {
  SAM_BATTERY_TEMPLATES,
  SUPPORT_FLIGHT_TEMPLATES,
  CARRIER_GROUP_TEMPLATES,
  type SamBatteryTemplate,
  type SupportFlightTemplate,
  type CarrierGroupTemplate,
} from '../data/dcsPresets';
import {
  ShieldAlert,
  Fuel,
  Anchor,
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
  onSelectCarrierTemplate: (template: CarrierGroupTemplate) => void;
}

export const TacticalSpawnerModal: React.FC<TacticalSpawnerModalProps> = ({
  isOpen,
  onClose,
  onSelectSamTemplate,
  onSelectSupportTemplate,
  onSelectCarrierTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'sam' | 'support' | 'carrier'>('carrier');
  const [filterCoalition, setFilterCoalition] = useState<'all' | 'blue' | 'red'>('all');

  if (!isOpen) return null;

  const filteredSams = SAM_BATTERY_TEMPLATES.filter(
    (s) => filterCoalition === 'all' || s.coalition === filterCoalition
  );

  const filteredSupport = SUPPORT_FLIGHT_TEMPLATES.filter(
    (s) => filterCoalition === 'all' || s.coalition === filterCoalition
  );

  const filteredCarriers = CARRIER_GROUP_TEMPLATES.filter(
    (s) => filterCoalition === 'all' || s.coalition === filterCoalition
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden text-slate-100 font-sans">
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
                Okamžité umístění úderných svazů letadlových lodí, baterií PVO nebo tankerů s TACAN a vyčkáváním
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
        <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('carrier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                activeTab === 'carrier'
                  ? 'bg-blue-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Anchor className="w-3.5 h-3.5" />
              <span>Letadlové lodě & CSG ({CARRIER_GROUP_TEMPLATES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sam')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                activeTab === 'sam'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Baterie PVO ({SAM_BATTERY_TEMPLATES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                activeTab === 'support'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Tankery & AWACS ({SUPPORT_FLIGHT_TEMPLATES.length})</span>
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
          {/* TAB 1: CARRIER STRIKE GROUPS (CSG & SUPERCARRIER) */}
          {activeTab === 'carrier' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCarriers.map((template) => {
                const isBlue = template.coalition === 'blue';
                const freqMhz = (template.atcFrequencyHz / 1000000).toFixed(3);

                return (
                  <div
                    key={template.id}
                    className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 flex flex-col justify-between transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              isBlue
                                ? 'bg-sky-950 text-sky-400 border border-sky-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {template.coalition}
                          </span>

                          {template.isSupercarrier && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                              ★ SUPERCARRIER MOD
                            </span>
                          )}
                        </div>

                        {template.tacan && template.tacan.channel > 0 && (
                          <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/70 border border-amber-600/70 px-1.5 py-0.2 rounded">
                            TCN: {template.tacan.channel}{template.tacan.mode} ({template.tacan.callsign})
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        <Anchor className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>{template.name}</span>
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed">{template.description}</p>

                      {/* Communications and Navaids Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-900/90 p-2.5 rounded-lg text-[10px] font-mono border border-slate-800">
                        <div>
                          <span className="text-slate-500 block">TOWER ATC:</span>
                          <span className="text-sky-300 font-bold">{freqMhz} MHz</span>
                        </div>

                        <div>
                          <span className="text-slate-500 block">ICLS:</span>
                          <span className="text-emerald-300 font-bold">
                            {template.icls ? `Kanál ${template.icls.channel}` : 'N/A'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block">LINK 4:</span>
                          <span className="text-purple-300 font-bold">
                            {template.link4 ? `${(template.link4.frequencyHz / 1e6).toFixed(1)} MHz` : 'N/A'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block">BRC & RYCHLOST:</span>
                          <span className="text-amber-300 font-bold">
                            {template.defaultBrcDeg}° @ {template.speedKnots} kts
                          </span>
                        </div>
                      </div>

                      {/* Escorts List */}
                      <div className="space-y-1 pt-1 text-[11px]">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-sky-400" />
                          <span>Doprovodné lodě ({template.escorts.length}):</span>
                        </span>
                        <div className="text-slate-300 pl-4 space-y-0.5 text-[10.5px]">
                          {template.escorts.map((esc, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-slate-400">
                              <span className="text-sky-400">•</span>
                              <strong className="text-slate-200">{esc.name}</strong>
                              <span className="text-slate-500">({esc.role})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pedro Rescue Helicopter Badge */}
                      {template.includeRescueHeli && (
                        <div className="mt-1 flex items-center gap-2 p-1.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>
                            <strong>Záchranný vrtulník Pedro:</strong> {template.rescueHeliType || 'SH-60B'} na pozici Plane Guard (200 ft, 500m od lodi)
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectCarrierTemplate(template)}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow mt-2 ${
                        isBlue
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 ring-1 ring-blue-400/30'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 ring-1 ring-red-400/30'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Umístit svaz letadlové lodi na mapu</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SAM BATTERIES */}
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

          {/* TAB 3: SUPPORT FLIGHTS */}
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
