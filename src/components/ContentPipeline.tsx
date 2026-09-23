import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Film, 
  PenTool, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Filter,
  BarChart,
  X,
  Target,
  MessageCircle
} from 'lucide-react';
import { Task, TaskStage, User } from '../types';
import { ECOSYSTEMS } from '../lib/constants';
import { useSession } from './AuthGate';
import { getTaskStatusVisuals, formatTimeRelative, formatTimeInStage, getAssigneeDisplayName, getAssigneeInitials, formatDeliveryDate } from '../lib/taskUtils';

interface ContentPipelineProps {
  items: Task[];
  users: User[];
  onUpdateStage: (id: string, stage: TaskStage) => void;
  onAddContent: (title: string, ecosystemId: string, assigneeId: string) => void;
  onSetFocus?: (id: string) => void;
}

export function ContentPipeline({ items, users, onUpdateStage, onAddContent, onSetFocus }: ContentPipelineProps) {
  const { email } = useSession();
  const loggedUser = users.find(u => u.email === email || u.id === 'gestor');
  const initialAssigneeId = loggedUser?.id || users[0]?.id || '';
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(initialAssigneeId);

  useEffect(() => {
    if (users.length > 0 && !selectedAssigneeId) {
      const found = users.find(u => u.email === email || u.id === 'gestor');
      setSelectedAssigneeId(found?.id || users[0].id);
    }
  }, [users, email, selectedAssigneeId]);

  const stages: { id: TaskStage; label: string; color: string }[] = [
    { id: 'idea', label: 'Ideia', color: 'bg-slate-400' },
    { id: 'script', label: 'Roteiro', color: 'bg-blue-500' },
    { id: 'production', label: 'Produção', color: 'bg-amber-500' },
    { id: 'internal_review', label: 'Revisão Interna', color: 'bg-purple-500' },
    { id: 'client_approval', label: 'Aprovação Cliente', color: 'bg-orange-500' },
    { id: 'scheduled', label: 'Agendado', color: 'bg-emerald-400' },
    { id: 'posted', label: 'Postado', color: 'bg-emerald-600' },
    { id: 'metrics', label: 'Métricas', color: 'bg-indigo-500' },
  ];

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEco, setNewEco] = useState(ECOSYSTEMS[0].id);

  const handleAdd = () => {
    if (!newTitle) return;
    onAddContent(newTitle, newEco, selectedAssigneeId || users[0]?.id || 'gestor');
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Produção de Conteúdo & Mídia</h1>
          <p className="text-slate-500 font-medium text-lg">Fluxo contínuo de pautas, roteiros, aprovações e publicações.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-[24px] flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
        >
          <Plus size={20} /> Novo Conteúdo
        </button>
      </header>

      {/* Visual Pipeline */}
      <div className="flex overflow-x-auto pb-10 custom-scrollbar -mx-4 px-4 gap-8">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80 space-y-6">
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stage.color} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">{stage.label}</h3>
              </div>
              <span className="text-[10px] font-black bg-white border border-slate-100 px-3 py-1 rounded-full text-slate-400">
                {items.filter(i => i.stage === stage.id).length}
              </span>
            </div>

            <div className="space-y-4 h-full min-h-[500px]">
              {items.filter(i => i.stage === stage.id).map((item) => (
                <ContentCard 
                  key={item.id} 
                  item={item} 
                  users={users}
                  nextStage={stages[stages.findIndex(s => s.id === stage.id) + 1]?.id}
                  onMove={onUpdateStage}
                  onSetFocus={onSetFocus}
                />
              ))}
              {items.filter(i => i.stage === stage.id).length === 0 && (
                <div className="h-32 border-2 border-dashed border-slate-100 rounded-[32px] flex items-center justify-center bg-slate-50/30">
                  <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Aguardando Fluxo</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[48px] p-12 w-full max-w-xl shadow-2xl space-y-10"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Injetar Ideia</h3>
                <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={24} className="text-slate-300" />
                </button>
              </div>
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Título do Conteúdo</label>
                    <input 
                      autoFocus
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 rounded-[24px] px-6 py-5 text-lg font-black outline-none transition-all" 
                      placeholder="O que vamos produzir?"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Responsável</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 rounded-[24px] px-4 py-5 text-sm font-bold outline-none transition-all h-[68px]"
                      value={selectedAssigneeId}
                      onChange={e => setSelectedAssigneeId(e.target.value)}
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Ecossistema Destino</label>
                  <div className="grid grid-cols-2 gap-3">
                    {ECOSYSTEMS.map(e => (
                      <button
                        key={e.id}
                        onClick={() => setNewEco(e.id)}
                        className={`px-6 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                          newEco === e.id 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xl' 
                            : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleAdd}
                className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-[0.98]"
              >
                Registrar no Pipeline
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ContentCard: React.FC<{ 
  item: Task; 
  users: User[];
  nextStage?: TaskStage; 
  onMove: (id: string, stage: TaskStage) => void;
  onSetFocus?: (id: string) => void;
}> = ({ item, users, nextStage, onMove, onSetFocus }) => {
  const eco = ECOSYSTEMS.find(e => e.id === item.ecosystemId);
  const assigneeName = getAssigneeDisplayName(item.assigneeId, users);
  const initials = getAssigneeInitials(item.assigneeId, users);
  const visuals = getTaskStatusVisuals(item);
  const isDone = item.status === 'done' || item.status === 'posted';

  return (
    <motion.div 
      layoutId={item.id}
      className={`bg-white p-6 rounded-[32px] border-2 shadow-sm hover:shadow-xl transition-all group space-y-6 relative overflow-hidden ${visuals.border}`}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 mr-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: eco?.color }} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{eco?.name}</span>
          </div>
          {item.origem === 'whatsapp' && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider cursor-help"
              title={item.origemChat || 'WhatsApp'}
            >
              <MessageCircle size={10} />
              via WhatsApp
            </span>
          )}
          {item.lastStageUpdate && (
            <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
              {formatTimeInStage(item.lastStageUpdate)}
            </span>
          )}
          <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${visuals.bg} ${visuals.text}`}>
            {formatTimeRelative(item.dueDate)}
          </span>
        </div>
        <button 
          onClick={() => onSetFocus?.(item.id)}
          className="opacity-0 group-hover:opacity-100 flex items-center gap-2 text-[10px] font-black uppercase bg-slate-900 text-white px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95"
        >
          <Target size={12} /> Focar
        </button>
      </div>

      <h4 className="text-lg font-black text-slate-900 leading-[1.3] group-hover:text-slate-600 transition-colors relative z-10">{item.title}</h4>

      <div className="flex items-center justify-between pt-5 border-t border-slate-50 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-[10px] shadow-lg">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsável</span>
            <span className="text-[10px] font-bold text-slate-900 uppercase">{assigneeName}</span>
            {isDone && item.deliveryDate && (
              <span className="text-[9px] font-bold text-emerald-600">
                entregue em {formatDeliveryDate(item.deliveryDate)}
              </span>
            )}
          </div>
        </div>
        
        {nextStage && (
          <button 
            onClick={() => onMove(item.id, nextStage)}
            className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
          >
            <ArrowRight size={18} />
          </button>
        )}
      </div>

      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity">
        <Film size={80} />
      </div>
    </motion.div>
  );
};
