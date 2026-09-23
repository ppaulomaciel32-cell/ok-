import { Task, User, Client, Ecosystem, TaskStage, Layer, BlockReason } from '../types';

const STAGE_LABELS: Record<TaskStage, string> = {
  idea: 'Ideia',
  script: 'Roteiro',
  production: 'Produção',
  internal_review: 'Revisão Interna',
  client_approval: 'Aprovação Cliente',
  scheduled: 'Agendado',
  posted: 'Postado',
  metrics: 'Métricas',
};

const LAYER_LABELS: Record<Layer, string> = {
  operation: 'Operação',
  organization: 'Organização',
  decision: 'Decisão',
};

const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  AGUARDANDO_BRIEFING: 'Aguardando briefing',
  AGUARDANDO_APROVACAO_CLIENTE: 'Aguardando aprovação do cliente',
  AGUARDANDO_MATERIAL: 'Aguardando material',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  DEPENDENCIA_INTERNA: 'Dependência interna',
  '': 'Não especificado',
};

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function formatDateExtenso(date: Date): string {
  const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayOfWeek}, ${day} de ${month} de ${year}`;
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function parseDateOnly(dateStr: string): Date {
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateStr);
}

function getDaysDiff(today: Date, target: Date): number {
  const t1 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const t2 = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((t1 - t2) / (1000 * 60 * 60 * 24));
}

function getContextName(task: Task, clients: Client[], ecosystems: Ecosystem[]): string {
  if (task.clientId) {
    const client = clients.find(c => c.id === task.clientId);
    if (client) return client.name;
  }
  const eco = ecosystems.find(e => e.id === task.ecosystemId);
  return eco ? eco.name : (task.clientId || task.ecosystemId || 'Geral');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function gerarPaginaColaborador(
  user: User,
  tasks: Task[],
  clients: Client[],
  ecosystems: Ecosystem[]
): string {
  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const activeTasks = tasks.filter(
    t => t.assigneeId === user.id && t.status !== 'done' && t.status !== 'posted' && t.status !== 'canceled'
  );

  const delayedTasks: { task: Task; daysPassed: number }[] = [];
  const todayTasks: Task[] = [];
  const next7DaysMap = new Map<string, { date: Date; tasks: Task[] }>();
  const blockedTasks: Task[] = [];

  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date(todayOnly);
    futureDate.setDate(todayOnly.getDate() + i);
    const dateKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;
    next7DaysMap.set(dateKey, { date: futureDate, tasks: [] });
  }

  let next7DaysCount = 0;

  activeTasks.forEach(task => {
    if (task.blockedReason || task.status === 'blocked') {
      blockedTasks.push(task);
    }

    if (!task.dueDate) {
      return;
    }

    const taskDate = parseDateOnly(task.dueDate);
    const daysDiff = getDaysDiff(todayOnly, taskDate);

    if (daysDiff > 0) {
      delayedTasks.push({ task, daysPassed: daysDiff });
    } else if (daysDiff === 0) {
      todayTasks.push(task);
    } else if (daysDiff < 0 && daysDiff >= -7) {
      const dateKey = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
      const entry = next7DaysMap.get(dateKey);
      if (entry) {
        entry.tasks.push(task);
        next7DaysCount++;
      }
    }
  });

  delayedTasks.sort((a, b) => b.daysPassed - a.daysPassed);

  const totalOpen = activeTasks.length;
  const totalDelayed = delayedTasks.length;
  const totalToday = todayTasks.length;

  const formattedNow = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const renderTaskHtml = (task: Task, extraMeta?: string) => {
    const context = escapeHtml(getContextName(task, clients, ecosystems));
    const title = escapeHtml(task.title);
    const desc = task.description ? escapeHtml(task.description) : '';
    const layer = LAYER_LABELS[task.layer] || task.layer;
    const stage = task.stage ? STAGE_LABELS[task.stage] || task.stage : '';

    return `
      <div class="task-card">
        <div class="task-main">
          <div class="task-checkbox" aria-hidden="true"></div>
          <div class="task-body">
            <div class="task-header-row">
              <span class="task-title">${title}</span>
              <span class="task-priority badge-priority-${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
            ${desc ? `<div class="task-desc"><strong>Definição de pronto:</strong> ${desc}</div>` : ''}
            <div class="task-tags">
              <span class="task-tag tag-context">${context}</span>
              <span class="task-tag tag-layer">${layer}</span>
              ${stage ? `<span class="task-tag tag-stage">${stage}</span>` : ''}
              ${extraMeta ? `<span class="task-tag tag-extra">${extraMeta}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  let contentHtml = '';

  if (activeTasks.length === 0) {
    contentHtml = `
      <div class="empty-state">
        <div class="empty-box">&#10003;</div>
        <h2>Nada aberto para você hoje</h2>
        <p>Todas as suas demandas foram concluídas ou você não possui tarefas ativas no momento.</p>
      </div>
    `;
  } else {
    let delayedHtml = '';
    if (delayedTasks.length > 0) {
      delayedHtml = `
        <section class="section section-delayed">
          <div class="section-title section-title-delayed">
            <span>Atrasadas (${delayedTasks.length})</span>
          </div>
          <div class="tasks-list">
            ${delayedTasks
              .map(({ task, daysPassed }) => {
                const dueFormatted = formatDateShort(task.dueDate);
                const extra = `Venceu há ${daysPassed} ${daysPassed === 1 ? 'dia' : 'dias'} (Limite: ${dueFormatted})`;
                return renderTaskHtml(task, extra);
              })
              .join('')}
          </div>
        </section>
      `;
    }

    let todayHtml = '';
    if (todayTasks.length > 0) {
      todayHtml = `
        <section class="section">
          <div class="section-title">
            <span>Hoje (${todayTasks.length})</span>
          </div>
          <div class="tasks-list">
            ${todayTasks.map(t => renderTaskHtml(t, 'Vence hoje')).join('')}
          </div>
        </section>
      `;
    }

    let next7DaysHtml = '';
    const daysWithTasks: { date: Date; tasks: Task[] }[] = [];
    next7DaysMap.forEach(val => {
      if (val.tasks.length > 0) {
        daysWithTasks.push(val);
      }
    });

    if (daysWithTasks.length > 0) {
      next7DaysHtml = `
        <section class="section">
          <div class="section-title">
            <span>Próximos 7 Dias (${next7DaysCount})</span>
          </div>
          <div class="days-group-list">
            ${daysWithTasks
              .map(({ date, tasks }) => {
                const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
                const dayNumber = String(date.getDate()).padStart(2, '0');
                const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
                return `
                  <div class="day-group">
                    <div class="day-group-header">
                      <strong>${dayOfWeek}</strong> &bull; ${dayNumber}/${monthNumber}
                    </div>
                    <div class="tasks-list">
                      ${tasks.map(t => renderTaskHtml(t)).join('')}
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </section>
      `;
    }

    let blockedHtml = '';
    if (blockedTasks.length > 0) {
      blockedHtml = `
        <section class="section section-blocked">
          <div class="section-title section-title-blocked">
            <span>Travadas (${blockedTasks.length})</span>
          </div>
          <div class="tasks-list">
            ${blockedTasks
              .map(t => {
                const reasonText = t.blockedReason ? (BLOCK_REASON_LABELS[t.blockedReason] || t.blockedReason) : 'Bloqueio operacional';
                const responsibleText = t.blockedResponsibleId ? `Destravar com: ${t.blockedResponsibleId}` : 'Aguardando ação externa';
                return renderTaskHtml(t, `Motivo: ${reasonText} | ${responsibleText}`);
              })
              .join('')}
          </div>
        </section>
      `;
    }

    contentHtml = delayedHtml + todayHtml + next7DaysHtml + blockedHtml;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tarefas - ${escapeHtml(user.name)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      color: #0f172a;
      line-height: 1.5;
      padding: 24px 16px;
      font-size: 14px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 8px;
    }
    .header-name {
      font-size: 26px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: #0f172a;
    }
    .header-role {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      margin-top: 2px;
    }
    .header-date {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      margin-top: 8px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 20px;
    }
    .metric-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }
    .metric-card.metric-delayed {
      background-color: #fef2f2;
      border-color: #fecaca;
    }
    .metric-card.metric-delayed .metric-value {
      color: #dc2626;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
    }
    .metric-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-top: 6px;
    }
    .metric-delayed .metric-label {
      color: #991b1b;
    }
    .section {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #475569;
      padding-bottom: 8px;
      border-bottom: 1.5px solid #e2e8f0;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title-delayed {
      color: #dc2626;
      border-bottom-color: #fca5a5;
    }
    .section-title-blocked {
      color: #9333ea;
      border-bottom-color: #d8b4fe;
    }
    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .task-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      page-break-inside: avoid;
    }
    .section-delayed .task-card {
      border-color: #fca5a5;
      background-color: #fffafb;
    }
    .section-blocked .task-card {
      border-color: #e9d5ff;
      background-color: #faf5ff;
    }
    .task-main {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .task-checkbox {
      width: 16px;
      height: 16px;
      border: 2px solid #0f172a;
      border-radius: 4px;
      flex-shrink: 0;
      margin-top: 2px;
      background-color: #ffffff;
    }
    .section-delayed .task-checkbox {
      border-color: #dc2626;
    }
    .task-body {
      flex: 1;
      min-width: 0;
    }
    .task-header-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .task-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .section-delayed .task-title {
      color: #991b1b;
    }
    .task-desc {
      margin-top: 5px;
      font-size: 12.5px;
      color: #334155;
      background-color: #f1f5f9;
      padding: 6px 10px;
      border-radius: 6px;
      border-left: 3px solid #64748b;
    }
    .task-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .task-tag {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 7px;
      border-radius: 5px;
    }
    .tag-context {
      background-color: #e2e8f0;
      color: #1e293b;
    }
    .tag-layer {
      background-color: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .tag-stage {
      background-color: #e0e7ff;
      color: #3730a3;
    }
    .tag-extra {
      background-color: #fee2e2;
      color: #991b1b;
      font-weight: 800;
    }
    .badge-priority-p1 {
      font-size: 10px;
      font-weight: 900;
      background-color: #dc2626;
      color: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .badge-priority-p2 {
      font-size: 10px;
      font-weight: 900;
      background-color: #f59e0b;
      color: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .badge-priority-p3 {
      font-size: 10px;
      font-weight: 800;
      background-color: #e2e8f0;
      color: #475569;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .day-group {
      margin-bottom: 14px;
    }
    .day-group-header {
      font-size: 12px;
      color: #475569;
      margin-bottom: 6px;
      padding-left: 4px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 36px;
      text-align: center;
      color: #64748b;
      font-size: 11px;
    }
    .footer-stamp {
      font-weight: 700;
    }
    .footer-notice {
      margin-top: 4px;
      font-style: italic;
    }
    .empty-state {
      text-align: center;
      padding: 48px 16px;
      background-color: #f8fafc;
      border-radius: 16px;
      border: 2px dashed #cbd5e1;
    }
    .empty-box {
      width: 48px;
      height: 48px;
      border-radius: 24px;
      background-color: #dcfce7;
      color: #16a34a;
      font-size: 24px;
      font-weight: bold;
      line-height: 48px;
      margin: 0 auto 12px;
    }
    @media (max-width: 600px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .header-name {
        font-size: 20px;
      }
    }
    @media print {
      body {
        padding: 0;
        font-size: 12px;
      }
      .task-card {
        border-color: #94a3b8;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="header-top">
        <div>
          <h1 class="header-name">${escapeHtml(user.name)}</h1>
          <div class="header-role">${escapeHtml(user.role || 'Membro do time')}</div>
        </div>
      </div>
      <div class="header-date">${escapeHtml(formatDateExtenso(now))}</div>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${totalOpen}</div>
          <div class="metric-label">Abertas</div>
        </div>
        <div class="metric-card ${totalDelayed > 0 ? 'metric-delayed' : ''}">
          <div class="metric-value">${totalDelayed}</div>
          <div class="metric-label">Atrasadas</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${totalToday}</div>
          <div class="metric-label">Para Hoje</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${next7DaysCount}</div>
          <div class="metric-label">Próximos 7 Dias</div>
        </div>
      </div>
    </header>

    <main>
      ${contentHtml}
    </main>

    <footer class="footer">
      <div class="footer-stamp">Gerado pelo Comando Tome Nota em ${formattedNow}</div>
      <div class="footer-notice">Esta página é uma foto do momento. O status só muda dentro do sistema.</div>
    </footer>
  </div>
</body>
</html>`;
}

export function gerarTextoColaborador(
  user: User,
  tasks: Task[],
  clients: Client[]
): string {
  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const activeTasks = tasks.filter(
    t => t.assigneeId === user.id && t.status !== 'done' && t.status !== 'posted' && t.status !== 'canceled'
  );

  const delayedTasks: { task: Task; daysPassed: number }[] = [];
  const todayTasks: Task[] = [];
  const next7DaysMap = new Map<string, { date: Date; tasks: Task[] }>();
  const blockedTasks: Task[] = [];

  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date(todayOnly);
    futureDate.setDate(todayOnly.getDate() + i);
    const dateKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;
    next7DaysMap.set(dateKey, { date: futureDate, tasks: [] });
  }

  let next7DaysCount = 0;

  activeTasks.forEach(task => {
    if (task.blockedReason || task.status === 'blocked') {
      blockedTasks.push(task);
    }

    if (!task.dueDate) return;

    const taskDate = parseDateOnly(task.dueDate);
    const daysDiff = getDaysDiff(todayOnly, taskDate);

    if (daysDiff > 0) {
      delayedTasks.push({ task, daysPassed: daysDiff });
    } else if (daysDiff === 0) {
      todayTasks.push(task);
    } else if (daysDiff < 0 && daysDiff >= -7) {
      const dateKey = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
      const entry = next7DaysMap.get(dateKey);
      if (entry) {
        entry.tasks.push(task);
        next7DaysCount++;
      }
    }
  });

  delayedTasks.sort((a, b) => b.daysPassed - a.daysPassed);

  const lines: string[] = [];

  lines.push(`PAUTA DO DIA - ${user.name.toUpperCase()}`);
  lines.push(`Data: ${formatDateExtenso(now)}`);
  lines.push(
    `Resumo: ${activeTasks.length} abertas | ${delayedTasks.length} atrasadas | ${todayTasks.length} para hoje | ${next7DaysCount} proximos 7 dias`
  );
  lines.push('');

  if (activeTasks.length === 0) {
    lines.push('Nada aberto para voce hoje.');
    lines.push('');
  } else {
    if (delayedTasks.length > 0) {
      lines.push(`--- ATRASADAS (${delayedTasks.length}) ---`);
      delayedTasks.forEach(({ task, daysPassed }) => {
        const clientName = task.clientId ? (clients.find(c => c.id === task.clientId)?.name || task.clientId) : task.ecosystemId;
        const dueFormatted = formatDateShort(task.dueDate);
        lines.push(`[ ] ${task.title} - ${clientName} (Venceu ha ${daysPassed}d - limite ${dueFormatted})`);
        if (task.description) {
          lines.push(`    Definicao de pronto: ${task.description}`);
        }
        const layer = LAYER_LABELS[task.layer] || task.layer;
        const stage = task.stage ? STAGE_LABELS[task.stage] || task.stage : '';
        lines.push(`    Prioridade: ${task.priority} | Camada: ${layer}${stage ? ` | Etapa: ${stage}` : ''}`);
        lines.push('');
      });
    }

    if (todayTasks.length > 0) {
      lines.push(`--- HOJE (${todayTasks.length}) ---`);
      todayTasks.forEach(task => {
        const clientName = task.clientId ? (clients.find(c => c.id === task.clientId)?.name || task.clientId) : task.ecosystemId;
        lines.push(`[ ] ${task.title} - ${clientName}`);
        if (task.description) {
          lines.push(`    Definicao de pronto: ${task.description}`);
        }
        const layer = LAYER_LABELS[task.layer] || task.layer;
        const stage = task.stage ? STAGE_LABELS[task.stage] || task.stage : '';
        lines.push(`    Prioridade: ${task.priority} | Camada: ${layer}${stage ? ` | Etapa: ${stage}` : ''}`);
        lines.push('');
      });
    }

    if (next7DaysCount > 0) {
      lines.push(`--- PROXIMOS 7 DIAS (${next7DaysCount}) ---`);
      next7DaysMap.forEach(({ date, tasks: dayTasks }) => {
        if (dayTasks.length > 0) {
          const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
          const dayNumber = String(date.getDate()).padStart(2, '0');
          const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
          lines.push(`[${dayOfWeek} - ${dayNumber}/${monthNumber}]`);
          dayTasks.forEach(task => {
            const clientName = task.clientId ? (clients.find(c => c.id === task.clientId)?.name || task.clientId) : task.ecosystemId;
            lines.push(`[ ] ${task.title} - ${clientName}`);
            if (task.description) {
              lines.push(`    Definicao de pronto: ${task.description}`);
            }
            const layer = LAYER_LABELS[task.layer] || task.layer;
            const stage = task.stage ? STAGE_LABELS[task.stage] || task.stage : '';
            lines.push(`    Prioridade: ${task.priority} | Camada: ${layer}${stage ? ` | Etapa: ${stage}` : ''}`);
            lines.push('');
          });
        }
      });
    }

    if (blockedTasks.length > 0) {
      lines.push(`--- TRAVADAS (${blockedTasks.length}) ---`);
      blockedTasks.forEach(task => {
        const clientName = task.clientId ? (clients.find(c => c.id === task.clientId)?.name || task.clientId) : task.ecosystemId;
        const reasonText = task.blockedReason ? (BLOCK_REASON_LABELS[task.blockedReason] || task.blockedReason) : 'Bloqueio operacional';
        const responsible = task.blockedResponsibleId ? `Destravar com: ${task.blockedResponsibleId}` : 'Aguardando acao externa';
        lines.push(`[ ] ${task.title} - ${clientName}`);
        if (task.description) {
          lines.push(`    Definicao de pronto: ${task.description}`);
        }
        const layer = LAYER_LABELS[task.layer] || task.layer;
        const stage = task.stage ? STAGE_LABELS[task.stage] || task.stage : '';
        lines.push(`    Prioridade: ${task.priority} | Camada: ${layer}${stage ? ` | Etapa: ${stage}` : ''}`);
        lines.push(`    Motivo: ${reasonText}`);
        lines.push(`    ${responsible}`);
        lines.push('');
      });
    }
  }

  const formattedNow = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} as ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  lines.push(`Gerado pelo Comando Tome Nota em ${formattedNow}`);
  lines.push('Esta pagina e uma foto do momento. O status so muda dentro do sistema.');

  return lines.join('\n');
}

export function getExportFileName(userName: string, date = new Date()): string {
  const firstName = userName
    .trim()
    .split(/\s+/)[0]
    .replace(/[()]/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `tarefas-${firstName}-${year}-${month}-${day}.html`;
}

export function downloadColaboradorHtml(
  user: User,
  tasks: Task[],
  clients: Client[],
  ecosystems: Ecosystem[]
): void {
  const html = gerarPaginaColaborador(user, tasks, clients, ecosystems);
  const fileName = getExportFileName(user.name);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
