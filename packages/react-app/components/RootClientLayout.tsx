'use client';

import { Providers } from "../app/providers";
import { ClientProviders } from "./ClientProviders";
import Header from "./Header";
import { BottomNav } from "./BottomNav";
import { useEffect, useState } from "react";

export function RootClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Providers>
      <ClientProviders>
        <Header />
        <div className="pt-16 pb-16">
          {children}
        </div>
        <BottomNav />
      </ClientProviders>
    </Providers>
  );
} 