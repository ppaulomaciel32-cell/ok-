import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Zap, 
  AlertCircle,
  MessageCircle,
  ShieldCheck,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Edit2,
  TrendingUp,
  UserPlus,
  Download,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { Task, User, Client } from '../types';
import { ECOSYSTEMS } from '../lib/constants';
import { useSession } from './AuthGate';
import { db, isCloudEnabled } from '../lib/firebase';
import { collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { downloadColaboradorHtml, gerarTextoColaborador } from '../lib/exportColaborador';
import { estaAtrasada } from '../lib/taskUtils';

interface TeamManagementProps {
  users: User[];
  tasks: Task[];
  clients: Client[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onAddTask: (task: any) => void;
  onAddUser: (user: any) => void;
  onUpdateUser: (id: string, updates: any) => void;
  onDeleteUser: (id: string) => void;
  onSetFocus?: (id: string) => void;
}

export function TeamManagement({ 
  users, 
  tasks, 
  clients,
  onUpdateTask, 
  onAddTask, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser,
  onSetFocus 
}: TeamManagementProps) {
  const { role } = useSession();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(users[0]?.id);
  const [showAddUser, setShowAddUser] = useState(false);
  const [delegatingTask, setDelegatingTask] = useState<Task | null>(null);

  // Seleção inicial resiliente a carregamento lento
  useEffect(() => {
    if (users.length > 0) {
      if (!selectedUserId || !users.some(u => u.id === selectedUserId)) {
        setSelectedUserId(users[0].id);
      }
    }
  }, [users, selectedUserId]);

  // Acessos State
  const [accessMembers, setAccessMembers] = useState<{email: string, role: string}[]>([]);
  const [newAccessEmail, setNewAccessEmail] = useState('');
  const [newAccessRole, setNewAccessRole] = useState<'admin' | 'staff' | 'editor'>('staff');
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  const handleExportSingle = (user: User) => {
    downloadColaboradorHtml(user, tasks, clients, ECOSYSTEMS);
  };

  const handleCopyWhatsApp = (user: User) => {
    const text = gerarTextoColaborador(user, tasks, clients);
    navigator.clipboard.writeText(text);
    setCopiedUserId(user.id);
    setTimeout(() => {
      setCopiedUserId(prev => (prev === user.id ? null : prev));
    }, 2000);
  };

  const handleExportAll = () => {
    const activeMembers = users.filter(u => u.status === 'active');
    activeMembers.forEach((member, index) => {
      setTimeout(() => {
        downloadColaboradorHtml(member, tasks, clients, ECOSYSTEMS);
      }, index * 200);
    });
  };

  useEffect(() => {
    if (role === 'admin' && isCloudEnabled && db) {
      getDocs(collection(db, 'members')).then(snapshot => {
        setAccessMembers(snapshot.docs.map(d => ({ email: d.id, role: d.data().role })));
      }).catch(console.error);
    }
  }, [role]);

  const handleAddAccess = async () => {
    if (!newAccessEmail || !isCloudEnabled || !db) return;
    try {
      await setDoc(doc(db, 'members', newAccessEmail), { role: newAccessRole });
      setAccessMembers(prev => [...prev.filter(m => m.email !== newAccessEmail), { email: newAccessEmail, role: newAccessRole }]);
      setNewAccessEmail('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAccess = async (email: string) => {
    if (!isCloudEnabled || !db) return;
    if (!confirm(`Remover acesso de ${email}?`)) return;
    try {
      await deleteDoc(doc(db, 'members', email));
      setAccessMembers(prev => prev.filter(m => m.email !== email));
    } catch (err) {
      console.error(err);
    }
  };

  const [newUser, setNewUser] = useState({ name: '', role: '', status: 'active' as const });

  const currentUser = users.find(u => u.id === selectedUserId) || users[0];
  const userTasks = currentUser ? tasks.filter(t => t.assigneeId === currentUser.id) : [];
  
  const activeTasks = userTasks.filter(t => t.status !== 'done' && t.status !== 'posted' && t.status !== 'canceled');
  const pendingCount = activeTasks.length;
  const delayedTasks = activeTasks.filter(t => estaAtrasada(t.dueDate));
  const delayedCount = delayedTasks.length;
  
  const completedTasks = userTasks.filter(t => t.status === 'done' || t.status === 'posted');
  const completedOnTime = completedTasks.filter(t => t.deliveryDate ? new Date(t.deliveryDate) <= new Date(t.dueDate) : true); // Assume on time if no deliveryDate
  const reliabilityRate = completedTasks.length > 0 ? (completedOnTime.length / completedTasks.length) * 100 : 100;

  const handleAddUser = () => {
    if (!newUser.name || !newUser.role) return;
    onAddUser({
      ...newUser,
      permissions: ['staff'],
    });
    setNewUser({ name: '', role: '', status: 'active' });
    setShowAddUser(false);
  };

  const handleDelegate = (userId: string) => {
    if (delegatingTask) {
      onUpdateTask(delegatingTask.id, { assigneeId: userId, status: 'pending' });
      setDelegatingTask(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gestão de Equipe</h1>
          <p className="text-slate-500 font-medium text-lg">Coordenação operacional, capacidade e produtividade da equipe.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleExportAll}
            className="bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} /> Gerar páginas de todos
          </button>
          <button 
            onClick={() => setShowAddUser(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <UserPlus size={18} /> Novo Colaborador
          </button>
        </div>
      </header>

      {role === 'admin' && isCloudEnabled && (
        <section className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Acessos ao Sistema</h2>
              <p className="text-sm text-slate-500 font-medium">Controle de quem pode logar no Firebase.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input 
              type="email" 
              placeholder="Email do usuário (Google)" 
              value={newAccessEmail}
              onChange={e => setNewAccessEmail(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select 
              value={newAccessRole}
              onChange={e => setNewAccessRole(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="editor">Editor</option>
            </select>
            <button 
              onClick={handleAddAccess}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              Adicionar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {accessMembers.map(member => (
              <div key={member.email} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="truncate pr-2">
                  <p className="font-bold text-slate-900 text-sm truncate">{member.email}</p>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{member.role}</p>
                </div>
                <button 
                  onClick={() => handleRemoveAccess(member.email)}
                  className="text-slate-400 hover:text-red-500 p-2 shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Team Selection Bar */}
      <div className="flex overflow-x-auto pb-4 custom-scrollbar gap-4">
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => setSelectedUserId(user.id)}
            className={`flex-shrink-0 flex items-center gap-4 px-6 py-4 rounded-[24px] border transition-all ${
              selectedUserId === user.id 
                ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105' 
                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${
              selectedUserId === user.id ? 'bg-white/20' : 'bg-slate-100'
            }`}>
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="font-black leading-tight">{user.name}</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                selectedUserId === user.id ? 'text-white/40' : 'text-slate-400'
              }`}>{user.role}</p>
            </div>
            {selectedUserId === user.id && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteUser(user.id); }}
                className="ml-2 p-1 text-white/20 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </button>
        ))}
      </div>

      {currentUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  Demandas: {currentUser.name}
                  <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[12px] font-black">{pendingCount}</span>
                </h2>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-xl text-[10px] font-black uppercase text-slate-400">
                  <TrendingUp size={12} className={reliabilityRate >= 80 ? 'text-emerald-500' : 'text-red-500'} /> Confiabilidade {reliabilityRate.toFixed(0)}%
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportSingle(currentUser)}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-800 transition-all shadow-sm"
                >
                  <FileText size={14} /> Página do dia
                </button>
                <button
                  onClick={() => handleCopyWhatsApp(currentUser)}
                  className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-50 transition-all shadow-sm"
                >
                  {copiedUserId === currentUser.id ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copiedUserId === currentUser.id ? 'Copiado!' : 'Copiar para WhatsApp'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {activeTasks.length === 0 ? (
                <div className="bg-white border-2 border-dashed rounded-[40px] p-16 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck size={40} />
                  </div>
                  <p className="text-slate-400 font-medium text-lg">Sem pendências ativas. Operação fluindo.</p>
                </div>
              ) : (
                activeTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(task => (
                  <UserTaskCard 
                    key={task.id} 
                    task={task} 
                    onUpdate={onUpdateTask} 
                    onSetFocus={onSetFocus} 
                    onDelegate={() => setDelegatingTask(task)}
                  />
                ))
              )}
            </div>
          </div>

          <aside className="space-y-6">
            {/* Card do Colaborador - Pauta do Dia */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Pauta do Colaborador</h3>
                  <p className="text-base font-black text-slate-900 mt-0.5">{currentUser.name}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-700">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => handleExportSingle(currentUser)}
                  className="w-full bg-slate-900 text-white py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
                >
                  <FileText size={16} /> Página do dia
                </button>
                <button
                  onClick={() => handleCopyWhatsApp(currentUser)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
                >
                  {copiedUserId === currentUser.id ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <Copy size={16} />
                  )}
                  {copiedUserId === currentUser.id ? 'Copiado!' : 'Copiar para WhatsApp'}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[40px] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Zap size={120} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white/40">SLA & Velocidade</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white/60">Confiabilidade (Entregas no Prazo)</span>
                  <span className="text-lg font-black">{reliabilityRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${reliabilityRate}%` }}
                    className={`${reliabilityRate >= 80 ? 'bg-emerald-400' : 'bg-red-400'} h-full`} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
                    <p className="text-[10px] text-white/40 uppercase font-black">Carga Atual</p>
                    <p className="text-2xl font-black">{pendingCount}</p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/10">
                    <p className="text-[10px] text-white/40 uppercase font-black">Atrasadas</p>
                    <p className={`text-2xl font-black ${delayedCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{delayedCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] border shadow-sm space-y-6">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Camadas de Gestão</h3>
              <div className="space-y-4">
                {[
                  { id: 'C1', name: 'Operação', color: 'bg-emerald-500', value: 100 },
                  { id: 'C2', name: 'Organização', color: 'bg-amber-500', value: 33 },
                  { id: 'C3', name: 'Decisão', color: 'bg-red-500', value: 0 }
                ].map(layer => (
                  <div key={layer.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className={`w-10 h-10 ${layer.color} text-white rounded-xl flex items-center justify-center font-black text-sm`}>
                      {layer.id}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-900">{layer.name}</p>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className={`${layer.color} h-full`} style={{ width: `${layer.value}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUser && (
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
                    <h3 className="text-2xl font-black text-slate-900">Novo Membro</h3>
                    <p className="text-slate-400 text-sm font-medium">Contratação tática para o time.</p>
                  </div>
                  <button onClick={() => setShowAddUser(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} className="text-slate-300" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome Completo</label>
                    <input 
                      className="w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                      placeholder="Ex: João Silva"
                      value={newUser.name}
                      onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cargo/Função</label>
                    <input 
                      className="w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                      placeholder="Ex: Gestor de Tráfego"
                      value={newUser.role}
                      onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddUser}
                  className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Confirmar Contratação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delegation Modal */}
      <AnimatePresence>
        {delegatingTask && (
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
                    <h3 className="text-2xl font-black text-slate-900">Delegar Tarefa</h3>
                    <p className="text-slate-400 text-sm font-medium">Transfira a responsabilidade.</p>
                  </div>
                  <button onClick={() => setDelegatingTask(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} className="text-slate-300" />
                  </button>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Tarefa</p>
                  <p className="text-lg font-bold text-slate-900">{delegatingTask.title}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {users.filter(u => u.id !== delegatingTask.assigneeId).map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleDelegate(user.id)}
                      className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{user.role}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { getTaskStatusVisuals, formatTimeRelative } from '../lib/taskUtils';

const UserTaskCard: React.FC<{ 
  task: Task; 
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onSetFocus?: (id: string) => void;
  onDelegate?: () => void;
}> = ({ task, onUpdate, onSetFocus, onDelegate }) => {
  const eco = ECOSYSTEMS.find(e => e.id === task.ecosystemId);
  const visuals = getTaskStatusVisuals(task);

  return (
    <motion.div 
      layout
      className={`bg-white p-8 rounded-[32px] border-2 shadow-sm transition-all relative overflow-hidden group hover:shadow-md ${visuals.border}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${visuals.bg} ${visuals.text}`}>
              {formatTimeRelative(task.dueDate)}
            </div>
            <div className="px-3 py-1 bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg">
              {task.layer}
            </div>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.1em]" style={{ color: eco?.color }}>
              {eco?.name}
            </span>
          </div>
          <h4 className="text-lg font-black text-slate-900 group-hover:text-slate-600 transition-colors">{task.title}</h4>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onSetFocus?.(task.id)}
            className="text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl bg-slate-100 text-slate-900 hover:bg-slate-200 transition-all active:scale-95"
          >
            Focar
          </button>
          <button 
            onClick={onDelegate}
            className="text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all"
          >
            Delegar
          </button>
          <select 
            className={`text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl border appearance-none outline-none focus:ring-2 focus:ring-slate-900 transition-colors cursor-pointer ${
              task.status === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              task.status === 'blocked' ? 'bg-red-50 text-red-600 border-red-100' :
              'bg-slate-50 text-slate-600 border-slate-100'
            }`}
            value={task.status}
            onChange={(e) => onUpdate(task.id, { status: e.target.value as any })}
          >
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="waiting_approval">Aprovação</option>
            <option value="blocked">Travada</option>
            <option value="done">Finalizada</option>
          </select>
        </div>
      </div>
      
      {task.priority === 'P1' && (
        <div className="absolute top-0 right-0 p-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-bl-2xl px-5 py-1.5 shadow-lg">
          Prioridade Máxima
        </div>
      )}
    </motion.div>
  );
}
