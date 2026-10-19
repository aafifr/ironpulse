'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { Navbar, TabType } from '@/components/Navbar';
import { WorkoutTab } from '@/components/WorkoutTab';
import { NutritionTab } from '@/components/NutritionTab';
import { ProgressTab } from '@/components/ProgressTab';
import { RestTimerBar } from '@/components/RestTimerBar';
import { ConfigModal } from '@/components/ConfigModal';
import { playRestTimerDoneSound } from '@/lib/audio';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('workout');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Rest Timer State
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(90);
  const [totalRestDuration, setTotalRestDuration] = useState<number>(90);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start rest timer function (called by WorkoutTab when set is completed)
  function handleStartRestTimer(seconds = 90) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTotalRestDuration(seconds);
    setRestSecondsLeft(seconds);
    setIsTimerActive(true);
  }

  // Timer countdown loop
  useEffect(() => {
    if (isTimerActive && restSecondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            playRestTimerDoneSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, restSecondsLeft]);

  // Add more seconds to rest timer (+30s)
  function handleAddSeconds(sec = 30) {
    setRestSecondsLeft((prev) => prev + sec);
    setTotalRestDuration((prev) => prev + sec);
  }

  // Skip / close rest timer
  function handleSkipTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerActive(false);
    setRestSecondsLeft(90);
  }

  return (
    <div className="min-h-screen bg-[#F0F0F2] text-[#1D1D1F] flex flex-col justify-between selection:bg-[#C5A059] selection:text-white">
      {/* Mobile-first centered shell (Apple iPhone Canvas) */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between relative bg-[#F8F9FA] shadow-[0_0_50px_rgba(0,0,0,0.06)] border-x border-stone-200/70">
        {/* Sticky Header */}
        <Header
          isOnline={isSupabaseConfigured}
          onOpenSettings={() => setIsConfigModalOpen(true)}
        />

        {/* Main Tab Content Area */}
        <main className="flex-1 px-4 pt-2">
          {activeTab === 'workout' && (
            <WorkoutTab onStartRestTimer={handleStartRestTimer} />
          )}

          {activeTab === 'nutrition' && <NutritionTab />}

          {activeTab === 'progress' && <ProgressTab />}
        </main>

        {/* Floating Rest Timer (Floats above bottom dock) */}
        <RestTimerBar
          isActive={isTimerActive}
          secondsLeft={restSecondsLeft}
          totalDuration={totalRestDuration}
          onAddSeconds={handleAddSeconds}
          onSkip={handleSkipTimer}
        />

        {/* Fixed Bottom Dock Navigation */}
        <Navbar activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Supabase Connection Setup Modal */}
        <ConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />
      </div>
    </div>
  );
}
