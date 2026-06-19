'use client';
import { Loader2 } from 'lucide-react';

/**
 * LoadingState & ErrorState — standardized async UI states.
 * Every async component MUST use these rather than bare spinners or raw error strings.
 */

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

interface EmptyStateProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function LoadingState({ message = 'Loading…', size = 'md' }: LoadingStateProps) {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const textSize = size === 'sm' ? '11px' : size === 'lg' ? '15px' : '13px';
  const padding = size === 'sm' ? '12px' : size === 'lg' ? '48px' : '32px';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding,
        color: 'var(--color-text-secondary)',
      }}
    >
      <Loader2 size={iconSize} className="animate-spin" style={{ color: 'var(--color-text-secondary)' }} />
      <span style={{ fontSize: textSize }}>{message}</span>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '32px',
      }}
    >
      <div
        style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'rgba(229,62,62,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ color: 'var(--p1)', fontSize: '16px', fontWeight: 700 }}>!</span>
      </div>
      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        {message}
      </span>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry} style={{ fontSize: '12px', padding: '6px 16px' }}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'No data found.', actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '48px 32px',
      }}
    >
      <div
        style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>○</span>
      </div>
      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        {message}
      </span>
      {actionLabel && onAction && (
        <button className="btn-primary" onClick={onAction} style={{ fontSize: '12px', padding: '6px 16px' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
