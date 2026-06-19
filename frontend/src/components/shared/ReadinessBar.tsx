'use client';

/**
 * ReadinessBar — horizontal progress bar with score-based color.
 * score > 70 → green, 40–70 → amber, < 40 → red.
 * No gradients. Plain solid color.
 */

interface ReadinessBarProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

export function ReadinessBar({ score, showLabel = true, className = '' }: ReadinessBarProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const colorClass =
    clampedScore > 70 ? 'readiness-high' :
    clampedScore >= 40 ? 'readiness-mid' :
    'readiness-low';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="readiness-bar-track flex-1">
        <div
          className={`readiness-bar-fill ${colorClass}`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--color-text-secondary)', minWidth: '32px', textAlign: 'right' }}>
          {Math.round(clampedScore)}
        </span>
      )}
    </div>
  );
}
