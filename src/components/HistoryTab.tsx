'use client';

import React, { useState, useEffect } from 'react';
import { SavedWorkoutSession } from '@/types/database';
import { formatIndonesianDate } from '@/lib/schedule';
import { playShortClickSound } from '@/lib/audio';
import { History, Dumbbell, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface HistoryTabProps {
  onStartNewWorkout?: () => void;
}

export function HistoryTab({ onStartNewWorkout }: HistoryTabProps) {
  const [sessions, setSessions] = useState<SavedWorkoutSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ironpulse_workout_history');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  function handleDeleteSession(id: string) {
    if (confirm('Hapus sesi latihan ini dari riwayat?')) {
      const updated = sessions.filter((s) => s.id !== id);
      setSessions(updated);
      localStorage.setItem('ironpulse_workout_history', JSON.stringify(updated));
    }
  }

  const totalVolumeAllTime = sessions.reduce((acc, s) => acc + (s.total_volume_kg || 0), 0);
  const totalSetsAllTime = sessions.reduce((acc, s) => acc + (s.total_sets || 0), 0);

  return (
    <div className="pb-36 pt-1 space-y-4">
      {/* Header Stat Card */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FAF4E6] flex items-center justify-center text-[#8F6B27]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">Riwayat Latihan</h3>
              <p className="text-[11px] text-[#86868B]">{sessions.length} sesi tersimpan</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
          <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/60">
            <span className="text-[10px] text-[#86868B] uppercase tracking-wider font-medium">Total Beban</span>
            <p className="text-sm font-bold text-[#8F6B27] font-mono mt-0.5">
              {totalVolumeAllTime.toLocaleString()} kg
            </p>
          </div>
          <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/60">
            <span className="text-[10px] text-[#86868B] uppercase tracking-wider font-medium">Total Set Selesai</span>
            <p className="text-sm font-bold text-[#1D1D1F] font-mono mt-0.5">
              {totalSetsAllTime} Set
            </p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-2.5">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-stone-200/70 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[#1D1D1F]">Belum Ada Sesi Latihan</h4>
              <p className="text-xs text-[#86868B] max-w-xs mx-auto">
                Mulai sesi latihan pertamamu melalui tombol Mulai di bawah untuk mencatat volume beban dan durasi.
              </p>
            </div>
            {onStartNewWorkout && (
              <button
                onClick={onStartNewWorkout}
                className="py-2.5 px-4 rounded-xl bg-[#1D1D1F] text-white text-xs font-semibold active:scale-98 transition-all"
              >
                Mulai Latihan Sekarang
              </button>
            )}
          </div>
        ) : (
          sessions.map((session) => {
            const isExpanded = expandedId === session.id;

            return (
              <div
                key={session.id}
                className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm space-y-3 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF4E6] text-[#8F6B27] border border-[#E8D4A8]/70">
                        Sesi {session.session_type}
                      </span>
                      <span className="text-xs font-semibold text-[#1D1D1F]">
                        {formatIndonesianDate(session.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs pt-0.5">
                      <span className="font-mono font-bold text-[#8F6B27]">
                        {session.total_volume_kg.toLocaleString()} kg
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="text-[#86868B]">{session.total_sets} set</span>
                      {session.duration_seconds && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="text-[#86868B] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {Math.floor(session.duration_seconds / 60)}m {session.duration_seconds % 60}s
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      playShortClickSound();
                      setExpandedId(isExpanded ? null : session.id);
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-[#1D1D1F] hover:bg-stone-100 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expandable Breakdown */}
                {isExpanded && (
                  <div className="pt-2 border-t border-stone-100 space-y-2 text-xs animate-in fade-in duration-150">
                    {session.exercises_summary && session.exercises_summary.length > 0 ? (
                      session.exercises_summary.map((ex, i) => (
                        <div key={i} className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-[#1D1D1F] text-[11px]">{ex.name}</span>
                            <span className="text-[10px] text-[#86868B]">{ex.target_muscle}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 text-[11px] font-mono text-[#86868B]">
                            {ex.sets.map((s, si) => (
                              <span
                                key={si}
                                className="bg-white px-1.5 py-0.5 rounded border border-stone-200/60"
                              >
                                S{s.set_number}: {s.weight_kg}kg×{s.reps_completed}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-[#86868B]">Detail gerakan tidak tersedia.</p>
                    )}

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-[11px] text-stone-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Sesi</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
