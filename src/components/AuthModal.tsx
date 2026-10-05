import React, { useState } from 'react';
import { X, Sparkles, LogIn, UserPlus, AlertCircle, Loader2, ShieldCheck, Gem } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'register') {
      if (!nome.trim()) {
        setErrorMsg('Por favor, informe seu nome.');
        return;
      }
      if (senha.length < 6) {
        setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (senha !== confirmSenha) {
        setErrorMsg('As senhas não coincidem.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, senha);
      } else {
        await register(nome, email, senha);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click listener */}
      <div className="absolute inset-0" onClick={closeAuthModal} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#0a0c16] border border-ametist-600/40 rounded-2xl shadow-2xl shadow-ametist-950/60 overflow-hidden z-10">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-ametist-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative p-6 border-b border-white/5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ametist-600 via-purple-600 to-amber-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0c16] rounded-[10px] flex items-center justify-center">
                <Gem className="text-ametist-400 w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">SSO Ametist & Astralys</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-ametist-900/80 text-ametist-300 border border-ametist-500/30">
                  Conta Unificada
                </span>
              </div>
              <p className="text-xs text-slate-400">Entre para sincronizar suas planilhas e rotações na nuvem</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-6 pb-2">
          <div className="grid grid-cols-2 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-ametist-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-ametist-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Cadastrar
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Davi"
                required
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-ametist-500 focus:ring-1 focus:ring-ametist-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@ametist.com"
              required
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-ametist-500 focus:ring-1 focus:ring-ametist-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-ametist-500 focus:ring-1 focus:ring-ametist-500 transition-colors"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirmar Senha</label>
              <input
                type="password"
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-ametist-500 focus:ring-1 focus:ring-ametist-500 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-ametist-600 to-purple-600 hover:from-ametist-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-ametist-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                Entrar com SSO
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Criar Conta Unificada
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="p-4 bg-black/50 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Autenticação JWT Segura</span>
          </div>
          <span>Ametist & Astralys Cloud</span>
        </div>
      </div>
    </div>
  );
};
