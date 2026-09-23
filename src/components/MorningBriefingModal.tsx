import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sun, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  X, 
  ArrowRight, 
  Target, 
  MessageSquare, 
  Send, 
  RotateCcw,
  Sparkles,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Task, User } from '../types';
import { estaAtrasada, formatTimeRelative } from '../lib/taskUtils';
import { ECOSYSTEMS } from '../lib/constants';

interface MorningBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  users: User[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSetDailyPriority?: (taskTitle: string) => void;
}

export function MorningBriefingModal({
  isOpen,
  onClose,
  tasks,
  users,
  onUpdateTask,
  onSetDailyPriority
}: MorningBriefingModalProps) {
  const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'posted' && t.status !== 'canceled');
  const delayedTasks = pendingTasks.filter(t => estaAtrasada(t.dueDate));

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [justDoneIds, setJustDoneIds] = useState<string[]>([]);

  const handleMarkDone = (id: string) => {
    setJustDoneIds(prev => [...prev, id]);
    setTimeout(() => {
      onUpdateTask(id, {
        status: 'done',
        deliveryDate: new Date().toISOString()
      });
    }, 400);
  };

  const handleCobrarWhatsApp = (task: Task) => {
    const assignee = users.find(u => u.id === task.assigneeId);
    const nome = assignee ? assignee.name : 'Equipe';
    const eco = ECOSYSTEMS.find(e => e.id === task.ecosystemId)?.name || 'Operacional Reev';
    const msg = `Bom dia ${nome}! Estou no alinhamento matinal do sistema e notei que a demanda "${task.title}" (${eco}) ficou pendente de ontem. Vamos destravar e concluir isso hoje sem falta?`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleProrrogarAmanha = (id: string) => {
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    onUpdateTask(id, { dueDate: amanha });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white border border-slate-200 w-full max-w-3xl max-h-[90vh] rounded-[36px] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-amber-500 text-slate-950 flex items-center justify-between border-b border-amber-600/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/30 text-slate-950 flex items-center justify-center font-black">
              <Sun size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Cobrança Matinal do Gestor</h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded-full">
                  Início do Dia
                </span>
              </div>
              <p className="text-xs text-slate-900/80 font-medium">
                O sistema guardou as pendências de ontem para você não esquecer nada hoje.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-black/10 hover:bg-black/20 text-slate-950 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Summary Warning */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-black text-sm text-amber-950">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>Você tem {pendingTasks.length} demandas pendentes de ontem ({delayedTasks.length} com prazo expirado).</span>
            </div>
            <p className="font-medium text-amber-800">
              Resolva, cobre no WhatsApp da equipe ou defina como foco prioritário antes de abrir novas frentes.
            </p>
          </div>

          {/* List of Tasks to Charge */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                Lista de Cobrança por Demanda
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {pendingTasks.length} itens aguardando ação
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingTasks.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                  <p className="text-sm font-black text-slate-800">Zero pendências acumuladas!</p>
                  <p className="text-xs text-slate-400">Sua esteira de operações está limpa para novos objetivos.</p>
                </div>
              ) : (
                pendingTasks.map(task => {
                  const assignee = users.find(u => u.id === task.assigneeId);
                  const isDelayed = estaAtrasada(task.dueDate);
                  const isDoneAnim = justDoneIds.includes(task.id);
                  const eco = ECOSYSTEMS.find(e => e.id === task.ecosystemId);

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isDoneAnim 
                          ? 'opacity-30 line-through bg-emerald-50 border-emerald-300'
                          : isDelayed
                          ? 'bg-red-50/50 border-red-200 hover:border-red-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                              {eco?.name || 'Operacional Reev'}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              task.priority === 'P1' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {task.priority}
                            </span>
                            {isDelayed && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-600 text-white animate-pulse">
                                Atrasada
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-bold">
                              {formatTimeRelative(task.dueDate)}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-slate-900">{task.title}</p>
                        </div>

                        <div className="text-xs text-slate-500 font-bold shrink-0">
                          Resp: <span className="text-slate-800">{assignee?.name || 'Não atribuído'}</span>
                        </div>
                      </div>

                      {/* Action buttons per task */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 flex-wrap">
                        {onSetDailyPriority && (
                          <button
                            onClick={() => {
                              onSetDailyPriority(task.title);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-black transition-colors flex items-center gap-1"
                          >
                            <Target size={12} />
                            <span>Puxar p/ Foco Hoje</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleCobrarWhatsApp(task)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black transition-colors flex items-center gap-1"
                          title="Abrir WhatsApp com cobrança pronta para o responsável"
                        >
                          <MessageSquare size={12} />
                          <span>Cobrar no Whats</span>
                        </button>

                        <button
                          onClick={() => handleProrrogarAmanha(task.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                          title="Repactuar para amanhã"
                        >
                          <Clock size={12} />
                          <span>Prorrogar +24h</span>
                        </button>

                        <button
                          onClick={() => handleMarkDone(task.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-black transition-colors"
                        >
                          Concluir
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Cobrança matinal diária do Comando Tome Nota & Reev
          </span>

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Iniciar o Dia</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
