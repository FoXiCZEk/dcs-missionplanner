import React, { useState } from 'react';
import type { Group, TriggerZone, CoalitionType } from '../types/dcs';
import { DCS_CATALOG } from '../data/dcsCatalog';
import {
  Users,
  Plane,
  CircleDot,
  Search,
  Crosshair,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Navigation,
  Anchor,
  Truck,
  Plus,
} from 'lucide-react';

interface UnitListSidebarProps {
  groups: Group[];
  zones: TriggerZone[];
  selectedGroup: Group | null;
  selectedZone: TriggerZone | null;
  onSelectGroup: (group: Group) => void;
  onSelectZone: (zone: TriggerZone) => void;
  onDeleteGroup: (groupId: number) => void;
  onFocusCoordinates: (lat: number, lon: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onStartAddGroup?: (coalition: CoalitionType) => void;
}

export const UnitListSidebar: React.FC<UnitListSidebarProps> = ({
  groups,
  zones,
  selectedGroup,
  selectedZone,
  onSelectGroup,
  onSelectZone,
  onDeleteGroup,
  onFocusCoordinates,
  isOpen,
  onToggleOpen,
  onStartAddGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [coalitionFilter, setCoalitionFilter] = useState<'all' | 'blue' | 'red' | 'zones'>('all');

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    if (coalitionFilter !== 'all' && coalitionFilter !== 'zones' && g.coalition !== coalitionFilter) {
      return false;
    }
    if (coalitionFilter === 'zones') return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (g.name || '').toLowerCase().includes(q);
    const unitMatch = (g.units || []).some(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.type || '').toLowerCase().includes(q) ||
        (u.callsign?.name && u.callsign.name.toLowerCase().includes(q))
    );
    return nameMatch || unitMatch;
  });

  // Filter zones
  const filteredZones = zones.filter((z) => {
    if (coalitionFilter !== 'all' && coalitionFilter !== 'zones') return false;
    if (!searchQuery) return true;
    return z.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'helicopter':
      case 'plane':
        return <Plane className="w-3.5 h-3.5" />;
      case 'ship':
        return <Anchor className="w-3.5 h-3.5" />;
      case 'vehicle':
      default:
        return <Truck className="w-3.5 h-3.5" />;
    }
  };

  const blueCount = groups.filter((g) => g.coalition === 'blue').length;
  const redCount = groups.filter((g) => g.coalition === 'red').length;

  return (
    <>
      {/* Collapsed Toggle Button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className="absolute top-16 left-4 z-20 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-2.5 py-2 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-bold backdrop-blur-md transition-all hover:border-sky-500"
          title="Zobrazit seznam jednotek a letek"
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>Seznam jednotek ({groups.length})</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      )}

      {/* Expanded Sidebar Drawer */}
      <div
        className={`absolute top-16 left-4 bottom-4 w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl flex flex-col z-20 overflow-hidden text-xs text-slate-300 transition-all duration-200 ${
          isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-3 border-b border-slate-700/80 bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-slate-100 text-sm">Seznam Jednotek ({groups.length})</span>
          </div>

          <button
            onClick={onToggleOpen}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title="Skrýt panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-2.5 border-b border-slate-800 space-y-2 bg-slate-900/50">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Hledat letku, letadlo, volačku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded pl-8 pr-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Coalition Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto text-[10px]">
            <button
              onClick={() => setCoalitionFilter('all')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                coalitionFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Vše ({groups.length})
            </button>
            <button
              onClick={() => setCoalitionFilter('blue')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                coalitionFilter === 'blue'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-sky-400 hover:bg-sky-950/40'
              }`}
            >
              Modrá ({blueCount})
            </button>
            <button
              onClick={() => setCoalitionFilter('red')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                coalitionFilter === 'red'
                  ? 'bg-red-500 text-slate-950'
                  : 'text-red-400 hover:bg-red-950/40'
              }`}
            >
              Červená ({redCount})
            </button>
            <button
              onClick={() => setCoalitionFilter('zones')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                coalitionFilter === 'zones'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-amber-400 hover:bg-amber-950/40'
              }`}
            >
              Zóny ({zones.length})
            </button>
          </div>
        </div>

        {/* Scrollable list of groups & zones */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {/* GROUPS */}
          {filteredGroups.map((group) => {
            const isSelected = selectedGroup?.groupId === group.groupId;
            const isBlue = group.coalition === 'blue';
            const isRed = group.coalition === 'red';
            const coalColor = isBlue ? '#38bdf8' : isRed ? '#f87171' : '#a3e635';

            const units = group.units || [];
            const leadUnit = units[0];
            const catalogItem = leadUnit ? DCS_CATALOG.find((c) => c.id === leadUnit.type) : null;
            const typeName = catalogItem?.name || leadUnit?.type || 'Neznámý letoun';
            const isClientSlot = units.some((u) => u.skill === 'Client');
            const wpCount = group.route?.points?.length || 0;

            return (
              <div
                key={group.groupId}
                onClick={() => {
                  onSelectGroup(group);
                  if (leadUnit) {
                    onFocusCoordinates(leadUnit.lat, leadUnit.lon);
                  }
                }}
                className={`p-2 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 group ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-400/80 shadow-md ring-1 ring-sky-400/30'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Header: Name, Coalition, and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: coalColor }}
                    />
                    <span className="font-bold text-slate-100 truncate">{group.name}</span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Focus on map */}
                    {leadUnit && (
                      <button
                        onClick={() => onFocusCoordinates(leadUnit.lat, leadUnit.lon)}
                        title="Vycentrovat na mapě"
                        className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded transition-colors"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteGroup(group.groupId)}
                      title="Smazat letku"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtitle: Type & Count */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 truncate text-slate-300">
                    {getCategoryIcon(group.category)}
                    <span className="truncate">
                      {group.units.length}x {typeName}
                    </span>
                  </span>

                  {isClientSlot && (
                    <span className="bg-amber-950/70 border border-amber-600/80 text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                      Client
                    </span>
                  )}
                </div>

                {/* Footer: Waypoints & Altitude */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-amber-400/90 font-semibold">
                    <Navigation className="w-3 h-3" />
                    <span>{wpCount} {wpCount === 1 ? 'Waypoint' : wpCount < 5 ? 'Waypointy' : 'Waypointů'}</span>
                  </span>

                  {leadUnit && (
                    <span>
                      {Math.round(leadUnit.alt * 3.28084).toLocaleString()} ft / {Math.round(leadUnit.alt)} m
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* TRIGGER ZONES */}
          {(coalitionFilter === 'all' || coalitionFilter === 'zones') && filteredZones.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1 flex items-center gap-1">
                <CircleDot className="w-3 h-3 text-amber-400" />
                <span>Trigger Zóny ({filteredZones.length})</span>
              </div>

              <div className="space-y-1">
                {filteredZones.map((zone) => {
                  const isSelected = selectedZone?.zoneId === zone.zoneId;
                  return (
                    <div
                      key={zone.zoneId}
                      onClick={() => {
                        onSelectZone(zone);
                        onFocusCoordinates(zone.lat, zone.lon);
                      }}
                      className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500 shadow-sm'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="font-semibold text-slate-200 truncate">{zone.name}</span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                        <span>{(zone.radius / 1000).toFixed(1)} km</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onFocusCoordinates(zone.lat, zone.lon);
                          }}
                          className="p-1 hover:text-white"
                          title="Vycentrovat na mapě"
                        >
                          <Crosshair className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredGroups.length === 0 && filteredZones.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p className="font-semibold">Nenalezeny žádné jednotky</p>
              <p className="text-[10px] mt-1 text-slate-600">Zkuste změnit vyhledávací dotaz nebo filtr.</p>
            </div>
          )}
        </div>

        {/* Bottom Quick Add Letka button */}
        {onStartAddGroup && (
          <div className="p-2 border-t border-slate-800 bg-slate-900/80 flex gap-2">
            <button
              onClick={() => onStartAddGroup('blue')}
              className="flex-1 py-1 px-2 rounded bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-800/60 flex items-center justify-center gap-1 text-[11px] font-bold transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>+ Modrá letka</span>
            </button>
            <button
              onClick={() => onStartAddGroup('red')}
              className="flex-1 py-1 px-2 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 flex items-center justify-center gap-1 text-[11px] font-bold transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>+ Červená letka</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
