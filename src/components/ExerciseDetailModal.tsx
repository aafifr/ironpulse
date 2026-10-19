'use client';

import React from 'react';
import { Exercise } from '@/types/database';
import { getExerciseImage } from '@/lib/defaultExercises';
import { X, Target, Repeat, Info } from 'lucide-react';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
}

export function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  if (!exercise) return null;

  const imageUrl = exercise.image_url || getExerciseImage(exercise.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="max-w-sm w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200/80 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Visual Image Header */}
        <div className="relative w-full aspect-square bg-stone-100 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-3">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#8F6B27] border border-[#E8D4A8] shadow-sm">
              Sesi {exercise.session_type}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F] leading-tight">
              {exercise.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-[#86868B]">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="text-stone-700 font-medium">{exercise.target_muscle}</span>
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="text-stone-700 font-medium">{exercise.target_reps} reps</span>
              </span>
            </div>
          </div>

          {/* Form Guide Card */}
          {exercise.tips && (
            <div className="bg-[#FAF4E6]/60 border border-[#E8D4A8]/70 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8F6B27]">
                <Info className="w-3.5 h-3.5" />
                <span>Panduan Postur & Gerakan</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-normal">
                {exercise.tips}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#1D1D1F] text-white text-xs font-semibold active:scale-98 transition-all"
          >
            Mengerti, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
