import React from 'react';
import { motion } from 'motion/react';
import { Task, User, Client } from '../types';
import { getTaskStatusVisuals, formatTimeRelative, estaAtrasada, venceHoje, getAssigneeDisplayName, getAssigneeInitials, formatDeliveryDate } from '../lib/taskUtils';
import { Flame, Clock, ShieldAlert, MessageCircle, CheckCircle2 } from 'lucide-react';
import { ECOSYSTEMS } from '../lib/constants';

interface CockpitProps {
  tasks: Task[];
  clients: Client[];
  users: User[];
  onSetFocus?: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export function Cockpit({ tasks, clients, users, onSetFocus, onUpdateTask }: CockpitProps) {
  const delayedTasks = tasks.filter(t => {
    return estaAtrasada(t.dueDate) && t.status !== 'done' && t.status !== 'posted';
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const dueToday = tasks.filter(t => {
    return venceHoje(t.dueDate) && !estaAtrasada(t.dueDate) && t.status !== 'done' && t.status !== 'posted';
  });

  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  
  const waitingApproval = tasks.filter(t => t.stage === 'client_approval' || t.status === 'waiting_approval');

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Cockpit da Coordenação</h1>
          <p className="text-slate-500 font-medium text-lg italic">Onde a operação é destravada. Ação rápida, sem achismo.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Atrasados */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-red-600 border-b border-red-100 pb-4">
            <Flame size={24} />
            <h2 className="text-2xl font-black uppercase tracking-widest">Atrasados ({delayedTasks.length})</h2>
          </div>
          {delayedTasks.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={32} />} message="Nenhuma pendência atrasada." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {delayedTasks.map(t => <CockpitCard key={t.id} task={t} clients={clients} users={users} />)}
            </div>
          )}
        </section>

        {/* Vence Hoje */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-amber-500 border-b border-amber-100 pb-4">
            <Clock size={24} />
            <h2 className="text-2xl font-black uppercase tracking-widest">Vence Hoje ({dueToday.length})</h2>
          </div>
          {dueToday.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={32} />} message="Nada vencendo hoje." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dueToday.map(t => <CockpitCard key={t.id} task={t} clients={clients} users={users} />)}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bloqueados */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-purple-600 border-b border-purple-100 pb-4">
              <ShieldAlert size={24} />
              <h2 className="text-2xl font-black uppercase tracking-widest">Bloqueados ({blockedTasks.length})</h2>
            </div>
            <div className="space-y-4">
              {blockedTasks.length === 0 ? (
                <EmptyState icon={<CheckCircle2 size={32} />} message="Sem bloqueios na operação." />
              ) : (
                blockedTasks.map(t => <CockpitCard key={t.id} task={t} clients={clients} users={users} compact />)
              )}
            </div>
          </section>

          {/* Aguardando Aprovação */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-orange-500 border-b border-orange-100 pb-4">
              <MessageCircle size={24} />
              <h2 className="text-2xl font-black uppercase tracking-widest">Aprovação ({waitingApproval.length})</h2>
            </div>
            <div className="space-y-4">
              {waitingApproval.length === 0 ? (
                <EmptyState icon={<CheckCircle2 size={32} />} message="Nada aguardando aprovação." />
              ) : (
                waitingApproval.map(t => <CockpitCard key={t.id} task={t} clients={clients} users={users} compact />)
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const EmptyState = ({ icon, message }: { icon: React.ReactNode; message: string }) => (
  <div className="p-8 border-2 border-dashed border-slate-100 rounded-[32px] text-center space-y-3 bg-slate-50/50">
    <div className="text-slate-300 flex justify-center">{icon}</div>
    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{message}</p>
  </div>
);

const CockpitCard: React.FC<{ task: Task; clients: Client[]; users: User[]; compact?: boolean }> = ({ task, clients, users, compact }) => {
  const visuals = getTaskStatusVisuals(task);
  const assigneeName = getAssigneeDisplayName(task.assigneeId, users);
  const initials = getAssigneeInitials(task.assigneeId, users);
  const eco = ECOSYSTEMS.find(e => e.id === task.ecosystemId);
  const client = clients.find(c => c.id === task.clientId);
  const isDone = task.status === 'done' || task.status === 'posted';

  const handleCobrar = () => {
    const nome = assigneeName !== 'Sem responsável' ? assigneeName : 'Responsável';
    const text = `Oi ${nome}, tudo bem? Vi aqui que a tarefa "${task.title}" está marcando como atrasada. Conseguimos resolver hoje?`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div className={`bg-white border-2 rounded-[32px] p-6 space-y-5 shadow-sm hover:shadow-md transition-all ${visuals.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${visuals.bg} ${visuals.text}`}>
            {formatTimeRelative(task.dueDate)}
          </span>
          {task.origem === 'whatsapp' && (
            <span
              className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-help"
              title={task.origemChat || 'WhatsApp'}
            >
              <MessageCircle size={10} />
              via WhatsApp
            </span>
          )}
          {client && (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-lg">
              {client.name}
            </span>
          )}
          {assigneeName === 'Sem responsável' && (
            <span className="px-3 py-1 bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest rounded-lg">
              Sem responsável
            </span>
          )}
        </div>
        <div 
          className={`w-8 h-8 rounded-xl ${assigneeName !== 'Sem responsável' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 border border-dashed border-slate-300'} flex items-center justify-center font-black text-[10px] shadow-sm`}
          title={assigneeName}
        >
          {initials}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-black text-slate-900 leading-tight">{task.title}</h4>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: eco?.color }} />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{eco?.name}</span>
           <span className="text-slate-300">•</span>
           <span className="text-[10px] font-bold text-slate-500">
             {assigneeName}
           </span>
           {isDone && task.deliveryDate && (
             <>
               <span className="text-slate-300">•</span>
               <span className="text-[10px] font-bold text-emerald-600">
                 entregue em {formatDeliveryDate(task.deliveryDate)}
               </span>
             </>
           )}
        </div>
      </div>

      {task.status === 'blocked' && task.blockedReason && (
        <div className="p-3 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-100">
          Bloqueio: {task.blockedReason.replace(/_/g, ' ')}
        </div>
      )}

      <div className="pt-4 border-t border-slate-50 flex gap-3">
        <button 
          onClick={handleCobrar}
          className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
        >
          Cobrar
        </button>
      </div>
    </motion.div>
  );
};
