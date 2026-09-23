import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  Zap, 
  Users,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Newspaper,
  Calendar,
  X,
  ShieldCheck,
  BarChart3,
  DollarSign
} from 'lucide-react';
import React from 'react';
import { Status, Task, DailyMetrics, Client } from '../types';
import { ECOSYSTEMS } from '../lib/constants';
import { FocusTimer } from './FocusTimer';

interface DashboardProps {
  tasks: Task[];
  metrics: DailyMetrics;
  clients: Client[];
  onSetFocus?: (id: string) => void;
  onUpdateEnergy: (level: number) => void;
  setMetrics: (m: any) => void;
}

export function Dashboard({ 
  tasks, 
  metrics, 
  clients,
  setMetrics, 
  onSetFocus, 
  onUpdateEnergy 
}: DashboardProps) {
  const [isFocusActive, setIsFocusActive] = React.useState(false);
  const focusedTask = tasks.find(t => t.id === metrics.focusTaskId);

  const updateTopPriority = (index: number, val: string) => {
    const newPriorities = [...(metrics.topPriorities || ['', '', ''])];
    newPriorities[index] = val;
    setMetrics({ ...metrics, topPriorities: newPriorities });
  };

  const getStatus = (): Status => {
    const now = new Date();
    const hasOverdue = tasks.some(t => new Date(t.dueDate) < now && t.status !== 'done' && t.status !== 'posted');
    if (hasOverdue) return 'fire';
    
    const hasAttention = tasks.some(t => t.layer === 'decision' && t.status !== 'done');
    if (hasAttention) return 'attention';
    
    return 'running';
  };

  const currentStatus = getStatus();
  const totalRevenue = clients.reduce((acc, c) => acc + c.fee, 0);
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="space-y-10 pb-12">
      {/* Header Section */}
      <AnimatePresence mode="wait">
        {!isFocusActive && (
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Central de Comando</h1>
              <p className="text-slate-500 font-medium text-lg">Direção Estratégica & Telemetria Executiva.</p>
            </div>
            <div className="flex items-center gap-4 bg-white p-2.5 rounded-[24px] border shadow-sm self-start">
              <div className="px-6 py-2.5 bg-slate-900 text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200">
                CEO Tome Nota
              </div>
              <div className="pr-6 flex items-center gap-2 text-slate-400">
                <Calendar size={16} />
                <span className="text-xs font-black uppercase tracking-widest">
                  {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className={`grid grid-cols-1 ${isFocusActive ? 'lg:grid-cols-2 max-w-5xl mx-auto pt-16' : 'lg:grid-cols-3'} gap-8 transition-all duration-700`}>
        <FocusTimer 
          energyLevel={metrics.energyLevel} 
          onUpdateEnergy={onUpdateEnergy} 
          onToggle={setIsFocusActive}
        />
        
        {isFocusActive ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col justify-center space-y-10"
          >
            <div className="space-y-3">
              <span className="text-amber-500 font-black text-[10px] uppercase tracking-[0.4em]">Execução de Fluxo Único</span>
              <h2 className="text-5xl font-black text-slate-900 leading-[1.1]">
                {focusedTask ? focusedTask.title : (metrics.topPriorities?.[0] || 'Prioridade do Dia')}
              </h2>
            </div>
            
            <div className="bg-white p-10 rounded-[48px] border shadow-2xl shadow-slate-200 space-y-8 border-slate-100">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center font-black text-lg">
                       {focusedTask?.assigneeId.substring(0, 2).toUpperCase() || 'TN'}
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Responsável</p>
                       <p className="text-lg font-black text-slate-900 uppercase">{focusedTask?.assigneeId || 'Liderança'}</p>
                    </div>
                 </div>
                 <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
                   Prioridade Máxima
                 </div>
               </div>
               <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 relative">
                  <p className="text-slate-600 font-medium leading-relaxed italic text-lg">
                    "Foque na resolução definitiva. Não aceite soluções temporárias para problemas estruturais."
                  </p>
               </div>
               <button className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-300 active:scale-[0.98]">
                  Concluir Ciclo de Foco
               </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-300"
          >
            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-amber-400 font-black text-xs uppercase tracking-[0.3em]">
                  <Target size={18} />
                  Objetivos Estratégicos
                </div>
                <div className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40">
                  Daily Sync
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="flex items-center gap-6 bg-white/5 p-5 rounded-3xl border border-white/10 group hover:bg-white/10 hover:border-white/20 transition-all cursor-text">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-base shadow-lg shadow-amber-400/20">
                      {idx + 1}
                    </div>
                    <input 
                      className="flex-1 bg-transparent text-2xl font-black placeholder:text-white/10 outline-none"
                      placeholder="Qual o próximo movimento?"
                      value={metrics.topPriorities?.[idx] || ''}
                      onChange={(e) => updateTopPriority(idx, e.target.value)}
                    />
                    <button 
                      onClick={() => onSetFocus?.('manual-' + idx)}
                      className="opacity-0 group-hover:opacity-100 bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
                    >
                      Focar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-slate-800 rounded-full blur-[100px] opacity-40" />
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <Zap size={200} strokeWidth={1} />
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {!isFocusActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-4 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento</span>
                     <DollarSign className="text-emerald-500 group-hover:scale-110 transition-transform" size={20} />
                  </div>
                  <p className="text-3xl font-black text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalRevenue)}
                  </p>
               </div>

               <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-4 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</span>
                     <Target className="text-amber-500 group-hover:scale-110 transition-transform" size={20} />
                  </div>
                  <p className="text-3xl font-black text-slate-900">{completionRate.toFixed(0)}%</p>
               </div>

               <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-4 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gargalos</span>
                     <Flame className="text-red-500 group-hover:scale-110 transition-transform" size={20} />
                  </div>
                  <p className="text-3xl font-black text-red-500">
                    {tasks.filter(t => t.status === 'blocked').length}
                  </p>
               </div>

               <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-4 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregas</span>
                     <CheckCircle2 className="text-emerald-500 group-hover:scale-110 transition-transform" size={20} />
                  </div>
                  <p className="text-3xl font-black text-slate-900">{completedTasks}</p>
               </div>
            </div>

            {/* Battle Central */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  Centro de Decisão
                  <div className="w-2 h-2 bg-slate-200 rounded-full" />
                </h2>
                <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <span>Visão Estratégica</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Requires CEO */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-6 py-2.5 bg-amber-50 text-amber-600 rounded-2xl w-fit text-[10px] font-black uppercase tracking-[0.2em] border border-amber-100 shadow-sm shadow-amber-50">
                    <AlertTriangle size={14} /> O que exige VOCÊ hoje
                  </div>
                  <div className="space-y-4">
                    {tasks.filter(t => (t.layer === 'decision' || t.blockedResponsibleId === 'gestor') && t.status !== 'done').length === 0 ? (
                      <div className="p-10 border-2 border-dashed border-slate-100 rounded-[32px] text-center space-y-3 bg-white">
                        <CheckCircle2 className="mx-auto text-slate-200" size={32} />
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">NADA TRAVANDO COM VOCÊ</p>
                      </div>
                    ) : (
                      tasks.filter(t => (t.layer === 'decision' || t.blockedResponsibleId === 'gestor') && t.status !== 'done').map(task => (
                        <TaskCard key={task.id} task={task} onSetFocus={onSetFocus} isFocused={metrics.focusTaskId === task.id} />
                      ))
                    )}
                  </div>
                </div>

                {/* Ecosystem Health */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-6 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl w-fit text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 shadow-sm shadow-emerald-50">
                    <BarChart3 size={14} /> Saúde Ecossistemas
                  </div>
                  <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-8">
                     <div className="space-y-6">
                        {ECOSYSTEMS.slice(0, 3).map(eco => {
                          const ecoTasks = tasks.filter(t => t.ecosystemId === eco.id);
                          const done = ecoTasks.filter(t => t.status === 'done').length;
                          const progress = ecoTasks.length > 0 ? (done / ecoTasks.length) * 100 : 100;
                          return (
                            <div key={eco.id} className="space-y-2">
                               <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                                  <span className="text-slate-600">{eco.name}</span>
                                  <span className="text-slate-400">{progress.toFixed(0)}%</span>
                               </div>
                               <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full" 
                                    style={{ backgroundColor: eco.color }} 
                                  />
                               </div>
                            </div>
                          );
                        })}
                     </div>
                     <button className="w-full bg-slate-50 text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all border border-slate-100">
                        Ver Telemetria Completa
                     </button>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { getTaskStatusVisuals, formatTimeRelative } from '../lib/taskUtils';

const TaskCard: React.FC<{ task: Task; onSetFocus?: (id: string) => void; isFocused?: boolean }> = ({ task, onSetFocus, isFocused }) => {
  const eco = ECOSYSTEMS.find(e => e.id === task.ecosystemId);
  const visuals = getTaskStatusVisuals(task);
  
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`p-8 rounded-[32px] border-2 transition-all space-y-6 group relative overflow-hidden ${
        isFocused ? 'bg-slate-900 border-amber-400 text-white shadow-2xl ring-2 ring-amber-400' : 'bg-white shadow-sm hover:shadow-md'
      } ${visuals.border}`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]" style={{ backgroundColor: eco?.color || '#ccc' }} />
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isFocused ? 'text-white/40' : 'text-slate-400'}`}>{eco?.name}</span>
        </div>
        <div className={`px-3 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest ${isFocused ? 'bg-white/10 text-white border-white/20' : `${visuals.bg} ${visuals.text} ${visuals.border}`}`}>
          {formatTimeRelative(task.dueDate)}
        </div>
      </div>
      
      <div className="relative z-10">
        <h4 className={`text-lg font-black leading-tight ${isFocused ? 'text-white' : 'text-slate-900'}`}>{task.title}</h4>
        {task.status === 'blocked' && task.blockedReason && <p className={`text-xs mt-2 font-bold uppercase tracking-widest opacity-80 ${isFocused ? 'text-amber-400' : 'text-purple-600'}`}>Bloqueio: {task.blockedReason.replace(/_/g, ' ')}</p>}
      </div>

      <div className={`flex items-center justify-between pt-5 border-t relative z-10 ${isFocused ? 'border-white/10' : 'border-slate-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border ${
            isFocused ? 'bg-white/10 text-white border-white/20' : 'bg-slate-100 text-slate-500 border-white'
          }`}>
            {task.assigneeId.substring(0, 2).toUpperCase()}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isFocused ? 'text-white/40' : 'text-slate-500'}`}>{task.assigneeId}</span>
        </div>
        <button 
          onClick={() => onSetFocus?.(task.id)}
          className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline transition-all ${isFocused ? 'text-amber-400' : 'text-slate-900'}`}
        >
          {isFocused ? 'Focado' : 'Focar Agora'} <ChevronRight size={14} />
        </button>
      </div>

      {isFocused && (
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Target size={120} strokeWidth={1} />
        </div>
      )}
    </motion.div>
  );
}
