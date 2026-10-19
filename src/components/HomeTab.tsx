'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Play, Flame, Utensils, TrendingUp, Dumbbell, ArrowRight } from 'lucide-react';
import { getCurrentWeekDays, formatIndonesianDate } from '@/lib/schedule';
import { SavedWorkoutSession, SessionType } from '@/types/database';
import { DEFAULT_EXERCISES, getExerciseImage } from '@/lib/defaultExercises';
import { playShortClickSound } from '@/lib/audio';

interface HomeTabProps {
  onNavigateToWorkout: (session?: SessionType) => void;
  onNavigateToNutrition: () => void;
  onNavigateToProgress: () => void;
  onNavigateToHistory: () => void;
}

export function HomeTab({
  onNavigateToWorkout,
  onNavigateToNutrition,
  onNavigateToProgress,
  onNavigateToHistory,
}: HomeTabProps) {
  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const todayItem = useMemo(() => weekDays.find((d) => d.isToday) || weekDays[0], [weekDays]);
  const [selectedDay, setSelectedDay] = useState(todayItem);

  const [workoutHistory, setWorkoutHistory] = useState<SavedWorkoutSession[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ironpulse_workout_history');
    if (saved) {
      try {
        setWorkoutHistory(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  function toLocalDateString(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  }

  const completedDates = useMemo(() => {
    const set = new Set<string>();
    workoutHistory.forEach((s) => set.add(toLocalDateString(new Date(s.date))));
    return set;
  }, [workoutHistory]);

  const weekStreak = useMemo(() => {
    function mondayKey(d: Date): string {
      const m = new Date(d);
      m.setHours(0, 0, 0, 0);
      m.setDate(m.getDate() + (m.getDay() === 0 ? -6 : 1 - m.getDay()));
      return toLocalDateString(m);
    }
    const weeks = new Set<string>();
    workoutHistory.forEach((s) => weeks.add(mondayKey(new Date(s.date))));

    const cursor = new Date();
    if (!weeks.has(mondayKey(cursor))) cursor.setDate(cursor.getDate() - 7);

    let count = 0;
    while (weeks.has(mondayKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 7);
    }
    return count;
  }, [workoutHistory]);

  const dayLetters = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

  return (
    <div className="pb-36 pt-1 space-y-4">
      {/* 7-Day Week Strip with Streak */}
      <div className="bg-white rounded-2xl px-3 py-3.5 border border-stone-200/80 shadow-sm flex items-center gap-3">
        {/* Weekly streak */}
        <div className="flex flex-col items-center w-14 flex-shrink-0">
          <div className="relative">
            <Flame
              className={`w-9 h-9 ${
                weekStreak > 0 ? 'text-[#C5A059] fill-[#C5A059]/25' : 'text-stone-300'
              }`}
              strokeWidth={1.5}
            />
            <span className="absolute inset-0 flex items-end justify-center pb-1 text-[11px] font-bold font-mono text-[#1D1D1F]">
              {weekStreak}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-[#86868B] mt-0.5">Minggu</span>
        </div>

        <div className="grid grid-cols-7 flex-1 gap-1">
          {weekDays.map((item) => {
            const isSelected = selectedDay.dateString === item.dateString;
            const isDoneDay = completedDates.has(item.dateString);
            return (
              <button
                key={item.dateString}
                onClick={() => {
                  playShortClickSound();
                  setSelectedDay(item);
                }}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={`${item.dayShort} ${item.dayNum}`}
              >
                <span
                  className={`text-[11px] font-semibold ${
                    isSelected ? 'text-[#8F6B27]' : 'text-[#86868B]'
                  }`}
                >
                  {dayLetters[item.dayIndex]}
                </span>
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-semibold border-2 transition-all ${
                    isSelected
                      ? 'border-[#C5A059] text-[#1D1D1F] bg-white'
                      : isDoneDay
                      ? 'border-transparent bg-[#C5A059] text-white'
                      : item.isToday
                      ? 'border-stone-300 text-[#1D1D1F] bg-stone-100'
                      : 'border-stone-200 text-stone-500 group-hover:border-stone-300'
                  }`}
                >
                  {item.dayNum}
                </span>
                <span
                  className={`w-1 h-1 rounded-full ${
                    item.sessionType && !isDoneDay ? 'bg-[#C5A059]' : 'bg-transparent'
                  }`}
                  title={item.sessionType ? `Sesi ${item.sessionType}` : undefined}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Workout Focus Hero Card */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF4E6] text-[#8F6B27] border border-[#E8D4A8]/70">
                {selectedDay.sessionType ? `Sesi ${selectedDay.sessionType}` : 'Rest Day'}
              </span>
              <span className="text-xs text-[#86868B]">
                {formatIndonesianDate(selectedDay.dateString)}
              </span>
              {selectedDay.isToday && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                  Hari Ini
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-[#1D1D1F] mt-1.5 truncate">
              {!selectedDay.sessionType
                ? 'Hari Pemulihan & Rehidrasi'
                : selectedDay.sessionType === 'A'
                ? 'Dada, Punggung, Bahu, Paha, Bicep'
                : 'Punggung, Dada Atas, Hamstring, Tricep'}
            </h3>

            <p className="text-xs text-[#86868B] mt-0.5">
              {!selectedDay.sessionType
                ? 'Fokus pemulihan otot & pemenuhan 100g protein harian.'
                : '5 Gerakan • 15 Set Total • Estimasi 45-60 Menit'}
            </p>
          </div>
        </div>

        {/* Exercise Visual Thumbnails Preview */}
        {selectedDay.sessionType && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
            {DEFAULT_EXERCISES.filter((ex) => ex.session_type === selectedDay.sessionType).map((ex, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex items-center gap-2 bg-stone-50 p-1.5 pr-2.5 rounded-xl border border-stone-200/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ex.image_url || getExerciseImage(ex.name)}
                  alt={ex.name}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                />
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-[#1D1D1F] max-w-[95px] truncate">
                    {ex.name}
                  </p>
                  <p className="text-[9px] text-[#86868B] max-w-[95px] truncate">
                    {ex.target_muscle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => onNavigateToWorkout(selectedDay.sessionType || 'A')}
          className="w-full py-3.5 px-4 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>
            {selectedDay.sessionType
              ? selectedDay.isToday
                ? `Mulai Sesi ${selectedDay.sessionType} Sekarang`
                : `Buka Sesi ${selectedDay.sessionType}`
              : 'Buka Menu Latihan'}
          </span>
        </button>
      </div>

      {/* Quick Overview Grid: Nutrition & Progress */}
      <div className="grid grid-cols-2 gap-3">
        {/* Nutrition Widget Card */}
        <div
          onClick={onNavigateToNutrition}
          className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm space-y-2 cursor-pointer active:scale-98 transition-all group"
        >
          <div className="flex items-center justify-between text-[#86868B]">
            <div className="w-7 h-7 rounded-lg bg-[#FAF4E6] flex items-center justify-center text-[#8F6B27]">
              <Utensils className="w-3.5 h-3.5" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#1D1D1F] transition-colors" />
          </div>

          <div>
            <span className="text-[10px] text-[#86868B] uppercase tracking-wider font-medium">Target Harian</span>
            <p className="text-xs font-bold text-[#1D1D1F] mt-0.5">100g Protein</p>
            <p className="text-[11px] text-[#86868B]">2.500 ml Air</p>
          </div>
        </div>

        {/* Progress Weight Widget Card */}
        <div
          onClick={onNavigateToProgress}
          className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm space-y-2 cursor-pointer active:scale-98 transition-all group"
        >
          <div className="flex items-center justify-between text-[#86868B]">
            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-[#1D1D1F] transition-colors" />
          </div>

          <div>
            <span className="text-[10px] text-[#86868B] uppercase tracking-wider font-medium">Target Bulking</span>
            <p className="text-xs font-bold text-[#8F6B27] mt-0.5">46 kg → 55 kg</p>
            <p className="text-[11px] text-[#86868B]">+9 kg surplus</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1D1D1F]">Sesi Latihan Terakhir</span>
          <button
            onClick={onNavigateToHistory}
            className="text-[11px] text-[#8F6B27] hover:underline font-semibold"
          >
            Lihat Semua
          </button>
        </div>

        {workoutHistory.length > 0 ? (
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FAF4E6] text-[#8F6B27] border border-[#E8D4A8]/70">
                  Sesi {workoutHistory[0].session_type}
                </span>
                <span className="text-xs font-medium text-[#1D1D1F]">
                  {formatIndonesianDate(workoutHistory[0].date)}
                </span>
              </div>
              <p className="text-[11px] text-[#86868B] mt-1 font-mono">
                {workoutHistory[0].total_volume_kg.toLocaleString()} kg • {workoutHistory[0].total_sets} set
              </p>
            </div>
            <Dumbbell className="w-4 h-4 text-stone-400" />
          </div>
        ) : (
          <p className="text-xs text-[#86868B] py-2">
            Belum ada sesi latihan. Tekan tombol Mulai di bawah untuk memulai.
          </p>
        )}
      </div>
    </div>
  );
}
