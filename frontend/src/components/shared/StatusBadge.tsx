'use client';

/**
 * StatusBadge — pill badge for incident priority (P1–P4) or status strings.
 * PROHIBITED: gradients, glow, neon colors. Just clean pill shapes.
 */

type Priority = 'P1' | 'P2' | 'P3' | 'P4';
type IncidentStatus =
  | 'REPORTED' | 'UNDER_ASSESSMENT' | 'RESOURCES_ASSIGNED'
  | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

interface StatusBadgeProps {
  priority?: Priority;
  status?: IncidentStatus | string;
  className?: string;
}

const PRIORITY_CLASSES: Record<Priority, string> = {
  P1: 'badge badge-p1',
  P2: 'badge badge-p2',
  P3: 'badge badge-p3',
  P4: 'badge badge-p4',
};

const STATUS_CLASSES: Record<string, string> = {
  REPORTED: 'badge badge-reported',
  UNDER_ASSESSMENT: 'badge badge-under-assessment',
  RESOURCES_ASSIGNED: 'badge badge-resources-assigned',
  IN_PROGRESS: 'badge badge-in-progress',
  RESOLVED: 'badge badge-resolved',
  CLOSED: 'badge badge-closed',
  CANCELLED: 'badge badge-cancelled',
};

const STATUS_LABELS: Record<string, string> = {
  UNDER_ASSESSMENT: 'Assessing',
  RESOURCES_ASSIGNED: 'Assigned',
  IN_PROGRESS: 'Active',
};

export function StatusBadge({ priority, status, className = '' }: StatusBadgeProps) {
  if (priority) {
    return (
      <span className={`${PRIORITY_CLASSES[priority] ?? 'badge'} ${className}`}>
        {priority}
      </span>
    );
  }
  if (status) {
    const label = STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
    return (
      <span className={`${STATUS_CLASSES[status] ?? 'badge badge-reported'} ${className}`}>
        {label}
      </span>
    );
  }
  return null;
}
