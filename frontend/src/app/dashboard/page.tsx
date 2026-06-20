'use client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Activity, Clock, Users, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { PageHeading } from '@/components/layout/PageHeading';
import { TabNav } from '@/components/shared/TabNav';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ReadinessBar } from '@/components/shared/ReadinessBar';
import { LoadingState, EmptyState } from '@/components/shared/LoadingState';
import { StatisticsPanel } from '@/components/dashboard/StatisticsPanel';
import { useKPIs } from '@/hooks/useKPIs';
import { useStations } from '@/hooks/useStations';
import useSWR from 'swr';
import { api } from '@/lib/api';
import Link from 'next/link';

const BengaluruMap = dynamic(
  () => import('@/components/map/BengaluruMap').then(m => m.BengaluruMap),
  { ssr: false, loading: () => <div className="card h-[420px] flex items-center justify-center"><LoadingState message="Loading map…" /></div> }
);

function useActiveIncidents() {
  return useSWR('/incidents/active', () => api.incidents.active(), { refreshInterval: 15000 });
}

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState('Overview');
  const { kpis, isLoading: kpisLoading } = useKPIs(30000);
  const { stations } = useStations(30000);
  const { data: readinessData, isLoading: readinessLoading } = useSWR(
    '/station-readiness', () => api.readiness.ranked(), { refreshInterval: 30000 }
  );
  const { data: activeIncidents } = useActiveIncidents();

  const top5 = (readinessData?.stations ?? []).slice(0, 5);

  // Mock trend data
  const trendData = [
    { date: 'Mon', count: 12 },
    { date: 'Tue', count: 18 },
    { date: 'Wed', count: 24 },
    { date: 'Thu', count: 16 },
    { date: 'Fri', count: 28 },
    { date: 'Sat', count: 14 },
    { date: 'Sun', count: 32 },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeading title={
        <>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#CDFF50',
              flexShrink: 0,
            }}
          >
            <Activity size={18} color="#111111" strokeWidth={2.5} />
          </span>
          Traffic Incident Command
        </>
      } />

      <TabNav 
        tabs={['Overview', 'Active Incidents', 'Stations', 'Resources', 'Analytics', 'Risk Zones', 'History']}
        active={tab}
        onChange={setTab}
      />

      <div className="flex-1 px-7 pb-7 grid grid-cols-12 gap-4 overflow-auto">
        {/* Row 1: Stat cards */}
        <div className="col-span-8 grid grid-cols-2 gap-4 items-stretch">
          <StatCard
            icon={AlertTriangle}
            title="Active Incidents"
            value={kpis?.active_incidents ?? 0}
            percentage={12} // Mock change
            usedDots={kpis?.active_incidents ? Math.min(10, Math.ceil(kpis.active_incidents / 2)) : 0}
            totalDots={10}
            isLoading={kpisLoading}
          />
          <StatCard
            icon={Clock}
            title="Avg Resolution"
            value={kpis?.avg_resolution_minutes ?? 0}
            total="min"
            percentage={8}
            usedDots={8}
            totalDots={10}
            variant="accent"
            isLoading={kpisLoading}
          />
        </div>
        
        {/* Map spanning right side */}
        <div className="col-span-4 row-span-2" style={{ position: 'relative', minHeight: '400px' }}>
          <div className="card" style={{ padding: 0, position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <BengaluruMap
              stations={stations}
              incidents={activeIncidents || []}
              height="100%"
            />
          </div>
        </div>

        {/* Row 2: Statistics chart */}
        <div className="col-span-8">
          <div className="card">
            <StatisticsPanel data={trendData} />
          </div>
        </div>

        {/* Row 3: Live Incident Queue & Station Readiness */}
        <div className="col-span-7">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-sm font-bold text-text-1">Live Incident Queue</h3>
              <Link href="/incidents/new" className="text-xs text-text-2 flex items-center gap-1 no-underline hover:text-text-1">
                New <ArrowUpRight size={14} />
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
                {(activeIncidents || []).slice(0, 6).map(inc => (
                  <tr
                    key={inc.incident_id}
                    onClick={() => router.push(`/incidents/${inc.incident_id}`)}
                  >
                    <td className="font-mono text-xs text-text-2">{inc.incident_id}</td>
                    <td className="font-medium">{inc.incident_type}</td>
                    <td className="text-text-2">{inc.corridor}</td>
                    <td><StatusBadge priority={inc.predicted_priority as any} /></td>
                    <td><StatusBadge status={inc.status as any} /></td>
                  </tr>
                ))}
                {(!activeIncidents || activeIncidents.length === 0) && (
                  <tr>
                    <td colSpan={5}><EmptyState message="No active incidents" /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-5">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-sm font-bold text-text-1">Station Readiness</h3>
              <Link href="/stations" className="text-xs text-text-2 flex items-center gap-1 no-underline hover:text-text-1">
                All <ArrowUpRight size={14} />
              </Link>
            </div>
            {readinessLoading ? (
              <LoadingState message="Loading…" size="sm" />
            ) : (
              <div>
                {top5.map(station => (
                  <div
                    key={station.station_id}
                    className="flex flex-col gap-2 p-4 border-b border-border cursor-pointer hover:bg-surface-raised transition-colors"
                    onClick={() => router.push('/stations')}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-text-1">{station.station_name}</span>
                      <span className="text-[11px] text-text-2">{station.active_incidents} active</span>
                    </div>
                    <ReadinessBar score={Number(station.readiness_score)} />
                  </div>
                ))}
                {top5.length === 0 && <EmptyState message="No station data" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
