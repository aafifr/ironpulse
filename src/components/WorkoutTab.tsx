'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Play, Check, RotateCcw, History } from 'lucide-react';
import { Exercise, SessionType, ExerciseSetItem, SavedWorkoutSession } from '@/types/database';
import { DEFAULT_EXERCISES } from '@/lib/defaultExercises';
import { formatIndonesianDate, getTodaySchedule } from '@/lib/schedule';
import { playShortClickSound } from '@/lib/audio';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { WorkoutHistoryModal } from '@/components/WorkoutHistoryModal';

interface WorkoutTabProps {
  onStartRestTimer: (seconds?: number) => void;
  onWorkoutStateChange?: (isActive: boolean) => void;
  onNavigateToHistory?: () => void;
  selectedSession?: SessionType;
}

export function WorkoutTab({
  onStartRestTimer,
  onWorkoutStateChange,
  onNavigateToHistory,
  selectedSession,
}: WorkoutTabProps) {
  const todaySched = useMemo(() => getTodaySchedule(), []);
  const [activeSession, setActiveSession] = useState<SessionType>(
    selectedSession || todaySched.recommendedSession || 'A'
  );
  const [isRestDay, setIsRestDay] = useState<boolean>(
    selectedSession ? false : todaySched.isRestDay
  );

  // Active Workout Stopwatch State
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutElapsedTime, setWorkoutElapsedTime] = useState<number>(0);

  useEffect(() => {
    if (selectedSession && !isWorkoutActive) {
      setActiveSession(selectedSession);
      setIsRestDay(false);
    }
  }, [selectedSession, isWorkoutActive]);

  // Exercises & Set Logs
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [setLogsState, setSetLogsState] = useState<{ [exerciseId: string]: ExerciseSetItem[] }>({});
  const [expandedTips, setExpandedTips] = useState<{ [key: string]: boolean }>({});
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);

  // Modals & History
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completedSummary, setCompletedSummary] = useState<{
    totalSets: number;
    totalVolumeKg: number;
    durationSeconds: number;
  }>({
    totalSets: 0,
    totalVolumeKg: 0,
    durationSeconds: 0,
  });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [workoutHistory, setWorkoutHistory] = useState<SavedWorkoutSession[]>([]);

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

  function getPreviousExerciseHint(exerciseName: string): string | null {
    for (const session of workoutHistory) {
      const foundEx = session.exercises_summary?.find((e) => e.name === exerciseName);
      if (foundEx && foundEx.sets.length > 0) {
        const lastSet = foundEx.sets[0];
        return `${lastSet.weight_kg} kg × ${lastSet.reps_completed}`;
      }
    }
    return previousHints[exerciseName] || null;
  }

  // Restore Active Workout from localStorage on mount
  useEffect(() => {
    const savedActive = localStorage.getItem('ironpulse_active_workout');
    if (savedActive) {
      try {
        const parsed = JSON.parse(savedActive);
        if (parsed.isWorkoutActive && parsed.startTime) {
          setIsWorkoutActive(true);
          onWorkoutStateChange?.(true);
          setWorkoutStartTime(parsed.startTime);
          setActiveSession(parsed.sessionType || 'A');
          setIsRestDay(false);
          const elapsed = Math.max(0, Math.floor((Date.now() - parsed.startTime) / 1000));
          setWorkoutElapsedTime(elapsed);
        }
      } catch {
        // ignore
      }
    }

    const savedHistory = localStorage.getItem('ironpulse_workout_history');
    if (savedHistory) {
      try {
        setWorkoutHistory(JSON.parse(savedHistory));
      } catch {
        // ignore
      }
    }
  }, [onWorkoutStateChange]);

  // Live stopwatch ticking every 1 second
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isWorkoutActive && workoutStartTime) {
      timer = setInterval(() => {
        const elapsed = Math.max(0, Math.floor((Date.now() - workoutStartTime) / 1000));
        setWorkoutElapsedTime(elapsed);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isWorkoutActive, workoutStartTime]);

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
      if (savedObj[ex.id] && savedObj[ex.id].length > 0) {
        initial[ex.id] = savedObj[ex.id];
      } else {
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

  // Fetch Exercises for Active Session
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

  // Persist set logs state to local storage
  useEffect(() => {
    if (Object.keys(setLogsState).length > 0) {
      localStorage.setItem(`ironpulse_workout_state_${activeSession}`, JSON.stringify(setLogsState));
    }
  }, [setLogsState, activeSession]);

  function handleStartWorkout(sessionOverride?: SessionType) {
    playShortClickSound();
    const sessionToStart = sessionOverride || activeSession;
    const now = Date.now();
    setIsWorkoutActive(true);
    onWorkoutStateChange?.(true);
    setWorkoutStartTime(now);
    setWorkoutElapsedTime(0);
    setIsRestDay(false);
    setActiveSession(sessionToStart);

    localStorage.setItem(
      'ironpulse_active_workout',
      JSON.stringify({
        isWorkoutActive: true,
        startTime: now,
        sessionType: sessionToStart,
      })
    );
  }

  function handleCancelWorkout() {
    if (
      confirm('Batalkan sesi latihan yang sedang berlangsung? Sesi ini tidak akan dicatat ke riwayat.')
    ) {
      setIsWorkoutActive(false);
      onWorkoutStateChange?.(false);
      setWorkoutStartTime(null);
      setWorkoutElapsedTime(0);
      localStorage.removeItem('ironpulse_active_workout');
    }
  }

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

      const oldSet1Value = prev[exerciseId]?.[0]?.[field];

      currentSets[setIndex] = {
        ...currentSets[setIndex],
        [field]: value,
      };

      if (setIndex === 0) {
        for (let i = 1; i < currentSets.length; i++) {
          const targetVal = currentSets[i][field];
          if (
            !currentSets[i].is_completed &&
            (targetVal === '' || targetVal === oldSet1Value || targetVal === 0)
          ) {
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

    const durationSecs = workoutStartTime
      ? Math.max(1, Math.floor((Date.now() - workoutStartTime) / 1000))
      : workoutElapsedTime;

    setCompletedSummary({
      totalSets: setsCount,
      totalVolumeKg: volume,
      durationSeconds: durationSecs,
    });

    // End active workout
    setIsWorkoutActive(false);
    onWorkoutStateChange?.(false);
    setWorkoutStartTime(null);
    localStorage.removeItem('ironpulse_active_workout');

    // Save to workout history
    const exercisesSummary: SavedWorkoutSession['exercises_summary'] = [];
    exercises.forEach((ex) => {
      const sets = setLogsState[ex.id] || [];
      const completedSets = sets
        .filter((s) => s.is_completed)
        .map((s) => ({
          set_number: s.set_number,
          weight_kg: Number(s.weight_kg) || 0,
          reps_completed: Number(s.reps_completed) || 0,
        }));
      if (completedSets.length > 0) {
        exercisesSummary.push({
          name: ex.name,
          target_muscle: ex.target_muscle,
          sets: completedSets,
        });
      }
    });

    const newSession: SavedWorkoutSession = {
      id: workoutLogId || `session-${Date.now()}`,
      date: new Date().toISOString(),
      session_type: activeSession,
      duration_seconds: durationSecs,
      total_sets: setsCount,
      total_volume_kg: volume,
      exercises_summary: exercisesSummary,
      created_at: new Date().toISOString(),
    };

    setWorkoutHistory((prev) => {
      const updated = [newSession, ...prev];
      localStorage.setItem('ironpulse_workout_history', JSON.stringify(updated));
      return updated;
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
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const completedSetsTotal = Object.values(setLogsState).reduce(
    (acc, sets) => acc + sets.filter((s) => s.is_completed).length,
    0
  );
  const totalSetsAvailable = exercises.length * 3;

  function handleOpenHistory() {
    if (onNavigateToHistory) {
      onNavigateToHistory();
    } else {
      setIsHistoryModalOpen(true);
    }
  }

  return (
    <div className="pb-36 pt-1 space-y-4">
      {/* Session Switcher Pill */}
      {!isWorkoutActive && (
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-xl">
            <button
              onClick={() => {
                playShortClickSound();
                setActiveSession('A');
                setIsRestDay(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                !isRestDay && activeSession === 'A'
                  ? 'bg-white text-[#1D1D1F] font-semibold shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              Sesi A
            </button>
            <button
              onClick={() => {
                playShortClickSound();
                setActiveSession('B');
                setIsRestDay(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                !isRestDay && activeSession === 'B'
                  ? 'bg-white text-[#1D1D1F] font-semibold shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              Sesi B
            </button>
            <button
              onClick={() => {
                playShortClickSound();
                setIsRestDay(true);
              }}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                isRestDay
                  ? 'bg-white text-[#1D1D1F] font-semibold shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              Rest
            </button>
          </div>

          <button
            onClick={handleOpenHistory}
            className="text-xs text-[#8F6B27] hover:text-[#1D1D1F] font-semibold flex items-center gap-1 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat</span>
          </button>
        </div>
      )}

      {/* ACTIVE WORKOUT STOPWATCH BAR (Sticky) */}
      {isWorkoutActive && (
        <div className="sticky top-2 z-20 bg-[#1D1D1F]/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-lg border border-stone-800 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] animate-pulse" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-300 font-semibold">
                Sesi {activeSession} Berlangsung
              </p>
              <p className="text-xl font-bold font-mono tracking-tight text-white">
                {formatDuration(workoutElapsedTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-stone-300">
              {completedSetsTotal}/{totalSetsAvailable} set
            </span>
            <button
              onClick={handleCancelWorkout}
              className="text-[11px] text-stone-400 hover:text-rose-400 px-2 py-1 rounded-lg border border-stone-700 hover:border-rose-400 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* WORKOUT CONTENT */}
      {isRestDay && !isWorkoutActive ? (
        /* REST DAY VIEW */
        <div className="bg-white rounded-2xl p-6 border border-stone-200/80 text-center space-y-4 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-[#86868B] uppercase tracking-wider">
              Hari Istirahat & Nutrisi
            </span>
            <h3 className="text-base font-bold text-[#1D1D1F] pt-1">Fokus Pemulihan Otot</h3>
            <p className="text-xs text-[#86868B] max-w-xs mx-auto leading-relaxed">
              Otot berkembang saat istirahat dan nutrisi tercukupi. Pastikan target 100g protein dan 2.500ml air terpenuhi.
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

          <div className="pt-2 space-y-2">
            <button
              onClick={() => handleStartWorkout('A')}
              className="w-full py-2.5 rounded-xl bg-[#FAF4E6] text-[#8F6B27] border border-[#E8D4A8]/80 text-xs font-semibold active:scale-98 transition-all"
            >
              Latihan Manual: Mulai Sesi A
            </button>
            <button
              onClick={() => handleStartWorkout('B')}
              className="w-full py-2.5 rounded-xl bg-stone-100 text-[#1D1D1F] text-xs font-semibold active:scale-98 transition-all"
            >
              Latihan Manual: Mulai Sesi B
            </button>
          </div>
        </div>
      ) : !isWorkoutActive ? (
        /* PREVIEW MODE: BEFORE STARTING WORKOUT */
        <div className="space-y-4">
          {/* Preview Header Card */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF4E6] text-[#8F6B27] border border-[#E8D4A8]/70">
                    Sesi {activeSession}
                  </span>
                  <span className="text-xs text-[#86868B]">
                    {formatIndonesianDate()}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#1D1D1F] mt-1.5 whitespace-nowrap truncate">
                  {activeSession === 'A'
                    ? 'Dada, Punggung, Bahu, Paha, Bicep'
                    : 'Punggung, Dada Atas, Hamstring, Tricep'}
                </h3>
                <p className="text-xs text-[#86868B] mt-0.5">
                  {exercises.length} Gerakan • {exercises.length * 3} Set Total • Estimasi 45-60 Menit
                </p>
              </div>
            </div>

            {/* Big Play Button */}
            <button
              onClick={() => handleStartWorkout()}
              className="w-full py-3.5 px-4 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Mulai Latihan</span>
            </button>
          </div>

          {/* Exercise Preview List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-xs text-[#86868B]">
              <span>Rencana Gerakan Hari Ini</span>
              <span>{exercises.length} Gerakan</span>
            </div>

            {exercises.map((exercise, index) => {
              const hint = getPreviousExerciseHint(exercise.name);
              return (
                <div
                  key={exercise.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200/70 shadow-sm flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-[#86868B]">
                        0{index + 1}
                      </span>
                      <h4 className="text-xs font-semibold text-[#1D1D1F]">
                        {exercise.name}
                      </h4>
                    </div>

                    <div className="text-[11px] text-[#86868B] space-y-0.5">
                      <div>
                        Otot: <span className="text-stone-700 font-medium">{exercise.target_muscle}</span>
                      </div>
                      <div>
                        Target: <span className="text-stone-700 font-medium">{exercise.target_reps} reps (3 set)</span>
                      </div>
                      {hint && (
                        <div className="text-[#8F6B27] font-mono font-medium pt-0.5">
                          Sesi lalu: <span>{hint}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono bg-stone-100 text-[#86868B] px-2 py-1 rounded-lg flex-shrink-0">
                    3 Set
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ACTIVE WORKOUT MODE: FULL INTERACTIVE SET INPUTS */
        <>
          <div className="flex items-center justify-between text-xs px-0.5 text-[#86868B]">
            <span>Sesi {activeSession} Aktif</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#1D1D1F]">
                {completedSetsTotal}/{totalSetsAvailable} set
              </span>
            </div>
          </div>

          {/* Exercise List */}
          <div className="space-y-3">
            {exercises.map((exercise, index) => {
              const sets =
                setLogsState[exercise.id] && setLogsState[exercise.id].length > 0
                  ? setLogsState[exercise.id]
                  : Array.from({ length: exercise.default_sets || 3 }).map((_, i) => ({
                      set_number: i + 1,
                      weight_kg: '',
                      reps_completed: '',
                      is_completed: false,
                    }));

              const hint = getPreviousExerciseHint(exercise.name);

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
                      <div className="mt-2 space-y-0.5 text-[11px]">
                        <div className="text-[#86868B]">
                          Otot: <span className="text-stone-700 font-medium">{exercise.target_muscle}</span>
                        </div>
                        <div className="text-[#86868B]">
                          Target: <span className="text-stone-700 font-medium">{exercise.target_reps} reps</span>
                        </div>
                        {hint && (
                          <div className="text-[#8F6B27] font-mono font-medium pt-0.5">
                            Sesi lalu: <span>{hint}</span>
                          </div>
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
              className="w-full py-3.5 rounded-xl bg-[#1D1D1F] text-white font-semibold text-xs tracking-wide active:scale-98 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Selesaikan Latihan ({formatDuration(workoutElapsedTime)})</span>
            </button>

            <button
              onClick={handleResetWorkout}
              className="w-full py-1.5 text-[#86868B] hover:text-[#1D1D1F] text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Centang</span>
            </button>
          </div>
        </>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-xl border border-stone-200/80 text-center space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF4E6] text-[#8F6B27] border border-[#E8D4A8]/70">
                Sesi {activeSession}
              </span>
              <h3 className="text-base font-bold text-[#1D1D1F] pt-1">Sesi Latihan Selesai</h3>
              <p className="text-xs text-[#86868B]">Data latihan berhasil disimpan ke riwayat.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1 text-left">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-[10px] text-[#86868B] uppercase tracking-wider">Durasi</span>
                <p className="text-sm font-bold text-[#1D1D1F] font-mono mt-0.5">
                  {formatDuration(completedSummary.durationSeconds)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-[10px] text-[#86868B] uppercase tracking-wider">Set</span>
                <p className="text-sm font-bold text-[#1D1D1F] font-mono mt-0.5">
                  {completedSummary.totalSets} Set
                </p>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-[10px] text-[#86868B] uppercase tracking-wider">Beban</span>
                <p className="text-sm font-bold text-[#8F6B27] font-mono mt-0.5">
                  {completedSummary.totalVolumeKg} kg
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  handleOpenHistory();
                }}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#1D1D1F] text-xs font-semibold transition-all"
              >
                Lihat Riwayat
              </button>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#1D1D1F] text-white text-xs font-semibold active:scale-98 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout History Modal (Fallback) */}
      <WorkoutHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        sessions={workoutHistory}
        onDeleteSession={(id) => {
          const updated = workoutHistory.filter((s) => s.id !== id);
          setWorkoutHistory(updated);
          localStorage.setItem('ironpulse_workout_history', JSON.stringify(updated));
        }}
      />
    </div>
  );
}
