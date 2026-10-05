import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Gem, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Star,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { ScenarioDashboardData, ScenarioOption, ScenarioCategory } from '../types/scenarioAnalysis';

interface ScenarioDashboardProps {
  data: ScenarioDashboardData;
}

export const ScenarioDashboard: React.FC<ScenarioDashboardProps> = ({ data }) => {
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory | 'all'>('all');

  const categories: Array<{ id: ScenarioCategory | 'all'; label: string; icon: any }> = [
    { id: 'all', label: 'Todos os Cenários', icon: Compass },
    { id: 'target_count', label: '1 Alvo vs AoE', icon: Target },
    { id: 'reaction_field', label: 'Polar Star / Reações', icon: Sparkles },
    { id: 'rotation_speed', label: 'Teórico vs Realista', icon: Clock },
    { id: 'investment_step', label: 'Upgrade de Gemas', icon: Gem }
  ];

  const filteredScenarios = selectedCategory === 'all'
    ? data.scenarios
    : data.scenarios.filter(s => s.category === selectedCategory);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#090e17] border border-slate-800 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-rose-600/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-cinzel tracking-wide">
                Dashboard de Cenários: O que é melhor em cada situação?
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/30">
                KQM Theorycrafting Matrix
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Comparações matemáticas de alvos, buffs do Polar Star Field, tempo de execução e prioridade de investimento
            </p>
          </div>
        </div>

        {/* Global baseline reference */}
        <div className="text-right font-mono p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex-shrink-0">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Baseline (100%)</span>
          <span className="text-xs font-black text-cyan-300">
            {data.baseDpr.toLocaleString('pt-BR')} DPR • {data.baseDps.toLocaleString('pt-BR')} DPS
          </span>
        </div>
      </div>

      {/* Summary Advice Banner */}
      {data.summaryRecommendation && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-md">
          <ShieldCheck className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div className="text-xs text-slate-300">
            <strong className="text-purple-300">Veredito Geral Astralys:</strong> {data.summaryRecommendation}
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scenarios Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredScenarios.map((scen) => {
          const diffFromBase = Math.round(scen.percentageRel - 100);
          const isPositive = diffFromBase >= 0;

          return (
            <div
              key={scen.id}
              className={`p-4 sm:p-5 rounded-2xl bg-[#0b101a] border flex flex-col justify-between space-y-4 shadow-xl transition-all relative overflow-hidden ${
                scen.isRecommended
                  ? 'border-emerald-500/50 ring-1 ring-emerald-500/30 bg-[#0c1422]'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Card Top */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-white">{scen.title}</span>
                    {scen.isRecommended && (
                      <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <Star className="w-2.5 h-2.5 fill-emerald-300" />
                        Recomendado
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                    scen.isRecommended ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {scen.situationBadge}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 font-mono">
                  {scen.conditionLabel}
                </p>
              </div>

              {/* Performance Comparison Bar */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/60">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">Rendimento Relativo:</span>
                  <div className="flex items-center gap-1.5 font-black">
                    <span className="text-white text-sm">{scen.percentageRel}%</span>
                    {!scen.isBaseline && (
                      <span className={`text-[11px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({isPositive ? `+${diffFromBase}%` : `${diffFromBase}%`})
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                  {/* Baseline 100% Mark */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
                    style={{ left: `${Math.min(100, (100 / 220) * 100)}%` }}
                    title="Linha Base 100%"
                  />
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      scen.isRecommended 
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' 
                        : isPositive 
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                          : 'bg-gradient-to-r from-rose-700 to-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, (scen.percentageRel / 220) * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>DPR: <strong className="text-slate-200">{scen.dpr.toLocaleString('pt-BR')}</strong></span>
                  <span>DPS: <strong className="text-amber-300">{scen.dps.toLocaleString('pt-BR')}</strong></span>
                </div>
              </div>

              {/* Mathematical Verdict */}
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs">
                <span className="text-[10px] text-amber-400 font-bold block mb-0.5">Veredito da Simulação:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {scen.verdict}
                </p>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 border-t border-slate-800/60">
                <div className="space-y-1">
                  <span className="text-emerald-400 font-bold block">Vantagens:</span>
                  {scen.pros.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-1 text-slate-300">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <span className="text-rose-400 font-bold block">Atenções:</span>
                  {scen.cons.map((c, idx) => (
                    <div key={idx} className="flex items-start gap-1 text-slate-400">
                      <span className="text-rose-400 mt-0.5">•</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
