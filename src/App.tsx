import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Cockpit } from './components/Cockpit';
import { Dashboard } from './components/Dashboard';
import { ContentPipeline } from './components/ContentPipeline';
import { TeamManagement } from './components/TeamManagement';
import { RoutineCalendar } from './components/RoutineCalendar';
import { ClientManagement } from './components/ClientManagement';
import { ScaleAnalytics } from './components/ScaleAnalytics';
import { OverviewDashboard } from './components/OverviewDashboard';
import { QuickActionModal } from './components/QuickActionModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { WhatsAppVoiceCenter } from './components/WhatsAppVoiceCenter';
import { DayClosureModal } from './components/DayClosureModal';
import { MorningBriefingModal } from './components/MorningBriefingModal';
import { useAppState } from './useAppState';
import { Status } from './types';
import { estaAtrasada } from './lib/taskUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfileMode, setUserProfileMode] = useState<'executive' | 'operational'>(() => {
    const saved = localStorage.getItem('tomenota_profile_mode');
    return saved === 'operational' ? 'operational' : 'executive';
  });

  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [quickActionDefaultType, setQuickActionDefaultType] = useState<'task' | 'content' | 'client'>('task');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVoiceCenterOpen, setIsVoiceCenterOpen] = useState(false);
  const [isDayClosureOpen, setIsDayClosureOpen] = useState(false);
  const [isMorningBriefingOpen, setIsMorningBriefingOpen] = useState(false);

  const { 
    users,
    addUser,
    updateUser,
    deleteUser,
    tasks, 
    addTask, 
    updateTask, 
    deleteTask,
    updateTaskStage,
    habits, 
    setHabits,
    timeBlocks,
    setTimeBlocks,
    metrics, 
    setMetrics,
    dayClosures,
    addDayClosure,
    handleUpdateEnergy,
    clients,
    setClients,
    addClient,
    updateClient,
    deleteClient,
    setFocusTask
  } = useAppState();

  const handleProfileModeChange = (mode: 'executive' | 'operational') => {
    setUserProfileMode(mode);
    localStorage.setItem('tomenota_profile_mode', mode);
  };

  const overdueCount = tasks.filter(t => estaAtrasada(t.dueDate) && t.status !== 'done' && t.status !== 'posted' && t.status !== 'canceled').length;

  const pendingYesterdayCount = useMemo(() => {
    return tasks.filter(t => t.status !== 'done' && t.status !== 'posted' && t.status !== 'canceled').length;
  }, [tasks]);

  const getStatus = (): Status => {
    const hasOverdue = overdueCount > 0;
    if (hasOverdue || tasks.some(t => t.status === 'blocked')) return 'fire';
    if (tasks.some(t => t.layer === 'decision' && t.status !== 'done')) return 'attention';
    return 'running';
  };

  const handleUpdateHabit = (id: string, date: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const prevDates = h.completedDates || [];
        const completedDates = prevDates.includes(date)
          ? prevDates.filter(d => d !== date)
          : [...prevDates, date];
        return { ...h, completedDates };
      }
      return h;
    }));
  };

  const handleAddHabit = (habit: any) => {
    setHabits(prev => [...prev, habit]);
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const handleUpdateEnergyReason = (reason: string) => {
    setMetrics(prev => ({ ...prev, energyReason: reason }));
  };

  const handleAddImportant = (item: string) => {
    if (!item) return;
    setMetrics(prev => ({ 
      ...prev, 
      pendingImportant: [...(prev.pendingImportant || []), item] 
    }));
  };

  const handleDeleteImportant = (index: number) => {
    setMetrics(prev => ({
      ...prev,
      pendingImportant: (prev.pendingImportant || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddTimeBlock = (block: any) => {
    setTimeBlocks(prev => [...prev, block]);
  };

  const handleDeleteTimeBlock = (id: string) => {
    setTimeBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleAddContent = (title: string, ecosystemId: string, assigneeId: string) => {
    addTask({
      title,
      description: '',
      ecosystemId,
      assigneeId,
      layer: 'operation',
      priority: 'P2',
      status: 'pending',
      stage: 'idea',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  const openQuickTask = () => {
    setQuickActionDefaultType('task');
    setIsQuickActionOpen(true);
  };

  const openQuickContent = () => {
    setQuickActionDefaultType('content');
    setIsQuickActionOpen(true);
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        status={getStatus()}
        urgentCount={overdueCount}
        userProfileMode={userProfileMode}
        setUserProfileMode={handleProfileModeChange}
        onOpenQuickAction={() => {
          setQuickActionDefaultType('task');
          setIsQuickActionOpen(true);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenVoiceCenter={() => setIsVoiceCenterOpen(true)}
        onOpenDayClosure={() => setIsDayClosureOpen(true)}
        onOpenMorningBriefing={() => setIsMorningBriefingOpen(true)}
        pendingYesterdayCount={pendingYesterdayCount}
      >
        {/* Overview Business Dashboard */}
        {(activeTab === 'overview' || activeTab === 'cockpit') && (
          <OverviewDashboard 
            tasks={tasks}
            clients={clients}
            users={users}
            metrics={metrics}
            setMetrics={setMetrics}
            habits={habits}
            onUpdateHabit={handleUpdateHabit}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            userProfileMode={userProfileMode}
            onSetFocus={setFocusTask}
            onUpdateTask={updateTask}
            onUpdateEnergy={handleUpdateEnergy}
            onOpenQuickTask={openQuickTask}
            onOpenQuickContent={openQuickContent}
            onOpenVoiceCenter={() => setIsVoiceCenterOpen(true)}
            onOpenDayClosure={() => setIsDayClosureOpen(true)}
            onOpenMorningBriefing={() => setIsMorningBriefingOpen(true)}
            pendingYesterdayCount={pendingYesterdayCount}
            initialTab={activeTab === 'cockpit' ? 'priorities' : 'business'}
          />
        )}

        {/* Focus & Executive Direction Tab */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            tasks={tasks} 
            metrics={metrics} 
            clients={clients}
            setMetrics={setMetrics} 
            onSetFocus={setFocusTask} 
            onUpdateEnergy={handleUpdateEnergy} 
          />
        )}
        
        {/* Media & Content Pipeline */}
        {activeTab === 'content' && (
          <ContentPipeline 
            items={tasks.filter(t => t.stage)} 
            users={users}
            onUpdateStage={updateTaskStage} 
            onAddContent={handleAddContent}
            onSetFocus={setFocusTask}
          />
        )}

        {/* Client Portfolio Management */}
        {activeTab === 'clients' && (
          <ClientManagement 
            clients={clients}
            tasks={tasks}
            onAddClient={addClient}
            onUpdateClient={updateClient}
            onDeleteClient={deleteClient}
            onAddTask={addTask}
            onSetFocus={setFocusTask}
          />
        )}

        {/* Team Operations & Productivity */}
        {activeTab === 'team' && (
          <TeamManagement 
            users={users}
            tasks={tasks} 
            clients={clients}
            onUpdateTask={updateTask} 
            onAddTask={addTask} 
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onSetFocus={setFocusTask} 
          />
        )}

        {/* Routines & Habits */}
        {activeTab === 'calendar' && (
          <RoutineCalendar 
            habits={habits} 
            timeBlocks={timeBlocks}
            metrics={metrics} 
            onUpdateHabit={handleUpdateHabit} 
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onUpdateEnergy={handleUpdateEnergy} 
            onUpdateEnergyReason={handleUpdateEnergyReason}
            onAddImportant={handleAddImportant}
            onDeleteImportant={handleDeleteImportant}
            onAddTimeBlock={handleAddTimeBlock}
            onDeleteTimeBlock={handleDeleteTimeBlock}
          />
        )}

        {/* Scale Analytics & Business Intelligence */}
        {activeTab === 'metrics' && (
          <ScaleAnalytics tasks={tasks} clients={clients} />
        )}
      </Layout>

      {/* Global Quick Action Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        users={users}
        clients={clients}
        onAddTask={addTask}
        onAddContent={handleAddContent}
        onAddClient={addClient}
        defaultType={quickActionDefaultType}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tasks={tasks}
        clients={clients}
        users={users}
        onNavigateTab={(tabId) => setActiveTab(tabId)}
        onSelectTask={(task) => {
          setFocusTask(task.id);
          setActiveTab('overview');
        }}
      />

      {/* Operacional Reev & WhatsApp Voice Center */}
      <WhatsAppVoiceCenter
        isOpen={isVoiceCenterOpen}
        onClose={() => setIsVoiceCenterOpen(false)}
        tasks={tasks}
        users={users}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        onSelectTask={(taskId) => {
          setFocusTask(taskId);
          setActiveTab('overview');
        }}
      />

      {/* Fechamento do Dia (Encerrar Dia & Salvar Histórico) */}
      <DayClosureModal
        isOpen={isDayClosureOpen}
        onClose={() => setIsDayClosureOpen(false)}
        tasks={tasks}
        habits={habits}
        energyLevel={metrics.energyLevel || 7}
        onSaveClosure={(closure) => {
          addDayClosure(closure);
        }}
        onOpenMorningBriefing={() => {
          setIsDayClosureOpen(false);
          setIsMorningBriefingOpen(true);
        }}
      />

      {/* Cobrança Matinal (Pendências do dia anterior & Alinhamento) */}
      <MorningBriefingModal
        isOpen={isMorningBriefingOpen}
        onClose={() => setIsMorningBriefingOpen(false)}
        tasks={tasks}
        users={users}
        onUpdateTask={updateTask}
        onSetDailyPriority={(title) => {
          const t = tasks.find(item => item.title.toLowerCase().includes(title.toLowerCase()));
          if (t) {
            setFocusTask(t.id);
          }
        }}
      />
    </>
  );
}
