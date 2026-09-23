import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Settings, 
  Moon, 
  Sun, 
  Calendar, 
  CheckCircle2, 
  Activity, 
  Heart, 
  Shield, 
  Clock, 
  BookOpen, 
  Plus, 
  Trash2, 
  X, 
  Edit2,
  Sparkles,
  Flame,
  LayoutDashboard,
  Smile
} from 'lucide-react';
import { Habit, TimeBlock, DailyMetrics } from '../types';
import { HabitFlowDashboard } from './HabitFlowDashboard';

interface RoutineCalendarProps {
  habits: Habit[];
  timeBlocks: TimeBlock[];
  metrics: DailyMetrics;
  onUpdateHabit: (id: string, date: string) => void;
  onAddHabit: (habit: any) => void;
  onDeleteHabit: (id: string) => void;
  onUpdateEnergy: (level: number) => void;
  onUpdateEnergyReason: (reason: string) => void;
  onAddImportant: (item: string) => void;
  onDeleteImportant: (index: number) => void;
  onAddTimeBlock: (block: any) => void;
  onDeleteTimeBlock: (id: string) => void;
}

export function RoutineCalendar({ 
  habits, 
  timeBlocks,
  metrics, 
  onUpdateHabit, 
  onAddHabit,
  onDeleteHabit,
  onUpdateEnergy, 
  onUpdateEnergyReason, 
  onAddImportant,
  onDeleteImportant,
  onAddTimeBlock,
  onDeleteTimeBlock
}: RoutineCalendarProps) {
  const [activeTab, setActiveTab] = useState<'habits' | 'timeblocks' | 'energy'>('habits');
  const dayOfWeek = new Date().getDay();
  const [showAddBlock, setShowAddBlock] = useState(false);
  
  const [newBlock, setNewBlock] = useState({
    name: '',
    startTime: '09:00',
    endTime: '11:00',
    type: 'high_performance' as any,
    days: [1, 2, 3, 4, 5]
  });

  const handleAddBlock = () => {
    if (!newBlock.name) return;
    onAddTimeBlock({ ...newBlock, id: Math.random().toString(36).substring(2, 9) });
    setNewBlock({
      name: '',
      startTime: '09:00',
      endTime: '11:00',
      type: 'high_performance',
      days: [1, 2, 3, 4, 5]
    });
    setShowAddBlock(false);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Rotinas, Cadência & Bio-Produtividade
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase">
              CEO & Liderança
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Rotinas & Hábitos</h1>
          <p className="text-slate-500 font-medium text-base mt-1">
            Acompanhe seus hábitos ao longo do dia, monitore constância e proteja seus blocos de foco.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'habits'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Flame size={14} className="text-amber-500" />
            <span>Hábitos & Dashboards</span>
          </button>

          <button
            onClick={() => setActiveTab('timeblocks')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'timeblocks'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock size={14} className="text-blue-500" />
            <span>Blocos de Tempo</span>
          </button>

          <button
            onClick={() => setActiveTab('energy')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'energy'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap size={14} className="text-emerald-500" />
            <span>Bio-Energia & Mente</span>
          </button>
        </div>
      </header>

      {/* TAB 1: FULL HABIT DASHBOARD & FLOW */}
      {activeTab === 'habits' && (
        <HabitFlowDashboard
          habits={habits}
          metrics={metrics}
          onUpdateHabit={onUpdateHabit}
          onAddHabit={onAddHabit}
          onDeleteHabit={onDeleteHabit}
          onUpdateEnergy={onUpdateEnergy}
          onUpdateEnergyReason={onUpdateEnergyReason}
        />
      )}

      {/* TAB 2: TIME BLOCKS & SACRED SPACES */}
      {activeTab === 'timeblocks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Agenda de Blocos do Dia</h2>
                <p className="text-xs text-slate-500 font-medium">Blocos de alta performance, operação e recuperação</p>
              </div>
              <button 
                onClick={() => setShowAddBlock(true)}
                className="flex items-center gap-2 text-xs font-black text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors"
              >
                <Plus size={14} /> Novo Bloco
              </button>
            </div>

            <div className="space-y-4">
              {timeBlocks.filter(b => b.days.includes(dayOfWeek)).length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-[32px] text-center bg-white text-slate-400">
                  <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-sm text-slate-600">Nenhum bloco agendado para hoje.</p>
                  <p className="text-xs text-slate-400 mt-1">Crie um bloco de tempo para proteger seu foco.</p>
                </div>
              ) : (
                timeBlocks.filter(b => b.days.includes(dayOfWeek)).map((block) => (
                  <TimeBlockCard key={block.id} block={block} onDelete={() => onDeleteTimeBlock(block.id)} />
                ))
              )}
            </div>

            <div className="bg-slate-900 rounded-[36px] p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3 text-amber-400 text-[10px] font-black uppercase tracking-[0.3em]">
                  <Shield size={16} /> Espaços Sagrados Protegidos
                </div>
                <h3 className="text-2xl font-black">Mentalidade & Espiritualidade</h3>
                <p className="text-white/60 text-base leading-relaxed max-w-xl italic">
                  "Estes horários são intocáveis para garantir que a liderança do Grupo Tome Nota permaneça lúcida, forte e visionária."
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="bg-white/10 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10">
                    Quinta-feira: Culto (20h)
                  </div>
                  <div className="bg-white/10 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10">
                    Domingo: Recarga Estratégica
                  </div>
                </div>
              </div>
              <Sun className="absolute -bottom-10 -right-10 text-white/5 opacity-10" size={240} />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[36px] border border-slate-200/80 shadow-2xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Todos os Blocos</h3>
                  <p className="text-sm font-bold text-slate-900">{timeBlocks.length} configurados</p>
                </div>
                <button 
                  onClick={() => setShowAddBlock(true)} 
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-2.5">
                {timeBlocks.map(b => (
                  <div key={b.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{b.name}</p>
                      <span className="text-[10px] text-slate-400">{b.startTime} - {b.endTime}</span>
                    </div>
                    <button onClick={() => onDeleteTimeBlock(b.id)} className="text-slate-300 hover:text-red-500 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* TAB 3: BIO-ENERGY & IMPACT REFLECTION */}
      {activeTab === 'energy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Energy Level Slider */}
          <div className="bg-white p-8 sm:p-10 rounded-[36px] border border-slate-200/80 shadow-2xs space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Nível de Energia Diária</h3>
                <p className="text-sm font-bold text-slate-900">Como você avalia sua vitalidade hoje?</p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                <Zap size={22} />
              </div>
            </div>

            <div className="space-y-6 text-center">
              <div className="relative inline-block">
                <p className="text-6xl font-black text-slate-900 leading-none">{metrics.energyLevel}</p>
                <span className="text-xs font-black text-slate-400 absolute -bottom-4 left-1/2 -translate-x-1/2 uppercase">/ 10</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="1"
                value={metrics.energyLevel}
                onChange={(e) => onUpdateEnergy(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-900"
              />
              <div className="text-left space-y-2 pt-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Feedback de Estado Mental
                </label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none resize-none h-32 transition-all"
                  placeholder="Como está sua mente, foco e disposição hoje?"
                  value={metrics.energyReason || ''}
                  onChange={(e) => onUpdateEnergyReason(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Pending Important Notes */}
          <div className="bg-slate-900 p-8 sm:p-10 rounded-[36px] text-white space-y-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-white/40">Pendências de Impacto Pessoal</h3>
                  <p className="text-sm font-bold text-white">Reflexões e compromissos que não podem ser esquecidos</p>
                </div>
                <Heart size={18} className="text-rose-400" />
              </div>

              <div className="space-y-3">
                {(metrics.pendingImportant || []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 group">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-sm font-bold text-white/90">{item}</span>
                    </div>
                    <button onClick={() => onDeleteImportant(idx)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all p-1">
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {(metrics.pendingImportant || []).length === 0 && (
                  <p className="text-xs text-white/40 italic py-4">Nenhuma pendência pessoal anotada no momento.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:bg-white/10 transition-all text-white placeholder:text-white/30"
                placeholder="Pressione Enter para adicionar nova nota de impacto..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onAddImportant((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Time Block Modal */}
      <AnimatePresence>
        {showAddBlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-[36px] p-6 sm:p-8 space-y-6 shadow-2xl">
              <h3 className="text-xl font-black text-slate-900 uppercase">Novo Bloco de Tempo</h3>
              <div className="space-y-4">
                <input 
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none"
                  placeholder="Nome do Bloco (Ex: Foco Profundo)"
                  value={newBlock.name}
                  onChange={e => setNewBlock(prev => ({ ...prev, name: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input type="time" className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" value={newBlock.startTime} onChange={e => setNewBlock(prev => ({ ...prev, startTime: e.target.value }))} />
                  <input type="time" className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none" value={newBlock.endTime} onChange={e => setNewBlock(prev => ({ ...prev, endTime: e.target.value }))} />
                </div>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none"
                  value={newBlock.type}
                  onChange={e => setNewBlock(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="high_performance">Alta Performance (Foco Criativo/Estratégico)</option>
                  <option value="operational">Operacional (Reuniões & Mensagens)</option>
                  <option value="lightness">Leveza/Recuperação (Descompressão)</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddBlock(false)} className="flex-1 py-3 text-xs font-black uppercase text-slate-400">Cancelar</button>
                <button onClick={handleAddBlock} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-xs font-black uppercase shadow-lg hover:bg-slate-800">Criar Bloco</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TimeBlockCard: React.FC<{ block: TimeBlock; onDelete: () => void }> = ({ block, onDelete }) => {
  const typeIcons = {
    high_performance: Zap,
    operational: Settings,
    lightness: Moon,
  };

  const Icon = typeIcons[block.type];

  return (
    <div className={`p-6 sm:p-7 rounded-[32px] border flex items-center justify-between gap-4 transition-all group hover:shadow-md ${
      block.type === 'high_performance' ? 'bg-blue-50/70 border-blue-100 text-blue-900' :
      block.type === 'operational' ? 'bg-amber-50/70 border-amber-100 text-amber-900' : 'bg-purple-50/70 border-purple-100 text-purple-900'
    }`}>
      <div className="flex items-center gap-4 sm:gap-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
          block.type === 'high_performance' ? 'bg-blue-500' :
          block.type === 'operational' ? 'bg-amber-500' : 'bg-purple-500'
        }`}>
          <Icon size={22} />
        </div>
        <div>
          <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">{block.name}</h4>
          <div className="flex items-center gap-2 mt-1 text-slate-400">
            <Clock size={14} />
            <p className="text-xs font-black uppercase tracking-wider">{block.startTime} — {block.endTime}</p>
          </div>
        </div>
      </div>
      
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-2.5 hover:bg-white/70 rounded-xl transition-all text-slate-400 hover:text-red-500">
        <Trash2 size={16} />
      </button>
    </div>
  );
};
