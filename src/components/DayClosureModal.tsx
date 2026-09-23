import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Moon, 
  Sun, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  X, 
  Save, 
  Copy, 
  Check, 
  Send, 
  ArrowRight,
  TrendingUp,
  Activity,
  Flame,
  MessageSquare
} from 'lucide-react';
import { Task, DayClosure, Habit } from '../types';
import { estaAtrasada } from '../lib/taskUtils';

interface DayClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  habits: Habit[];
  energyLevel: number;
  onSaveClosure: (closure: DayClosure) => void;
  onOpenMorningBriefing?: () => void;
}

export function DayClosureModal({
  isOpen,
  onClose,
  tasks,
  habits,
  energyLevel,
  onSaveClosure,
  onOpenMorningBriefing,
}: DayClosureModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [notes, setNotes] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiReport, setAiReport] = useState<{
    closureSummary: string;
    tomorrowMorningBriefing: string;
    whatsappTeamCobrança: string;
    suggestedTop3Tomorrow: string[];
  } | null>(null);
  const [copiedCobrança, setCopiedCobrança] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Calculations for today
  const activeTasks = tasks.filter(t => t.status !== 'canceled');
  const completedToday = activeTasks.filter(t => t.status === 'done' || t.status === 'posted');
  const pendingTasks = activeTasks.filter(t => t.status !== 'done' && t.status !== 'posted');
  const delayedTasks = pendingTasks.filter(t => estaAtrasada(t.dueDate));

  const totalHabits = habits.length;
  const habitsDone = habits.filter(h => h.completedDates?.includes(today)).length;
  const habitRate = totalHabits > 0 ? Math.round((habitsDone / totalHabits) * 100) : 0;

  const handleGenerateAIClosing = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/day-closure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedTasks: completedToday,
          pendingTasks,
          delayedTasks,
          habitsRate: habitRate,
          energyLevel,
          notes
        })
      });
      const data = await response.json();
      setAiReport(data);
    } catch (err) {
      console.error('Erro ao gerar fechamento:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = () => {
    const closure: DayClosure = {
      id: today,
      date: today,
      closedAt: new Date().toISOString(),
      tasksCompletedToday: completedToday.length,
      tasksPendingCount: pendingTasks.length,
      pendingTaskIds: pendingTasks.map(t => t.id),
      energyLevel,
      habitsCompletionRate: habitRate,
      summaryNotes: notes || aiReport?.closureSummary || '',
      tomorrowPriorities: aiReport?.suggestedTop3Tomorrow || pendingTasks.slice(0, 3).map(t => t.title),
      acknowledgedNextDay: false,
    };

    onSaveClosure(closure);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const handleCopyCobrança = () => {
    if (!aiReport?.whatsappTeamCobrança) return;
    navigator.clipboard.writeText(aiReport.whatsappTeamCobrança);
    setCopiedCobrança(true);
    setTimeout(() => setCopiedCobrança(false), 2000);
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
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Moon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Fechamento do Dia & Salvar Histórico</h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                  Transição Diária
                </span>
              </div>
              <p className="text-xs text-white/60 font-medium">
                Salva o balanço de hoje e prepara a cobrança executiva para amanhã cedo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {savedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Dia encerrado com sucesso! A cobrança matinal já está pronta para amanhã.</span>
            </div>
          )}

          {/* Quick Metrics of Today */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-1">
                Concluídas Hoje
              </span>
              <p className="text-2xl font-black text-emerald-700">{completedToday.length}</p>
              <span className="text-[10px] font-medium text-emerald-600">entregas feitas</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block mb-1">
                Pendentes p/ Amanhã
              </span>
              <p className="text-2xl font-black text-amber-700">{pendingTasks.length}</p>
              <span className="text-[10px] font-medium text-amber-600">cobrança matinal</span>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-200/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-700 block mb-1">
                Atrasadas Críticas
              </span>
              <p className="text-2xl font-black text-red-700">{delayedTasks.length}</p>
              <span className="text-[10px] font-medium text-red-600">em alerta</span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block mb-1">
                Hábitos Cumpridos
              </span>
              <p className="text-2xl font-black text-purple-700">{habitRate}%</p>
              <span className="text-[10px] font-medium text-purple-600">{habitsDone} de {totalHabits}</span>
            </div>
          </div>

          {/* Pending Demands list that will rollover to tomorrow */}
          <div className="space-y-2.5 bg-slate-50 p-5 rounded-[28px] border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" />
                O que não foi finalizado hoje e será cobrado amanhã:
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {pendingTasks.length} demandas
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {pendingTasks.length === 0 ? (
                <p className="text-xs text-emerald-600 font-bold py-2">
                  🎉 Incrível! Zero pendências abertas. Dia 100% zerado!
                </p>
              ) : (
                pendingTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        task.priority === 'P1' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <span className="font-bold text-slate-800 truncate">{task.title}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                      {task.ecosystemId === 'reev' ? 'Reev' : task.ecosystemId}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Leader Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700">
              Anotações & Aprendizados do Dia
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="O que funcionou bem hoje? O que travou na Reev ou no Tome Nota? Algum recado para amanhã?"
              rows={3}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* AI Advisor Button */}
          {!aiReport ? (
            <button
              onClick={handleGenerateAIClosing}
              disabled={isGeneratingAI}
              className="w-full py-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>{isGeneratingAI ? 'Gerando Análise & Cobrança...' : 'Gerar Análise e Cobrança Matinal com IA'}</span>
            </button>
          ) : (
            <div className="space-y-4 p-5 rounded-[28px] bg-indigo-50/70 border border-indigo-200 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">
                  Resumo Executivo do Fechamento
                </span>
                <p className="font-bold text-indigo-950 leading-relaxed">
                  {aiReport.closureSummary}
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-indigo-200/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">
                  Cobrança Matinal Prevista para Amanhã
                </span>
                <p className="font-medium text-indigo-900 leading-relaxed">
                  {aiReport.tomorrowMorningBriefing}
                </p>
              </div>

              {aiReport.whatsappTeamCobrança && (
                <div className="pt-2 border-t border-indigo-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                      <MessageSquare size={13} />
                      Mensagem Pronta para o WhatsApp da Equipe
                    </span>
                    <button
                      onClick={handleCopyCobrança}
                      className="text-[11px] font-bold text-indigo-800 hover:text-indigo-950 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition-colors"
                    >
                      {copiedCobrança ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedCobrança ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-white rounded-xl border border-indigo-100 text-[11px] text-slate-800 font-sans whitespace-pre-wrap">
                    {aiReport.whatsappTeamCobrança}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={savedSuccess}
            className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save size={16} />
            <span>Salvar Fechamento & Preparar Cobrança</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
