import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  DollarSign, 
  Layers, 
  Target,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { Task, Client, Ecosystem } from '../types';
import { ECOSYSTEMS } from '../lib/constants';

interface ScaleAnalyticsProps {
  tasks: Task[];
  clients: Client[];
}

export function ScaleAnalytics({ tasks, clients }: ScaleAnalyticsProps) {
  const totalRevenue = clients.reduce((acc, c) => acc + c.fee, 0);
  
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'posted');
  const onTimeTasks = completedTasks.filter(t => t.deliveryDate ? new Date(t.deliveryDate) <= new Date(t.dueDate) : true);
  const completionRate = completedTasks.length > 0 ? (onTimeTasks.length / completedTasks.length) * 100 : 100;
  
  const now = new Date();
  const activeDelayed = tasks.filter(t => t.status !== 'done' && t.status !== 'posted' && t.status !== 'canceled' && new Date(t.dueDate) < now);

  const revenueByEcosystem = ECOSYSTEMS.map(eco => {
    const ecoClients = clients.filter(c => c.ecosystemId === eco.id);
    const revenue = ecoClients.reduce((acc, c) => acc + c.fee, 0);
    const cost = ecoClients.reduce((acc, c) => acc + (c.cost || 0), 0);
    const margin = revenue - cost;
    return { ...eco, revenue, cost, margin };
  }).sort((a, b) => b.revenue - a.revenue);

  const tasksByEcosystem = ECOSYSTEMS.map(eco => {
    const ecoTasks = tasks.filter(t => t.ecosystemId === eco.id);
    const completed = ecoTasks.filter(t => t.status === 'done' || t.status === 'posted');
    const ecoOnTime = completed.filter(t => t.deliveryDate ? new Date(t.deliveryDate) <= new Date(t.dueDate) : true);
    const rate = completed.length > 0 ? (ecoOnTime.length / completed.length) * 100 : 100;
    return { ...eco, total: ecoTasks.length, completed: completed.length, rate };
  });

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Inteligência de Escala</h1>
        <p className="text-slate-500 font-medium text-lg italic">Análise preditiva e crescimento sistêmico.</p>
      </header>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Faturamento Mensal</span>
              <DollarSign className="text-emerald-500" size={20} />
           </div>
           <p className="text-4xl font-black text-slate-900">
             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
           </p>
           <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase">
              <TrendingUp size={12} /> +12% vs mês anterior
           </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4 shadow-xl">
           <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest">Taxa de Entrega (SLA)</span>
              <Target className="text-amber-400" size={20} />
           </div>
           <p className="text-4xl font-black text-white">
             {completionRate.toFixed(1)}%
           </p>
           <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full transition-all duration-1000" style={{ width: `${completionRate}%` }} />
           </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Gargalos Ativos (Atrasos)</span>
              <AlertCircle className="text-red-500" size={20} />
           </div>
           <p className="text-4xl font-black text-red-500">
             {activeDelayed.length}
           </p>
           <p className="text-[10px] font-bold text-slate-400 uppercase">Tarefas estouraram SLA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue and Margin Distribution */}
        <div className="bg-white p-10 rounded-[48px] border shadow-sm space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Distribuição de Receita e Margem</h3>
              <BarChart3 size={20} className="text-slate-300" />
           </div>
           <div className="space-y-6">
              {revenueByEcosystem.filter(e => e.revenue > 0).map(eco => (
                <div key={eco.id} className="space-y-2">
                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: eco.color }} />
                         <span className="font-bold text-slate-700">{eco.name}</span>
                      </div>
                      <span className="font-black text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(eco.revenue)}
                      </span>
                   </div>
                   <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(eco.margin / eco.revenue) * 100}%` }}
                        className="h-full bg-emerald-400" 
                      />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(eco.cost / eco.revenue) * 100}%` }}
                        className="h-full bg-red-400 opacity-80" 
                      />
                   </div>
                   <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mt-1">
                     <span className="text-emerald-600">Lucro: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(eco.margin)}</span>
                     <span className="text-red-500">Custo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(eco.cost)}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Operational Performance */}
        <div className="bg-slate-900 p-10 rounded-[48px] text-white space-y-8 shadow-2xl">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Performance por Área</h3>
              <Layers size={20} className="text-white/20" />
           </div>
           <div className="grid grid-cols-1 gap-4">
              {tasksByEcosystem.filter(e => e.total > 0).map(eco => (
                <div key={eco.id} className="flex items-center gap-6 p-4 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all">
                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl" style={{ backgroundColor: `${eco.color}20`, color: eco.color }}>
                      <TrendingUp size={24} />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                         <p className="font-bold text-sm">{eco.name}</p>
                         <p className="text-[10px] font-black uppercase text-white/40">{eco.completed}/{eco.total} entregas</p>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                         <div className="bg-white h-full" style={{ width: `${eco.rate}%` }} />
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`text-lg font-black ${eco.rate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {eco.rate.toFixed(0)}%
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
