import React, { useState, useRef } from 'react';
import { 
  User, 
  Download, 
  Upload, 
  Cloud, 
  FolderGit2, 
  Swords, 
  Trash2, 
  ExternalLink, 
  LogOut, 
  Check, 
  AlertCircle, 
  FileJson, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  ArrowRight,
  Database,
  BarChart3,
  Camera,
  Flame,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildAmetistSsoUrl } from '../services/auth';
import { CalculationProject } from '../types/projectVault';
import { CharacterWeaponComparison } from '../types/weaponComparison';
import { saveCloudProject, deleteCloudProject } from '../services/projectApi';
import { ActiveTab } from './Header';
import { DatabaseStorageView } from './DatabaseStorageView';

export interface AstralysDatabasePackage {
  format: 'astralys-database';
  version: string;
  exportedAt: string;
  sourceUser: {
    id?: string;
    email?: string;
    nome?: string;
  };
  data: {
    projects: CalculationProject[];
    weaponComparisons: Record<string, CharacterWeaponComparison>;
  };
}

interface ProfilePageProps {
  projects: CalculationProject[];
  setProjects: React.Dispatch<React.SetStateAction<CalculationProject[]>>;
  weaponComparisons: Record<string, CharacterWeaponComparison>;
  setWeaponComparisons: React.Dispatch<React.SetStateAction<Record<string, CharacterWeaponComparison>>>;
  onNavigate: (tab: ActiveTab) => void;
  onSelectProject: (project: CalculationProject) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  projects,
  setProjects,
  weaponComparisons,
  setWeaponComparisons,
  onNavigate,
  onSelectProject
}) => {
  const { user, isAuthenticated, logout, syncStatus } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'database' | 'projects' | 'weapons'>('database');
  
  // Estados de Notificação
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de Upload de Database
  const [pendingImport, setPendingImport] = useState<AstralysDatabasePackage | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar customizado no localStorage
  const [customAvatar, setCustomAvatar] = useState<string | null>(() => {
    return user?.avatar_url || (user?.id ? localStorage.getItem(`astralys_avatar_${user.id}`) : null);
  });
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // Limpeza de mensagem após 4 segundos
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  // 1. Exportar / Download Completo da Database
  const handleDownloadDatabase = () => {
    try {
      const dbPackage: AstralysDatabasePackage = {
        format: 'astralys-database',
        version: '2.5.0',
        exportedAt: new Date().toISOString(),
        sourceUser: {
          id: user?.id,
          email: user?.email,
          nome: user?.nome
        },
        data: {
          projects,
          weaponComparisons
        }
      };

      const cleanEmail = (user?.email || 'conta').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `astralys-db-${cleanEmail}-${dateStr}.json`;

      const blob = new Blob([JSON.stringify(dbPackage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showFeedback('success', `Database completa exportada com sucesso! (${projects.length} equipes salvas)`);
    } catch (err: any) {
      showFeedback('error', 'Falha ao gerar download da database: ' + (err.message || 'Erro desconhecido'));
    }
  };

  // 2. Leitura do Arquivo de Database para Pré-Visualização
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validação de formato da database
        if (!parsed || (!parsed.data && !Array.isArray(parsed))) {
          throw new Error('O arquivo selecionado não é um arquivo JSON válido do Astralys.');
        }

        let normalizedPackage: AstralysDatabasePackage;

        // Suporte para pacote novo estruturado ou array legado de projetos
        if (parsed.format === 'astralys-database' && parsed.data) {
          normalizedPackage = parsed;
        } else if (Array.isArray(parsed)) {
          normalizedPackage = {
            format: 'astralys-database',
            version: 'legacy',
            exportedAt: new Date().toISOString(),
            sourceUser: { email: 'Arquivo Externo' },
            data: {
              projects: parsed,
              weaponComparisons: {}
            }
          };
        } else if (parsed.projects) {
          normalizedPackage = {
            format: 'astralys-database',
            version: '2.0',
            exportedAt: new Date().toISOString(),
            sourceUser: parsed.sourceUser || { email: 'Outra Conta' },
            data: {
              projects: parsed.projects,
              weaponComparisons: parsed.weaponComparisons || {}
            }
          };
        } else {
          throw new Error('Estrutura de dados não reconhecida.');
        }

        setPendingImport(normalizedPackage);
      } catch (err: any) {
        showFeedback('error', 'Arquivo inválido: ' + (err.message || 'Erro ao ler arquivo.'));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 3. Execução da Importação (Mesclar ou Substituir)
  const handleConfirmImport = async () => {
    if (!pendingImport) return;
    setIsImporting(true);

    try {
      const incomingProjects = pendingImport.data.projects || [];
      const incomingWeapons = pendingImport.data.weaponComparisons || {};

      let finalProjects: CalculationProject[] = [];

      if (importMode === 'overwrite') {
        finalProjects = incomingProjects;
        setProjects(finalProjects);
        setWeaponComparisons(incomingWeapons);
      } else {
        // Merge: evita duplicatas de ID atribuindo novos IDs únicos para projetos importados
        const existingIds = new Set(projects.map(p => p.id));
        const mergedProjects = [...projects];

        incomingProjects.forEach(proj => {
          if (existingIds.has(proj.id)) {
            mergedProjects.push({
              ...proj,
              id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: `${proj.title} (Importado)`
            });
          } else {
            mergedProjects.push(proj);
          }
        });

        finalProjects = mergedProjects;
        setProjects(finalProjects);
        setWeaponComparisons(prev => ({ ...prev, ...incomingWeapons }));
      }

      // Sincroniza projetos importados com a nuvem caso esteja logado
      if (isAuthenticated) {
        for (const proj of incomingProjects) {
          try {
            await saveCloudProject(proj);
          } catch (e) {
            console.warn('Falha ao persistir projeto importado na nuvem:', e);
          }
        }
      }

      showFeedback(
        'success', 
        `Database importada com sucesso (${incomingProjects.length} equipes processadas em modo ${importMode === 'merge' ? 'Mesclar' : 'Substituir'})!`
      );
      setPendingImport(null);
    } catch (err: any) {
      showFeedback('error', 'Erro durante a importação: ' + (err.message || 'Falha ao processar dados.'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenAmetistSso = async () => {
    try {
      const url = await buildAmetistSsoUrl();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.open('https://ametist-tier-maker.vercel.app', '_blank', 'noopener,noreferrer');
    }
  };

  const handleSaveAvatarUrl = (url: string) => {
    if (user?.id) {
      localStorage.setItem(`astralys_avatar_${user.id}`, url);
    }
    setCustomAvatar(url);
    setIsEditingAvatar(false);
    setAvatarUrlInput('');
    showFeedback('success', 'Foto de perfil atualizada!');
  };

  // Se o usuário não estiver autenticado, exibe tela para entrar
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-ametist-600/10 border border-ametist-500/30 flex items-center justify-center text-ametist-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Acesse sua Conta</h2>
        <p className="text-xs text-slate-400">
          Conecte-se com sua conta unificada para gerenciar sua database, importar projetos e sincronizar na nuvem.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-ametist-600 via-purple-600 to-amber-500 hover:from-ametist-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-ametist-600/30 transition-all cursor-pointer"
        >
          Fazer Login com SSO Ametist
        </button>
      </div>
    );
  }

  // Métricas rápidas dos dados da conta no site
  const totalEquipes = projects.length;
  const totalArmasComparadas = Object.keys(weaponComparisons).length;
  const dpsMedio = totalEquipes > 0 
    ? Math.round(projects.reduce((acc, p) => acc + (p.dps || 0), 0) / totalEquipes) 
    : 0;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6 animate-fadeIn">
      
      {/* 1. CABEÇALHO DO PERFIL (Idêntico ao padrão Ametist, com acabamento refinado) */}
      <div className="crystal-panel rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0c0e1c] via-[#090b14] to-[#0c0e1c] border border-ametist-600/40 shadow-2xl relative overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-ametist-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          
          {/* Avatar e Informações do Usuário */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            
            {/* Foto de Perfil Interativa */}
            <div className="relative group">
              <div 
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-ametist-500 shadow-xl shadow-ametist-600/25 cursor-pointer relative transition-transform duration-200 group-hover:scale-105"
                title="Clique para alterar foto de perfil"
              >
                {customAvatar ? (
                  <img src={customAvatar} alt={user.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-ametist-600 via-purple-600 to-amber-500 text-white font-black text-3xl flex items-center justify-center">
                    {user.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Badge da Câmera no Hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1 font-semibold">
                  <Camera className="w-4 h-4 text-ametist-300" />
                  <span>Foto</span>
                </div>
              </div>
            </div>

            {/* Dados do Usuário */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">{user.nome}</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-ametist-900/90 text-ametist-300 border border-ametist-500/40">
                  Conta Unificada
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SSO Ativo
                </span>
              </div>

              <p className="text-xs text-slate-300 font-mono">{user.email}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Cloud className="w-3.5 h-3.5" />
                  Nuvem PostgreSQL: Sincronizado
                </span>
                <span>•</span>
                <span className="font-mono text-slate-500">ID: {user.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Ações Rápidas do Topo */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenAmetistSso}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer hover:scale-105"
              title="Acessar o Ametist TC Hub conectado nesta mesma conta"
            >
              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
              <span>Acessar Ametist (SSO)</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Modal Inline para Alterar Foto de Perfil */}
        {isEditingAvatar && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2 animate-fadeIn">
            <input
              type="url"
              value={avatarUrlInput}
              onChange={(e) => setAvatarUrlInput(e.target.value)}
              placeholder="Cole a URL da sua foto (ex: https://.../avatar.png)"
              className="flex-1 w-full px-3.5 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-ametist-500"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSaveAvatarUrl(avatarUrlInput)}
                className="flex-1 sm:flex-none px-4 py-2 bg-ametist-600 hover:bg-ametist-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Salvar URL
              </button>
              <button
                type="button"
                onClick={() => setIsEditingAvatar(false)}
                className="px-3 py-2 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FEEDBACK STATUS BANNER */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium animate-fadeIn ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. CARDS RESUMO DOS DADOS DA CONTA NO SITE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#090e17] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Equipes no Vault</span>
            <FolderGit2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{totalEquipes}</div>
          <p className="text-[10px] text-slate-500">Composições e rotações salvas</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090e17] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Comparações de Armas</span>
            <Swords className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{totalArmasComparadas}</div>
          <p className="text-[10px] text-slate-500">Personagens com testes R1 a R5</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090e17] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>DPR Médio</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {dpsMedio > 0 ? `${Math.round(dpsMedio / 1000)}k` : '0'}
          </div>
          <p className="text-[10px] text-slate-500">Dano médio das suas rotações</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090e17] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Nuvem PostgreSQL</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">Ativa</div>
          <p className="text-[10px] text-slate-500">Backup automático habilitado</p>
        </div>
      </div>

      {/* 3. NAVEGAÇÃO DE ABAS INTERNAS (SEM CONFIG DE VISUAL) */}
      <div className="p-1 bg-[#090e17] rounded-xl border border-slate-800 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'database'
              ? 'bg-gradient-to-r from-ametist-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Bases de Dados & Storage (Excel)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'projects'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Equipes Salvas no Site ({totalEquipes})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('weapons')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'weapons'
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Comparações de Armas ({totalArmasComparadas})</span>
        </button>
      </div>

      {/* 4. CONTEÚDO DAS ABAS */}

      {/* ABA 1: MULTI-DATABASE & STORAGE MANAGER (ESTILO GENSHIN OPTIMIZER COM EXCEL) */}
      {activeSubTab === 'database' && (
        <DatabaseStorageView
          currentProjects={projects}
          onProjectsChange={setProjects}
          currentWeapons={weaponComparisons}
          onWeaponsChange={setWeaponComparisons}
        />
      )}

      {/* ABA 2: EQUIPES SALVAS NA CONTA (DADOS DO SITE) */}
      {activeSubTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Equipes Armazenadas na Conta</h3>
            <button
              type="button"
              onClick={() => onNavigate('dashboards')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <span>Ver nos Dashboards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#090e17] border border-slate-800 text-center space-y-2">
              <FolderGit2 className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs text-slate-400">Nenhuma equipe personalizada salva ainda nesta conta.</p>
              <button
                type="button"
                onClick={() => onNavigate('damage')}
                className="mt-2 px-4 py-2 rounded-xl bg-ametist-600 text-white text-xs font-bold"
              >
                Criar Minha Primeira Equipe
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-4 rounded-2xl bg-[#090e17] border border-slate-800 hover:border-slate-700 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-slate-800">
                        {proj.carryName || 'Personagem'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white line-clamp-1">{proj.title}</h4>
                    
                    <div className="flex items-center gap-3 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-slate-500 block">DPS</span>
                        <span className="font-bold text-white font-mono">{Math.round((proj.dps || 0) / 1000)}k</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">DPR</span>
                        <span className="font-bold text-slate-300 font-mono">{((proj.totalDpr || 0) / 1000000).toFixed(2)}M</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Rotação</span>
                        <span className="font-bold text-amber-300 font-mono">{proj.rotationDuration || 20}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProject(proj);
                        onNavigate('dashboards');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                    >
                      Abrir no Dashboard →
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Excluir a equipe "${proj.title}"?`)) {
                          setProjects(prev => prev.filter(p => p.id !== proj.id));
                          if (isAuthenticated) {
                            deleteCloudProject(proj.id).catch(console.warn);
                          }
                          showFeedback('success', 'Equipe removida.');
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Excluir equipe"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: COMPARAÇÕES DE ARMAS SALVAS */}
      {activeSubTab === 'weapons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Comparações de Armas Registradas</h3>
            <button
              type="button"
              onClick={() => onNavigate('weapons')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              <span>Abrir Comparador</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {totalArmasComparadas === 0 ? (
            <div className="p-8 rounded-3xl bg-[#090e17] border border-slate-800 text-center space-y-2">
              <Swords className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs text-slate-400">Nenhum comparador de armas salvo nesta conta.</p>
              <button
                type="button"
                onClick={() => onNavigate('weapons')}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
              >
                Abrir Comparador de Armas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {Object.entries(weaponComparisons).map(([charName, comp]) => (
                <div key={charName} className="p-4 rounded-2xl bg-[#090e17] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{charName}</span>
                    <span className="text-[10px] text-amber-300 font-mono">
                      {comp.weapons?.length || 0} armas testadas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Baseline: {comp.weapons?.find(w => w.isBaseline)?.name || 'Arma Base'} (100%)
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('weapons')}
                    className="pt-2 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer block"
                  >
                    Ver Gráficos no Comparador →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
