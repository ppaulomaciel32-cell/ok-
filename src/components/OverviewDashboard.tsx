import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Client, User, DailyMetrics, Habit } from '../types';
import { ECOSYSTEMS } from '../lib/constants';
import { 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ListTodo, 
  TrendingUp, 
  LayoutDashboard, 
  DollarSign, 
  Briefcase, 
  Layers, 
  Flame, 
  Target, 
  Plus, 
  Filter, 
  Search, 
  MessageCircle, 
  ShieldAlert, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  UserCheck,
  Activity,
  Mic,
  Moon,
  Sun,
  Smartphone
} from 'lucide-react';
import { estaAtrasada, venceHoje, formatTimeRelative, getTaskStatusVisuals, getAssigneeDisplayName, getAssigneeInitials, formatDeliveryDate } from '../lib/taskUtils';
import { FocusTimer } from './FocusTimer';
import { HabitFlowDashboard } from './HabitFlowDashboard';
import { getTodayDateString } from '../lib/habitUtils';

interface OverviewDashboardProps {
  tasks: Task[];
  clients: Client[];
  users: User[];
  metrics?: DailyMetrics;
  setMetrics?: (m: any) => void;
  habits?: Habit[];
  onUpdateHabit?: (id: string, date: string) => void;
  onAddHabit?: (habit: any) => void;
  onDeleteHabit?: (id: string) => void;
  userProfileMode?: 'executive' | 'operational';
  onSetFocus?: (id: string) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onUpdateEnergy?: (level: number) => void;
  onOpenQuickTask?: () => void;
  onOpenQuickContent?: () => void;
  onOpenVoiceCenter?: () => void;
  onOpenDayClosure?: () => void;
  onOpenMorningBriefing?: () => void;
  pendingYesterdayCount?: number;
  initialTab?: 'business' | 'priorities' | 'focus' | 'habits';
}

export function OverviewDashboard({
  tasks,
  clients,
  users,
  metrics,
  setMetrics,
  habits,
  onUpdateHabit,
  onAddHabit,
  onDeleteHabit,
  userProfileMode = 'executive',
  onSetFocus,
  onUpdateTask,
  onUpdateEnergy,
  onOpenQuickTask,
  onOpenQuickContent,
  onOpenVoiceCenter,
  onOpenDayClosure,
  onOpenMorningBriefing,
  pendingYesterdayCount = 0,
  initialTab = 'business'
}: OverviewDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'business' | 'priorities' | 'focus' | 'habits'>(initialTab);
  const [showRevenue, setShowRevenue] = useState(true);
  const [justCompletedIds, setJustCompletedIds] = useState<string[]>([]);
  const [hideEsmaecidas, setHideEsmaecidas] = useState(false);

  const today = getTodayDateString();
  const totalHabits = habits?.length || 0;
  const habitsDoneToday = useMemo(() => habits?.filter(h => h.completedDates?.includes(today)).length || 0, [habits, today]);
  const habitCompletionRate = totalHabits > 0 ? Math.round((habitsDoneToday / totalHabits) * 100) : 0;

  // Filter states
  const [filterEcosystem, setFilterEcosystem] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculations for tasks
  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'canceled'), [tasks]);
  const totalCount = activeTasks.length;

  const completedTasks = useMemo(() => activeTasks.filter(t => t.status === 'done' || t.status === 'posted'), [activeTasks]);
  const completedCount = completedTasks.length;

  const delayedTasks = useMemo(() => {
    return activeTasks.filter(t => estaAtrasada(t.dueDate) && t.status !== 'done' && t.status !== 'posted')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [activeTasks]);
  const delayedCount = delayedTasks.length;

  const dueTodayTasks = useMemo(() => {
    return activeTasks.filter(t => venceHoje(t.dueDate) && !estaAtrasada(t.dueDate) && t.status !== 'done' && t.status !== 'posted');
  }, [activeTasks]);

  const blockedTasks = useMemo(() => activeTasks.filter(t => t.status === 'blocked'), [activeTasks]);
  const waitingApprovalTasks = useMemo(() => {
    return activeTasks.filter(t => t.stage === 'client_approval' || t.status === 'waiting_approval');
  }, [activeTasks]);

  const inProgressTasks = activeTasks.filter(t => t.status !== 'done' && t.status !== 'posted');
  const inProgressCount = inProgressTasks.length - delayedCount;

  const completedOnTime = completedTasks.filter(t => t.deliveryDate ? new Date(t.deliveryDate) <= new Date(t.dueDate) : true);
  const onTimeRate = completedTasks.length > 0 
    ? Math.round((completedOnTime.length / completedTasks.length) * 100) 
    : 100;

  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Business metrics
  const activeClients = clients.filter(c => c.status === 'active');
  const totalRevenue = activeClients.reduce((acc, c) => acc + c.fee, 0);
  const totalCost = activeClients.reduce((acc, c) => acc + (c.cost || 0), 0);
  const netMargin = totalRevenue - totalCost;
  const averageTicket = activeClients.length > 0 ? Math.round(totalRevenue / activeClients.length) : 0;

  // Content pipeline metrics
  const contentTasks = tasks.filter(t => Boolean(t.stage));
  const publishedContent = contentTasks.filter(t => t.stage === 'posted' || t.status === 'posted');
  const inProductionContent = contentTasks.filter(t => t.stage !== 'posted' && t.status !== 'posted');

  // Filtered task list for bottom drilldown
  const filteredTasks = useMemo(() => {
    return activeTasks.filter(t => {
      if (filterEcosystem !== 'all' && t.ecosystemId !== filterEcosystem) return false;
      if (filterAssignee !== 'all' && t.assigneeId !== filterAssignee) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterStatus === 'delayed' && !estaAtrasada(t.dueDate)) return false;
      if (filterStatus === 'today' && (!venceHoje(t.dueDate) || estaAtrasada(t.dueDate))) return false;
      if (filterStatus === 'blocked' && t.status !== 'blocked') return false;
      if (filterStatus === 'completed' && t.status !== 'done' && t.status !== 'posted') return false;
      if (filterStatus === 'in_progress' && (t.status === 'done' || t.status === 'posted' || estaAtrasada(t.dueDate))) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
      }
      return true;
    });
  }, [activeTasks, filterEcosystem, filterAssignee, filterPriority, filterStatus, searchQuery]);

  // Ecosystem metrics
  const ecosystemMetrics = useMemo(() => {
    return ECOSYSTEMS.map(eco => {
      const ecoTasks = activeTasks.filter(t => t.ecosystemId === eco.id);
      const ecoTotal = ecoTasks.length;
      const ecoCompleted = ecoTasks.filter(t => t.status === 'done' || t.status === 'posted').length;
      const ecoDelayed = ecoTasks.filter(t => t.status !== 'done' && t.status !== 'posted' && estaAtrasada(t.dueDate)).length;
      const ecoInProgress = ecoTotal - ecoCompleted - ecoDelayed;

      return {
        ...eco,
        total: ecoTotal,
        completed: ecoCompleted,
        inProgress: ecoInProgress,
        delayed: ecoDelayed,
        progress: ecoTotal > 0 ? Math.round((ecoCompleted / ecoTotal) * 100) : 0
      };
    }).filter(e => e.total > 0);
  }, [activeTasks]);

  // Client metrics
  const clientMetrics = useMemo(() => {
    return clients.map(client => {
      const cTasks = activeTasks.filter(t => t.clientId === client.id);
      const cTotal = cTasks.length;
      const cCompleted = cTasks.filter(t => t.status === 'done' || t.status === 'posted').length;
      const cDelayed = cTasks.filter(t => t.status !== 'done' && t.status !== 'posted' && estaAtrasada(t.dueDate)).length;

      return {
        ...client,
        total: cTotal,
        completed: cCompleted,
        delayed: cDelayed,
        progress: cTotal > 0 ? Math.round((cCompleted / cTotal) * 100) : 0
      };
    }).sort((a, b) => b.delayed - a.delayed || b.total - a.total);
  }, [clients, activeTasks]);

  // Team load
  const teamMetrics = useMemo(() => {
    return users.map(user => {
      const uTasks = activeTasks.filter(t => t.assigneeId === user.id);
      const uTotal = uTasks.length;
      const uCompleted = uTasks.filter(t => t.status === 'done' || t.status === 'posted').length;
      const uDelayed = uTasks.filter(t => t.status !== 'done' && t.status !== 'posted' && estaAtrasada(t.dueDate)).length;
      const uOpen = uTotal - uCompleted;

      return {
        ...user,
        total: uTotal,
        open: uOpen,
        completed: uCompleted,
        delayed: uDelayed,
        progress: uTotal > 0 ? Math.round((uCompleted / uTotal) * 100) : 0
      };
    }).sort((a, b) => b.delayed - a.delayed || b.open - a.open);
  }, [users, activeTasks]);

  const handleCobrarWhatsApp = (task: Task) => {
    const assignee = users.find(u => u.id === task.assigneeId);
    const nome = assignee ? assignee.name : 'Colega';
    const text = `Olá ${nome}, tudo bem? Notei no painel que a entrega "${task.title}" está com prazo expirado. Precisamos de apoio para destravar hoje?`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleMarkDone = (id: string) => {
    setJustCompletedIds(prev => [...prev, id]);
    onUpdateTask?.(id, {
      status: 'done',
      deliveryDate: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Primary Actions */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {userProfileMode === 'executive' ? 'Direção Executiva' : 'Painel Operacional'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">
              Grupo Tome Nota & Operacional Reev
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Dashboard Empresarial
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">
            Telemetria de negócio, saúde de ecossistemas e comando operacional ágil.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {onOpenVoiceCenter && (
            <button
              onClick={onOpenVoiceCenter}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer"
              title="Conexão QR Code, monitoramento do WhatsApp e estruturação de áudios Reev"
            >
              <Smartphone size={15} />
              <span>WhatsApp Operacional & Reev</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            </button>
          )}

          {onOpenMorningBriefing && (
            <button
              onClick={onOpenMorningBriefing}
              className="px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-black text-xs flex items-center gap-1.5 shadow-2xs transition-all"
              title="Cobrança matinal das pendências de ontem"
            >
              <Sun size={15} className="text-amber-600" />
              <span>Cobrança Matinal</span>
              {pendingYesterdayCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  {pendingYesterdayCount}
                </span>
              )}
            </button>
          )}

          {onOpenDayClosure && (
            <button
              onClick={onOpenDayClosure}
              className="px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-black text-xs flex items-center gap-1.5 shadow-2xs transition-all"
              title="Salvar fechamento do dia e preparar cobrança de amanhã"
            >
              <Moon size={15} className="text-indigo-600" />
              <span>Encerrar Dia</span>
            </button>
          )}

          {onOpenQuickContent && (
            <button
              onClick={onOpenQuickContent}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Layers size={15} />
              <span>Novo Conteúdo</span>
            </button>
          )}

          {onOpenQuickTask && (
            <button
              onClick={onOpenQuickTask}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-slate-200 transition-all active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Nova Tarefa</span>
            </button>
          )}
        </div>
      </header>

      {/* Sub-View Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1 overflow-x-auto gap-4 custom-scrollbar">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('business')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              activeSubTab === 'business'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart2 size={16} />
            <span>Saúde do Negócio</span>
          </button>

          <button
            onClick={() => setActiveSubTab('priorities')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all relative ${
              activeSubTab === 'priorities'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Flame size={16} className={delayedCount > 0 ? 'text-red-400' : ''} />
            <span>Alertas & Prioridades</span>
            {delayedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
                {delayedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('focus')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              activeSubTab === 'focus'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Target size={16} />
            <span>Foco Estratégico</span>
          </button>

          <button
            onClick={() => setActiveSubTab('habits')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all relative ${
              activeSubTab === 'habits'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity size={16} className="text-emerald-500" />
            <span>Hábitos & Fluxo</span>
            {totalHabits > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                {habitsDoneToday}/{totalHabits}
              </span>
            )}
          </button>
        </div>

        {/* Visibility Toggle for sensitive revenue */}
        {userProfileMode === 'executive' && (
          <button
            onClick={() => setShowRevenue(!showRevenue)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
            title="Alternar visibilidade de valores"
          >
            {showRevenue ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showRevenue ? 'Ocultar Valores' : 'Mostrar Valores'}</span>
          </button>
        )}
      </div>

      {/* TOP BUSINESS KPIS CARDS (ALWAYS VISIBLE) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Faturamento Mensal (MRR) */}
        <div className="col-span-2 md:col-span-1 bg-slate-900 text-white p-5 rounded-[28px] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">
              <span>{userProfileMode === 'executive' ? 'MRR (Honorários)' : 'Contas Ativas'}</span>
              <DollarSign size={14} className="text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {userProfileMode === 'executive' ? (
                showRevenue ? `R$ ${totalRevenue.toLocaleString('pt-BR')}` : 'R$ ••••••'
              ) : (
                `${activeClients.length} Clientes`
              )}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/60 font-medium">
            <span>{activeClients.length} clientes ativos</span>
            {userProfileMode === 'executive' && (
              <span className="text-emerald-400 font-bold">
                {showRevenue ? `Tk Médio R$ ${averageTicket.toLocaleString('pt-BR')}` : 'Ativos'}
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Clientes Ativos */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-[28px] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
              <span>Clientes</span>
              <Briefcase size={14} className="text-slate-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {clients.length}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="text-emerald-600 font-bold">100% Retenção</span>
            <span>{activeClients.length} com fee ativo</span>
          </div>
        </div>

        {/* KPI 3: Conteúdo Publicado & Pipeline */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-[28px] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
              <span>Conteúdos</span>
              <Layers size={14} className="text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {publishedContent.length}
              <span className="text-sm font-bold text-slate-400 ml-1">/ {contentTasks.length}</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="text-blue-600 font-bold">{inProductionContent.length} no pipeline</span>
            <span>{publishedContent.length} postados</span>
          </div>
        </div>

        {/* KPI 4: Entregas no Prazo */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-[28px] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
              <span>Pontualidade</span>
              <CheckCircle2 size={14} className="text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {onTimeRate}%
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="font-bold text-slate-700">{completedCount} concluídas</span>
            <span>{overallProgress}% geral</span>
          </div>
        </div>

        {/* KPI 5: Alertas e Risco Operacional */}
        <div 
          onClick={() => setActiveSubTab('priorities')}
          className={`p-5 rounded-[28px] border shadow-2xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] ${
            delayedCount > 0 
              ? 'bg-red-50/80 border-red-200 text-red-900' 
              : 'bg-white border-slate-200/80 text-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1">
              <span className={delayedCount > 0 ? 'text-red-500' : 'text-slate-400'}>Alertas</span>
              <Flame size={14} className={delayedCount > 0 ? 'text-red-500' : 'text-slate-400'} />
            </div>
            <p className={`text-2xl sm:text-3xl font-black tracking-tight ${delayedCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {delayedCount}
              <span className="text-xs font-bold text-slate-400 ml-1.5">atrasadas</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between text-[10px] font-bold">
            <span className="text-purple-600">{blockedTasks.length} bloqueios</span>
            <span className="text-slate-700 underline flex items-center gap-0.5">
              <span>Ver todos</span>
              <ArrowRight size={11} />
            </span>
          </div>
        </div>
      </div>

      {/* QUICK HABIT CADENCE WIDGET (Always easy to update throughout the day) */}
      {habits && habits.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-[28px] p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Cadência de Hábitos do Dia
                </span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {habitsDoneToday} de {totalHabits} ({habitCompletionRate}%)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Atualize com 1 clique ao longo do dia para manter sua bio-performance e foco alinhados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
            {habits.slice(0, 5).map(h => {
              const isDone = h.completedDates?.includes(today);
              return (
                <button
                  key={h.id}
                  onClick={() => onUpdateHabit?.(h.id, today)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                    isDone
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-white'
                  }`}
                  title={isDone ? 'Concluído hoje' : 'Clique para marcar como feito hoje'}
                >
                  <CheckCircle2 size={13} className={isDone ? 'text-white' : 'text-slate-300'} />
                  <span className="truncate max-w-[130px]">{h.name}</span>
                </button>
              );
            })}

            <button
              onClick={() => setActiveSubTab('habits')}
              className="text-xs font-black text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
            >
              Ver Fluxo Completo →
            </button>
          </div>
        </div>
      )}

      {/* SUB-VIEW 1: SAÚDE DO NEGÓCIO */}
      {activeSubTab === 'business' && (
        <div className="space-y-8">
          {/* Donut and Ecosystem Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Progress Card */}
            <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[36px] shadow-2xs flex flex-col items-center justify-between space-y-6">
              <div className="w-full flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Progresso das Entregas
                </h3>
                <span className="text-xs font-bold text-slate-500">{completedCount} de {totalCount}</span>
              </div>

              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    stroke="currentColor" 
                    strokeWidth="12" 
                    fill="transparent" 
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * overallProgress) / 100}
                    strokeLinecap="round"
                    className="text-emerald-500 transition-all duration-1000" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900">{overallProgress}%</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Concluído</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-100 text-xs">
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="block font-black text-emerald-600">{completedCount}</span>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Feito</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="block font-black text-amber-600">{inProgressCount}</span>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Em curso</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <span className="block font-black text-red-600">{delayedCount}</span>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Atraso</span>
                </div>
              </div>
            </div>

            {/* Ecosystem Progress */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[36px] shadow-2xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Progresso por Ecossistema
                  </h3>
                  <p className="text-sm font-bold text-slate-700">Operações segmentadas por canal e negócio</p>
                </div>
                <span className="text-xs font-bold text-slate-400">{ecosystemMetrics.length} ecossistemas ativos</span>
              </div>

              <div className="space-y-5">
                {ecosystemMetrics.map(eco => (
                  <div key={eco.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: eco.color }} />
                        <span className="font-black text-slate-800">{eco.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-wider">
                        <span className="text-emerald-600">{eco.completed} feitos</span>
                        <span className="text-amber-500">{eco.inProgress} em curso</span>
                        {eco.delayed > 0 && <span className="text-red-500">{eco.delayed} atrasados</span>}
                        <span className="text-slate-900 ml-1">{eco.progress}%</span>
                      </div>
                    </div>

                    <div className="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(eco.completed / eco.total) * 100}%` }}
                        className="h-full bg-emerald-500"
                        title="Concluído"
                      />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(eco.inProgress / eco.total) * 100}%` }}
                        className="h-full bg-amber-400"
                        title="Em Andamento"
                      />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(eco.delayed / eco.total) * 100}%` }}
                        className="h-full bg-red-500"
                        title="Atrasado"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clients & Team Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Status Breakdown */}
            <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[36px] shadow-2xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Saúde das Contas (Clientes)
                  </h3>
                  <p className="text-sm font-bold text-slate-700">Entregas e retenção por cliente</p>
                </div>
                <span className="text-xs font-bold text-slate-400">{clients.length} cadastrados</span>
              </div>

              <div className="space-y-3.5">
                {clientMetrics.map(client => (
                  <div key={client.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{client.name}</span>
                        {userProfileMode === 'executive' && showRevenue && (
                          <span className="text-xs font-semibold text-slate-400 ml-2">
                            (R$ {client.fee.toLocaleString('pt-BR')})
                          </span>
                        )}
                      </div>
                      {client.delayed > 0 ? (
                        <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          {client.delayed} Atraso
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          Em Dia
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${client.progress}%` }}
                          className={`h-full ${client.delayed > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-400 w-10 text-right">{client.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Production Load */}
            <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[36px] shadow-2xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Capacidade da Equipe
                  </h3>
                  <p className="text-sm font-bold text-slate-700">Volume de tarefas ativas por colaborador</p>
                </div>
                <span className="text-xs font-bold text-slate-400">{users.length} membros</span>
              </div>

              <div className="space-y-3.5">
                {teamMetrics.map(member => (
                  <div key={member.id} className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900 truncate">{member.name}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          {member.open} abertas
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${member.progress}%` }}
                            className="h-full bg-slate-800"
                          />
                        </div>
                        {member.delayed > 0 && (
                          <span className="text-[10px] font-black text-red-600 shrink-0">
                            {member.delayed} atrasadas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DRILLDOWN FILTERABLE TASK LIST */}
          <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[36px] shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Explorador de Tarefas e Entregas
                </h3>
                <p className="text-sm font-bold text-slate-700">Filtre por qualquer dimensão da operação</p>
              </div>

              {/* Quick Search inside dashboard */}
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar tarefas..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">Filtros:</span>
              
              {/* Ecosystem filter */}
              <select
                value={filterEcosystem}
                onChange={e => setFilterEcosystem(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Todos os Ecossistemas</option>
                {ECOSYSTEMS.map(eco => (
                  <option key={eco.id} value={eco.id}>{eco.name}</option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="in_progress">Em Andamento</option>
                <option value="today">Vencendo Hoje</option>
                <option value="delayed">Atrasadas</option>
                <option value="blocked">Bloqueadas</option>
                <option value="completed">Concluídas</option>
              </select>

              {/* Priority filter */}
              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Todas as Prioridades</option>
                <option value="P1">P1 - Crítica</option>
                <option value="P2">P2 - Alta</option>
                <option value="P3">P3 - Normal</option>
              </select>

              {/* Assignee filter */}
              <select
                value={filterAssignee}
                onChange={e => setFilterAssignee(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Todos os Responsáveis</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>

              {(filterEcosystem !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setFilterEcosystem('all');
                    setFilterStatus('all');
                    setFilterPriority('all');
                    setFilterAssignee('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-red-600 font-bold hover:underline px-2"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Tasks list */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 px-1">
                <span className="text-[11px] font-bold text-slate-500">
                  Mostrando {filteredTasks.length} demandas
                </span>
                <button
                  onClick={() => setHideEsmaecidas(!hideEsmaecidas)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {hideEsmaecidas ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>{hideEsmaecidas ? 'Exibir demandas esmaecidas' : 'Ocultar demandas esmaecidas'}</span>
                </button>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm font-bold text-slate-500">Nenhuma tarefa encontrada com esses filtros.</p>
                </div>
              ) : (
                filteredTasks.slice(0, 10).map(task => {
                  const eco = ECOSYSTEMS.find(e => e.id === task.ecosystemId);
                  const assigneeName = getAssigneeDisplayName(task.assigneeId, users);
                  const initials = getAssigneeInitials(task.assigneeId, users);
                  const isOverdue = estaAtrasada(task.dueDate) && task.status !== 'done' && task.status !== 'posted';
                  const isDone = task.status === 'done' || task.status === 'posted';
                  const isEsmaecida = isDone || justCompletedIds.includes(task.id);

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all duration-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isEsmaecida 
                          ? 'opacity-35 grayscale-[50%] bg-slate-50/70 border-slate-200/50 scale-[0.99] shadow-none' 
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {eco && (
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: eco.color }} 
                            />
                          )}
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {eco?.name || 'Geral'}
                          </span>
                          {task.origem === 'whatsapp' && (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider cursor-help"
                              title={task.origemChat || 'WhatsApp'}
                            >
                              <MessageCircle size={10} />
                              via WhatsApp
                            </span>
                          )}
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            task.priority === 'P1' ? 'bg-red-100 text-red-700' :
                            task.priority === 'P2' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {task.priority}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isOverdue ? 'bg-red-100 text-red-700 font-black' :
                            isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isOverdue ? 'Atrasada' : isDone ? 'Concluída' : formatTimeRelative(task.dueDate)}
                          </span>
                          {isDone && task.deliveryDate && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              entregue em {formatDeliveryDate(task.deliveryDate)}
                            </span>
                          )}
                          {isEsmaecida && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200/90 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 size={10} className="text-emerald-600" />
                              <span>Esmaecida</span>
                            </span>
                          )}
                        </div>
                        <p className={`text-sm font-bold truncate transition-all duration-500 ${
                          isEsmaecida ? 'line-through text-slate-400 italic' : 'text-slate-900'
                        }`}>
                          {task.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                            {initials}
                          </div>
                          <span className="text-xs font-medium text-slate-600 hidden md:inline">
                            {assigneeName}
                          </span>
                        </div>

                        {!isDone && (
                          <button
                            onClick={() => handleMarkDone(task.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-xs transition-colors"
                          >
                            Concluir
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: ALERTAS & PRIORIDADES OPERACIONAIS (COCKPIT INTEGRADO) */}
      {activeSubTab === 'priorities' && (
        <div className="space-y-8">
          <div className="p-6 rounded-[32px] bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-red-400 text-xs font-black uppercase tracking-wider mb-1">
                <Flame size={16} />
                <span>Painel de Destravamento Imediato</span>
              </div>
              <h2 className="text-2xl font-black">Operações e Prioridades Críticas</h2>
              <p className="text-slate-400 text-sm">Cobrança rápida via WhatsApp e resolução de pendências sem atrito.</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30">
                {delayedCount} Atrasadas
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {dueTodayTasks.length} Vence Hoje
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {blockedTasks.length} Bloqueios
              </span>
            </div>
          </div>

          {/* Atrasados */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-red-200/70 pb-3">
              <div className="flex items-center gap-2.5 text-red-600">
                <Flame size={20} />
                <h3 className="text-lg font-black uppercase tracking-wider">Atrasados Críticos ({delayedCount})</h3>
              </div>
              <span className="text-xs font-bold text-slate-400">Prioridade Máxima de Resolução</span>
            </div>

            {delayedTasks.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-[28px] text-center bg-white">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                <p className="font-bold text-sm text-slate-700">Nenhuma entrega atrasada no momento!</p>
                <p className="text-xs text-slate-400">A operação está 100% em dia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {delayedTasks.map(task => {
                  const visuals = getTaskStatusVisuals(task);
                  const assigneeName = getAssigneeDisplayName(task.assigneeId, users);
                  const client = clients.find(c => c.id === task.clientId);
                  const eco = ECOSYSTEMS.find(e => e.id === task.ecosystemId);

                  return (
                    <motion.div
                      key={task.id}
                      className={`bg-white border-2 rounded-[28px] p-5 space-y-4 shadow-sm hover:shadow-md transition-all ${visuals.border}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${visuals.bg} ${visuals.text}`}>
                            {formatTimeRelative(task.dueDate)}
                          </span>
                          {task.origem === 'whatsapp' && (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider cursor-help"
                              title={task.origemChat || 'WhatsApp'}
                            >
                              <MessageCircle size={10} />
                              via WhatsApp
                            </span>
                          )}
                        </div>
                        {client && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-md">
                            {client.name}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-black text-slate-900 text-base leading-tight">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: eco?.color }} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{eco?.name}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-bold text-slate-600">{assigneeName}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => handleCobrarWhatsApp(task)}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <MessageCircle size={14} />
                          <span>Cobrar WhatsApp</span>
                        </button>

                        <button
                          onClick={() => handleMarkDone(task.id)}
                          className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 font-bold text-xs text-slate-700 transition-colors"
                          title="Concluir entrega"
                        >
                          ✓
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Vence Hoje */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/70 pb-3">
              <div className="flex items-center gap-2.5 text-amber-600">
                <Clock size={20} />
                <h3 className="text-lg font-black uppercase tracking-wider">Vence Hoje ({dueTodayTasks.length})</h3>
              </div>
            </div>

            {dueTodayTasks.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-[28px] text-center bg-white">
                <Clock size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-700">Nenhuma entrega vence hoje.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dueTodayTasks.map(task => {
                  const assigneeName = getAssigneeDisplayName(task.assigneeId, users);
                  const client = clients.find(c => c.id === task.clientId);

                  return (
                    <div key={task.id} className="bg-white border rounded-[28px] p-5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-lg">
                            Vence Hoje
                          </span>
                          {task.origem === 'whatsapp' && (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider cursor-help"
                              title={task.origemChat || 'WhatsApp'}
                            >
                              <MessageCircle size={10} />
                              via WhatsApp
                            </span>
                          )}
                        </div>
                        {client && <span className="text-[10px] font-bold text-slate-400">{client.name}</span>}
                      </div>
                      <h4 className="font-black text-slate-900 text-sm leading-tight">{task.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">Resp: {assigneeName}</p>
                      <button
                        onClick={() => handleMarkDone(task.id)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                      >
                        Concluir Entrega
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Bloqueados & Aprovações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bloqueados */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-700 border-b border-purple-200 pb-3">
                <ShieldAlert size={20} />
                <h3 className="text-base font-black uppercase tracking-wider">Bloqueios na Operação ({blockedTasks.length})</h3>
              </div>

              {blockedTasks.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-[28px] text-center bg-white text-xs text-slate-400 font-bold">
                  Nenhuma tarefa bloqueada.
                </div>
              ) : (
                blockedTasks.map(task => (
                  <div key={task.id} className="p-4 rounded-2xl bg-white border border-purple-200 space-y-2">
                    <p className="font-bold text-sm text-slate-900">{task.title}</p>
                    {task.blockedReason && (
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-[10px] font-black">
                        Motivo: {task.blockedReason.replace(/_/g, ' ')}
                      </span>
                    )}
                    <button
                      onClick={() => onUpdateTask?.(task.id, { status: 'in_progress' })}
                      className="block text-xs font-bold text-purple-700 hover:underline pt-1"
                    >
                      Destravar e voltar para em andamento →
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Aguardando Aprovação */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-600 border-b border-orange-200 pb-3">
                <Clock size={20} />
                <h3 className="text-base font-black uppercase tracking-wider">Aguardando Aprovação ({waitingApprovalTasks.length})</h3>
              </div>

              {waitingApprovalTasks.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-[28px] text-center bg-white text-xs text-slate-400 font-bold">
                  Nenhuma entrega aguardando aprovação.
                </div>
              ) : (
                waitingApprovalTasks.map(task => (
                  <div key={task.id} className="p-4 rounded-2xl bg-white border border-orange-200 space-y-2">
                    <p className="font-bold text-sm text-slate-900">{task.title}</p>
                    <button
                      onClick={() => onUpdateTask?.(task.id, { status: 'done', approvalDate: new Date().toISOString() })}
                      className="block text-xs font-bold text-emerald-600 hover:underline pt-1"
                    >
                      Aprovar e Concluir →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: FOCO ESTRATÉGICO */}
      {activeSubTab === 'focus' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Focus timer */}
            <div className="lg:col-span-1">
              <FocusTimer
                energyLevel={metrics?.energyLevel || 7}
                onUpdateEnergy={onUpdateEnergy || (() => {})}
                onToggle={() => {}}
              />
            </div>

            {/* Daily Objectives & Priorities */}
            <div className="lg:col-span-2 bg-slate-900 rounded-[36px] p-8 text-white space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <Target size={18} />
                  <span>Top 3 Prioridades Estratégicas do Dia</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-white/40">Foco Executivo</span>
              </div>

              <div className="space-y-4">
                {[0, 1, 2].map(idx => (
                  <div key={idx} className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-wider">
                      Prioridade #{idx + 1}
                    </label>
                    <input
                      type="text"
                      placeholder={`Definir foco principal #${idx + 1}...`}
                      value={metrics?.topPriorities?.[idx] || ''}
                      onChange={e => {
                        if (!setMetrics) return;
                        const newPriorities = [...(metrics?.topPriorities || ['', '', ''])];
                        newPriorities[idx] = e.target.value;
                        setMetrics({ ...metrics, topPriorities: newPriorities });
                      }}
                      className="w-full px-5 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-white font-bold text-sm focus:outline-none focus:bg-white/15 focus:border-amber-400 transition-all placeholder:text-white/30"
                    />
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/70 font-medium leading-relaxed">
                💡 <strong>Dica Executiva:</strong> Resolva as 3 prioridades antes de abrir caixas de entrada ou canais de comunicação gerais.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: HÁBITOS & FLUXO DO DIA */}
      {activeSubTab === 'habits' && (
        <HabitFlowDashboard
          habits={habits || []}
          metrics={metrics || { date: today, postsDone: 0, postsGoal: 0, tasksCompleted: 0, energyLevel: 7, topPriorities: [] }}
          onUpdateHabit={onUpdateHabit || (() => {})}
          onAddHabit={onAddHabit || (() => {})}
          onDeleteHabit={onDeleteHabit || (() => {})}
          onUpdateEnergy={onUpdateEnergy}
        />
      )}
    </div>
  );
}
