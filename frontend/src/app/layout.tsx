import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'SentinelAI — Traffic Incident Command Center',
  description:
    'AI-powered traffic incident decision support system for Bengaluru Traffic Police. Real-time incident management, resource dispatch, and predictive analytics.',
  keywords: ['traffic', 'incident management', 'bengaluru', 'AI', 'dispatch'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
