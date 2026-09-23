import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  DollarSign, 
  Calendar,
  ChevronRight,
  X,
  Trash2,
  Edit2,
  TrendingUp,
  BarChart3,
  Layers,
  Target,
  AlertTriangle
} from 'lucide-react';
import { Client, Task } from '../types';
import { ECOSYSTEMS } from '../lib/constants';

interface ClientManagementProps {
  clients: Client[];
  tasks: Task[];
  onAddClient: (client: any) => void;
  onUpdateClient: (id: string, updates: any) => void;
  onDeleteClient: (id: string) => void;
  onAddTask: (task: any) => void;
  onSetFocus?: (id: string) => void;
}

export function ClientManagement({ 
  clients, 
  tasks, 
  onAddClient, 
  onUpdateClient, 
  onDeleteClient,
  onAddTask, 
  onSetFocus 
}: ClientManagementProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(clients[0]?.id);
  const [showAddClient, setShowAddClient] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Seleção inicial resiliente a carregamento lento
  useEffect(() => {
    if (clients.length > 0) {
      if (!selectedClientId || !clients.some(c => c.id === selectedClientId)) {
        setSelectedClientId(clients[0].id);
      }
    }
  }, [clients, selectedClientId]);
  
  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: '',
    fee: 0,
    cost: 0,
    ecosystemId: 'agency',
    status: 'active' as const
  });

  const currentClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const clientTasks = currentClient ? tasks.filter(t => t.clientId === currentClient.id) : [];

  const completedClientTasks = clientTasks.filter(t => t.status === 'done' || t.status === 'posted');
  const onTimeClientTasks = completedClientTasks.filter(t => t.deliveryDate ? new Date(t.deliveryDate) <= new Date(t.dueDate) : true);
  const clientHealth = completedClientTasks.length > 0 ? (onTimeClientTasks.length / completedClientTasks.length) * 100 : 100;
  const isAtRisk = clientHealth < 75;
  
  const clientMargin = currentClient ? currentClient.fee - (currentClient.cost || 0) : 0;
  const clientMarginPerc = currentClient && currentClient.fee > 0 ? (clientMargin / currentClient.fee) * 100 : 0;
  const isLowMargin = clientMarginPerc < 40;

  const handleAddClient = () => {
    if (!newClient.name) return;
    onAddClient({
      ...newClient,
      nextMeeting: new Date().toISOString(),
    });
    setNewClient({ name: '', fee: 0, cost: 0, ecosystemId: 'agency', status: 'active' });
    setShowAddClient(false);
  };

  const handleUpdateFee = (id: string, fee: number) => {
    onUpdateClient(id, { fee });
    setEditingClientId(null);
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gerenciamento de Clientes</h1>
          <p className="text-slate-500 font-medium text-lg">Operação, faturamento e retenção.</p>
        </div>
        <button 
          onClick={() => setShowAddClient(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          <Plus size={18} /> Novo Cliente
        </button>
      </header>

      {/* Client Horizontal Selector */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {clients.map(client => (
          <button
            key={client.id}
            onClick={() => setSelectedClientId(client.id)}
            className={`flex-shrink-0 px-8 py-6 rounded-[32px] border transition-all space-y-2 min-w-[200px] text-left ${
              selectedClientId === client.id 
                ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105' 
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
            }`}
          >
            <p className={`text-[10px] font-black uppercase tracking-widest ${selectedClientId === client.id ? 'text-white/40' : 'text-slate-400'}`}>
              {ECOSYSTEMS.find(e => e.id === client.ecosystemId)?.name || 'Cliente'}
            </p>
            <h3 className="text-lg font-black leading-tight">{client.name}</h3>
            <div className="flex items-center justify-between mt-4">
               <span className="text-xs font-bold">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.fee)}
               </span>
               <div className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>
          </button>
        ))}
      </div>

      {currentClient && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-8">
               <div className="flex items-center justify-between">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl">
                    {currentClient.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onDeleteClient(currentClient.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
               </div>

               <div>
                  <h2 className="text-2xl font-black text-slate-900">{currentClient.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                      {currentClient.status}
                    </span>
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-slate-400">
                      <DollarSign size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">Fee Mensal</span>
                    </div>
                    {editingClientId === currentClient.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          className="w-24 bg-slate-50 border rounded-lg px-2 py-1 text-xs font-black text-slate-900 outline-none"
                          defaultValue={currentClient.fee}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateFee(currentClient.id, Number((e.target as HTMLInputElement).value));
                          }}
                          autoFocus
                        />
                        <button onClick={() => setEditingClientId(null)}><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentClient.fee)}
                        </span>
                        <button onClick={() => setEditingClientId(currentClient.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-900 transition-all">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Calendar size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">Próxima Reunião</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">TBD</span>
                  </div>
               </div>
            </div>
            
            <div className="bg-white p-8 rounded-[40px] border shadow-sm space-y-3">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Margem (Lucro vs Custo)</h3>
               <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-slate-900">{clientMargin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
               </div>
               <div className={`px-3 py-1.5 w-fit rounded-xl text-[10px] font-black uppercase tracking-widest ${isLowMargin ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {clientMarginPerc.toFixed(1)}% ({isLowMargin ? 'Atenção: Margem Baixa' : 'Margem Saudável'})
               </div>
            </div>

            <div className={`p-8 rounded-[40px] text-white space-y-6 shadow-2xl ${isAtRisk ? 'bg-red-500' : 'bg-slate-900'}`}>
               <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Saúde da Conta</h3>
               <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                     <span className="font-bold">Entregas no Prazo</span>
                     <span className="font-black">{clientHealth.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                     <div className="bg-emerald-400 h-full" style={{ width: `${clientHealth}%` }} />
                  </div>
               </div>
               <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${isAtRisk ? 'text-white' : 'text-emerald-400'}`}>
                  {isAtRisk ? <AlertTriangle size={14} /> : <TrendingUp size={14} />} 
                  {isAtRisk ? 'Risco de Churn Elevado' : 'Tendência de Retenção Alta'}
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Operação & Entregas</h2>
                <div className="flex items-center gap-2">
                   <div className="bg-white px-4 py-2 rounded-xl border text-[10px] font-black uppercase text-slate-400">
                     {clientTasks.length} Tarefas
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {clientTasks.map(task => (
                 <div key={task.id} className="bg-white p-6 rounded-[32px] border shadow-sm hover:shadow-md transition-all space-y-4 group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg">
                        {task.layer}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        task.status === 'done' ? 'text-emerald-500' : 'text-amber-500'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 leading-tight group-hover:text-slate-600 transition-colors">
                      {task.title}
                    </h4>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px]">
                           {task.assigneeId.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{task.assigneeId}</span>
                      </div>
                      <button 
                        onClick={() => onSetFocus?.(task.id)}
                        className="text-xs font-black text-slate-900 flex items-center gap-1 hover:underline"
                      >
                        Focar <ChevronRight size={14} />
                      </button>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <AnimatePresence>
        {showAddClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10 space-y-8">
                 <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Novo Cliente</h3>
                      <p className="text-slate-400 text-sm font-medium">Expanda a operação do Grupo.</p>
                    </div>
                    <button onClick={() => setShowAddClient(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                       <X size={24} className="text-slate-300" />
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome da Empresa/Pessoa</label>
                       <input 
                         className="w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                         placeholder="Ex: Brasa Holding"
                         value={newClient.name}
                         onChange={e => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fee Mensal (R$)</label>
                          <input 
                            type="number"
                            className="w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                            placeholder="0"
                            value={newClient.fee}
                            onChange={e => setNewClient(prev => ({ ...prev, fee: Number(e.target.value) }))}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Custo Operacional (R$)</label>
                          <input 
                            type="number"
                            className="w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                            placeholder="0"
                            value={newClient.cost}
                            onChange={e => setNewClient(prev => ({ ...prev, cost: Number(e.target.value) }))}
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ecossistema</label>
                       <select 
                         className="w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none appearance-none"
                         value={newClient.ecosystemId}
                         onChange={e => setNewClient(prev => ({ ...prev, ecosystemId: e.target.value }))}
                          >
                             {ECOSYSTEMS.map(eco => (
                               <option key={eco.id} value={eco.id}>{eco.name}</option>
                             ))}
                       </select>
                    </div>
                 </div>

                 <button 
                   onClick={handleAddClient}
                   className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                 >
                   Confirmar Onboarding
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
