'use client';

import React from 'react';
import { formatIndonesianDate } from '@/lib/schedule';

interface HeaderProps {
  isOnline: boolean;
  onOpenSettings?: () => void;
}

export function Header({ isOnline, onOpenSettings }: HeaderProps) {
  const dateFormatted = formatIndonesianDate();

  return (
    <header className="sticky top-0 z-30 w-full bg-[#F8F9FA]/90 backdrop-blur-xl border-b border-stone-200/60 px-5 py-3.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-[#1D1D1F]">
              IronPulse
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#FAF4E6] text-[#8F6B27] border border-[#E8D4A8]/60">
              Bulk
            </span>
          </div>
          <p className="text-[11px] text-[#86868B] font-normal mt-0.5">{dateFormatted}</p>
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-stone-600 hover:text-stone-900 transition-colors"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOnline ? 'bg-[#C5A059]' : 'bg-stone-300'
            }`}
          />
          <span>{isOnline ? 'Cloud' : 'Lokal'}</span>
        </button>
      </div>
    </header>
  );
}
