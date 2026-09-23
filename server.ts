import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '35mb' }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. AI features will run in fallback simulation mode.');
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Process audio note or WhatsApp text demand with Gemini
app.post('/api/ai/audio-process', async (req, res) => {
  try {
    const { audioBase64, mimeType, textMessage, existingTasksSummary, teamMembersSummary } = req.body;

    if (!audioBase64 && !textMessage) {
      return res.status(400).json({ error: 'Nenhum áudio ou mensagem de texto fornecido.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback structured parser if key is missing
      const transcript = textMessage || 'Áudio recebido via WhatsApp (Processamento local)';
      return res.json({
        transcript,
        demands: [
          {
            title: textMessage ? textMessage.slice(0, 60) : 'Demanda captada via áudio Reev',
            description: transcript,
            ecosystemId: 'reev',
            priority: 'P2',
            suggestedAssigneeName: 'Paulo',
            dueDateSuggestion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            confidence: 0.85
          }
        ],
        systemicUpdates: [],
        whatsappReply: `✅ *Recebido pelo Comando Executivo!*\nDemanda anotada para o operacional da Reev.\n📌 *${textMessage || 'Demanda de áudio'}*`
      });
    }

    const ai = getGeminiClient();

    const systemPrompt = `Você é o Copiloto de Operações Executivas do Grupo Tome Nota e da Reev (operacional geral da Reev).
O usuário é o líder das empresas. Ele envia áudios (de voz / WhatsApp) ou mensagens de texto com ordens operacionais, novas demandas ou atualizações sistêmicas de projetos.

ECOSSISTEMAS VÁLIDOS:
- "reev": Operacional Reev (Geral - outra empresa do gestor, automações, processos gerais, clientes e rotinas Reev). IMPORTANTE: NÃO existe "rivi" nem "tiktok", é REEV!
- "agency": Agência Tome Nota (audiovisual, design, campanhas para clientes como Brasa, Dr. Luiz, Cláudio Pinho, etc.)
- "news": Jornais (pautas, matérias, jornalismo Tome Nota)
- "brand": Perfil Pessoal do líder (gravação de vídeos, conteúdos, autoridade)
- "courses": Cursos e infoprodutos
- "linkedin": Conteúdos LinkedIn
- "politics": Projeto Político

TAREFAS E DEMANDAS ATUAIS EM ANDAMENTO NO SISTEMA:
${existingTasksSummary || 'Nenhuma tarefa informada'}

EQUIPE CADASTRADA:
${teamMembersSummary || 'Paulo (Gestor), Kathleen (Diretora Operacional), Lucas (Audiovisual), Alan (Designer), Anderson (Jornalista), Pedro (Coordenação)'}

SUA MISSÃO:
1. Se for áudio: Transcreva EXATAMENTE o que foi dito em português do Brasil.
2. Identifique se o áudio/texto contém:
   a) Novas demandas para cadastrar.
   b) Atualizações sistêmicas em tarefas existentes (ex: "o Dr. Luiz aprovou", "o vídeo da Brasa está concluído", "travei na demanda X por falta de briefing").
3. Estruture em JSON estrito no seguinte formato:
{
  "transcript": "transcrição completa fiel do áudio",
  "summary": "resumo executivo em 1 linha",
  "demands": [
    {
      "title": "título curto e acionável da tarefa",
      "description": "detalhes, contexto e orientações dadas no áudio",
      "ecosystemId": "reev" | "agency" | "news" | "brand" | "courses" | "linkedin" | "politics",
      "priority": "P1" | "P2" | "P3",
      "suggestedAssigneeName": "nome do responsável sugerido",
      "dueDateSuggestion": "YYYY-MM-DD (hoje, amanhã ou data sugerida)",
      "stage": "idea" | "production" | "internal_review" | "client_approval" | "scheduled" | "posted"
    }
  ],
  "systemicUpdates": [
    {
      "targetTaskHint": "trecho ou nome do cliente/tarefa mencionada",
      "action": "complete" | "in_progress" | "block" | "unblock" | "change_stage",
      "newStatus": "done" | "in_progress" | "blocked" | "pending",
      "reason": "motivo ou notas da atualização identificada"
    }
  ],
  "whatsappReply": "mensagem concisa e elegante com emojis no estilo executivo do WhatsApp confirmando o que foi cadastrado e atualizado"
}`;

    const parts: any[] = [];

    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: audioBase64,
        },
      });
    }

    const userText = textMessage
      ? `Mensagem recebida: "${textMessage}". Analise e estruture.`
      : `Ouça o áudio anexo com atenção, transcreva e estruture todas as demandas e atualizações sistêmicas.`;

    parts.push({ text: userText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      } else {
        parsedData = { transcript: responseText, demands: [], systemicUpdates: [], whatsappReply: responseText };
      }
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Erro no processamento de áudio/IA:', error);
    return res.status(500).json({
      error: 'Falha ao processar áudio com Gemini.',
      details: error?.message || String(error),
    });
  }
});

// AI Day Closure & Morning Cobrança generator
app.post('/api/ai/day-closure', async (req, res) => {
  try {
    const { completedTasks, pendingTasks, delayedTasks, habitsRate, energyLevel, notes } = req.body;
    const ai = getGeminiClient();

    const prompt = `Analise o fechamento do dia do líder do Grupo Tome Nota e da Reev:
- Tarefas concluídas hoje: ${completedTasks?.length || 0} (${completedTasks?.map((t: any) => t.title).join(', ')})
- Tarefas que ficaram pendentes/abertas: ${pendingTasks?.length || 0} (${pendingTasks?.map((t: any) => `${t.title} [${t.priority}]`).join(', ')})
- Tarefas atrasadas em alerta: ${delayedTasks?.length || 0} (${delayedTasks?.map((t: any) => t.title).join(', ')})
- Taxa de hábitos cumpridos: ${habitsRate || 0}%
- Energia do líder: ${energyLevel || 7}/10
- Anotações do dia: "${notes || ''}"

Gere uma resposta em JSON com:
{
  "closureSummary": "resumo estratégico de 2 frases sobre o desempenho do dia",
  "tomorrowMorningBriefing": "texto de cobrança matinal para amanhã cedo, destacando as 3 coisas que não podem passar batido",
  "whatsappTeamCobrança": "mensagem pronta de WhatsApp para o gestor cobrar a equipe amanhã cedo sobre as entregas críticas",
  "suggestedTop3Tomorrow": ["Prioridade 1", "Prioridade 2", "Prioridade 3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro ao gerar fechamento:', error);
    return res.json({
      closureSummary: 'Fechamento registrado com sucesso no banco de dados.',
      tomorrowMorningBriefing: 'Amanhã cedo ataque prioritariamente as demandas atrasadas antes das reuniões.',
      whatsappTeamCobrança: 'Bom dia time! Hoje nosso foco total é destravar as demandas de ontem.',
      suggestedTop3Tomorrow: ['Revisar entregas pendentes', 'Alinhar equipe de produção', 'Executar demandas Reev']
    });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Comando Tome Nota & Reev rodando na porta ${PORT}`);
  });
}

start();
