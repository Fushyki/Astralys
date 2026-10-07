import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  Flame, 
  Swords, 
  FolderGit2, 
  BarChart3, 
  ChevronDown, 
  Cloud, 
  LogOut, 
  ExternalLink, 
  User, 
  Menu, 
  X,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildAmetistSsoUrl } from '../services/auth';

export type ActiveTab = 'landing' | 'dashboards' | 'vault' | 'generator' | 'weapons' | 'damage' | 'er' | 'login' | 'profile';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

interface NavItemConfig {
  id: ActiveTab;
  label: string;
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  activeBg: string;
  activeBorder: string;
  badge?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab
}) => {
  const { user, isAuthenticated, logout, syncStatus } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Ergonomic order aligned with theorycrafting workflow:
  // Overview (Dashboards) -> Calculations (Dano -> ER -> Armas) -> Publishing (Card) -> Storage (Vault)
  const navItems: NavItemConfig[] = [
    {
      id: 'dashboards',
      label: 'Dashboards',
      tooltip: 'Painel Geral: DPS, DPR, gráficos de contribuição e linha do tempo',
      icon: BarChart3,
      iconColor: 'text-cyan-400',
      activeBg: 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-600/25',
      activeBorder: 'border-cyan-400/40'
    },
    {
      id: 'damage',
      label: 'Análise de Dano',
      tooltip: 'Cálculo e Rotações: Golpe a golpe, edição de status e importação .xlsx',
      icon: Flame,
      iconColor: 'text-rose-400',
      activeBg: 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-600/25',
      activeBorder: 'border-rose-400/40'
    },
    {
      id: 'er',
      label: 'Recarga ER',
      tooltip: 'Calculadora de Partículas & Favonius: Metas de ER% para toda a equipe',
      icon: Zap,
      iconColor: 'text-purple-400',
      activeBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25',
      activeBorder: 'border-purple-400/40'
    },
    {
      id: 'weapons',
      label: 'Comparador',
      tooltip: 'Showdown de Armas: Comparação percentual e refinamentos vs Baseline',
      icon: Swords,
      iconColor: 'text-amber-400',
      activeBg: 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-600/25',
      activeBorder: 'border-amber-400/40'
    },
    {
      id: 'generator',
      label: 'Card Infográfico',
      tooltip: 'Gerador Visual: Cards de alta resolução para compartilhar e salvar',
      icon: Sparkles,
      iconColor: 'text-emerald-400',
      activeBg: 'bg-gradient-to-r from-ametist-600 via-purple-600 to-emerald-600 text-white shadow-md shadow-purple-600/25',
      activeBorder: 'border-emerald-400/40'
    },
    {
      id: 'vault',
      label: 'Vault',
      tooltip: 'Cofre de Equipes: Projetos salvos, histórico, backups e sincronização',
      icon: FolderGit2,
      iconColor: 'text-indigo-300',
      activeBg: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25',
      activeBorder: 'border-indigo-400/40'
    }
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-ametist-950/85 border-b border-ametist-700/40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Branding (Hub trigger) */}
          <button 
            type="button"
            className="flex items-center gap-3 cursor-pointer group text-left focus:outline-none flex-shrink-0"
            onClick={() => handleSelectTab('landing')}
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
                <span className="text-[10px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-ametist-800/90 text-ametist-300 border border-ametist-600/40">
                  2.5
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium group-hover:text-ametist-300 transition-colors">
                Theorycraft & Rotações
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links (UX Optimized Flow) */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#0a0d18]/90 p-1.5 rounded-2xl border border-ametist-800/60 shadow-inner">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  title={item.tooltip}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? `${item.activeBg} ring-1 ${item.activeBorder}`
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform duration-200 ${isActive ? 'text-white scale-110' : item.iconColor}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-white animate-ping ml-0.5" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: User Account & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Account / SSO */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-ametist-900/80 hover:bg-ametist-800/80 border transition-all text-left cursor-pointer ${
                    activeTab === 'profile'
                      ? 'border-ametist-400 ring-2 ring-ametist-500/30'
                      : 'border-ametist-700/50 hover:border-ametist-600'
                  }`}
                  title="Abrir menu da conta e banco de dados"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-ametist-600 to-purple-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-white leading-tight max-w-[120px] truncate">{user.nome}</p>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{syncStatus === 'syncing' ? 'Sincronizando...' : 'Nuvem Conectada'}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-[#0a0d17] border border-ametist-700/60 rounded-2xl shadow-2xl p-2.5 z-50 animate-fade-in backdrop-blur-2xl">
                      <div className="px-3 py-2.5 border-b border-white/5 mb-1.5 bg-white/[0.02] rounded-xl">
                        <p className="text-xs font-bold text-white truncate">{user.nome}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-1">
                          <Cloud className="w-3 h-3 text-emerald-400" />
                          <span>PostgreSQL & Nuvem Pronta</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleSelectTab('profile');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                          activeTab === 'profile'
                            ? 'bg-ametist-600/30 text-ametist-200 border border-ametist-500/30'
                            : 'text-slate-200 hover:text-white hover:bg-white/5'
                        }`}
                        title="Visualizar dados da conta e download/upload de databases"
                      >
                        <span className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-ametist-400" />
                          <span>Meu Perfil & Database</span>
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ametist-500/20 text-ametist-300">
                          JSON
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          const targetUrl = await buildAmetistSsoUrl();
                          window.open(targetUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Ir para o Ametist TC Hub conectado na mesma conta"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                        <span>Ir para o Ametist (SSO)</span>
                      </button>

                      <div className="border-t border-white/5 my-1.5" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectTab('login')}
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

            {/* Mobile Hamburger Toggle (UX Crucial for Tablet & Mobile) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-ametist-900/80 hover:bg-ametist-800 border border-ametist-700/50 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Menu de Navegação"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation (lg:hidden) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-ametist-800/80 bg-[#090c16]/98 backdrop-blur-2xl px-4 py-4 space-y-2 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-ametist-400" />
              Módulos Astralys
            </span>
            <span>Meta 6.7</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? `${item.activeBg} ring-1 ${item.activeBorder}`
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-slate-200'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-black/20 text-white' : 'bg-white/5 ' + item.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{item.label}</p>
                    <p className={`text-[10px] mt-0.5 leading-snug line-clamp-1 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                      {item.tooltip}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Profile Row on Mobile if Authenticated */}
          {isAuthenticated && user && (
            <div className="pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => handleSelectTab('profile')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-ametist-600/30 border border-ametist-500/40 text-white'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-ametist-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">{user.nome} (Meu Perfil)</p>
                    <p className="text-[10px] text-emerald-400">Gerenciar Banco de Dados</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-ametist-500/20 text-ametist-300">
                  JSON
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

