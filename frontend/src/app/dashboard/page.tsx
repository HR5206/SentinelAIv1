'use client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Activity, Clock, Users, AlertTriangle, ArrowUpRight, Building2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { KPICard } from '@/components/shared/KPICard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ReadinessBar } from '@/components/shared/ReadinessBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/LoadingState';
import { useKPIs } from '@/hooks/useKPIs';
import { useStations } from '@/hooks/useStations';
import useSWR from 'swr';
import { api } from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// Lazy-load map (large bundle)
const BengaluruMap = dynamic(
  () => import('@/components/map/BengaluruMap').then(m => m.BengaluruMap),
  { ssr: false, loading: () => <div style={{ height: '480px', background: '#F0F1EF', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingState message="Loading map…" /></div> }
);

function useActiveIncidents() {
  return useSWR('/incidents/active', () => api.incidents.active(), { refreshInterval: 15000 });
}

export default function DashboardPage() {
  const router = useRouter();
  const { kpis, isLoading: kpisLoading } = useKPIs(30000);
  const { stations, isLoading: stationsLoading, error: stationsError } = useStations(30000);
  const { data: readinessData, isLoading: readinessLoading } = useSWR(
    '/station-readiness',
    () => api.readiness.ranked(),
    { refreshInterval: 30000 }
  );
  const { data: activeIncidents } = useActiveIncidents();

  const top5 = (readinessData?.stations ?? []).slice(0, 5);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar title="Operational Dashboard" />
        <main className="page-content">
          {/* ── KPI Row ─────────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <KPICard
              label="Active Incidents"
              value={kpis?.active_incidents ?? '—'}
              icon={<Activity size={16} />}
              isLoading={kpisLoading}
            />
            <KPICard
              label="Avg Resolution Time"
              value={kpis ? `${Math.round(kpis.avg_resolution_minutes)} min` : '—'}
              icon={<Clock size={16} />}
              isLoading={kpisLoading}
              subtext="Last 30 days"
            />
            <KPICard
              label="Resources Deployed"
              value={kpis?.resources_deployed ?? '—'}
              icon={<Users size={16} />}
              isLoading={kpisLoading}
            />
            <KPICard
              label="High Risk Zones"
              value={kpis?.high_risk_zones ?? '—'}
              icon={<AlertTriangle size={16} />}
              isLoading={kpisLoading}
              subtext="Risk score > 70"
            />
          </div>

          {/* ── Map ─────────────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '24px' }}>
            <BengaluruMap
              stations={stations}
              incidents={activeIncidents || []}
              height="480px"
              showLayerControls
            />
          </div>

          {/* ── Bottom Row ──────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '16px' }}>
            {/* Live incident queue */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 700 }}>Live Incident Queue</h2>
                <Link href="/incidents/new" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  New incident <ArrowUpRight size={12} />
                </Link>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Corridor</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Placeholder rows — will be replaced by real /incidents API */}
                  {(activeIncidents || []).slice(0, 5).map(inc => (
                    <tr
                      key={inc.incident_id}
                      className={inc.predicted_priority === 'P1' ? 'p1-row' : ''}
                      onClick={() => router.push(`/incidents/${inc.incident_id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text-secondary)' }}>{inc.incident_id}</td>
                      <td>{inc.incident_type}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{inc.corridor}</td>
                      <td><StatusBadge priority={inc.predicted_priority as 'P1' | 'P2' | 'P3' | 'P4'} /></td>
                      <td><StatusBadge status={inc.status as any} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Station readiness ranking */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 700 }}>Station Readiness</h2>
                <Link href="/stations" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View all <ArrowUpRight size={12} />
                </Link>
              </div>

              {readinessLoading ? (
                <LoadingState message="Loading stations…" size="sm" />
              ) : (
                <div style={{ padding: '8px 0' }}>
                  {top5.map(station => (
                    <div
                      key={station.station_id}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: '6px',
                        padding: '10px 20px',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/stations`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{station.station_name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                          {station.active_incidents} active
                        </span>
                      </div>
                      <ReadinessBar score={Number(station.readiness_score)} />
                    </div>
                  ))}
                  {top5.length === 0 && (
                    <EmptyState message="No station data available" />
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
