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

const MAP_CONFIG = {
  style: 'mapbox://styles/mapbox/light-v11',
  center: [77.5946, 12.9716] as [number, number],
  zoom: 11,
  minZoom: 10,
  maxZoom: 18,
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
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const incidentMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const [layers, setLayers] = useState({
    stations: true,
    incidents: true,
    heatmap: false,
    coverage: false,
  });

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    mapRef.current = map;

    map.on('load', () => {
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
      markersRef.current.forEach(m => m.remove());
      incidentMarkersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  // ── Update station markers when stations change ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!layers.stations) return;

    stations.forEach(station => {
      if (!station.latitude || !station.longitude) return;

      const score = Number(station.readiness_score);
      const color =
        score > 70 ? '#48BB78' :
        score >= 40 ? '#F6AD55' :
        '#E53E3E';

      // Custom circle marker element
      const el = document.createElement('div');
      el.style.cssText = `
        width: 16px; height: 16px; border-radius: 50%;
        background: ${color}; border: 2px solid #FFFFFF;
        box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: pointer;
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([station.longitude, station.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 12, closeButton: false })
            .setHTML(`
              <div style="padding:8px; font-family:'Inter',sans-serif; min-width:160px;">
                <div style="font-size:12px; font-weight:700; color:#151515; margin-bottom:4px;">${station.station_name}</div>
                <div style="font-size:11px; color:#7A7A7A; line-height:1.6;">
                  Readiness: <strong>${Math.round(score)}</strong><br/>
                  Officers: ${station.available_officers}<br/>
                  Vehicles: ${station.available_vehicles}<br/>
                  Active: ${station.active_incidents} incidents
                </div>
              </div>
            `)
        )
        .addTo(map);

      el.addEventListener('click', () => {
        if (onStationClick) onStationClick(station);
      });

      markersRef.current.push(marker);
    });
  }, [stations, layers.stations, onStationClick]);

  // ── Update incident markers when incidents change ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    incidentMarkersRef.current.forEach(m => m.remove());
    incidentMarkersRef.current = [];

    if (!layers.incidents) return;

    incidents.forEach(inc => {
      if (!inc.latitude || !inc.longitude) return;

      const p = inc.predicted_priority || 'P4';
      const color =
        p === 'P1' ? '#E53E3E' :
        p === 'P2' ? '#DD6B20' :
        p === 'P3' ? '#D69E2E' :
        '#3182CE';

      const el = document.createElement('div');
      el.style.cssText = `
        width: 14px; height: 14px; border-radius: 2px;
        background: ${color}; border: 1.5px solid #FFFFFF;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3); transform: rotate(45deg); cursor: pointer;
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([inc.longitude, inc.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 12, closeButton: false })
            .setHTML(`
              <div style="padding:6px; font-family:'Inter',sans-serif; min-width:140px;">
                <div style="font-size:12px; font-weight:700; color:#151515;">${inc.incident_type}</div>
                <div style="font-size:11px; color:#7A7A7A; margin-top:4px;">
                  Priority: <strong>${p}</strong><br/>
                  Status: ${inc.status.replace('_', ' ')}<br/>
                  ${inc.corridor ? 'Corridor: ' + inc.corridor : ''}
                </div>
              </div>
            `)
        )
        .addTo(map);

      incidentMarkersRef.current.push(marker);
    });
  }, [incidents, layers.incidents]);

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
    <div className="map-container" style={{ height, position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

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
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--color-text-primary)' }}>
              <input
                type="checkbox"
                checked={layers[key as keyof typeof layers]}
                onChange={e => setLayers(l => ({ ...l, [key]: e.target.checked }))}
                style={{ width: '12px', height: '12px', accentColor: 'var(--color-text-primary)' }}
              />
              {label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
