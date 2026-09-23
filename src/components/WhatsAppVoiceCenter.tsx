import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Mic, 
  Square, 
  Upload, 
  ExternalLink, 
  RefreshCw, 
  X, 
  Radio, 
  Sparkles, 
  Send, 
  Users, 
  Volume2,
  Clock,
  Check,
  Eye,
  EyeOff,
  Filter,
  Layers,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Ban,
  ArrowRight
} from 'lucide-react';
import { collection, doc, onSnapshot, query, orderBy, limit, setDoc, deleteField } from 'firebase/firestore';
import { db, isCloudEnabled } from '../lib/firebase';
import { Task, User, WhatsAppStatusDoc, WhatsAppMessageDoc, WhatsAppChatDoc, WhatsAppConfigDoc, ComandoTriagemDoc } from '../types';
import { ECOSYSTEMS } from '../lib/constants';
import { getAssigneeDisplayName } from '../lib/taskUtils';

const PAINEL_WHATSAPP = 'https://whats.tomezap.com.br/manager';

interface WhatsAppVoiceCenterProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  users: User[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSelectTask?: (taskId: string) => void;
}

export function WhatsAppVoiceCenter({
  isOpen,
  onClose,
  tasks,
  users,
  onAddTask,
  onUpdateTask,
  onSelectTask,
}: WhatsAppVoiceCenterProps) {
  // Tabs: 'operacao' | 'conexao' | 'gravacao'
  const [activeTab, setActiveTab] = useState<'operacao' | 'conexao' | 'gravacao'>('operacao');

  // Firestore Real-Time States
  const [statusDoc, setStatusDoc] = useState<WhatsAppStatusDoc | null>(null);
  const [hasStatusDoc, setHasStatusDoc] = useState<boolean>(false);
  const [messages, setMessages] = useState<WhatsAppMessageDoc[]>([]);
  const [chats, setChats] = useState<WhatsAppChatDoc[]>([]);
  const [configDoc, setConfigDoc] = useState<WhatsAppConfigDoc | null>(null);
  const [triagemList, setTriagemList] = useState<ComandoTriagemDoc[]>([]);

  // UI state for messages
  const [showConversaSolta, setShowConversaSolta] = useState(false);
  const [chatEcosystemDrafts, setChatEcosystemDrafts] = useState<Record<string, string>>({});
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  // Audio Recording (for direct voice input)
  const [recordMode, setRecordMode] = useState<'voice' | 'upload' | 'text'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingErrorMessage, setRecordingErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // 1. Subscribe to status/whatsapp
  useEffect(() => {
    if (!isCloudEnabled || !db) return;
    const unsubscribe = onSnapshot(doc(db, 'status', 'whatsapp'), (docSnap) => {
      if (docSnap.exists()) {
        setStatusDoc(docSnap.data() as WhatsAppStatusDoc);
        setHasStatusDoc(true);
      } else {
        setStatusDoc(null);
        setHasStatusDoc(false);
      }
    }, (error) => {
      console.warn('Erro ao ler status/whatsapp:', error);
      setStatusDoc(null);
      setHasStatusDoc(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to whatsapp_messages (100 mais recentes por timestamp desc)
  useEffect(() => {
    if (!isCloudEnabled || !db) return;
    const q = query(
      collection(db, 'whatsapp_messages'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WhatsAppMessageDoc));
      setMessages(msgs);
    }, (error) => {
      console.warn('Erro ao ler whatsapp_messages:', error);
    });

    return () => unsubscribe();
  }, []);

  // 3. Subscribe to whatsapp_chats and config/whatsapp
  useEffect(() => {
    if (!isCloudEnabled || !db) return;

    const unsubChats = onSnapshot(collection(db, 'whatsapp_chats'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WhatsAppChatDoc));
      setChats(list);
    }, (error) => {
      console.warn('Erro ao ler whatsapp_chats:', error);
    });

    const unsubConfig = onSnapshot(doc(db, 'config', 'whatsapp'), (docSnap) => {
      if (docSnap.exists()) {
        setConfigDoc(docSnap.data() as WhatsAppConfigDoc);
      } else {
        setConfigDoc(null);
      }
    }, (error) => {
      console.warn('Erro ao ler config/whatsapp:', error);
    });

    return () => {
      unsubChats();
      unsubConfig();
    };
  }, []);

  // 4. Subscribe to comando_triagem
  useEffect(() => {
    if (!isCloudEnabled || !db) return;
    const unsubscribe = onSnapshot(collection(db, 'comando_triagem'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ComandoTriagemDoc));
      setTriagemList(list);
    }, (error) => {
      console.warn('Erro ao ler comando_triagem:', error);
    });

    return () => unsubscribe();
  }, []);

  // Monitor a discovered chat
  const handleStartMonitoring = async (chat: WhatsAppChatDoc) => {
    if (!db) return;
    const ecoId = chatEcosystemDrafts[chat.jid] || chat.ecosystem || 'reev';
    setIsUpdatingConfig(true);
    try {
      await setDoc(doc(db, 'config', 'whatsapp'), {
        chats: {
          [chat.jid]: {
            nome: chat.nome || chat.jid,
            ecosystem: ecoId
          }
        }
      }, { merge: true });
    } catch (err) {
      console.error('Erro ao ativar monitoramento:', err);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // Stop monitoring a chat
  const handleStopMonitoring = async (jid: string) => {
    if (!db) return;
    setIsUpdatingConfig(true);
    try {
      await setDoc(doc(db, 'config', 'whatsapp'), {
        chats: {
          [jid]: deleteField()
        }
      }, { merge: true });
    } catch (err) {
      console.error('Erro ao parar monitoramento:', err);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // Recording controls
  const startRecording = async () => {
    setRecordingErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      setRecordingErrorMessage('Permissão de microfone negada ou dispositivo indisponível.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setRecordingErrorMessage(null);
    }
  };

  const processDirectAudioOrText = async () => {
    if (!audioBlob && !textInput.trim()) {
      setRecordingErrorMessage('Grave um áudio ou digite um texto para processar.');
      return;
    }

    setIsProcessing(true);
    setRecordingErrorMessage(null);

    try {
      let audioBase64 = null;
      let mimeType = null;

      if (audioBlob) {
        audioBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(audioBlob);
        });
        mimeType = audioBlob.type || 'audio/webm';
      }

      const tasksSummary = tasks.slice(0, 10).map(t => `- [${t.priority}] ${t.title} (${t.status})`).join('\n');
      const teamSummary = users.map(u => `${u.name} (${u.role})`).join(', ');

      const res = await fetch('/api/ai/audio-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          textMessage: textInput.trim() || undefined,
          existingTasksSummary: tasksSummary,
          teamMembersSummary: teamSummary
        })
      });

      if (!res.ok) {
        throw new Error('Falha no processamento pelo servidor.');
      }

      const data = await res.json();
      if (data.demands && Array.isArray(data.demands)) {
        data.demands.forEach((d: any) => {
          const assignedUser = users.find(u => u.name.toLowerCase().includes((d.suggestedAssigneeName || '').toLowerCase()));
          onAddTask({
            title: d.title,
            description: d.description || '',
            ecosystemId: d.ecosystemId || 'reev',
            priority: d.priority || 'P2',
            layer: 'operation',
            assigneeId: assignedUser?.id || (d.suggestedAssigneeName?.toLowerCase() || 'paulo'),
            dueDate: d.dueDateSuggestion || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            status: 'pending',
            stage: 'idea',
            origem: 'whatsapp'
          });
        });
      }

      // Reset recording form
      setAudioBlob(null);
      setAudioUrl(null);
      setTextInput('');
      setActiveTab('operacao');
    } catch (err: any) {
      console.error('Erro ao processar:', err);
      setRecordingErrorMessage(err.message || 'Erro ao processar áudio.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Triagem items
  const pendentesTriagem = triagemList
    .filter(t => t.status === 'pendente' || t.status === 'criando')
    .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));

  const resolvidas24h = triagemList
    .filter(t => {
      if (t.status !== 'criada' && t.status !== 'descartada') return false;
      const resolvedTime = typeof t.resolvidoEm === 'number' ? t.resolvidoEm : 
        (t.resolvidoEm?.toMillis ? t.resolvidoEm.toMillis() : 
        (typeof t.resolvidoEm === 'string' ? new Date(t.resolvidoEm).getTime() : (t.criadoEm || 0)));
      return (Date.now() - resolvedTime) <= 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));

  // Messages filter:
  // - status 'ruido' fica escondido atrás de "Mostrar conversa solta"
  // - comando ('criada' | 'descartada' | 'ajustada' | 'desfeito') fica escondido junto com conversa solta
  const filteredMessages = messages.filter(msg => {
    const isComando = Boolean(msg.comando);
    const isRuido = msg.status === 'ruido';
    if ((isRuido || isComando) && !showConversaSolta) {
      return false;
    }
    return true;
  });

  // Configured monitored groups
  const monitoredChatsMap = configDoc?.chats || {};
  const monitoredJids = Object.keys(monitoredChatsMap);

  // Discovered groups not yet monitored
  const discoveredNotMonitored = chats.filter(c => !monitoredChatsMap[c.jid]);

  // Helpers
  const formatTime = (ts: any) => {
    if (!ts) return '';
    let d: Date;
    if (typeof ts === 'object' && typeof ts.toDate === 'function') {
      d = ts.toDate();
    } else if (typeof ts === 'number') {
      d = new Date(ts);
    } else if (typeof ts === 'string') {
      d = new Date(ts);
    } else {
      return '';
    }
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatAudioDuration = (seconds?: number) => {
    if (!seconds && seconds !== 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return 'Sem prazo';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-5xl h-[92vh] bg-white rounded-[32px] sm:rounded-[36px] shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden"
      >
        {/* TOP HEADER */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">
                  Central WhatsApp & Operacional Reev
                </h2>
                {/* STATUS BADGE FROM status/whatsapp */}
                <ConnectionBadge statusDoc={statusDoc} hasStatusDoc={hasStatusDoc} />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Alimentado pela ponte em tempo real. Demanda escutada vira proposta no grupo do Comando.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="px-6 py-2.5 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('operacao')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'operacao'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200/70'
              }`}
            >
              <Radio size={14} className={activeTab === 'operacao' ? 'text-emerald-400' : 'text-slate-400'} />
              <span>Operação & Feed</span>
              {pendentesTriagem.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                  {pendentesTriagem.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('conexao')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'conexao'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200/70'
              }`}
            >
              <Users size={14} className={activeTab === 'conexao' ? 'text-emerald-400' : 'text-slate-400'} />
              <span>Conexão & Grupos</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold">
                {monitoredJids.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gravacao')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'gravacao'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200/70'
              }`}
            >
              <Mic size={14} className={activeTab === 'gravacao' ? 'text-emerald-400' : 'text-slate-400'} />
              <span>Gravação Direta</span>
            </button>
          </div>

          <a
            href={PAINEL_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors hidden sm:flex"
            title="Abrir painel administrativo externo"
          >
            <span>Painel do Servidor</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* TAB 1: OPERAÇÃO & FEED (TRIAGEM ACIMA DO FEED) */}
        {activeTab === 'operacao' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
            {/* PARTE 3 — PAINEL DE TRIAGEM ACIMA DO FEED */}
            <div className="bg-slate-50 border border-slate-200 rounded-[28px] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                      Painel de Triagem (Confirmação no WhatsApp)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Demandas estruturadas pela IA aguardando seu comando no WhatsApp.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-slate-500">
                  {pendentesTriagem.length} pendente{pendentesTriagem.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* LISTA DE PENDENTES */}
              {pendentesTriagem.length === 0 ? (
                <div className="py-6 px-4 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1.5" />
                  <p className="text-xs font-bold text-slate-600">Nenhuma demanda esperando confirmação.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendentesTriagem.map((item) => {
                    const eco = ECOSYSTEMS.find(e => e.id === item.proposta.ecosystemId);
                    const assigneeName = getAssigneeDisplayName(item.proposta.assigneeId, users);

                    return (
                      <div
                        key={item.id}
                        className="bg-white border-2 border-amber-200/80 rounded-2xl p-4 space-y-3 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {eco && (
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: eco.color }}
                                />
                              )}
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                {eco?.name || item.proposta.ecosystemId || 'Operacional'}
                              </span>

                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                item.proposta.priority === 'P1' ? 'bg-red-100 text-red-700' :
                                item.proposta.priority === 'P2' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {item.proposta.priority || 'P2'}
                              </span>

                              {item.proposta.prazoSugerido && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                  prazo sugerido
                                </span>
                              )}

                              {item.proposta.responsavelPeloDono && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                  dono da área
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-black text-slate-900 leading-snug">
                              {item.proposta.title}
                            </h4>

                            {item.proposta.description && (
                              <p className="text-xs text-slate-600 font-medium line-clamp-2">
                                {item.proposta.description}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 block">Prazo</span>
                            <span className="text-xs font-black text-slate-800">
                              {formatDueDate(item.proposta.dueDate)}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-3 text-slate-500 font-medium text-[11px]">
                            <span>
                              Resp: <strong className="text-slate-800 font-bold">{assigneeName}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Origem: <strong className="text-slate-800 font-bold">{item.origem?.chatName || item.origem?.senderName || 'WhatsApp'}</strong>
                            </span>
                          </div>

                          {/* AVISO CURTO EXIGIDO PELO PROMPT */}
                          <div className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 self-start sm:self-auto">
                            <MessageCircle size={12} className="text-amber-600" />
                            <span>Responda <strong>ok</strong> no grupo do Comando para criar</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* RESOLVIDAS NAS ÚLTIMAS 24 HORAS */}
              {resolvidas24h.length > 0 && (
                <div className="pt-3 border-t border-slate-200/80 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Resolvidas nas últimas 24 horas ({resolvidas24h.length})
                  </span>
                  <div className="space-y-1.5">
                    {resolvidas24h.map((item) => {
                      const isCriada = item.status === 'criada';
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs py-1.5 px-3 bg-white rounded-xl border border-slate-100"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-700 font-bold truncate max-w-md">
                              {item.proposta.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 text-[11px]">
                            {isCriada ? (
                              item.tarefaId && onSelectTask ? (
                                <button
                                  onClick={() => {
                                    onSelectTask(item.tarefaId!);
                                    onClose();
                                  }}
                                  className="text-emerald-700 underline font-bold hover:text-emerald-900 cursor-pointer"
                                >
                                  criada
                                </button>
                              ) : (
                                <span className="font-bold text-emerald-700">criada</span>
                              )
                            ) : (
                              <span className="font-bold text-slate-500">descartada</span>
                            )}
                            {item.resolvidoPor && (
                              <span className="text-slate-400">por {item.resolvidoPor}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* FEED DE MENSAGENS EM TEMPO REAL */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    Mensagens e Áudios Monitorados
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Exibindo as 100 mensagens mais recentes dos grupos autorizados no servidor.
                  </p>
                </div>

                {/* BOTÃO MOSTRAR CONVERSA SOLTA */}
                <button
                  onClick={() => setShowConversaSolta(!showConversaSolta)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    showConversaSolta
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {showConversaSolta ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showConversaSolta ? 'Ocultar conversa solta' : 'Mostrar conversa solta'}</span>
                </button>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-[28px] border border-dashed border-slate-200 space-y-2">
                  <MessageCircle size={32} className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">Nenhuma mensagem recente encontrada.</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Assim que mensagens ou áudios chegarem aos grupos monitorados, eles aparecerão aqui em tempo real.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map((msg) => {
                    const isAudio = msg.type === 'audio';
                    const hasError = msg.status === 'erro_transcricao' || msg.status === 'erro';
                    const isProcessed = Boolean(msg.processed);
                    const isRuido = msg.status === 'ruido';
                    const isComando = Boolean(msg.comando);

                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isProcessed
                            ? 'opacity-50 grayscale-[25%] bg-slate-50 border-slate-200'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap text-[11px]">
                              <span className="font-black text-slate-900">
                                {msg.senderName || 'Remetente'}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-bold">
                                {msg.chatName || 'Grupo'}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400">
                                {formatTime(msg.timestamp)}
                              </span>

                              {/* TAG RUÍDO OU COMANDO */}
                              {isRuido && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold">
                                  conversa solta
                                </span>
                              )}
                              {isComando && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold">
                                  comando: {msg.comando}
                                </span>
                              )}
                            </div>

                            {/* AUDIO PLAYER / INDICATOR */}
                            {isAudio && (
                              <div className="flex items-center gap-2 py-1 text-emerald-700 font-bold text-xs">
                                <Volume2 size={15} />
                                <span>Áudio ({formatAudioDuration(msg.audioDurationSeconds)})</span>
                              </div>
                            )}

                            {/* CONTENT / TRANSCRIPTION */}
                            {hasError ? (
                              <p className="text-xs text-amber-700 font-medium italic">
                                Não foi possível transcrever
                              </p>
                            ) : (
                              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                                {msg.content}
                              </p>
                            )}
                          </div>

                          {/* BADGES ON PROCESSED */}
                          {isProcessed && (
                            <div className="shrink-0 flex items-center gap-1.5">
                              {msg.tarefaId && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                                  virou tarefa
                                </span>
                              )}
                              {msg.descartada && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-black uppercase">
                                  descartada
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CONEXÃO & GRUPOS */}
        {activeTab === 'conexao' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
            {/* SELO DE STATUS E PAINEL */}
            <div className="bg-slate-50 border border-slate-200 rounded-[28px] p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    Status da Conexão WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Conexão mantida de forma persistente pelo servidor independente da ponte.
                  </p>
                </div>
                <div>
                  <ConnectionBadge statusDoc={statusDoc} hasStatusDoc={hasStatusDoc} />
                </div>
              </div>

              {/* AVISO FIXO EXIGIDO PELO PROMPT */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-3">
                <HelpCircle size={18} className="shrink-0 text-amber-600" />
                <span>
                  Os grupos que o sistema pode ouvir são definidos no servidor. Aqui você escolhe, dentro deles, quais ficam ativos.
                </span>
              </div>
            </div>

            {/* LISTA DE GRUPOS MONITORADOS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    Grupos Monitorados Ativos ({monitoredJids.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    O sistema escuta áudios e mensagens nestes grupos para estruturação operacional.
                  </p>
                </div>
              </div>

              {monitoredJids.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-500">Nenhum grupo ativo no momento.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Ative um dos grupos descobertos abaixo.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {monitoredJids.map((jid) => {
                    const item = monitoredChatsMap[jid];
                    const eco = ECOSYSTEMS.find(e => e.id === item.ecosystem);

                    return (
                      <div
                        key={jid}
                        className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {eco && (
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: eco.color }}
                              />
                            )}
                            <h4 className="text-sm font-black text-slate-900">{item.nome || jid}</h4>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Ecossistema: {eco?.name || item.ecosystem || 'Reev'}
                          </p>
                        </div>

                        <button
                          onClick={() => handleStopMonitoring(jid)}
                          disabled={isUpdatingConfig}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold text-xs transition-colors self-start sm:self-auto cursor-pointer"
                        >
                          Parar de monitorar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* GRUPOS DESCOBERTOS QUE AINDA NÃO ESTÃO MONITORADOS */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                  Grupos Descobertos pelo Servidor ({discoveredNotMonitored.length})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Grupos que a ponte já encontrou na sua conta. Escolha o ecossistema e clique em monitorar.
                </p>
              </div>

              {discoveredNotMonitored.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-500">Nenhum grupo adicional pendente.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {discoveredNotMonitored.map((chat) => {
                    const currentSelectedEco = chatEcosystemDrafts[chat.jid] || chat.ecosystem || 'reev';

                    return (
                      <div
                        key={chat.jid}
                        className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{chat.nome || chat.jid}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">JID: {chat.jid}</span>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <select
                            value={currentSelectedEco}
                            onChange={(e) => {
                              const val = e.target.value;
                              setChatEcosystemDrafts(prev => ({ ...prev, [chat.jid]: val }));
                            }}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                          >
                            {ECOSYSTEMS.map(eco => (
                              <option key={eco.id} value={eco.id}>
                                {eco.name}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleStartMonitoring(chat)}
                            disabled={isUpdatingConfig}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            Monitorar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GRAVAÇÃO DIRETA (MICROFONE / ENVIAR ÁUDIO) */}
        {activeTab === 'gravacao' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-base font-black uppercase tracking-tight text-slate-900">
                  Gravação e Entrada Direta de Voz
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Grave um comando de voz ou digite uma ordem para ser transcrita e estruturada no sistema.
                </p>
              </div>

              {/* Mode Selector */}
              <div className="flex justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  onClick={() => setRecordMode('voice')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    recordMode === 'voice' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Gravar Microfone
                </button>
                <button
                  onClick={() => setRecordMode('upload')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    recordMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Enviar Arquivo de Áudio
                </button>
                <button
                  onClick={() => setRecordMode('text')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    recordMode === 'text' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Texto Rápido
                </button>
              </div>

              {recordMode === 'voice' && (
                <div className="bg-slate-50 border border-slate-200 rounded-[28px] p-8 text-center space-y-6">
                  <div className="flex justify-center">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse shadow-red-200'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200'
                      }`}
                    >
                      {isRecording ? <Square size={32} /> : <Mic size={36} />}
                    </button>
                  </div>

                  <div>
                    <span className="text-2xl font-black text-slate-800">
                      {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
                    </span>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                      {isRecording ? 'Gravando áudio...' : 'Clique para começar a gravar'}
                    </p>
                  </div>

                  {audioUrl && !isRecording && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                      <audio src={audioUrl} controls className="w-full" />
                    </div>
                  )}
                </div>
              )}

              {recordMode === 'upload' && (
                <div className="bg-slate-50 border border-slate-200 rounded-[28px] p-8 text-center space-y-4">
                  <Upload size={32} className="mx-auto text-slate-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">Selecione o arquivo de áudio</p>
                    <p className="text-xs text-slate-400">Suporta .ogg, .mp3, .m4a, .wav</p>
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white cursor-pointer"
                  />
                  {audioUrl && (
                    <div className="pt-2">
                      <audio src={audioUrl} controls className="w-full" />
                    </div>
                  )}
                </div>
              )}

              {recordMode === 'text' && (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    placeholder="Digite a ordem ou demanda da Reev / Agência..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              {recordingErrorMessage && (
                <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{recordingErrorMessage}</span>
                </div>
              )}

              <button
                onClick={processDirectAudioOrText}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Processando e estruturando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-amber-400" />
                    <span>Processar e Injetar Demanda</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ==========================================
// COMPONENTE DO SELO DE STATUS CONFORME PARTE 2
// ==========================================
// 1) Documento status/whatsapp
// Campos: state ('open' | 'connecting' | 'close'), numero (só o final, no formato "…5373"), nomePerfil, conectadoEm, desconectadoEm, atualizadoEm.
// - open: selo verde "Conectado" mostrando apenas o final do número, como vem no campo. Nunca monte um número completo.
// - connecting: selo amarelo "Conectando".
// - close: selo vermelho "Desconectado" com botão "Reconectar" que abre o painel em nova aba.
// - documento inexistente: selo cinza "Ainda não conectado".
function ConnectionBadge({
  statusDoc,
  hasStatusDoc
}: {
  statusDoc: WhatsAppStatusDoc | null;
  hasStatusDoc: boolean;
}) {
  if (!hasStatusDoc || !statusDoc) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-700/60 text-slate-300 text-xs font-black uppercase tracking-wider border border-slate-600/40">
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        <span>Ainda não conectado</span>
      </span>
    );
  }

  if (statusDoc.state === 'open') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Conectado</span>
        {statusDoc.numero && (
          <span className="text-[11px] text-emerald-200 font-bold ml-0.5">
            ({statusDoc.numero})
          </span>
        )}
      </span>
    );
  }

  if (statusDoc.state === 'connecting') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>Conectando</span>
      </span>
    );
  }

  // close or disconnected
  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/20 text-red-300 text-xs font-black uppercase tracking-wider border border-red-500/30">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        <span>Desconectado</span>
      </span>
      <button
        onClick={() => window.open(PAINEL_WHATSAPP, '_blank')}
        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
      >
        <span>Reconectar</span>
        <ExternalLink size={10} />
      </button>
    </div>
  );
}
