import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Layers, 
  Users, 
  Settings, 
  Calendar, 
  BarChart3, 
  Target, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Menu, 
  X, 
  Search, 
  Plus, 
  LogOut,
  Briefcase,
  SlidersHorizontal,
  UserCheck,
  Mic,
  Moon,
  Sun,
  Smartphone
} from 'lucide-react';
import { Status } from '../types';
import { useSession } from './AuthGate';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  status: Status;
  urgentCount?: number;
  userProfileMode: 'executive' | 'operational';
  setUserProfileMode: (mode: 'executive' | 'operational') => void;
  onOpenQuickAction: () => void;
  onOpenSearch: () => void;
  onOpenVoiceCenter?: () => void;
  onOpenDayClosure?: () => void;
  onOpenMorningBriefing?: () => void;
  pendingYesterdayCount?: number;
}

export function Layout({ 
  children, 
  activeTab, 
  setActiveTab, 
  status,
  urgentCount = 0,
  userProfileMode,
  setUserProfileMode,
  onOpenQuickAction,
  onOpenSearch,
  onOpenVoiceCenter,
  onOpenDayClosure,
  onOpenMorningBriefing,
  pendingYesterdayCount = 0
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const { email, name, photo, role, signOut } = useSession();

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const navSections = [
    {
      title: 'Visão Geral',
      items: [
        { 
          id: 'overview', 
          label: 'Dashboard Executivo', 
          icon: PieChart,
          badge: urgentCount > 0 ? urgentCount : undefined,
          badgeColor: 'bg-red-500 text-white'
        },
      ]
    },
    {
      title: 'Operação',
      items: [
        { id: 'content', label: 'Conteúdo & Mídia', icon: Layers },
        { id: 'team', label: 'Equipe & Produção', icon: Users },
        { id: 'clients', label: 'Carteira de Clientes', icon: Briefcase },
        { id: 'calendar', label: 'Rotina & Hábitos', icon: Calendar },
        { id: 'metrics', label: 'Inteligência & Escala', icon: BarChart3 },
      ]
    },
    {
      title: 'Gestão Estratégica',
      items: [
        { id: 'dashboard', label: 'Direção & Foco CEO', icon: Target },
      ]
    }
  ];

  const statusConfigs = {
    running: {
      color: 'bg-emerald-500',
      label: 'Operação Fluindo',
      textColor: 'text-emerald-700',
      bgLight: 'bg-emerald-50 border-emerald-100',
      icon: CheckCircle2
    },
    attention: {
      color: 'bg-amber-500',
      label: 'Atenção Operacional',
      textColor: 'text-amber-700',
      bgLight: 'bg-amber-50 border-amber-100',
      icon: AlertTriangle
    },
    fire: {
      color: 'bg-red-500',
      label: 'Alertas Críticos',
      textColor: 'text-red-700',
      bgLight: 'bg-red-50 border-red-100',
      icon: Flame
    },
  };

  const currentStatusConfig = statusConfigs[status] || statusConfigs.running;
  const StatusIcon = currentStatusConfig.icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xs tracking-tighter">TN</span>
          </div>
          <div>
            <h1 className="font-black text-base leading-none text-slate-900">Comando Tome Nota</h1>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Gestão Sistêmica</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onOpenVoiceCenter && (
            <button
              onClick={onOpenVoiceCenter}
              className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 transition-colors"
              title="Operacional Reev (Áudio WhatsApp)"
            >
              <Mic size={18} />
            </button>
          )}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
            title="Buscar"
          >
            <Search size={20} />
          </button>
          <button
            onClick={onOpenQuickAction}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm"
          >
            <Plus size={16} />
            <span>Novo</span>
          </button>
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(isSidebarOpen || isDesktop) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.2 }}
            className={`fixed lg:relative inset-y-0 left-0 w-72 bg-white border-r z-50 flex flex-col ${
              isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            {/* Brand Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                  <ShieldCheck className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="font-black text-xl leading-none text-slate-900 tracking-tight">Tome Nota</h2>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                    Gestão Empresarial
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile View Switcher */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Modo de Visão</span>
                <span className="text-[10px] font-bold text-slate-500">
                  {userProfileMode === 'executive' ? 'Estratégico' : 'Operacional'}
                </span>
              </div>
              <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl gap-1">
                <button
                  onClick={() => setUserProfileMode('executive')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    userProfileMode === 'executive'
                      ? 'bg-white text-slate-900 shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Briefcase size={13} />
                  <span>CEO</span>
                </button>
                <button
                  onClick={() => setUserProfileMode('operational')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    userProfileMode === 'operational'
                      ? 'bg-white text-slate-900 shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users size={13} />
                  <span>Time</span>
                </button>
              </div>
            </div>

            {/* Navigation Structure in 3 Clear Blocks */}
            <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
              {navSections.map((section, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="px-3 py-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {section.title}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-md shadow-slate-200 font-black'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Operational Status & User Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
              {/* System status pill */}
              <div 
                onClick={() => {
                  setActiveTab('overview');
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${currentStatusConfig.bgLight}`}
                title="Clique para abrir o painel de prioridades"
              >
                <div className={`p-2 rounded-xl ${currentStatusConfig.color}`}>
                  <StatusIcon className="text-white" size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Saúde do Sistema</p>
                  <p className={`text-xs font-black truncate ${currentStatusConfig.textColor}`}>
                    {currentStatusConfig.label}
                  </p>
                </div>
                {urgentCount > 0 && (
                  <span className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black">
                    {urgentCount}
                  </span>
                )}
              </div>

              {/* User badge */}
              <div className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                {photo ? (
                  <img src={photo} alt={name} className="w-8 h-8 rounded-xl object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs">
                    {name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">{name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{email || 'Gestor'}</p>
                </div>
                <button 
                  onClick={signOut} 
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors" 
                  title="Encerrar sessão"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 sticky top-0 z-30">
          {/* Global Search Trigger */}
          <div className="flex-1 max-w-md">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-400 hover:text-slate-600 transition-all text-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Search size={16} className="text-slate-400" />
                <span>Buscar tarefas, clientes, colaboradores...</span>
              </div>
              <kbd className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Top Actions & Profile Switch */}
          <div className="flex items-center gap-3">
            {/* Operational Voice & WhatsApp Center Button */}
            {onOpenVoiceCenter && (
              <button
                onClick={onOpenVoiceCenter}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer"
                title="Conexão QR Code, monitoramento do WhatsApp e estruturação de áudios Reev"
              >
                <Smartphone size={15} />
                <span>WhatsApp Operacional</span>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
              </button>
            )}

            {/* Morning Briefing Pill */}
            {onOpenMorningBriefing && (
              <button
                onClick={onOpenMorningBriefing}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cobrança matinal das pendências de ontem"
              >
                <Sun size={14} className="text-amber-600" />
                <span>Cobrança</span>
                {pendingYesterdayCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                    {pendingYesterdayCount}
                  </span>
                )}
              </button>
            )}

            {/* Day Closure Pill */}
            {onOpenDayClosure && (
              <button
                onClick={onOpenDayClosure}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Encerrar o dia e salvar o histórico"
              >
                <Moon size={14} className="text-indigo-600" />
                <span>Encerrar Dia</span>
              </button>
            )}

            {/* Profile Mode Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visualização:</span>
              <button
                onClick={() => setUserProfileMode(userProfileMode === 'executive' ? 'operational' : 'executive')}
                className="text-xs font-black text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-1"
                title="Clique para alternar a visão"
              >
                <span>{userProfileMode === 'executive' ? '👔 Modo CEO (Completo)' : '👥 Modo Time (Operacional)'}</span>
                <SlidersHorizontal size={12} className="text-slate-400" />
              </button>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={onOpenQuickAction}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md shadow-slate-200 active:scale-95 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Nova Ação</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
