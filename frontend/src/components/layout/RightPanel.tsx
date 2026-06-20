'use client';

import { usePathname } from 'next/navigation';
import { Radio, Bell, HelpCircle, Users, MessageSquare, BarChart2, FileText, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export function RightPanel() {
  const pathname = usePathname();
  if (pathname !== '/dashboard') return null;

  const gridItems = [
    { icon: Radio,    label: 'Stations', href: '/stations' },
    { icon: Bell,     label: 'Alerts', href: '/incidents/new' },
  ];

  const linkItems = [
    { icon: HelpCircle, title: 'Documentation',  desc: 'System guide and API reference for operators' },
    { icon: Users,      title: 'Risk Zones',      desc: 'View emerging hotspots and corridor analysis' },
    { icon: MessageSquare, title: 'Feedback',     desc: 'Submit incident ground truth for model training' },
    { icon: BarChart2,  title: 'Analytics',       desc: 'Operational performance and model accuracy' },
    { icon: FileText,   title: 'Audit Log',        desc: 'All dispatch and override actions' },
  ];

  return (
    <aside className="right-panel">
      {/* 2x2 grid */}
      <div className="right-panel-grid">
        {gridItems.map((item, i) => (
          <Link href={item.href} key={i} className="right-panel-grid-item" style={{ textDecoration: 'none' }}>
            <div className="right-panel-grid-icon">
              <item.icon size={16} className="text-text-2" />
            </div>
            <span className="right-panel-grid-label">{item.label}</span>
          </Link>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        {linkItems.map((item, i) => (
          <div key={i} className="right-panel-link">
            <div className="right-panel-link-icon">
              <item.icon size={14} className="text-text-2" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="right-panel-link-title">{item.title}</div>
              <div className="right-panel-link-desc">{item.desc}</div>
            </div>
            {/* ↗ Arrow — THIS WAS MISSING */}
            <ArrowUpRight
              size={14}
              color="#A0A0A0"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
