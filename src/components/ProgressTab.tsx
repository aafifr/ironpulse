'use client';

import React, { useState, useEffect } from 'react';
import { WeightLog } from '@/types/database';
import { getTodayDateString, formatIndonesianDate } from '@/lib/schedule';
import { playShortClickSound } from '@/lib/audio';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const INITIAL_WEIGHT = 46.0;
const TARGET_WEIGHT_MIN = 52.0;

export function ProgressTab() {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [weightInput, setWeightInput] = useState<string>('');
  const [dateInput, setDateInput] = useState<string>(getTodayDateString());
  const [notesInput, setNotesInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function fetchWeightLogs() {
      const cached = localStorage.getItem('ironpulse_weight_logs');
      if (cached) {
        try {
          setLogs(JSON.parse(cached));
        } catch {
          // ignore
        }
      }

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('weight_logs')
            .select('*')
            .order('date', { ascending: false });

          if (!error && data && data.length > 0) {
            setLogs(data as WeightLog[]);
            localStorage.setItem('ironpulse_weight_logs', JSON.stringify(data));
          }
        } catch (err) {
          console.warn('Error fetching weight logs from Supabase:', err);
        }
      }
    }

    fetchWeightLogs();
  }, []);

  async function handleSubmitWeight(e: React.FormEvent) {
    e.preventDefault();
    const weightVal = parseFloat(weightInput);
    if (isNaN(weightVal) || weightVal <= 20 || weightVal >= 200) {
      alert('Masukkan angka berat badan yang valid (misal: 46.5)');
      return;
    }

    playShortClickSound();
    setIsSubmitting(true);

    const newLog: WeightLog = {
      id: `local-${Date.now()}`,
      date: dateInput || getTodayDateString(),
      weight_kg: weightVal,
      notes: notesInput.trim() || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('weight_logs')
          .insert({
            date: newLog.date,
            weight_kg: newLog.weight_kg,
            notes: newLog.notes,
          })
          .select()
          .single();

        if (!error && data) {
          newLog.id = data.id;
        }
      } catch (err) {
        console.warn('Could not save weight log to Supabase:', err);
      }
    }

    const updated = [newLog, ...logs.filter((l) => l.date !== newLog.date)].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setLogs(updated);
    localStorage.setItem('ironpulse_weight_logs', JSON.stringify(updated));

    setWeightInput('');
    setNotesInput('');
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus entri timbangan ini?')) return;

    playShortClickSound();
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    localStorage.setItem('ironpulse_weight_logs', JSON.stringify(updated));

    if (isSupabaseConfigured && !id.startsWith('local-')) {
      try {
        await supabase.from('weight_logs').delete().eq('id', id);
      } catch (e) {
        console.warn('Failed to delete from Supabase:', e);
      }
    }
  }

  const latestLog = logs[0];
  const currentWeight = latestLog ? Number(latestLog.weight_kg) : INITIAL_WEIGHT;
  const gainedKg = Math.round((currentWeight - INITIAL_WEIGHT) * 10) / 10;
  
  const targetDistance = TARGET_WEIGHT_MIN - INITIAL_WEIGHT;
  const currentDistance = Math.max(0, currentWeight - INITIAL_WEIGHT);
  const progressPercent = Math.min(100, Math.round((currentDistance / targetDistance) * 100));

  return (
    <div className="pb-28 pt-2 space-y-4">
      {/* Metric Overview (Apple Health Style) */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/70 shadow-sm space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider block">
              Berat Terkini
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-bold font-mono text-[#1D1D1F]">
                {currentWeight.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-[#86868B]">kg</span>

              {gainedKg !== 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#FAF4E6] text-[#8F6B27]">
                  {gainedKg > 0 ? `+${gainedKg}` : gainedKg} kg
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider block">
              Target
            </span>
            <p className="text-sm font-semibold font-mono text-[#1D1D1F] mt-0.5">
              52.0 — 55.0 kg
            </p>
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[11px] text-[#86868B]">
            <span>Mulai 46 kg</span>
            <span className="font-semibold text-[#8F6B27]">{progressPercent}%</span>
            <span>Target 52 kg</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-[#C5A059] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/70 shadow-sm space-y-3">
        <span className="text-xs font-semibold text-[#1D1D1F] block">
          Catat Timbangan
        </span>

        <form onSubmit={handleSubmitWeight} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-[#86868B] uppercase tracking-wider block mb-1">
                Berat (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="150"
                required
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="46.5"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-[#1D1D1F] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-[#86868B] uppercase tracking-wider block mb-1">
                Tanggal
              </label>
              <input
                type="date"
                required
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          <div>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Catatan kondisi (opsional, misal: pagi perut kosong)"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[#1D1D1F] text-white text-xs font-medium active:scale-98 transition-all"
          >
            Simpan Timbangan
          </button>
        </form>
      </div>

      {/* History List */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-[#86868B] px-1 block">
          Riwayat ({logs.length})
        </span>

        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center text-xs text-[#86868B] border border-stone-200/70">
            Belum ada catatan timbangan.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm divide-y divide-stone-100 overflow-hidden">
            {logs.map((item, idx) => {
              const previousItem = logs[idx + 1];
              const diff = previousItem
                ? Math.round((Number(item.weight_kg) - Number(previousItem.weight_kg)) * 10) / 10
                : null;

              return (
                <div
                  key={item.id}
                  className="p-3.5 flex items-center justify-between hover:bg-stone-50/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold font-mono text-[#1D1D1F]">
                        {Number(item.weight_kg).toFixed(1)} kg
                      </span>
                      {diff !== null && (
                        <span className="text-[11px] font-mono font-medium text-[#8F6B27]">
                          {diff >= 0 ? `+${diff}` : diff} kg
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#86868B] mt-0.5">
                      {formatIndonesianDate(item.date)}
                      {item.notes ? ` • ${item.notes}` : ''}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
