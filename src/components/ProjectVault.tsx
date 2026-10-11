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
import { ASTRALYS_ELEMENT_COLORS } from '../data/characters';

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
        showToast('Planilhas sincronizadas com a Nuvem Astralys com sucesso!');
      }
    } catch {
      showToast('Falha ao sincronizar com a nuvem.');
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
        headerBg: 'bg-slate-900    border-b border-amber-500/25 text-amber-100',
        subHeaderDark: 'bg-slate-900 text-amber-200/70 border-b border-slate-800/80',
        colHeaderDark: 'bg-slate-950 text-slate-400 border-b border-slate-800',
        rowAltBg: 'bg-slate-950/40',
        footerDark: 'bg-slate-900 text-slate-300 border-t border-amber-900/30',
        dpsColor: 'text-amber-300'
      };
    }
    if (lower.includes('flins') || lower.includes('sandrone') || lower.includes('columbina') || lower.includes('electro') || lower.includes('cryo')) {
      return {
        cardBorder: 'border-purple-900/30 hover:border-purple-500/40',
        headerBg: 'bg-slate-900    border-b border-purple-500/25 text-purple-100',
        subHeaderDark: 'bg-slate-900 text-purple-200/70 border-b border-slate-800/80',
        colHeaderDark: 'bg-slate-950 text-slate-400 border-b border-slate-800',
        rowAltBg: 'bg-slate-950/40',
        footerDark: 'bg-slate-900 text-slate-300 border-t border-purple-900/30',
        dpsColor: 'text-purple-300'
      };
    }
    // Default blue/slate
    return {
      cardBorder: 'border-slate-800 hover:border-slate-700',
      headerBg: 'bg-slate-900    border-b border-slate-700/40 text-slate-100',
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

  const elemHex = (el?: string) => (ASTRALYS_ELEMENT_COLORS as any)[el || 'None']?.hex || '#8f8a7d';
  const ghostBtn =
    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 text-sm cursor-pointer transition-colors';

  return (
    <div className="space-y-8 select-none">

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-semibold text-slate-50 font-cinzel">Vault</h1>
          <p className="text-slate-400 mt-1">
            {projects.length} {projects.length === 1 ? 'planilha salva' : 'planilhas salvas'}
            {isAuthenticated ? ' · sincronizado com a nuvem' : ' · só neste navegador'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar equipe ou carry"
              className="w-56 pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-purple-400"
            />
          </div>

          <label className={ghostBtn}>
            <Upload className="w-4 h-4" />
            Importar
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button onClick={handleExportAllJson} className={ghostBtn} title="Baixar todas as planilhas em um arquivo JSON">
            <Download className="w-4 h-4" />
            Backup
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`${ghostBtn} disabled:opacity-50`}
              title="Sincronizar todas as planilhas com a nuvem"
            >
              <Cloud className="w-4 h-4 text-emerald-400" />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="px-3.5 py-1.5 rounded-lg bg-purple-400 hover:bg-purple-300 text-slate-950 text-sm font-semibold cursor-pointer transition-colors"
              title="Entre para salvar na nuvem"
            >
              Salvar na nuvem
            </button>
          )}

          <button
            onClick={() => {
              if (confirm('Restaurar as planilhas padrão (Mavuika Iansan, Mavuika Xilonen, Flins Premium)?')) {
                onRestoreDefaults();
                showToast('Planilhas restauradas com sucesso!');
              }
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 cursor-pointer transition-colors"
            title="Restaurar planilhas padrão"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filteredProjects.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold text-slate-50 font-cinzel">Nada por aqui</h2>
          <p className="text-slate-400 mt-2">
            {searchTerm ? 'Nenhuma planilha combina com a busca.' : 'Salve um cálculo pela Análise de Dano para ele aparecer aqui.'}
          </p>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredProjects.map((proj) => {
          const calc = proj.calculation;
          const durationStr = proj.rotationDuration ? proj.rotationDuration.toString().replace('.', ',') : '20';

          return (
            <article
              key={proj.id}
              className="rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col"
            >
              <div className="p-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-semibold text-slate-50 font-cinzel leading-snug">{proj.title}</h3>
                  {isAuthenticated && (
                    <span title="Salvo na nuvem" className="flex-shrink-0 mt-1.5"><Cloud className="w-4 h-4 text-emerald-400" /></span>
                  )}
                </div>
                <p className="text-sm text-slate-500 font-mono truncate mt-1" title={proj.comboNotation || calc.comboNotation}>
                  {proj.comboNotation || calc.comboNotation || 'Rotação padrão'}
                </p>
              </div>

              {/* Divisão do dano */}
              <div className="px-5">
                <div className="flex h-2.5 rounded-sm overflow-hidden gap-0.5">
                  {calc.characters.filter(c => c.damagePercentage > 0).map((c, i) => (
                    <div
                      key={i}
                      style={{ width: `${c.damagePercentage}%`, backgroundColor: elemHex(c.element), minWidth: 3 }}
                      title={`${c.name}: ${c.damagePercentage.toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Equipe */}
              <ul className="px-5 py-3 space-y-2">
                {calc.characters.map((char, cIdx) => (
                  <li key={cIdx} className="flex items-center gap-3 text-sm">
                    {char.name !== 'Lunar' ? (
                      <CharacterAvatar name={char.name} element={char.element as any} size="xs" showBorder={false} showElementDot={false} />
                    ) : (
                      <span className="w-6 h-6" />
                    )}
                    <span className="font-medium text-slate-100 w-28 truncate">{char.name}</span>
                    <span className="text-slate-500 truncate flex-1" title={`${char.weapon} · ${char.artifactSet}`}>
                      {char.weapon || '—'}
                    </span>
                    <span className="font-mono text-slate-200 w-14 text-right">{char.damagePercentage.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>

              {/* Métricas */}
              <div className="mt-auto flex items-end justify-between px-5 py-4 border-t border-slate-800">
                <div>
                  <p className="text-xs text-slate-500">DPS ({durationStr}s)</p>
                  <p className="font-mono text-2xl font-semibold text-purple-300 leading-none mt-1">{formatInt(proj.dps)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Dano por rotação</p>
                  <p className="font-mono text-base text-slate-200 mt-1">{formatInt(proj.totalDpr)}</p>
                </div>
              </div>

              {/* Ações */}
              <div className="px-3 py-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center">
                  <button
                    onClick={() => onDuplicateProject(proj)}
                    className="p-2 rounded-md text-slate-500 hover:text-slate-100 hover:bg-slate-800 cursor-pointer transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSaveProject(proj);
                        showToast(`"${proj.title}" sincronizado na nuvem!`);
                      }}
                      className="p-2 rounded-md text-slate-500 hover:text-emerald-300 hover:bg-slate-800 cursor-pointer transition-colors"
                      title="Sincronizar esta planilha"
                    >
                      <Cloud className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openAuthModal}
                      className="p-2 rounded-md text-slate-500 hover:text-slate-100 hover:bg-slate-800 cursor-pointer transition-colors"
                      title="Entre para salvar na nuvem"
                    >
                      <CloudOff className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Excluir o cálculo "${proj.title}"?`)) {
                        onDeleteProject(proj.id);
                      }
                    }}
                    className="p-2 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {onOpenInDamageAnalyzer && (
                    <button
                      onClick={() => onOpenInDamageAnalyzer(proj)}
                      className="px-3 py-1.5 rounded-md text-sm text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      Editar
                    </button>
                  )}
                  <button
                    onClick={() => onSelectProject(proj)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-400 hover:bg-purple-300 text-slate-950 text-sm font-semibold cursor-pointer transition-colors"
                  >
                    Abrir
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

    </div>
  );
};
