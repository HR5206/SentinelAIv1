'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ReadinessBar } from '@/components/shared/ReadinessBar';
import { LoadingState, ErrorState } from '@/components/shared/LoadingState';
import { api, StationCandidate, DispatchBody } from '@/lib/api';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import type { ApiError } from '@/lib/api';

/**
 * Dispatch Recommendation Screen.
 * CRITICAL:
 * - Dispatch requires TWO explicit clicks (button + dialog confirm).
 * - Override requires non-empty reason field (min 20 chars).
 * - POST to /dispatch only on confirmed user action. NEVER auto-dispatches.
 */
export default function DispatchPage() {
  const params = useParams<{ id: string }>();
  const incidentId = params.id;
  const router = useRouter();

  const { data: readiness, isLoading, error } = useSWR(
    '/station-readiness',
    () => api.readiness.ranked()
  );

  const candidates = readiness?.stations.slice(0, 3) ?? [];
  const recommended = candidates[0];

  // Confirm dialog state
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOverrideDrawer, setShowOverrideDrawer] = useState(false);
  const [overrideStation, setOverrideStation] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const handleConfirmDispatch = async () => {
    if (!recommended) return;
    setIsDispatching(true);
    setDispatchError('');

    try {
      const body: DispatchBody = {
        incident_id: incidentId,
        station_id: recommended.station_id,
        resources_dispatched: {
          officers: recommended.available_officers,
          vehicles: recommended.available_vehicles,
          tow_trucks: recommended.available_tow_trucks,
          barricades: recommended.available_barricades,
        },
        override: false,
      };
      await api.dispatch.create(body);
      setDispatchSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      const e = err as ApiError;
      setDispatchError(e.message || 'Dispatch failed.');
    } finally {
      setIsDispatching(false);
      setShowConfirm(false);
    }
  };

  const handleOverrideDispatch = async () => {
    if (overrideReason.length < 20) return;
    setIsDispatching(true);
    setDispatchError('');

    try {
      const body: DispatchBody = {
        incident_id: incidentId,
        station_id: overrideStation,
        resources_dispatched: { officers: 2, vehicles: 1, tow_trucks: 0, barricades: 2 },
        override: true,
        override_reason: overrideReason,
      };
      await api.dispatch.create(body);
      setDispatchSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      const e = err as ApiError;
      setDispatchError(e.message || 'Override dispatch failed.');
    } finally {
      setIsDispatching(false);
      setShowOverrideDrawer(false);
    }
  };

  if (isLoading) return <PageShell><LoadingState message="Loading station data…" /></PageShell>;
  if (error) return <PageShell><ErrorState message="Failed to load stations." /></PageShell>;
  if (dispatchSuccess) return (
    <PageShell>
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Dispatch Confirmed</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '13px' }}>Redirecting to dashboard…</p>
      </div>
    </PageShell>
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar title={`Dispatch — ${incidentId}`} />
        <main className="page-content">
          <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Recommended station */}
            {recommended && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                      Recommended Station
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{recommended.station_name}</h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Readiness Score</div>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>{Math.round(Number(recommended.readiness_score))}</div>
                  </div>
                </div>

                <ReadinessBar score={Number(recommended.readiness_score)} />

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {recommended.reasons?.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
                      <Check size={12} style={{ color: 'var(--color-success)', marginTop: '2px', flexShrink: 0 }} />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Candidate comparison table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Candidate Comparison
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>Readiness</th>
                    <th>Officers</th>
                    <th>Vehicles</th>
                    <th>Active Inc.</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((s, i) => (
                    <tr key={s.station_id}>
                      <td>
                        <span style={{ marginRight: '6px' }}>{i === 0 ? '★' : ' '}</span>
                        {s.station_name}
                      </td>
                      <td style={{ minWidth: '120px' }}>
                        <ReadinessBar score={Number(s.readiness_score)} />
                      </td>
                      <td>{s.available_officers}</td>
                      <td>{s.available_vehicles}</td>
                      <td>{s.active_incidents}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resource package */}
            {recommended && (
              <div className="card">
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Resource Package
                </div>
                <div style={{ display: 'flex', gap: '24px', fontSize: '13px', flexWrap: 'wrap' }}>
                  {[
                    { emoji: '👮', count: recommended.available_officers, label: 'Officers' },
                    { emoji: '🚗', count: recommended.available_vehicles, label: 'Patrol Vehicles' },
                    { emoji: '🚛', count: recommended.available_tow_trucks, label: 'Tow Trucks' },
                    { emoji: '🚧', count: recommended.available_barricades, label: 'Barricades' },
                  ].map(({ emoji, count, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{emoji}</span>
                      <strong>{count}</strong>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {dispatchError && (
              <div style={{ padding: '10px 14px', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)', borderRadius: '8px', fontSize: '12px', color: 'var(--p1)' }}>
                {dispatchError}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                id="confirm-dispatch-btn"
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
                onClick={() => setShowConfirm(true)}
                disabled={!recommended}
              >
                Confirm Dispatch
              </button>
              <button
                id="override-dispatch-btn"
                className="btn-secondary"
                onClick={() => setShowOverrideDrawer(true)}
              >
                Override →
              </button>
            </div>
          </div>

          {/* Confirmation dialog — second explicit click */}
          {showConfirm && recommended && (
            <div className="dialog-overlay" role="dialog" aria-modal="true">
              <div className="dialog-content">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
                  <AlertTriangle size={20} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Confirm Dispatch</h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      Dispatch <strong>{recommended.available_officers} officers</strong> and{' '}
                      <strong>{recommended.available_vehicles} vehicles</strong> from{' '}
                      <strong>{recommended.station_name}</strong> to incident <strong>{incidentId}</strong>?
                      <br /><br />
                      This action will deduct resources from the station. It cannot be undone automatically.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setShowConfirm(false)} disabled={isDispatching}>
                    Cancel
                  </button>
                  <button
                    id="confirm-dispatch-dialog"
                    className="btn-danger"
                    onClick={handleConfirmDispatch}
                    disabled={isDispatching}
                  >
                    {isDispatching ? <><Loader2 size={13} className="animate-spin" /> Dispatching…</> : 'Confirm Dispatch'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Override drawer */}
          {showOverrideDrawer && (
            <>
              <div className="drawer-overlay" onClick={() => setShowOverrideDrawer(false)} />
              <div className="drawer">
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Override Dispatch</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Select an alternate station and provide a mandatory reason. Minimum 20 characters.
                </p>

                <div className="form-group">
                  <label className="form-label">Select Station</label>
                  <select
                    id="override-station"
                    className="select"
                    value={overrideStation}
                    onChange={e => setOverrideStation(e.target.value)}
                  >
                    <option value="">Choose station…</option>
                    {candidates.map(s => (
                      <option key={s.station_id} value={s.station_id}>{s.station_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Override Reason *</label>
                  <textarea
                    id="override-reason"
                    className="textarea"
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    placeholder="Explain why you are overriding the AI recommendation (min. 20 characters)…"
                    rows={4}
                  />
                  <span style={{ fontSize: '10px', color: overrideReason.length < 20 ? 'var(--p1)' : 'var(--color-text-secondary)' }}>
                    {overrideReason.length} / 20 min characters
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-secondary" onClick={() => setShowOverrideDrawer(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button
                    id="confirm-override-btn"
                    className="btn-danger"
                    onClick={handleOverrideDispatch}
                    disabled={overrideReason.length < 20 || !overrideStation || isDispatching}
                    style={{ flex: 1 }}
                  >
                    {isDispatching ? <Loader2 size={13} className="animate-spin" /> : 'Override & Dispatch'}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar title="Dispatch" />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
