'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { User, Map, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="WePlay Logo"
            width={32}
            height={32}
            className="rounded-lg object-contain w-8 h-8"
            priority
          />
          <span className="text-2xl font-bold text-primary tracking-tight">WePlay</span>
        </Link>

        {/* Center navigation */}
        <nav className="flex items-center gap-1.5">
          <Link
            href="/"
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5",
              pathname === '/'
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "border-border bg-card text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Pickup Matches</span>
          </Link>

          <Link
            href="/venues"
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5",
              pathname?.startsWith('/venues')
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "border-border bg-card text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Turfs & Venues</span>
          </Link>
        </nav>

        {/* Profile */}
        <div className="flex items-center gap-2">
          <Link 
            href="/profile" 
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors border",
              pathname === '/profile'
                ? "bg-primary/10 border-primary text-primary"
                : "bg-muted border-transparent hover:bg-muted/80 text-muted-foreground"
            )}
            title="Profile"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
