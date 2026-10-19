'use client';

import React, { useState, useEffect } from 'react';
import { DailyNutrition } from '@/types/database';
import { getTodayDateString } from '@/lib/schedule';
import { playShortClickSound } from '@/lib/audio';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface MealItem {
  id: 'breakfast_done' | 'lunch_done' | 'gainer_done' | 'dinner_done';
  title: string;
  proteinGrams: number;
  timeHint: string;
}

const MEAL_ITEMS: MealItem[] = [
  {
    id: 'breakfast_done',
    title: 'Sarapan Pagi',
    proteinGrams: 18,
    timeHint: 'Telur / Oatmeal',
  },
  {
    id: 'lunch_done',
    title: 'Makan Siang',
    proteinGrams: 35,
    timeHint: 'Ayam / Daging + Nasi',
  },
  {
    id: 'gainer_done',
    title: 'Pro Gainer / Camilan',
    proteinGrams: 25,
    timeHint: 'Shake Susu + Pisang',
  },
  {
    id: 'dinner_done',
    title: 'Makan Malam',
    proteinGrams: 30,
    timeHint: 'Porsi Tinggi Protein',
  },
];

const TARGET_PROTEIN = 100; // grams
const TARGET_WATER = 2500; // ml

export function NutritionTab() {
  const today = getTodayDateString();
  const [nutrition, setNutrition] = useState<DailyNutrition>({
    date: today,
    breakfast_done: false,
    lunch_done: false,
    gainer_done: false,
    dinner_done: false,
    water_ml: 0,
  });

  useEffect(() => {
    async function fetchDailyNutrition() {
      const cached = localStorage.getItem(`ironpulse_nutrition_${today}`);
      if (cached) {
        try {
          setNutrition(JSON.parse(cached));
        } catch {
          // ignore
        }
      }

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('daily_nutrition')
            .select('*')
            .eq('date', today)
            .maybeSingle();

          if (!error && data) {
            setNutrition(data as DailyNutrition);
            localStorage.setItem(`ironpulse_nutrition_${today}`, JSON.stringify(data));
          }
        } catch (err) {
          console.warn('Error fetching nutrition from Supabase:', err);
        }
      }
    }

    fetchDailyNutrition();
  }, [today]);

  async function persistNutrition(updated: DailyNutrition) {
    setNutrition(updated);
    localStorage.setItem(`ironpulse_nutrition_${today}`, JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('daily_nutrition').upsert(
          {
            date: today,
            breakfast_done: updated.breakfast_done,
            lunch_done: updated.lunch_done,
            gainer_done: updated.gainer_done,
            dinner_done: updated.dinner_done,
            water_ml: updated.water_ml,
          },
          { onConflict: 'date' }
        );
      } catch (err) {
        console.warn('Could not sync nutrition to Supabase:', err);
      }
    }
  }

  function toggleMeal(field: 'breakfast_done' | 'lunch_done' | 'gainer_done' | 'dinner_done') {
    playShortClickSound();
    const updated = {
      ...nutrition,
      [field]: !nutrition[field],
    };
    persistNutrition(updated);
  }

  function handleAddWater(amount: number) {
    playShortClickSound();
    const newAmount = Math.max(0, nutrition.water_ml + amount);
    const updated = {
      ...nutrition,
      water_ml: newAmount,
    };
    persistNutrition(updated);
  }

  const currentProtein = MEAL_ITEMS.reduce((total, item) => {
    return total + (nutrition[item.id] ? item.proteinGrams : 0);
  }, 0);

  const proteinPercentage = Math.min(100, Math.round((currentProtein / TARGET_PROTEIN) * 100));
  const waterPercentage = Math.min(100, Math.round((nutrition.water_ml / TARGET_WATER) * 100));

  return (
    <div className="pb-28 pt-2 space-y-4">
      {/* Protein Big Metric Card (Apple Health Style) */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/70 shadow-sm space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider block">
              Asupan Protein
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-bold font-mono text-[#1D1D1F]">{currentProtein}</span>
              <span className="text-sm font-medium text-[#86868B]">/ {TARGET_PROTEIN}g</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-semibold font-mono text-[#8F6B27]">
              {proteinPercentage}%
            </span>
            <p className="text-[11px] text-[#86868B]">
              {currentProtein >= TARGET_PROTEIN ? 'Tercapai' : `Sisa ${TARGET_PROTEIN - currentProtein}g`}
            </p>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-[#C5A059] transition-all duration-300 rounded-full"
            style={{ width: `${proteinPercentage}%` }}
          />
        </div>
      </div>

      {/* Meal Checklist */}
      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm divide-y divide-stone-100 overflow-hidden">
        {MEAL_ITEMS.map((meal) => {
          const isDone = nutrition[meal.id];

          return (
            <div
              key={meal.id}
              onClick={() => toggleMeal(meal.id)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50/50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isDone ? 'text-stone-400 line-through' : 'text-[#1D1D1F]'}`}>
                    {meal.title}
                  </span>
                  <span className="text-xs font-mono font-medium text-[#8F6B27]">
                    +{meal.proteinGrams}g
                  </span>
                </div>
                <p className="text-xs text-[#86868B] mt-0.5">{meal.timeHint}</p>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-[#C5A059] text-white shadow-sm'
                    : 'border border-stone-300 hover:border-stone-400'
                }`}
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
              </div>
            </div>
          );
        })}
      </div>

      {/* Water Tracker Card */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/70 shadow-sm space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider block">
              Konsumsi Air
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold font-mono text-[#1D1D1F]">{nutrition.water_ml}</span>
              <span className="text-xs font-medium text-[#86868B]">/ {TARGET_WATER} ml</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-semibold font-mono text-[#8F6B27]">
              {waterPercentage}%
            </span>
          </div>
        </div>

        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-[#C5A059] transition-all duration-300 rounded-full"
            style={{ width: `${waterPercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => handleAddWater(250)}
            className="py-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-xs font-medium text-[#1D1D1F] active:scale-95 transition-all"
          >
            +250 ml
          </button>
          <button
            onClick={() => handleAddWater(500)}
            className="py-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-xs font-medium text-[#1D1D1F] active:scale-95 transition-all"
          >
            +500 ml
          </button>
          <button
            onClick={() => handleAddWater(-250)}
            className="py-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-xs font-medium text-[#86868B] active:scale-95 transition-all"
          >
            -250 ml
          </button>
        </div>
      </div>
    </div>
  );
}
