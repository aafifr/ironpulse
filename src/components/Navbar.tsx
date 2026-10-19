'use client';

import React from 'react';

export type TabType = 'workout' | 'nutrition' | 'progress';

interface NavbarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export function Navbar({ activeTab, onChangeTab }: NavbarProps) {
  const tabs = [
    { id: 'workout' as TabType, label: 'Latihan' },
    { id: 'nutrition' as TabType, label: 'Nutrisi' },
    { id: 'progress' as TabType, label: 'Progres' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto px-5 pb-6 pt-2">
      <div className="bg-white/90 backdrop-blur-2xl border border-stone-200/80 rounded-2xl p-1.5 flex items-center justify-between shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 py-2 text-xs transition-all duration-150 rounded-xl relative ${
                isActive
                  ? 'text-[#8F6B27] bg-[#FAF4E6] font-semibold'
                  : 'text-[#86868B] hover:text-[#1D1D1F] font-normal'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
