'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ReadinessBar } from '@/components/shared/ReadinessBar';
import { LoadingState, ErrorState } from '@/components/shared/LoadingState';
import { useStations } from '@/hooks/useStations';

type FilterLevel = 'all' | 'high' | 'mid' | 'low';

export default function StationsPage() {
  const { stations, isLoading, error, mutate } = useStations(30000);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterLevel>('all');

  const filtered = stations.filter(s => {
    const matchSearch = s.station_name.toLowerCase().includes(search.toLowerCase());
    const score = Number(s.readiness_score);
    const matchFilter =
      filter === 'all' ? true :
      filter === 'high' ? score > 70 :
      filter === 'mid' ? score >= 40 && score <= 70 :
      score < 40;
    return matchSearch && matchFilter;
  });

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar title="Station Readiness" />
        <main className="page-content">
          {/* Controls */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
            <input
              type="text"
              className="input"
              style={{ maxWidth: '300px' }}
              placeholder="Search stations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="station-search"
            />
            {(['all', 'high', 'mid', 'low'] as FilterLevel[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: '1px solid var(--color-border)',
                  background: filter === f ? 'var(--color-text-primary)' : 'transparent',
                  color: filter === f ? '#FFF' : 'var(--color-text-secondary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {f === 'all' ? 'All' : f === 'high' ? 'High (>70)' : f === 'mid' ? 'Medium (40–70)' : 'Low (<40)'}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Showing {filtered.length} of {stations.length} stations
            </span>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {isLoading ? (
              <LoadingState message="Loading stations…" />
            ) : error ? (
              <ErrorState message="Failed to load stations." onRetry={mutate} />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Station Name</th>
                    <th style={{ minWidth: '200px' }}>Readiness</th>
                    <th>Officers</th>
                    <th>Vehicles</th>
                    <th>Tow Trucks</th>
                    <th>Barricades</th>
                    <th>Active Inc.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(station => (
                    <tr
                      key={station.station_id}
                      onClick={() => router.push(`/resources?station=${station.station_id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 500 }}>{station.station_name}</td>
                      <td>
                        <ReadinessBar score={Number(station.readiness_score)} />
                      </td>
                      <td>{station.available_officers}{station.total_officers ? ` / ${station.total_officers}` : ''}</td>
                      <td>{station.available_vehicles}{station.total_vehicles ? ` / ${station.total_vehicles}` : ''}</td>
                      <td>{station.available_tow_trucks}{station.total_tow_trucks ? ` / ${station.total_tow_trucks}` : ''}</td>
                      <td>{station.available_barricades}{station.total_barricades ? ` / ${station.total_barricades}` : ''}</td>
                      <td>
                        <span style={{
                          fontSize: '12px', fontWeight: 600,
                          color: station.active_incidents > 3 ? 'var(--p1)' : 'var(--color-text-primary)',
                        }}>
                          {station.active_incidents}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
