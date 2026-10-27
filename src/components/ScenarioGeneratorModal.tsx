import React, { useState } from 'react';
import type { Theater } from '../types/dcs';
import {
  SCENARIO_PRESETS,
  type ScenarioType,
  type ScenarioDifficulty,
  type ScenarioTimeWeather,
  type ScenarioBaseType,
  type ScenarioGeneratorOptions,
} from '../utils/scenarioGenerator';
import { DCS_CATALOG } from '../data/dcsCatalog';
import {
  Crosshair,
  Bomb,
  ShieldAlert,
  PlaneTakeoff,
  Anchor,
  Sparkles,
  X,
  Sun,
  Moon,
  CloudRain,
  Shield,
  Plane,
  Plus,
  RefreshCw,
  Clock,
  Compass,
} from 'lucide-react';

interface ScenarioGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  theater: Theater;
  onGenerateScenario: (options: ScenarioGeneratorOptions) => void;
  mapCenterCoords?: { lat: number; lon: number };
}

export const ScenarioGeneratorModal: React.FC<ScenarioGeneratorModalProps> = ({
  isOpen,
  onClose,
  theater,
  onGenerateScenario,
  mapCenterCoords,
}) => {
  const [selectedType, setSelectedType] = useState<ScenarioType>('sead');
  const [difficulty, setDifficulty] = useState<ScenarioDifficulty>('medium');
  const [timeWeather, setTimeWeather] = useState<ScenarioTimeWeather>('day_clear');
  const [playerAirframe, setPlayerAirframe] = useState<string>('F/A-18C_hornet');
  const [flightCount, setFlightCount] = useState<number>(2);
  const [baseType, setBaseType] = useState<ScenarioBaseType>('airfield');
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [useMapCoords, setUseMapCoords] = useState<boolean>(false);

  if (!isOpen) return null;

  // Available flyable aircraft for selection
  const flyablePlanes = DCS_CATALOG.filter(
    (item) =>
      (item.category === 'plane' || item.category === 'helicopter') &&
      !item.id.includes('135') &&
      !item.id.includes('130') &&
      !item.id.includes('78') &&
      !item.id.includes('E-3') &&
      !item.id.includes('A-50') &&
      !item.id.includes('SH-60') &&
      !item.id.includes('Ka-27')
  );

  const handleSelectPreset = (type: ScenarioType) => {
    setSelectedType(type);
    const preset = SCENARIO_PRESETS.find((p) => p.id === type);
    if (preset) {
      setPlayerAirframe(preset.recommendedAirframe);
      if (type === 'anti_ship') {
        setBaseType('carrier');
      }
    }
  };

  const handleGenerate = () => {
    const options: ScenarioGeneratorOptions = {
      type: selectedType,
      difficulty,
      timeWeather,
      playerAirframe,
      playerFlightCount: flightCount,
      baseType,
      theater,
      mode,
      customCenterLat: useMapCoords && mapCenterCoords ? mapCenterCoords.lat : undefined,
      customCenterLon: useMapCoords && mapCenterCoords ? mapCenterCoords.lon : undefined,
    };

    onGenerateScenario(options);
    onClose();
  };

  const renderPresetIcon = (id: ScenarioType) => {
    switch (id) {
      case 'sead':
        return <Crosshair className="w-5 h-5 text-red-400" />;
      case 'strike':
        return <Bomb className="w-5 h-5 text-amber-400" />;
      case 'cas':
        return <ShieldAlert className="w-5 h-5 text-emerald-400" />;
      case 'cap':
        return <PlaneTakeoff className="w-5 h-5 text-sky-400" />;
      case 'anti_ship':
        return <Anchor className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-wide uppercase font-mono">
                  Generátor taktických scénářů
                </h2>
                <span className="bg-indigo-950 text-indigo-400 border border-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  {theater.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automaticky vytvoří kompletní misi s cíli, trasou, výzbrojí, podporou (AWACS, tanker) a triggery.
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

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* STEP 1: CHOOSE SCENARIO ARCHETYPE */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <span>1. Vyberte typ mise / scénáře</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {SCENARIO_PRESETS.map((preset) => {
                const isSelected = selectedType === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-950/50 border-sky-500 ring-2 ring-sky-500/40 shadow-lg shadow-sky-950/50'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                          {renderPresetIcon(preset.id)}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-sky-400 bg-sky-900/50 border border-sky-700 px-1.5 py-0.5 rounded uppercase">
                            Vybráno
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-100">{preset.title}</h3>
                      <p className="text-[11px] text-sky-400/90 font-medium mt-0.5">{preset.tagline}</p>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: PLAYER AIRCRAFT & MULTIPLAYER FLIGHT */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-4">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Plane className="w-4 h-4 text-sky-400" />
              <span>2. Letka hráče & Multiplayer sloty</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Aircraft Type */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium block">Typ letounu:</span>
                <select
                  value={playerAirframe}
                  onChange={(e) => setPlayerAirframe(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {flyablePlanes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Pilots */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium block">Počet klientských slotů (Coop):</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => setFlightCount(count)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        flightCount === count
                          ? 'bg-sky-600 border-sky-400 text-white shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {count}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Base Type: Carrier vs Airfield */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium block">Startovní základna:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setBaseType('airfield')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      baseType === 'airfield'
                        ? 'bg-sky-600 border-sky-400 text-white shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>Letiště</span>
                  </button>
                  <button
                    onClick={() => setBaseType('carrier')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      baseType === 'carrier'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Anchor className="w-3.5 h-3.5" />
                    <span>Supercarrier</span>
                  </button>
                </div>
              </div>
            </div>

            {baseType === 'carrier' && (
              <div className="p-2.5 bg-indigo-950/40 border border-indigo-800/60 rounded-lg text-[11px] text-indigo-300 flex items-center gap-2">
                <Anchor className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Bude nasazen kompletní svaz <strong>CVN-71 Roosevelt (Supercarrier)</strong> s křižníkem Ticonderoga, 2x Arleigh Burke, fregatou Perry a záchranným vrtulníkem <strong>Pedro SAR</strong> na stanici!
                </span>
              </div>
            )}
          </div>

          {/* STEP 3: DIFFICULTY, ENVIRONMENT & WEATHER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>3. Obtížnost & Odpor nepřítele</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'easy', label: 'Lehká', desc: 'Osamocená baterie / slabší obrana' },
                  { id: 'medium', label: 'Střední', desc: 'Integrovaná PVO + SHORAD ochrana' },
                  { id: 'hard', label: 'Těžká', desc: 'Těžký IADS + nepřátelský stíhací CAP' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDifficulty(item.id as ScenarioDifficulty)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      difficulty === item.id
                        ? 'bg-amber-950/50 border-amber-500 ring-1 ring-amber-400/50 text-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time & Weather */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>4. Denní doba & Počasí</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'day_clear', label: 'Jasno (Den)', time: '10:00 Z', icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
                  { id: 'golden_hour', label: 'Západ slunce', time: '18:30 Z', icon: <Clock className="w-3.5 h-3.5 text-orange-400" /> },
                  { id: 'night_nvg', label: 'Noční (NVG)', time: '23:00 Z', icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
                  { id: 'overcast_rain', label: 'Zataženo / Déšť', time: '09:00 Z', icon: <CloudRain className="w-3.5 h-3.5 text-sky-400" /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTimeWeather(item.id as ScenarioTimeWeather)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                      timeWeather === item.id
                        ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-400/50 text-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{item.time}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 4: GENERATION MODE & TARGET PLACEMENT */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>5. Možnosti vložení mise</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setMode('replace')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'replace'
                    ? 'bg-sky-950/50 border-sky-500 ring-1 ring-sky-400 text-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Vytvořit novou kompletní misi</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Připraví čistou misi s novým taktickým briefingem, počasím a triggery.
                </p>
              </button>

              <button
                onClick={() => setMode('append')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'append'
                    ? 'bg-sky-950/50 border-sky-500 ring-1 ring-sky-400 text-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Přidat do stávající mise</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Zachová vaše stávající jednotky a přidá pouze tento scénář do stávající mapy.
                </p>
              </button>
            </div>

            {mapCenterCoords && (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkMapCoords"
                  checked={useMapCoords}
                  onChange={(e) => setUseMapCoords(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <label htmlFor="chkMapCoords" className="text-xs text-slate-300 cursor-pointer">
                  Umístit cíl na aktuální střed zobrazení mapy ({mapCenterCoords.lat.toFixed(3)}°N, {mapCenterCoords.lon.toFixed(3)}°E)
                </label>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Typ: <span className="text-sky-300 font-bold uppercase">{selectedType}</span> | Letka:{' '}
            <span className="text-amber-300 font-bold">{flightCount}x {playerAirframe}</span> | Základna:{' '}
            <span className="text-emerald-300 font-bold uppercase">{baseType}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Zrušit
            </button>
            <button
              onClick={handleGenerate}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Vygenerovat taktický scénář</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
