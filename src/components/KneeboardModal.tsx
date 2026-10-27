import React, { useState, useEffect, useRef } from 'react';
import type { Group, MissionData } from '../types/dcs';
import { renderKneeboardToCanvas, renderKneeboardToBlob } from '../utils/kneeboardGenerator';
import { formatDdm, formatMgrs, formatBullseye, calculateDistance, calculateBearing } from '../utils/coordinates';
import { saveAs } from 'file-saver';
import {
  FileText,
  Download,
  X,
  ChevronDown,
  Layers,
  CheckCircle,
  Eye,
  Printer,
  Copy,
  FileCode,
} from 'lucide-react';

interface KneeboardModalProps {
  missionData: MissionData;
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: Group | null;
}

type ModalViewMode = 'kneeboard' | 'pilotPack';

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
  const [viewMode, setViewMode] = useState<ModalViewMode>('kneeboard');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  useEffect(() => {
    if (selectedGroup && (selectedGroup.category === 'plane' || selectedGroup.category === 'helicopter')) {
      setCurrentGroup(selectedGroup);
    } else if (!currentGroup && planeGroups.length > 0) {
      setCurrentGroup(planeGroups[0]);
    }
  }, [selectedGroup, planeGroups]);

  // Render canvas whenever currentGroup changes and in kneeboard mode
  useEffect(() => {
    if (!isOpen || !currentGroup || !canvasContainerRef.current || viewMode !== 'kneeboard') return;

    const container = canvasContainerRef.current;
    container.innerHTML = '';

    const canvas = renderKneeboardToCanvas(currentGroup, missionData);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.borderRadius = '8px';
    canvas.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
    container.appendChild(canvas);
  }, [isOpen, currentGroup, missionData, viewMode]);

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

  // Generate Markdown Briefing Pack
  const generateMarkdownBriefing = () => {
    if (!currentGroup) return '';
    const leadUnit = currentGroup.units[0];
    const points = currentGroup.route.points;
    const startH = Math.floor(missionData.startTime / 3600);
    const startM = Math.floor((missionData.startTime % 3600) / 60);
    const timeStr = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')} ZULU`;

    const targetWp =
      points.find(
        (p) =>
          p.name?.toLowerCase().includes('target') ||
          p.name?.toLowerCase().includes('strike') ||
          p.name?.toLowerCase().includes('cas')
      ) || points[Math.min(3, points.length - 1)];

    let md = `# DCS WORLD // TACTICAL PILOT BRIEFING PACK\n`;
    md += `**MISE:** ${missionData.title} | **THEATER:** ${missionData.theatre.toUpperCase()} | **T-0:** ${timeStr}\n`;
    md += `**LETKA:** ${currentGroup.name} (${currentGroup.units.length}x ${leadUnit?.type || 'Plane'})\n\n`;

    md += `## 1. 9-LINE CAS CARD & TARGET INTEL\n`;
    if (targetWp) {
      const ddm = formatDdm(targetWp.lat, targetWp.lon);
      const mgrs = formatMgrs(targetWp.lat, targetWp.lon);
      const bulls = formatBullseye(
        missionData.theatre,
        targetWp.lat,
        targetWp.lon,
        currentGroup.coalition === 'blue' ? 'blue' : 'red'
      );
      md += `| Line | Item | Details |\n|---|---|---|\n`;
      md += `| 1 | IP / Push Point | ${points[1]?.name || 'WP 2'} |\n`;
      md += `| 2 | Heading to Target | ${
        points[1]
          ? Math.round(calculateBearing(points[1].lat, points[1].lon, targetWp.lat, targetWp.lon)) + '° Mag'
          : '---'
      } |\n`;
      md += `| 3 | Distance | ${
        points[1]
          ? (calculateDistance(points[1].lat, points[1].lon, targetWp.lat, targetWp.lon) / 1852).toFixed(1) + ' NM'
          : '---'
      } |\n`;
      md += `| 4 | Target Elevation | ${Math.round(targetWp.alt * 3.28084)} ft MSL |\n`;
      md += `| 5 | Target Description | ${targetWp.name || 'Designated Hostile Target Area'} |\n`;
      md += `| 6 | Coordinates | ${ddm} / ${mgrs} (${bulls.formatted}) |\n`;
      md += `| 7 | Mark / Laser Code | 1688 (Laser) / Red Smoke |\n`;
      md += `| 8 | Friendlies | FLOT Frontline 2 NM South |\n`;
      md += `| 9 | Egress | ${points[points.length - 2]?.name || 'WP ' + (points.length - 1)} |\n\n`;
    }

    md += `## 2. STEERPOINT NAVIGATION LOG\n`;
    md += `| WP | Name | Action | Alt (ft) | Spd (kts) | Leg (NM) |\n|---|---|---|---|---|---|\n`;
    points.forEach((pt, i) => {
      let legNM = 0;
      if (i > 0) {
        legNM = calculateDistance(points[i - 1].lat, points[i - 1].lon, pt.lat, pt.lon) / 1852;
      }
      md += `| ${pt.id} | ${pt.name || 'Waypoint'} | ${pt.action} | ${Math.round(
        pt.alt * 3.28084
      )} | ${Math.round(pt.speed * 1.94384)} | ${legNM.toFixed(1)} NM |\n`;
    });

    md += `\n## 3. COMMUNICATIONS LADDER\n`;
    const freqMhz = leadUnit?.radio?.frequency ? (leadUnit.radio.frequency / 1000000).toFixed(3) : '305.000';
    md += `- **PRI (Flight TAC):** ${freqMhz} MHz (AM)\n`;
    md += `- **GUARD:** 243.000 MHz / 121.500 MHz\n`;
    if (leadUnit?.radio?.channels) {
      md += `\n### Radio Presets (Channels 1-20):\n`;
      Object.entries(leadUnit.radio.channels).forEach(([ch, hz]) => {
        md += `- **Ch ${ch}:** ${(Number(hz) / 1000000).toFixed(3)} MHz\n`;
      });
    }

    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownBriefing();
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTabletHtml = () => {
    if (!currentGroup) return;
    const md = generateMarkdownBriefing();
    const htmlContent = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <title>${missionData.title} // Pilot Pack</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #090d16; color: #f8fafc; padding: 25px; line-height: 1.6; }
    h1, h2, h3 { color: #38bdf8; font-family: monospace; border-bottom: 1px solid #1e293b; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-family: monospace; font-size: 13px; }
    th, td { border: 1px solid #334155; padding: 8px 12px; text-align: left; }
    th { background: #1e293b; color: #38bdf8; }
    tr:nth-child(even) { background: #0f172a; }
    strong { color: #fbbf24; }
    @media print { body { background: #ffffff; color: #000000; } th { background: #eeeeee; color: #000000; } }
  </style>
</head>
<body>
  <pre style="white-space: pre-wrap; font-family: inherit;">${md}</pre>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${currentGroup.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_pilot_pack.html`);
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
          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('kneeboard')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  viewMode === 'kneeboard'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Kokpitový Kneeboard (PNG)
              </button>
              <button
                onClick={() => setViewMode('pilotPack')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  viewMode === 'pilotPack'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Taktický Pilot Pack & 9-Line
              </button>
            </div>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Vybraná letka:</span>
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
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'kneeboard' ? (
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
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                  title="Kopírovat pro Discord / briefing"
                >
                  {copiedMd ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMd ? 'Zkopírováno!' : 'Kopírovat MD'}</span>
                </button>

                <button
                  onClick={handleDownloadTabletHtml}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition-all"
                  title="Stáhnout jako offline HTML pro iPad / tablet"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>HTML pro tablet</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30 transition-all shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Vytisknout / PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-5 py-2 bg-sky-950/40 border-b border-sky-800/40 text-[11px] text-sky-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              {viewMode === 'kneeboard' ? (
                <>
                  <strong>Tip:</strong> Při každém exportu do <code>.miz</code> jsou tyto karty automaticky zabaleny
                  do složky <code>Kneeboard/</code> a piloti je mají v DCS k dispozici v kokpitu (klávesy <strong>[</strong> a <strong>]</strong>).
                </>
              ) : (
                <>
                  <strong>Pilot Briefing Pack:</strong> Obsahuje standardizovaný 9-Line lístek, navigační steerpointy a rádiový plán pro druhý monitor nebo tisk na papír.
                </>
              )}
            </span>
          </span>
          <span className="font-mono text-[10px] text-slate-400 hidden md:inline">
            {viewMode === 'kneeboard' ? '1024 × 1400 px' : 'NATO STANAG FORMAT'}
          </span>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-950/80">
          {viewMode === 'kneeboard' ? (
            currentGroup ? (
              <div
                ref={canvasContainerRef}
                className="max-w-[650px] w-full border border-slate-700/60 rounded-xl overflow-hidden shadow-2xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-2">
                <Layers className="w-10 h-10 text-slate-600" />
                <span>Přidejte do mise alespoň jednu letku pro vygenerování kneeboardu.</span>
              </div>
            )
          ) : (
            /* PILOT BRIEFING PACK & 9-LINE CAS VIEW */
            currentGroup && (
              <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-xl p-6 space-y-6 text-slate-200 font-sans print:bg-white print:text-black">
                {/* Header Banner */}
                <div className="border-b border-slate-700 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
                      DCS WORLD // FLIGHT CREW BRIEFING PACK
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {missionData.theatre.toUpperCase()} THEATER
                    </span>
                  </div>
                  <h1 className="text-xl font-bold font-mono text-slate-100 mt-1">{missionData.title}</h1>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Letka: <strong className="text-amber-300">{currentGroup.name}</strong> ({currentGroup.units.length}x {currentGroup.units[0]?.type}) | Koalice: {currentGroup.coalition.toUpperCase()}
                  </div>
                </div>

                {/* 9-Line CAS Table */}
                <div className="space-y-2">
                  <h3 className="font-mono font-bold text-sm text-sky-400 flex items-center gap-1.5">
                    <span>1. 9-LINE CLOSE AIR SUPPORT (CAS) & TARGET CARD</span>
                  </h3>
                  <div className="overflow-x-auto border border-slate-700 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-800 text-sky-300">
                        <tr>
                          <th className="p-2 border-r border-slate-700 w-12 text-center">LINE</th>
                          <th className="p-2 border-r border-slate-700 w-44">ITEM</th>
                          <th className="p-2">DETAILS / TACTICAL DATA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-950/60">
                        <tr>
                          <td className="p-2 text-center font-bold text-amber-400 border-r border-slate-800">1</td>
                          <td className="p-2 font-semibold text-slate-400 border-r border-slate-800">IP / Push Point</td>
                          <td className="p-2 font-bold text-slate-200">{currentGroup.route.points[1]?.name || 'WP 2 - IP'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-bold text-amber-400 border-r border-slate-800">2</td>
                          <td className="p-2 font-semibold text-slate-400 border-r border-slate-800">Heading to Target</td>
                          <td className="p-2 font-bold text-sky-300">
                            {currentGroup.route.points[1] && currentGroup.route.points[2]
                              ? `${Math.round(calculateBearing(currentGroup.route.points[1].lat, currentGroup.route.points[1].lon, currentGroup.route.points[2].lat, currentGroup.route.points[2].lon))}° Mag`
                              : '045° Mag'}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-bold text-amber-400 border-r border-slate-800">3</td>
                          <td className="p-2 font-semibold text-slate-400 border-r border-slate-800">Distance</td>
                          <td className="p-2 font-bold text-amber-300">
                            {currentGroup.route.points[1] && currentGroup.route.points[2]
                              ? `${(calculateDistance(currentGroup.route.points[1].lat, currentGroup.route.points[1].lon, currentGroup.route.points[2].lat, currentGroup.route.points[2].lon) / 1852).toFixed(1)} NM`
                              : '12.4 NM'}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-bold text-amber-400 border-r border-slate-800">4</td>
                          <td className="p-2 font-semibold text-slate-400 border-r border-slate-800">Target Elevation</td>
                          <td className="p-2 text-slate-200 font-bold">
                            {Math.round((currentGroup.route.points[2]?.alt || 1200) * 3.28084)} ft MSL
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-bold text-amber-400 border-r border-slate-800">5</td>
                          <td className="p-2 font-semibold text-slate-400 border-r border-slate-800">Target Description</td>
                          <td className="p-2 text-red-400 font-bold">
                            {currentGroup.route.points.find(p => p.name?.toLowerCase().includes('target'))?.name || 'Hostile Heavy Armor & SAM Site'}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-bold text-amber-400 border-r border-slate-800">6</td>
                          <td className="p-2 font-semibold text-slate-400 border-r border-slate-800">Target Coordinates</td>
                          <td className="p-2 text-slate-100 font-bold">
                            {(() => {
                              const tgt = currentGroup.route.points[Math.min(3, currentGroup.route.points.length - 1)];
                              const ddm = formatDdm(tgt.lat, tgt.lon);
                              const mgrs = formatMgrs(tgt.lat, tgt.lon);
                              return `${ddm} | ${mgrs}`;
                            })()}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-bold text-amber-400 border-r border-slate-800">7</td>
                          <td className="p-2 font-semibold text-slate-400 border-r border-slate-800">Mark / Laser Code</td>
                          <td className="p-2 text-emerald-400 font-bold">Laser Code 1688 / Červený kouř (Red Smoke)</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-bold text-amber-400 border-r border-slate-800">8</td>
                          <td className="p-2 font-semibold text-slate-400 border-r border-slate-800">Friendlies</td>
                          <td className="p-2 text-emerald-300 font-bold">Alpha Platoon 2.5 NM South of Target (Green Smoke)</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-center font-bold text-amber-400 border-r border-slate-800">9</td>
                          <td className="p-2 font-semibold text-slate-400 border-r border-slate-800">Egress</td>
                          <td className="p-2 text-slate-300 font-bold">
                            {currentGroup.route.points[currentGroup.route.points.length - 2]?.name || 'WP 5 Egress to RTB'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Steerpoint Nav Log */}
                <div className="space-y-2">
                  <h3 className="font-mono font-bold text-sm text-sky-400">2. STEERPOINT NAVIGATION LOG</h3>
                  <div className="overflow-x-auto border border-slate-700 rounded-lg">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-800 text-sky-300">
                        <tr>
                          <th className="p-2 border-r border-slate-700 w-10 text-center">WP</th>
                          <th className="p-2 border-r border-slate-700">NAME</th>
                          <th className="p-2 border-r border-slate-700">ACTION</th>
                          <th className="p-2 border-r border-slate-700">ALT (FT)</th>
                          <th className="p-2 border-r border-slate-700">SPD (KTS)</th>
                          <th className="p-2 border-r border-slate-700">MAG BRG</th>
                          <th className="p-2">LEG DIST</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-950/60">
                        {currentGroup.route.points.map((pt, idx) => {
                          let legNM = '0.0';
                          let brg = '---';
                          if (idx > 0) {
                            const prev = currentGroup.route.points[idx - 1];
                            legNM = (calculateDistance(prev.lat, prev.lon, pt.lat, pt.lon) / 1852).toFixed(1);
                            brg = `${Math.round(calculateBearing(prev.lat, prev.lon, pt.lat, pt.lon)).toString().padStart(3, '0')}°`;
                          }
                          return (
                            <tr key={pt.id}>
                              <td className="p-2 text-center font-bold text-sky-400 border-r border-slate-800">{pt.id}</td>
                              <td className="p-2 font-semibold text-slate-200 border-r border-slate-800">{pt.name || `Waypoint ${pt.id}`}</td>
                              <td className="p-2 text-slate-400 border-r border-slate-800">{pt.action}</td>
                              <td className="p-2 font-bold text-amber-300 border-r border-slate-800">{Math.round(pt.alt * 3.28084).toLocaleString()}</td>
                              <td className="p-2 text-slate-300 border-r border-slate-800">{Math.round(pt.speed * 1.94384)}</td>
                              <td className="p-2 text-sky-300 font-bold border-r border-slate-800">{brg}</td>
                              <td className="p-2 font-bold text-slate-100">{legNM} NM</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Comms Ladder */}
                <div className="space-y-2">
                  <h3 className="font-mono font-bold text-sm text-sky-400">3. COMMUNICATIONS & RADIO LADDER</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">PRI / FLIGHT TACTICAL:</span>
                      <span className="text-sky-300 font-bold text-sm">
                        {currentGroup.units[0]?.radio?.frequency
                          ? (currentGroup.units[0].radio.frequency / 1000000).toFixed(3)
                          : '305.000'}{' '}
                        MHz (AM)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">GUARD EMERGENCY:</span>
                      <span className="text-red-400 font-bold">243.000 MHz / 121.500 MHz</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
