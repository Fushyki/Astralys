import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Flame, 
  Upload, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  ChevronRight, 
  Activity, 
  CheckCircle2, 
  Edit3, 
  Check, 
  RotateCw, 
  Sliders, 
  Shield, 
  Sword, 
  Swords,
  FolderGit2,
  Clock,
  BarChart3
} from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import { DamageAnalysisResult, DamageHit, CharacterStatSnapshot } from '../types/damageBreakdown';
import { parseDamageText, parseDamageWorkbook } from '../engines/damageSheetParser';
import { InfographicCardData } from '../types/infographic';
import { CHARACTERS_DATABASE, getCharacterERData } from '../data/characters';
import { DamageFormulaModal } from './DamageFormulaModal';
import { explainDamageHit, DamageBreakdownDetails } from '../engines/damageFormulaEngine';
import { Calculator } from 'lucide-react';
import { CharacterWeaponComparison, WeaponOption } from '../types/weaponComparison';
import { getWeaponData, WEAPONS_DATABASE } from '../data/weapons';

interface DamageAnalyzerProps {
  onExportToCard: (cardData: InfographicCardData) => void;
  onSendTeamToER: (characterNames: string[], duration?: number) => void;
  onOpenWeaponComparator?: () => void;
  weaponComparisons?: Record<string, CharacterWeaponComparison>;
  onAddWeaponToComparison?: (
    charName: string,
    weaponData: {
      name: string;
      refinement?: string;
      dpr: number;
      dps: number;
      rarity?: 3 | 4 | 5;
      notes?: string;
      subStatType?: WeaponOption['subStatType'];
      subStatValue?: number;
      baseAtk?: number;
    },
    rotationDuration?: number,
    carryArchetype?: string
  ) => void;
  onRemoveWeaponFromComparison?: (charName: string, weaponId: string) => void;
  onAddMultipleVariantsToComparison?: (variants: DamageAnalysisResult[]) => void;
  onSaveToVault?: (calc: DamageAnalysisResult) => void;
  onOpenWarRoom?: (calc?: DamageAnalysisResult) => void;
  externalCalculation?: DamageAnalysisResult | null;
  onClearExternalCalculation?: () => void;
}

export const DamageAnalyzer: React.FC<DamageAnalyzerProps> = ({
  onExportToCard,
  onSendTeamToER,
  onOpenWeaponComparator,
  weaponComparisons,
  onAddWeaponToComparison,
  onRemoveWeaponFromComparison,
  onAddMultipleVariantsToComparison,
  onSaveToVault,
  onOpenWarRoom,
  externalCalculation,
  onClearExternalCalculation
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'paste' | 'file'>('paste');
  
  // Persistent Raw Text
  const [rawText, setRawText] = useState<string>(() => {
    try {
      return localStorage.getItem('astralys_damage_raw_text') || '';
    } catch {
      return '';
    }
  });

  // Persistent Excel Workbook Data
  const [workbookData, setWorkbookData] = useState<Record<string, DamageAnalysisResult[]> | null>(() => {
    try {
      const saved = localStorage.getItem('astralys_damage_workbook_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [selectedSheet, setSelectedSheet] = useState<string>(() => {
    try {
      return localStorage.getItem('astralys_damage_selected_sheet') || '';
    } catch {
      return '';
    }
  });

  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('astralys_damage_selected_variant');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Persistent Calculation Snapshot
  const [parsedResult, setParsedResult] = useState<DamageAnalysisResult | null>(() => {
    try {
      const saved = localStorage.getItem('astralys_damage_parsed_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [backupResult, setBackupResult] = useState<DamageAnalysisResult | null>(() => {
    try {
      const saved = localStorage.getItem('astralys_damage_backup_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync external calculation when opened from Vault
  React.useEffect(() => {
    if (externalCalculation) {
      setParsedResult(externalCalculation);
      setBackupResult(externalCalculation);
      if (onClearExternalCalculation) {
        onClearExternalCalculation();
      }
    }
  }, [externalCalculation, onClearExternalCalculation]);

  // Filters for hit breakdown
  const [selectedCharFilter, setSelectedCharFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Edit Mode States
  const [isGlobalEditMode, setIsGlobalEditMode] = useState<boolean>(false);
  const [editingCharIdx, setEditingCharIdx] = useState<number | null>(null);

  // Save Raw Text to localStorage
  React.useEffect(() => {
    try {
      if (rawText) {
        localStorage.setItem('astralys_damage_raw_text', rawText);
      } else {
        localStorage.removeItem('astralys_damage_raw_text');
      }
    } catch (e) {
      console.warn('Failed to save raw text:', e);
    }
  }, [rawText]);

  // Save Parsed Calculation to localStorage
  React.useEffect(() => {
    try {
      if (parsedResult) {
        localStorage.setItem('astralys_damage_parsed_result', JSON.stringify(parsedResult));
      } else {
        localStorage.removeItem('astralys_damage_parsed_result');
      }
    } catch (e) {
      console.warn('Failed to save parsed damage result:', e);
    }
  }, [parsedResult]);

  // Save Backup Calculation to localStorage
  React.useEffect(() => {
    try {
      if (backupResult) {
        localStorage.setItem('astralys_damage_backup_result', JSON.stringify(backupResult));
      } else {
        localStorage.removeItem('astralys_damage_backup_result');
      }
    } catch (e) {
      console.warn('Failed to save backup damage result:', e);
    }
  }, [backupResult]);

  // Save Workbook Data to localStorage
  React.useEffect(() => {
    try {
      if (workbookData) {
        localStorage.setItem('astralys_damage_workbook_data', JSON.stringify(workbookData));
        localStorage.setItem('astralys_damage_selected_sheet', selectedSheet);
        localStorage.setItem('astralys_damage_selected_variant', String(selectedVariantIdx));
      } else {
        localStorage.removeItem('astralys_damage_workbook_data');
        localStorage.removeItem('astralys_damage_selected_sheet');
        localStorage.removeItem('astralys_damage_selected_variant');
      }
    } catch (e) {
      console.warn('Failed to save workbook data:', e);
    }
  }, [workbookData, selectedSheet, selectedVariantIdx]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleClearAll = () => {
    setRawText('');
    setParsedResult(null);
    setBackupResult(null);
    setWorkbookData(null);
    setSelectedSheet('');
    setSelectedVariantIdx(0);
    try {
      localStorage.removeItem('astralys_damage_raw_text');
      localStorage.removeItem('astralys_damage_parsed_result');
      localStorage.removeItem('astralys_damage_backup_result');
      localStorage.removeItem('astralys_damage_workbook_data');
      localStorage.removeItem('astralys_damage_selected_sheet');
      localStorage.removeItem('astralys_damage_selected_variant');
    } catch (e) {
      console.warn(e);
    }
    showToast('Dados e planilha limpos com sucesso.');
  };

  const primaryCarry = parsedResult?.characters?.[0];
  const carryName = primaryCarry?.name || '';
  const carryWeaponsCompared = weaponComparisons && carryName ? weaponComparisons[carryName]?.weapons || [] : [];

  const handleToggleWeaponComparison = (char: CharacterStatSnapshot) => {
    if (!parsedResult) return;
    const charName = char.name;
    const existingList = weaponComparisons?.[charName]?.weapons || [];
    
    // Normalize weapon name and look up official stats automatically
    const refMatch = char.weapon.match(/\b(R[1-5])\b/i);
    const ref = refMatch ? refMatch[1].toUpperCase() : 'R1';
    const cleanName = char.weapon.replace(/\b(R[1-5])\b/i, '').trim() || char.weapon;
    const weaponLookup = getWeaponData(cleanName);
    const resolvedName = weaponLookup?.name || cleanName;

    const found = existingList.find(w => w.name.toLowerCase() === resolvedName.toLowerCase() || w.name.toLowerCase() === cleanName.toLowerCase());

    if (found) {
      if (onRemoveWeaponFromComparison) {
        onRemoveWeaponFromComparison(charName, found.id);
        showToast(`Arma "${resolvedName}" removida do Comparador.`);
      }
    } else {
      // Validate weapon type compatibility with character (e.g. Mavuika -> Claymore only)
      const charInfo = CHARACTERS_DATABASE.find(
        c => c.name.toLowerCase() === charName.toLowerCase() ||
             (c.aliases && c.aliases.some(a => a.toLowerCase() === charName.toLowerCase()))
      );
      if (charInfo && charInfo.weapon && charInfo.weapon !== 'None' && weaponLookup && weaponLookup.type !== charInfo.weapon) {
        alert(`Não é possível comparar "${weaponLookup.name}" (${weaponLookup.type}) em ${charName}, pois este personagem utiliza apenas armas do tipo ${charInfo.weapon}!`);
        return;
      }

      if (onAddWeaponToComparison) {
        onAddWeaponToComparison(
          charName,
          {
            name: resolvedName,
            refinement: ref,
            rarity: weaponLookup?.rarity,
            baseAtk: weaponLookup?.baseAtk,
            subStatType: weaponLookup?.subStatType,
            subStatValue: weaponLookup?.subStatValue,
            dpr: parsedResult.totalDpr,
            dps: parsedResult.dps,
            notes: `${charName} • ${parsedResult.comboNotation || 'Rotação'}`
          },
          parsedResult.rotationDuration,
          `${charName.toUpperCase()} WEAPON SHOWDOWN`
        );
        showToast(`Arma "${resolvedName}" adicionada ao Comparador com status oficiais!`);
      }
    }
  };

  // Handle Text parse
  const handleProcessText = () => {
    const res = parseDamageText(rawText);
    if (res && res.characters.length > 0) {
      setParsedResult(res);
      setBackupResult(JSON.parse(JSON.stringify(res)));
      showToast(`Cálculos de ${res.characters[0]?.name || 'Equipe'} processados com sucesso!`);
    } else {
      alert('Não foi possível identificar personagens e valores de dano no texto colado. Verifique se copiou as linhas corretas da planilha.');
    }
  };

  // Handle Excel upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const parsedWb = parseDamageWorkbook(wb);
      const sheetKeys = Object.keys(parsedWb);

      if (sheetKeys.length > 0) {
        setWorkbookData(parsedWb);
        setSelectedSheet(sheetKeys[0]);
        setSelectedVariantIdx(0);
        const initialRes = parsedWb[sheetKeys[0]][0];
        setParsedResult(initialRes);
        setBackupResult(JSON.parse(JSON.stringify(initialRes)));
        showToast(`Planilha carregada: ${sheetKeys.length} abas de personagens encontradas!`);
      } else {
        alert('Nenhuma aba com formato de cálculo de rotação foi detectada nesta planilha.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao ler a planilha Excel.');
    }
    e.target.value = '';
  };

  // Select Sheet / Variant from Workbook
  const handleSelectSheetVariant = (sheetName: string, vIdx: number) => {
    if (!workbookData || !workbookData[sheetName]) return;
    setSelectedSheet(sheetName);
    setSelectedVariantIdx(vIdx);
    const sel = workbookData[sheetName][vIdx] || null;
    setParsedResult(sel);
    if (sel) setBackupResult(JSON.parse(JSON.stringify(sel)));
  };

  // Update a single character's fields
  const handleUpdateCharacter = (charIdx: number, updates: Partial<CharacterStatSnapshot>) => {
    if (!parsedResult) return;
    
    const newChars = [...parsedResult.characters];
    const currentChar = newChars[charIdx];
    if (!currentChar) return;

    let newElement = currentChar.element;
    if (updates.name && updates.name !== currentChar.name) {
      const erData = getCharacterERData(updates.name);
      if (erData.element !== 'None') {
        newElement = erData.element;
      }
    }

    newChars[charIdx] = {
      ...currentChar,
      ...updates,
      element: newElement
    };

    // If totalDamage changed, recalculate DPR and percentages
    let newDpr = parsedResult.totalDpr;
    if (updates.totalDamage !== undefined && updates.totalDamage !== currentChar.totalDamage) {
      newDpr = newChars.reduce((sum, c) => sum + (c.totalDamage || 0), 0);
      newChars.forEach(c => {
        c.damagePercentage = newDpr > 0 ? parseFloat(((c.totalDamage / newDpr) * 100).toFixed(2)) : 0;
      });
    }

    const newDps = parsedResult.rotationDuration > 0 
      ? Math.round(newDpr / parsedResult.rotationDuration) 
      : parsedResult.dps;

    setParsedResult({
      ...parsedResult,
      characters: newChars,
      totalDpr: newDpr,
      dps: newDps
    });
  };

  // Update rotation metrics (duration, combo, etc.)
  const handleUpdateMetrics = (duration: number, combo?: string) => {
    if (!parsedResult) return;
    const newDuration = Math.max(1, duration);
    const newDps = Math.round(parsedResult.totalDpr / newDuration);
    setParsedResult({
      ...parsedResult,
      rotationDuration: newDuration,
      dps: newDps,
      comboNotation: combo !== undefined ? combo : parsedResult.comboNotation
    });
  };

  // Restore original parsed data
  const handleRestoreOriginal = () => {
    if (backupResult) {
      setParsedResult(JSON.parse(JSON.stringify(backupResult)));
      showToast('Status restaurados para os valores originais da planilha.');
    }
  };

  // Bridge 1: Export to Infographic Card
  const handleExportToCard = () => {
    if (!parsedResult) return;

    const carryName = parsedResult.characters[0]?.name || 'CARRY';
    const cardData: InfographicCardData = {
      teamName: parsedResult.sheetName || `${carryName.toUpperCase()} TEAM`,
      carryArchetype: carryName.toUpperCase(),
      investmentBadge: 'KQM Investment',
      statusTag: 'STC (V1 OF BETA)',
      characters: parsedResult.characters.map(c => {
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
        dps: parsedResult.dps >= 1000 ? `${(parsedResult.dps / 1000).toFixed(1)}k` : `${parsedResult.dps}`,
        dpr: parsedResult.totalDpr >= 1000000 
          ? `${(parsedResult.totalDpr / 1000000).toFixed(2)}M` 
          : parsedResult.totalDpr >= 1000 
            ? `${(parsedResult.totalDpr / 1000).toFixed(1)}k` 
            : `${parsedResult.totalDpr}`
      },
      rotationNotation: `(${parsedResult.rotationDuration}s) ${parsedResult.comboNotation || 'Rotação Padrão'}`,
      assumptions: 'Assumes standard 5-star investment',
      watermark: 'ASTRALYS'
    };

    onExportToCard(cardData);
  };

  // Bridge 2: Send to ER Calculator
  const handleSendToER = () => {
    if (!parsedResult) return;
    const names = parsedResult.characters.map(c => c.name);
    onSendTeamToER(names, parsedResult.rotationDuration);
  };

  // Filter hits
  const filteredHits = parsedResult ? parsedResult.hits.filter(hit => {
    if (selectedCharFilter !== 'all' && hit.charName !== selectedCharFilter) return false;
    if (selectedCategoryFilter !== 'all' && hit.category !== selectedCategoryFilter) return false;
    return true;
  }) : [];

  // Inspection Modal State
  const [inspectedHitDetails, setInspectedHitDetails] = useState<DamageBreakdownDetails | null>(null);

  const handleInspectHit = (hit: DamageHit) => {
    if (!parsedResult) return;
    const char = parsedResult.characters.find(c => c.name.toLowerCase() === hit.charName.toLowerCase()) 
      || parsedResult.characters[hit.charIndex];
    const details = explainDamageHit(hit, char);
    setInspectedHitDetails(details);
  };

  const handleInspectCharacterDamage = (char: CharacterStatSnapshot) => {
    const charHit = parsedResult?.hits.find(h => h.charName.toLowerCase() === char.name.toLowerCase()) || {
      id: `char-total-${char.name}`,
      label: 'Dano do Personagem',
      displayName: `Dano Total (${char.name})`,
      charName: char.name,
      charIndex: 0,
      damage: char.totalDamage,
      pctOfTotal: char.damagePercentage,
      category: 'burst' as const
    };
    const details = explainDamageHit(charHit, char);
    setInspectedHitDetails(details);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Character Autocomplete Datalist */}
      <datalist id="all-genshin-characters">
        {CHARACTERS_DATABASE.map(c => (
          <option key={c.name} value={c.name} />
        ))}
      </datalist>

      {/* Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/90 border border-emerald-400 text-white font-semibold text-xs shadow-xl animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-rose-500/30 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-300 uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Theorycraft Damage Breakdown</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel tracking-wide">
            Análise de Dano Golpe a Golpe & Rotações
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Cole os dados da sua planilha de cálculos (ou envie o arquivo <strong>.xlsx</strong>) para decompor cada golpe da rotação, <strong>editar os status dos personagens diretamente pelo site</strong> e transferir para o Card Infográfico.
          </p>
        </div>

        {/* Quick Bridges */}
        {parsedResult && (
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenWeaponComparator && (
              <button
                onClick={onOpenWeaponComparator}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md transition-all cursor-pointer"
                title="Comparar armas e opções de refinamento para o Carry"
              >
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                <span>Comparar Armas{carryWeaponsCompared.length > 0 ? ` (${carryWeaponsCompared.length})` : ''}</span>
              </button>
            )}

            <button
              onClick={handleSendToER}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs shadow-md transition-all cursor-pointer"
              title="Abrir Calculadora de ER com esta equipe"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Simular ER</span>
            </button>

            {onSaveToVault && (
              <button
                onClick={() => {
                  onSaveToVault(parsedResult);
                  showToast('Cálculo salvo no Astralys Vault com sucesso!');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/50 text-purple-300 font-bold text-xs shadow-md transition-all cursor-pointer"
                title="Salvar este cálculo no Astralys Vault"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Salvar no Vault</span>
              </button>
            )}

            {onOpenWarRoom && (
              <button
                onClick={() => onOpenWarRoom(parsedResult)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs shadow-md transition-all cursor-pointer"
                title="Abrir nos Dashboards com ranking, timeline e cenários"
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ver nos Dashboards</span>
              </button>
            )}

            <button
              onClick={handleExportToCard}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-ametist-600 hover:brightness-110 text-white font-black text-xs shadow-lg hover:shadow-rose-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              title="Gerar Card Infográfico com esta equipe e DPS"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Injetar no Card</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-5 rounded-2xl bg-[#0d111a] border border-slate-800 shadow-xl space-y-4">
        
        {/* Input Mode Selector */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveInputTab('paste')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeInputTab === 'paste'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Colar Cálculos / Tabela</span>
            </button>
            <button
              onClick={() => setActiveInputTab('file')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeInputTab === 'file'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Planilha (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PASTE */}
        {activeInputTab === 'paste' && (
          <div className="space-y-3">
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui as linhas da sua planilha (ex: com os golpes QM, FM, E, AtkT, Cr, Cd, DPS, DPR)..."
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 outline-none focus:border-rose-500 leading-relaxed placeholder:text-slate-600"
            />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Dica: Você pode copiar células inteiras no Excel ou Google Sheets e colar direto aqui.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Limpar
                </button>
                <button
                  onClick={handleProcessText}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Processar Planilha</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXCEL FILE UPLOAD */}
        {activeInputTab === 'file' && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-700 hover:border-rose-500/60 bg-slate-950/60 cursor-pointer transition-all group">
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-rose-400 mb-2 transition-colors" />
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                Selecione ou arraste seu arquivo Excel (.xlsx)
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Suporta planilhas complexas com várias abas e variantes de armas.
              </span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Sheet & Variant Selector if Workbook loaded */}
            {workbookData && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Abas detectadas na planilha:</span>
                  <span className="text-cyan-400">{Object.keys(workbookData).length} abas de rotação</span>
                </div>
                
                {/* Sheets Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Object.keys(workbookData).map(sheetName => (
                    <button
                      key={sheetName}
                      onClick={() => handleSelectSheetVariant(sheetName, 0)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedSheet === sheetName
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {sheetName}
                    </button>
                  ))}
                </div>

                {/* Variants for selected sheet */}
                {selectedSheet && workbookData[selectedSheet]?.length > 1 && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-500 font-semibold">Variantes:</span>
                      {workbookData[selectedSheet].map((v, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectSheetVariant(selectedSheet, idx)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                            selectedVariantIdx === idx
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {v.variantLabel || `Variante ${idx + 1}`}
                        </button>
                      ))}
                    </div>

                    {onAddMultipleVariantsToComparison && (
                      <button
                        onClick={() => {
                          onAddMultipleVariantsToComparison(workbookData[selectedSheet]);
                          showToast(`${workbookData[selectedSheet].length} armas adicionadas ao Comparador!`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all cursor-pointer ml-auto"
                        title="Adiciona todas as variantes de armas desta planilha diretamente ao comparador"
                      >
                        <Swords className="w-3.5 h-3.5 text-amber-400" />
                        <span>Comparar todas as {workbookData[selectedSheet].length} armas desta planilha</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* RESULTS DISPLAY */}
      {parsedResult && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-md">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">DPR (Dano por Rotação)</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400 mt-1">
                {parsedResult.totalDpr.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-md">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">DPS da Equipe</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-1">
                {parsedResult.dps.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-md">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Duração da Rotação</span>
              {isGlobalEditMode ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.5"
                    value={parsedResult.rotationDuration}
                    onChange={(e) => handleUpdateMetrics(parseFloat(e.target.value) || 20)}
                    className="w-20 px-2 py-0.5 rounded bg-slate-950 border border-rose-500 text-white font-mono font-black text-lg outline-none"
                  />
                  <span className="text-sm font-mono text-slate-400">s</span>
                </div>
              ) : (
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-200 mt-1">
                  {parsedResult.rotationDuration}s
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-md">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Carry Principal</span>
              <div className="text-xl sm:text-2xl font-black text-rose-400 mt-1 truncate">
                {parsedResult.characters[0]?.name} ({parsedResult.characters[0]?.damagePercentage}%)
              </div>
            </div>
          </div>

          {/* Active Weapon Comparison Notification Banner */}
          {carryWeaponsCompared.length > 0 && onOpenWeaponComparator && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/40 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Swords className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">Comparador de Armas:</span>
                    <span className="text-xs font-extrabold text-amber-300">
                      {carryWeaponsCompared.length} {carryWeaponsCompared.length === 1 ? 'arma selecionada' : 'armas selecionadas'} para {carryName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                    {carryWeaponsCompared.map(w => `${w.name} (${w.percentageOfBaseline}%)`).join(' • ')}
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenWeaponComparator}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex-shrink-0 ml-3"
              >
                <span>Ver Confronto</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section Header with Edit Mode Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Personagens & Status de Combate
              </h2>
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                ({parsedResult.characters.length} integrantes)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {backupResult && (
                <button
                  onClick={handleRestoreOriginal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                  title="Restaurar valores importados da planilha"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Restaurar Planilha</span>
                </button>
              )}

              <button
                onClick={() => setIsGlobalEditMode(!isGlobalEditMode)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  isGlobalEditMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40'
                }`}
              >
                {isGlobalEditMode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Concluir Edição</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Status no Site</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4 Characters Combat Cards (Interactive & Editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {parsedResult.characters.map((char, idx) => {
              const isEditingThis = isGlobalEditMode || editingCharIdx === idx;
              const charEr = CHARACTERS_DATABASE.find(
                c => c.name.toLowerCase() === char.name.toLowerCase() ||
                     (c.aliases && c.aliases.some(a => a.toLowerCase() === char.name.toLowerCase()))
              );
              const allowedWeaponType = charEr?.weapon;
              const compatibleWeapons = allowedWeaponType && allowedWeaponType !== 'None'
                ? WEAPONS_DATABASE.filter(w => w.type === allowedWeaponType)
                : WEAPONS_DATABASE;
              const weaponDatalistId = `weapon-options-${idx}-${char.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-2xl bg-[#0e121b] border flex flex-col justify-between space-y-3 shadow-lg relative transition-all ${
                    isEditingThis ? 'border-rose-500/60 ring-1 ring-rose-500/30 bg-[#121622]' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <CharacterAvatar name={char.name} element={char.element as any} size="md" />
                      
                      <div className="min-w-0 flex-1">
                        {isEditingThis ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              list="all-genshin-characters"
                              value={char.name}
                              onChange={(e) => handleUpdateCharacter(idx, { name: e.target.value })}
                              placeholder="Nome"
                              className="w-full px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-xs font-bold text-white outline-none focus:border-rose-500"
                            />
                            <input
                              type="text"
                              list={weaponDatalistId}
                              value={char.weapon}
                              onChange={(e) => handleUpdateCharacter(idx, { weapon: e.target.value })}
                              placeholder={allowedWeaponType && allowedWeaponType !== 'None' ? `Arma (${allowedWeaponType})` : "Arma"}
                              className="w-full px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] text-amber-300 outline-none focus:border-rose-500"
                            />
                            <datalist id={weaponDatalistId}>
                              {compatibleWeapons.map(w => (
                                <option key={w.name} value={w.name}>{w.name} ({w.rarity}★ {w.type})</option>
                              ))}
                            </datalist>
                            <input
                              type="text"
                              value={char.artifactSet}
                              onChange={(e) => handleUpdateCharacter(idx, { artifactSet: e.target.value })}
                              placeholder="Artefato"
                              className="w-full px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] text-slate-300 outline-none focus:border-rose-500"
                            />
                          </div>
                        ) : (
                          <>
                            <h3 className="font-bold text-sm text-white truncate">{char.name}</h3>
                            <p className="text-[10px] text-amber-300 font-medium truncate">{char.weapon}</p>
                            <p className="text-[10px] text-slate-400 truncate">{char.artifactSet}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Single Card Edit Trigger */}
                    {!isGlobalEditMode && (
                      <button
                        onClick={() => setEditingCharIdx(editingCharIdx === idx ? null : idx)}
                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          editingCharIdx === idx 
                            ? 'bg-rose-600 text-white' 
                            : 'bg-slate-950 text-slate-500 hover:text-slate-200 border border-slate-800'
                        }`}
                        title={editingCharIdx === idx ? 'Concluir' : 'Editar este personagem'}
                      >
                        {editingCharIdx === idx ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Damage Share Bar & Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">Dano Total:</span>
                      {isEditingThis ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={char.totalDamage}
                            onChange={(e) => handleUpdateCharacter(idx, { totalDamage: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-right font-black text-rose-300 text-xs outline-none focus:border-rose-500"
                          />
                          <span className="font-bold text-cyan-400 text-[11px]">{char.damagePercentage}%</span>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 cursor-pointer group/dmg"
                          onClick={() => handleInspectCharacterDamage(char)}
                          title="Clique para ver o cálculo e fórmula matemática"
                        >
                          <span className="font-black text-slate-100 group-hover/dmg:text-rose-300 transition-colors underline decoration-dotted decoration-slate-600 underline-offset-2">
                            {char.totalDamage.toLocaleString('pt-BR')}
                          </span>
                          <span className="font-bold text-cyan-400">{char.damagePercentage}%</span>
                          <Calculator className="w-3 h-3 text-slate-500 group-hover/dmg:text-rose-400 opacity-60 group-hover/dmg:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-cyan-400"
                        style={{ width: `${Math.min(100, Math.max(3, char.damagePercentage))}%` }}
                      />
                    </div>
                  </div>

                  {/* Buffed Combat Stats Grid */}
                  <div className="pt-2 border-t border-slate-800/80">
                    {isEditingThis ? (
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div>
                          <label className="text-slate-500 block mb-0.5">ATK Buffado</label>
                          <input
                            type="number"
                            value={char.totalAtk || ''}
                            onChange={(e) => handleUpdateCharacter(idx, { totalAtk: parseFloat(e.target.value) || undefined })}
                            placeholder="5800"
                            className="w-full px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5">CR / Taxa (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={char.critRate || ''}
                            onChange={(e) => handleUpdateCharacter(idx, { critRate: parseFloat(e.target.value) || undefined })}
                            placeholder="89.0"
                            className="w-full px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5">CD / Dano (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={char.critDmg || ''}
                            onChange={(e) => handleUpdateCharacter(idx, { critDmg: parseFloat(e.target.value) || undefined })}
                            placeholder="285.0"
                            className="w-full px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5">Proficiência (EM)</label>
                          <input
                            type="number"
                            value={char.elementalMastery || ''}
                            onChange={(e) => handleUpdateCharacter(idx, { elementalMastery: parseFloat(e.target.value) || undefined })}
                            placeholder="440"
                            className="w-full px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5">Bônus Dano (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={char.dmgBonus || ''}
                            onChange={(e) => handleUpdateCharacter(idx, { dmgBonus: parseFloat(e.target.value) || undefined })}
                            placeholder="182"
                            className="w-full px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5">Rolls de Recarga (ER)</label>
                          <input
                            type="number"
                            value={char.rolls?.er ?? ''}
                            onChange={(e) => {
                              const erRolls = parseFloat(e.target.value) || 0;
                              const currentRolls = char.rolls || { totalRolls: 0 };
                              handleUpdateCharacter(idx, {
                                rolls: {
                                  ...currentRolls,
                                  er: erRolls
                                }
                              });
                            }}
                            placeholder="Rolls ER"
                            className="w-full px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-cyan-300 outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                        {char.totalAtk !== undefined && (
                          <div className="p-1 rounded bg-slate-950/80 border border-slate-800/60">
                            <span className="text-slate-500 block">ATK Buffado</span>
                            <span className="font-bold text-slate-200">{char.totalAtk}</span>
                          </div>
                        )}
                        {char.critRate !== undefined && char.critDmg !== undefined && (
                          <div className="p-1 rounded bg-slate-950/80 border border-slate-800/60">
                            <span className="text-slate-500 block">Crítico</span>
                            <span className="font-bold text-slate-200">{char.critRate}% / {char.critDmg}%</span>
                          </div>
                        )}
                        {char.elementalMastery !== undefined && (
                          <div className="p-1 rounded bg-slate-950/80 border border-slate-800/60">
                            <span className="text-slate-500 block">Proficiência</span>
                            <span className="font-bold text-slate-200">{char.elementalMastery} EM</span>
                          </div>
                        )}
                        {char.dmgBonus !== undefined && (
                          <div className="p-1 rounded bg-slate-950/80 border border-slate-800/60">
                            <span className="text-slate-500 block">Bônus Dano</span>
                            <span className="font-bold text-slate-200">+{char.dmgBonus}%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Substat Rolls Snapshot */}
                  {char.rolls && !isEditingThis && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Rolls ({char.rolls.totalRolls}):</span>
                      <span className="text-cyan-400 font-bold">
                        {char.rolls.cr} CR • {char.rolls.cd} CD • {char.rolls.er} ER
                      </span>
                    </div>
                  )}

                  {/* Add to Weapon Comparator Toggle Button */}
                  {onAddWeaponToComparison && !isEditingThis && (
                    <div className="pt-2 border-t border-slate-800/80">
                      {(() => {
                        const refMatch = char.weapon.match(/\b(R[1-5])\b/i);
                        const cleanName = char.weapon.replace(/\b(R[1-5])\b/i, '').trim() || char.weapon;
                        const isCompared = weaponComparisons?.[char.name]?.weapons.some(w => w.name.toLowerCase() === cleanName.toLowerCase());
                        const compOption = weaponComparisons?.[char.name]?.weapons.find(w => w.name.toLowerCase() === cleanName.toLowerCase());

                        return (
                          <button
                            type="button"
                            onClick={() => handleToggleWeaponComparison(char)}
                            className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isCompared
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                                : 'bg-slate-950/80 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                            }`}
                            title={isCompared ? 'Arma incluída na comparação. Clique para remover.' : 'Adicionar esta arma ao Comparador de Armas'}
                          >
                            <Swords className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              {isCompared 
                                ? `✓ No Comparador ${compOption?.percentageOfBaseline ? `(${compOption.percentageOfBaseline}%)` : ''}` 
                                : '+ Comparar Arma'}
                            </span>
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hit-by-Hit Breakdown (Golpe a Golpe) */}
          <div className="p-5 rounded-2xl bg-[#0c1018] border border-slate-800 shadow-xl space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" />
                  <span>Detalhamento Golpe a Golpe ({parsedResult.hits.length} ações na rotação)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ordenado pelo maior impacto no dano total da equipe.
                </p>
              </div>

              {/* Character Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedCharFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCharFilter === 'all'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Todos
                </button>
                {parsedResult.characters.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedCharFilter(c.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedCharFilter === c.name
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Hits List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredHits.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-mono text-xs">
                  Nenhum golpe encontrado para o filtro selecionado.
                </div>
              ) : (
                filteredHits.map((hit, idx) => (
                  <div
                    key={hit.id}
                    onClick={() => handleInspectHit(hit)}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-rose-500/60 hover:bg-slate-900/90 flex items-center justify-between gap-3 transition-all text-xs cursor-pointer group"
                    title="Clique para ver a fórmula e o cálculo matemático deste golpe"
                  >
                    {/* Rank & Character */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 font-mono font-bold text-slate-500 text-[11px]">#{idx + 1}</span>
                      <CharacterAvatar name={hit.charName} size="xs" showBorder={false} />
                      <div className="min-w-0 truncate">
                        <span className="font-bold text-slate-200 group-hover:text-rose-200 transition-colors mr-2">{hit.displayName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({hit.charName})</span>
                      </div>
                    </div>

                    {/* Progress Bar & Value & Calculator Badge */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-24 sm:w-36 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 hidden sm:block">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
                          style={{ width: `${Math.min(100, Math.max(3, hit.pctOfTotal * 2.5))}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="font-mono font-black text-rose-300 group-hover:text-rose-200 text-right w-24">
                          {hit.damage.toLocaleString('pt-BR')}
                        </span>
                        <Calculator className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 transition-colors" />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-400 w-12 text-right">
                        {hit.pctOfTotal}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      )}

      {/* Damage Formula Inspector Modal */}
      <DamageFormulaModal
        details={inspectedHitDetails}
        onClose={() => setInspectedHitDetails(null)}
      />

    </div>
  );
};
