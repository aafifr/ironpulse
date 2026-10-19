'use client';

import React from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConfigModal({ isOpen, onClose }: ConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-xl border border-stone-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Status Supabase</h3>
            <p className="text-[11px] text-[#86868B]">Penyimpanan Data Cloud</p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 text-sm font-medium p-1 transition-colors"
          >
            Tutup
          </button>
        </div>

        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center gap-2.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isSupabaseConfigured ? 'bg-[#C5A059]' : 'bg-stone-300'
            }`}
          />
          <div className="text-xs">
            <p className="font-semibold text-[#1D1D1F]">
              {isSupabaseConfigured ? 'Terkoneksi ke Cloud' : 'Mode Offline / Lokal'}
            </p>
            <p className="text-[11px] text-[#86868B] mt-0.5">
              {isSupabaseConfigured
                ? 'Data tersimpan otomatis di Supabase.'
                : 'Data disimpan di memori browser (localStorage).'}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-stone-600">
          <p className="font-semibold text-[#1D1D1F]">Tabel Database:</p>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-stone-500">
            <span>• exercises</span>
            <span>• workout_logs</span>
            <span>• set_logs</span>
            <span>• daily_nutrition</span>
            <span>• weight_logs</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#1D1D1F] text-white text-xs font-semibold active:scale-98 transition-all"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}
