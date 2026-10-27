import React, { useState, useRef } from 'react';
import type {
  MissionData,
  Theater,
  Group,
  TriggerZone,
  CoalitionType,
  Unit,
} from './types/dcs';
import {
  createDefaultMission,
  downloadMissionMiz,
  importMissionFromMiz,
} from './utils/mizManager';
import { THEATER_CONFIGS, latLonToDcs } from './utils/coordinates';
import { TacticalMap } from './components/TacticalMap';
import { UnitListSidebar } from './components/UnitListSidebar';
import { InspectorPanel } from './components/InspectorPanel';
import { TriggerEditor } from './components/TriggerEditor';
import { LuaScriptStudio } from './components/LuaScriptStudio';
import { MultiplayerSlots } from './components/MultiplayerSlots';
import { WeatherSettingsView } from './components/WeatherSettingsView';
import { TacticalSpawnerModal } from './components/TacticalSpawnerModal';
import { KneeboardModal } from './components/KneeboardModal';
import {
  createSamBatteryGroup,
  createSupportFlightGroup,
  createCarrierStrikeGroup,
  type SamBatteryTemplate,
  type SupportFlightTemplate,
  type CarrierGroupTemplate,
} from './data/dcsPresets';
import {
  Map,
  Zap,
  FileCode,
  Users,
  CloudSun,
  Download,
  Upload,
  RotateCcw,
  Globe2,
  CheckCircle,
  AlertCircle,
  Shield,
  Loader2,
  FileText,
} from 'lucide-react';

type ActiveViewTab = 'map' | 'triggers' | 'scripts' | 'slots' | 'weather';

export const App: React.FC = () => {
  const [missionData, setMissionData] = useState<MissionData>(() =>
    createDefaultMission('Caucasus')
  );

  const [activeTab, setActiveTab] = useState<ActiveViewTab>('map');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedZone, setSelectedZone] = useState<TriggerZone | null>(null);
  const [selectedWaypointId, setSelectedWaypointId] = useState<number | null>(null);
  const [addMode, setAddMode] = useState<
    'none' | 'addBlue' | 'addRed' | 'addZone' | 'addWp' | 'placeSam' | 'placeSupport' | 'placeCarrier'
  >('none');
  const [isKneeboardModalOpen, setIsKneeboardModalOpen] = useState(false);
  const [isSpawnerModalOpen, setIsSpawnerModalOpen] = useState(false);
  const [pendingSamTemplate, setPendingSamTemplate] = useState<SamBatteryTemplate | null>(null);
  const [pendingSupportTemplate, setPendingSupportTemplate] = useState<SupportFlightTemplate | null>(null);
  const [pendingCarrierTemplate, setPendingCarrierTemplate] = useState<CarrierGroupTemplate | null>(null);
  const [isUnitSidebarOpen, setIsUnitSidebarOpen] = useState(true);
  const [panToCoordinates, setPanToCoordinates] = useState<{ lat: number; lon: number; ts: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Theater Switch
  const handleSwitchTheater = (newTheater: Theater) => {
    if (newTheater === missionData.theatre) return;
    const confirmSwitch = window.confirm(
      `Přejete si přepnout mapu na ${newTheater}? Pro nové bojiště budou přizpůsobeny výchozí souřadnice a letiště.`
    );
    if (!confirmSwitch) return;

    const newMission = createDefaultMission(newTheater);
    newMission.title = `${missionData.title.replace(/(Caucasus|Syria)/i, '')} - ${newTheater}`;
    newMission.triggers = missionData.triggers;
    newMission.scriptFiles = missionData.scriptFiles;
    setMissionData(newMission);
    setSelectedGroup(null);
    setSelectedZone(null);
    showNotification('success', `Bojiště přepnuto na ${THEATER_CONFIGS[newTheater].displayName}`);
  };

  // Handle New Mission
  const handleNewMission = () => {
    if (window.confirm('Vytvořit novou čistou misi? Veškeré neuložené změny budou nahrazeny.')) {
      setMissionData(createDefaultMission(missionData.theatre));
      setSelectedGroup(null);
      setSelectedZone(null);
      showNotification('success', 'Byla vytvořena nová čistá mise.');
    }
  };

  // Handle Export .miz
  const handleExportMiz = async () => {
    try {
      setIsExporting(true);
      await downloadMissionMiz(missionData);
      showNotification('success', `Mise "${missionData.title}.miz" úspěšně vygenerována pro DCS server!`);
    } catch (err: any) {
      console.error(err);
      showNotification('error', `Chyba při exportu .miz: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Import .miz
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const imported = await importMissionFromMiz(file);
      setMissionData(imported);
      setSelectedGroup(null);
      setSelectedZone(null);
      showNotification(
        'success',
        `Mise "${file.name}" úspěšně načtena! Mapa: ${imported.theatre}, Skupin: ${imported.groups.length}`
      );
    } catch (err: any) {
      console.error(err);
      showNotification('error', `Chyba při načítání .miz souboru: ${err.message}`);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // Map Add Group
  const handleAddGroupOnMap = (lat: number, lon: number, coalition: CoalitionType) => {
    const dcs = latLonToDcs(missionData.theatre, lat, lon);
    const newGroupId = missionData.nextId.groupId;
    const newUnitId = missionData.nextId.unitId;

    const isBlue = coalition === 'blue';
    const groupName = `${isBlue ? 'Chevy' : '101'} ${newGroupId} (${isBlue ? 'F/A-18C' : 'Su-27'})`;

    const unit: Unit = {
      unitId: newUnitId,
      name: `${groupName} #1`,
      type: isBlue ? 'F/A-18C_hornet' : 'Su-27',
      skill: 'Client', // Multiplayer slot by default!
      heading: 1.57,
      x: dcs.x,
      y: dcs.y,
      lat,
      lon,
      alt: 2500,
      speed: 200,
      radio: {
        frequency: isBlue ? 305000000 : 124000000,
        modulation: 0,
      },
    };

    const newGroup: Group = {
      groupId: newGroupId,
      name: groupName,
      category: 'plane',
      coalition,
      countryId: isBlue ? 2 : 0,
      countryName: isBlue ? 'USA' : 'Russia',
      units: [unit],
      route: {
        points: [
          {
            id: 1,
            name: 'WP 1 - Ingress',
            lat,
            lon,
            x: dcs.x,
            y: dcs.y,
            alt: 2500,
            speed: 200,
            action: 'Turning Point',
            type: 'Turning Point',
          },
        ],
      },
    };

    setMissionData((prev) => ({
      ...prev,
      groups: [...prev.groups, newGroup],
      nextId: {
        ...prev.nextId,
        groupId: prev.nextId.groupId + 1,
        unitId: prev.nextId.unitId + 1,
      },
    }));

    setSelectedGroup(newGroup);
    setSelectedZone(null);
  };

  // Map Add Zone
  const handleAddZoneOnMap = (lat: number, lon: number) => {
    const dcs = latLonToDcs(missionData.theatre, lat, lon);
    const newZoneId = missionData.nextId.zoneId;

    const newZone: TriggerZone = {
      zoneId: newZoneId,
      name: `Trigger_Zone_${newZoneId}`,
      lat,
      lon,
      x: dcs.x,
      y: dcs.y,
      radius: 15000, // 15 km default
      color: [1, 0.6, 0.1, 0.25],
      type: 0,
    };

    setMissionData((prev) => ({
      ...prev,
      zones: [...prev.zones, newZone],
      nextId: {
        ...prev.nextId,
        zoneId: prev.nextId.zoneId + 1,
      },
    }));

    setSelectedZone(newZone);
    setSelectedGroup(null);
  };

  // Map Add Waypoint
  const handleAddWaypoint = (groupId: number, lat: number, lon: number) => {
    const dcs = latLonToDcs(missionData.theatre, lat, lon);
    setMissionData((prev) => {
      const updatedGroups = prev.groups.map((g) => {
        if (g.groupId !== groupId) return g;
        const newWpId = g.route.points.length + 1;
        const lastWp = g.route.points[g.route.points.length - 1];
        return {
          ...g,
          route: {
            points: [
              ...g.route.points,
              {
                id: newWpId,
                name: `WP ${newWpId}`,
                lat,
                lon,
                x: dcs.x,
                y: dcs.y,
                alt: lastWp ? lastWp.alt : 2500,
                alt_type: lastWp?.alt_type || 'BARO',
                speed: lastWp ? lastWp.speed : 220,
                action: 'Turning Point',
                type: 'Turning Point',
              },
            ],
          },
        };
      });

      const updated = updatedGroups.find((g) => g.groupId === groupId) || null;
      if (updated) {
        setSelectedGroup(updated);
        setSelectedWaypointId(updated.route.points.length);
      }

      return {
        ...prev,
        groups: updatedGroups,
      };
    });
  };

  // 1-Click SAM Battery Spawner
  const handleSelectSamTemplate = (template: SamBatteryTemplate) => {
    setPendingSamTemplate(template);
    setPendingSupportTemplate(null);
    setAddMode('placeSam');
    setIsSpawnerModalOpen(false);
    showNotification('success', `Klikněte do mapy na pozici, kam chcete umístit baterii ${template.name}.`);
  };

  // 1-Click Tanker & AWACS Orbit Spawner
  const handleSelectSupportTemplate = (template: SupportFlightTemplate) => {
    setPendingSupportTemplate(template);
    setPendingSamTemplate(null);
    setAddMode('placeSupport');
    setIsSpawnerModalOpen(false);
    showNotification('success', `Klikněte do mapy na kotevní bod pro vyčkávací okruh letounu ${template.name}.`);
  };

  // Map Placement for SAM Battery
  const handlePlaceSamBattery = (lat: number, lon: number) => {
    if (!pendingSamTemplate) return;
    const newGroup = createSamBatteryGroup(
      pendingSamTemplate,
      missionData.theatre,
      lat,
      lon,
      missionData.nextId.groupId,
      missionData.nextId.unitId
    );
    const unitsAdded = pendingSamTemplate.components.length;
    setMissionData((prev) => ({
      ...prev,
      groups: [...prev.groups, newGroup],
      nextId: {
        ...prev.nextId,
        groupId: prev.nextId.groupId + 1,
        unitId: prev.nextId.unitId + unitsAdded,
      },
    }));
    setSelectedGroup(newGroup);
    setSelectedZone(null);
    setSelectedWaypointId(null);
    setPendingSamTemplate(null);
    showNotification('success', `Baterie PVO "${newGroup.name}" (${unitsAdded} komponent) úspěšně nasazena do prostoru!`);
  };

  // Map Placement for Support Flight (Tanker/AWACS)
  const handlePlaceSupportFlight = (lat: number, lon: number) => {
    if (!pendingSupportTemplate) return;
    const newGroup = createSupportFlightGroup(
      pendingSupportTemplate,
      missionData.theatre,
      lat,
      lon,
      missionData.nextId.groupId,
      missionData.nextId.unitId
    );
    setMissionData((prev) => ({
      ...prev,
      groups: [...prev.groups, newGroup],
      nextId: {
        ...prev.nextId,
        groupId: prev.nextId.groupId + 1,
        unitId: prev.nextId.unitId + 1,
      },
    }));
    setSelectedGroup(newGroup);
    setSelectedZone(null);
    setSelectedWaypointId(1);
    setPendingSupportTemplate(null);
    const tacanStr = pendingSupportTemplate.tacan
      ? `TACAN ${pendingSupportTemplate.tacan.channel}${pendingSupportTemplate.tacan.mode}`
      : `${(pendingSupportTemplate.frequencyHz / 1e6).toFixed(3)} MHz`;
    showNotification(
      'success',
      `Podpůrný let ${pendingSupportTemplate.callsignName} (${pendingSupportTemplate.type}, ${tacanStr}) zahájil vyčkávací okruh!`
    );
  };

  // 1-Click Carrier Strike Group (CSG / Supercarrier) Spawner
  const handleSelectCarrierTemplate = (template: CarrierGroupTemplate) => {
    setPendingCarrierTemplate(template);
    setPendingSamTemplate(null);
    setPendingSupportTemplate(null);
    setAddMode('placeCarrier');
    setIsSpawnerModalOpen(false);
    showNotification(
      'success',
      `Klikněte do moře pro umístění svazu "${template.carrierName}". BRC kurz: ${template.defaultBrcDeg}°, rychlost: ${template.speedKnots} kts.`
    );
  };

  // Map Placement for Carrier Strike Group
  const handlePlaceCarrierGroup = (lat: number, lon: number) => {
    if (!pendingCarrierTemplate) return;

    // Align carrier BRC into the wind if ground wind > 1 m/s, otherwise default
    const groundWind = missionData.weather?.wind?.atGround;
    let brcDeg = pendingCarrierTemplate.defaultBrcDeg;
    if (groundWind && groundWind.speed > 1) {
      brcDeg = Math.round((groundWind.dir + 180) % 360);
    }

    const { carrierGroup, rescueHeliGroup, totalUnitsCount, totalGroupsCount } = createCarrierStrikeGroup(
      pendingCarrierTemplate,
      missionData.theatre,
      lat,
      lon,
      brcDeg,
      missionData.nextId.groupId,
      missionData.nextId.unitId
    );

    const newGroups = [carrierGroup];
    if (rescueHeliGroup) {
      newGroups.push(rescueHeliGroup);
    }

    setMissionData((prev) => ({
      ...prev,
      groups: [...prev.groups, ...newGroups],
      nextId: {
        ...prev.nextId,
        groupId: prev.nextId.groupId + totalGroupsCount,
        unitId: prev.nextId.unitId + totalUnitsCount,
      },
    }));

    setSelectedGroup(carrierGroup);
    setSelectedZone(null);
    setSelectedWaypointId(1);
    setPendingCarrierTemplate(null);

    const tacanStr = pendingCarrierTemplate.tacan.channel > 0
      ? `TACAN ${pendingCarrierTemplate.tacan.channel}${pendingCarrierTemplate.tacan.mode} (${pendingCarrierTemplate.tacan.callsign})`
      : 'Bez TACAN';
    const iclsStr = pendingCarrierTemplate.icls ? `, ICLS Ch ${pendingCarrierTemplate.icls.channel}` : '';
    const heliStr = rescueHeliGroup ? ' + vrtulník Pedro (Plane Guard)' : '';

    showNotification(
      'success',
      `Úderný svaz ${pendingCarrierTemplate.carrierName} (${carrierGroup.units.length} lodí${heliStr}) byl nasazen! ${tacanStr}${iclsStr}, BRC ${brcDeg}°.`
    );
  };

  // Update Group
  const handleUpdateGroup = (group: Group) => {
    setMissionData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.groupId === group.groupId ? group : g)),
    }));
    if (selectedGroup?.groupId === group.groupId) {
      setSelectedGroup(group);
    }
  };

  // Delete Group
  const handleDeleteGroup = (groupId: number) => {
    setMissionData((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.groupId !== groupId),
    }));
    if (selectedGroup?.groupId === groupId) {
      setSelectedGroup(null);
    }
  };

  // Update Zone
  const handleUpdateZone = (zone: TriggerZone) => {
    setMissionData((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => (z.zoneId === zone.zoneId ? zone : z)),
    }));
    if (selectedZone?.zoneId === zone.zoneId) {
      setSelectedZone(zone);
    }
  };

  // Delete Zone
  const handleDeleteZone = (zoneId: number) => {
    setMissionData((prev) => ({
      ...prev,
      zones: prev.zones.filter((z) => z.zoneId !== zoneId),
    }));
    if (selectedZone?.zoneId === zoneId) {
      setSelectedZone(null);
    }
  };

  const clientSlotsCount = missionData.groups.reduce(
    (acc, g) => acc + g.units.filter((u) => u.skill === 'Client' || u.skill === 'Player').length,
    0
  );

  return (
    <div className="flex flex-col h-[100dvh] w-[100dvw] bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Hidden file input for uploading .miz */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".miz,.zip"
        onChange={handleImportFileChange}
        className="hidden"
      />

      {/* TOP TACTICAL NAVIGATION BAR */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shadow-lg shadow-sky-500/10">
              <Shield className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-slate-100 text-sm font-mono">
                  DCS MISSION PLANNER
                </span>
                <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                  MP SERVER READY
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[200px] md:max-w-[320px]">
                {missionData.title}
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* THEATER SELECTOR (Caucasus vs Syria) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <Globe2 className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              onClick={() => handleSwitchTheater('Caucasus')}
              className={`px-2.5 py-1 rounded transition-colors font-semibold ${
                missionData.theatre === 'Caucasus'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kavkaz
            </button>
            <button
              onClick={() => handleSwitchTheater('Syria')}
              className={`px-2.5 py-1 rounded transition-colors font-semibold ${
                missionData.theatre === 'Syria'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sýrie
            </button>
          </div>
        </div>

        {/* VIEW NAVIGATION TABS */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-medium whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Taktická Mapa</span>
            <span className="text-[10px] opacity-75">({missionData.groups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('triggers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-medium whitespace-nowrap ${
              activeTab === 'triggers'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Triggery & Skripty</span>
            <span className="text-[10px] opacity-75">({missionData.triggers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-medium whitespace-nowrap ${
              activeTab === 'scripts'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Lua Studio</span>
            <span className="text-[10px] opacity-75">({missionData.scriptFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('slots')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-medium whitespace-nowrap ${
              activeTab === 'slots'
                ? 'bg-purple-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Multiplayer Sloty</span>
            <span className="text-[10px] opacity-75 font-mono">({clientSlotsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-medium whitespace-nowrap ${
              activeTab === 'weather'
                ? 'bg-indigo-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5" />
            <span>Počasí & Čas</span>
          </button>
        </nav>

        {/* Tactical Spawner & Kneeboard Quick Triggers */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setIsSpawnerModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold transition-colors"
            title="1-Click Spawner pro PVO baterie a Tanker / AWACS okruhy"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Taktický Spawner</span>
          </button>
          <button
            onClick={() => setIsKneeboardModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold transition-colors"
            title="Taktické letové karty do kokpitu DCS"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Kneeboardy</span>
          </button>
        </div>

        {/* FILE OPERATIONS (New, Import, Export) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNewMission}
            title="Vytvořit novou misi"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-slate-700 shadow-sm"
          >
            {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Nahrát .miz</span>
          </button>

          <button
            onClick={handleExportMiz}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-sky-600/30"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Exportovat .miz</span>
          </button>
        </div>
      </header>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div
          className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-200'
              : 'bg-red-950/90 border border-red-500 text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'map' && (
          <>
            <TacticalMap
              missionData={missionData}
              selectedGroup={selectedGroup}
              selectedZone={selectedZone}
              selectedWaypointId={selectedWaypointId}
              addMode={addMode}
              onSetAddMode={setAddMode}
              onSelectGroup={(g) => {
                setSelectedGroup(g);
                setSelectedZone(null);
                if (g && g.route.points.length > 0) {
                  setSelectedWaypointId(g.route.points[0].id);
                } else {
                  setSelectedWaypointId(null);
                }
              }}
              onSelectZone={(z) => {
                setSelectedZone(z);
                setSelectedGroup(null);
                setSelectedWaypointId(null);
              }}
              onSelectWaypoint={setSelectedWaypointId}
              onUpdateGroup={handleUpdateGroup}
              onUpdateZone={handleUpdateZone}
              onAddGroup={handleAddGroupOnMap}
              onAddZone={handleAddZoneOnMap}
              onAddWaypoint={handleAddWaypoint}
              onPlaceSamBattery={handlePlaceSamBattery}
              onPlaceSupportFlight={handlePlaceSupportFlight}
              onPlaceCarrierGroup={handlePlaceCarrierGroup}
              onOpenKneeboard={() => setIsKneeboardModalOpen(true)}
              onOpenSpawner={() => setIsSpawnerModalOpen(true)}
              panToCoordinates={panToCoordinates}
            />

            {/* Left Outliner: Unit & Group Hierarchy List */}
            <UnitListSidebar
              groups={missionData.groups}
              zones={missionData.zones}
              selectedGroup={selectedGroup}
              selectedZone={selectedZone}
              onSelectGroup={(g) => {
                setSelectedGroup(g);
                setSelectedZone(null);
                if (g && g.route.points.length > 0) {
                  setSelectedWaypointId(g.route.points[0].id);
                } else {
                  setSelectedWaypointId(null);
                }
              }}
              onSelectZone={(z) => {
                setSelectedZone(z);
                setSelectedGroup(null);
                setSelectedWaypointId(null);
              }}
              onDeleteGroup={handleDeleteGroup}
              onFocusCoordinates={(lat, lon) => setPanToCoordinates({ lat, lon, ts: Date.now() })}
              isOpen={isUnitSidebarOpen}
              onToggleOpen={() => setIsUnitSidebarOpen(!isUnitSidebarOpen)}
              onStartAddGroup={(coal) => {
                setSelectedGroup(null);
                setSelectedZone(null);
                setSelectedWaypointId(null);
                setAddMode(coal === 'blue' ? 'addBlue' : 'addRed');
              }}
            />

            {/* Right Panel: Floating Inspector Panel for Group/Zone editing */}
            <InspectorPanel
              selectedGroup={selectedGroup}
              selectedZone={selectedZone}
              selectedWaypointId={selectedWaypointId}
              onSelectWaypoint={setSelectedWaypointId}
              onStartAddWaypointMode={() => setAddMode('addWp')}
              onClose={() => {
                setSelectedGroup(null);
                setSelectedZone(null);
                setSelectedWaypointId(null);
              }}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
              onUpdateZone={handleUpdateZone}
              onDeleteZone={handleDeleteZone}
            />
          </>
        )}

        {activeTab === 'triggers' && (
          <TriggerEditor
            missionData={missionData}
            onUpdateTriggers={(triggers) => setMissionData((prev) => ({ ...prev, triggers }))}
          />
        )}

        {activeTab === 'scripts' && (
          <LuaScriptStudio
            missionData={missionData}
            onUpdateScriptFiles={(scriptFiles) => setMissionData((prev) => ({ ...prev, scriptFiles }))}
          />
        )}

        {activeTab === 'slots' && (
          <MultiplayerSlots
            missionData={missionData}
            onUpdateMissionData={setMissionData}
          />
        )}

        {activeTab === 'weather' && (
          <WeatherSettingsView
            missionData={missionData}
            onUpdateMissionData={setMissionData}
          />
        )}
      </main>

      {/* TACTICAL SPAWNER MODAL */}
      <TacticalSpawnerModal
        isOpen={isSpawnerModalOpen}
        onClose={() => setIsSpawnerModalOpen(false)}
        onSelectSamTemplate={handleSelectSamTemplate}
        onSelectSupportTemplate={handleSelectSupportTemplate}
        onSelectCarrierTemplate={handleSelectCarrierTemplate}
      />

      {/* KNEEBOARD PREVIEW & EXPORT MODAL */}
      <KneeboardModal
        isOpen={isKneeboardModalOpen}
        onClose={() => setIsKneeboardModalOpen(false)}
        missionData={missionData}
        selectedGroup={selectedGroup}
      />
    </div>
  );
};

export default App;
