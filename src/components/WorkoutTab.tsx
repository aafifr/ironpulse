'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Exercise, SessionType, ExerciseSetItem } from '@/types/database';
import { DEFAULT_EXERCISES } from '@/lib/defaultExercises';
import { getTodaySchedule, DaySchedule } from '@/lib/schedule';
import { playShortClickSound } from '@/lib/audio';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface WorkoutTabProps {
  onStartRestTimer: (seconds?: number) => void;
}

export function WorkoutTab({ onStartRestTimer }: WorkoutTabProps) {
  const [schedule, setSchedule] = useState<DaySchedule>(getTodaySchedule());
  const [activeSession, setActiveSession] = useState<SessionType>('A');
  const [isRestDayMode, setIsRestDayMode] = useState<boolean>(true);
  const [expandedTips, setExpandedTips] = useState<{ [key: string]: boolean }>({});
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [setLogsState, setSetLogsState] = useState<{ [exerciseId: string]: ExerciseSetItem[] }>({});
  
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completedSummary, setCompletedSummary] = useState<{ totalSets: number; totalVolumeKg: number }>({
    totalSets: 0,
    totalVolumeKg: 0,
  });

  const previousHints: { [exerciseName: string]: string } = {
    'Chest Press Machine': '25 kg × 10',
    'Lat Pulldown Machine': '30 kg × 10',
    'Dumbbell Shoulder Press': '8 kg × 10',
    'Leg Press Machine': '50 kg × 10',
    'Dumbbell Bicep Curl': '8 kg × 10',
    'Seated Cable Row': '30 kg × 10',
    'Incline Press (Dumbbell/Machine)': '20 kg × 10',
    'Dumbbell Lateral Raise': '4 kg × 12',
    'Leg Curl Machine': '25 kg × 10',
    'Rope Tricep Pushdown': '20 kg × 10',
  };

  const initializeSetLogs = useCallback((exList: Exercise[], session: SessionType) => {
    const savedKey = `ironpulse_workout_state_${session}`;
    const saved = typeof window !== 'undefined' ? localStorage.getItem(savedKey) : null;
    let savedObj: { [key: string]: ExerciseSetItem[] } = {};

    if (saved) {
      try {
        savedObj = JSON.parse(saved);
      } catch {
        // ignore
      }
    }

    const initial: { [exerciseId: string]: ExerciseSetItem[] } = {};
    exList.forEach((ex) => {
      // If we have saved state for this exact exercise ID and it has sets, use it
      if (savedObj[ex.id] && savedObj[ex.id].length > 0) {
        initial[ex.id] = savedObj[ex.id];
      } else {
        // Otherwise generate clean default sets
        initial[ex.id] = Array.from({ length: ex.default_sets || 3 }).map((_, i) => ({
          set_number: i + 1,
          weight_kg: '',
          reps_completed: '',
          is_completed: false,
        }));
      }
    });

    setSetLogsState(initial);
  }, []);

  useEffect(() => {
    const todaySched = getTodaySchedule();
    setSchedule(todaySched);
    if (!todaySched.isRestDay && todaySched.recommendedSession) {
      setActiveSession(todaySched.recommendedSession);
      setIsRestDayMode(false);
    } else {
      setIsRestDayMode(true);
      setActiveSession('A');
    }
  }, []);

  useEffect(() => {
    async function loadExercises() {
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .eq('session_type', activeSession)
            .order('order_index', { ascending: true });

          if (!error && data && data.length > 0) {
            setExercises(data as Exercise[]);
            initializeSetLogs(data as Exercise[], activeSession);
            return;
          }
        }
      } catch (err) {
        console.warn('Error fetching exercises from Supabase, using defaults:', err);
      }

      const filtered = DEFAULT_EXERCISES
        .filter((ex) => ex.session_type === activeSession)
        .map((ex, index) => ({
          ...ex,
          id: `local-${activeSession}-${index + 1}`,
        })) as Exercise[];

      setExercises(filtered);
      initializeSetLogs(filtered, activeSession);
    }

    loadExercises();
  }, [activeSession, initializeSetLogs]);

  useEffect(() => {
    if (Object.keys(setLogsState).length > 0) {
      localStorage.setItem(`ironpulse_workout_state_${activeSession}`, JSON.stringify(setLogsState));
    }
  }, [setLogsState, activeSession]);

  function handleInputChange(
    exerciseId: string,
    setIndex: number,
    field: 'weight_kg' | 'reps_completed',
    value: string
  ) {
    setSetLogsState((prev) => {
      const currentSets = prev[exerciseId]
        ? [...prev[exerciseId]]
        : Array.from({ length: 3 }).map((_, i) => ({
            set_number: i + 1,
            weight_kg: '',
            reps_completed: '',
            is_completed: false,
          }));

      if (!currentSets[setIndex]) return prev;

      currentSets[setIndex] = {
        ...currentSets[setIndex],
        [field]: value,
      };

      // Smart gym convenience: when typing Set 1, pre-fill subsequent empty sets
      if (setIndex === 0 && value !== '') {
        for (let i = 1; i < currentSets.length; i++) {
          if (currentSets[i][field] === '' || currentSets[i][field] === 0) {
            currentSets[i] = {
              ...currentSets[i],
              [field]: value,
            };
          }
        }
      }

      return {
        ...prev,
        [exerciseId]: currentSets,
      };
    });
  }

  async function handleToggleSetCompleted(exercise: Exercise, setIndex: number) {
    playShortClickSound();

    const currentSets = setLogsState[exercise.id]
      ? [...setLogsState[exercise.id]]
      : Array.from({ length: exercise.default_sets || 3 }).map((_, i) => ({
          set_number: i + 1,
          weight_kg: '',
          reps_completed: '',
          is_completed: false,
        }));

    const targetSet = currentSets[setIndex];
    if (!targetSet) return;

    const willBeCompleted = !targetSet.is_completed;
    const finalWeight = targetSet.weight_kg === '' ? 20 : Number(targetSet.weight_kg);
    const finalReps = targetSet.reps_completed === '' ? 10 : Number(targetSet.reps_completed);

    currentSets[setIndex] = {
      ...targetSet,
      weight_kg: finalWeight,
      reps_completed: finalReps,
      is_completed: willBeCompleted,
    };

    setSetLogsState((prev) => ({
      ...prev,
      [exercise.id]: currentSets,
    }));

    if (willBeCompleted) {
      onStartRestTimer(90);
    }

    if (isSupabaseConfigured) {
      try {
        let activeWorkoutId = workoutLogId;
        if (!activeWorkoutId) {
          const { data: wLog } = await supabase
            .from('workout_logs')
            .insert({ session_type: activeSession, notes: 'Sesi latihan IronPulse' })
            .select()
            .single();

          if (wLog) {
            activeWorkoutId = wLog.id;
            setWorkoutLogId(wLog.id);
          }
        }

        if (activeWorkoutId) {
          await supabase.from('set_logs').insert({
            workout_log_id: activeWorkoutId,
            exercise_id: exercise.id.startsWith('local-') ? null : exercise.id,
            set_number: targetSet.set_number,
            weight_kg: finalWeight,
            reps_completed: finalReps,
            is_completed: willBeCompleted,
          });
        }
      } catch (err) {
        console.warn('Could not save set to Supabase:', err);
      }
    }
  }

  function handleFinishWorkout() {
    let setsCount = 0;
    let volume = 0;

    Object.values(setLogsState).forEach((sets) => {
      sets.forEach((s) => {
        if (s.is_completed) {
          setsCount += 1;
          volume += (Number(s.weight_kg) || 0) * (Number(s.reps_completed) || 0);
        }
      });
    });

    setCompletedSummary({
      totalSets: setsCount,
      totalVolumeKg: volume,
    });
    setShowCompletionModal(true);

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#C5A059', '#1D1D1F', '#E8D4A8'],
      });
    } catch {
      // ignore
    }
  }

  function handleResetWorkout() {
    if (confirm('Reset centang set latihan sesi ini?')) {
      localStorage.removeItem(`ironpulse_workout_state_${activeSession}`);
      initializeSetLogs(exercises, activeSession);
      setWorkoutLogId(null);
      setShowCompletionModal(false);
    }
  }

  const completedSetsTotal = Object.values(setLogsState).reduce(
    (acc, sets) => acc + sets.filter((s) => s.is_completed).length,
    0
  );
  const totalSetsAvailable = exercises.length * 3;

  return (
    <div className="pb-36 pt-2 space-y-4">
      {/* Session Selector (Clean Segmented Control) */}
      <div className="bg-stone-200/70 p-1 rounded-xl flex gap-1">
        <button
          onClick={() => {
            setActiveSession('A');
            setIsRestDayMode(false);
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs transition-all duration-150 ${
            !isRestDayMode && activeSession === 'A'
              ? 'bg-white text-[#1D1D1F] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          Sesi A
        </button>
        <button
          onClick={() => {
            setActiveSession('B');
            setIsRestDayMode(false);
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs transition-all duration-150 ${
            !isRestDayMode && activeSession === 'B'
              ? 'bg-white text-[#1D1D1F] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          Sesi B
        </button>
        <button
          onClick={() => setIsRestDayMode(true)}
          className={`flex-1 py-1.5 rounded-lg text-xs transition-all duration-150 ${
            isRestDayMode
              ? 'bg-white text-[#1D1D1F] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          Rest Day
        </button>
      </div>

      {/* Rest Day View */}
      {isRestDayMode ? (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/70 text-center space-y-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#1D1D1F]">Hari Istirahat</h3>
            <p className="text-xs text-[#86868B] max-w-xs mx-auto">
              Fokus pada pemulihan dan penuhi target protein 100g di tab Nutrisi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-1">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60">
              <span className="text-[10px] text-[#86868B] uppercase tracking-wider font-medium">Sesi A</span>
              <p className="text-xs font-semibold text-[#1D1D1F] mt-0.5">Senin & Jumat</p>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60">
              <span className="text-[10px] text-[#86868B] uppercase tracking-wider font-medium">Sesi B</span>
              <p className="text-xs font-semibold text-[#1D1D1F] mt-0.5">Rabu</p>
            </div>
          </div>

          <button
            onClick={() => setIsRestDayMode(false)}
            className="w-full py-2.5 rounded-xl bg-[#FAF4E6] text-[#8F6B27] border border-[#E8D4A8]/80 text-xs font-semibold active:scale-98 transition-all"
          >
            Mulai Latihan Manual
          </button>
        </div>
      ) : (
        <>
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs px-0.5 text-[#86868B]">
            <span>{schedule.dayName} — Sesi {activeSession}</span>
            <span className="font-medium text-[#1D1D1F]">
              {completedSetsTotal}/{totalSetsAvailable} set
            </span>
          </div>

          {/* Exercise List */}
          <div className="space-y-3">
            {exercises.map((exercise, index) => {
              // Always guarantee 3 sets array even if state was empty
              const sets = (setLogsState[exercise.id] && setLogsState[exercise.id].length > 0)
                ? setLogsState[exercise.id]
                : Array.from({ length: exercise.default_sets || 3 }).map((_, i) => ({
                    set_number: i + 1,
                    weight_kg: '',
                    reps_completed: '',
                    is_completed: false,
                  }));

              const hint = previousHints[exercise.name];

              return (
                <div
                  key={exercise.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200/70 shadow-sm space-y-3"
                >
                  {/* Exercise Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-[#86868B]">
                          0{index + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-[#1D1D1F]">
                          {exercise.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#86868B]">
                          {exercise.target_muscle}
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="text-[11px] text-[#86868B]">
                          Target {exercise.target_reps} reps
                        </span>
                        {hint && (
                          <>
                            <span className="text-stone-300">•</span>
                            <span className="text-[11px] text-[#8F6B27] font-mono">
                              Lalu: {hint}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {exercise.tips && (
                      <button
                        onClick={() =>
                          setExpandedTips((prev) => ({
                            ...prev,
                            [exercise.id]: !prev[exercise.id],
                          }))
                        }
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-serif italic transition-all ${
                          expandedTips[exercise.id]
                            ? 'bg-[#FAF4E6] text-[#8F6B27] border border-[#E8D4A8]/80'
                            : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100 border border-stone-200'
                        }`}
                        title="Panduan form gerakan"
                      >
                        i
                      </button>
                    )}
                  </div>

                  {/* Expandable Tips */}
                  {expandedTips[exercise.id] && exercise.tips && (
                    <div className="text-[11px] text-[#8F6B27] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8D4A8]/60 leading-relaxed">
                      <span className="font-semibold text-[#8F6B27]">Panduan form:</span> {exercise.tips}
                    </div>
                  )}

                  {/* Sets Rows Table */}
                  <div className="space-y-1.5 pt-1">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-[#86868B] uppercase tracking-wider px-1">
                      <div className="col-span-2 text-center">Set</div>
                      <div className="col-span-4 text-center">Beban (kg)</div>
                      <div className="col-span-4 text-center">Reps</div>
                      <div className="col-span-2 text-center">Done</div>
                    </div>

                    {sets.map((set, setIndex) => {
                      const isDone = set.is_completed;

                      return (
                        <div
                          key={setIndex}
                          className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-xl transition-all ${
                            isDone ? 'bg-[#FAF4E6]/60 border border-[#E8D4A8]/60' : 'bg-stone-50'
                          }`}
                        >
                          <div className="col-span-2 text-center text-xs font-mono text-[#86868B]">
                            #{set.set_number}
                          </div>

                          <div className="col-span-4">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={set.weight_kg}
                              onChange={(e) =>
                                handleInputChange(exercise.id, setIndex, 'weight_kg', e.target.value)
                              }
                              placeholder="0"
                              className="w-full text-center bg-white border border-stone-200 rounded-lg py-1.5 text-xs font-mono font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#C5A059]"
                            />
                          </div>

                          <div className="col-span-4">
                            <input
                              type="number"
                              min="0"
                              value={set.reps_completed}
                              onChange={(e) =>
                                handleInputChange(exercise.id, setIndex, 'reps_completed', e.target.value)
                              }
                              placeholder="10"
                              className="w-full text-center bg-white border border-stone-200 rounded-lg py-1.5 text-xs font-mono font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#C5A059]"
                            />
                          </div>

                          <div className="col-span-2 flex justify-center">
                            <button
                              onClick={() => handleToggleSetCompleted(exercise, setIndex)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                isDone
                                  ? 'bg-[#C5A059] text-white shadow-sm'
                                  : 'border border-stone-300 hover:border-stone-400'
                              }`}
                              title={isDone ? 'Batal' : 'Selesai'}
                            >
                              {isDone && (
                                <svg
                                  className="w-3.5 h-3.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleFinishWorkout}
              className="w-full py-3 rounded-xl bg-[#1D1D1F] text-white font-medium text-xs tracking-wide active:scale-98 transition-all"
            >
              Selesaikan Latihan
            </button>

            <button
              onClick={handleResetWorkout}
              className="w-full py-1.5 text-[#86868B] hover:text-[#1D1D1F] text-xs transition-colors"
            >
              Reset Centang
            </button>
          </div>
        </>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-xl border border-stone-200/80 text-center space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1D1D1F]">Sesi Selesai</h3>
              <p className="text-xs text-[#86868B]">Data latihan berhasil disimpan.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 py-1 text-left">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-[10px] text-[#86868B] uppercase tracking-wider">Set Selesai</span>
                <p className="text-base font-bold text-[#1D1D1F] font-mono mt-0.5">
                  {completedSummary.totalSets} Set
                </p>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-[10px] text-[#86868B] uppercase tracking-wider">Total Beban</span>
                <p className="text-base font-bold text-[#8F6B27] font-mono mt-0.5">
                  {completedSummary.totalVolumeKg} kg
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCompletionModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1D1D1F] text-white text-xs font-semibold active:scale-98 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
