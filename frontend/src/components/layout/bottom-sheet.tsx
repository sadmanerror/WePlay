'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [snap, setSnap] = useState<'peek' | 'half' | 'full'>('half');
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Basic touch gesture support
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSnap('half');
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const diff = touchCurrentY.current - touchStartY.current;
    if (diff > 100) { // Swipe down
      if (snap === 'full') setSnap('half');
      else if (snap === 'half') setSnap('peek');
      else onClose();
    } else if (diff < -100) { // Swipe up
      if (snap === 'peek') setSnap('half');
      else if (snap === 'half') setSnap('full');
    }
  };

  const heights = {
    peek: 'h-[30vh]',
    half: 'h-[50vh]',
    full: 'h-[90vh]'
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity animate-in fade-in" 
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl transition-all duration-300 ease-out flex flex-col",
          heights[snap],
          "animate-in slide-in-from-bottom-full"
        )}
      >
        <div 
          className="flex flex-col items-center p-4 pb-2 cursor-grab active:cursor-grabbing shrink-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mb-4" />
          
          {title && (
            <div className="w-full flex items-center justify-between">
              <h3 className="font-semibold text-lg">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          {children}
        </div>
      </div>
    </>
  );
}
