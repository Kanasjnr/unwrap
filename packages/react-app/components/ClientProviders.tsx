'use client';

import { AppProvider } from '@/providers/AppProvider';
// import { Navigation } from '@/components/Navigation';
import { Toaster } from '@/components/ui/toaster';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      {/* <Navigation /> */}
      <main>{children}</main>
      <Toaster />
    </AppProvider>
  );
} 