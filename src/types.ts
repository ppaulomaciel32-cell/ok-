/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Status = 'running' | 'attention' | 'fire';
export type Layer = 'operation' | 'organization' | 'decision';
export type EcosystemType = 'agency' | 'news' | 'courses' | 'personal_brand' | 'tiktok' | 'linkedin' | 'politics' | 'personal_life' | 'client' | 'reev';

export interface DayClosure {
  id: string;
  date: string;
  closedAt: string;
  tasksCompletedToday: number;
  tasksPendingCount: number;
  pendingTaskIds: string[];
  energyLevel: number;
  habitsCompletionRate: number;
  summaryNotes?: string;
  tomorrowPriorities: string[];
  acknowledgedNextDay?: boolean;
}

export type BlockReason = 
  | 'AGUARDANDO_BRIEFING'
  | 'AGUARDANDO_APROVACAO_CLIENTE'
  | 'AGUARDANDO_MATERIAL'
  | 'AGUARDANDO_PAGAMENTO'
  | 'DEPENDENCIA_INTERNA'
  | '';

export type TaskStage = 'idea' | 'script' | 'production' | 'internal_review' | 'client_approval' | 'scheduled' | 'posted' | 'metrics';

export interface User {
  id: string;
  name: string;
  role: string;
  email?: string;
  avatar?: string;
  permissions: ('admin' | 'staff' | 'editor')[];
  status: 'active' | 'away' | 'inactive';
  joinedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'waiting_approval' | 'done' | 'blocked' | 'scheduled' | 'posted' | 'canceled';
  priority: 'P1' | 'P2' | 'P3';
  layer: Layer;
  ecosystemId: string;
  assigneeId: string;
  clientId?: string;
  
  dueDate: string;
  startDate?: string;
  deliveryDate?: string;
  approvalDate?: string;
  postDate?: string;
  
  createdAt: string;
  blockedReason?: BlockReason;
  blockedResponsibleId?: string;
  
  slaHours?: number;
  stage?: TaskStage;
  lastStageUpdate?: string;

  // Origem WhatsApp
  origem?: 'whatsapp' | string;
  origemMensagemId?: string;
  origemChat?: string;
  criadoPor?: string;
}

export interface WhatsAppStatusDoc {
  state: 'open' | 'connecting' | 'close';
  numero?: string;
  nomePerfil?: string;
  conectadoEm?: any;
  desconectadoEm?: any;
  atualizadoEm?: any;
}

export interface WhatsAppMessageDoc {
  id: string;
  chatId: string;
  chatName: string;
  senderName: string;
  senderPhone: string | null;
  senderId?: string;
  type: 'audio' | 'text';
  content: string;
  audioDurationSeconds?: number;
  hasAttachment?: boolean;
  ecosystem?: string;
  timestamp: any;
  status: 'novo' | 'ruido' | 'erro_transcricao' | 'erro';
  processed?: boolean;
  suggestion?: any;
  tarefaId?: string;
  descartada?: boolean;
  comando?: 'criada' | 'descartada' | 'ajustada' | 'desfeito' | string;
}

export interface WhatsAppChatDoc {
  id?: string;
  jid: string;
  nome: string;
  tipo?: string;
  ecosystem?: string;
  ultimaMensagemEm?: any;
}

export interface WhatsAppConfigDoc {
  chats?: Record<string, { nome: string; ecosystem: string }>;
}

export interface ComandoTriagemDoc {
  id: string;
  origem: {
    chatId?: string;
    chatName?: string;
    messageId?: string;
    senderName?: string;
  };
  proposta: {
    title: string;
    description?: string;
    ecosystemId?: string;
    priority?: 'P1' | 'P2' | 'P3';
    layer?: Layer;
    assigneeId?: string;
    responsavelPeloDono?: boolean;
    dueDate?: string;
    prazoSugerido?: boolean;
  };
  status: 'pendente' | 'criando' | 'criada' | 'descartada';
  criadoEm: number;
  propostaMsgId?: string;
  tarefaId?: string;
  resolvidoPor?: string;
  resolvidoEm?: any;
}

export interface Client {
  id: string;
  name: string;
  fee: number;
  cost: number;
  status: 'active' | 'paused' | 'late';
  nextMeeting: string;
  ecosystemId: string;
}

export interface Ecosystem {
  id: string;
  name: string;
  type: EcosystemType;
  color: string;
  managerId: string;
}

export type HabitCategory = 'health' | 'mind' | 'spiritual' | 'business' | 'other';
export type HabitTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'any';

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  completedDates: string[]; // ISO dates YYYY-MM-DD
  category?: HabitCategory;
  timeOfDay?: HabitTimeOfDay;
  targetDaysPerWeek?: number;
  streak?: number;
  notes?: string;
  createdAt?: string;
}

export interface TimeBlock {
  id: string;
  name: string;
  startTime: string; // 08:00
  endTime: string;
  type: 'high_performance' | 'operational' | 'lightness';
  days: number[]; // 0-6
}

export interface DailyMetrics {
  date: string;
  postsDone: number;
  postsGoal: number;
  tasksCompleted: number;
  energyLevel: number; // 1-10
  energyReason?: string;
  pendingImportant?: string[];
  topPriorities: string[]; // 3 slots
  focusTaskId?: string;
}
