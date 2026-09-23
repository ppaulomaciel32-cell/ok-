import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  CheckCircle2, 
  Flame,
  Clock,
  ChevronRight
} from 'lucide-react';

interface FocusTimerProps {
  energyLevel: number;
  onUpdateEnergy: (level: number) => void;
  onToggle?: (isActive: boolean) => void;
}

export function FocusTimer({ energyLevel, onUpdateEnergy, onToggle }: FocusTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60); // Default 25 mins
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);
  const [showSummary, setShowSummary] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onToggle?.(isActive);
  }, [isActive]);

  useEffect(() => {
    if (isActive && seconds > 0) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setShowSummary(true);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, seconds]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setSeconds(initialSeconds);
    setShowSummary(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialSeconds - seconds) / initialSeconds) * 100;

  // Energy integration: color changes based on energyLevel
  const getEnergyColor = () => {
    if (energyLevel >= 8) return 'text-emerald-400';
    if (energyLevel >= 5) return 'text-amber-400';
    return 'text-red-400';
  };

  const setDuration = (mins: number) => {
    const s = mins * 60;
    setInitialSeconds(s);
    setSeconds(s);
    setIsActive(false);
  };

  return (
    <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
      {/* Background Glow */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 rounded-full ${
        energyLevel >= 8 ? 'bg-emerald-500' : energyLevel >= 5 ? 'bg-amber-500' : 'bg-red-500'
      }`} />

      <div className="relative z-10 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/40 uppercase font-black text-[10px] tracking-widest">
            <Flame size={14} className={getEnergyColor()} />
            Sessão Foco Total
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            <Zap size={12} className={getEnergyColor()} />
            <span className="text-[10px] font-black uppercase tracking-widest">Energia: {energyLevel}/10</span>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-48 h-48 flex items-center justify-center">
             {/* Progress Circle (Simplified for UI elegance) */}
             <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle 
                  cx="96" cy="96" r="88" 
                  fill="transparent" 
                  stroke="rgba(255,255,255,0.05)" 
                  strokeWidth="8"
                />
                <motion.circle 
                  cx="96" cy="96" r="88" 
                  fill="transparent" 
                  stroke="currentColor" 
                  strokeWidth="8"
                  strokeDasharray="552.92"
                  animate={{ strokeDashoffset: 552.92 - (552.92 * progress) / 100 }}
                  transition={{ duration: 0.5, ease: "linear" }}
                  strokeLinecap="round"
                  className={getEnergyColor()}
                />
             </svg>
             
             <div className="text-center">
                <span className="text-5xl font-black tracking-tighter tabular-nums">
                  {formatTime(seconds)}
                </span>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mt-1">
                  {isActive ? 'Focando...' : 'Pausado'}
                </p>
             </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={resetTimer}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-white/60 hover:text-white"
          >
            <RotateCcw size={20} />
          </button>
          
          <button 
            onClick={toggleTimer}
            className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg ${
              isActive 
                ? 'bg-white/5 border border-white/20 text-white' 
                : 'bg-white text-slate-900 shadow-white/5'
            }`}
          >
            {isActive ? <><Pause size={20} /> Pausar</> : <><Play size={20} /> Iniciar Foco</>}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
           {[15, 25, 45].map(mins => (
             <button 
               key={mins}
               onClick={() => setDuration(mins)}
               className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                 initialSeconds === mins * 60 
                   ? 'bg-white/10 border-white/20 text-white' 
                   : 'bg-transparent border-white/5 text-white/30 hover:border-white/10 hover:text-white/60'
               }`}
             >
               {mins}m
             </button>
           ))}
        </div>
      </div>

      <AnimatePresence>
        {showSummary && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center p-8 text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
               <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">Sessão Concluída!</h3>
              <p className="text-white/60 text-sm mt-2 font-medium">Como está sua energia agora?</p>
            </div>
            
            <div className="flex gap-4 w-full">
               <button 
                 onClick={() => {
                   onUpdateEnergy(Math.min(10, energyLevel + 1));
                   resetTimer();
                 }}
                 className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-4 rounded-2xl border border-emerald-500/20 transition-all group"
               >
                  <div className="flex flex-col items-center gap-1">
                    <Zap size={20} />
                    <span className="text-[10px] font-black uppercase">Recarregado</span>
                  </div>
               </button>
               <button 
                 onClick={() => {
                   onUpdateEnergy(Math.max(1, energyLevel - 1));
                   resetTimer();
                 }}
                 className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 p-4 rounded-2xl border border-red-500/20 transition-all"
               >
                  <div className="flex flex-col items-center gap-1">
                    <Flame size={20} />
                    <span className="text-[10px] font-black uppercase">Exausto</span>
                  </div>
               </button>
            </div>

            <button 
              onClick={resetTimer}
              className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white"
            >
              Pular Registro
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
