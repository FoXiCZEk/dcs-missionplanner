import React, { useState, useEffect, useRef } from 'react';
import type { Group, MissionData } from '../types/dcs';
import { renderKneeboardToCanvas, renderKneeboardToBlob } from '../utils/kneeboardGenerator';
import { saveAs } from 'file-saver';
import {
  FileText,
  Download,
  X,
  ChevronDown,
  Layers,
  CheckCircle,
  Eye,
} from 'lucide-react';

interface KneeboardModalProps {
  missionData: MissionData;
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: Group | null;
}

export const KneeboardModal: React.FC<KneeboardModalProps> = ({
  missionData,
  isOpen,
  onClose,
  selectedGroup,
}) => {
  const planeGroups = missionData.groups.filter(
    (g) => g.category === 'plane' || g.category === 'helicopter'
  );

  const initialGroup =
    selectedGroup && (selectedGroup.category === 'plane' || selectedGroup.category === 'helicopter')
      ? selectedGroup
      : planeGroups[0] || null;

  const [currentGroup, setCurrentGroup] = useState<Group | null>(initialGroup);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (selectedGroup && (selectedGroup.category === 'plane' || selectedGroup.category === 'helicopter')) {
      setCurrentGroup(selectedGroup);
    } else if (!currentGroup && planeGroups.length > 0) {
      setCurrentGroup(planeGroups[0]);
    }
  }, [selectedGroup, planeGroups]);

  // Render canvas whenever currentGroup changes
  useEffect(() => {
    if (!isOpen || !currentGroup || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    container.innerHTML = '';

    const canvas = renderKneeboardToCanvas(currentGroup, missionData);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.borderRadius = '8px';
    canvas.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
    container.appendChild(canvas);
  }, [isOpen, currentGroup, missionData]);

  if (!isOpen) return null;

  const handleDownloadPng = async () => {
    if (!currentGroup) return;
    try {
      setIsExporting(true);
      const blob = await renderKneeboardToBlob(currentGroup, missionData);
      const safeName = `${currentGroup.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_kneeboard.png`;
      saveAs(blob, safeName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-slate-100">
                  DCS KNEEBOARD & FLIGHT CARD GENERATOR
                </h2>
                <span className="bg-amber-950/80 text-amber-400 border border-amber-700/80 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                  Kokpitová Karta
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Předletová navigační a komunikační karta pilotů generovaná přímo pro DCS World
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

        {/* Toolbar & Selector */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Vybraná letka:</span>
            {planeGroups.length > 0 ? (
              <div className="relative">
                <select
                  value={currentGroup?.groupId || ''}
                  onChange={(e) => {
                    const g = planeGroups.find((pg) => pg.groupId === Number(e.target.value));
                    if (g) setCurrentGroup(g);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-200 appearance-none pr-8 focus:outline-none focus:border-amber-500"
                >
                  {planeGroups.map((g) => (
                    <option key={g.groupId} value={g.groupId}>
                      {g.name} ({g.units[0]?.type || 'Plane'}) - {g.units.length}x
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            ) : (
              <span className="text-xs text-slate-500">V misi není žádné letadlo ani vrtulník</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPng}
              disabled={isExporting || !currentGroup}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Staženo!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Stáhnout PNG kartu</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-5 py-2 bg-sky-950/40 border-b border-sky-800/40 text-[11px] text-sky-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              <strong>Tip:</strong> Při každém exportu do <code>.miz</code> jsou tyto karty automaticky zabaleny
              do složky <code>Kneeboard/</code> a piloti je mají v DCS k dispozici v kokpitu (klávesy <strong>[</strong> a <strong>]</strong>).
            </span>
          </span>
          <span className="font-mono text-[10px] text-slate-400 hidden md:inline">1024 × 1400 px</span>
        </div>

        {/* Canvas Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-950/80">
          {currentGroup ? (
            <div
              ref={canvasContainerRef}
              className="max-w-[650px] w-full border border-slate-700/60 rounded-xl overflow-hidden shadow-2xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-2">
              <Layers className="w-10 h-10 text-slate-600" />
              <span>Přidejte do mise alespoň jednu letku pro vygenerování kneeboardu.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
