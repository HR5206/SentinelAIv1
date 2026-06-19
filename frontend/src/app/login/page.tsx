'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ShieldCheck, Loader2 } from 'lucide-react';
import type { ApiError } from '@/lib/api';

/**
 * Login page — username + password only (no email in v1.0).
 * Does NOT indicate which field is wrong on failure.
 * Shows account lockout message if applicable.
 */
export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      router.replace('/dashboard');
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.message?.toLowerCase().includes('locked')) {
        setError('Account temporarily locked. Try again in 30 minutes.');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'var(--color-text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={24} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              SentinelAI
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Traffic Incident Command Center
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              type="text"
              className="input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(229,62,62,0.08)',
              border: '1px solid rgba(229,62,62,0.2)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--p1)',
            }}>
              {error}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 24px' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
          <button
            id="demo-login"
            type="button"
            className="btn-secondary"
            disabled={isLoading}
            onClick={() => {
              setUsername('admin');
              setPassword('admin123');
              login('admin', 'admin123').then(() => router.replace('/dashboard')).catch(() => setError('Demo login failed. Make sure the database is seeded.'));
            }}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', marginTop: '-8px' }}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Test Demo Without Logging In'}
          </button>
        </form>

        <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          Bengaluru Traffic Police — Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
