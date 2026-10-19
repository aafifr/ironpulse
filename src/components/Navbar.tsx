'use client';

import React from 'react';
import { Home, Utensils, Play, TrendingUp, History } from 'lucide-react';

export type TabType = 'home' | 'nutrition' | 'workout' | 'progress' | 'history';

interface NavbarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  isWorkoutActive?: boolean;
}

export function Navbar({ activeTab, onChangeTab, isWorkoutActive }: NavbarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto px-4 pb-6 pt-2 pointer-events-none">
      <div className="bg-white/95 backdrop-blur-2xl border border-stone-200/80 rounded-3xl p-1.5 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.08)] pointer-events-auto relative">
        {/* Tab 1: Beranda */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-2xl transition-all ${
            activeTab === 'home'
              ? 'text-[#8F6B27] font-semibold'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" strokeWidth={activeTab === 'home' ? 2.5 : 1.8} />
          <span className="text-[10px]">Beranda</span>
        </button>

        {/* Tab 2: Nutrisi */}
        <button
          onClick={() => onChangeTab('nutrition')}
          className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-2xl transition-all ${
            activeTab === 'nutrition'
              ? 'text-[#8F6B27] font-semibold'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          <Utensils className="w-4 h-4 mb-0.5" strokeWidth={activeTab === 'nutrition' ? 2.5 : 1.8} />
          <span className="text-[10px]">Nutrisi</span>
        </button>

        {/* Center Floating Action Button: Mulai Latihan */}
        <div className="flex-1 flex justify-center relative">
          <button
            onClick={() => onChangeTab('workout')}
            className={`absolute -top-7 w-13 h-13 rounded-full flex flex-col items-center justify-center shadow-[0_8px_20px_rgba(197,160,89,0.35)] transition-all active:scale-95 border-3 border-white ${
              activeTab === 'workout'
                ? 'bg-[#1D1D1F] text-[#DFBA5A] ring-2 ring-[#C5A059]'
                : isWorkoutActive
                ? 'bg-[#C5A059] text-white animate-pulse'
                : 'bg-[#C5A059] text-white hover:brightness-105'
            }`}
            style={{ width: '52px', height: '52px' }}
            title="Mulai Latihan"
          >
            {isWorkoutActive ? (
              <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          <span
            className={`text-[9px] mt-6 font-semibold transition-colors ${
              activeTab === 'workout' ? 'text-[#8F6B27]' : 'text-[#86868B]'
            }`}
          >
            {isWorkoutActive ? 'Aktif' : 'Mulai'}
          </span>
        </div>

        {/* Tab 4: Progres */}
        <button
          onClick={() => onChangeTab('progress')}
          className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-2xl transition-all ${
            activeTab === 'progress'
              ? 'text-[#8F6B27] font-semibold'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          <TrendingUp className="w-4 h-4 mb-0.5" strokeWidth={activeTab === 'progress' ? 2.5 : 1.8} />
          <span className="text-[10px]">Progres</span>
        </button>

        {/* Tab 5: Riwayat */}
        <button
          onClick={() => onChangeTab('history')}
          className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-2xl transition-all ${
            activeTab === 'history'
              ? 'text-[#8F6B27] font-semibold'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          <History className="w-4 h-4 mb-0.5" strokeWidth={activeTab === 'history' ? 2.5 : 1.8} />
          <span className="text-[10px]">Riwayat</span>
        </button>
      </div>
    </nav>
  );
}
