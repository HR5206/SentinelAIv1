'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { LoadingState, ErrorState } from '@/components/shared/LoadingState';
import { api, Station } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { Pencil, Check, X } from 'lucide-react';
import type { ApiError } from '@/lib/api';

/**
 * Resource Command Center.
 * - Station Officer: sees only their home station.
 * - Admin/Supervisor: station selector dropdown.
 * - [Edit] opens inline edit (not a modal).
 * - Confirm dialog before any inventory reduction.
 * - Available counts are read-only (calculated from total minus deployed).
 */
export default function ResourcesPage() {
  const params = useSearchParams();
  const defaultStation = params.get('station') ?? '';

  const { data: stations } = useSWR('/stations', () => api.stations.list());
  const [selectedStation, setSelectedStation] = useState(defaultStation);

  const { data: station, isLoading, error, mutate } = useSWR<Station>(
    selectedStation ? `/stations/${selectedStation}` : null,
    () => api.stations.get(selectedStation)
  );

  const [editRow, setEditRow] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ type: string; newTotal: number } | null>(null);
  const [saveError, setSaveError] = useState('');

  const resourceRows = station ? [
    { type: 'officers', label: 'Officers', total: station.total_officers ?? 0, available: station.available_officers },
    { type: 'vehicles', label: 'Patrol Vehicles', total: station.total_vehicles ?? 0, available: station.available_vehicles },
    { type: 'tow_trucks', label: 'Tow Trucks', total: station.total_tow_trucks ?? 0, available: station.available_tow_trucks },
    { type: 'barricades', label: 'Barricades', total: station.total_barricades ?? 0, available: station.available_barricades },
  ] : [];

  const handleEditClick = (type: string, current: number) => {
    setEditRow(type);
    setEditValue(String(current));
    setSaveError('');
  };

  const handleSave = (type: string, currentTotal: number) => {
    const newTotal = parseInt(editValue, 10);
    if (isNaN(newTotal) || newTotal < 0) { setSaveError('Invalid value.'); return; }

    // Require confirm if reducing
    if (newTotal < currentTotal) {
      setPendingEdit({ type, newTotal });
      setShowConfirm(true);
    } else {
      commitEdit(type, newTotal);
    }
  };

  const commitEdit = async (type: string, newTotal: number) => {
    // TODO: PUT /stations/{id} with updated total
    setEditRow(null);
    mutate();
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar title="Resource Command Center" />
        <main className="page-content">
          {/* Station selector */}
          <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
            <div className="form-group">
              <label className="form-label">Select Station</label>
              <select
                id="station-select"
                className="select"
                value={selectedStation}
                onChange={e => setSelectedStation(e.target.value)}
              >
                <option value="">Choose a station…</option>
                {(stations ?? []).map(s => (
                  <option key={s.station_id} value={s.station_id}>{s.station_name}</option>
                ))}
              </select>
            </div>
          </div>

          {!selectedStation && (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              Select a station to view and manage resources.
            </div>
          )}

          {selectedStation && isLoading && <LoadingState message="Loading station data…" />}
          {selectedStation && error && <ErrorState message="Failed to load station." onRetry={mutate} />}

          {station && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', maxWidth: '800px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700 }}>{station.station_name}</h2>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Readiness: <strong>{Math.round(Number(station.readiness_score))}</strong>
                </span>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Resource Type</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Deployed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceRows.map(row => {
                    const deployed = row.total - row.available;
                    const isEditing = editRow === row.type;
                    return (
                      <tr key={row.type}>
                        <td style={{ fontWeight: 500 }}>{row.label}</td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              style={{ width: '80px', padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px' }}
                              autoFocus
                            />
                          ) : (
                            row.total
                          )}
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{row.available}</td>
                        <td style={{ color: deployed > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                          {deployed}
                        </td>
                        <td>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleSave(row.type, row.total)}
                                style={{ padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-success)' }}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => { setEditRow(null); setSaveError(''); }}
                                style={{ padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditClick(row.type, row.total)}
                              style={{ padding: '4px 10px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'none', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Pencil size={11} /> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {saveError && (
                <div style={{ padding: '8px 20px', fontSize: '12px', color: 'var(--p1)' }}>{saveError}</div>
              )}
            </div>
          )}

          {/* Reduction confirm dialog */}
          {showConfirm && pendingEdit && (
            <div className="dialog-overlay">
              <div className="dialog-content">
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Confirm Inventory Reduction</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                  Reducing <strong>{pendingEdit.type}</strong> total to <strong>{pendingEdit.newTotal}</strong>.
                  This change will be logged. Are you sure?
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => { setShowConfirm(false); setEditRow(null); }}>Cancel</button>
                  <button className="btn-danger" onClick={() => { commitEdit(pendingEdit.type, pendingEdit.newTotal); setShowConfirm(false); }}>
                    Confirm Reduction
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
