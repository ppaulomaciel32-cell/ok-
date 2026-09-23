import { Habit, HabitCategory, HabitTimeOfDay } from '../types';

export function getHabitCategory(habit: Habit): HabitCategory {
  if (habit.category) return habit.category;
  const lower = habit.name.toLowerCase();
  if (lower.includes('bíblia') || lower.includes('biblia') || lower.includes('oração') || lower.includes('oracao') || lower.includes('culto') || lower.includes('deus') || lower.includes('igreja')) {
    return 'spiritual';
  }
  if (lower.includes('academia') || lower.includes('corrida') || lower.includes('treino') || lower.includes('água') || lower.includes('agua') || lower.includes('caminhada') || lower.includes('exercício') || lower.includes('peso') || lower.includes('sono')) {
    return 'health';
  }
  if (lower.includes('leitura') || lower.includes('livro') || lower.includes('medita') || lower.includes('foco') || lower.includes('mente') || lower.includes('estudo') || lower.includes('curso')) {
    return 'mind';
  }
  if (lower.includes('reunião') || lower.includes('revisao') || lower.includes('revisão') || lower.includes('planejamento') || lower.includes('trabalho') || lower.includes('negócio') || lower.includes('cliente')) {
    return 'business';
  }
  return 'other';
}

export function getCategoryLabel(category: HabitCategory): { label: string; color: string; badgeBg: string; badgeText: string } {
  switch (category) {
    case 'health':
      return { label: 'Saúde & Físico', color: '#10b981', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeText: 'text-emerald-700' };
    case 'spiritual':
      return { label: 'Espiritual & Alma', color: '#8b5cf6', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200', badgeText: 'text-purple-700' };
    case 'mind':
      return { label: 'Mental & Intelecto', color: '#3b82f6', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200', badgeText: 'text-blue-700' };
    case 'business':
      return { label: 'Liderança & Negócio', color: '#f59e0b', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200', badgeText: 'text-amber-700' };
    default:
      return { label: 'Rotina Geral', color: '#64748b', badgeBg: 'bg-slate-50 text-slate-700 border-slate-200', badgeText: 'text-slate-700' };
  }
}

export function getTimeOfDayLabel(time?: HabitTimeOfDay): { label: string; period: string; iconName: string } {
  switch (time) {
    case 'morning':
      return { label: 'Manhã', period: '06h - 12h', iconName: 'Sun' };
    case 'afternoon':
      return { label: 'Tarde', period: '12h - 18h', iconName: 'Sunrise' };
    case 'evening':
      return { label: 'Noite', period: '18h - 23h', iconName: 'Moon' };
    default:
      return { label: 'Livre', period: 'Qualquer hora', iconName: 'Clock' };
  }
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatISODate(new Date());
}

export function getLastNDays(daysCount: number = 7): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(formatISODate(d));
  }
  return dates;
}

export function calculateHabitStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) return 0;
  
  const dateSet = new Set(completedDates);
  const today = getTodayDateString();
  const todayDate = new Date();
  
  // Check if completed today, or if yesterday was completed
  let currentDate = new Date(todayDate);
  let streak = 0;
  
  const todayStr = formatISODate(currentDate);
  const completedToday = dateSet.has(todayStr);

  if (!completedToday) {
    // If not completed today, check if yesterday was completed
    currentDate.setDate(currentDate.getDate() - 1);
    const yesterdayStr = formatISODate(currentDate);
    if (!dateSet.has(yesterdayStr)) {
      return 0; // streak broken
    }
  }

  // Count backwards
  while (true) {
    const dateStr = formatISODate(currentDate);
    if (dateSet.has(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateLongestStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) return 0;
  const sortedDates = Array.from(new Set(completedDates)).sort();
  if (sortedDates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    
    // Difference in days
    const diffTime = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return Math.max(maxStreak, calculateHabitStreak(completedDates));
}

export interface DayMetricPoint {
  date: string;
  dayShort: string;
  dayNumber: number;
  completedCount: number;
  totalHabits: number;
  rate: number;
  isToday: boolean;
}

export function getHabitConsistencyMetrics(habits: Habit[]) {
  const today = getTodayDateString();
  const totalHabits = habits.length;
  
  const completedTodayHabits = habits.filter(h => h.completedDates?.includes(today));
  const completedTodayCount = completedTodayHabits.length;
  const todayRate = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  // Last 7 days metrics
  const last7Days = getLastNDays(7);
  const dayPoints: DayMetricPoint[] = last7Days.map(dateStr => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const completed = habits.filter(h => h.completedDates?.includes(dateStr)).length;
    const rate = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;

    return {
      date: dateStr,
      dayShort: dayNames[dateObj.getDay()],
      dayNumber: d,
      completedCount: completed,
      totalHabits,
      rate,
      isToday: dateStr === today
    };
  });

  const weeklyAverageRate = dayPoints.length > 0 
    ? Math.round(dayPoints.reduce((acc, p) => acc + p.rate, 0) / dayPoints.length) 
    : 0;

  // Last 30 days heatmap
  const last30Days = getLastNDays(30);
  let perfectDays = 0;
  const monthlyHeatmap = last30Days.map(dateStr => {
    const completed = habits.filter(h => h.completedDates?.includes(dateStr)).length;
    const rate = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;
    if (rate === 100 && totalHabits > 0) perfectDays++;
    return {
      date: dateStr,
      rate,
      completed
    };
  });

  // Streaks for all habits
  const streaks = habits.map(h => ({
    habit: h,
    currentStreak: calculateHabitStreak(h.completedDates || []),
    longestStreak: calculateLongestStreak(h.completedDates || [])
  }));

  const bestHabitStreak = streaks.reduce((max, curr) => curr.currentStreak > max.currentStreak ? curr : max, {
    habit: habits[0],
    currentStreak: 0,
    longestStreak: 0
  });

  // Categorize habits by time of day
  const morningHabits = habits.filter(h => h.timeOfDay === 'morning' || (!h.timeOfDay && h.name.toLowerCase().includes('bíblia')));
  const afternoonHabits = habits.filter(h => h.timeOfDay === 'afternoon');
  const eveningHabits = habits.filter(h => h.timeOfDay === 'evening' || (!h.timeOfDay && (h.name.toLowerCase().includes('treino') || h.name.toLowerCase().includes('academia'))));
  const anytimeHabits = habits.filter(h => !morningHabits.includes(h) && !afternoonHabits.includes(h) && !eveningHabits.includes(h));

  return {
    today,
    totalHabits,
    completedTodayCount,
    todayRate,
    weeklyAverageRate,
    dayPoints,
    monthlyHeatmap,
    perfectDays,
    streaks,
    bestHabitStreak,
    morningHabits,
    afternoonHabits,
    eveningHabits,
    anytimeHabits
  };
}
