import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { MissionData, Group, TriggerZone, CoalitionType } from '../types/dcs';
import {
  getTheaterConfig,
  latLonToDcs,
  dcsToLatLon,
  calculateDistance,
  calculateBearing,
  formatDdm,
  formatMgrs,
  formatBullseye,
} from '../utils/coordinates';
import { DCS_CATALOG } from '../data/dcsCatalog';
import {
  Layers,
  Crosshair,
  Plane,
  Shield,
  CircleDot,
  Plus,
  Navigation,
  Key,
  Ruler,
  Zap,
  FileText,
  Copy,
  Check,
  Compass,
} from 'lucide-react';

interface TacticalMapProps {
  missionData: MissionData;
  selectedGroup: Group | null;
  selectedZone: TriggerZone | null;
  selectedWaypointId: number | null;
  addMode: 'none' | 'addBlue' | 'addRed' | 'addZone' | 'addWp' | 'placeSam' | 'placeSupport' | 'placeCarrier';
  onSetAddMode: (mode: 'none' | 'addBlue' | 'addRed' | 'addZone' | 'addWp' | 'placeSam' | 'placeSupport' | 'placeCarrier') => void;
  onSelectGroup: (group: Group | null) => void;
  onSelectZone: (zone: TriggerZone | null) => void;
  onSelectWaypoint: (wpId: number | null) => void;
  onUpdateGroup: (group: Group) => void;
  onUpdateZone: (zone: TriggerZone) => void;
  onAddGroup: (lat: number, lon: number, coalition: CoalitionType) => void;
  onAddZone: (lat: number, lon: number) => void;
  onAddWaypoint: (groupId: number, lat: number, lon: number) => void;
  onPlaceSamBattery?: (lat: number, lon: number) => void;
  onPlaceSupportFlight?: (lat: number, lon: number) => void;
  onPlaceCarrierGroup?: (lat: number, lon: number) => void;
  onOpenKneeboard?: () => void;
  onOpenSpawner?: () => void;
  panToCoordinates?: { lat: number; lon: number; ts: number } | null;
}

type MapTileLayerType = 'satellite' | 'satellite_pure' | 'dark' | 'voyager' | 'topo';

export const TacticalMap: React.FC<TacticalMapProps> = ({
  missionData,
  selectedGroup,
  selectedZone,
  selectedWaypointId,
  addMode,
  onSetAddMode,
  onSelectGroup,
  onSelectZone,
  onSelectWaypoint,
  onUpdateGroup,
  onUpdateZone,
  onAddGroup,
  onAddZone,
  onAddWaypoint,
  onPlaceSamBattery,
  onPlaceSupportFlight,
  onPlaceCarrierGroup,
  onOpenKneeboard,
  onOpenSpawner,
  panToCoordinates,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const rulerLayerRef = useRef<L.LayerGroup | null>(null);

  const [cartoApiKey, setCartoApiKey] = useState<string>(() => {
    return localStorage.getItem('dcs_carto_key') || 'cb1_330x_1_ffa23c299bbe502ba07a7c8a';
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(cartoApiKey);

  const [tileType, setTileType] = useState<MapTileLayerType>('satellite');
  const [showAirbases, setShowAirbases] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showThreatRings, setShowThreatRings] = useState(true);
  const theaterConfig = getTheaterConfig(missionData.theatre);

  // Live Cursor Coordinates & Copy
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number }>({
    lat: theaterConfig.defaultCenter[0],
    lon: theaterConfig.defaultCenter[1],
  });
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Tactical Ruler Tool State
  const [rulerActive, setRulerActive] = useState(false);
  const [rulerStart, setRulerStart] = useState<{ lat: number; lon: number } | null>(null);
  const [rulerEnd, setRulerEnd] = useState<{ lat: number; lon: number } | null>(null);
  const [rulerHover, setRulerHover] = useState<{ lat: number; lon: number } | null>(null);

  const rulerActiveRef = useRef(rulerActive);
  rulerActiveRef.current = rulerActive;

  const rulerStartRef = useRef(rulerStart);
  rulerStartRef.current = rulerStart;

  const rulerEndRef = useRef(rulerEnd);
  rulerEndRef.current = rulerEnd;

  const handleRulerClick = (lat: number, lon: number) => {
    if (!rulerStartRef.current) {
      setRulerStart({ lat, lon });
      setRulerHover(null);
    } else if (!rulerEndRef.current) {
      setRulerEnd({ lat, lon });
      setRulerHover(null);
    } else {
      setRulerStart({ lat, lon });
      setRulerEnd(null);
      setRulerHover(null);
    }
  };

  // Tile layer URLs
  const getTileUrl = (type: MapTileLayerType) => {
    switch (type) {
      case 'satellite':
        return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      case 'satellite_pure':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'voyager':
        return `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`;
      case 'topo':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'dark':
      default:
        return `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`;
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: theaterConfig.defaultCenter,
      zoom: theaterConfig.defaultZoom,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const baseTile = L.tileLayer(getTileUrl(tileType), {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = baseTile;

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;

    const rulerGroup = L.layerGroup().addTo(map);
    rulerLayerRef.current = rulerGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when tileType or cartoApiKey changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getTileUrl(tileType));
  }, [tileType, cartoApiKey]);

  // Update map view when theater changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(theaterConfig.defaultCenter, theaterConfig.defaultZoom);
  }, [missionData.theatre]);

  // Pan to requested coordinates
  useEffect(() => {
    if (!panToCoordinates || !mapInstanceRef.current) return;
    mapInstanceRef.current.panTo([panToCoordinates.lat, panToCoordinates.lon], {
      animate: true,
      duration: 0.5,
    });
  }, [panToCoordinates]);

  // Handle map mouse move & clicks
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      setCursorCoords({ lat: e.latlng.lat, lon: e.latlng.lng });
      if (rulerActive && rulerStart && !rulerEnd) {
        setRulerHover({ lat: e.latlng.lat, lon: e.latlng.lng });
      }
    };

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (rulerActive) {
        handleRulerClick(lat, lng);
        return;
      }

      if (addMode === 'placeSam') {
        onPlaceSamBattery?.(lat, lng);
        onSetAddMode('none');
      } else if (addMode === 'placeSupport') {
        onPlaceSupportFlight?.(lat, lng);
        onSetAddMode('none');
      } else if (addMode === 'placeCarrier') {
        onPlaceCarrierGroup?.(lat, lng);
        onSetAddMode('none');
      } else if (addMode === 'addBlue') {
        onAddGroup(lat, lng, 'blue');
        onSetAddMode('none');
      } else if (addMode === 'addRed') {
        onAddGroup(lat, lng, 'red');
        onSetAddMode('none');
      } else if (addMode === 'addZone') {
        onAddZone(lat, lng);
        onSetAddMode('none');
      } else if (addMode === 'addWp' && selectedGroup) {
        onAddWaypoint(selectedGroup.groupId, lat, lng);
      } else {
        onSelectGroup(null);
        onSelectZone(null);
        onSelectWaypoint(null);
      }
    };

    map.on('mousemove', handleMouseMove);
    map.on('click', handleClick);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('click', handleClick);
    };
  }, [
    addMode,
    selectedGroup,
    rulerActive,
    rulerStart,
    rulerEnd,
    onAddGroup,
    onAddZone,
    onAddWaypoint,
    onPlaceSamBattery,
    onPlaceSupportFlight,
    onPlaceCarrierGroup,
    onSelectGroup,
    onSelectZone,
    onSelectWaypoint,
    onSetAddMode,
  ]);

  // Render Ruler Layer
  useEffect(() => {
    const rLayer = rulerLayerRef.current;
    if (!rLayer) return;

    rLayer.clearLayers();
    if (!rulerActive || !rulerStart) return;

    const target = rulerEnd || rulerHover;

    // Draw Start Point
    const startIcon = L.divIcon({
      className: 'ruler-start-marker',
      html: `
        <div style="
          width: 14px;
          height: 14px;
          background: #f59e0b;
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 10px #f59e0b;
        "></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    L.marker([rulerStart.lat, rulerStart.lon], { icon: startIcon }).addTo(rLayer);

    if (target) {
      // Draw Line
      L.polyline(
        [
          [rulerStart.lat, rulerStart.lon],
          [target.lat, target.lon],
        ],
        {
          color: '#f59e0b',
          weight: 2.5,
          dashArray: '6, 6',
          opacity: 0.95,
        }
      ).addTo(rLayer);

      // Draw Target Point
      const endIcon = L.divIcon({
        className: 'ruler-end-marker',
        html: `
          <div style="
            width: 14px;
            height: 14px;
            background: #38bdf8;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 10px #38bdf8;
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([target.lat, target.lon], { icon: endIcon }).addTo(rLayer);
    }
  }, [rulerActive, rulerStart, rulerEnd, rulerHover]);

  // Render Map Objects (Airbases, Zones, Groups, Routes, Threat Rings)
  useEffect(() => {
    const layer = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map) return;

    layer.clearLayers();

    // 1. Airbases
    if (showAirbases) {
      theaterConfig.airbases.forEach((ab) => {
        if (!isFinite(ab.lat) || !isFinite(ab.lon)) return;

        const abIcon = L.divIcon({
          className: 'custom-airbase-marker',
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 26px;
              height: 26px;
              background: rgba(15, 23, 42, 0.85);
              border: 1.5px solid #38bdf8;
              border-radius: 50%;
              box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
              color: #38bdf8;
              cursor: pointer;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17"/>
              </svg>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([ab.lat, ab.lon], { icon: abIcon }).addTo(layer);

        const popupContent = `
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4; color: #f8fafc; min-width: 170px;">
            <div style="font-weight: 700; color: #38bdf8; font-size: 14px; margin-bottom: 4px;">${ab.name}</div>
            <div style="color: #94a3b8;">Dráha: <span style="color: #f1f5f9;">${ab.runway}</span></div>
            ${ab.tacan ? `<div style="color: #94a3b8;">TACAN: <span style="color: #38bdf8; font-weight: bold;">${ab.tacan}</span></div>` : ''}
            ${ab.ils ? `<div style="color: #94a3b8;">ILS: <span style="color: #4ade80;">${ab.ils} MHz</span></div>` : ''}
            <div style="color: #94a3b8;">Nadmořská výška: <span style="color: #f1f5f9;">${ab.elevation} m</span></div>
            <div style="margin-top: 8px; border-top: 1px solid #334155; padding-top: 6px;">
              <button id="spawn-blue-${ab.id}" style="
                width: 100%;
                background: #0284c7;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 11px;
                cursor: pointer;
                font-weight: 600;
              ">
                + Vytvořit modrou letku zde
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { className: 'tactical-popup' });
        marker.on('click', (e) => {
          if (rulerActiveRef.current) {
            L.DomEvent.stopPropagation(e);
            marker.closePopup();
            handleRulerClick(ab.lat, ab.lon);
          }
        });
        marker.on('popupopen', () => {
          const btn = document.getElementById(`spawn-blue-${ab.id}`);
          if (btn) {
            btn.onclick = () => {
              onAddGroup(ab.lat, ab.lon, 'blue');
              marker.closePopup();
            };
          }
        });
      });
    }

    // 2. Trigger Zones
    if (showZones) {
      (missionData.zones || []).forEach((zone) => {
        if (!isFinite(zone.lat) || !isFinite(zone.lon)) return;
        const isSelected = selectedZone?.zoneId === zone.zoneId;
        const r = Array.isArray(zone.color) ? Number(zone.color[0]) || 1 : Number((zone.color as any)?.[1] ?? (zone.color as any)?.r ?? 1);
        const g = Array.isArray(zone.color) ? Number(zone.color[1]) || 0.6 : Number((zone.color as any)?.[2] ?? (zone.color as any)?.g ?? 0.6);
        const b = Array.isArray(zone.color) ? Number(zone.color[2]) || 0.1 : Number((zone.color as any)?.[3] ?? (zone.color as any)?.b ?? 0.1);
        const a = Array.isArray(zone.color) ? Number(zone.color[3]) || 0.25 : Number((zone.color as any)?.[4] ?? (zone.color as any)?.a ?? 0.25);
        const colorHex = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a || 0.25})`;
        const borderColor = isSelected ? '#f59e0b' : `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;

        const circle = L.circle([zone.lat, zone.lon], {
          radius: Number(zone.radius) || 1000,
          color: borderColor,
          weight: isSelected ? 3 : 1.5,
          dashArray: isSelected ? '5, 5' : undefined,
          fillColor: colorHex,
          fillOpacity: Math.min(a * 1.5, 0.4),
        }).addTo(layer);

        circle.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (rulerActiveRef.current) {
            handleRulerClick(zone.lat, zone.lon);
            return;
          }
          onSelectZone(zone);
          onSelectGroup(null);
        });

        // Label in center
        const labelIcon = L.divIcon({
          className: 'zone-label',
          html: `
            <div style="
              transform: translate(-50%, -50%);
              background: rgba(15, 23, 42, 0.8);
              border: 1px solid ${borderColor};
              color: #e2e8f0;
              font-size: 11px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
              white-space: nowrap;
              pointer-events: none;
              box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            ">
              ${zone.name} (${Math.round(zone.radius / 1000)} km)
            </div>
          `,
          iconSize: [0, 0],
        });
        const zoneMarker = L.marker([zone.lat, zone.lon], {
          icon: labelIcon,
          draggable: isSelected,
        }).addTo(layer);

        if (isSelected) {
          zoneMarker.on('dragend', (e) => {
            const newPos = (e.target as L.Marker).getLatLng();
            const dcs = latLonToDcs(missionData.theatre, newPos.lat, newPos.lng);
            onUpdateZone({
              ...zone,
              lat: newPos.lat,
              lon: newPos.lng,
              x: dcs.x,
              y: dcs.y,
            });
          });
        }
      });
    }

    // 3. Groups, Units, Routes & Waypoints
    (missionData.groups || []).forEach((group) => {
      const isSelected = selectedGroup?.groupId === group.groupId;
      const isBlue = group.coalition === 'blue';
      const isRed = group.coalition === 'red';
      const coalColor = isBlue ? '#38bdf8' : isRed ? '#f87171' : '#a3e635';

      const points = group.route?.points || [];
      const units = group.units || [];

      // Route lines
      if (points.length > 1) {
        const routeLatLngs = points
          .filter((pt) => isFinite(pt.lat) && isFinite(pt.lon))
          .map((pt) => [pt.lat, pt.lon] as [number, number]);
        if (routeLatLngs.length > 1) {
          L.polyline(routeLatLngs, {
            color: coalColor,
            weight: isSelected ? 3.5 : 2,
            opacity: isSelected ? 0.95 : 0.6,
            dashArray: isSelected ? '8, 4' : undefined,
          }).addTo(layer);
        }
      }

      // Waypoint markers
      points.forEach((wp, index) => {
        if (!isFinite(wp.lat) || !isFinite(wp.lon)) return;
        const isFirstWp = index === 0;
        const isSelectedWp = isSelected && (selectedWaypointId === wp.id || (!selectedWaypointId && index === 0));

        let legInfo = '';
        if (index > 0) {
          const prev = points[index - 1];
          const distM = calculateDistance(prev.lat, prev.lon, wp.lat, wp.lon);
          const brg = Math.round(calculateBearing(prev.lat, prev.lon, wp.lat, wp.lon));
          const nm = (distM / 1852).toFixed(1);
          const km = (distM / 1000).toFixed(1);
          legInfo = `
            <div style="border-top: 1px solid #334155; margin-top: 4px; padding-top: 4px; color: #94a3b8; font-size: 11px;">
              <div>Úsek od WP ${index}: <strong style="color: #f59e0b;">${nm} NM</strong> (${km} km)</div>
              <div>Kurz: <strong style="color: #38bdf8;">${brg.toString().padStart(3, '0')}°</strong></div>
            </div>
          `;
        }

        const altFt = Math.round(wp.alt * 3.28084);
        const spdKts = Math.round(wp.speed * 1.94384);
        const spdKmh = Math.round(wp.speed * 3.6);

        const wpIcon = L.divIcon({
          className: 'custom-wp-marker',
          html: `
            <div style="
              width: ${isSelectedWp ? '22px' : isFirstWp ? '18px' : '15px'};
              height: ${isSelectedWp ? '22px' : isFirstWp ? '18px' : '15px'};
              background: ${isSelectedWp ? '#f59e0b' : isSelected ? '#fbbf24' : coalColor};
              border: ${isSelectedWp ? '3px solid #ffffff' : '2px solid #0f172a'};
              border-radius: ${isFirstWp ? '50%' : '3px'};
              box-shadow: ${isSelectedWp ? '0 0 16px rgba(245, 158, 11, 1), 0 0 4px #000' : `0 0 6px ${coalColor}`};
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${isSelectedWp ? '11px' : '9px'};
              font-weight: 900;
              color: #0f172a;
              transition: all 0.15s ease;
            ">
              ${index + 1}
            </div>
          `,
          iconSize: isSelectedWp ? [22, 22] : [16, 16],
          iconAnchor: isSelectedWp ? [11, 11] : [8, 8],
        });

        const wpMarker = L.marker([wp.lat, wp.lon], {
          icon: wpIcon,
          draggable: isSelected,
          zIndexOffset: isSelectedWp ? 1000 : 100,
        }).addTo(layer);

        const wpPopup = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #f8fafc; min-width: 175px;">
            <div style="font-weight: 800; color: #f59e0b; font-size: 13px; margin-bottom: 2px;">
              ${wp.name || `Waypoint ${index + 1}`} <span style="font-size: 10px; color: #94a3b8; font-weight: normal;">(${group.name})</span>
            </div>
            <div style="color: #94a3b8; font-size: 11px;">Akce: <strong style="color: #38bdf8;">${wp.action}</strong></div>
            <div style="color: #94a3b8; font-size: 11px;">Výška: <strong style="color: #f1f5f9;">${Math.round(wp.alt)} m</strong> (${altFt.toLocaleString()} ft ${wp.alt_type || 'BARO'})</div>
            <div style="color: #94a3b8; font-size: 11px;">Rychlost: <strong style="color: #f1f5f9;">${spdKts} kts</strong> (${spdKmh} km/h)</div>
            ${legInfo}
          </div>
        `;
        wpMarker.bindPopup(wpPopup, { className: 'tactical-popup' });

        wpMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (rulerActiveRef.current) {
            handleRulerClick(wp.lat, wp.lon);
            return;
          }
          onSelectGroup(group);
          onSelectWaypoint(wp.id);
          onSelectZone(null);
        });

        if (isSelected) {
          wpMarker.on('dragend', (e) => {
            const newPos = (e.target as L.Marker).getLatLng();
            const dcs = latLonToDcs(missionData.theatre, newPos.lat, newPos.lng);
            const updatedPoints = points.map((p, idx) =>
              idx === index ? { ...p, lat: newPos.lat, lon: newPos.lng, x: dcs.x, y: dcs.y } : p
            );
            // If dragging WP 1, also move group lead unit
            let updatedUnits = units;
            if (isFirstWp && units.length > 0) {
              updatedUnits = units.map((u, uIdx) =>
                uIdx === 0 ? { ...u, lat: newPos.lat, lon: newPos.lng, x: dcs.x, y: dcs.y } : u
              );
            }
            onUpdateGroup({
              ...group,
              units: updatedUnits,
              route: { points: updatedPoints },
            });
            onSelectWaypoint(wp.id);
          });
        }
      });

      // Unit markers
      units.forEach((unit, uIdx) => {
        if (!isFinite(unit.lat) || !isFinite(unit.lon)) return;
        const catalogItem = DCS_CATALOG.find((item) => item.id === unit.type);
        const isClient = unit.skill === 'Client';
        const heading = Number(unit.heading) || 0;
        const headingDeg = (heading * 180) / Math.PI;

        // Threat ring for SAMs
        if (showThreatRings && catalogItem?.threatRadius) {
          L.circle([unit.lat, unit.lon], {
            radius: catalogItem.threatRadius,
            color: coalColor,
            weight: 1,
            dashArray: '4, 8',
            fillColor: coalColor,
            fillOpacity: 0.08,
          }).addTo(layer);
        }

        const isCarrier =
          unit.type.startsWith('CVN') ||
          unit.type === 'Stennis' ||
          unit.type === 'Forrestal' ||
          unit.type === 'LHA_Tarawa' ||
          unit.type === 'KUZNECOW';

        const isEscortShip =
          unit.type === 'TICONDEROG' ||
          unit.type === 'ArleighBurke' ||
          unit.type === 'PERRY' ||
          unit.type === 'MOSKVA' ||
          unit.type === 'PIOTR' ||
          unit.type === 'NEUSTRASH' ||
          unit.type === 'ALBATROS';

        const isRescueHeli = unit.type === 'SH-60B' || unit.name.includes('Pedro');

        // Draw Carrier BRC Recovery & Approach Line (12 NM along BRC)
        if (isCarrier) {
          const brcRad = heading;
          const cosBrc = Math.cos(brcRad);
          const sinBrc = Math.sin(brcRad);
          const grooveDistM = 12 * 1852;
          const carrierDcs = latLonToDcs(missionData.theatre, unit.lat, unit.lon);

          const grooveStartDcs = {
            x: carrierDcs.x - grooveDistM * cosBrc,
            y: carrierDcs.y - grooveDistM * sinBrc,
          };
          const grooveEndDcs = {
            x: carrierDcs.x + grooveDistM * cosBrc,
            y: carrierDcs.y + grooveDistM * sinBrc,
          };
          const grooveStart = dcsToLatLon(missionData.theatre, grooveStartDcs.x, grooveStartDcs.y);
          const grooveEnd = dcsToLatLon(missionData.theatre, grooveEndDcs.x, grooveEndDcs.y);

          L.polyline(
            [
              [grooveStart.lat, grooveStart.lon],
              [unit.lat, unit.lon],
              [grooveEnd.lat, grooveEnd.lon],
            ],
            {
              color: '#38bdf8',
              weight: 1.5,
              dashArray: '5, 5',
              opacity: 0.65,
            }
          ).addTo(layer);
        }

        let unitIconHtml = '';
        let iconSize: [number, number] = [32, 32];
        let iconAnchor: [number, number] = [16, 16];

        if (isCarrier) {
          iconSize = [44, 44];
          iconAnchor = [22, 22];
          unitIconHtml = `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; cursor: grab;">
              <div style="position: absolute; transform: rotate(${headingDeg}deg); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                  <path d="M21 2 L27 2 L30 14 L30 44 L18 44 L18 14 Z" fill="#0f172a" stroke="${isSelected ? '#f59e0b' : coalColor}" stroke-width="2.2" />
                  <path d="M18 18 L10 38 L14 42 L22 28 Z" fill="rgba(56, 189, 248, 0.45)" stroke="${isSelected ? '#f59e0b' : coalColor}" stroke-width="1.5" />
                  <rect x="27" y="24" width="3.5" height="9" fill="${isSelected ? '#f59e0b' : '#38bdf8'}" rx="1" />
                </svg>
              </div>
              <div style="position: absolute; bottom: -10px; background: rgba(15, 23, 42, 0.9); border: 1px solid ${isSelected ? '#f59e0b' : coalColor}; border-radius: 4px; padding: 1px 4px; font-size: 9px; font-weight: 800; color: ${isSelected ? '#f59e0b' : '#38bdf8'}; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.6);">
                ⚓ ${unit.name.split('#')[0].replace('USS', '').trim()}
              </div>
            </div>
          `;
        } else if (isEscortShip) {
          iconSize = [34, 34];
          iconAnchor = [17, 17];
          unitIconHtml = `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; cursor: grab;">
              <div style="position: absolute; transform: rotate(${headingDeg}deg); width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <path d="M16 2 L20 10 L19 28 L13 28 L12 10 Z" fill="#0f172a" stroke="${isSelected ? '#f59e0b' : coalColor}" stroke-width="2" />
                  <rect x="14" y="14" width="4" height="6" fill="${isSelected ? '#f59e0b' : coalColor}" rx="1" />
                </svg>
              </div>
              <div style="position: absolute; bottom: -8px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.15); border-radius: 3px; padding: 1px 3px; font-size: 9px; white-space: nowrap; color: #cbd5e1;">
                ${unit.name.split('#')[0].trim()}
              </div>
            </div>
          `;
        } else if (isRescueHeli) {
          iconSize = [32, 32];
          iconAnchor = [16, 16];
          unitIconHtml = `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; cursor: grab;">
              <div style="position: absolute; transform: rotate(${headingDeg}deg); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                <div style="width: 20px; height: 2px; background: #38bdf8; position: absolute;"></div>
                <div style="width: 2px; height: 20px; background: #38bdf8; position: absolute;"></div>
              </div>
              <div style="width: 18px; height: 18px; background: #0284c7; border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 9px; box-shadow: 0 0 8px rgba(56, 189, 248, 0.8);">
                P
              </div>
              <div style="position: absolute; bottom: -10px; background: rgba(15, 23, 42, 0.9); border: 1px solid #38bdf8; border-radius: 3px; padding: 1px 3px; font-size: 9px; white-space: nowrap; color: #38bdf8;">
                Pedro (SAR)
              </div>
            </div>
          `;
        } else {
          unitIconHtml = `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              cursor: grab;
            ">
              <!-- Heading arrow -->
              <div style="
                position: absolute;
                transform: rotate(${headingDeg}deg);
                width: 32px;
                height: 32px;
                display: flex;
                align-items: flex-start;
                justify-content: center;
              ">
                <div style="
                  width: 0;
                  height: 0;
                  border-left: 5px solid transparent;
                  border-right: 5px solid transparent;
                  border-bottom: 8px solid ${coalColor};
                  margin-top: -4px;
                "></div>
              </div>

              <!-- Main unit dot / badge -->
              <div style="
                width: 22px;
                height: 22px;
                background: ${isSelected ? '#f59e0b' : coalColor};
                border: 2px solid #0f172a;
                border-radius: 50%;
                box-shadow: 0 0 10px ${isSelected ? 'rgba(245, 158, 11, 0.8)' : coalColor};
                display: flex;
                align-items: center;
                justify-content: center;
                color: #0f172a;
                font-weight: 800;
                font-size: 10px;
              ">
                ${isClient ? 'C' : uIdx + 1}
              </div>

              <!-- Label -->
              <div style="
                position: absolute;
                top: 30px;
                background: rgba(15, 23, 42, 0.85);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 3px;
                padding: 1px 4px;
                font-size: 10px;
                white-space: nowrap;
                color: #e2e8f0;
                pointer-events: none;
              ">
                ${unit.name}
              </div>
            </div>
          `;
        }

        const unitIcon = L.divIcon({
          className: 'custom-unit-marker',
          html: unitIconHtml,
          iconSize,
          iconAnchor,
        });

        const unitMarker = L.marker([unit.lat, unit.lon], {
          icon: unitIcon,
          draggable: true,
        }).addTo(layer);

        // Carrier popup binding
        if (isCarrier) {
          const tacanTask = group.route?.points?.[0]?.task?.params?.tasks?.find(
            (t: any) => t.action?.id === 'ActivateBeacon'
          )?.action?.params;
          const iclsTask = group.route?.points?.[0]?.task?.params?.tasks?.find(
            (t: any) => t.action?.id === 'ActivateICLS'
          )?.action?.params;
          const link4Task = group.route?.points?.[0]?.task?.params?.tasks?.find(
            (t: any) => t.action?.id === 'ActivateLink4'
          )?.action?.params;

          const tacanInfo = tacanTask ? `${tacanTask.channel}${tacanTask.modeChannel} (${tacanTask.callsign})` : 'N/A';
          const iclsInfo = iclsTask ? `Kanál ${iclsTask.channel}` : 'N/A';
          const link4Info = link4Task ? `${(link4Task.frequency / 1e6).toFixed(1)} MHz` : 'N/A';
          const atcInfo = unit.radio?.frequency ? `${(unit.radio.frequency / 1e6).toFixed(3)} MHz` : '127.500 MHz';
          const brcInfo = `${Math.round(headingDeg)}°`;
          const spdKts = Math.round((unit.speed || 12.86) * 1.94384);

          const carrierPopup = `
            <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #f8fafc; min-width: 220px;">
              <div style="font-weight: 800; color: #38bdf8; font-size: 13px; margin-bottom: 2px;">⚓ ${unit.name}</div>
              <div style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 4px; padding: 2px 6px; font-size: 10px; color: #38bdf8; font-weight: bold; margin-bottom: 6px;">
                ★ DCS SUPERCARRIER READY
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 6px; background: rgba(15,23,42,0.6); padding: 4px; border-radius: 4px;">
                <div>TACAN: <strong style="color: #f59e0b;">${tacanInfo}</strong></div>
                <div>ICLS: <strong style="color: #4ade80;">${iclsInfo}</strong></div>
                <div>LINK 4: <strong style="color: #c084fc;">${link4Info}</strong></div>
                <div>TOWER: <strong style="color: #38bdf8;">${atcInfo}</strong></div>
                <div>BRC: <strong style="color: #f59e0b;">${brcInfo}</strong></div>
                <div>RYCHLOST: <strong style="color: #f8fafc;">${spdKts} kts</strong></div>
              </div>
              <div style="color: #94a3b8; font-size: 10px; margin-bottom: 6px;">
                Doprovodných plavidel ve svazu: <strong>${group.units.length - 1}</strong>
              </div>
              <div style="border-top: 1px solid #334155; padding-top: 6px;">
                <button id="spawn-f18-${unit.unitId}" style="width: 100%; background: #0284c7; color: white; border: none; border-radius: 4px; padding: 4px 6px; font-size: 10px; cursor: pointer; font-weight: bold;">
                  + Vytvořit slot pro F/A-18C na palubě
                </button>
              </div>
            </div>
          `;
          unitMarker.bindPopup(carrierPopup, { className: 'tactical-popup' });
          unitMarker.on('popupopen', () => {
            const btn = document.getElementById(`spawn-f18-${unit.unitId}`);
            if (btn) {
              btn.onclick = () => {
                onAddGroup(unit.lat, unit.lon, group.coalition);
                unitMarker.closePopup();
              };
            }
          });
        }

        unitMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (rulerActiveRef.current) {
            handleRulerClick(unit.lat, unit.lon);
            return;
          }
          onSelectGroup(group);
          onSelectZone(null);
        });

        unitMarker.on('dragend', (e) => {
          const newPos = (e.target as L.Marker).getLatLng();
          const dcs = latLonToDcs(missionData.theatre, newPos.lat, newPos.lng);
          const updatedUnits = units.map((u, idx) =>
            idx === uIdx ? { ...u, lat: newPos.lat, lon: newPos.lng, x: dcs.x, y: dcs.y } : u
          );

          // If lead unit moved, also adjust WP 1
          let updatedPoints = points;
          if (uIdx === 0 && points.length > 0) {
            updatedPoints = points.map((p, pIdx) =>
              pIdx === 0 ? { ...p, lat: newPos.lat, lon: newPos.lng, x: dcs.x, y: dcs.y } : p
            );
          }

          onUpdateGroup({
            ...group,
            units: updatedUnits,
            route: { points: updatedPoints },
          });
        });
      });
    });
  }, [
    missionData,
    selectedGroup,
    selectedZone,
    selectedWaypointId,
    showAirbases,
    showZones,
    showThreatRings,
    theaterConfig,
    onSelectGroup,
    onSelectZone,
    onSelectWaypoint,
    onUpdateGroup,
    onAddGroup,
  ]);

  // Handle Copy Coords
  const handleCopyCoords = () => {
    const ddm = formatDdm(cursorCoords.lat, cursorCoords.lon);
    const mgrs = formatMgrs(cursorCoords.lat, cursorCoords.lon);
    const bulls = formatBullseye(missionData.theatre, cursorCoords.lat, cursorCoords.lon).formatted;
    const text = `DDM: ${ddm}\nMGRS: ${mgrs}\n${bulls}\nWGS84: ${cursorCoords.lat.toFixed(5)}, ${cursorCoords.lon.toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Measuring Ruler Metrics Calculation
  let rulerMetrics: {
    distNM: string;
    distKm: string;
    bearing: number;
    recipBearing: number;
    ete350kts: string;
  } | null = null;

  const rulerTarget = rulerEnd || rulerHover;
  if (rulerStart && rulerTarget) {
    const dM = calculateDistance(rulerStart.lat, rulerStart.lon, rulerTarget.lat, rulerTarget.lon);
    const brg = Math.round(calculateBearing(rulerStart.lat, rulerStart.lon, rulerTarget.lat, rulerTarget.lon));
    const recip = (brg + 180) % 360;
    const nm = dM / 1852;
    const km = dM / 1000;
    const eteMin = Math.round((nm / 350) * 60);

    rulerMetrics = {
      distNM: nm.toFixed(1),
      distKm: km.toFixed(1),
      bearing: brg,
      recipBearing: recip,
      ete350kts: `~${eteMin} min @ 350 kts`,
    };
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-950 ${rulerActive ? 'ruler-active-cursor' : ''}`}>
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Tactical Map Controls Toolbar (Top Center) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 max-w-[95vw] pointer-events-none">
        {/* Layer & Overlay toggles */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-lg shadow-xl text-xs pointer-events-auto overflow-x-auto max-w-full">
          <div className="px-2 py-1 text-slate-400 font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Mapa</span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Map style buttons */}
          {[
            { id: 'satellite', label: 'Satelit (Hybrid)' },
            { id: 'satellite_pure', label: 'Satelit (Esri)' },
            { id: 'dark', label: 'Taktická (Dark)' },
            { id: 'voyager', label: 'Letecká' },
            { id: 'topo', label: 'Topomapa' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTileType(item.id as MapTileLayerType)}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                tileType === item.id
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Carto API Key modal button */}
          <button
            onClick={() => {
              setKeyInput(cartoApiKey);
              setShowKeyModal(true);
            }}
            title="Nastavit CartoDB API klíč"
            className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors ml-0.5"
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Airbases toggle */}
          <button
            onClick={() => setShowAirbases(!showAirbases)}
            title="Přepnout zobrazení letišť"
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              showAirbases ? 'text-sky-300 bg-sky-950/60 border border-sky-800/60' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Letiště</span>
          </button>

          {/* Zones toggle */}
          <button
            onClick={() => setShowZones(!showZones)}
            title="Přepnout zobrazení trigger zón"
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              showZones ? 'text-amber-300 bg-amber-950/60 border border-amber-800/60' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>Zóny</span>
          </button>

          {/* Threat rings toggle */}
          <button
            onClick={() => setShowThreatRings(!showThreatRings)}
            title="Přepnout zobrazení dosahu PVO/SAM"
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              showThreatRings ? 'text-red-300 bg-red-950/60 border border-red-800/60' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Dosah PVO</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Tactical Ruler Tool Button */}
          <button
            onClick={() => {
              setRulerActive(!rulerActive);
              setRulerStart(null);
              setRulerEnd(null);
              setRulerHover(null);
            }}
            title="Měřítko vzdáleností a kurzů (Klikněte na bod A a B na mapě)"
            className={`flex items-center gap-1 px-2 py-1 rounded transition-all font-semibold ${
              rulerActive
                ? 'bg-amber-500 text-slate-950 shadow ring-2 ring-amber-400/50'
                : 'text-amber-400 hover:bg-slate-800'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Pravítko</span>
          </button>
        </div>

        {/* Quick Add Actions Toolbar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-lg shadow-xl text-xs pointer-events-auto overflow-x-auto max-w-full">
          <div className="px-2 py-1 text-slate-400 font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vložit na mapu</span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => onSetAddMode(addMode === 'addBlue' ? 'none' : 'addBlue')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-medium ${
              addMode === 'addBlue'
                ? 'bg-sky-500 text-slate-950 ring-2 ring-sky-300 font-bold'
                : 'text-sky-400 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/50'
            }`}
          >
            <span>+ Modrá letka</span>
          </button>

          <button
            onClick={() => onSetAddMode(addMode === 'addRed' ? 'none' : 'addRed')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-medium ${
              addMode === 'addRed'
                ? 'bg-red-500 text-slate-950 ring-2 ring-red-300 font-bold'
                : 'text-red-400 bg-red-950/40 hover:bg-red-900/50 border border-red-800/50'
            }`}
          >
            <span>+ Červená letka</span>
          </button>

          <button
            onClick={() => onSetAddMode(addMode === 'addZone' ? 'none' : 'addZone')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-medium ${
              addMode === 'addZone'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-bold'
                : 'text-amber-400 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50'
            }`}
          >
            <span>+ Trigger zóna</span>
          </button>

          {/* 1-Click Tactical Spawner (SAMs & Tankers) */}
          {onOpenSpawner && (
            <button
              onClick={onOpenSpawner}
              title="Vložit celou baterii PVO (Patriot, S-300...) nebo Tanker / AWACS s vyčkávacím okruhem"
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-600/30 transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
              <span>1-Click Spawner (PVO & Tankery)</span>
            </button>
          )}

          {/* Cockpit Kneeboard Button */}
          {onOpenKneeboard && (
            <button
              onClick={onOpenKneeboard}
              title="Zobrazit a stáhnout taktické kneeboard karty pro kokpit v DCS"
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/40 font-bold shadow transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Kneeboardy</span>
            </button>
          )}

          {selectedGroup && (
            <button
              onClick={() => onSetAddMode(addMode === 'addWp' ? 'none' : 'addWp')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-medium ${
                addMode === 'addWp'
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 font-bold'
                  : 'text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>+ Přidat WP ({selectedGroup.name})</span>
            </button>
          )}

          {addMode !== 'none' && (
            <button
              onClick={() => onSetAddMode('none')}
              className="px-2 py-1 text-slate-400 hover:text-white bg-slate-800 rounded ml-1"
            >
              Zrušit
            </button>
          )}
        </div>

        {/* Action prompt if addMode or ruler is active */}
        {rulerActive && (
          <div className="bg-amber-950/90 border border-amber-500 text-amber-200 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xl flex items-center justify-between gap-4 pointer-events-auto backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-amber-400" />
              <span>
                {!rulerStart
                  ? 'Klikněte do mapy pro počátek měření (Bod A)'
                  : !rulerEnd
                  ? 'Pohybujte myší a klikněte pro uzamčení cílového bodu (Bod B)'
                  : 'Měření uzamčeno. Kliknutím začnete nové měření.'}
              </span>
            </div>

            {rulerMetrics && (
              <div className="flex items-center gap-3 font-mono bg-slate-950/80 px-2.5 py-1 rounded border border-amber-600/60 text-[11px]">
                <span>
                  Vzdálenost: <strong className="text-amber-300">{rulerMetrics.distNM} NM</strong> ({rulerMetrics.distKm} km)
                </span>
                <span>•</span>
                <span>
                  Kurz: <strong className="text-sky-300">{rulerMetrics.bearing.toString().padStart(3, '0')}°</strong> (Recip: {rulerMetrics.recipBearing.toString().padStart(3, '0')}°)
                </span>
                <span>•</span>
                <span className="text-slate-400">{rulerMetrics.ete350kts}</span>
              </div>
            )}

            <button
              onClick={() => {
                setRulerActive(false);
                setRulerStart(null);
                setRulerEnd(null);
                setRulerHover(null);
              }}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[11px] transition-colors"
            >
              Ukončit
            </button>
          </div>
        )}

        {addMode !== 'none' && !rulerActive && (
          <div className="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center justify-between gap-3 animate-pulse pointer-events-auto">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4" />
              <span>
                {addMode === 'addWp'
                  ? `Plánování trasy pro ${selectedGroup?.name}: Kliknutím do mapy umístíte další waypoint`
                  : addMode === 'placeSam'
                  ? 'Klikněte do mapy na místo pro umístění vybrané baterie PVO'
                  : addMode === 'placeCarrier'
                  ? 'Klikněte do moře / vodní plochy pro nasazení svazu letadlové lodi (Supercarrier CSG & Pedro)'
                  : addMode === 'placeSupport'
                  ? 'Klikněte do mapy pro ukotvení vyčkávacího okruhu tankeru / AWACS'
                  : 'Klikněte do mapy pro umístění objektu'}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetAddMode('none');
              }}
              className="bg-slate-950 text-white px-2 py-0.5 rounded text-[11px] hover:bg-slate-800"
            >
              Ukončit
            </button>
          </div>
        )}
      </div>

      {/* Map center reset button (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView(theaterConfig.defaultCenter, theaterConfig.defaultZoom);
            }
          }}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-lg backdrop-blur"
        >
          <Crosshair className="w-3.5 h-3.5 text-sky-400" />
          <span>Vycentrovat bojiště ({missionData.theatre})</span>
        </button>
      </div>

      {/* LIVE TACTICAL COORDINATE HUD (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-3.5 py-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-[11px] font-mono pointer-events-auto">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Crosshair className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-slate-400 font-bold uppercase text-[10px]">WGS84:</span>
          <span className="text-slate-100">{cursorCoords.lat.toFixed(4)}°, {cursorCoords.lon.toFixed(4)}°</span>
        </div>

        <div className="h-3 w-px bg-slate-700 hidden sm:block" />

        <div className="flex items-center gap-1.5 text-slate-300 hidden md:flex">
          <span className="text-amber-400 font-bold uppercase text-[10px]">DDM (UFC):</span>
          <span className="text-amber-200">{formatDdm(cursorCoords.lat, cursorCoords.lon)}</span>
        </div>

        <div className="h-3 w-px bg-slate-700 hidden md:block" />

        <div className="flex items-center gap-1.5 text-slate-300 hidden lg:flex">
          <span className="text-emerald-400 font-bold uppercase text-[10px]">MGRS:</span>
          <span className="text-emerald-200">{formatMgrs(cursorCoords.lat, cursorCoords.lon)}</span>
        </div>

        <div className="h-3 w-px bg-slate-700 hidden sm:block" />

        <div className="flex items-center gap-1.5 text-slate-300">
          <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-sky-300 font-bold">{formatBullseye(missionData.theatre, cursorCoords.lat, cursorCoords.lon).formatted}</span>
        </div>

        <button
          onClick={handleCopyCoords}
          title="Kopírovat souřadnice (MGRS & DDM) do schránky pro UFC"
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors ml-1"
        >
          {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Carto API Key Modal */}
      {showKeyModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Nastavení CartoDB API klíče</span>
              </span>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 block">
                Zadejte váš CartoDB API klíč pro načítání rastrových dlaždic:
              </label>
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="cb1_330x_1_..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-500">
                Klíč je uložen v prohlížeči (localStorage) a automaticky se přidává k dotazům pro vrstvy Taktická (Dark) a Letecká (Voyager).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Zrušit
              </button>
              <button
                onClick={() => {
                  const trimmed = keyInput.trim();
                  setCartoApiKey(trimmed);
                  localStorage.setItem('dcs_carto_key', trimmed);
                  setShowKeyModal(false);
                }}
                className="px-3 py-1.5 rounded text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow"
              >
                Uložit klíč
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
