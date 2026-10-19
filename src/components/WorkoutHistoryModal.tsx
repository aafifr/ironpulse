'use client';

import React, { useState } from 'react';
import { SavedWorkoutSession } from '@/types/database';
import { formatIndonesianDate } from '@/lib/schedule';
import { playShortClickSound } from '@/lib/audio';

interface WorkoutHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedWorkoutSession[];
  onDeleteSession: (id: string) => void;
}

export function WorkoutHistoryModal({
  isOpen,
  onClose,
  sessions,
  onDeleteSession,
}: WorkoutHistoryModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="max-w-md w-full max-h-[85vh] bg-white rounded-3xl p-6 shadow-2xl border border-stone-200/80 flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F]">Riwayat Latihan</h3>
            <p className="text-[11px] text-[#86868B]">
              {sessions.length > 0 ? `${sessions.length} sesi tersimpan` : 'Belum ada data sesi'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-stone-500 hover:text-stone-900 font-medium py-1 px-2.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            Tutup
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#86868B] space-y-1">
              <p className="font-semibold text-[#1D1D1F]">Belum ada riwayat latihan</p>
              <p>Selesaikan sesi latihan pertamamu dan klik tombol Selesaikan Latihan untuk mencatat rekor di sini.</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isExpanded = expandedId === session.id;

              return (
                <div
                  key={session.id}
                  className="bg-stone-50 rounded-2xl p-4 border border-stone-200/70 space-y-2.5 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF4E6] text-[#8F6B27] border border-[#E8D4A8]/70">
                          Sesi {session.session_type}
                        </span>
                        <span className="text-xs font-semibold text-[#1D1D1F]">
                          {formatIndonesianDate(session.date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        <span className="font-mono font-bold text-[#8F6B27]">
                          {session.total_volume_kg.toLocaleString()} kg
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="text-[#86868B]">
                          {session.total_sets} set
                        </span>
                        {session.duration_seconds && (
                          <>
                            <span className="text-stone-300">•</span>
                            <span className="text-[#86868B] font-mono">
                              {Math.floor(session.duration_seconds / 60)}m {session.duration_seconds % 60}s
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          playShortClickSound();
                          setExpandedId(isExpanded ? null : session.id);
                        }}
                        className="text-xs text-stone-500 hover:text-[#1D1D1F] px-2 py-1 rounded-lg hover:bg-stone-200/60 font-medium transition-colors"
                      >
                        {isExpanded ? 'Tutup' : 'Detail'}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Breakdown */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-stone-200/70 space-y-2 text-xs">
                      {session.exercises_summary.map((ex, i) => (
                        <div key={i} className="bg-white rounded-xl p-2.5 border border-stone-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-[#1D1D1F] text-[11px]">{ex.name}</span>
                            <span className="text-[10px] text-[#86868B]">{ex.target_muscle}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 text-[11px] font-mono text-[#86868B]">
                            {ex.sets.map((s, si) => (
                              <span key={si} className="bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200/50">
                                S{s.set_number}: {s.weight_kg}kg×{s.reps_completed}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => {
                            if (confirm('Hapus sesi latihan ini dari riwayat?')) {
                              onDeleteSession(session.id);
                            }
                          }}
                          className="text-[11px] text-stone-400 hover:text-rose-500 transition-colors"
                        >
                          Hapus dari Riwayat
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#1D1D1F] text-white text-xs font-semibold active:scale-98 transition-all"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
