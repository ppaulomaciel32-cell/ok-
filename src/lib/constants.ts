import { Ecosystem, User, TimeBlock } from '../types';

export const USERS: User[] = [
  { id: 'gestor', name: 'Gestor (CEO)', role: 'CEO', permissions: ['admin'], status: 'active', joinedAt: new Date().toISOString() },
  { id: 'kathleen', name: 'Kathleen', role: 'Diretora Operacional', permissions: ['admin', 'staff'], status: 'active', joinedAt: new Date().toISOString() },
  { id: 'lucas', name: 'Lucas', role: 'Audiovisual', permissions: ['staff'], status: 'active', joinedAt: new Date().toISOString() },
  { id: 'alan', name: 'Alan Jones', role: 'Designer', permissions: ['staff'], status: 'active', joinedAt: new Date().toISOString() },
  { id: 'pedro', name: 'Pedro', role: 'Coordenação', permissions: ['staff'], status: 'active', joinedAt: new Date().toISOString() },
  { id: 'juan', name: 'Juan', role: 'Logística & Cursos', permissions: ['staff'], status: 'active', joinedAt: new Date().toISOString() },
  { id: 'anderson', name: 'Anderson', role: 'Jornalista', permissions: ['staff'], status: 'active', joinedAt: new Date().toISOString() },
];

export const ECOSYSTEMS: Ecosystem[] = [
  { id: 'agency', name: 'Agência Tome Nota', type: 'agency', color: '#3b82f6', managerId: 'kathleen' },
  { id: 'reev', name: 'Operacional Reev (Geral)', type: 'reev', color: '#8b5cf6', managerId: 'gestor' },
  { id: 'news', name: 'Jornais', type: 'news', color: '#ef4444', managerId: 'anderson' },
  { id: 'courses', name: 'Cursos', type: 'courses', color: '#10b981', managerId: 'juan' },
  { id: 'brand', name: 'Perfil Pessoal', type: 'personal_brand', color: '#f59e0b', managerId: 'gestor' },
  { id: 'linkedin', name: 'LinkedIn', type: 'linkedin', color: '#0077b5', managerId: 'gestor' },
  { id: 'politics', name: 'Projeto Político', type: 'politics', color: '#6366f1', managerId: 'gestor' },
  { id: 'personal', name: 'Vida Pessoal', type: 'personal_life', color: '#ec4899', managerId: 'gestor' },
];

export const DEFAULT_TIME_BLOCKS: TimeBlock[] = [
  { id: 'hp', name: 'Alta Performance', startTime: '08:30', endTime: '11:30', type: 'high_performance', days: [1, 2, 3, 4, 5] },
  { id: 'op', name: 'Operacional', startTime: '13:30', endTime: '17:30', type: 'operational', days: [1, 2, 3, 4, 5, 6] },
  { id: 'lt', name: 'Leveza/Recuperação', startTime: '18:00', endTime: '22:00', type: 'lightness', days: [1, 2, 3, 4, 5, 6, 0] },
];
