'use client';
import { ReactNode } from 'react';

/**
 * KPICard — premium enterprise KPI metric card.
 * PROHIBITED: gradients, glassmorphism, glow effects.
 * Background: #F8F9F7, radius: 28px, padding: 24px
 */

interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'stable';
  icon?: ReactNode;
  isLoading?: boolean;
}

const TrendArrow = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up')
    return <span style={{ color: 'var(--color-success)', fontSize: '12px', fontWeight: 600 }}>↑</span>;
  if (trend === 'down')
    return <span style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: 600 }}>↓</span>;
  return <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>→</span>;
};

export function KPICard({ label, value, subtext, trend, icon, isLoading }: KPICardProps) {
  return (
    <div className="card" style={{ minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span className="kpi-label">{label}</span>
        {icon && <span style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}>{icon}</span>}
      </div>

      {isLoading ? (
        <div className="skeleton" style={{ height: '32px', width: '60%', marginTop: '12px' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '10px' }}>
          <span className="kpi-value">{value}</span>
          {trend && <TrendArrow trend={trend} />}
        </div>
      )}

      {subtext && !isLoading && (
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          {subtext}
        </span>
      )}
    </div>
  );
}
