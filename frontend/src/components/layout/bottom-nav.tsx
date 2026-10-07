'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Building2, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Map', href: '/', icon: Map },
    { label: 'Venues', href: '/venues', icon: Building2 },
    { label: 'Host', href: '/matches/create', icon: Plus, isAccent: true },
    { label: 'Profile', href: '/profile', icon: User },
  ];


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border pb-safe lg:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isAccent) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center -mt-6 shadow-lg hover:bg-primary/90 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium mt-1 text-foreground">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-current/20")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
