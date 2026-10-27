import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { MissionData, MissionScriptFile, MissionTrigger } from '../types/dcs';
import {
  FRAMEWORK_DEFINITIONS,
  isFrameworkEnabled,
  enableFramework,
  disableFramework,
  getActiveFrameworksCount,
  type FrameworkId,
} from '../utils/frameworkManager';
import {
  FileCode,
  Plus,
  Trash2,
  Upload,
  Download,
  BookOpen,
  Sparkles,
  Info,
  Check,
  Box,
  Cpu,
  Anchor,
  ShieldAlert,
  Fuel,
  MessageSquare,
  Globe,
  CheckCircle2,
  Code,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

export interface LuaScriptStudioProps {
  missionData: MissionData;
  onUpdateScriptFiles: (files: MissionScriptFile[]) => void;
  onUpdateTriggers?: (triggers: MissionTrigger[]) => void;
  onUpdateMissionData?: (updated: MissionData) => void;
  activeFileName?: string;
  initialMode?: 'frameworks' | 'code';
}

export const LuaScriptStudio: React.FC<LuaScriptStudioProps> = ({
  missionData,
  onUpdateScriptFiles,
  onUpdateTriggers,
  onUpdateMissionData,
  activeFileName,
  initialMode = 'frameworks',
}) => {
  const [studioMode, setStudioMode] = useState<'frameworks' | 'code'>(initialMode);
  const [selectedFileName, setSelectedFileName] = useState<string>(
    activeFileName || missionData.scriptFiles[0]?.name || ''
  );
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [frameworkToast, setFrameworkToast] = useState<string | null>(null);
  const [newFileNameInput, setNewFileNameInput] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [copiedPreset, setCopiedPreset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If activeFileName prop changes, update selection & switch to code mode
  useEffect(() => {
    if (activeFileName) {
      setSelectedFileName(activeFileName);
      setStudioMode('code');
    }
  }, [activeFileName]);

  const currentFile =
    missionData.scriptFiles.find((f) => f.name === selectedFileName) ||
    missionData.scriptFiles[0];

  const activeFrameworksCount = getActiveFrameworksCount(missionData);

  // Toggle framework on / off
  const handleToggleFramework = (id: FrameworkId) => {
    const isCurrentlyActive = isFrameworkEnabled(id, missionData);
    let updated: MissionData;

    if (isCurrentlyActive) {
      updated = disableFramework(id, missionData);
      setFrameworkToast('Framework byl odebrán z mise.');
    } else {
      updated = enableFramework(id, missionData);
      const def = FRAMEWORK_DEFINITIONS.find((f) => f.id === id);
      setFrameworkToast(`✓ ${def?.shortName || 'Framework'} byl aktivován včetně startovního triggeru!`);
    }

    if (onUpdateMissionData) {
      onUpdateMissionData(updated);
    } else {
      onUpdateScriptFiles(updated.scriptFiles);
      if (onUpdateTriggers) {
        onUpdateTriggers(updated.triggers);
      }
    }

    setTimeout(() => setFrameworkToast(null), 3000);
  };

  const handleOpenInEditor = (fileName: string) => {
    setSelectedFileName(fileName);
    setStudioMode('code');
  };

  const handleContentChange = (newContent: string | undefined) => {
    if (!currentFile || newContent === undefined) return;
    const updated = missionData.scriptFiles.map((f) =>
      f.name === currentFile.name ? { ...f, content: newContent } : f
    );
    onUpdateScriptFiles(updated);
  };

  const handleCreateFile = () => {
    let cleanName = newFileNameInput.trim();
    if (!cleanName) return;
    if (!cleanName.endsWith('.lua')) cleanName += '.lua';

    // Prevent duplicates
    if (missionData.scriptFiles.some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) {
      alert(`Soubor s názvem "${cleanName}" již existuje.`);
      return;
    }

    const newFile: MissionScriptFile = {
      name: cleanName,
      content: `-- =========================================================\n-- ${cleanName}\n-- Created in DCS Mission Planner\n-- =========================================================\n\nenv.info(">>> Loading ${cleanName} <<<")\n\n`,
    };

    onUpdateScriptFiles([...missionData.scriptFiles, newFile]);
    setSelectedFileName(cleanName);
    setNewFileNameInput('');
    setShowNewFileInput(false);
  };

  const handleDeleteFile = (fileName: string) => {
    if (missionData.scriptFiles.length <= 1) {
      alert('V misi musí zůstat alespoň jeden skriptový soubor.');
      return;
    }
    const updated = missionData.scriptFiles.filter((f) => f.name !== fileName);
    onUpdateScriptFiles(updated);
    if (selectedFileName === fileName) {
      setSelectedFileName(updated[0]?.name || '');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const cleanName = file.name;

      const existingIndex = missionData.scriptFiles.findIndex((f) => f.name === cleanName);
      if (existingIndex >= 0) {
        const updated = [...missionData.scriptFiles];
        updated[existingIndex] = { name: cleanName, content };
        onUpdateScriptFiles(updated);
      } else {
        onUpdateScriptFiles([...missionData.scriptFiles, { name: cleanName, content }]);
      }
      setSelectedFileName(cleanName);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadCurrentFile = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pre-built Script Framework Presets for Monaco Editor
  const applyPreset = (presetType: 'mist' | 'moose' | 'airboss' | 'csar' | 'tankerRespawn' | 'serverWatchdog' | 'olympus') => {
    if (!currentFile) return;

    const def = FRAMEWORK_DEFINITIONS.find((f) => f.id === presetType);
    if (def) {
      handleContentChange(def.getLuaContent(missionData));
      setCopiedPreset(true);
      setTimeout(() => setCopiedPreset(false), 2000);
    }
  };

  const renderFrameworkIcon = (name: string) => {
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

  const lineCount = currentFile ? currentFile.content.split('\n').length : 0;
  const byteCount = currentFile ? new TextEncoder().encode(currentFile.content).length : 0;

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-200 overflow-hidden text-xs">
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".lua,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* TOP STUDIO SUB-NAVIGATION BAR */}
      <div className="h-11 px-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setStudioMode('frameworks')}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-all font-semibold ${
                studioMode === 'frameworks'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Správce frameworků (1-Click)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                studioMode === 'frameworks' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-400'
              }`}>
                {activeFrameworksCount} aktivní
              </span>
            </button>

            <button
              onClick={() => setStudioMode('code')}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-all font-semibold ${
                studioMode === 'code'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Pokročilý editor kódu</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                studioMode === 'code' ? 'bg-sky-800 text-sky-100' : 'bg-slate-800 text-slate-400'
              }`}>
                {missionData.scriptFiles.length} souborů
              </span>
            </button>
          </div>
        </div>

        {/* Right Info / Action */}
        <div className="flex items-center gap-3">
          {studioMode === 'frameworks' ? (
            <button
              onClick={() => setStudioMode('code')}
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium"
            >
              <span>Přepnout do editoru kódu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setStudioMode('frameworks')}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              <span>← Zpět na Správce frameworků</span>
            </button>
          )}
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {frameworkToast && (
        <div className="bg-emerald-950/90 border-b border-emerald-600/60 px-4 py-2 text-xs font-mono font-bold text-emerald-300 flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{frameworkToast}</span>
        </div>
      )}

      {/* SUB-VIEW 1: FRAMEWORK MANAGER (1-CLICK TOGGLES) */}
      {studioMode === 'frameworks' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header / Intro banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-sky-950/40 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-100 font-mono tracking-wide">
                    DCS SCRIPT FRAMEWORKS MANAGER
                  </h2>
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    1-CLICK AKTIVACE
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Aktivujte skriptové knihovny a pomocné nástroje jediným kliknutím přepínače. DCS Mission Planner
                  automaticky vytvoří potřebné <code>.lua</code> soubory i časované triggery v <code>MISSION START</code> a zabalí je do <code>.miz</code>.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shrink-0 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Aktivní knihovny</div>
                  <div className="text-sm font-extrabold font-mono text-emerald-400">
                    {activeFrameworksCount} z {FRAMEWORK_DEFINITIONS.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Kategorie:</span>
              </span>
              {[
                { id: 'ALL', label: 'Všechny knihovny' },
                { id: 'core', label: 'Jádro (MIST / MOOSE)' },
                { id: 'naval', label: 'Supercarrier & Námořnictvo' },
                { id: 'gameplay', label: 'Záchrana pilotů (CSAR)' },
                { id: 'utility', label: 'Server & Utility' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterCategory === cat.id
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Framework Cards Grid */}
            <div className="grid grid-cols-1 gap-3.5">
              {filteredFrameworks.map((def) => {
                const isEnabled = isFrameworkEnabled(def.id, missionData);

                return (
                  <div
                    key={def.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isEnabled
                        ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Left: Icon & Description */}
                    <div className="flex items-start gap-3.5 flex-1">
                      <div
                        className={`p-2.5 rounded-xl border mt-0.5 ${
                          isEnabled
                            ? 'bg-emerald-950/70 border-emerald-700 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {renderFrameworkIcon(def.iconName)}
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

                    {/* Right: Actions & Toggle Switch */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0 border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
                      <button
                        onClick={() => handleOpenInEditor(def.fileName)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-1.5"
                        title="Zobrazit a upravit kód v Monaco editoru"
                      >
                        <Code className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kód souboru</span>
                      </button>

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

          </div>
        </div>
      )}

      {/* SUB-VIEW 2: ADVANCED CODE EDITOR (MONACO + FILES SIDEBAR) */}
      {studioMode === 'code' && (
        <div className="flex flex-1 w-full h-full overflow-hidden">
          {/* Sidebar: Files Manager */}
          <div className="w-72 border-r border-slate-800 bg-slate-900/70 flex flex-col h-full shrink-0">
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Lua Skripty ({missionData.scriptFiles.length})</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Nahrát .lua soubor z disku"
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowNewFileInput(true)}
                    title="Vytvořit nový .lua soubor"
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded transition-colors text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nový</span>
                  </button>
                </div>
              </div>

              {showNewFileInput && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="nazev_skriptu.lua"
                    value={newFileNameInput}
                    onChange={(e) => setNewFileNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateFile}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded font-bold text-xs"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setShowNewFileInput(false)}
                    className="text-slate-400 hover:text-white px-1.5"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Quick Switch to Frameworks Manager Promo */}
            <div className="p-2 border-b border-slate-800 bg-emerald-950/20">
              <button
                onClick={() => setStudioMode('frameworks')}
                className="w-full text-left p-2 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-700/50 text-emerald-200 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-[11px]">Správce frameworků</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-800 text-white px-1.5 rounded">
                  {activeFrameworksCount}
                </span>
              </button>
            </div>

            {/* Files list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {missionData.scriptFiles.map((file) => {
                const isSelected = file.name === currentFile?.name;
                return (
                  <div
                    key={file.name}
                    onClick={() => setSelectedFileName(file.name)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/60 shadow-sm text-slate-100'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="font-mono text-xs truncate">{file.name}</span>
                    </div>

                    {missionData.scriptFiles.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                        title="Smazat soubor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pre-built Templates Library Box */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>Vložit vzorový kód</span>
              </div>

              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => applyPreset('airboss')}
                  className="text-left px-2 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/60 text-indigo-200 rounded transition-colors text-[11px] flex items-center justify-between"
                >
                  <span>MOOSE Airboss (Supercarrier)</span>
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                </button>
                <button
                  onClick={() => applyPreset('csar')}
                  className="text-left px-2 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-200 rounded transition-colors text-[11px] flex items-center justify-between"
                >
                  <span>MOOSE CSAR (Záchrana pilotů)</span>
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                </button>
                <button
                  onClick={() => applyPreset('tankerRespawn')}
                  className="text-left px-2 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-200 rounded transition-colors text-[11px] flex items-center justify-between"
                >
                  <span>Permanent Tanker & AWACS Respawn</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </button>
                <button
                  onClick={() => applyPreset('mist')}
                  className="text-left px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded transition-colors text-[11px] flex items-center justify-between"
                >
                  <span>MIST Framework Stub</span>
                  <Sparkles className="w-3 h-3 text-sky-400" />
                </button>
                <button
                  onClick={() => applyPreset('moose')}
                  className="text-left px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded transition-colors text-[11px] flex items-center justify-between"
                >
                  <span>MOOSE Framework Starter</span>
                  <Sparkles className="w-3 h-3 text-sky-400" />
                </button>
                <button
                  onClick={() => applyPreset('serverWatchdog')}
                  className="text-left px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded transition-colors text-[11px] flex items-center justify-between"
                >
                  <span>Server Watchdog & Zprávy</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </button>
                <button
                  onClick={() => applyPreset('olympus')}
                  className="text-left px-2 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded transition-colors text-[11px] flex items-center justify-between"
                >
                  <span>DCS Olympus Live Sync</span>
                  <Sparkles className="w-3 h-3 text-slate-400" />
                </button>
              </div>

              {copiedPreset && (
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Šablona vložena do aktivního souboru!</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Code Editor */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
            {/* Editor Toolbar */}
            <div className="p-2.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-100 text-sm flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>{currentFile?.name || 'Žádný vybraný soubor'}</span>
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  l10n/DEFAULT/{currentFile?.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCurrentFile}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded transition-colors text-xs"
                  title="Stáhnout tento .lua soubor"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Stáhnout .lua</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 overflow-hidden">
              {currentFile ? (
                <Editor
                  height="100%"
                  defaultLanguage="lua"
                  theme="vs-dark"
                  value={currentFile.content}
                  onChange={handleContentChange}
                  options={{
                    fontSize: 13,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    automaticLayout: true,
                    minimap: { enabled: true },
                    wordWrap: 'on',
                    bracketPairColorization: { enabled: true },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  Vyberte nebo vytvořte soubor skriptu v levém panelu.
                </div>
              )}
            </div>

            {/* Footer / Status bar */}
            <div className="px-3 py-1.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-4">
                <span>DCS Scripting Engine (Lua 5.1/LuaJIT)</span>
                <span>•</span>
                <span>Řádků: {lineCount}</span>
                <span>•</span>
                <span>Velikost: {(byteCount / 1024).toFixed(1)} KB</span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-400">
                <Info className="w-3.5 h-3.5" />
                <span>Automaticky baleno do .miz archivu (l10n/DEFAULT)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
