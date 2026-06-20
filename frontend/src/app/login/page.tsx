'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ShieldCheck, Loader2 } from 'lucide-react';
import type { ApiError } from '@/lib/api';

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
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '14px',
            background: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={26} style={{ color: 'var(--lime)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              SentinelAI
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              Traffic Incident Command Center
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                id="username" type="text" className="input"
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username" required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password" type="password" className="input"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password" required
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(229,62,62,0.08)',
                border: '1px solid rgba(229,62,62,0.18)',
                borderRadius: '10px', fontSize: '12px', color: 'var(--err)',
              }}>
                {error}
              </div>
            )}

            <button
              id="login-submit" type="submit" className="btn-primary"
              disabled={isLoading}
              style={{ width: '100%', justifyContent: 'center', padding: '13px 24px', marginTop: '4px' }}
            >
              {isLoading ? <><Loader2 size={14} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div style={{ position: 'relative', textAlign: 'center' }}>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <span style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--surface)', padding: '0 10px',
              fontSize: '11px', color: 'var(--muted)',
            }}>or</span>
          </div>

          <button
            id="demo-login" type="button" className="btn-secondary"
            disabled={isLoading}
            onClick={() => {
              setUsername('admin');
              setPassword('admin123');
              login('admin', 'admin123')
                .then(() => router.replace('/dashboard'))
                .catch(() => setError('Demo login failed. Make sure the database is seeded.'));
            }}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 24px' }}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Continue as Demo'}
          </button>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>
          Bengaluru Traffic Police — Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
