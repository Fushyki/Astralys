import React, { useState } from 'react';
import { 
  Swords, 
  Sparkles, 
  Flame, 
  Zap, 
  Clock, 
  Award, 
  ChevronRight, 
  FolderGit2, 
  Download, 
  Share2, 
  ArrowRight, 
  Calculator, 
  Shield, 
  RefreshCw,
  Layers,
  Star
} from 'lucide-react';
import { CalculationProject } from '../types/projectVault';
import { RotationTimeline } from './RotationTimeline';
import { ScenarioDashboard } from './ScenarioDashboard';
import { CharacterAvatar } from './CharacterAvatar';
import { generateTimelineFromDamageResult } from '../engines/timelineEngine';
import { generateScenariosFromCalculation } from '../engines/scenarioEngine';
import { InfographicCardData } from '../types/infographic';
import { DamageFormulaModal } from './DamageFormulaModal';
import { explainDamageHit, DamageBreakdownDetails } from '../engines/damageFormulaEngine';
import { DamageHit, CharacterStatSnapshot } from '../types/damageBreakdown';

interface CombatWarRoomProps {
  currentProject: CalculationProject;
  availableProjects: CalculationProject[];
  onSelectProject: (project: CalculationProject) => void;
  onOpenDamageAnalyzer?: () => void;
  onOpenERCalculator?: (teamNames: string[], duration?: number) => void;
  onOpenWeaponComparator?: () => void;
  onExportToCard?: (cardData: InfographicCardData) => void;
  onOpenVault?: () => void;
}

export const CombatWarRoom: React.FC<CombatWarRoomProps> = ({
  currentProject,
  availableProjects,
  onSelectProject,
  onOpenDamageAnalyzer,
  onOpenERCalculator,
  onOpenWeaponComparator,
  onExportToCard,
  onOpenVault
}) => {
  const calc = currentProject.calculation;
  const timeline = currentProject.timeline || generateTimelineFromDamageResult(calc);
  const scenarios = currentProject.scenarios || generateScenariosFromCalculation(calc);

  const [inspectedHitDetails, setInspectedHitDetails] = useState<DamageBreakdownDetails | null>(null);

  // Helper to open formula inspector for a character
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

  // Export War Room to Infographic Card
  const handleExportCard = () => {
    if (!onExportToCard) return;
    const carry = calc.characters[0];
    const carryName = carry?.name || 'CARRY';
    const cardData: InfographicCardData = {
      teamName: currentProject.title || `${carryName.toUpperCase()} TEAM`,
      carryArchetype: carryName.toUpperCase(),
      investmentBadge: 'KQM Investment',
      statusTag: 'STC (WAR ROOM)',
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

  return (
    <div className="space-y-7 animate-fade-in select-none">
      
      {/* Top War Room Header & Project Switcher */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#090e17] border border-slate-800 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-500/40">
                Combat War Room
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {currentProject.tags.join(' • ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-wider mt-1">
              {currentProject.title}
            </h1>
          </div>
        </div>

        {/* Project Selector & Direct Vault link */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex-1 lg:flex-initial">
            <FolderGit2 className="w-4 h-4 text-purple-400 ml-2" />
            <select
              value={currentProject.id}
              onChange={(e) => {
                const found = availableProjects.find(p => p.id === e.target.value);
                if (found) onSelectProject(found);
              }}
              className="bg-transparent text-xs font-bold text-white outline-none pr-3 cursor-pointer"
            >
              {availableProjects.map(proj => (
                <option key={proj.id} value={proj.id} className="bg-slate-900 text-white">
                  {proj.title} ({proj.carryName})
                </option>
              ))}
            </select>
          </div>

          {onOpenVault && (
            <button
              onClick={onOpenVault}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Ver Todos no Vault</span>
            </button>
          )}

          {onExportToCard && (
            <button
              onClick={handleExportCard}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Gerar Card Infográfico</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Key Metrics Banners */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0c111c] border border-slate-800 shadow-md">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">DPR Total da Rotação</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400 mt-1">
            {calc.totalDpr.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">KQM Standard</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c111c] border border-slate-800 shadow-md">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">DPS da Equipe</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-1">
            {calc.dps.toLocaleString('pt-BR')}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Em {calc.rotationDuration} segundos</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c111c] border border-slate-800 shadow-md">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Carry Principal</span>
          <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1 truncate">
            {calc.characters[0]?.name}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{calc.characters[0]?.damagePercentage}% do dano total</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c111c] border border-slate-800 shadow-md">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Tempo da Rotação</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
            {calc.rotationDuration}s
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{timeline.actions.length} ações mapeadas</span>
        </div>
      </div>

      {/* SECTION 1: 4 Individual Character Damage Cards (Dano Individual de Cada Um) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Dano Individual & Status de Cada Personagem
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Clique no card para abrir o inspetor de fórmulas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {calc.characters.map((char, idx) => {
            const isCarry = idx === 0;

            return (
              <div
                key={idx}
                onClick={() => handleInspectCharacter(char)}
                className={`p-4 rounded-2xl bg-[#0c111c] border flex flex-col justify-between space-y-3 shadow-lg transition-all cursor-pointer group hover:-translate-y-0.5 ${
                  isCarry ? 'border-rose-500/50 ring-1 ring-rose-500/30 bg-[#101422]' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <CharacterAvatar name={char.name} element={char.element as any} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-white truncate group-hover:text-rose-300 transition-colors">
                          {char.name}
                        </h3>
                        {isCarry && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            CARRY
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-amber-300 font-medium truncate">{char.weapon}</p>
                      <p className="text-[10px] text-slate-400 truncate">{char.artifactSet}</p>
                    </div>
                  </div>

                  <Calculator className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-400 transition-colors flex-shrink-0" />
                </div>

                {/* Individual Damage Share Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">Dano Total:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-white group-hover:text-rose-300 transition-colors">
                        {char.totalDamage.toLocaleString('pt-BR')}
                      </span>
                      <span className="font-bold text-cyan-400">{char.damagePercentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isCarry ? 'bg-gradient-to-r from-rose-500 to-amber-400' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, char.damagePercentage))}%` }}
                    />
                  </div>
                </div>

                {/* Combat Stats Grid */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-2 border-t border-slate-800/80">
                  {char.totalAtk && (
                    <div className="p-1 rounded bg-slate-950/80 border border-slate-800/60">
                      <span className="text-slate-500 block">ATK</span>
                      <span className="font-bold text-slate-200">{char.totalAtk}</span>
                    </div>
                  )}
                  {char.critRate && char.critDmg && (
                    <div className="p-1 rounded bg-slate-950/80 border border-slate-800/60">
                      <span className="text-slate-500 block">Crítico</span>
                      <span className="font-bold text-slate-200">{char.critRate}% / {char.critDmg}%</span>
                    </div>
                  )}
                  {char.elementalMastery !== undefined && (
                    <div className="p-1 rounded bg-slate-950/80 border border-slate-800/60">
                      <span className="text-slate-500 block">EM</span>
                      <span className="font-bold text-slate-200">{char.elementalMastery}</span>
                    </div>
                  )}
                  {char.dmgBonus !== undefined && (
                    <div className="p-1 rounded bg-slate-950/80 border border-slate-800/60">
                      <span className="text-slate-500 block">Bônus</span>
                      <span className="font-bold text-slate-200">+{char.dmgBonus}%</span>
                    </div>
                  )}
                </div>

                {/* Substat rolls if available */}
                {char.rolls && (
                  <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                    <span>Rolls KQM:</span>
                    <span className="text-cyan-400 font-bold">{char.rolls.cr} CR • {char.rolls.cd} CD</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Interactive Rotation Timeline (Ações, Trocas e Golpes) */}
      <RotationTimeline
        timeline={timeline}
        characters={calc.characters}
        carryIndex={0}
      />

      {/* SECTION 3: Scenario Dashboards (O que é melhor em cada situação) */}
      <ScenarioDashboard data={scenarios} />

      {/* Damage Formula Inspector Modal */}
      <DamageFormulaModal
        details={inspectedHitDetails}
        onClose={() => setInspectedHitDetails(null)}
      />

    </div>
  );
};
