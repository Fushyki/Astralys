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
        backgroundColor: '#1b1a17',
        filter: (node: HTMLElement) => !(node && node.dataset && node.dataset.noExport)
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

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-semibold text-slate-50 font-cinzel">Comparador de armas</h1>
          <p className="text-slate-400 mt-1 max-w-xl">
            Quanto cada arma muda o dano da rotação. As armas vêm da Análise de Dano.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDamageAnalyzer && (
            <button
              onClick={onOpenDamageAnalyzer}
              className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm cursor-pointer transition-colors"
            >
              Voltar à análise
            </button>
          )}
          {currentCharData && currentCharData.weapons.length > 0 && (
            <button
              onClick={handleClearCurrent}
              className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm cursor-pointer transition-colors"
              title="Remover as armas deste personagem da comparação"
            >
              Limpar
            </button>
          )}
          {currentCharData && currentCharData.weapons.length > 0 && (
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-400 hover:bg-purple-300 text-slate-950 text-sm font-semibold cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exportando...' : 'Baixar PNG'}
            </button>
          )}
        </div>
      </div>

      {(!currentCharData || currentCharData.weapons.length === 0) ? (
        <div className="rounded-xl border border-dashed border-slate-700 px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold text-slate-50 font-cinzel">Nenhuma arma para comparar</h2>
          <p className="text-slate-400 mt-2 max-w-md mx-auto">
            Na Análise de Dano, clique em "Comparar arma" no card do personagem. Para comparar várias armas de uma vez, importe uma planilha com variantes.
          </p>
          {onOpenDamageAnalyzer && (
            <button
              onClick={onOpenDamageAnalyzer}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-400 hover:bg-purple-300 text-slate-950 text-sm font-semibold cursor-pointer transition-colors"
            >
              Ir para a Análise de Dano
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Seleção do carry */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {availableChars.map(charKey => {
                const comp = comparisons[charKey];
                const isSelected = activeChar === charKey;
                return (
                  <button
                    key={charKey}
                    onClick={() => setSelectedChar(charKey)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-700 text-slate-50'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <CharacterAvatar name={comp.characterName} size="xs" showBorder={false} showElementDot={false} />
                    {comp.characterName}
                    <span className="text-slate-500 font-mono">{comp.weapons.length}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-100 text-sm cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar arma
            </button>
          </div>

          {/* Card de comparação (é isto que vira PNG) */}
          <div
            ref={chartRef}
            className="rounded-xl bg-slate-900 border border-slate-800 p-7 select-none"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <CharacterAvatar name={currentCharData.characterName} size="lg" showElementDot={false} />
                <div>
                  <h2 className="text-3xl font-semibold text-slate-50 font-cinzel leading-tight">
                    {currentCharData.characterName}
                  </h2>
                  <p className="text-sm text-slate-400">
                    Rotação de {currentCharData.rotationDuration}s
                    {currentCharData.carryArchetype ? ` · ${currentCharData.carryArchetype}` : ''}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">Base (100%)</p>
                <p className="text-lg font-semibold text-purple-300">
                  {baselineWeapon.name} <span className="text-slate-400 font-mono text-sm">{baselineWeapon.refinement}</span>
                </p>
                <p className="text-sm text-slate-400 font-mono">
                  {baselineWeapon.dpr.toLocaleString('pt-BR')} dano · {baselineWeapon.dps.toLocaleString('pt-BR')} DPS
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {currentCharData.weapons.map((w, idx) => {
                const diffFromBase = parseFloat((w.percentageOfBaseline - 100).toFixed(1));
                const isBase = w.isBaseline;
                const barPct = Math.min(100, Math.max(6, (w.percentageOfBaseline / 115) * 100));

                let barColor = '#d4a24c';
                let deltaClass = 'text-purple-300';
                if (!isBase) {
                  if (diffFromBase > 0) { barColor = '#7ba166'; deltaClass = 'text-emerald-400'; }
                  else if (diffFromBase >= -10) { barColor = '#5f9bb5'; deltaClass = 'text-cyan-300'; }
                  else { barColor = '#d27a62'; deltaClass = 'text-rose-400'; }
                }

                return (
                  <div key={w.id} className="py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <div className="flex items-baseline gap-3 min-w-0">
                        <span className="font-mono text-sm text-slate-500 w-5">{idx + 1}</span>
                        <span className="text-xl font-semibold text-slate-50 truncate">{w.name}</span>
                        <span className="text-sm text-slate-400 font-mono">
                          {w.rarity}★ {w.refinement}
                        </span>
                        <span className="text-sm text-slate-500 hidden md:inline">
                          {w.subStatType} {w.subStatValue}%
                        </span>
                      </div>

                      <div className="flex items-baseline gap-5">
                        <span className="text-sm text-slate-400 font-mono">
                          {w.dpr.toLocaleString('pt-BR')} · {w.dps.toLocaleString('pt-BR')} DPS
                        </span>
                        <span className={`text-2xl font-semibold font-mono w-24 text-right ${deltaClass}`}>
                          {isBase ? 'Base' : `${diffFromBase > 0 ? '+' : '−'}${Math.abs(diffFromBase)}%`}
                        </span>
                      </div>
                    </div>

                    <div className="relative h-3 mt-3 bg-slate-950 rounded-sm">
                      <div className="h-full rounded-sm" style={{ width: `${barPct}%`, backgroundColor: barColor }} />
                      <div
                        className="absolute -top-1 -bottom-1 w-0.5 bg-slate-100/70"
                        style={{ left: `${(100 / 115) * 100}%` }}
                        title="100%"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-2.5">
                      <p className="text-sm text-slate-400 truncate">{w.passiveEffect}</p>
                      <div className="flex items-center gap-3 flex-shrink-0 text-sm" data-no-export="true">
                        {!isBase && (
                          <button
                            onClick={() => handleSetBaseline(w.id)}
                            className="text-slate-400 hover:text-purple-300 cursor-pointer transition-colors"
                            title="Usar esta arma como base de 100%"
                          >
                            Definir como base
                          </button>
                        )}
                        {onInjectToCard && (
                          <button
                            onClick={() => handleInjectWeaponToCard(w)}
                            className="text-slate-400 hover:text-purple-300 cursor-pointer transition-colors"
                            title="Enviar esta arma para o card infográfico"
                          >
                            Enviar ao card
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteWeapon(w.id)}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                          title="Remover da comparação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-sm text-slate-500">
              <span>Todas as armas na mesma rotação</span>
              <span className="font-cinzel font-semibold text-slate-300">Astralys</span>
            </div>
          </div>
        </>
      )}

      {/* ADD WEAPON MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
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
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300">
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
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-300 animate-fade-in">
                  <Shield className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{weaponTypeError}</span>
                </div>
              )}

              {/* Automatic Stats Notification Badge */}
              {detectedWeapon && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 animate-fade-in">
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
