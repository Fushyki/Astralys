import React from 'react';
import { 
  X, 
  Sparkles, 
  Flame, 
  Moon, 
  Zap, 
  HelpCircle, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  Percent,
  Calculator
} from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import { DamageBreakdownDetails } from '../engines/damageFormulaEngine';

interface DamageFormulaModalProps {
  details: DamageBreakdownDetails | null;
  onClose: () => void;
}

export const DamageFormulaModal: React.FC<DamageFormulaModalProps> = ({ details, onClose }) => {
  if (!details) return null;

  const getBadgeStyle = () => {
    switch (details.category) {
      case 'stellar':
        return {
          bg: 'bg-purple-500/10 border-purple-500/40 text-purple-300',
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
          accent: 'from-purple-500 to-indigo-500',
          border: 'border-purple-500/30'
        };
      case 'lunar':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300',
          icon: <Moon className="w-3.5 h-3.5 text-cyan-400" />,
          accent: 'from-cyan-500 to-blue-500',
          border: 'border-cyan-500/30'
        };
      case 'melt_vape':
        return {
          bg: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
          icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
          accent: 'from-rose-500 to-amber-500',
          border: 'border-rose-500/30'
        };
      default:
        return {
          bg: 'bg-slate-500/10 border-slate-500/40 text-slate-300',
          icon: <Zap className="w-3.5 h-3.5 text-slate-400" />,
          accent: 'from-slate-600 to-slate-500',
          border: 'border-slate-700'
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#0b0f17] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-950 to-[#0b0f17]">
          <div className="flex items-center gap-3">
            <CharacterAvatar name={details.charName} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-cinzel tracking-wider">
                  {details.hitName}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                  {badge.icon}
                  <span>{details.categoryLabel}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Executado por <strong>{details.charName}</strong> • {details.reactionType}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Main Damage Value Display */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                Dano Calculado do Golpe
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-200 to-amber-300 mt-0.5">
                {details.finalDamage.toLocaleString('pt-BR')}
              </div>
            </div>

            {/* Formula Pill */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-w-sm">
              <span className="text-slate-500 block text-[9px] uppercase font-bold mb-0.5">Equação Utilizada:</span>
              <code className="text-cyan-300 leading-tight block">
                {details.formulaString}
              </code>
            </div>
          </div>

          {/* Theorycrafting Explanation */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase text-[10px] tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Como Funciona Esta Mecânica</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              {details.explanation}
            </p>
          </div>

          {/* Factor Breakdown Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Decomposição Passo a Passo dos Fatores</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {details.steps.map((step, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-xl bg-[#0e121b] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 text-[11px] truncate">{step.name}</span>
                    <span className="font-mono font-black text-cyan-400 text-xs">{step.formattedValue}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 truncate">
                    {step.formula}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Combat Stats Snapshot Used */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
              Atributos de Entrada Utilizados no Cálculo
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-500 block">ATK</span>
                <span className="font-bold text-slate-200">{details.statsUsed.atk}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-500 block">CR / CD</span>
                <span className="font-bold text-slate-200">{details.statsUsed.cr}% / {details.statsUsed.cd}%</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-500 block">EM</span>
                <span className="font-bold text-slate-200">{details.statsUsed.em}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-500 block">Dano Bônus</span>
                <span className="font-bold text-slate-200">+{details.statsUsed.dmgBonus}%</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-500 block">DEF Inimigo</span>
                <span className="font-bold text-slate-200">{details.statsUsed.enemyDef.toFixed(2)}×</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-500 block">RES Inimigo</span>
                <span className="font-bold text-slate-200">{details.statsUsed.enemyRes.toFixed(2)}×</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            Astralys Theorycraft Engine • Meta 6.7 / 7.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
