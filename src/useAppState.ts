import { Task, Habit, DailyMetrics, Client, User, TimeBlock, TaskStage, DayClosure } from './types';
import { SEED_TASKS } from './seed';
import { USERS as INITIAL_USERS, DEFAULT_TIME_BLOCKS } from './lib/constants';
import { useSyncedList, useSyncedDoc } from './lib/cloudState';

export function useAppState() {
  const [users, setUsers] = useSyncedList<User>('teamMembers', 'tomenota_users', INITIAL_USERS);
  const [tasks, setTasks] = useSyncedList<Task>('tasks', 'tomenota_tasks', SEED_TASKS);
  const [habits, setHabits] = useSyncedList<Habit>('habits', 'tomenota_habits', [
    { id: 'gym', name: 'Academia', frequency: 'weekly', completedDates: [] },
    { id: 'run', name: 'Corrida', frequency: 'weekly', completedDates: [] },
    { id: 'bible', name: 'Leitura Bíblica', frequency: 'daily', completedDates: [] },
  ]);
  const [timeBlocks, setTimeBlocks] = useSyncedList<TimeBlock>('timeBlocks', 'tomenota_timeblocks', DEFAULT_TIME_BLOCKS);
  const [dayClosures, setDayClosures] = useSyncedList<DayClosure>('dayClosures', 'tomenota_day_closures', []);
  
  const [clients, setClients] = useSyncedList<Client>('clients', 'tomenota_clients', [
    { id: 'brasa', name: 'Brasa', fee: 15000, cost: 7000, status: 'active', nextMeeting: '', ecosystemId: 'agency' },
    { id: 'br', name: 'BR', fee: 8000, cost: 5000, status: 'active', nextMeeting: '', ecosystemId: 'agency' },
    { id: 'zz', name: 'ZZ', fee: 12000, cost: 4000, status: 'active', nextMeeting: '', ecosystemId: 'agency' },
    { id: 'luiz', name: 'Dr. Luiz Pessoa', fee: 5000, cost: 1000, status: 'active', nextMeeting: '', ecosystemId: 'brand' },
    { id: 'claudio', name: 'Cláudio Pinho', fee: 5000, cost: 1500, status: 'active', nextMeeting: '', ecosystemId: 'brand' },
  ]);

  const today = new Date().toISOString().split('T')[0];
  const [metrics, setMetrics] = useSyncedDoc<DailyMetrics>('metrics', today, `tomenota_metrics_${today}`, {
    date: today,
    postsDone: 0,
    postsGoal: 3,
    tasksCompleted: 0,
    energyLevel: 5,
    energyReason: '',
    pendingImportant: [],
    topPriorities: ['', '', ''],
  });

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      stage: 'idea', // Ensure all tasks have a stage so they show up in Content pipeline
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTaskStage = (id: string, stage: TaskStage) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, stage, lastStageUpdate: new Date().toISOString() } : t));
  };

  const addClient = (client: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
    };
    setClients(prev => [...prev, newClient]);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const addUser = (user: Omit<User, 'id' | 'joinedAt'>) => {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      joinedAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleUpdateEnergy = (level: number) => {
    setMetrics(prev => ({ ...prev, energyLevel: level }));
  };

  const addDayClosure = (closure: DayClosure) => {
    setDayClosures(prev => {
      const filtered = prev.filter(c => c.id !== closure.id);
      return [closure, ...filtered];
    });
  };

  return {
    users,
    setUsers,
    tasks,
    setTasks,
    habits,
    setHabits,
    timeBlocks,
    setTimeBlocks,
    metrics,
    setMetrics,
    dayClosures,
    setDayClosures,
    addDayClosure,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStage,
    clients,
    setClients,
    addClient,
    updateClient,
    deleteClient,
    addUser,
    updateUser,
    deleteUser,
    handleUpdateEnergy,
    setFocusTask: (id: string | undefined) => setMetrics(prev => ({ ...prev, focusTaskId: id })),
  };
}
