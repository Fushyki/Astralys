import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Swords, 
  Sparkles, 
  Flame, 
  Layers, 
  ArrowRight, 
  Calculator,
  ChevronRight,
  FolderGit2,
  PieChart,
  Activity,
  Sliders
} from 'lucide-react';
import { CalculationProject } from '../types/projectVault';
import { RotationTimeline } from './RotationTimeline';
import { ScenarioDashboard } from './ScenarioDashboard';
import { CharacterAvatar } from './CharacterAvatar';
import { generateTimelineFromDamageResult } from '../engines/timelineEngine';
import { generateScenariosFromCalculation } from '../engines/scenarioEngine';
import { DamageFormulaModal } from './DamageFormulaModal';
import { explainDamageHit, DamageBreakdownDetails } from '../engines/damageFormulaEngine';
import { CharacterStatSnapshot } from '../types/damageBreakdown';
import { InfographicCardData } from '../types/infographic';
import { RotationTimelineData } from '../types/rotationTimeline';

interface DashboardsPageProps {
  currentProject: CalculationProject;
  availableProjects: CalculationProject[];
  onSelectProject: (project: CalculationProject) => void;
  onOpenDamageAnalyzer?: () => void;
  onOpenERCalculator?: (teamNames: string[], duration?: number) => void;
  onOpenWeaponComparator?: () => void;
  onExportToCard?: (cardData: InfographicCardData) => void;
  onOpenVault?: () => void;
  onSaveProject?: (project: CalculationProject) => void;
}

export const DashboardsPage: React.FC<DashboardsPageProps> = ({
  currentProject,
  availableProjects,
  onSelectProject,
  onOpenDamageAnalyzer,
  onOpenERCalculator,
  onOpenWeaponComparator,
  onExportToCard,
  onOpenVault,
  onSaveProject
}) => {
  const calc = currentProject.calculation;
  const timeline = currentProject.timeline || generateTimelineFromDamageResult(calc);
  const scenarios = currentProject.scenarios || generateScenariosFromCalculation(calc);

  const [inspectedHitDetails, setInspectedHitDetails] = useState<DamageBreakdownDetails | null>(null);

  // Format currency/numbers in Brazilian standard (e.g. 4.157.702,28)
  const formatNum = (val: number | undefined): string => {
    if (val === undefined || isNaN(val)) return '0,00';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatInt = (val: number | undefined): string => {
    if (val === undefined || isNaN(val)) return '0';
    return Math.round(val).toLocaleString('pt-BR');
  };

  // Theme styling based on Carry element with refined, pleasant, soft dark tones
  const theme = useMemo(() => {
    const lower = (currentProject.carryName || '').toLowerCase();
    if (lower.includes('mavuika') || lower.includes('bennett') || lower.includes('pyro')) {
      return {
        pillActive: 'bg-amber-500/15 text-amber-200 border-amber-500/40 shadow-sm shadow-amber-500/10 font-bold',
        cardBorder: 'border-amber-900/30',
        headerBg: 'bg-gradient-to-r from-slate-950 via-amber-950/60 to-slate-950 border-b border-amber-500/25 text-amber-100',
        subHeaderDark: 'bg-[#0a0805] text-amber-200/70 border-b border-slate-800/80',
        colHeaderDark: 'bg-slate-950 text-slate-400 border-b border-slate-800',
        rowAltBg: 'bg-slate-950/40',
        footerDark: 'bg-[#080604] text-slate-300 border-t border-amber-900/30',
        accentText: 'text-amber-300',
        accentBorder: 'border-amber-500/30',
        accentBg: 'bg-amber-500/10'
      };
    }
    if (lower.includes('flins') || lower.includes('electro') || lower.includes('cryo') || lower.includes('columbina')) {
      return {
        pillActive: 'bg-purple-500/15 text-purple-200 border-purple-500/40 shadow-sm shadow-purple-500/10 font-bold',
        cardBorder: 'border-purple-900/30',
        headerBg: 'bg-gradient-to-r from-slate-950 via-purple-950/60 to-slate-950 border-b border-purple-500/25 text-purple-100',
        subHeaderDark: 'bg-[#090710] text-purple-200/70 border-b border-slate-800/80',
        colHeaderDark: 'bg-slate-950 text-slate-400 border-b border-slate-800',
        rowAltBg: 'bg-slate-950/40',
        footerDark: 'bg-[#06050b] text-slate-300 border-t border-purple-900/30',
        accentText: 'text-purple-300',
        accentBorder: 'border-purple-500/30',
        accentBg: 'bg-purple-500/10'
      };
    }
    return {
      pillActive: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40 shadow-sm shadow-cyan-500/10 font-bold',
      cardBorder: 'border-slate-800',
      headerBg: 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-700/40 text-slate-100',
      subHeaderDark: 'bg-slate-950 text-slate-400 border-b border-slate-800/80',
      colHeaderDark: 'bg-slate-950 text-slate-400 border-b border-slate-800',
      rowAltBg: 'bg-slate-950/40',
      footerDark: 'bg-slate-950 text-slate-300 border-t border-slate-800',
      accentText: 'text-cyan-300',
      accentBorder: 'border-cyan-500/30',
      accentBg: 'bg-cyan-500/10'
    };
  }, [currentProject.carryName]);

  // Handle timeline updates & save directly to project
  const handleTimelineChange = (updatedTimeline: RotationTimelineData) => {
    const updatedProj: CalculationProject = {
      ...currentProject,
      rotationDuration: updatedTimeline.totalDuration,
      timeline: updatedTimeline,
      updatedAt: new Date().toISOString()
    };
    if (onSaveProject) {
      onSaveProject(updatedProj);
    }
  };

  // Inspect character math
  const handleInspectCharacter = (char: CharacterStatSnapshot) => {
    const hits = calc.hits.filter(h => h.charName.toLowerCase() === char.name.toLowerCase());
    const topHit = hits[0] || {
      id: 'default',
      label: 'Q',
      displayName: `${char.name} Dano Principal`,
      charName: char.name,
      charIndex: 0,
      damage: char.totalDamage,
      pctOfTotal: char.damagePercentage,
      category: 'burst' as const
    };
    const details = explainDamageHit(topHit, char, calc.totalDpr);
    setInspectedHitDetails(details);
  };

  // Export card
  const handleExportCard = () => {
    if (!onExportToCard) return;
    const carry = calc.characters[0];
    const carryName = carry?.name || 'CARRY';
    const cardData: InfographicCardData = {
      teamName: currentProject.title || `${carryName.toUpperCase()} TEAM`,
      carryArchetype: carryName.toUpperCase(),
      investmentBadge: 'KQM Investment',
      statusTag: 'STC (DASHBOARDS)',
      characters: calc.characters.map(c => {
        let erTarget = '100 ER';
        if (c.rolls?.er) {
          erTarget = `${Math.round(100 + (c.rolls.er * 5.5))} ER`;
        }
        return {
          name: c.name,
          constellation: 'C0',
          element: (c.element as any) || 'Pyro',
          damagePercentage: c.damagePercentage,
          weapon: {
            name: c.weapon || 'Arma Padrão',
            refinement: 'R1'
          },
          artifact: {
            setName: c.artifactSet || 'Artefato Padrão',
            erTarget
          },
          mainStats: 'ATK / DMG / CRIT'
        };
      }),
      metrics: {
        dps: calc.dps >= 1000 ? `${(calc.dps / 1000).toFixed(1)}k` : `${calc.dps}`,
        dpr: calc.totalDpr >= 1000000 
          ? `${(calc.totalDpr / 1000000).toFixed(2)}M` 
          : calc.totalDpr >= 1000 
            ? `${(calc.totalDpr / 1000).toFixed(1)}k` 
            : `${calc.totalDpr}`
      },
      rotationNotation: `(${calc.rotationDuration}s) ${calc.comboNotation || 'Rotação Padrão'}`,
      assumptions: 'Assumes standard KQM 5-star investment',
      watermark: 'ASTRALYS'
    };
    onExportToCard(cardData);
  };

  // Specific Damage by Category for THIS team (soft, pleasant tones)
  const damageByCategory = useMemo(() => {
    const categories: Record<string, { label: string; damage: number; color: string; icon: string }> = {
      burst: { label: 'Supremo (Q)', damage: 0, color: '#a78bfa', icon: 'Q' },
      charged: { label: 'Carregado / Stance', damage: 0, color: '#f472b6', icon: 'CA' },
      skill: { label: 'Habilidade Elemental (E)', damage: 0, color: '#fbbf24', icon: 'E' },
      normal: { label: 'Ataques Normais (N)', damage: 0, color: '#38bdf8', icon: 'N' },
      reaction: { label: 'Reações / Campo', damage: 0, color: '#34d399', icon: 'FX' }
    };

    if (calc.hits && calc.hits.length > 0) {
      calc.hits.forEach(hit => {
        const cat = hit.category || 'normal';
        if (categories[cat]) {
          categories[cat].damage += hit.damage;
        } else {
          categories.reaction.damage += hit.damage;
        }
      });
    } else {
      categories.burst.damage = Math.round(calc.totalDpr * 0.40);
      categories.charged.damage = Math.round(calc.totalDpr * 0.52);
      categories.skill.damage = Math.round(calc.totalDpr * 0.08);
    }

    const total = Object.values(categories).reduce((acc, c) => acc + c.damage, 0) || 1;
    return Object.entries(categories)
      .filter(([_, v]) => v.damage > 0)
      .map(([k, v]) => ({
        key: k,
        ...v,
        percentage: parseFloat(((v.damage / total) * 100).toFixed(1))
      }));
  }, [calc]);

  const durationStr = calc.rotationDuration ? calc.rotationDuration.toString().replace('.', ',') : '20,0';

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Informative Placeholder Notice Banner */}
      {(currentProject.id === 'proj-placeholder' || currentProject.tags?.includes('Placeholder') || currentProject.tags?.includes('Demo')) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">Sua Equipe (Modo Demo)</span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30">
                  Demo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nenhum time real foi importado ainda. Os dados abaixo servem como modelo demonstrativo para você se orientar na visualização de gráficos, rotações e timelines.
              </p>
            </div>
          </div>
          {onOpenDamageAnalyzer && (
            <button
              type="button"
              onClick={onOpenDamageAnalyzer}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer whitespace-nowrap hover:scale-105"
            >
              Criar / Colar Minha Equipe
            </button>
          )}
        </div>
      )}

      {/* 1. TOP TEAM SWITCHER TABS (Individual por Time) */}
      <div className="p-3 rounded-2xl bg-[#090e17] border border-slate-800 shadow-xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mr-1 flex items-center gap-1.5 flex-shrink-0">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Selecionar Time:</span>
          </span>
          {availableProjects.map((p) => {
            const isSelected = p.id === currentProject.id;
            const isPlaceholder = p.id === 'proj-placeholder' || p.tags?.includes('Placeholder') || p.tags?.includes('Demo');
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProject(p)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? `${theme.pillActive} ring-1 ring-white/10`
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{p.title}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  {isPlaceholder ? '(Demo)' : `(${Math.round(p.dps / 1000)}k)`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-2 ml-auto">
          {onOpenVault && (
            <button
              type="button"
              onClick={onOpenVault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver no Vault</span>
            </button>
          )}

          {onExportToCard && (
            <button
              type="button"
              onClick={handleExportCard}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Gerar Card</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CALCSHEET SUMMARY BLOCK DA EQUIPE (Fiel à captura de tela, cores suaves) */}
      <div className={`rounded-2xl border-2 ${theme.cardBorder} overflow-hidden shadow-2xl bg-[#090d16] flex flex-col justify-between`}>
        {/* Top Header Banner */}
        <div className={`${theme.headerBg} px-4 py-2.5 text-center`}>
          <h2 className="font-extrabold text-base sm:text-lg tracking-wide uppercase font-sans drop-shadow-sm">
            {currentProject.title}
          </h2>
        </div>

        {/* Subheader: Combo Rotation Notation */}
        <div className={`${theme.subHeaderDark} px-4 py-1.5 text-center font-mono text-xs font-bold truncate`}>
          {currentProject.comboNotation || calc.comboNotation || 'Rotação Padrão'}
        </div>

        {/* 5-Column Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className={`${theme.colHeaderDark} text-[11px] uppercase tracking-wider text-left border-b border-black/60`}>
                <th className="py-2 px-3 font-black">Character</th>
                <th className="py-2 px-3 font-black text-right">Damage</th>
                <th className="py-2 px-3 font-black text-right">Percentage</th>
                <th className="py-2 px-3 font-black">Weapon</th>
                <th className="py-2 px-3 font-black">Artefact Set</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {calc.characters.map((char, cIdx) => {
                const isAlt = cIdx % 2 === 1;

                return (
                  <tr 
                    key={cIdx}
                    onClick={() => handleInspectCharacter(char)}
                    className={`transition-colors cursor-pointer hover:bg-slate-800/40 ${isAlt ? theme.rowAltBg : 'bg-[#0e1320]'}`}
                    title="Clique para ver o cálculo e fórmula matemática deste personagem"
                  >
                    {/* Character */}
                    <td className="py-2 px-3 font-bold text-slate-100 flex items-center gap-2 whitespace-nowrap">
                      {char.name !== 'Lunar' && (
                        <CharacterAvatar name={char.name} element={char.element as any} size="xs" showBorder={false} />
                      )}
                      <span>{char.name}</span>
                      {cIdx === 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          CARRY
                        </span>
                      )}
                    </td>

                    {/* Damage */}
                    <td className="py-2 px-3 text-right font-black text-slate-200 whitespace-nowrap">
                      {formatNum(char.totalDamage)}
                    </td>

                    {/* Percentage */}
                    <td className="py-2 px-3 text-right font-bold text-amber-300 whitespace-nowrap">
                      {char.damagePercentage.toFixed(2).replace('.', ',')}%
                    </td>

                    {/* Weapon */}
                    <td className="py-2 px-3 text-slate-300 truncate max-w-[140px]" title={char.weapon}>
                      {char.weapon || '-'}
                    </td>

                    {/* Artefact Set */}
                    <td className="py-2 px-3 text-slate-400 truncate max-w-[140px]" title={char.artifactSet}>
                      {char.artifactSet || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer: DPR & DPS */}
        <div className={`${theme.footerDark} p-3 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2`}>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-slate-400">DPR</span>
            <span className="font-black text-base text-slate-100">{formatNum(currentProject.totalDpr)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-slate-400">DPS({durationStr})</span>
            <span className={`font-black text-base ${theme.accentText}`}>{formatInt(currentProject.dps)}</span>
          </div>
        </div>
      </div>

      {/* 3. GRÁFICOS VISUAIS ESPECÍFICOS DESTE TIME */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICO A: Distribuição de Dano entre os 4 Personagens */}
        <div className="p-5 rounded-3xl bg-[#090e17] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Participação de Dano na Equipe
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              DPR: {(calc.totalDpr / 1000000).toFixed(2)}M
            </span>
          </div>

          <div className="space-y-3">
            {calc.characters.map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <CharacterAvatar name={c.name} element={c.element as any} size="xs" showBorder={false} />
                    <span className="font-bold text-white">{c.name}</span>
                    {i === 0 && <span className="text-[9px] text-rose-400 font-bold">CARRY</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">{formatInt(c.totalDamage)}</span>
                    <span className="font-black text-cyan-400">{c.damagePercentage.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      i === 0 
                        ? 'bg-gradient-to-r from-rose-500/80 to-amber-400/80' 
                        : 'bg-gradient-to-r from-cyan-500/70 to-indigo-500/70'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(3, c.damagePercentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GRÁFICO B: Decomposição por Categoria de Golpe (Burst / Skill / Normal / Reação) */}
        <div className="p-5 rounded-3xl bg-[#090e17] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Origem do Dano por Tipo de Golpe
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {damageByCategory.length} Categorias
            </span>
          </div>

          <div className="space-y-3">
            {damageByCategory.map(cat => (
              <div key={cat.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.label}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">{formatInt(cat.damage)}</span>
                    <span className="font-black text-amber-300">{cat.percentage}%</span>
                  </div>
                </div>

                <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div 
                    className="h-full rounded-full transition-all duration-700 opacity-85"
                    style={{ 
                      width: `${Math.min(100, Math.max(3, cat.percentage))}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. LINHA DE EXECUÇÃO INTERATIVA & EDITÁVEL DA EQUIPE */}
      <RotationTimeline
        timeline={timeline}
        characters={calc.characters}
        carryIndex={0}
        onChangeTimeline={handleTimelineChange}
      />

      {/* 5. MATRIZ DE CENÁRIOS DE COMBATE ("O que é melhor em cada situação") */}
      <ScenarioDashboard data={scenarios} />

      {/* Modal Matemático do Golpe */}
      <DamageFormulaModal
        details={inspectedHitDetails}
        onClose={() => setInspectedHitDetails(null)}
      />

    </div>
  );
};
