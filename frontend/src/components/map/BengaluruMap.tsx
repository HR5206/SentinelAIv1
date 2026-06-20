'use client';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Station, RiskZone, Incident } from '@/lib/api';

/**
 * BengaluruMap — Mapbox GL JS implementation.
 * Style: light-v11 (professional, NOT satellite, NOT dark/cyber)
 * PROHIBITED: neon, glow, bright heatmaps, animated particles
 *
 * Layers (all toggleable):
 * - Station markers (color-coded by readiness)
 * - Incident pins (color-coded by priority, clustered)
 * - Heatmap (risk zones, muted amber/red)
 * - Risk zone polygons
 * - Dispatch route line
 *
 * Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local
 */

function createStationMarker(readinessScore: number): HTMLElement {
  const color =
    readinessScore > 70  ? '#16A34A' :
    readinessScore >= 40 ? '#EA580C' :
    '#DC2626';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  `;

  // Soft radius ring
  const ring = document.createElement('div');
  ring.style.cssText = `
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: ${color};
    opacity: 0.15;
  `;

  // Circle pin body — stations use circle, not teardrop
  const pin = document.createElement('div');
  pin.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Outer circle -->
      <circle cx="11" cy="11" r="11" fill="${color}" />
      <!-- White ring inside -->
      <circle cx="11" cy="11" r="7" fill="white" opacity="0.25" />
      <!-- Center dot -->
      <circle cx="11" cy="11" r="4" fill="white" />
    </svg>
  `;
  pin.style.cssText = `
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.30));
    line-height: 0;
  `;

  wrapper.appendChild(ring);
  wrapper.appendChild(pin);
  return wrapper;
}

const PRIORITY_COLORS: Record<string, string> = {
  P1: '#DC2626',
  P2: '#D97706',
  P3: '#CA8A04',
  P4: '#2563EB',
};

function createIncidentMarker(priority: string): HTMLElement {
  const color = PRIORITY_COLORS[priority] ?? '#6B7280';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: relative;
    width: 40px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  `;

  const ring = document.createElement('div');
  ring.style.cssText = `
    position: absolute;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: ${color};
    opacity: 0.15;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  `;

  const pin = document.createElement('div');
  pin.innerHTML = `
    <svg width="18" height="24" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C4.477 0 0 4.477 0 10C0 16.627 10 26 10 26C10 26 20 16.627 20 10C20 4.477 15.523 0 10 0Z"
        fill="${color}" />
      <circle cx="10" cy="10" r="4" fill="white" />
    </svg>
  `;
  pin.style.cssText = `
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 2px 5px rgba(0,0,0,0.28));
    line-height: 0;
  `;

  wrapper.appendChild(ring);
  wrapper.appendChild(pin);
  return wrapper;
}

const PRIORITY_BG: Record<string, string> = {
  P1: '#FEE2E2', P2: '#FEF3C7', P3: '#FEF9C3', P4: '#DBEAFE',
};
const PRIORITY_TEXT: Record<string, string> = {
  P1: '#DC2626', P2: '#D97706', P3: '#CA8A04', P4: '#2563EB',
};

function renderIncidentCard(incident: {
  incident_id: string;
  incident_type: string;
  corridor: string;
  predicted_priority?: string;
  status: string;
}): string {
  const priority = incident.predicted_priority || 'P4';
  const bg = PRIORITY_BG[priority] ?? '#F3F4F6';
  const text = PRIORITY_TEXT[priority] ?? '#374151';

  return `
    <div style="
      background: white;
      border: 1px solid #E5E5E5;
      border-radius: 14px;
      padding: 12px 16px;
      width: max-content;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      font-family: Inter, system-ui, sans-serif;
      display: flex;
      align-items: center;
      gap: 16px;
    ">
      <!-- ID -->
      <span style="font-size:11px;color:#9CA3AF;font-weight:500;white-space:nowrap;letter-spacing:0.03em">
        ${incident.incident_id}
      </span>

      <!-- Type -->
      <span style="font-size:13px;font-weight:600;color:#111111;white-space:nowrap">
        ${incident.incident_type}
      </span>

      <!-- Corridor -->
      <span style="font-size:12px;color:#6B7280;white-space:nowrap;flex:1">
        ${incident.corridor || ''}
      </span>

      <!-- Priority badge -->
      <span style="
        background:${bg};
        color:${text};
        font-size:11px;
        font-weight:700;
        padding:3px 10px;
        border-radius:9999px;
        white-space:nowrap;
        letter-spacing:0.03em;
      ">
        ${priority}
      </span>

      <!-- Status -->
      <span style="font-size:11px;color:#6B7280;white-space:nowrap;font-weight:500">
        ${(incident.status || 'UNKNOWN').replace(/_/g, ' ')}
      </span>
    </div>
  `;
}

function renderStationCard(station: {
  station_name: string;
  readiness_score: number;
  available_officers: number;
  available_vehicles: number;
  active_incidents: number;
}): string {
  const readColor =
    station.readiness_score > 70  ? '#16A34A' :
    station.readiness_score >= 40 ? '#EA580C' : '#DC2626';

  return `
    <div style="
      background: white;
      border: 1px solid #E5E5E5;
      border-radius: 14px;
      padding: 12px 16px;
      width: max-content;
      min-width: 260px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      font-family: Inter, system-ui, sans-serif;
    ">
      <div style="font-size:13px;font-weight:600;color:#111111;margin-bottom:8px">
        ${station.station_name}
      </div>
      <div style="display:flex;align-items:center;gap:16px">
        <div style="display:flex;flex-direction:column;align-items:center">
          <span style="font-size:18px;font-weight:700;color:${readColor}">
            ${Math.round(station.readiness_score)}
          </span>
          <span style="font-size:10px;color:#9CA3AF;font-weight:500">READINESS</span>
        </div>
        <div style="width:1px;height:28px;background:#E5E5E5"></div>
        <div style="display:flex;flex-direction:column;align-items:center">
          <span style="font-size:16px;font-weight:600;color:#111">${station.available_officers}</span>
          <span style="font-size:10px;color:#9CA3AF">OFFICERS</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center">
          <span style="font-size:16px;font-weight:600;color:#111">${station.available_vehicles}</span>
          <span style="font-size:10px;color:#9CA3AF">VEHICLES</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center">
          <span style="font-size:16px;font-weight:600;color:#111">${station.active_incidents}</span>
          <span style="font-size:10px;color:#9CA3AF">ACTIVE</span>
        </div>
      </div>
    </div>
  `;
}

const MAP_CONFIG = {
  style: 'mapbox://styles/mapbox/standard',
  center: [77.5946, 12.9716] as [number, number],
  zoom: 15,
  pitch: 60,
  bearing: -20,
  minZoom: 10,
  maxZoom: 20,
};

interface BengaluruMapProps {
  stations?: Station[];
  incidents?: Incident[];
  riskZones?: RiskZone[];
  onStationClick?: (station: Station) => void;
  height?: string;
  showLayerControls?: boolean;
}

export function BengaluruMap({
  stations = [],
  incidents = [],
  riskZones = [],
  onStationClick,
  height = '480px',
  showLayerControls = true,
}: BengaluruMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const hoverCardRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const incidentMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const [layers, setLayers] = useState({
    stations: true,
    incidents: true,
    heatmap: false,
    coverage: false,
  });
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      pitch: MAP_CONFIG.pitch,
      bearing: MAP_CONFIG.bearing,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    });

    map.on('style.load', () => {
      map.setConfigProperty('basemap', 'lightPreset', 'dark');
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainer.current);

    if (!hoverCardRef.current) {
      const hoverCard = document.createElement('div');
      hoverCard.style.cssText = `
        position: fixed;
        z-index: 99999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
        transform: translate(-50%, calc(-100% - 16px));
      `;
      document.body.appendChild(hoverCard);
      hoverCardRef.current = hoverCard;
    }

    map.on('move', () => {
      if (hoverCardRef.current) hoverCardRef.current.style.opacity = '0';
    });

    map.on('load', () => {
      setIsMapLoaded(true);
      // ── Risk heatmap source (muted, professional) ──
      if (riskZones.length > 0) {
        map.addSource('risk-zones', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: riskZones.map(z => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [77.5946, 12.9716] }, // placeholder — actual corridor centroids
              properties: { risk_score: z.risk_score, corridor: z.corridor },
            })),
          },
        });

        map.addLayer({
          id: 'risk-heatmap',
          type: 'heatmap',
          source: 'risk-zones',
          layout: { visibility: 'none' },
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'risk_score'], 0, 0, 100, 1],
            'heatmap-intensity': 0.8,
            'heatmap-radius': 40,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.4, 'rgba(246,173,85,0.35)',
              0.8, 'rgba(229,62,62,0.5)',
              1, 'rgba(229,62,62,0.65)',
            ],
            'heatmap-opacity': 0.7,
          },
        });
      }
    });

    return () => {
      resizeObserver.disconnect();
      if (hoverCardRef.current && hoverCardRef.current.parentNode) {
        hoverCardRef.current.parentNode.removeChild(hoverCardRef.current);
        hoverCardRef.current = null;
      }
      markersRef.current.forEach(m => m.remove());
      incidentMarkersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  // ── Update station markers when stations change ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || !map.isStyleLoaded()) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!layers.stations) return;

    stations.forEach(station => {
      if (!station.latitude || !station.longitude) return;

      const score = Number(station.readiness_score);
      const el = createStationMarker(score);

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([station.longitude, station.latitude])
        .addTo(map);

      el.addEventListener('mouseenter', () => {
        if (!hoverCardRef.current || !mapContainer.current) return;
        hoverCardRef.current.innerHTML = renderStationCard(station as any);
        const point = map.project([station.longitude, station.latitude]);
        const rect = mapContainer.current.getBoundingClientRect();
        
        let left = rect.left + point.x;
        if (left + 150 > window.innerWidth) left = window.innerWidth - 150 - 16;
        if (left - 150 < 0) left = 150 + 16;

        hoverCardRef.current.style.left = `${left}px`;
        hoverCardRef.current.style.top = `${rect.top + point.y}px`;
        hoverCardRef.current.style.opacity = '1';
      });

      el.addEventListener('mouseleave', () => {
        if (hoverCardRef.current) hoverCardRef.current.style.opacity = '0';
      });

      el.addEventListener('click', () => {
        if (onStationClick) onStationClick(station);
      });

      markersRef.current.push(marker);
    });
  }, [stations, layers.stations, onStationClick, isMapLoaded]);

  // ── Update incident markers when incidents change ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || !map.isStyleLoaded()) return;

    incidentMarkersRef.current.forEach(m => m.remove());
    incidentMarkersRef.current = [];

    if (!layers.incidents) return;

    incidents.forEach(inc => {
      if (!inc.latitude || !inc.longitude) return;

      const p = inc.predicted_priority || 'P4';
      const el = createIncidentMarker(p as 'P1' | 'P2' | 'P3' | 'P4');

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([inc.longitude, inc.latitude])
        .addTo(map);

      el.addEventListener('mouseenter', () => {
        if (!hoverCardRef.current || !mapContainer.current) return;
        hoverCardRef.current.innerHTML = renderIncidentCard(inc as any);
        const point = map.project([inc.longitude, inc.latitude]);
        const rect = mapContainer.current.getBoundingClientRect();

        let left = rect.left + point.x;
        if (left + 220 > window.innerWidth) left = window.innerWidth - 220 - 16;
        if (left - 220 < 0) left = 220 + 16;

        hoverCardRef.current.style.left = `${left}px`;
        hoverCardRef.current.style.top = `${rect.top + point.y}px`;
        hoverCardRef.current.style.opacity = '1';
      });

      el.addEventListener('mouseleave', () => {
        if (hoverCardRef.current) hoverCardRef.current.style.opacity = '0';
      });

      incidentMarkersRef.current.push(marker);
    });
  }, [incidents, layers.incidents, isMapLoaded]);

  // ── Toggle heatmap visibility ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (!map.getLayer('risk-heatmap')) return;
    map.setLayoutProperty('risk-heatmap', 'visibility', layers.heatmap ? 'visible' : 'none');
  }, [layers.heatmap]);

  if (!token) {
    return (
      <div
        className="map-container"
        style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F1EF' }}
      >
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺</div>
          <div style={{ fontSize: '13px' }}>Set NEXT_PUBLIC_MAPBOX_TOKEN to enable map</div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container" style={{ height: '100%', flex: 1, position: 'relative', width: '100%', margin: 0, padding: 0, border: 'none' }}>
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Layer controls */}
      {showLayerControls && (
        <div style={{
          position: 'absolute', bottom: '16px', left: '16px',
          background: 'var(--color-card)', border: '1px solid var(--color-border)',
          borderRadius: '10px', padding: '10px 14px',
          display: 'flex', flexDirection: 'column', gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          {[
            { key: 'stations', label: '● Station Markers' },
            { key: 'incidents', label: '● Incident Pins' },
            { key: 'heatmap', label: '○ Risk Heatmap' },
            { key: 'coverage', label: '○ Coverage Radius' },
          ].map(({ key, label }) => (
            <label key={key} className="map-checkbox-row">
              <input
                type="checkbox"
                checked={layers[key as keyof typeof layers]}
                onChange={e => setLayers(l => ({ ...l, [key]: e.target.checked }))}
                className="map-checkbox"
              />
              {label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
