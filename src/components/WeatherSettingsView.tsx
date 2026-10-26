import React from 'react';
import type { MissionData } from '../types/dcs';
import {
  CloudRain,
  Sun,
  Wind,
  Clock,
  Calendar,
  FileText,
  Thermometer,
} from 'lucide-react';

interface WeatherSettingsViewProps {
  missionData: MissionData;
  onUpdateMissionData: (data: MissionData) => void;
}

export const WeatherSettingsView: React.FC<WeatherSettingsViewProps> = ({
  missionData,
  onUpdateMissionData,
}) => {
  const { weather, date, startTime, title, description, descriptionBlue, descriptionRed } = missionData;

  // Format seconds to HH:MM
  const hours = Math.floor(startTime / 3600);
  const minutes = Math.floor((startTime % 3600) / 60);
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const [h, m] = val.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      onUpdateMissionData({
        ...missionData,
        startTime: h * 3600 + m * 60,
      });
    }
  };

  const handleWeatherChange = (partial: any) => {
    onUpdateMissionData({
      ...missionData,
      weather: {
        ...weather,
        ...partial,
      },
    });
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-200 overflow-y-auto p-6 space-y-6 text-xs">
      {/* Title & Briefing */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <span>Informace o misi & Briefing</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Název mise</label>
              <input
                type="text"
                value={title}
                onChange={(e) => onUpdateMissionData({ ...missionData, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Hlavní popis mise (Briefing)</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => onUpdateMissionData({ ...missionData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed font-mono"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-sky-400 block mb-1 font-semibold">Úkoly modré koalice (Blue Task)</label>
              <textarea
                rows={4}
                value={descriptionBlue}
                onChange={(e) => onUpdateMissionData({ ...missionData, descriptionBlue: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-red-400 block mb-1 font-semibold">Úkoly červené koalice (Red Task)</label>
              <textarea
                rows={4}
                value={descriptionRed}
                onChange={(e) => onUpdateMissionData({ ...missionData, descriptionRed: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-200 focus:outline-none focus:border-red-500 leading-relaxed font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Datum a čas startu</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Rok</span>
            </label>
            <input
              type="number"
              value={date.year}
              onChange={(e) =>
                onUpdateMissionData({ ...missionData, date: { ...date, year: Number(e.target.value) } })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-100"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Měsíc (1 - 12)</label>
            <input
              type="number"
              min="1"
              max="12"
              value={date.month}
              onChange={(e) =>
                onUpdateMissionData({ ...missionData, date: { ...date, month: Number(e.target.value) } })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-100"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Den (1 - 31)</label>
            <input
              type="number"
              min="1"
              max="31"
              value={date.day}
              onChange={(e) =>
                onUpdateMissionData({ ...missionData, date: { ...date, day: Number(e.target.value) } })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-100"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Čas zahájení (HH:MM)</span>
            </label>
            <input
              type="time"
              value={timeString}
              onChange={handleTimeChange}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-amber-300 font-bold"
            />
          </div>
        </div>
      </div>

      {/* Weather conditions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-emerald-400" />
          <span>Počasí & Atmosféra</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Temperature & QNH */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-3">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-red-400" />
              <span>Teplota & Tlak</span>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Teplota vzduchu (°C)</label>
              <input
                type="number"
                value={weather.season?.temperature ?? 20}
                onChange={(e) =>
                  handleWeatherChange({
                    season: { ...(weather.season || {}), temperature: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Tlak QNH (mmHg / standard 760)</label>
              <input
                type="number"
                value={weather.qnh ?? 760}
                onChange={(e) => handleWeatherChange({ qnh: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono"
              />
            </div>
          </div>

          {/* Clouds */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-3">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Oblačnost (Clouds)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Základna (Base, m)</label>
                <input
                  type="number"
                  value={weather.clouds?.base ?? 2000}
                  onChange={(e) =>
                    handleWeatherChange({
                      clouds: { ...(weather.clouds || {}), base: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Hustota (0 - 8)</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={weather.clouds?.density ?? 1}
                  onChange={(e) =>
                    handleWeatherChange({
                      clouds: { ...(weather.clouds || {}), density: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Srážky (Precipitation)</label>
              <select
                value={weather.clouds?.iprecptns ?? 0}
                onChange={(e) =>
                  handleWeatherChange({
                    clouds: { ...(weather.clouds || {}), iprecptns: Number(e.target.value) },
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1"
              >
                <option value={0}>0 - Bez srážek (Jasno/Oblačno)</option>
                <option value={1}>1 - Déšť (Rain)</option>
                <option value={2}>2 - Bouřka (Thunderstorm)</option>
                <option value={3}>3 - Sněžení (Snow)</option>
              </select>
            </div>
          </div>

          {/* Wind Aloft */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-3">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-sky-400" />
              <span>Vítr ve vrstvách</span>
            </div>

            {/* At Ground */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Země: Rychlost (m/s)</label>
                <input
                  type="number"
                  value={weather.wind?.atGround?.speed ?? 0}
                  onChange={(e) =>
                    handleWeatherChange({
                      wind: {
                        ...(weather.wind || {}),
                        atGround: { ...(weather.wind?.atGround || {}), speed: Number(e.target.value) },
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Země: Směr (°)</label>
                <input
                  type="number"
                  value={weather.wind?.atGround?.dir ?? 0}
                  onChange={(e) =>
                    handleWeatherChange({
                      wind: {
                        ...(weather.wind || {}),
                        atGround: { ...(weather.wind?.atGround || {}), dir: Number(e.target.value) },
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono"
                />
              </div>
            </div>

            {/* At 2000m */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">2000m: Rychlost (m/s)</label>
                <input
                  type="number"
                  value={weather.wind?.at2000?.speed ?? 0}
                  onChange={(e) =>
                    handleWeatherChange({
                      wind: {
                        ...(weather.wind || {}),
                        at2000: { ...(weather.wind?.at2000 || {}), speed: Number(e.target.value) },
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">2000m: Směr (°)</label>
                <input
                  type="number"
                  value={weather.wind?.at2000?.dir ?? 0}
                  onChange={(e) =>
                    handleWeatherChange({
                      wind: {
                        ...(weather.wind || {}),
                        at2000: { ...(weather.wind?.at2000 || {}), dir: Number(e.target.value) },
                      },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
