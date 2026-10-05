import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RotateCcw, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Info
} from 'lucide-react';
import { ERSlotConfig, ERCalculationResult, SavedTeam, FunnelTarget, FavTarget } from '../types/er';
import { ERTransferPayload } from '../types/infographic';
import { CHARACTERS_DATABASE, getCharacterERData } from '../data/characters';
import { calculateTeamER } from '../engines/erEngine';
import { CharacterAvatar } from './CharacterAvatar';

interface ERCalculatorProps {
  onTransferER: (payload: ERTransferPayload) => void;
  abyssLevel?: number;
  initialTeam?: {
    characterNames: string[];
    rotationDuration?: number;
  } | null;
  onClearInitialTeam?: () => void;
}

const STORAGE_KEY = 'astralys_er_saved_teams';
const SESSION_KEY = 'astralys_er_active_session';

export const ERCalculator: React.FC<ERCalculatorProps> = ({
  onTransferER,
  abyssLevel = 100,
  initialTeam,
  onClearInitialTeam
}) => {
  const [rotationTime, setRotationTime] = useState<number>(20);
  const [enemyParts, setEnemyParts] = useState<number>(6);
  const [teamNameInput, setTeamNameInput] = useState<string>('');
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [transferSuccess, setTransferSuccess] = useState<boolean>(false);
  const [erMargin, setErMargin] = useState<'low' | 'medium' | 'high'>(() => {
    try {
      const saved = localStorage.getItem('astralys_er_margin');
      if (saved === 'low' || saved === 'medium' || saved === 'high') return saved;
    } catch (e) {}
    return 'medium';
  });

  const getMarginMultiplier = (margin: 'low' | 'medium' | 'high') => {
    switch (margin) {
      case 'low': return 0.90;    // -10% (menos recarga / waves com muitos monstros)
      case 'medium': return 1.00; // 0% (valor exato calculado / baseline)
      case 'high': return 1.10;   // +10% (mais recarga de segurança contra chefes)
    }
  };

  const getMarginLabel = (margin: 'low' | 'medium' | 'high') => {
    switch (margin) {
      case 'low': return 'Baixa (-10%)';
      case 'medium': return 'Média (0%)';
      case 'high': return 'Alta (+10%)';
    }
  };

  const [slots, setSlots] = useState<ERSlotConfig[]>([
    { id: 1, name: "Mavuika", e_uses: 1, funnel: "Dividir (50% Slot 3 / 50% Slot 4)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.50, use_burst: false },
    { id: 2, name: "Citlali", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.15, use_burst: true },
    { id: 3, name: "Iansan", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 12, onfield: 0.15, use_burst: true },
    { id: 4, name: "Bennett", e_uses: 1, funnel: "Ele mesmo (Em campo)", fav: 0, fav_target: "Ele mesmo (Em campo)", flat: 0, onfield: 0.20, use_burst: true }
  ]);

  // Load saved teams & active session on mount
  useEffect(() => {
    try {
      const rawSaved = localStorage.getItem(STORAGE_KEY);
      if (rawSaved) setSavedTeams(JSON.parse(rawSaved));

      const rawSession = localStorage.getItem(SESSION_KEY);
      if (rawSession) {
        const session = JSON.parse(rawSession);
        if (session.slots && session.slots.length === 4) {
          setSlots(session.slots);
          setRotationTime(session.rotationTime || 20);
          setEnemyParts(session.enemyParts !== undefined ? session.enemyParts : 6);
        }
      }
    } catch (e) {}
  }, []);

  // Synchronize team when sent from Infographic Card
  useEffect(() => {
    if (initialTeam && initialTeam.characterNames && initialTeam.characterNames.length >= 4) {
      setSlots(prev => prev.map((s, idx) => {
        const name = initialTeam.characterNames[idx] || s.name;
        const charData = getCharacterERData(name);
        return {
          ...s,
          name,
          custom_part: charData.particles,
          use_burst: charData.burst_cost > 0
        };
      }));
      if (initialTeam.rotationDuration && initialTeam.rotationDuration > 0) {
        setRotationTime(initialTeam.rotationDuration);
      }
      onClearInitialTeam?.();
    }
  }, [initialTeam, onClearInitialTeam]);

  // Save active session on changes
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        rotationTime,
        enemyParts,
        slots
      }));
    } catch (e) {}
  }, [rotationTime, enemyParts, slots]);

  // Calculations
  const results: ERCalculationResult[] = calculateTeamER(slots, rotationTime, enemyParts);

  // Update Slot Parameter
  const handleSlotChange = (idx: number, patch: Partial<ERSlotConfig>) => {
    const updated = [...slots];
    updated[idx] = { ...updated[idx], ...patch };
    setSlots(updated);
  };

  // Change Character
  const handleCharSelect = (idx: number, charName: string) => {
    const charData = getCharacterERData(charName);
    const updated = [...slots];
    updated[idx] = {
      ...updated[idx],
      name: charName,
      custom_part: charData.particles,
      use_burst: charData.burst_cost > 0
    };
    setSlots(updated);
  };

  // Save Team
  const handleSaveTeam = () => {
    const name = teamNameInput.trim() || `${slots[0].name} + ${slots[1].name} + ${slots[2].name} + ${slots[3].name}`;
    const newTeam: SavedTeam = {
      id: Date.now(),
      name,
      rotationTime,
      enemyParts,
      slots: JSON.parse(JSON.stringify(slots))
    };
    const updated = [newTeam, ...savedTeams];
    setSavedTeams(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTeamNameInput('');
  };

  // Load Team
  const handleLoadTeam = (team: SavedTeam) => {
    setSlots(JSON.parse(JSON.stringify(team.slots)));
    setRotationTime(team.rotationTime || 20);
    setEnemyParts(team.enemyParts !== undefined ? team.enemyParts : 6);
  };

  // Delete Team
  const handleDeleteTeam = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedTeams.filter(t => t.id !== id);
    setSavedTeams(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Export / Import Backup JSON
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedTeams, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "astralys_times_er.json";
    a.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const merged = [...imported, ...savedTeams.filter(s => !imported.some(i => i.id === s.id))];
          setSavedTeams(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      } catch (err) {}
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Bridge Action: Transfer calculated ER to Infographic Card
  const handleTransferToCard = () => {
    const mult = getMarginMultiplier(erMargin);
    const payload: ERTransferPayload = {
      source: 'er_calculator',
      timestamp: Date.now(),
      rotationSeconds: rotationTime,
      targets: slots.map((s, idx) => {
        const res = results[idx];
        const finalER = Math.max(1.0, res.neededER * mult);
        const valPct = Math.round(finalER * 100);
        return {
          slotIndex: idx,
          characterName: s.name,
          erTargetPct: finalER * 100,
          erTargetLabel: s.use_burst ? `${valPct} ER` : '100 ER'
        };
      })
    };

    onTransferER(payload);
    setTransferSuccess(true);
    setTimeout(() => setTransferSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header Banner with 3-Step Guide */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5" />
            Cálculo Preciso de Partículas & Rotação
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-cinzel">
            Calculadora de Recarga de Energia (ER)
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Descubra a porcentagem exata de <strong>Recarga de Energia (ER%)</strong> necessária para cada personagem ultar a cada ciclo sem faltar energia, considerando absorção de partículas no campo/fora dele, armas Favonius e margem de Boss.
          </p>
        </div>

        {/* 3-Step Flow Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
            <span className="font-bold text-amber-400 font-mono text-[11px]">PASSO 1: HERÓIS</span>
            <p className="text-slate-400 text-[11px]">Selecione os 4 integrantes ou clique em "Simular ER" direto no seu Card.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
            <span className="font-bold text-cyan-400 font-mono text-[11px]">PASSO 2: HABILIDADES</span>
            <p className="text-slate-400 text-[11px]">Ajuste quem usa Ultimate (Q), usos do E e quem ativa armas Favonius.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
            <span className="font-bold text-emerald-400 font-mono text-[11px]">PASSO 3: SINCRONIZAR</span>
            <p className="text-slate-400 text-[11px]">Clique em "Aplicar Metas ao Card" para injetar os números no infográfico.</p>
          </div>
        </div>
      </div>

      {/* Live Sync Bar: Shows Calculated Goals & 1-Click Transfer */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a1b2a] to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-md">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-2 flex-wrap">
              <span>Metas para o Card de Rotação</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                ⏱️ {rotationTime}s de rotação
              </span>
            </div>
            
            {/* Real-time calculated chips with selected card margin */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {slots.map((s, idx) => {
                const res = results[idx];
                const mult = getMarginMultiplier(erMargin);
                const finalER = Math.max(1.0, res.neededER * mult);
                const valPct = Math.round(finalER * 100);
                return (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-cyan-900/60 text-xs shadow-sm">
                    <CharacterAvatar name={s.name} size="xs" showElementDot={false} showBorder={false} />
                    <span className="font-semibold text-slate-200">{s.name}:</span>
                    <span className="font-mono font-black text-cyan-400">
                      {s.use_burst ? `${valPct}% ER` : '100%'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Margin Selector + Transfer Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
          
          {/* Margem do Card: Baixa | Média | Alta */}
          <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider flex items-center gap-1" title="Esta margem altera apenas o valor que é enviado para o card">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Margem do Card:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setErMargin('low');
                  localStorage.setItem('astralys_er_margin', 'low');
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  erMargin === 'low'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Margem Baixa (-10%) — Redução na exigência de recarga para cenários com muitos monstros e alta geração de orbes"
              >
                Baixa (-10%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setErMargin('medium');
                  localStorage.setItem('astralys_er_margin', 'medium');
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  erMargin === 'medium'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Margem Média (0%) — Recarga exata calculada para rotação perfeita sem perda de partículas"
              >
                Média (0%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setErMargin('high');
                  localStorage.setItem('astralys_er_margin', 'high');
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  erMargin === 'high'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Margem Alta (+10%) — Margem de segurança extra para Chefes com baixa geração de energia"
              >
                Alta (+10%)
              </button>
            </div>
          </div>

          {/* Transfer Button */}
          <button
            onClick={handleTransferToCard}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm shadow-lg hover:shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer flex-shrink-0"
            title={`Aplicar metas calculadas com margem ${getMarginLabel(erMargin)} ao card de rotação`}
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Aplicar Metas ao Card</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/20 text-slate-950 font-extrabold uppercase">
              {getMarginLabel(erMargin)}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>

      {/* Preset & Save Manager Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nome do seu time..."
              value={teamNameInput}
              onChange={(e) => setTeamNameInput(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs outline-none focus:border-amber-500 w-48 sm:w-60"
            />
            <button
              onClick={handleSaveTeam}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Time
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Backup JSON
            </button>
            <label className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer">
              <Upload className="w-3 h-3" />
              Importar
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* Saved Teams Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <Save className="w-3 h-3 text-amber-400" />
            Times Salvos:
          </span>

          {savedTeams.length === 0 ? (
            <span className="text-[11px] text-slate-500 italic">
              Nenhum time salvo no momento. Digite um nome acima e clique em &quot;Salvar Time&quot;.
            </span>
          ) : (
            savedTeams.map(saved => (
              <div
                key={saved.id}
                onClick={() => handleLoadTeam(saved)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px] font-medium cursor-pointer hover:bg-amber-950/70 hover:border-amber-400 transition-all shadow-sm group"
                title={`Carregar time "${saved.name}"`}
              >
                <span>💾 {saved.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteTeam(saved.id, e)}
                  title="Excluir este time salvo"
                  className="p-0.5 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 ml-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Global Rotation Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">⏱️ Duração da Rotação:</span>
            <input
              type="number"
              min={10}
              max={60}
              value={rotationTime}
              onChange={(e) => setRotationTime(parseFloat(e.target.value) || 20)}
              className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-center font-bold text-white outline-none focus:border-amber-500"
            />
            <span className="text-slate-500">segundos</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">👾 Partículas de Monstros (HP Drops):</span>
            <input
              type="number"
              min={0}
              max={30}
              value={enemyParts}
              onChange={(e) => setEnemyParts(parseFloat(e.target.value) || 0)}
              className="w-14 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-center font-bold text-white outline-none focus:border-amber-500"
            />
            <span className="text-slate-500">(Padrão Abismo 12: 6)</span>
          </div>
        </div>

        <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Auto-Save Ativo no Navegador
        </div>
      </div>

      {/* 4 INTERACTIVE SLOTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {slots.map((slot, idx) => {
          const charData = getCharacterERData(slot.name);
          const result = results[idx];
          const partsPerUse = slot.custom_part !== undefined ? slot.custom_part : charData.particles;

          return (
            <div 
              key={slot.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-mono font-bold text-slate-400">SLOT {slot.id}</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                    {charData.element}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300">
                    Custo: {charData.burst_cost}
                  </span>
                </div>
              </div>

              {/* Character Selector with Real Portrait */}
              <div className="flex items-center gap-3">
                <CharacterAvatar name={slot.name} element={charData.element} size="md" />
                <select
                  value={slot.name}
                  onChange={(e) => handleCharSelect(idx, e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-white outline-none focus:border-amber-500 cursor-pointer"
                >
                  {CHARACTERS_DATABASE.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.element})
                    </option>
                  ))}
                </select>
              </div>

              {/* ER RESULT CARD (Cálculo Puro da Rotação) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-900/40 text-center space-y-1">
                <div className="text-3xl font-extrabold font-mono tracking-tight text-cyan-400">
                  {slot.use_burst ? `${(result.neededER * 100).toFixed(1)}%` : '100.0%'}
                </div>
                <div className="text-[11px] font-bold">
                  {result.statusLabel}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {slot.use_burst 
                    ? `Cálculo exato • Custo: ${charData.burst_cost} • Partículas base: ${result.totalBaseEnergy.toFixed(1)}`
                    : 'Foque 100% em atributos ofensivos (Crit / Dano)'
                  }
                </div>
              </div>

              {/* Input Parameters */}
              <div className="space-y-2.5 text-xs text-slate-300">
                
                {/* Uses Burst */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Usa a Ultimate (Q)?</span>
                  <select
                    value={slot.use_burst ? 'true' : 'false'}
                    onChange={(e) => handleSlotChange(idx, { use_burst: e.target.value === 'true' })}
                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-semibold text-white outline-none"
                  >
                    <option value="true">Sim (Todo ciclo)</option>
                    <option value="false">Não (Ignorar ER)</option>
                  </select>
                </div>

                {/* E Uses */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Usos da Habilidade (E):</span>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    value={slot.e_uses}
                    onChange={(e) => handleSlotChange(idx, { e_uses: parseFloat(e.target.value) || 0 })}
                    className="w-14 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-center font-bold text-white outline-none"
                  />
                </div>

                {/* Particles generated */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Partículas por E:</span>
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={25}
                    value={partsPerUse}
                    onChange={(e) => handleSlotChange(idx, { custom_part: parseFloat(e.target.value) || 0 })}
                    className="w-14 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-center font-bold text-white outline-none"
                  />
                </div>

                {/* Funneling Target */}
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 text-[11px]">Quem absorve partículas do E:</span>
                  <select
                    value={slot.funnel}
                    onChange={(e) => handleSlotChange(idx, { funnel: e.target.value as FunnelTarget })}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-semibold text-white outline-none"
                  >
                    <option value="Ele mesmo (Em campo)">Ele mesmo (Em campo)</option>
                    <option value="Passar p/ Slot 1">Passar p/ Slot 1</option>
                    <option value="Passar p/ Slot 2">Passar p/ Slot 2</option>
                    <option value="Passar p/ Slot 3">Passar p/ Slot 3</option>
                    <option value="Passar p/ Slot 4">Passar p/ Slot 4</option>
                    <option value="Dividir (50% Slot 3 / 50% Slot 4)">Dividir (50% Slot 3 / 50% Slot 4)</option>
                    <option value="Dividir (50% Slot 1 / 50% Slot 2)">Dividir (50% Slot 1 / 50% Slot 2)</option>
                    <option value="Fora de campo (Dividido)">Fora de campo (Dividido)</option>
                  </select>
                </div>

                {/* Favonius Procs */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ativações Favonius:</span>
                  <input
                    type="number"
                    min={0}
                    max={3}
                    value={slot.fav}
                    onChange={(e) => handleSlotChange(idx, { fav: parseFloat(e.target.value) || 0 })}
                    className="w-14 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-center font-bold text-white outline-none"
                  />
                </div>

                {/* Favonius Target */}
                {slot.fav > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-[11px]">Quem absorve Favonius:</span>
                    <select
                      value={slot.fav_target}
                      onChange={(e) => handleSlotChange(idx, { fav_target: e.target.value as FavTarget })}
                      className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-semibold text-white outline-none"
                    >
                      <option value="Ele mesmo (Em campo)">Ele mesmo (Em campo)</option>
                      <option value="Passar p/ Slot 1">Passar p/ Slot 1</option>
                      <option value="Passar p/ Slot 2">Passar p/ Slot 2</option>
                      <option value="Passar p/ Slot 3">Passar p/ Slot 3</option>
                      <option value="Passar p/ Slot 4">Passar p/ Slot 4</option>
                    </select>
                  </div>
                )}

                {/* Flat Energy */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Energia Fixa (Flat):</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={slot.flat}
                    onChange={(e) => handleSlotChange(idx, { flat: parseFloat(e.target.value) || 0 })}
                    className="w-14 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-center font-bold text-white outline-none"
                  />
                </div>

                {/* On-field % */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tempo em Campo (%):</span>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    step={5}
                    value={Math.round(slot.onfield * 100)}
                    onChange={(e) => handleSlotChange(idx, { onfield: (parseFloat(e.target.value) || 15) / 100 })}
                    className="w-14 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-center font-bold text-white outline-none"
                  />
                </div>

              </div>

              {/* Energy Breakdown Mini-Box */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] space-y-1 font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Habilidades:</span>
                  <span className="text-slate-200">{result.baseFromSkills.toFixed(1)}</span>
                </div>
                {result.baseFromFav > 0 && (
                  <div className="flex justify-between text-amber-300">
                    <span>Favonius:</span>
                    <span>+{result.baseFromFav.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Drops Monstros:</span>
                  <span className="text-slate-200">{result.baseFromEnemies.toFixed(1)}</span>
                </div>
                {result.flatEnergy > 0 && (
                  <div className="flex justify-between text-cyan-300">
                    <span>Energia Flat:</span>
                    <span>+{result.flatEnergy.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-white">
                  <span>Total Base:</span>
                  <span>{result.totalBaseEnergy.toFixed(1)}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
