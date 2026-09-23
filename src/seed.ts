/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task } from './types';

export const SEED_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Aprovação de pautas para o Jornal Tome Nota',
    status: 'pending',
    priority: 'P1',
    layer: 'decision',
    ecosystemId: 'news',
    assigneeId: 'gestor',
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // overdue
    createdAt: new Date().toISOString(),
    stage: 'internal_review'
  },
  {
    id: 't2',
    title: 'Edição do vídeo institucional - Cliente Brasa',
    status: 'in_progress',
    priority: 'P2',
    layer: 'operation',
    ecosystemId: 'agency',
    assigneeId: 'lucas',
    dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // soon
    createdAt: new Date().toISOString(),
    stage: 'production'
  },
  {
    id: 't3',
    title: 'Ajuste de artes de campanha - Cliente Dr. Luiz Pessoa',
    status: 'blocked',
    priority: 'P3',
    layer: 'organization',
    ecosystemId: 'agency',
    assigneeId: 'alan',
    dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    blockedReason: 'AGUARDANDO_BRIEFING',
    blockedResponsibleId: 'gestor',
    stage: 'production'
  },
  {
    id: 'c1',
    title: 'Como gerenciar 8 ecossistemas sem surtar',
    status: 'pending',
    priority: 'P2',
    layer: 'operation',
    stage: 'idea',
    ecosystemId: 'brand',
    assigneeId: 'gestor',
    dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    lastStageUpdate: new Date().toISOString(),
  },
  {
    id: 'c2',
    title: 'Estruturação da operação e entregas Reev',
    status: 'in_progress',
    priority: 'P2',
    layer: 'operation',
    stage: 'production',
    ecosystemId: 'reev',
    assigneeId: 'lucas',
    dueDate: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    lastStageUpdate: new Date().toISOString(),
  }
];
