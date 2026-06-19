'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { LogOut, ChevronDown } from 'lucide-react';

interface TopBarProps {
  title?: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'rgba(229,62,62,0.12)',
  SUPERVISOR: 'rgba(246,173,85,0.15)',
  OPERATOR: 'rgba(217,240,106,0.2)',
  STATION_OFFICER: 'rgba(66,153,225,0.12)',
};
const ROLE_TEXT_COLORS: Record<string, string> = {
  ADMIN: '#C53030',
  SUPERVISOR: '#C05621',
  OPERATOR: '#5A7200',
  STATION_OFFICER: '#2B6CB0',
};

export function TopBar({ title }: TopBarProps) {
  const { user, logout } = useAuth();
  const [now, setNow] = useState<Date>(new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  // Live clock — updates every second
  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {title && (
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {title}
          </h1>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Live clock */}
        <div style={{ textAlign: 'right', minWidth: '80px' }}>
          {mounted && (
            <>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {formattedTime}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                {formattedDate}
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'none', border: '1px solid var(--color-border)',
                borderRadius: '9999px', padding: '6px 12px 6px 8px',
                cursor: 'pointer', fontSize: '13px',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'var(--color-text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', fontSize: '10px', fontWeight: 700,
              }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 500 }}>{user.username}</span>
              <span style={{
                padding: '2px 8px', borderRadius: '9999px',
                background: ROLE_COLORS[user.role] ?? 'var(--color-border)',
                color: ROLE_TEXT_COLORS[user.role] ?? 'var(--color-text-secondary)',
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
              }}>
                {user.role}
              </span>
              <ChevronDown size={12} style={{ color: 'var(--color-text-secondary)' }} />
            </button>

            {menuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 30 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div style={{
                  position: 'absolute', top: '110%', right: 0,
                  background: 'var(--color-card)', border: '1px solid var(--color-border)',
                  borderRadius: '12px', padding: '4px', minWidth: '160px', zIndex: 40,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', padding: '8px 12px', border: 'none',
                      background: 'none', cursor: 'pointer', borderRadius: '8px',
                      fontSize: '13px', color: 'var(--color-danger)',
                    }}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
