import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckSquare, Layers, Building2, UserPlus, ArrowRight } from 'lucide-react';
import { ECOSYSTEMS } from '../lib/constants';
import { User, Client } from '../types';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  clients: Client[];
  onAddTask: (task: any) => void;
  onAddContent: (title: string, ecosystemId: string, assigneeId: string) => void;
  onAddClient: (client: any) => void;
  defaultType?: 'task' | 'content' | 'client';
}

export function QuickActionModal({
  isOpen,
  onClose,
  users,
  clients,
  onAddTask,
  onAddContent,
  onAddClient,
  defaultType = 'task'
}: QuickActionModalProps) {
  const [activeType, setActiveType] = useState<'task' | 'content' | 'client'>(defaultType);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskEco, setTaskEco] = useState(ECOSYSTEMS[0]?.id || 'agency');
  const [taskAssignee, setTaskAssignee] = useState(users[0]?.id || '');
  const [taskClient, setTaskClient] = useState('');
  const [taskPriority, setTaskPriority] = useState<'P1' | 'P2' | 'P3'>('P2');
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  // Content form state
  const [contentTitle, setContentTitle] = useState('');
  const [contentEco, setContentEco] = useState(ECOSYSTEMS[0]?.id || 'agency');
  const [contentAssignee, setContentAssignee] = useState(users[0]?.id || '');

  // Client form state
  const [clientName, setClientName] = useState('');
  const [clientFee, setClientFee] = useState('5000');
  const [clientCost, setClientCost] = useState('1500');
  const [clientEco, setClientEco] = useState('agency');

  if (!isOpen) return null;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    onAddTask({
      title: taskTitle.trim(),
      description: '',
      ecosystemId: taskEco,
      assigneeId: taskAssignee || users[0]?.id || 'gestor',
      clientId: taskClient || undefined,
      priority: taskPriority,
      layer: 'operation',
      status: 'pending',
      dueDate: taskDueDate || new Date().toISOString().split('T')[0]
    });

    setTaskTitle('');
    onClose();
  };

  const handleCreateContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentTitle.trim()) return;

    onAddContent(contentTitle.trim(), contentEco, contentAssignee || users[0]?.id || 'gestor');
    setContentTitle('');
    onClose();
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    onAddClient({
      name: clientName.trim(),
      fee: Number(clientFee) || 0,
      cost: Number(clientCost) || 0,
      ecosystemId: clientEco,
      status: 'active',
      nextMeeting: ''
    });

    setClientName('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Nova Ação Rápida</h3>
              <p className="text-xs text-slate-500 font-medium">Cadastre itens na operação com 1 clique</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Action Tabs */}
          <div className="grid grid-cols-3 p-2 bg-slate-50 border-b border-slate-100 gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveType('task')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                activeType === 'task'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckSquare size={16} />
              <span>Nova Tarefa</span>
            </button>

            <button
              onClick={() => setActiveType('content')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                activeType === 'content'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers size={16} />
              <span>Novo Conteúdo</span>
            </button>

            <button
              onClick={() => setActiveType('client')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                activeType === 'client'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 size={16} />
              <span>Novo Cliente</span>
            </button>
          </div>

          {/* Forms */}
          <div className="p-6">
            {activeType === 'task' && (
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Título da Tarefa
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    placeholder="Ex: Aprovar campanha de Reels para cliente..."
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Ecossistema
                    </label>
                    <select
                      value={taskEco}
                      onChange={e => setTaskEco(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      {ECOSYSTEMS.map(eco => (
                        <option key={eco.id} value={eco.id}>{eco.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Responsável
                    </label>
                    <select
                      value={taskAssignee}
                      onChange={e => setTaskAssignee(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Prioridade
                    </label>
                    <select
                      value={taskPriority}
                      onChange={e => setTaskPriority(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="P1">P1 - Crítica (Urgente)</option>
                      <option value="P2">P2 - Alta (Padrão)</option>
                      <option value="P3">P3 - Normal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Prazo Limite
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={e => setTaskDueDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Cliente (Opcional)
                    </label>
                    <select
                      value={taskClient}
                      onChange={e => setTaskClient(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="">Nenhum / Geral</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
                  >
                    <span>Criar Tarefa</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {activeType === 'content' && (
              <form onSubmit={handleCreateContent} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Título do Conteúdo / Pauta
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    placeholder="Ex: Carrossel sobre bastidores de redação..."
                    value={contentTitle}
                    onChange={e => setContentTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Canal / Ecossistema
                    </label>
                    <select
                      value={contentEco}
                      onChange={e => setContentEco(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      {ECOSYSTEMS.map(eco => (
                        <option key={eco.id} value={eco.id}>{eco.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Responsável pela Criação
                    </label>
                    <select
                      value={contentAssignee}
                      onChange={e => setContentAssignee(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium">
                  💡 Este conteúdo entrará automaticamente no estágio de <strong>Ideia</strong> no Pipeline de Conteúdo, com prazo sugerido de 7 dias.
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
                  >
                    <span>Lançar no Pipeline</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {activeType === 'client' && (
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Nome do Cliente / Conta
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    placeholder="Ex: Grupo Hospitalar Paulista..."
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Fee Mensal (R$)
                    </label>
                    <input
                      type="number"
                      required
                      value={clientFee}
                      onChange={e => setClientFee(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Custo Operacional (R$)
                    </label>
                    <input
                      type="number"
                      value={clientCost}
                      onChange={e => setClientCost(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Ecossistema
                    </label>
                    <select
                      value={clientEco}
                      onChange={e => setClientEco(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      {ECOSYSTEMS.map(eco => (
                        <option key={eco.id} value={eco.id}>{eco.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md flex items-center gap-2"
                  >
                    <span>Salvar Cliente</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
