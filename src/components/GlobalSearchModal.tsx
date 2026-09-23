import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, CheckSquare, Building2, Users, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { Task, Client, User } from '../types';
import { ECOSYSTEMS } from '../lib/constants';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  clients: Client[];
  users: User[];
  onSelectTask?: (task: Task) => void;
  onNavigateTab: (tabId: string) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  tasks,
  clients,
  users,
  onSelectTask,
  onNavigateTab
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { tasks: [], clients: [], users: [] };
    }

    const matchedTasks = tasks.filter(t => 
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchedClients = clients.filter(c =>
      c.name.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedUsers = users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q))
    ).slice(0, 4);

    return { tasks: matchedTasks, clients: matchedClients, users: matchedUsers };
  }, [query, tasks, clients, users]);

  if (!isOpen) return null;

  const totalResults = filtered.tasks.length + filtered.clients.length + filtered.users.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Search Input Bar */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
            <Search className="text-slate-400 shrink-0" size={22} />
            <input
              type="text"
              autoFocus
              placeholder="Buscar tarefas, clientes, colaboradores ou canais..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-transparent text-slate-900 font-bold text-base focus:outline-none placeholder:text-slate-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300"
            >
              ESC
            </button>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {!query && (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Search size={36} className="mx-auto text-slate-300 stroke-[1.5]" />
                <p className="font-bold text-sm text-slate-500">Digite para buscar em toda a operação</p>
                <p className="text-xs text-slate-400">Tarefas, pautas de conteúdo, clientes, taxas e equipe</p>
              </div>
            )}

            {query && totalResults === 0 && (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <AlertCircle size={36} className="mx-auto text-amber-400 stroke-[1.5]" />
                <p className="font-bold text-sm text-slate-600">Nenhum resultado encontrado</p>
                <p className="text-xs text-slate-400">Tente buscar por termos mais curtos ou nomes parciais</p>
              </div>
            )}

            {/* Matched Tasks */}
            {filtered.tasks.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CheckSquare size={13} />
                  <span>Tarefas & Entregas ({filtered.tasks.length})</span>
                </span>
                <div className="space-y-1.5">
                  {filtered.tasks.map(t => {
                    const eco = ECOSYSTEMS.find(e => e.id === t.ecosystemId);
                    const isOverdue = new Date(t.dueDate) < new Date() && t.status !== 'done' && t.status !== 'posted';
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          onSelectTask?.(t);
                          onNavigateTab('overview');
                          onClose();
                        }}
                        className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-4 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {eco && (
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: eco.color }}
                              />
                            )}
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {eco?.name || 'Geral'}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isOverdue ? 'Atrasada' : t.status}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 truncate">{t.title}</p>
                        </div>
                        <ArrowRight size={16} className="text-slate-300 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Matched Clients */}
            {filtered.clients.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 size={13} />
                  <span>Clientes & Contas ({filtered.clients.length})</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filtered.clients.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        onNavigateTab('clients');
                        onClose();
                      }}
                      className="p-3 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{c.name}</p>
                        <p className="text-xs font-semibold text-emerald-600">
                          Fee R$ {c.fee.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Users */}
            {filtered.users.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users size={13} />
                  <span>Equipe & Colaboradores ({filtered.users.length})</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filtered.users.map(u => (
                    <div
                      key={u.id}
                      onClick={() => {
                        onNavigateTab('team');
                        onClose();
                      }}
                      className="p-3 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{u.name}</p>
                        <p className="text-xs text-slate-400 truncate">{u.role}</p>
                      </div>
                      <ArrowRight size={16} className="text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
