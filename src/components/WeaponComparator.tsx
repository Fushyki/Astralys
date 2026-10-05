import React, { useState, useRef } from 'react';
import { 
  Swords, 
  Sparkles, 
  Download, 
  Plus, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ArrowRight, 
  Info, 
  Shield, 
  Star,
  Flame
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { CharacterAvatar } from './CharacterAvatar';
import { CharacterWeaponComparison, WeaponOption } from '../types/weaponComparison';
import { InfographicCardData } from '../types/infographic';
import { CHARACTERS_DATABASE } from '../data/characters';
import { WEAPONS_DATABASE, getWeaponData, WeaponData } from '../data/weapons';

interface WeaponComparatorProps {
  comparisons?: Record<string, CharacterWeaponComparison>;
  onUpdateComparisons?: (updated: Record<string, CharacterWeaponComparison>) => void;
  onInjectToCard?: (cardData: Partial<InfographicCardData>) => void;
  onOpenDamageAnalyzer?: () => void;
  onLoadDemoPreset?: () => void;
  onClearComparisons?: (charName?: string) => void;
}

export const WeaponComparator: React.FC<WeaponComparatorProps> = ({
  comparisons: externalComparisons,
  onUpdateComparisons,
  onInjectToCard,
  onOpenDamageAnalyzer,
  onLoadDemoPreset,
  onClearComparisons
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  // Comparisons state (external or internal fallback)
  const [internalComparisons, setInternalComparisons] = useState<Record<string, CharacterWeaponComparison>>({});
  const comparisons = externalComparisons !== undefined ? externalComparisons : internalComparisons;

  const setComparisons = (updated: Record<string, CharacterWeaponComparison>) => {
    if (onUpdateComparisons) {
      onUpdateComparisons(updated);
    } else {
      setInternalComparisons(updated);
    }
  };

  const availableChars = Object.keys(comparisons);
  const [selectedChar, setSelectedChar] = useState<string>('');

  const activeChar = (availableChars.includes(selectedChar) && selectedChar) 
    || (availableChars.length > 0 ? availableChars[0] : '');

  // Look up character data to enforce weapon compatibility (e.g. Mavuika -> Claymore only)
  const currentCharInfo = CHARACTERS_DATABASE.find(
    c => c.name.toLowerCase() === activeChar.toLowerCase() ||
         (c.aliases && c.aliases.some(a => a.toLowerCase() === activeChar.toLowerCase()))
  );
  const allowedWeaponType = currentCharInfo?.weapon;

  const WEAPON_TYPE_LABELS: Record<string, string> = {
    Sword: 'Espada (1 Mão)',
    Claymore: 'Espadão',
    Polearm: 'Lança',
    Catalyst: 'Catalisador',
    Bow: 'Arco'
  };

  const compatibleWeapons = allowedWeaponType && allowedWeaponType !== 'None'
    ? WEAPONS_DATABASE.filter(w => w.type === allowedWeaponType)
    : WEAPONS_DATABASE;

  // Edit / Add weapon state
  const [editingWeaponId, setEditingWeaponId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [detectedWeapon, setDetectedWeapon] = useState<WeaponData | null>(null);
  const [weaponTypeError, setWeaponTypeError] = useState<string | null>(null);

  // New weapon form - starts with clean empty values and placeholders
  const [newWeapon, setNewWeapon] = useState<{
    name: string;
    refinement: string;
    rarity: 3 | 4 | 5;
    baseAtk: string | number;
    subStatType: WeaponOption['subStatType'];
    subStatValue: string | number;
    passiveEffect: string;
    dpr: string | number;
    dps: string | number;
    notes: string;
  }>({
    name: '',
    refinement: 'R1',
    rarity: 5,
    baseAtk: '',
    subStatType: 'CR',
    subStatValue: '',
    passiveEffect: '',
    dpr: '',
    dps: '',
    notes: ''
  });

  const handleOpenAddModal = () => {
    setWeaponTypeError(null);
    setDetectedWeapon(null);
    setNewWeapon({
      name: '',
      refinement: 'R1',
      rarity: 5,
      baseAtk: '',
      subStatType: 'CR',
      subStatValue: '',
      passiveEffect: '',
      dpr: '',
      dps: '',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleWeaponNameChange = (name: string) => {
    const lookup = getWeaponData(name);
    if (lookup) {
      if (allowedWeaponType && allowedWeaponType !== 'None' && lookup.type !== allowedWeaponType) {
        setWeaponTypeError(
          `Atenção: "${lookup.name}" é um(a) ${WEAPON_TYPE_LABELS[lookup.type] || lookup.type}, mas ${activeChar} só pode equipar ${WEAPON_TYPE_LABELS[allowedWeaponType] || allowedWeaponType}!`
        );
        setDetectedWeapon(null);
        setNewWeapon(prev => ({ ...prev, name }));
        return;
      }
      setWeaponTypeError(null);
      setDetectedWeapon(lookup);
      setNewWeapon(prev => ({
        ...prev,
        name: lookup.name,
        rarity: lookup.rarity,
        baseAtk: lookup.baseAtk,
        subStatType: lookup.subStatType,
        subStatValue: lookup.subStatValue,
        passiveEffect: lookup.passiveEffect,
        notes: prev.notes || lookup.passiveName
      }));
    } else {
      setWeaponTypeError(null);
      setDetectedWeapon(null);
      setNewWeapon(prev => ({ ...prev, name }));
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentCharData = comparisons[activeChar];

  // Recalculate percentages relative to the baseline
  const recalculatePercentages = (comp: CharacterWeaponComparison): CharacterWeaponComparison => {
    const baseline = comp.weapons.find(w => w.id === comp.baselineWeaponId) || comp.weapons[0];
    if (!baseline) return comp;

    const baseDpr = baseline.dpr || 1;
    const updatedWeapons = comp.weapons.map(w => {
      const pct = parseFloat(((w.dpr / baseDpr) * 100).toFixed(1));
      return {
        ...w,
        percentageOfBaseline: pct,
        isBaseline: w.id === baseline.id
      };
    });

    // Sort by highest DPR
    updatedWeapons.sort((a, b) => b.dpr - a.dpr);

    return {
      ...comp,
      baselineWeaponId: baseline.id,
      weapons: updatedWeapons
    };
  };

  // Set any weapon as the 100% baseline
  const handleSetBaseline = (weaponId: string) => {
    if (!currentCharData) return;
    const updated = { ...currentCharData, baselineWeaponId: weaponId };
    const processed = recalculatePercentages(updated);
    setComparisons({
      ...comparisons,
      [activeChar]: processed
    });
    const baseName = processed.weapons.find(w => w.id === weaponId)?.name;
    showToast(`"${baseName}" definida como Baseline (100%)!`);
  };

  // Delete weapon
  const handleDeleteWeapon = (weaponId: string) => {
    if (!currentCharData) return;
    if (currentCharData.weapons.length <= 1) {
      if (confirm(`Remover "${currentCharData.weapons[0].name}" e limpar a comparação de ${currentCharData.characterName}?`)) {
        if (onClearComparisons) {
          onClearComparisons(activeChar);
        } else {
          const copy = { ...comparisons };
          delete copy[activeChar];
          setComparisons(copy);
        }
        showToast(`Comparação de ${currentCharData.characterName} limpa.`);
      }
      return;
    }
    const filtered = currentCharData.weapons.filter(w => w.id !== weaponId);
    let newBaseline = currentCharData.baselineWeaponId;
    if (newBaseline === weaponId) {
      newBaseline = filtered[0].id;
    }
    const updated = {
      ...currentCharData,
      baselineWeaponId: newBaseline,
      weapons: filtered
    };
    setComparisons({
      ...comparisons,
      [activeChar]: recalculatePercentages(updated)
    });
  };

  // Add new custom weapon
  const handleAddWeapon = () => {
    if (!newWeapon.name.trim() || !currentCharData) {
      alert('Por favor, informe o nome da arma.');
      return;
    }
    const lookup = getWeaponData(newWeapon.name);
    if (allowedWeaponType && allowedWeaponType !== 'None' && lookup && lookup.type !== allowedWeaponType) {
      alert(`"${lookup.name}" é um(a) ${WEAPON_TYPE_LABELS[lookup.type] || lookup.type}! ${activeChar} só pode equipar armas do tipo ${WEAPON_TYPE_LABELS[allowedWeaponType] || allowedWeaponType}.`);
      return;
    }
    const finalName = lookup?.name || newWeapon.name.trim();

    const dprVal = Number(newWeapon.dpr) || currentCharData.weapons[0]?.dpr || 3000000;
    const dpsVal = currentCharData.rotationDuration > 0 
      ? Math.round(dprVal / currentCharData.rotationDuration)
      : Math.round(dprVal / 20);

    const weaponToAdd: WeaponOption = {
      id: `custom-w-${Date.now()}`,
      name: finalName,
      refinement: newWeapon.refinement || 'R1',
      rarity: ((newWeapon.rarity as any) || lookup?.rarity || 5) as 3 | 4 | 5,
      baseAtk: Number(newWeapon.baseAtk) || lookup?.baseAtk || 510,
      subStatType: (newWeapon.subStatType as any) || lookup?.subStatType || 'CR',
      subStatValue: Number(newWeapon.subStatValue) || lookup?.subStatValue || 27.6,
      passiveEffect: newWeapon.passiveEffect || lookup?.passiveEffect || 'Opção adicionada',
      dpr: dprVal,
      dps: dpsVal,
      percentageOfBaseline: 100,
      isBaseline: false,
      notes: newWeapon.notes || (lookup ? `${lookup.rarity}★ ${lookup.type}` : 'Opção Adicionada')
    };

    const updated = {
      ...currentCharData,
      weapons: [...currentCharData.weapons, weaponToAdd]
    };

    setComparisons({
      ...comparisons,
      [activeChar]: recalculatePercentages(updated)
    });

    setShowAddModal(false);
    setDetectedWeapon(null);
    setNewWeapon({
      name: '',
      refinement: 'R1',
      rarity: 5,
      baseAtk: '',
      subStatType: 'CR',
      subStatValue: '',
      passiveEffect: '',
      dpr: '',
      dps: '',
      notes: ''
    });
    showToast(`Arma "${weaponToAdd.name}" adicionada com sucesso!`);
  };

  // Quick Export to Card
  const handleInjectWeaponToCard = (weapon: WeaponOption) => {
    if (!onInjectToCard) return;
    onInjectToCard({
      carryArchetype: currentCharData.carryArchetype,
      metrics: {
        dps: weapon.dps >= 1000 ? `${(weapon.dps / 1000).toFixed(1)}k` : `${weapon.dps}`,
        dpr: weapon.dpr >= 1000000 ? `${(weapon.dpr / 1000000).toFixed(2)}M` : `${weapon.dpr}`
      }
    });
    showToast(`Valores da arma "${weapon.name}" (${weapon.refinement}) preparados para o Card!`);
  };

  // Export Chart PNG
  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#0a0f1d'
      });
      const link = document.createElement('a');
      link.download = `comparador_armas_${activeChar.toLowerCase() || 'carry'}_astralys.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar a imagem.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearCurrent = () => {
    if (!currentCharData) return;
    if (confirm(`Deseja limpar as armas de ${currentCharData.characterName}?`)) {
      if (onClearComparisons) {
        onClearComparisons(activeChar);
      } else {
        const copy = { ...comparisons };
        delete copy[activeChar];
        setComparisons(copy);
      }
      showToast(`Comparação de ${currentCharData.characterName} limpa.`);
    }
  };

  // Baseline Weapon
  const baselineWeapon = currentCharData?.weapons?.find(w => w.id === currentCharData.baselineWeaponId) || currentCharData?.weapons?.[0];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/90 border border-emerald-400 text-white font-semibold text-xs shadow-xl animate-fade-in backdrop-blur-md">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>Weapon & Build Showdown</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel tracking-wide">
            Comparador Direto de Armas & Refinamentos
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Compare o impacto percentual exato das armas selecionadas no dano final da rotação (DPR e DPS). As armas exibidas são decididas diretamente a partir da sua Análise de Dano.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenDamageAnalyzer && (
            <button
              onClick={onOpenDamageAnalyzer}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              title="Voltar para a aba de Análise de Dano"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Análise de Dano</span>
            </button>
          )}

          {currentCharData && currentCharData.weapons.length > 0 && (
            <button
              onClick={handleClearCurrent}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 font-semibold text-xs transition-colors cursor-pointer"
              title="Remover armas deste personagem da comparação"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}

          {currentCharData && currentCharData.weapons.length > 0 && (
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:brightness-110 text-white font-black text-xs shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exportando...' : 'Baixar Imagem (PNG)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State when no weapons added */}
      {(!currentCharData || currentCharData.weapons.length === 0) ? (
        <div className="p-10 sm:p-14 text-center rounded-3xl bg-[#090e17] border border-slate-800 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/5">
            <Swords className="w-8 h-8" />
          </div>
          
          <div className="max-w-lg mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-wide">
              Nenhuma Arma Selecionada
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              As armas só aparecem aqui quando você decidir quais deseja comparar a partir da <strong className="text-rose-300">Análise de Dano</strong>.
            </p>
          </div>

          <div className="p-4 max-w-md mx-auto rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2.5 text-xs">
            <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
              Como adicionar armas para o comparador:
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-300 flex-shrink-0 mt-0.5">1</span>
              <span>Acesse a aba <strong>Análise de Dano</strong> (cole seus dados ou envie sua planilha).</span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-300 flex-shrink-0 mt-0.5">2</span>
              <span>No card do personagem Carry (ex: Mavuika), clique no botão <strong>[+ Comparar Arma]</strong>.</span>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-300 flex-shrink-0 mt-0.5">3</span>
              <span>Altere a arma no site ou use <strong>[Comparar todas as armas da planilha]</strong> para comparar 2 ou mais opções lado a lado!</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onOpenDamageAnalyzer && (
              <button
                onClick={onOpenDamageAnalyzer}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-ametist-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <Flame className="w-4 h-4 text-white" />
                <span>Ir para Análise de Dano</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Character Selector Chips */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-[#0c1018] border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                Personagem Carry:
              </span>
              {availableChars.map(charKey => {
                const comp = comparisons[charKey];
                const isSelected = activeChar === charKey;

                return (
                  <button
                    key={charKey}
                    onClick={() => setSelectedChar(charKey)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <CharacterAvatar name={comp.characterName} size="xs" showBorder={false} />
                    <span>{comp.characterName}</span>
                    <span className="text-[10px] opacity-80 font-mono">({comp.weapons.length} armas)</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Nova Arma</span>
            </button>
          </div>

      {/* COMPARISON BOARD (Renderable into PNG) */}
      <div 
        ref={chartRef}
        className="p-6 sm:p-7 rounded-3xl bg-[#090e17] border border-slate-800/90 shadow-2xl space-y-6 select-none relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, #152033 0%, #090e17 80%)'
        }}
      >
        {/* Board Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <CharacterAvatar name={currentCharData.characterName} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-cinzel tracking-wider">
                  {currentCharData.characterName.toUpperCase()}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/40">
                  {currentCharData.carryArchetype}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Rotação de <strong>{currentCharData.rotationDuration}s</strong> • Ordenado pelo DPR da Equipe
              </p>
            </div>
          </div>

          {/* Current Baseline Indicator */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-right">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">
              Arma Baseline (100.0%)
            </span>
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 font-mono mt-0.5">
              <span>{baselineWeapon.name}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-950 border border-amber-500/50">
                {baselineWeapon.refinement}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {baselineWeapon.dpr.toLocaleString('pt-BR')} DPR • {baselineWeapon.dps.toLocaleString('pt-BR')} DPS
            </span>
          </div>
        </div>

        {/* Weapons Comparison List (Horizontal Bars) */}
        <div className="space-y-3.5">
          {currentCharData.weapons.map((w, idx) => {
            const diffFromBase = parseFloat((w.percentageOfBaseline - 100).toFixed(1));
            const isBase = w.isBaseline;
            const barPct = Math.min(100, Math.max(10, (w.percentageOfBaseline / 115) * 100));

            // Dynamic color badge based on performance
            let badgeBg = 'bg-slate-800 text-slate-300 border-slate-700';
            let barGradient = 'from-slate-600 to-slate-400';
            if (isBase) {
              badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
              barGradient = 'from-amber-600 via-amber-400 to-yellow-300';
            } else if (diffFromBase > 0) {
              badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
              barGradient = 'from-emerald-600 via-emerald-400 to-cyan-300';
            } else if (diffFromBase >= -10) {
              badgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
              barGradient = 'from-cyan-600 to-blue-400';
            } else if (diffFromBase >= -20) {
              badgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/50';
              barGradient = 'from-purple-600 to-indigo-400';
            } else {
              badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
              barGradient = 'from-rose-600 to-red-400';
            }

            return (
              <div 
                key={w.id}
                className={`p-3.5 rounded-2xl bg-[#0d131f] border transition-all space-y-2.5 relative ${
                  isBase ? 'border-amber-500/50 ring-1 ring-amber-500/30 bg-[#121927]' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Top Info Line */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 font-mono font-bold text-slate-500 text-xs">#{idx + 1}</span>

                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                      w.rarity === 5 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    }`}>
                      {w.rarity}★ {w.refinement}
                    </span>

                    <span className="font-bold text-sm text-white truncate">{w.name}</span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hidden sm:inline">
                      {w.subStatType}: {w.subStatValue}%
                    </span>

                    {w.notes && (
                      <span className="text-[10px] text-slate-500 font-mono truncate hidden md:inline">
                        • {w.notes}
                      </span>
                    )}
                  </div>

                  {/* Percentage & DPS Badge */}
                  <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                    <div className="text-right font-mono">
                      <span className="text-xs font-black text-slate-200 block">
                        {w.dpr.toLocaleString('pt-BR')} DPR
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {w.dps.toLocaleString('pt-BR')} DPS
                      </span>
                    </div>

                    <div className={`px-2.5 py-1 rounded-xl border font-mono font-black text-xs text-center min-w-[76px] ${badgeBg}`}>
                      {isBase ? (
                        '100.0%'
                      ) : (
                        <span>
                          {w.percentageOfBaseline}%
                          <span className="text-[9px] block font-bold">
                            {diffFromBase > 0 ? `+${diffFromBase}%` : `${diffFromBase}%`}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Relative Performance Bar */}
                <div className="space-y-1">
                  <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                    {/* 100% Benchmark Line */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10" 
                      style={{ left: `${(100 / 115) * 100}%` }}
                      title="Linha Base 100%"
                    />
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>

                {/* Weapon Action Footer */}
                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500 border-t border-slate-800/60">
                  <span className="truncate max-w-sm text-slate-400">
                    {w.passiveEffect}
                  </span>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isBase && (
                      <button
                        onClick={() => handleSetBaseline(w.id)}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 transition-colors cursor-pointer"
                        title="Definir esta arma como a base 100%"
                      >
                        Definir como Base (100%)
                      </button>
                    )}

                    {onInjectToCard && (
                      <button
                        onClick={() => handleInjectWeaponToCard(w)}
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 transition-colors cursor-pointer"
                        title="Injetar dano e arma no Card de Infográfico"
                      >
                        Injetar no Card
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteWeapon(w.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Excluir arma da comparação"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Board Watermark & Legend */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>KQM Theorycrafting Standards • Refinamentos comparados na mesma rotação</span>
          <span className="font-bold text-ametist-400 uppercase tracking-widest">
            ASTRALYS
          </span>
        </div>
      </div>
        </>
      )}

      {/* ADD WEAPON MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0d131f] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-400" />
                <span>Adicionar Arma na Comparação</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Datalist for autocomplete (filtered by character weapon type) */}
            <datalist id="comparator-weapon-list">
              {compatibleWeapons.map(w => (
                <option key={w.name} value={w.name}>{w.name} ({w.rarity}★ {WEAPON_TYPE_LABELS[w.type] || w.type})</option>
              ))}
            </datalist>

            <div className="space-y-3 text-xs font-mono">
              {allowedWeaponType && allowedWeaponType !== 'None' && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300">
                  <Swords className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>
                    Filtro ativo: <strong className="text-white">{activeChar}</strong> só pode equipar armas do tipo <strong className="text-white">{WEAPON_TYPE_LABELS[allowedWeaponType] || allowedWeaponType}</strong>.
                  </span>
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1">Nome da Arma</label>
                <input
                  type="text"
                  list="comparator-weapon-list"
                  value={newWeapon.name}
                  onChange={(e) => handleWeaponNameChange(e.target.value)}
                  placeholder={`Digite ou selecione a arma (ex: ${compatibleWeapons[0]?.name || 'Arma'})...`}
                  className={`w-full px-3 py-1.5 rounded-lg bg-slate-950 border text-white outline-none focus:border-rose-500 ${
                    weaponTypeError ? 'border-rose-500/80 ring-1 ring-rose-500/40' : 'border-slate-700'
                  }`}
                />
              </div>

              {/* Incompatible Weapon Warning */}
              {weaponTypeError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-[11px] text-rose-300 animate-fade-in">
                  <Shield className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{weaponTypeError}</span>
                </div>
              )}

              {/* Automatic Stats Notification Badge */}
              {detectedWeapon && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-[11px] text-emerald-300 animate-fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    Status oficiais detectados: <strong className="text-white">{detectedWeapon.rarity}★ {WEAPON_TYPE_LABELS[detectedWeapon.type] || detectedWeapon.type}</strong> • ATK Base <strong className="text-white">{detectedWeapon.baseAtk}</strong> • {detectedWeapon.subStatType} <strong className="text-white">{detectedWeapon.subStatValue}%</strong>
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Refinamento</label>
                  <select
                    value={newWeapon.refinement}
                    onChange={(e) => setNewWeapon({ ...newWeapon, refinement: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none"
                  >
                    <option value="R1">R1</option>
                    <option value="R2">R2</option>
                    <option value="R3">R3</option>
                    <option value="R4">R4</option>
                    <option value="R5">R5</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Raridade</label>
                  <select
                    value={newWeapon.rarity}
                    onChange={(e) => setNewWeapon({ ...newWeapon, rarity: Number(e.target.value) as any })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none"
                  >
                    <option value={5}>5★ Estrelas</option>
                    <option value={4}>4★ Estrelas</option>
                    <option value={3}>3★ Estrelas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">ATK Básico (Lv. 90)</label>
                  <input
                    type="number"
                    value={newWeapon.baseAtk}
                    onChange={(e) => setNewWeapon({ ...newWeapon, baseAtk: e.target.value })}
                    placeholder="ex: 674 ou 510"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Tipo de Substat</label>
                  <select
                    value={newWeapon.subStatType}
                    onChange={(e) => setNewWeapon({ ...newWeapon, subStatType: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none"
                  >
                    <option value="CR">Taxa Crítica (CR)</option>
                    <option value="CD">Dano Crítico (CD)</option>
                    <option value="ATK%">Ataque % (ATK%)</option>
                    <option value="EM">Proficiência Elemental (EM)</option>
                    <option value="ER%">Recarga de Energia (ER%)</option>
                    <option value="HP%">Vida % (HP%)</option>
                    <option value="DEF%">Defesa % (DEF%)</option>
                    <option value="Physical%">Dano Físico %</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">DPR (Dano por Rotação)</label>
                  <input
                    type="number"
                    value={newWeapon.dpr}
                    onChange={(e) => setNewWeapon({ ...newWeapon, dpr: e.target.value })}
                    placeholder={currentCharData?.weapons[0]?.dpr ? `ex: ${currentCharData.weapons[0].dpr.toLocaleString('pt-BR')}` : "ex: 4.500.000"}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Valor do Substat</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeapon.subStatValue}
                    onChange={(e) => setNewWeapon({ ...newWeapon, subStatValue: e.target.value })}
                    placeholder="ex: 22.1 ou 27.6"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Nota / Descrição Breve</label>
                <input
                  type="text"
                  value={newWeapon.notes}
                  onChange={(e) => setNewWeapon({ ...newWeapon, notes: e.target.value })}
                  placeholder="ex: Passe de Batalha R5 com escudo"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddWeapon}
                disabled={!!weaponTypeError}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  weaponTypeError
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                Adicionar à Comparação
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
