import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { MissionData, MissionScriptFile } from '../types/dcs';
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
} from 'lucide-react';

interface LuaScriptStudioProps {
  missionData: MissionData;
  onUpdateScriptFiles: (files: MissionScriptFile[]) => void;
  activeFileName?: string;
}

export const LuaScriptStudio: React.FC<LuaScriptStudioProps> = ({
  missionData,
  onUpdateScriptFiles,
  activeFileName,
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string>(
    activeFileName || missionData.scriptFiles[0]?.name || ''
  );
  const [newFileNameInput, setNewFileNameInput] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [copiedPreset, setCopiedPreset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFile =
    missionData.scriptFiles.find((f) => f.name === selectedFileName) ||
    missionData.scriptFiles[0];

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

  // Pre-built Script Framework Presets
  const applyPreset = (presetType: 'mist' | 'moose' | 'airboss' | 'csar' | 'tankerRespawn' | 'serverWatchdog' | 'olympus') => {
    if (!currentFile) return;

    let template = '';
    if (presetType === 'mist') {
      template = `-- ==============================================================================
-- MIST (Mission Scripting Tools) Integration Stub
-- Reference: http://wiki.hoggit.us/view/Mission_Scripting_Tools_Documentation
-- ==============================================================================

env.info("Initializing MIST utilities...")

-- Example 1: Check if all units in a group are destroyed
function CheckGroupDestroyed(groupName)
    local grp = Group.getByName(groupName)
    if not grp or grp:isExist() == false or #grp:getUnits() == 0 then
        return true
    end
    return false
end

-- Example 2: Spawn dynamic smoke marker on trigger zone
function MarkZoneWithSmoke(zoneName, smokeColor)
    local z = trigger.misc.getZone(zoneName)
    if z then
        local color = smokeColor or trigger.smokeColor.Red
        trigger.action.smoke(z.point, color)
        trigger.action.outText("Kouřová značka aktivována v zóně: " .. zoneName, 10)
    end
end

-- Example 3: Periodic unit scanner
mist.scheduleFunction(function()
    env.info("MIST Periodic Scan: Active groups verified.")
end, {}, timer.getTime() + 10, 60)
`;
    } else if (presetType === 'moose') {
      template = `-- ==============================================================================
-- MOOSE (Mission Object Oriented Scripting Environment) Starter
-- Documentation: https://flightcontrol-master.github.io/MOOSE_DOCS/
-- Ensure Moose.lua is loaded in MISSION START trigger before running this script
-- ==============================================================================

env.info("Starting MOOSE mission logic...")

-- 1. Setup Blue Combat Air Patrol (CAP) with dynamic respawn
local CapZone = ZONE:New("ZONE // TARGET AREA (CAP)")
if CapZone then
    local CapSpawner = SPAWN:New("Chevy 1 (CAP)")
        :InitLimit(2, 4)
        :InitCleanUp(60)
        :SpawnScheduled(300, 0.5)
    env.info("MOOSE: Blue CAP Spawner initialized.")
end

-- 2. Setup Red QRF / Scramble on intrusion
local DetectionSet = SET_GROUP:New():FilterCoalitions("blue"):FilterStart()
`;
    } else if (presetType === 'airboss') {
      template = `-- ==============================================================================
-- MOOSE AIRBOSS // DCS SUPERCARRIER CASE I / II / III AUTOMATED LSO & RECOVERY
-- Requires MOOSE.lua loaded prior to this script
-- ==============================================================================

env.info("AIRBOSS: Initializing Supercarrier Airboss Controller...")

-- Define Carrier
local CarrierAirboss = AIRBOSS:New("USS Theodore Roosevelt", "CVN-71")

-- Set Recovery Parameters
CarrierAirboss:SetTACAN(71, "X", "ROO")
CarrierAirboss:SetICLS(11, "ROO")
CarrierAirboss:SetRadio(127.500)
CarrierAirboss:SetBaseRecoveryCourse(270)
CarrierAirboss:SetSoundfilesFolder("Airboss Soundfiles/")

-- Setup Marshall Stack (Case III holding pattern at 6,000 ft - 12,000 ft MSL)
CarrierAirboss:SetMarshallRadius(25)
CarrierAirboss:SetDefaultPlayerSkill("Excellent")
CarrierAirboss:SetMenuRecovery(true, 25, true)

-- Start Recovery Windows (Case I during day, Case III at night)
local Case1Window = CarrierAirboss:AddRecoveryWindow("10:00", "12:00", 1, 30, true)
local Case3Window = CarrierAirboss:AddRecoveryWindow("20:00", "22:00", 3, 30, true)

-- Hook Events for LSO Grading & Traps
function CarrierAirboss:OnAfterGrading(From, Event, To, FlightRecord)
    local grade = FlightRecord.grade
    local points = FlightRecord.points
    local pilot = FlightRecord.name
    local wire = FlightRecord.wire
    local msg = string.format("LSO // %s - Trap Wire #%d | Známka: %s (%d bodů)", pilot, wire or 0, grade or "OK", points or 0)
    trigger.action.outText(msg, 15)
end

CarrierAirboss:Start()
env.info("AIRBOSS: Supercarrier controller online and listening.")
`;
    } else if (presetType === 'csar') {
      template = `-- ==============================================================================
-- MOOSE CSAR (Combat Search and Rescue) for Downed Pilots & Medevac
-- Requires MOOSE.lua loaded prior to this script
-- ==============================================================================

env.info("CSAR: Initializing Combat Search and Rescue dispatcher...")

local BlueCSAR = CSAR:New(coalition.side.BLUE, "Blue Downed Pilot", "USAF CSAR")
BlueCSAR.allowinterlock = true
BlueCSAR.pilotmustsurvive = true
BlueCSAR.enableForAI = false
BlueCSAR.rescuehoverheight = 20  -- Hover rescue at 20 meters
BlueCSAR.rescuehoverdistance = 30
BlueCSAR.coordtype = 2 -- MGRS & Lat/Lon

-- Emergency Beacon & Smoke
BlueCSAR.beaconFrequency = 243.000 -- UHF Guard
BlueCSAR.smokecolor = trigger.smokeColor.Green

-- Hospital / MASH dropoff zones
BlueCSAR:AddMASH("MASH_Hospital_Zone")

function BlueCSAR:OnAfterPilotRescued(From, Event, To, Heli, Pilot)
    trigger.action.outText("CSAR: Pilot " .. Pilot .. " byl úspěšně zachráněn a dopraven do nemocnice!", 15)
end

BlueCSAR:Start()
env.info("CSAR: Rescue network activated on 243.000 MHz Guard.")
`;
    } else if (presetType === 'tankerRespawn') {
      template = `-- ==============================================================================
-- DYNAMIC TANKER & AWACS RESPAWN SCRIPT
-- Keeps aerial refueling and early warning radar permanently active on servers
-- ==============================================================================

local function SetupPermanentSupportFlight(groupName, checkIntervalSec)
    local interval = checkIntervalSec or 120
    
    local function MonitorGroup()
        local grp = Group.getByName(groupName)
        local needsRespawn = false
        
        if not grp or grp:isExist() == false then
            needsRespawn = true
        else
            local units = grp:getUnits()
            if #units == 0 or units[1]:getFuel() < 0.15 then
                needsRespawn = true
            end
        end
        
        if needsRespawn then
            env.info("Support Monitor: Respawning " .. groupName .. " (low fuel or inactive)...")
            trigger.action.outText(">>> [AIR SUPPORT]: Náhradní letoun " .. groupName .. " vstupuje na orbitu <<<", 10)
            -- Note: Requires MIST mist.respawnGroup or MOOSE SPAWN
            if mist and mist.respawnGroup then
                mist.respawnGroup(groupName, true)
            end
        end
        
        timer.scheduleFunction(MonitorGroup, nil, timer.getTime() + interval)
    end
    
    timer.scheduleFunction(MonitorGroup, nil, timer.getTime() + interval)
end

-- Register default tanker and AWACS groups
SetupPermanentSupportFlight("Texaco 1-1", 90)
SetupPermanentSupportFlight("Arco 1-1", 90)
SetupPermanentSupportFlight("Magic 1-1", 120)
env.info("Support Flight Respawn Monitor registered.")
`;
    } else if (presetType === 'olympus') {
      template = `-- ==============================================================================
-- DCS OLYMPUS GAME MASTER LIVE SYNC CONNECTOR
-- Allows web-based real-time tactical command & control in multiplayer
-- ==============================================================================

env.info("DCS Olympus: Checking backend hooks...")
-- Ensure the DCS Olympus server hook is enabled in DCS Saved Games / Scripts
trigger.action.outText("DCS Olympus Live Sync: Online", 5)
`;
    } else if (presetType === 'serverWatchdog') {
      template = `-- ==============================================================================
-- DCS World Dedicated Server Watchdog & Periodic Announcements
-- ==============================================================================

local ServerState = {
    uptimeSeconds = 0,
    interval = 900, -- 15 minutes
    serverName = "DCS MULTIPLAYER SERVER",
}

local function PeriodicServerBroadcast()
    ServerState.uptimeSeconds = ServerState.uptimeSeconds + ServerState.interval
    local minutes = math.floor(ServerState.uptimeSeconds / 60)
    
    local msg = string.format(">>> %s | Běh serveru: %d min | F10 mapa pro úkoly <<<", ServerState.serverName, minutes)
    trigger.action.outText(msg, 15)
    
    -- Reschedule next tick
    timer.scheduleFunction(PeriodicServerBroadcast, nil, timer.getTime() + ServerState.interval)
end

-- Start first tick after 60 seconds
timer.scheduleFunction(PeriodicServerBroadcast, nil, timer.getTime() + 60)
env.info("Server Watchdog Broadcast registered.")
`;
    }

    handleContentChange(template);
    setCopiedPreset(true);
    setTimeout(() => setCopiedPreset(false), 2000);
  };

  const lineCount = currentFile ? currentFile.content.split('\n').length : 0;
  const byteCount = currentFile ? new TextEncoder().encode(currentFile.content).length : 0;

  return (
    <div className="flex w-full h-full bg-slate-950 text-slate-200 overflow-hidden text-xs">
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".lua,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

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
            <span>Předlohy a Šablony</span>
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
  );
};
