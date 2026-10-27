import type { MissionData, MissionScriptFile, MissionTrigger } from '../types/dcs';

export type FrameworkId =
  | 'mist'
  | 'moose'
  | 'airboss'
  | 'csar'
  | 'tankerRespawn'
  | 'serverWatchdog'
  | 'olympus';

export interface FrameworkDefinition {
  id: FrameworkId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  category: 'core' | 'naval' | 'utility' | 'gameplay';
  version: string;
  iconName: string;
  fileName: string;
  triggerName: string;
  triggerSeconds: number;
  dependencies?: FrameworkId[];
  getLuaContent: (missionData: MissionData) => string;
}

export const FRAMEWORK_DEFINITIONS: FrameworkDefinition[] = [
  {
    id: 'mist',
    name: 'MIST (Mission Scripting Tools)',
    shortName: 'MIST 4.5',
    tagline: 'Základní nízkoúrovňová knihovna pro DCS skripty a CTLD',
    description: 'Nezbytný základ pro většinu komunitních DCS skriptů. Poskytuje funkce pro sledování jednotek v zónách, dynamický respawn, teleportaci a koordinaci zpráv.',
    category: 'core',
    version: 'v4.5.126',
    iconName: 'Box',
    fileName: 'mist.lua',
    triggerName: '[FRAMEWORK] 01 - Load MIST Library',
    triggerSeconds: 1,
    getLuaContent: () => `-- ==============================================================================
-- MIST (Mission Scripting Tools) - Core Loader
-- Version: 4.5.126
-- Reference: http://wiki.hoggit.us/view/Mission_Scripting_Tools_Documentation
-- ==============================================================================

env.info(">>> MIST: Mission Scripting Tools Framework Initialized <<<")

-- Verify MIST environment
if not mist then
    mist = {}
end

-- Helper: Check if group is completely eliminated
function mist_IsGroupDestroyed(groupName)
    local grp = Group.getByName(groupName)
    if not grp or grp:isExist() == false or #grp:getUnits() == 0 then
        return true
    end
    return false
end

-- Helper: Mark Zone with Smoke
function mist_MarkZoneWithSmoke(zoneName, color)
    local z = trigger.misc.getZone(zoneName)
    if z then
        trigger.action.smoke(z.point, color or trigger.smokeColor.Red)
    end
end
`,
  },
  {
    id: 'moose',
    name: 'MOOSE (Mission Object Oriented Scripting Environment)',
    shortName: 'MOOSE Framework',
    tagline: 'Moderní objektový ekosystém pro dynamické kampaně',
    description: 'Nejrozšířenější framework pro pokročilé mise. Zahrnuje dynamické spawnování CAP, A2A/A2G dispečer, AI zóny, Airboss pro letadlové lodě a CSAR záchranu.',
    category: 'core',
    version: 'v2.9.2',
    iconName: 'Cpu',
    fileName: 'Moose.lua',
    triggerName: '[FRAMEWORK] 02 - Load MOOSE Framework',
    triggerSeconds: 2,
    getLuaContent: () => `-- ==============================================================================
-- MOOSE (Mission Object Oriented Scripting Environment)
-- Version: 2.9.2 Core Loader
-- Documentation: https://flightcontrol-master.github.io/MOOSE_DOCS/
-- ==============================================================================

env.info(">>> MOOSE: Core Object Environment Initialized <<<")

-- Global MOOSE verification stub
_DATABASE:AddEvent(DCS.Event.MISSION_START, function()
    env.info("MOOSE: Mission event pipeline online.")
end)
`,
  },
  {
    id: 'airboss',
    name: 'MOOSE Airboss (Supercarrier CASE I/II/III Auto-LSO)',
    shortName: 'Airboss Controller',
    tagline: 'Automatické řízení přiblížení a hodnocení přistání na letadlovou loď',
    description: 'Poskytuje reálné hlasové Case I / Case II / Case III navádění na přistání, Marshall holding okruhy (6000–12000 ft), kontrolu sestupové osy (groove) a LSO známkování trapů (OK, _OK_, No Grade, Cut) s bodovým hodnocením.',
    category: 'naval',
    version: 'v2.8',
    iconName: 'Anchor',
    fileName: 'airboss_supercarrier.lua',
    triggerName: '[FRAMEWORK] 03 - Supercarrier Airboss Controller',
    triggerSeconds: 4,
    dependencies: ['moose'],
    getLuaContent: (missionData) => {
      // Find carrier group or unit
      const carrierGroup = missionData.groups.find(
        (g) => g.category === 'ship' && g.units.some((u) => u.type.startsWith('CVN') || u.type === 'Stennis')
      );
      const leadShip = carrierGroup?.units[0];
      const carrierName = leadShip?.name || 'USS Theodore Roosevelt';
      const callsign = 'CVN-71';

      return `-- ==============================================================================
-- MOOSE AIRBOSS // DCS SUPERCARRIER CASE I / II / III AUTOMATED CONTROLLER
-- Requires MOOSE.lua
-- ==============================================================================

env.info("AIRBOSS: Initializing Supercarrier Airboss Controller...")

-- 1. Create Airboss instance for carrier
local CarrierAirboss = AIRBOSS:New("${carrierName}", "${callsign}")

-- 2. Configure Navaids & Frequencies
CarrierAirboss:SetTACAN(71, "X", "ROO")
CarrierAirboss:SetICLS(11, "ROO")
CarrierAirboss:SetRadio(127.500)
CarrierAirboss:SetBaseRecoveryCourse(270)
CarrierAirboss:SetSoundfilesFolder("Airboss Soundfiles/")

-- 3. Setup Marshall Holding Stack (Case III / Night)
CarrierAirboss:SetMarshallRadius(25)
CarrierAirboss:SetDefaultPlayerSkill("Excellent")
CarrierAirboss:SetMenuRecovery(true, 25, true)

-- 4. Recovery Windows (Case I daytime, Case III nighttime)
local Case1Window = CarrierAirboss:AddRecoveryWindow("09:00", "13:00", 1, 30, true)
local Case3Window = CarrierAirboss:AddRecoveryWindow("19:00", "23:00", 3, 30, true)

-- 5. Trap Grading & LSO Evaluation Hook
function CarrierAirboss:OnAfterGrading(From, Event, To, FlightRecord)
    local grade = FlightRecord.grade or "OK"
    local points = FlightRecord.points or 3
    local pilot = FlightRecord.name or "Pilot"
    local wire = FlightRecord.wire or 3
    local msg = string.format("LSO // %s: Wire #%d | Známka: %s (%d bodů) | ETE: On Deck", pilot, wire, grade, points)
    trigger.action.outText(msg, 15)
end

CarrierAirboss:Start()
env.info("AIRBOSS: Supercarrier controller online and active.")
`;
    },
  },
  {
    id: 'csar',
    name: 'MOOSE CSAR (Combat Search and Rescue – Záchrana pilotů)',
    shortName: 'CSAR Medevac',
    tagline: 'Záchranné mise pro vrtulníky po sestřelení pilotů',
    description: 'Když je pilot sestřelen a katapultuje se na padáku, aktivuje se UHF nouzový maják (243.000 MHz) a zelený dýmový signál. Vrtulníky (UH-1H, Mi-8, AH-64D) mohou pilota vyzvednout ve visu nebo po přistání a dopravit do polní nemocnice.',
    category: 'gameplay',
    version: 'v2.1',
    iconName: 'ShieldAlert',
    fileName: 'csar_rescue.lua',
    triggerName: '[FRAMEWORK] 04 - CSAR Downed Pilot Network',
    triggerSeconds: 4,
    dependencies: ['moose'],
    getLuaContent: () => `-- ==============================================================================
-- MOOSE CSAR // COMBAT SEARCH AND RESCUE & MEDEVAC
-- Requires MOOSE.lua
-- ==============================================================================

env.info("CSAR: Initializing Combat Search and Rescue network...")

local BlueCSAR = CSAR:New(coalition.side.BLUE, "Blue Downed Pilot", "USAF CSAR")
BlueCSAR.allowinterlock = true
BlueCSAR.pilotmustsurvive = true
BlueCSAR.enableForAI = false
BlueCSAR.rescuehoverheight = 25  -- Hover altitude 25m
BlueCSAR.rescuehoverdistance = 35 -- Radius 35m
BlueCSAR.coordtype = 2          -- MGRS coordinates in messages

-- Emergency Beacon & Smoke
BlueCSAR.beaconFrequency = 243.000 -- 243.000 MHz Guard
BlueCSAR.smokecolor = trigger.smokeColor.Green

-- Hospital Dropoff Zone (uses existing trigger zone or default)
BlueCSAR:AddMASH("MASH_Hospital")

function BlueCSAR:OnAfterPilotRescued(From, Event, To, Heli, Pilot)
    trigger.action.outText("CSAR: Pilot " .. Pilot .. " byl úspěšně zachráněn a evakuován na základnu!", 15)
end

BlueCSAR:Start()
env.info("CSAR: Network listening on UHF 243.000 MHz.")
`,
  },
  {
    id: 'tankerRespawn',
    name: 'Permanentní Tanker & AWACS Respawn',
    shortName: 'Support Respawn',
    tagline: 'Udržuje tankery a radary AWACS nepřetržitě v provozu na serveru',
    description: 'Automaticky monitoruje stav paliva a přežití tankerů (Texaco, Arco, Shell) a letounu AWACS (Magic). Jakmile tanker vyčerpá palivo nebo je zničen, okamžitě respawnuje náhradní letoun se stejným TACANem a rádiem.',
    category: 'utility',
    version: 'v1.4',
    iconName: 'Fuel',
    fileName: 'support_respawn.lua',
    triggerName: '[FRAMEWORK] 05 - Tanker and AWACS Respawn Engine',
    triggerSeconds: 5,
    getLuaContent: () => `-- ==============================================================================
-- DYNAMIC TANKER & AWACS RESPAWN ENGINE
-- Automatically replaces low-fuel or destroyed support aircraft
-- ==============================================================================

local function RegisterAutoSupportRespawn(groupName, checkSeconds)
    local interval = checkSeconds or 120

    local function CheckFlight()
        local grp = Group.getByName(groupName)
        local needsRespawn = false

        if not grp or grp:isExist() == false then
            needsRespawn = true
        else
            local units = grp:getUnits()
            if #units == 0 or units[1]:getFuel() < 0.12 then
                needsRespawn = true
            end
        end

        if needsRespawn then
            env.info("Support Engine: Respawning " .. groupName .. " (low fuel or inactive)...")
            trigger.action.outText(">>> [AIR SUPPORT]: Náhradní stroj " .. groupName .. " vstupuje do vyčkávacího okruhu <<<", 10)
            
            -- Use MIST if available, otherwise restart group
            if mist and mist.respawnGroup then
                mist.respawnGroup(groupName, true)
            end
        end

        timer.scheduleFunction(CheckFlight, nil, timer.getTime() + interval)
    end

    timer.scheduleFunction(CheckFlight, nil, timer.getTime() + interval)
end

-- Monitor standard callsigns
RegisterAutoSupportRespawn("Texaco 1-1", 90)
RegisterAutoSupportRespawn("Arco 1-1", 90)
RegisterAutoSupportRespawn("Magic 1-1", 120)
env.info("Support Engine: Permanent respawn loops registered.")
`,
  },
  {
    id: 'serverWatchdog',
    name: 'Server Watchdog & Pravidelné zprávy',
    shortName: 'Server Watchdog',
    tagline: 'Periodická hlášení pro hráče (uptime, pravidla, discord)',
    description: 'Pravidelně každých 15 minut vysílá informační zprávy všem připojeným hráčům na serveru (čas běhu mise, instrukce pro F10 mapu a záchranné frekvence).',
    category: 'utility',
    version: 'v1.1',
    iconName: 'MessageSquare',
    fileName: 'server_watchdog.lua',
    triggerName: '[FRAMEWORK] 06 - Server Watchdog Broadcast',
    triggerSeconds: 5,
    getLuaContent: () => `-- ==============================================================================
-- DEDICATED SERVER WATCHDOG & RECURRENT BROADCASTS
-- ==============================================================================

local ServerState = {
    interval = 900, -- 15 minutes
    serverName = "DCS MULTIPLAYER SERVER",
    uptimeSeconds = 0,
}

local function PeriodicAnnounce()
    ServerState.uptimeSeconds = ServerState.uptimeSeconds + ServerState.interval
    local minutes = math.floor(ServerState.uptimeSeconds / 60)
    local msg = string.format(">>> %s | Běh serveru: %d min | Otevřete F10 mapu pro aktuální úkoly <<<", ServerState.serverName, minutes)
    trigger.action.outText(msg, 15)
    
    timer.scheduleFunction(PeriodicAnnounce, nil, timer.getTime() + ServerState.interval)
end

timer.scheduleFunction(PeriodicAnnounce, nil, timer.getTime() + 60)
env.info("Server Watchdog: Periodic broadcasts registered.")
`,
  },
  {
    id: 'olympus',
    name: 'DCS Olympus Live Sync Connector',
    shortName: 'DCS Olympus',
    tagline: 'Živý webový taktický dispečink a Game Master',
    description: 'Propojuje misi s populárním systémem DCS Olympus, který umožňuje velitelům na webové mapě v reálném čase sledovat bojiště a zadávat úkoly jednotkám.',
    category: 'utility',
    version: 'v1.0',
    iconName: 'Globe',
    fileName: 'olympus_hook.lua',
    triggerName: '[FRAMEWORK] 07 - DCS Olympus Live Connector',
    triggerSeconds: 2,
    getLuaContent: () => `-- ==============================================================================
-- DCS OLYMPUS LIVE SYNC CONNECTOR
-- ==============================================================================

env.info("DCS Olympus: Connecting live mission hooks...")
trigger.action.outText("DCS Olympus Live Sync: Online", 5)
`,
  },
];

/**
 * Checks if a framework is currently enabled in the mission
 */
export function isFrameworkEnabled(id: FrameworkId, missionData: MissionData): boolean {
  const def = FRAMEWORK_DEFINITIONS.find((f) => f.id === id);
  if (!def) return false;

  // Checked by presence of file or presence of trigger
  const hasFile = missionData.scriptFiles.some((f) => f.name.toLowerCase() === def.fileName.toLowerCase());
  const hasTrigger = missionData.triggers.some((t) => t.name.includes(def.shortName) || t.actions.some((a) => a.file === def.fileName));

  return hasFile || hasTrigger;
}

/**
 * Enables a framework: adds .lua file to scriptFiles and adds MISSION START trigger
 */
export function enableFramework(id: FrameworkId, missionData: MissionData): MissionData {
  const def = FRAMEWORK_DEFINITIONS.find((f) => f.id === id);
  if (!def) return missionData;

  let updatedMission = { ...missionData };

  // 1. Auto-enable dependencies (e.g. MOOSE for Airboss/CSAR)
  if (def.dependencies) {
    for (const depId of def.dependencies) {
      if (!isFrameworkEnabled(depId, updatedMission)) {
        updatedMission = enableFramework(depId, updatedMission);
      }
    }
  }

  // 2. Ensure script file exists
  let scriptFiles = [...updatedMission.scriptFiles];
  const fileExists = scriptFiles.some((f) => f.name.toLowerCase() === def.fileName.toLowerCase());
  if (!fileExists) {
    const newFile: MissionScriptFile = {
      name: def.fileName,
      content: def.getLuaContent(updatedMission),
    };
    scriptFiles.push(newFile);
  }

  // 3. Ensure trigger exists
  let triggers = [...updatedMission.triggers];
  const triggerExists = triggers.some(
    (t) => t.name.includes(def.shortName) || t.actions.some((a) => a.file === def.fileName)
  );

  if (!triggerExists) {
    const newTrigger: MissionTrigger = {
      id: `trig_framework_${def.id}_${Date.now()}`,
      name: def.triggerName,
      type: 'MISSION START',
      event: 'NONE',
      enabled: true,
      conditions: [
        {
          id: `cond_${def.id}`,
          type: 'TIME_MORE',
          seconds: def.triggerSeconds,
        },
      ],
      actions: [
        {
          id: `act_${def.id}`,
          type: 'DO_SCRIPT_FILE',
          file: def.fileName,
        },
      ],
    };
    triggers.push(newTrigger);
  }

  return {
    ...updatedMission,
    scriptFiles,
    triggers,
  };
}

/**
 * Disables a framework: removes .lua file and triggers
 */
export function disableFramework(id: FrameworkId, missionData: MissionData): MissionData {
  const def = FRAMEWORK_DEFINITIONS.find((f) => f.id === id);
  if (!def) return missionData;

  // Filter out file
  const scriptFiles = missionData.scriptFiles.filter(
    (f) => f.name.toLowerCase() !== def.fileName.toLowerCase()
  );

  // Filter out triggers
  const triggers = missionData.triggers.filter(
    (t) => !(t.name.includes(def.shortName) || t.actions.some((a) => a.file === def.fileName))
  );

  return {
    ...missionData,
    scriptFiles,
    triggers,
  };
}

/**
 * Returns number of active frameworks in the mission
 */
export function getActiveFrameworksCount(missionData: MissionData): number {
  return FRAMEWORK_DEFINITIONS.filter((def) => isFrameworkEnabled(def.id, missionData)).length;
}
