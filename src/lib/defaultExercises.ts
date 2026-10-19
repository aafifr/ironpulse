import { Exercise } from '@/types/database';

export const EXERCISE_IMAGES: { [key: string]: string } = {
  'Chest Press Machine': '/exercises/chest-press.jpg',
  'Lat Pulldown Machine': '/exercises/lat-pulldown.jpg',
  'Dumbbell Shoulder Press': '/exercises/shoulder-press.jpg',
  'Leg Press Machine': '/exercises/leg-press.jpg',
  'Dumbbell Bicep Curl': '/exercises/bicep-curl.jpg',
  'Seated Cable Row': '/exercises/cable-row.jpg',
  'Incline Press (Dumbbell/Machine)': '/exercises/incline-press.jpg',
  'Dumbbell Lateral Raise': '/exercises/lateral-raise.jpg',
  'Leg Curl Machine': '/exercises/leg-curl.jpg',
  'Rope Tricep Pushdown': '/exercises/tricep-pushdown.jpg',
};

export function getExerciseImage(name: string): string {
  return EXERCISE_IMAGES[name] || '/exercises/chest-press.jpg';
}

export const DEFAULT_EXERCISES: Omit<Exercise, 'id'>[] = [
  // Sesi A
  {
    session_type: 'A',
    name: 'Chest Press Machine',
    target_muscle: 'Dada',
    default_sets: 3,
    target_reps: '10-12',
    tips: 'Duduk tegak, dorong pegangan ke depan sejajar dada.',
    image_url: '/exercises/chest-press.jpg',
    order_index: 1,
  },
  {
    session_type: 'A',
    name: 'Lat Pulldown Machine',
    target_muscle: 'Punggung (Sayap)',
    default_sets: 3,
    target_reps: '10-12',
    tips: 'Tarik palang ke dada atas, busungkan dada.',
    image_url: '/exercises/lat-pulldown.jpg',
    order_index: 2,
  },
  {
    session_type: 'A',
    name: 'Dumbbell Shoulder Press',
    target_muscle: 'Bahu Depan',
    default_sets: 3,
    target_reps: '10-12',
    tips: 'Duduk senderan, dorong dumbbell lurus ke atas.',
    image_url: '/exercises/shoulder-press.jpg',
    order_index: 3,
  },
  {
    session_type: 'A',
    name: 'Leg Press Machine',
    target_muscle: 'Paha Depan & Bokong',
    default_sets: 3,
    target_reps: '10-12',
    tips: 'Kaki selebar bahu, dorong tanpa lock lutut kaku.',
    image_url: '/exercises/leg-press.jpg',
    order_index: 4,
  },
  {
    session_type: 'A',
    name: 'Dumbbell Bicep Curl',
    target_muscle: 'Lengan Depan',
    default_sets: 3,
    target_reps: '12',
    tips: 'Siku diam di samping badan, tekuk lengan ke atas.',
    image_url: '/exercises/bicep-curl.jpg',
    order_index: 5,
  },

  // Sesi B
  {
    session_type: 'B',
    name: 'Seated Cable Row',
    target_muscle: 'Punggung Tengah',
    default_sets: 3,
    target_reps: '10-12',
    tips: 'Duduk tegak, tarik pegangan ke arah perut bawah/pusar.',
    image_url: '/exercises/cable-row.jpg',
    order_index: 1,
  },
  {
    session_type: 'B',
    name: 'Incline Press (Dumbbell/Machine)',
    target_muscle: 'Dada Bagian Atas',
    default_sets: 3,
    target_reps: '10-12',
    tips: 'Bangku miring 30-45 derajat, dorong ke atas.',
    image_url: '/exercises/incline-press.jpg',
    order_index: 2,
  },
  {
    session_type: 'B',
    name: 'Dumbbell Lateral Raise',
    target_muscle: 'Bahu Samping',
    default_sets: 3,
    target_reps: '12-15',
    tips: 'Beban ringan (2-4 kg), angkat ke samping setinggi bahu.',
    image_url: '/exercises/lateral-raise.jpg',
    order_index: 3,
  },
  {
    session_type: 'B',
    name: 'Leg Curl Machine',
    target_muscle: 'Paha Belakang',
    default_sets: 3,
    target_reps: '10-12',
    tips: 'Mesin tekuk kaki posisi duduk atau tengkurap.',
    image_url: '/exercises/leg-curl.jpg',
    order_index: 4,
  },
  {
    session_type: 'B',
    name: 'Rope Tricep Pushdown',
    target_muscle: 'Lengan Belakang',
    default_sets: 3,
    target_reps: '12',
    tips: 'Tarik tali ke bawah, rentangkan ujung tali di akhir.',
    image_url: '/exercises/tricep-pushdown.jpg',
    order_index: 5,
  },
];
