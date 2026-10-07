'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/shared/toast';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Header } from '@/components/layout/header';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
