'use client';

import React from 'react';

interface RestTimerBarProps {
  isActive: boolean;
  secondsLeft: number;
  totalDuration: number;
  onAddSeconds: (seconds: number) => void;
  onSkip: () => void;
}

export function RestTimerBar({
  isActive,
  secondsLeft,
  totalDuration,
  onAddSeconds,
  onSkip,
}: RestTimerBarProps) {
  if (!isActive) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  const percentage = Math.min(100, Math.max(0, ((totalDuration - secondsLeft) / totalDuration) * 100));
  const isFinished = secondsLeft === 0;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-30 max-w-md mx-auto px-5 animate-in slide-in-from-bottom duration-200">
      <div className="bg-[#1D1D1F] text-white rounded-2xl p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.2)] border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2.5">
            <span
              className={`font-mono text-2xl font-semibold tracking-tight ${
                isFinished ? 'text-[#DFBA5A]' : 'text-white'
              }`}
            >
              {formattedTime}
            </span>
            <span className="text-[11px] text-stone-400 font-normal">
              {isFinished ? 'Waktu habis' : 'Istirahat'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isFinished && (
              <button
                onClick={() => onAddSeconds(30)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-medium active:scale-95 transition-all"
              >
                +30s
              </button>
            )}

            <button
              onClick={onSkip}
              className={`px-3 py-1 rounded-lg text-xs font-medium active:scale-95 transition-all ${
                isFinished
                  ? 'bg-[#C5A059] text-white font-semibold'
                  : 'bg-white/10 text-stone-300 hover:bg-white/15'
              }`}
            >
              {isFinished ? 'Lanjut' : 'Lewati'}
            </button>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-2.5 w-full bg-white/10 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-[#C5A059] transition-all duration-1000 ease-linear"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
