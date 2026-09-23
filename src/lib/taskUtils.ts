import { Task, User } from '../types';

export type TaskStatusColor = 'green' | 'yellow' | 'red' | 'purple' | 'gray';

export function fimDoDia(dataISO: string): Date {
  if (!dataISO) return new Date();
  if (dataISO.includes('T') || dataISO.includes(':')) {
    return new Date(dataISO);
  }
  const parts = dataISO.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 23, 59, 59, 999);
  }
  const d = new Date(dataISO);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function venceHoje(dataISO: string): boolean {
  if (!dataISO) return false;
  const now = new Date();
  let d: Date;
  if (!dataISO.includes('T') && !dataISO.includes(':') && dataISO.split('-').length === 3) {
    const parts = dataISO.split('-');
    d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    d = new Date(dataISO);
  }
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function estaAtrasada(dataISO: string): boolean {
  if (!dataISO) return false;
  return fimDoDia(dataISO).getTime() < new Date().getTime();
}

export function getTaskStatusVisuals(task: Task) {
  const isDone = task.status === 'done' || task.status === 'posted';
  
  if (task.status === 'blocked') {
    return { color: 'purple', label: 'Bloqueado', ring: 'ring-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' };
  }
  if (isDone) {
    return { color: 'green', label: 'Entregue', ring: 'ring-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' };
  }
  
  if (estaAtrasada(task.dueDate)) {
    return { color: 'red', label: 'Atrasado', ring: 'ring-red-500', bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700' };
  }
  
  if (venceHoje(task.dueDate)) {
    return { color: 'yellow', label: 'Vence Hoje', ring: 'ring-amber-500', bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' };
  }
  
  if (task.status === 'pending') {
    return { color: 'gray', label: 'Não Iniciado', ring: 'ring-slate-300', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' };
  }

  return { color: 'green', label: 'No Prazo', ring: 'ring-emerald-500', bg: 'bg-white', border: 'border-emerald-200', text: 'text-emerald-600' };
}

export function formatTimeRelative(dateString?: string) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 0) {
    const passedDays = Math.floor(Math.abs(diffHours) / 24);
    if (passedDays === 0) return `Atrasado há ${Math.floor(Math.abs(diffHours))}h`;
    return `Atrasado há ${passedDays}d`;
  }
  
  const leftDays = Math.floor(diffHours / 24);
  if (leftDays === 0) return `Vence em ${Math.floor(diffHours)}h`;
  return `Vence em ${leftDays}d`;
}

export function formatTimeInStage(dateString?: string) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  const days = Math.floor(diffHours / 24);
  if (days === 0) return `Parado há ${Math.floor(diffHours)}h`;
  return `Parado há ${days}d`;
}

export function getAssigneeDisplayName(assigneeId?: string, users?: User[]): string {
  if (!assigneeId) return 'Sem responsável';
  const found = users?.find(u => u.id === assigneeId);
  if (found) return found.name;
  // If not found in teamMembers (e.g. "lucas"), capitalize first letter
  return assigneeId.charAt(0).toUpperCase() + assigneeId.slice(1);
}

export function getAssigneeInitials(assigneeId?: string, users?: User[]): string {
  const name = getAssigneeDisplayName(assigneeId, users);
  if (name === 'Sem responsável') return '?';
  return name.slice(0, 2).toUpperCase();
}

export function formatDeliveryDate(deliveryDate?: string): string {
  if (!deliveryDate) return '';
  const d = new Date(deliveryDate);
  if (isNaN(d.getTime())) return deliveryDate;
  return d.toLocaleDateString('pt-BR');
}

