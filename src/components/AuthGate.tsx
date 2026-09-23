import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider, isCloudEnabled, OWNER_EMAIL } from '../lib/firebase';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';

interface SessionContextType {
  email: string;
  name: string;
  photo: string;
  role: 'admin' | 'staff' | 'editor';
  signOut: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const useSession = () => {
  const ctx = useContext(SessionContext);
  return ctx || {
    email: OWNER_EMAIL,
    name: 'Admin',
    photo: '',
    role: 'admin',
    signOut: () => {}
  };
};

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCloudEnabled || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    if (!auth || !googleProvider) return;
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Erro ao autenticar com Google:', err);
      setAuthError('Não foi possível realizar o login. Verifique sua conexão e tente novamente.');
    }
  };

  const handleSignOut = async () => {
    if (auth) {
      await fbSignOut(auth);
    }
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Carregando credenciais...</p>
        </div>
      </div>
    );
  }

  // If cloud is enabled but user is not logged in: display login gate
  if (isCloudEnabled && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white selection:bg-emerald-500">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-[36px] p-8 sm:p-10 shadow-2xl space-y-8 backdrop-blur-xl">
          <div className="space-y-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white">
              Comando Tome Nota & Reev
            </h1>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              Ambiente operacional restrito. Faça login com sua conta autorizada para acessar os ecossistemas, demandas e central de WhatsApp.
            </p>
          </div>

          {authError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar com Google</span>
            </button>
          </div>

          <div className="text-center pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Acesso seguro verificado por e-mail
            </span>
          </div>
        </div>
      </div>
    );
  }

  const session: SessionContextType = {
    email: currentUser?.email || OWNER_EMAIL,
    name: currentUser?.displayName || 'Admin',
    photo: currentUser?.photoURL || '',
    role: currentUser?.email === OWNER_EMAIL ? 'admin' : 'staff',
    signOut: handleSignOut,
  };

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
};
