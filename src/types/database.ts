export type SessionType = 'A' | 'B';

export interface Exercise {
  id: string;
  session_type: SessionType;
  name: string;
  target_muscle: string;
  default_sets: number;
  target_reps: string;
  tips: string | null;
  image_url?: string;
  order_index: number;
}

export interface WorkoutLog {
  id: string;
  created_at: string;
  session_type: SessionType;
  notes: string | null;
}

export interface SetLog {
  id: string;
  workout_log_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps_completed: number;
  is_completed: boolean;
  created_at: string;
}

export interface DailyNutrition {
  id?: string;
  date: string; // YYYY-MM-DD
  breakfast_done: boolean;
  lunch_done: boolean;
  gainer_done: boolean;
  dinner_done: boolean;
  water_ml: number;
  created_at?: string;
}

export interface WeightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weight_kg: number;
  notes: string | null;
  created_at: string;
}

// Client UI helpers
export interface ExerciseSetItem {
  set_number: number;
  weight_kg: number | string;
  reps_completed: number | string;
  is_completed: boolean;
  db_id?: string;
}

export interface SavedWorkoutSession {
  id: string;
  date: string;
  session_type: SessionType;
  duration_seconds?: number;
  total_sets: number;
  total_volume_kg: number;
  exercises_summary: {
    name: string;
    target_muscle: string;
    sets: { set_number: number; weight_kg: number; reps_completed: number }[];
  }[];
  created_at: string;
}
