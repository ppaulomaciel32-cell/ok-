import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Habit, DailyMetrics, HabitCategory, HabitTimeOfDay } from '../types';
import { 
  CheckCircle2, 
  Flame, 
  Calendar, 
  TrendingUp, 
  Sun, 
  Sunrise, 
  Moon, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Activity, 
  BookOpen, 
  Heart, 
  Zap, 
  Award, 
  BarChart3, 
  Sparkles,
  Check,
  ChevronRight,
  Filter,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  getHabitCategory, 
  getCategoryLabel, 
  getTodayDateString, 
  getHabitConsistencyMetrics, 
  calculateHabitStreak, 
  calculateLongestStreak,
  getLastNDays,
  formatISODate
} from '../lib/habitUtils';

interface HabitFlowDashboardProps {
  habits: Habit[];
  metrics: DailyMetrics;
  onUpdateHabit: (id: string, date: string) => void;
  onAddHabit: (habit: Omit<Habit, 'id'> & { id?: string }) => void;
  onDeleteHabit: (id: string) => void;
  onUpdateEnergy?: (level: number) => void;
  onUpdateEnergyReason?: (reason: string) => void;
}

export function HabitFlowDashboard({
  habits,
  metrics,
  onUpdateHabit,
  onAddHabit,
  onDeleteHabit,
  onUpdateEnergy,
  onUpdateEnergyReason
}: HabitFlowDashboardProps) {
  const today = getTodayDateString();
  const [activeView, setActiveView] = useState<'flow' | 'dashboard' | 'week_matrix'>('flow');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New habit form state
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('health');
  const [newHabitTimeOfDay, setNewHabitTimeOfDay] = useState<HabitTimeOfDay>('morning');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly'>('daily');

  // Comprehensive analytics
  const telemetry = useMemo(() => getHabitConsistencyMetrics(habits), [habits]);
  const last7Days = useMemo(() => getLastNDays(7), []);

  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'all') return habits;
    return habits.filter(h => getHabitCategory(h) === selectedCategory);
  }, [habits, selectedCategory]);

  const handleCreateHabit = () => {
    if (!newHabitName.trim()) return;
    onAddHabit({
      id: Math.random().toString(36).substring(2, 9),
      name: newHabitName.trim(),
      frequency: newHabitFrequency,
      completedDates: [],
      category: newHabitCategory,
      timeOfDay: newHabitTimeOfDay,
      createdAt: new Date().toISOString()
    });
    setNewHabitName('');
    setShowAddModal(false);
  };

  const getHabitIcon = (name: string, category: HabitCategory) => {
    const lower = name.toLowerCase();
    if (lower.includes('bíblia') || lower.includes('biblia') || lower.includes('oração') || lower.includes('oracao') || lower.includes('culto')) {
      return <BookOpen size={18} />;
    }
    if (lower.includes('corrida') || lower.includes('academia') || lower.includes('treino')) {
      return <Activity size={18} />;
    }
    if (lower.includes('água') || lower.includes('agua')) {
      return <Heart size={18} />;
    }
    if (category === 'mind') return <Sparkles size={18} />;
    if (category === 'business') return <Zap size={18} />;
    if (category === 'spiritual') return <BookOpen size={18} />;
    return <Activity size={18} />;
  };

  // Group habits for the "Fluxo do Dia" (timeline flow)
  const timePeriods = [
    {
      id: 'morning',
      title: 'Fluxo da Manhã',
      period: '06h — 12h',
      icon: Sun,
      color: 'text-amber-500 bg-amber-50 border-amber-200',
      habits: filteredHabits.filter(h => {
        const time = h.timeOfDay || (h.name.toLowerCase().includes('bíblia') ? 'morning' : 'any');
        return time === 'morning';
      })
    },
    {
      id: 'afternoon',
      title: 'Fluxo da Tarde',
      period: '12h — 18h',
      icon: Sunrise,
      color: 'text-orange-500 bg-orange-50 border-orange-200',
      habits: filteredHabits.filter(h => h.timeOfDay === 'afternoon')
    },
    {
      id: 'evening',
      title: 'Fluxo da Noite',
      period: '18h — 23h',
      icon: Moon,
      color: 'text-indigo-500 bg-indigo-50 border-indigo-200',
      habits: filteredHabits.filter(h => {
        const time = h.timeOfDay || (h.name.toLowerCase().includes('academia') || h.name.toLowerCase().includes('treino') ? 'evening' : 'any');
        return time === 'evening';
      })
    },
    {
      id: 'any',
      title: 'Fluxo Flexível',
      period: 'Ao longo do dia',
      icon: Clock,
      color: 'text-slate-600 bg-slate-50 border-slate-200',
      habits: filteredHabits.filter(h => {
        const isMorning = h.timeOfDay === 'morning' || (!h.timeOfDay && h.name.toLowerCase().includes('bíblia'));
        const isAfternoon = h.timeOfDay === 'afternoon';
        const isEvening = h.timeOfDay === 'evening' || (!h.timeOfDay && (h.name.toLowerCase().includes('academia') || h.name.toLowerCase().includes('treino')));
        return !isMorning && !isAfternoon && !isEvening;
      })
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Main KPIs */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[36px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
                Bio-Produtividade & Cadência Diária
              </span>
              <span className="text-white/20">•</span>
              <span className="text-[10px] font-bold text-white/60">
                Grupo Tome Nota
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Painel de Hábitos & Fluxo Pessoal
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl font-medium">
              Atualize ao longo do dia para manter sua energia alinhada com as metas operacionais do Grupo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Novo Hábito</span>
            </button>
          </div>
        </div>

        {/* Real-time Progress Bar of the Day */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* KPI 1: Conclusão Hoje */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Hoje Concluído</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">{telemetry.todayRate}%</span>
              <span className="text-xs text-white/40 font-bold">({telemetry.completedTodayCount}/{telemetry.totalHabits})</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${telemetry.todayRate}%` }}
                className="h-full bg-emerald-400"
              />
            </div>
          </div>

          {/* KPI 2: Sequência Máxima Ativa */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Maior Sequência</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 flex items-center gap-1">
                <Flame size={20} className="fill-amber-400 text-amber-400" />
                <span>{telemetry.bestHabitStreak.currentStreak}</span>
              </span>
              <span className="text-xs text-white/40 font-bold">dias seguidos</span>
            </div>
            <span className="text-[10px] text-white/40 truncate mt-3">
              {telemetry.bestHabitStreak.habit?.name || 'Nenhum'}
            </span>
          </div>

          {/* KPI 3: Consistência Semanal */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Média 7 Dias</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-blue-400">{telemetry.weeklyAverageRate}%</span>
              <span className="text-xs text-white/40 font-bold">constância</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold mt-3 flex items-center gap-1">
              <TrendingUp size={12} /> Alta fidelidade
            </span>
          </div>

          {/* KPI 4: Dias Perfeitos no Mês */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Dias 100% (30d)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-purple-400 flex items-center gap-1">
                <Award size={20} className="text-purple-400" />
                <span>{telemetry.perfectDays}</span>
              </span>
              <span className="text-xs text-white/40 font-bold">dias</span>
            </div>
            <span className="text-[10px] text-white/40 mt-3">
              meta: 20 dias perfeitos
            </span>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Controls & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Navigation Modes */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveView('flow')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeView === 'flow'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sunrise size={15} />
            <span>Fluxo do Dia</span>
          </button>

          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeView === 'dashboard'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 size={15} />
            <span>Dashboard & Métricas</span>
          </button>

          <button
            onClick={() => setActiveView('week_matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeView === 'week_matrix'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar size={15} />
            <span>Matriz Semanal</span>
          </button>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">Filtrar:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Todos ({habits.length})
          </button>
          <button
            onClick={() => setSelectedCategory('health')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
              selectedCategory === 'health'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Saúde
          </button>
          <button
            onClick={() => setSelectedCategory('spiritual')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
              selectedCategory === 'spiritual'
                ? 'bg-purple-100 text-purple-800'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Espiritual
          </button>
          <button
            onClick={() => setSelectedCategory('mind')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
              selectedCategory === 'mind'
                ? 'bg-blue-100 text-blue-800'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Mental
          </button>
          <button
            onClick={() => setSelectedCategory('business')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
              selectedCategory === 'business'
                ? 'bg-amber-100 text-amber-800'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Liderança
          </button>
        </div>
      </div>

      {/* VIEW 1: FLUXO DO DIA (TIME-OF-DAY CHECK-IN FLOW) */}
      {activeView === 'flow' && (
        <div className="space-y-8">
          {/* Quick status banner */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-950">
                  Cadência Diária em Andamento
                </h3>
                <p className="text-xs text-emerald-700 font-medium">
                  {telemetry.completedTodayCount === telemetry.totalHabits && telemetry.totalHabits > 0
                    ? '🎉 Parabéns! Todos os hábitos de hoje foram 100% concluídos!'
                    : `Você já realizou ${telemetry.completedTodayCount} de ${telemetry.totalHabits} hábitos hoje. Continue firme no fluxo.`}
                </p>
              </div>
            </div>

            <div className="text-right sm:text-center">
              <span className="text-xs font-black uppercase text-emerald-700">Data de Hoje</span>
              <p className="text-sm font-bold text-emerald-900">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>

          {/* Habit Blocks grouped by Time of Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {timePeriods.map(period => {
              if (period.habits.length === 0 && selectedCategory !== 'all') return null;
              const PeriodIcon = period.icon;
              const periodCompletedCount = period.habits.filter(h => h.completedDates?.includes(today)).length;
              const periodTotal = period.habits.length;
              const periodRate = periodTotal > 0 ? Math.round((periodCompletedCount / periodTotal) * 100) : 0;

              return (
                <div 
                  key={period.id}
                  className="bg-white border border-slate-200/80 rounded-[32px] p-6 shadow-2xs space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${period.color}`}>
                        <PeriodIcon size={20} />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900">{period.title}</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{period.period}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900">{periodCompletedCount}/{periodTotal}</span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${periodRate}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {period.habits.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400">
                      <p className="text-xs font-bold">Nenhum hábito configurado para este período.</p>
                      <button
                        onClick={() => {
                          setNewHabitTimeOfDay(period.id as HabitTimeOfDay);
                          setShowAddModal(true);
                        }}
                        className="text-[11px] font-black text-slate-900 hover:underline mt-1 inline-block"
                      >
                        + Adicionar Hábito Aqui
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {period.habits.map(habit => {
                        const isDoneToday = habit.completedDates?.includes(today);
                        const streak = calculateHabitStreak(habit.completedDates || []);
                        const category = getHabitCategory(habit);
                        const catLabel = getCategoryLabel(category);

                        return (
                          <div
                            key={habit.id}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                              isDoneToday
                                ? 'bg-emerald-50/70 border-emerald-200'
                                : 'bg-slate-50/60 border-slate-100 hover:border-slate-300 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              {/* Checkbox Button */}
                              <button
                                onClick={() => onUpdateHabit(habit.id, today)}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all shrink-0 ${
                                  isDoneToday
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                    : 'bg-white border-slate-300 text-transparent hover:border-emerald-500'
                                }`}
                                title={isDoneToday ? 'Marcar como não feito' : 'Marcar como feito'}
                              >
                                <Check size={18} strokeWidth={3} className={isDoneToday ? 'opacity-100' : 'opacity-0'} />
                              </button>

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-sm font-bold truncate ${isDoneToday ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                    {habit.name}
                                  </span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${catLabel.badgeBg}`}>
                                    {catLabel.label.split('&')[0]}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                                  {streak > 0 && (
                                    <span className="flex items-center gap-1 font-black text-amber-600">
                                      <Flame size={12} className="fill-amber-500 text-amber-500" />
                                      <span>{streak}d seguidos</span>
                                    </span>
                                  )}
                                  <span>•</span>
                                  <span>{habit.completedDates?.length || 0} feitos totais</span>
                                </div>
                              </div>
                            </div>

                            {/* Mini 5-days history pills & Delete */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="hidden sm:flex items-center gap-1">
                                {last7Days.slice(-4).map(dateStr => {
                                  const done = habit.completedDates?.includes(dateStr);
                                  const isCurrent = dateStr === today;
                                  return (
                                    <div
                                      key={dateStr}
                                      className={`w-2.5 h-2.5 rounded-full ${
                                        done 
                                          ? 'bg-emerald-500' 
                                          : isCurrent 
                                            ? 'border-2 border-slate-300 bg-white' 
                                            : 'bg-slate-200'
                                      }`}
                                      title={`${dateStr}: ${done ? 'Feito' : 'Não feito'}`}
                                    />
                                  );
                                })}
                              </div>

                              <button
                                onClick={() => onDeleteHabit(habit.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-white transition-all"
                                title="Excluir hábito"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: DASHBOARD DE CONSISTÊNCIA & ANALYTICS */}
      {activeView === 'dashboard' && (
        <div className="space-y-8">
          {/* Weekly Bar Chart and Habit Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Completion Bar Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[36px] shadow-2xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Histórico dos Últimos 7 Dias
                  </h3>
                  <p className="text-sm font-bold text-slate-900">Taxa diária de cumprimento de hábitos</p>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  Média: {telemetry.weeklyAverageRate}%
                </span>
              </div>

              {/* Visual Bars for the 7 days */}
              <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100">
                {telemetry.dayPoints.map(point => (
                  <div key={point.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {point.rate}%
                    </span>
                    <div className="w-full max-w-[42px] bg-slate-100 rounded-2xl h-36 flex items-end p-1 overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(point.rate, 6)}%` }}
                        className={`w-full rounded-xl transition-all ${
                          point.isToday
                            ? 'bg-emerald-500 shadow-md shadow-emerald-500/20'
                            : point.rate >= 80
                              ? 'bg-slate-900'
                              : point.rate >= 50
                                ? 'bg-slate-500'
                                : 'bg-slate-300'
                        }`}
                      />
                    </div>
                    <span className={`text-[11px] font-bold ${point.isToday ? 'text-emerald-700 font-black' : 'text-slate-500'}`}>
                      {point.dayShort}
                    </span>
                    <span className="text-[9px] text-slate-400">{point.completedCount}/{point.totalHabits}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Hoje</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    <span>Alta Constância (80%+)</span>
                  </div>
                </div>
                <span>7 dias avaliados</span>
              </div>
            </div>

            {/* Consistency Heatmap (30 days) */}
            <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[36px] shadow-2xs space-y-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Mapa de Consistência (30 Dias)
                </h3>
                <p className="text-sm font-bold text-slate-900">Cadência visual dia a dia</p>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {telemetry.monthlyHeatmap.map(day => (
                  <div
                    key={day.date}
                    className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-110 cursor-pointer ${
                      day.rate === 100
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : day.rate >= 60
                          ? 'bg-emerald-300 text-emerald-950'
                          : day.rate > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-400'
                    }`}
                    title={`${day.date}: ${day.rate}% (${day.completed} hábitos)`}
                  >
                    {day.date.split('-')[2]}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>0% hábitos</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-md bg-slate-100" />
                  <div className="w-3 h-3 rounded-md bg-emerald-100" />
                  <div className="w-3 h-3 rounded-md bg-emerald-300" />
                  <div className="w-3 h-3 rounded-md bg-emerald-500" />
                </div>
                <span>100% hábitos</span>
              </div>
            </div>
          </div>

          {/* Habit by Habit Detailed Cards */}
          <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[36px] shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Desempenho Individual por Hábito
                </h3>
                <p className="text-sm font-bold text-slate-900">Sequências ativas, recordes e volume total de execuções</p>
              </div>
              <span className="text-xs font-bold text-slate-400">{habits.length} hábitos ativos</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map(habit => {
                const streak = calculateHabitStreak(habit.completedDates || []);
                const longest = calculateLongestStreak(habit.completedDates || []);
                const category = getHabitCategory(habit);
                const catLabel = getCategoryLabel(category);
                const totalChecks = habit.completedDates?.length || 0;
                const isDoneToday = habit.completedDates?.includes(today);

                return (
                  <div
                    key={habit.id}
                    className="p-5 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${catLabel.badgeBg}`}>
                          {getHabitIcon(habit.name, category)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm leading-tight">{habit.name}</h4>
                          <span className="text-[10px] font-bold text-slate-400">{catLabel.label}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onUpdateHabit(habit.id, today)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          isDoneToday
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {isDoneToday ? 'Feito Hoje ✓' : '+ Fazer Hoje'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                      <div className="p-2 rounded-xl bg-white border border-slate-100">
                        <span className="block text-xs font-black text-amber-600 flex items-center justify-center gap-0.5">
                          <Flame size={12} className="fill-amber-500 text-amber-500" />
                          <span>{streak}</span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Sequência</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-slate-100">
                        <span className="block text-xs font-black text-slate-800">{longest}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Recorde</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-slate-100">
                        <span className="block text-xs font-black text-emerald-600">{totalChecks}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Totais</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MATRIZ SEMANAL (WEEKLY MATRIX TABLE WITH 1-CLICK TOGGLES) */}
      {activeView === 'week_matrix' && (
        <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[36px] shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Matriz de Cumprimento Semanal
              </h3>
              <p className="text-sm font-bold text-slate-900">
                Clique nas datas para marcar retroativamente qualquer dia da semana
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Concluído</span>
              <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200 ml-2" />
              <span>Pendente</span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-400">Hábito</th>
                  <th className="py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-400">Categoria</th>
                  {last7Days.map(dateStr => {
                    const [y, m, d] = dateStr.split('-').map(Number);
                    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                    const dayName = dayNames[new Date(y, m - 1, d).getDay()];
                    const isTodayDate = dateStr === today;
                    return (
                      <th 
                        key={dateStr} 
                        className={`py-3 px-3 text-center text-xs font-black uppercase tracking-wider ${
                          isTodayDate ? 'text-emerald-600 bg-emerald-50/50 rounded-t-xl' : 'text-slate-500'
                        }`}
                      >
                        <div>{dayName}</div>
                        <div className="text-[10px] font-normal text-slate-400">{d}</div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-4 text-center text-xs font-black uppercase tracking-wider text-slate-400">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {habits.map(habit => {
                  const category = getHabitCategory(habit);
                  const catLabel = getCategoryLabel(category);
                  const streak = calculateHabitStreak(habit.completedDates || []);

                  return (
                    <tr key={habit.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-slate-900 text-sm">{habit.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${catLabel.badgeBg}`}>
                          {catLabel.label.split('&')[0]}
                        </span>
                      </td>

                      {/* Day Checkboxes */}
                      {last7Days.map(dateStr => {
                        const isDone = habit.completedDates?.includes(dateStr);
                        const isTodayDate = dateStr === today;

                        return (
                          <td 
                            key={dateStr} 
                            className={`py-4 px-3 text-center ${isTodayDate ? 'bg-emerald-50/30' : ''}`}
                          >
                            <button
                              onClick={() => onUpdateHabit(habit.id, dateStr)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all mx-auto ${
                                isDone 
                                  ? 'bg-emerald-500 text-white shadow-xs' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-transparent border border-slate-200'
                              }`}
                              title={`${habit.name} - ${dateStr}`}
                            >
                              <Check size={16} strokeWidth={3} className={isDone ? 'opacity-100' : 'opacity-0'} />
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          <Flame size={12} className="fill-amber-500 text-amber-500" />
                          <span>{streak}d</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[36px] p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Novo Hábito</h3>
                <p className="text-xs text-slate-500 mt-1">Configure um novo hábito para monitorar seu fluxo e consistência.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                    Nome do Hábito
                  </label>
                  <input
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Ex: Leitura Bíblica, Corrida 5km, Beber 3L de Água"
                    value={newHabitName}
                    onChange={e => setNewHabitName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateHabit()}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                      Categoria
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold outline-none"
                      value={newHabitCategory}
                      onChange={e => setNewHabitCategory(e.target.value as HabitCategory)}
                    >
                      <option value="health">Saúde & Físico</option>
                      <option value="spiritual">Espiritual & Alma</option>
                      <option value="mind">Mental & Intelecto</option>
                      <option value="business">Liderança & Negócio</option>
                      <option value="other">Geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                      Horário do Fluxo
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold outline-none"
                      value={newHabitTimeOfDay}
                      onChange={e => setNewHabitTimeOfDay(e.target.value as HabitTimeOfDay)}
                    >
                      <option value="morning">🌅 Manhã (06h - 12h)</option>
                      <option value="afternoon">☀️ Tarde (12h - 18h)</option>
                      <option value="evening">🌙 Noite (18h - 23h)</option>
                      <option value="any">⚡ Horário Livre</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                    Frequência Alvo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewHabitFrequency('daily')}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                        newHabitFrequency === 'daily'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Diário (7x por semana)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewHabitFrequency('weekly')}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                        newHabitFrequency === 'weekly'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Semanal (Dias específicos)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 text-xs font-black uppercase text-slate-400 hover:text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateHabit}
                  className="flex-1 bg-slate-900 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-slate-900/10 hover:bg-slate-800"
                >
                  Salvar Hábito
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
