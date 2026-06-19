'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FilePlus, Map, Building2, Package,
  BarChart3, Clock, Settings, ShieldCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/incidents/new', icon: FilePlus, label: 'New Incident' },
  { href: '/map', icon: Map, label: 'Map View' },
  { href: '/stations', icon: Building2, label: 'Stations' },
  { href: '/resources', icon: Package, label: 'Resources' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/history', icon: Clock, label: 'History' },
];

const BOTTOM_NAV = [
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo area */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'var(--color-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ShieldCheck size={18} style={{ color: '#151515' }} />
        </div>
        <div>
          <div style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 700, lineHeight: 1.2 }}>
            SentinelAI
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.08em' }}>
            TRAFFIC OPS
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: '12px', overflowY: 'auto' }}>
        <div className="section-title">Operations</div>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '8px', paddingBottom: '12px' }}>
        {BOTTOM_NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`}>
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
