import React, { useState } from 'react';
import { Sparkles, Zap, Flame, Swords, FolderGit2, BarChart3, ChevronDown, Cloud, LogOut, ExternalLink, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildAmetistSsoUrl } from '../services/auth';

export type ActiveTab = 'landing' | 'dashboards' | 'vault' | 'generator' | 'weapons' | 'damage' | 'er' | 'login';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab
}) => {
  const { user, isAuthenticated, openAuthModal, logout, syncStatus } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-ametist-950/80 border-b border-ametist-700/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding (Hub trigger) */}
          <button 
            type="button"
            className="flex items-center gap-3 cursor-pointer group text-left focus:outline-none"
            onClick={() => setActiveTab('landing')}
            title="Ir para o Hub Inicial (Astralys)"
          >
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr from-ametist-600 via-ametist-400 to-purple-300 flex items-center justify-center shadow-ametist-sm group-hover:shadow-ametist-glow transition-all duration-300 ${
                activeTab === 'landing' ? 'ring-2 ring-ametist-400 ring-offset-2 ring-offset-ametist-950' : ''
              }`}>
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-ametist-400/20 blur-sm -z-10 group-hover:bg-ametist-400/40 transition-colors" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-100 via-ametist-200 to-ametist-400">
                  ASTRALYS
                </span>
                <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-full bg-ametist-800/80 text-ametist-300 border border-ametist-600/40">
                  2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium group-hover:text-ametist-300 transition-colors">Genshin Theorycrafting Hub</p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-ametist-900/90 p-1.5 rounded-xl border border-ametist-700/50">

            <button
              onClick={() => setActiveTab('dashboards')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'dashboards'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-ametist-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-cyan-300" />
              Dashboards
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-ametist-800/50'
              }`}
            >
              <FolderGit2 className="w-4 h-4 text-purple-300" />
              Vault
            </button>

            <button
              onClick={() => setActiveTab('damage')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'damage'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-ametist-800/50'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-400" />
              Análise de Dano
            </button>

            <button
              onClick={() => setActiveTab('weapons')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'weapons'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-ametist-800/50'
              }`}
            >
              <Swords className="w-4 h-4 text-amber-400" />
              Comparador
            </button>

            <button
              onClick={() => setActiveTab('er')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'er'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-ametist-800/50'
              }`}
            >
              <Zap className="w-4 h-4 text-purple-400" />
              Recarga ER
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'generator'
                  ? 'bg-gradient-to-r from-ametist-600 to-ametist-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-ametist-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Card
            </button>
          </nav>

          {/* Right Actions: SSO Profile & Cloud Status */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-ametist-900/80 hover:bg-ametist-800/80 border border-ametist-700/50 transition-all text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-ametist-600 to-purple-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-white leading-tight">{user.nome}</p>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>SSO Ametist</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-[#0c0e1a] border border-ametist-700/60 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn">
                      <div className="px-3 py-2 border-b border-white/5 mb-1">
                        <p className="text-xs font-bold text-white truncate">{user.nome}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>
                      
                      <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Status Nuvem</span>
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <Cloud className="w-3 h-3" />
                          Sincronizado
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setActiveTab('login');
                        }}
                        className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title="Visualizar detalhes da conta e nuvem"
                      >
                        <User className="w-3.5 h-3.5 text-ametist-400" />
                        Minha Conta & Nuvem
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          const targetUrl = await buildAmetistSsoUrl();
                          window.open(targetUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Ir para o Ametist TC Hub conectado na mesma conta"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                        Ir para o Ametist (SSO)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair da Conta
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer hover:scale-105 ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-ametist-500 via-purple-500 to-amber-400 ring-2 ring-amber-400 shadow-lg shadow-ametist-600/40'
                    : 'bg-gradient-to-r from-ametist-600 via-purple-600 to-amber-500 hover:from-ametist-500 hover:to-amber-400 shadow-md shadow-ametist-600/25'
                }`}
                title="Conectar com SSO Ametist & Astralys"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Entrar / SSO</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

