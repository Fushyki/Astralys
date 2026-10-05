import React, { useState } from 'react';
import { 
  FolderGit2, 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Trash2, 
  Copy, 
  Play, 
  Flame, 
  RotateCcw,
  ExternalLink,
  ArrowRight,
  Check,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { CalculationProject } from '../types/projectVault';
import { CharacterAvatar } from './CharacterAvatar';
import { useAuth } from '../context/AuthContext';
import { syncLocalProjectsWithCloud } from '../services/projectApi';

interface ProjectVaultProps {
  projects: CalculationProject[];
  activeProjectId?: string | null;
  onSelectProject: (project: CalculationProject) => void;
  onOpenInDamageAnalyzer?: (project: CalculationProject) => void;
  onSaveProject: (project: CalculationProject) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (project: CalculationProject) => void;
  onRestoreDefaults: () => void;
}

export const ProjectVault: React.FC<ProjectVaultProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenInDamageAnalyzer,
  onSaveProject,
  onDeleteProject,
  onDuplicateProject,
  onRestoreDefaults
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleManualSync = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setIsSyncing(true);
    try {
      const synced = await syncLocalProjectsWithCloud(projects);
      if (synced && synced.length > 0) {
        synced.forEach(p => onSaveProject(p));
        showToast('Planilhas sincronizadas com o banco de dados MySQL!');
      }
    } catch {
      showToast('Falha ao sincronizar com o banco.');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    return (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.carryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.teamNames.some(n => n.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.comboNotation && p.comboNotation.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Format currency/numbers in Brazilian standard (e.g. 4.157.702,28)
  const formatNum = (val: number | undefined): string => {
    if (val === undefined || isNaN(val)) return '0,00';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format simple integers
  const formatInt = (val: number | undefined): string => {
    if (val === undefined || isNaN(val)) return '0';
    return Math.round(val).toLocaleString('pt-BR');
  };

  // Helper to get element theme colors based on carry (refined, low strain, cyber dark tones)
  const getTeamCardTheme = (carryName: string) => {
    const lower = carryName.toLowerCase();
    if (lower.includes('mavuika') || lower.includes('bennett') || lower.includes('pyro')) {
      return {
        cardBorder: 'border-amber-900/30 hover:border-amber-500/40',
        headerBg: 'bg-gradient-to-r from-slate-950 via-amber-950/60 to-slate-950 border-b border-amber-500/25 text-amber-100',
        subHeaderDark: 'bg-[#0a0805] text-amber-200/70 border-b border-slate-800/80',
        colHeaderDark: 'bg-slate-950 text-slate-400 border-b border-slate-800',
        rowAltBg: 'bg-slate-950/40',
        footerDark: 'bg-[#080604] text-slate-300 border-t border-amber-900/30',
        dpsColor: 'text-amber-300'
      };
    }
    if (lower.includes('flins') || lower.includes('sandrone') || lower.includes('columbina') || lower.includes('electro') || lower.includes('cryo')) {
      return {
        cardBorder: 'border-purple-900/30 hover:border-purple-500/40',
        headerBg: 'bg-gradient-to-r from-slate-950 via-purple-950/60 to-slate-950 border-b border-purple-500/25 text-purple-100',
        subHeaderDark: 'bg-[#090710] text-purple-200/70 border-b border-slate-800/80',
        colHeaderDark: 'bg-slate-950 text-slate-400 border-b border-slate-800',
        rowAltBg: 'bg-slate-950/40',
        footerDark: 'bg-[#06050b] text-slate-300 border-t border-purple-900/30',
        dpsColor: 'text-purple-300'
      };
    }
    // Default blue/slate
    return {
      cardBorder: 'border-slate-800 hover:border-slate-700',
      headerBg: 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-700/40 text-slate-100',
      subHeaderDark: 'bg-slate-950 text-slate-400 border-b border-slate-800/80',
      colHeaderDark: 'bg-slate-950 text-slate-400 border-b border-slate-800',
      rowAltBg: 'bg-slate-950/40',
      footerDark: 'bg-slate-950 text-slate-300 border-t border-slate-800',
      dpsColor: 'text-cyan-300'
    };
  };

  // Export JSON backup
  const handleExportAllJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `astralys_vault_calcsheets_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Backup do Vault exportado com sucesso!');
    } catch {
      alert('Erro ao exportar backup.');
    }
  };

  // Import JSON backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
          parsed.forEach(proj => onSaveProject(proj));
          showToast(`${parsed.length} planilhas importadas com sucesso!`);
        } else {
          alert('Arquivo JSON inválido.');
        }
      } catch {
        alert('Erro ao processar arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-emerald-500/50 text-emerald-300 shadow-2xl text-xs font-mono font-bold animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar (Direct, No Fluff) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#090e17] border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-600 to-purple-600 flex items-center justify-center text-white shadow-md">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white font-cinzel tracking-wider">
                ASTRALYS CALCSHEETS VAULT
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/30">
                {projects.length} Planilhas
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Visualização fiel da página 1 de cálculos de equipes e rotações
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar equipe, carry..."
              className="w-48 pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all">
            <Upload className="w-3 h-3 text-cyan-400" />
            <span>Importar</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleExportAllJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all"
            title="Exportar todos os projetos em arquivo JSON"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>Backup</span>
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
              title="Sincronizar todas as planilhas com o banco de dados MySQL"
            >
              <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce text-amber-300' : 'text-emerald-400'}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'MySQL Nuvem'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ametist-950/70 hover:bg-ametist-900/80 border border-ametist-600/40 text-ametist-300 hover:text-white text-xs font-semibold cursor-pointer transition-all"
              title="Entrar com SSO para salvar no banco de dados na nuvem"
            >
              <CloudOff className="w-3.5 h-3.5 text-ametist-400" />
              <span>Salvar na Nuvem</span>
            </button>
          )}

          <button
            onClick={() => {
              if (confirm('Restaurar as planilhas padrão da página 1 (Mavuika Iansan, Mavuika Xilonen, Flins Premium)?')) {
                onRestoreDefaults();
                showToast('Planilhas restauradas com sucesso!');
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-all"
            title="Restaurar planilhas originais da captura"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Grid of Calcsheet Cards (Directly Matching the Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((proj) => {
          const calc = proj.calculation;
          const theme = getTeamCardTheme(proj.carryName);
          const durationStr = proj.rotationDuration ? proj.rotationDuration.toString().replace('.', ',') : '20,0';

          return (
            <div
              key={proj.id}
              className={`rounded-2xl border-2 ${theme.cardBorder || 'border-slate-800'} overflow-hidden shadow-2xl bg-[#0b0f19] flex flex-col justify-between transition-all duration-200`}
            >
              {/* CALCSHEET SUMMARY BLOCK */}
              <div>
                {/* 1. TOP TITLE HEADER */}
                <div className={`${theme.headerBg} px-4 py-2.5 text-center`}>
                  <h3 className="font-extrabold text-base sm:text-lg tracking-wide uppercase font-sans drop-shadow-sm">
                    {proj.title}
                  </h3>
                </div>

                {/* 2. SUBHEADER: COMBO ROTATION NOTATION */}
                <div className={`${theme.subHeaderDark} px-4 py-1.5 text-center font-mono text-xs font-bold truncate`}>
                  {proj.comboNotation || calc.comboNotation || 'Rotação Padrão'}
                </div>

                {/* 3. CALCSHEET TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono border-collapse">
                    <thead>
                      <tr className={`${theme.colHeaderDark} text-[11px] uppercase tracking-wider text-left border-b border-black/60`}>
                        <th className="py-1.5 px-3 font-black">Character</th>
                        <th className="py-1.5 px-3 font-black text-right">Damage</th>
                        <th className="py-1.5 px-3 font-black text-right">Percentage</th>
                        <th className="py-1.5 px-3 font-black">Weapon</th>
                        <th className="py-1.5 px-3 font-black">Artefact Set</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {calc.characters.map((char, cIdx) => {
                        const isAlt = cIdx % 2 === 1;

                        return (
                          <tr 
                            key={cIdx}
                            className={`transition-colors hover:bg-slate-800/40 ${isAlt ? theme.rowAltBg : 'bg-[#0e1320]'}`}
                          >
                            {/* Character Name + Mini Avatar */}
                            <td className="py-1.5 px-3 font-bold text-slate-100 flex items-center gap-2 whitespace-nowrap">
                              {char.name !== 'Lunar' && (
                                <CharacterAvatar name={char.name} element={char.element as any} size="xs" showBorder={false} />
                              )}
                              <span>{char.name}</span>
                            </td>

                            {/* Damage (Formatted 4.157.702,28) */}
                            <td className="py-1.5 px-3 text-right font-black text-slate-200 whitespace-nowrap">
                              {formatNum(char.totalDamage)}
                            </td>

                            {/* Percentage (94,64) */}
                            <td className={`py-1.5 px-3 text-right font-bold ${theme.dpsColor || 'text-amber-300'} whitespace-nowrap`}>
                              {char.damagePercentage.toFixed(2).replace('.', ',')}
                            </td>

                            {/* Weapon */}
                            <td className="py-1.5 px-3 text-slate-300 truncate max-w-[130px]" title={char.weapon}>
                              {char.weapon || '-'}
                            </td>

                            {/* Artefact Set */}
                            <td className="py-1.5 px-3 text-slate-400 truncate max-w-[130px]" title={char.artifactSet}>
                              {char.artifactSet || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 4. FOOTER BLOCK: DPR & DPS */}
                <div className={`${theme.footerDark} p-3 font-mono text-xs flex flex-col justify-center space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-slate-400">DPR</span>
                    <span className="font-black text-sm text-slate-100">{formatNum(proj.totalDpr)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-slate-400">DPS({durationStr})</span>
                    <span className={`font-black text-sm ${theme.dpsColor || 'text-amber-300'}`}>{formatInt(proj.dps)}</span>
                  </div>
                </div>
              </div>

              {/* CARD ACTIONS TOOLBAR (Sleek & Discreet) */}
              <div className="p-2.5 bg-[#080c14] border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onDuplicateProject(proj)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Duplicar esta tabela"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir o cálculo "${proj.title}"?`)) {
                        onDeleteProject(proj.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenInDamageAnalyzer && (
                    <button
                      onClick={() => onOpenInDamageAnalyzer(proj)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-white border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Flame className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectProject(proj)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    <span>Abrir nos Dashboards</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
