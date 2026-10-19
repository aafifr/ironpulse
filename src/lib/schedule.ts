import { SessionType } from '@/types/database';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatIndonesianDate(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

export interface DaySchedule {
  isRestDay: boolean;
  recommendedSession: SessionType | null;
  dayName: string;
  sessionDescription: string;
}

export function getTodaySchedule(customDayIndex?: number): DaySchedule {
  const day = typeof customDayIndex === 'number' ? customDayIndex : new Date().getDay();

  // 0: Minggu, 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jumat, 6: Sabtu
  switch (day) {
    case 1: // Senin
      return {
        isRestDay: false,
        recommendedSession: 'A',
        dayName: 'Senin',
        sessionDescription: 'Sesi A: Dada, Punggung, Bahu, Paha, Bicep',
      };
    case 3: // Rabu
      return {
        isRestDay: false,
        recommendedSession: 'B',
        dayName: 'Rabu',
        sessionDescription: 'Sesi B: Punggung, Dada Atas, Bahu Samping, Hamstring, Tricep',
      };
    case 5: // Jumat
      return {
        isRestDay: false,
        recommendedSession: 'A',
        dayName: 'Jumat',
        sessionDescription: 'Sesi A: Dada, Punggung, Bahu, Paha, Bicep',
      };
    case 2: // Selasa
      return {
        isRestDay: true,
        recommendedSession: null,
        dayName: 'Selasa',
        sessionDescription: 'Rest Day (Pemulihan Otot & Nutrisi)',
      };
    case 4: // Kamis
      return {
        isRestDay: true,
        recommendedSession: null,
        dayName: 'Kamis',
        sessionDescription: 'Rest Day (Pemulihan Otot & Nutrisi)',
      };
    case 6: // Sabtu
      return {
        isRestDay: true,
        recommendedSession: null,
        dayName: 'Sabtu',
        sessionDescription: 'Rest Day (Pemulihan Otot & Nutrisi)',
      };
    case 0: // Minggu
    default:
      return {
        isRestDay: true,
        recommendedSession: null,
        dayName: 'Minggu',
        sessionDescription: 'Rest Day (Pemulihan Otot & Nutrisi)',
      };
  }
}

export interface WeekDayItem {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNum: number;
  dayShort: string; // Sen, Sel, Rab, Kam, Jum, Sab, Min
  isToday: boolean;
  dayIndex: number;
  sessionType: SessionType | null;
}

export function getCurrentWeekDays(baseDate = new Date()): WeekDayItem[] {
  const current = new Date(baseDate);
  const day = current.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);

  const daysShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const todayStr = getTodayDateString();

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayDate = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayDate}`;
    const dayIdx = d.getDay();

    let sessionType: SessionType | null = null;
    if (dayIdx === 1 || dayIdx === 5) sessionType = 'A';
    if (dayIdx === 3) sessionType = 'B';

    return {
      date: d,
      dateString,
      dayNum: d.getDate(),
      dayShort: daysShort[dayIdx],
      isToday: dateString === todayStr,
      dayIndex: dayIdx,
      sessionType,
    };
  });
}
