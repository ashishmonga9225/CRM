import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Lead Follow-up CRM',
  description: 'Fast, phone-first lead follow-up CRM for one-handed use between calls and site visits',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased flex flex-col md:flex-row">
        <AuthProvider>
          {/* Navigation (Sidebar on Desktop, Bottom bar on Mobile) */}
          <Navigation />

          {/* Main Content Area */}
          <main className="flex-1 w-full md:ml-64 pb-20 md:pb-8 max-w-4xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
