import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Sparkles, 
  Zap, 
  Swords, 
  ArrowLeftRight, 
  Layers, 
  Award,
  Edit3, 
  Check, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Sliders, 
  RotateCcw,
  CheckCircle2,
  X
} from 'lucide-react';
import { RotationTimelineData, TimelineAction, BuffTrack, ActionType } from '../types/rotationTimeline';
import { CharacterAvatar } from './CharacterAvatar';
import { 
  calculateBuffCoverageEfficiency, 
  computeBuffsForTimeline, 
  syncBuffsToActions, 
  autoSequenceActions,
  CharacterMoveOption,
  getCharacterMoveOptions
} from '../engines/timelineEngine';

interface RotationTimelineProps {
  timeline: RotationTimelineData;
  characters: Array<{ 
    name: string; 
    element: string; 
    weapon?: string; 
    artifactSet?: string; 
    totalDamage?: number;
    damagePercentage?: number;
  }>;
  carryIndex?: number;
  onSelectAction?: (action: TimelineAction) => void;
  onChangeTimeline?: (updatedTimeline: RotationTimelineData) => void;
}

export const RotationTimeline: React.FC<RotationTimelineProps> = ({
  timeline,
  characters,
  carryIndex = 0,
  onSelectAction,
  onChangeTimeline
}) => {
  const [actions, setActions] = useState<TimelineAction[]>(() => timeline.actions || []);
  const [totalDuration, setTotalDuration] = useState<number>(() => timeline.totalDuration > 0 ? timeline.totalDuration : 20);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showActionTable, setShowActionTable] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state if team or project timeline changes from outside
  useEffect(() => {
    setActions(timeline.actions || []);
    setTotalDuration(timeline.totalDuration > 0 ? timeline.totalDuration : 20);
  }, [timeline]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Dynamically compute live buffs based on real action timings
  const liveBuffs = useMemo(() => {
    return computeBuffsForTimeline(actions, characters, totalDuration);
  }, [actions, characters, totalDuration]);

  // Sync active buffs to actions
  const liveActionsWithBuffs = useMemo(() => {
    const copy = actions.map(a => ({ ...a }));
    syncBuffsToActions(copy, liveBuffs);
    return copy;
  }, [actions, liveBuffs]);

  const liveTimeline: RotationTimelineData = {
    totalDuration,
    actions: liveActionsWithBuffs,
    buffs: liveBuffs
  };

  const efficiency = calculateBuffCoverageEfficiency(liveTimeline, carryIndex);

  // Time markers (every 2s or 4s)
  const markerStep = totalDuration <= 20 ? 2 : 4;
  const timeMarkers: number[] = [];
  for (let t = 0; t <= totalDuration; t += markerStep) {
    timeMarkers.push(t);
  }
  if (timeMarkers[timeMarkers.length - 1] !== totalDuration) {
    timeMarkers.push(totalDuration);
  }

  const selectedAction = liveActionsWithBuffs.find(a => a.id === selectedActionId) || null;

  // Commit changes to parent and localStorage
  const commitUpdate = (newActions: TimelineAction[], newDuration: number) => {
    setActions(newActions);
    setTotalDuration(newDuration);

    const calculatedBuffs = computeBuffsForTimeline(newActions, characters, newDuration);
    const actionsWithBuffs = newActions.map(a => ({ ...a }));
    syncBuffsToActions(actionsWithBuffs, calculatedBuffs);

    const updatedData: RotationTimelineData = {
      totalDuration: newDuration,
      actions: actionsWithBuffs,
      buffs: calculatedBuffs
    };

    if (onChangeTimeline) {
      onChangeTimeline(updatedData);
    }
  };

  // Add Action for a specific character
  const handleAddAction = (charIdx: number, type: ActionType = 'skill', label?: string, duration: number = 1.5) => {
    const char = characters[charIdx] || characters[0];
    const charName = char?.name || 'Personagem';
    
    // Find next available start time (end of last action)
    const maxEnd = actions.length > 0 ? Math.max(...actions.map(a => a.startTime + a.duration)) : 0.0;
    const startTime = parseFloat(Math.min(totalDuration - 0.5, maxEnd).toFixed(1));

    const newAct: TimelineAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      charIndex: charIdx,
      charName,
      actionType: type,
      actionLabel: label || (type === 'burst' ? 'Q (Supremo)' : type === 'skill' ? 'E (Habilidade)' : type === 'swap' ? 'Swap In' : 'Combo Normal'),
      startTime,
      duration,
      damage: Math.round((char?.totalDamage || 100000) * 0.2)
    };

    const updated = [...actions, newAct].sort((a, b) => a.startTime - b.startTime);
    commitUpdate(updated, totalDuration);
    setSelectedActionId(newAct.id);
    showToast(`Ação adicionada para ${charName}`);
  };

  // Update single action field
  const handleUpdateAction = (actionId: string, updates: Partial<TimelineAction>) => {
    const updated = actions.map(a => {
      if (a.id === actionId) {
        const next = { ...a, ...updates };
        if (updates.charIndex !== undefined && characters[updates.charIndex]) {
          next.charName = characters[updates.charIndex].name;
        }
        return next;
      }
      return a;
    });
    commitUpdate(updated, totalDuration);
  };

  // Delete Action (Reliable with stopPropagation)
  const handleDeleteAction = (e: React.MouseEvent, actionId: string) => {
    e.stopPropagation();
    const updated = actions.filter(a => a.id !== actionId);
    if (selectedActionId === actionId) {
      setSelectedActionId(null);
    }
    commitUpdate(updated, totalDuration);
    showToast('Golpe excluído da rotação');
  };

  // Switch selected action to another strike of the character
  const handleSwitchActionStrike = (move: CharacterMoveOption) => {
    if (!selectedActionId) return;
    const currentAction = actions.find(a => a.id === selectedActionId);
    if (!currentAction) return;

    const char = characters[currentAction.charIndex] || characters[0];
    const charTotal = char?.totalDamage || 100000;
    const newDamage = Math.round(charTotal * (move.damageMultiplier ?? 0.25));

    handleUpdateAction(selectedActionId, {
      actionType: move.type,
      actionLabel: move.label,
      duration: move.duration,
      damage: newDamage > 0 ? newDamage : currentAction.damage
    });

    showToast(`Golpe alterado para: ${move.label}`);
  };

  // Move action up / down in sequence
  const handleMoveAction = (e: React.MouseEvent, index: number, direction: 'up' | 'down') => {
    e.stopPropagation();
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= actions.length) return;

    const copy = [...actions];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;

    // Swap start times to keep smooth chronological order
    const tempTime = copy[index].startTime;
    copy[index].startTime = copy[newIdx].startTime;
    copy[newIdx].startTime = tempTime;

    commitUpdate(copy, totalDuration);
  };

  // Auto-chain actions without overlapping
  const handleAutoCascade = () => {
    const cascaded = autoSequenceActions(actions);
    const maxEnd = cascaded.length > 0 ? Math.max(...cascaded.map(a => a.startTime + a.duration)) : totalDuration;
    const newDur = Math.max(totalDuration, parseFloat(maxEnd.toFixed(1)));
    commitUpdate(cascaded, newDur);
    showToast('Ações encadeadas em sequência');
  };

  // Snap duration to end of last action
  const handleSnapDuration = () => {
    if (actions.length === 0) return;
    const maxEnd = Math.max(...actions.map(a => a.startTime + a.duration));
    const snapped = parseFloat(maxEnd.toFixed(1));
    commitUpdate(actions, snapped);
    showToast(`Duração ajustada para ${snapped}s`);
  };

  const getActionColor = (type: TimelineAction['actionType']) => {
    switch (type) {
      case 'burst':
        return 'from-purple-950/90 via-purple-900/80 to-slate-900/90 border-purple-500/40 text-purple-200 hover:border-purple-400';
      case 'skill':
        return 'from-amber-950/90 via-amber-900/80 to-slate-900/90 border-amber-500/40 text-amber-200 hover:border-amber-400';
      case 'charged':
        return 'from-rose-950/90 via-rose-900/80 to-slate-900/90 border-rose-500/40 text-rose-200 hover:border-rose-400';
      case 'normal':
        return 'from-slate-800/90 to-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-600';
      case 'swap':
        return 'from-cyan-950/90 via-slate-900/80 to-slate-900/90 border-cyan-500/40 text-cyan-200 hover:border-cyan-400';
      default:
        return 'from-slate-800 to-slate-900 border-slate-700 text-slate-300';
    }
  };

  const getActionIcon = (type: TimelineAction['actionType']) => {
    switch (type) {
      case 'burst':
        return <Zap className="w-3 h-3 text-amber-300 flex-shrink-0" />;
      case 'skill':
        return <Sparkles className="w-3 h-3 text-rose-300 flex-shrink-0" />;
      case 'charged':
      case 'normal':
        return <Swords className="w-3 h-3 text-cyan-300 flex-shrink-0" />;
      case 'swap':
        return <ArrowLeftRight className="w-3 h-3 text-cyan-300 flex-shrink-0" />;
      default:
        return <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#090e17] border border-slate-800 shadow-2xl space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-cyan-500/50 text-cyan-300 shadow-2xl text-xs font-mono font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-cinzel tracking-wide">
                Linha do Tempo de Rotação da Equipe
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
                {totalDuration}s Frame-Accurate
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
                {actions.length} Ações
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isEditMode 
                ? 'Edição Ativa: Adicione, edite ou apague golpes. As durações de buffs se ajustam automaticamente.'
                : 'Visão gráfica interativa das ações, trocas e cobertura dinâmica de buffs'}
            </p>
          </div>
        </div>

        {/* Edit Button & Efficiency */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowActionTable(!showActionTable)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Exibir ou ocultar lista de ações com botões de selecionar e apagar"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showActionTable ? 'Ocultar Tabela' : `Tabela de Ações (${actions.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
              isEditMode
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white'
            }`}
          >
            {isEditMode ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Concluir Edição</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Rotação</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <Award className="w-4 h-4 text-emerald-400" />
            <div className="text-right font-mono">
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Cobertura de Buffs</span>
              <span className="text-xs font-black text-emerald-300">
                {efficiency}% das ações do Carry
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Control Toolbar (When In Edit Mode) */}
      {isEditMode && (
        <div className="p-4 rounded-2xl bg-[#0c121e] border border-cyan-500/30 space-y-4 animate-fade-in">
          
          {/* Top Actions Helper Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Adicionar Ação Rápida por Personagem</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoCascade}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer transition-all"
                title="Enfileira todas as ações em cascata contínua sem sobreposição"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Auto-Sequenciar em Cascata</span>
              </button>

              <button
                type="button"
                onClick={handleSnapDuration}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-all"
                title="Ajusta o tempo total da rotação para o fim do último golpe executado"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Ajustar Duração ao Fim</span>
              </button>
            </div>
          </div>

          {/* 4 Character Quick Action Creator Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {characters.map((char, cIdx) => (
              <div 
                key={cIdx}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <CharacterAvatar name={char.name} element={char.element as any} size="xs" showBorder={false} />
                  <span className="font-bold text-xs text-white truncate">{char.name}</span>
                  {cIdx === carryIndex && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 ml-auto font-mono">
                      CARRY
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => handleAddAction(cIdx, 'swap', 'Swap In', 0.6)}
                    className="p-1 rounded bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-center transition-all cursor-pointer"
                  >
                    + Swap (0.6s)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAction(cIdx, 'skill', 'E (Habilidade)', 1.2)}
                    className="p-1 rounded bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-center transition-all cursor-pointer"
                  >
                    + E Skill (1.2s)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAction(cIdx, 'burst', 'Q (Supremo)', 1.8)}
                    className="p-1 rounded bg-slate-900 hover:bg-purple-950 text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40 text-center transition-all cursor-pointer"
                  >
                    + Q Burst (1.8s)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAction(cIdx, cIdx === carryIndex ? 'charged' : 'normal', cIdx === carryIndex ? 'Combo Carregado' : 'Ataques Normais', 3.0)}
                    className="p-1 rounded bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-center transition-all cursor-pointer"
                  >
                    {cIdx === carryIndex ? '+ Combo (3.0s)' : '+ Normais (3.0s)'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total Duration input */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Duração da Rotação:</span>
              <input
                type="number"
                step="0.5"
                min="5"
                max="40"
                value={totalDuration}
                onChange={(e) => commitUpdate(actions, parseFloat(e.target.value) || 20)}
                className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400 font-mono">segundos</span>
            </div>

            <span className="text-[11px] text-slate-500 font-mono">
              💡 As faixas de buffs abaixo atualizam suas posições e durações automaticamente conforme você edita.
            </span>
          </div>

        </div>
      )}

      {/* Main Multi-lane Graphic Track (Live Visual Updates) */}
      <div className="space-y-3 overflow-x-auto pb-2">
        <div className="min-w-[700px] space-y-2.5">
          
          {/* Time Ruler */}
          <div className="flex items-center pl-32 pr-2 relative text-[10px] font-mono font-bold text-slate-500 border-b border-slate-800/80 pb-1.5">
            {timeMarkers.map(sec => (
              <div 
                key={sec} 
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `calc(128px + (100% - 136px) * (${sec} / ${totalDuration}))` }}
              >
                <span>{sec}s</span>
                <div className="w-0.5 h-1.5 bg-slate-700 mt-0.5" />
              </div>
            ))}
            <div className="h-4" />
          </div>

          {/* 4 Character Lanes */}
          {characters.map((char, charIdx) => {
            const charActions = liveActionsWithBuffs.filter(a => a.charIndex === charIdx);
            const isCarry = charIdx === carryIndex;

            return (
              <div 
                key={charIdx}
                className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all"
              >
                {/* Character Badge Header (Left column) */}
                <div className="w-28 sm:w-32 flex items-center gap-2 flex-shrink-0 pr-2 border-r border-slate-800/80">
                  <CharacterAvatar name={char.name} element={char.element as any} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white truncate">{char.name}</span>
                      {isCarry && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          DPS
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {charActions.length} ações
                    </span>
                  </div>
                </div>

                {/* Track Lane (Right Area) */}
                <div className="flex-1 h-12 bg-slate-900/60 rounded-xl relative overflow-hidden border border-slate-800/60">
                  {/* Subtle Grid Guidelines */}
                  {timeMarkers.map(sec => (
                    <div 
                      key={sec}
                      className="absolute top-0 bottom-0 w-px bg-slate-800/30 pointer-events-none"
                      style={{ left: `${(sec / totalDuration) * 100}%` }}
                    />
                  ))}

                  {/* Action Blocks */}
                  {charActions.map((action) => {
                    const leftPct = (action.startTime / totalDuration) * 100;
                    const widthPct = Math.max(4.5, (action.duration / totalDuration) * 100);
                    const isSelected = selectedActionId === action.id;

                    return (
                      <div
                        key={action.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            // 2º clique no mesmo golpe: APAGA!
                            handleDeleteAction(e, action.id);
                          } else {
                            // 1º clique: SELECIONA!
                            setSelectedActionId(action.id);
                            if (onSelectAction) onSelectAction(action);
                            showToast(`${action.actionLabel} selecionado. Clique de novo para apagar, ou escolha o que faz abaixo.`);
                          }
                        }}
                        className={`absolute top-1.5 bottom-1.5 rounded-lg border flex items-center justify-between gap-1.5 px-2 text-[10px] font-mono font-bold cursor-pointer transition-all duration-200 select-none shadow-md overflow-hidden ${
                          isSelected 
                            ? 'ring-2 ring-rose-400 border-rose-400 z-30 scale-[1.02] shadow-lg shadow-rose-500/30' 
                            : 'hover:brightness-125 z-10'
                        } bg-gradient-to-r ${getActionColor(action.actionType)}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`
                        }}
                        title={
                          isSelected 
                            ? `${action.charName} • ${action.actionLabel} [SELECIONADO - Clique para APAGAR]` 
                            : `${action.charName} • ${action.actionLabel} (Clique para selecionar)`
                        }
                      >
                        <div className="flex items-center gap-1 min-w-0 truncate">
                          {getActionIcon(action.actionType)}
                          <span className="truncate">{action.actionLabel}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 font-mono ml-auto">
                          {isSelected ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/95 text-rose-300 border border-rose-500/60 font-black tracking-wide whitespace-nowrap shadow-sm">
                              Apagar
                            </span>
                          ) : (
                            action.damage && (
                              <span className="text-[9px] opacity-75 hidden sm:inline ml-1 font-mono">
                                {(action.damage / 1000).toFixed(0)}k
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Buff Coverage Tracks (Dynamically Computed from Real Actions) */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Duração de Buffs Ativos da Equipe ({liveBuffs.length} detectados)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Alinhados automaticamente às ações cadastradas
              </span>
            </div>

            <div className="space-y-1.5 pl-32">
              {liveBuffs.map((buff) => {
                const leftPct = (buff.startTime / totalDuration) * 100;
                const widthPct = Math.max(4, ((buff.endTime - buff.startTime) / totalDuration) * 100);

                return (
                  <div key={buff.id} className="relative h-6 bg-slate-950/80 rounded-lg overflow-hidden border border-slate-800/60">
                    <div 
                      className="absolute top-0.5 bottom-0.5 rounded-md px-2 flex items-center justify-between text-[10px] font-mono font-bold text-white shadow-sm overflow-hidden"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: `${buff.color}15`,
                        border: `1px solid ${buff.color}40`
                      }}
                      title={`${buff.name} (${buff.startTime}s - ${buff.endTime}s): ${buff.statBonus} • Origem: ${buff.sourceChar}`}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: buff.color }} />
                        <strong className="text-slate-100">{buff.name}</strong>
                        <span className="text-[9px] text-slate-400 opacity-80">({buff.startTime}s - {buff.endTime}s)</span>
                      </span>
                      <span className="text-[9px] text-amber-300 ml-2 truncate">
                        {buff.statBonus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 1. PAINEL DO GOLPE SELECIONADO & TROCA DE GOLPE DO PERSONAGEM */}
      {selectedAction && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0c1322] via-[#0e1628] to-[#0c1322] border-2 border-cyan-500/50 shadow-2xl space-y-4 animate-fade-in">
          {/* Top Bar of Selected Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <CharacterAvatar 
                name={selectedAction.charName} 
                element={(characters[selectedAction.charIndex]?.element as any) || 'Pyro'} 
                size="md" 
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                    Golpe Selecionado
                  </span>
                  <span className="text-sm font-black text-white font-sans">
                    {selectedAction.charName}
                  </span>
                  <span className="text-sm font-bold text-cyan-300 font-sans">
                    • {selectedAction.actionLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-300 mt-1 flex-wrap">
                  <span>Início: <strong className="text-white">{selectedAction.startTime}s</strong></span>
                  <span>Duração: <strong className="text-white">{selectedAction.duration}s</strong></span>
                  <span>Fim: <strong className="text-white">{(selectedAction.startTime + selectedAction.duration).toFixed(1)}s</strong></span>
                  {selectedAction.damage && (
                    <span>Dano estimado: <strong className="text-rose-400">{selectedAction.damage.toLocaleString('pt-BR')}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Selection & Deletion controls */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={(e) => handleDeleteAction(e, selectedAction.id)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-600/50 text-xs font-bold cursor-pointer transition-all shadow-sm"
                title="Apagar este golpe da rotação"
              >
                <span>Apagar</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedActionId(null)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs font-semibold cursor-pointer transition-all"
                title="Desmarcar seleção"
              >
                <X className="w-3.5 h-3.5" />
                <span>Desmarcar</span>
              </button>
            </div>
          </div>

          {/* CHARACTER STRIKE SWITCHER: "Escolher outro golpe do personagem" */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>O que {selectedAction.charName} faz neste momento (escolha um golpe):</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                1 clique seleciona o golpe • Clicar novamente no bloco apaga
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {getCharacterMoveOptions(selectedAction.charName, characters[selectedAction.charIndex]?.element).map(move => {
                const isCurrent = selectedAction.actionLabel === move.label;

                return (
                  <button
                    key={move.id}
                    type="button"
                    onClick={() => handleSwitchActionStrike(move)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                      isCurrent
                        ? 'bg-cyan-950/90 border-cyan-400 text-white ring-1 ring-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title={move.description || move.label}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 font-bold uppercase">
                        {move.type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {move.duration}s
                      </span>
                    </div>
                    <span className="text-xs font-bold truncate block">
                      {move.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Fine-Tuning Row (Start time, Duration, Label) with clean spacing */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
                <span className="text-slate-400">Início:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={totalDuration}
                  value={selectedAction.startTime}
                  onChange={(e) => handleUpdateAction(selectedAction.id, { startTime: parseFloat(e.target.value) || 0 })}
                  className="w-14 bg-transparent text-cyan-300 font-bold outline-none text-xs"
                />
                <span className="text-slate-500">s</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
                <span className="text-slate-400">Duração:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="20"
                  value={selectedAction.duration}
                  onChange={(e) => handleUpdateAction(selectedAction.id, { duration: parseFloat(e.target.value) || 1 })}
                  className="w-14 bg-transparent text-slate-200 outline-none text-xs"
                />
                <span className="text-slate-500">s</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
                <span className="text-slate-400">Rótulo:</span>
                <input
                  type="text"
                  value={selectedAction.actionLabel}
                  onChange={(e) => handleUpdateAction(selectedAction.id, { actionLabel: e.target.value })}
                  className="w-44 bg-transparent text-white outline-none text-xs"
                  placeholder="Nome do golpe"
                />
              </div>
            </div>

            {/* Active Buffs for this window */}
            {selectedAction.buffsActive && selectedAction.buffsActive.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-400">Buffs Ativos:</span>
                {selectedAction.buffsActive.map((bName, bi) => (
                  <span key={bi} className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] text-amber-300">
                    {bName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TABELA DE SEQUÊNCIA DE AÇÕES (Com botões explícitos para Selecionar e Apagar) */}
      {(showActionTable || isEditMode) && (
        <div className="p-4 rounded-2xl bg-[#090d16] border border-slate-800 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Sequência de Ações da Rotação ({actions.length} golpes)</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              1 clique seleciona o golpe • Clicar novamente no mesmo golpe apaga da rotação
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800 text-left">
                  <th className="py-2 px-2.5 w-12 text-center">#</th>
                  <th className="py-2 px-2.5">Personagem</th>
                  <th className="py-2 px-2.5">Tipo</th>
                  <th className="py-2 px-2.5">Rótulo do Golpe</th>
                  <th className="py-2 px-2.5 w-24">Início (s)</th>
                  <th className="py-2 px-2.5 w-24">Duração (s)</th>
                  <th className="py-2 px-2.5 w-20 text-right">Fim</th>
                  <th className="py-2 px-3 w-28 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {actions.map((act, idx) => {
                  const isSelected = selectedActionId === act.id;

                  return (
                    <tr 
                      key={act.id}
                      onClick={() => setSelectedActionId(act.id)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-cyan-950/40 ring-1 ring-cyan-500/40' : idx % 2 === 1 ? 'bg-slate-950/40' : 'bg-transparent'
                      } hover:bg-slate-900/60`}
                    >
                      {/* Index + Reorder buttons */}
                      <td className="py-1.5 px-2 text-center text-slate-500" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => handleMoveAction(e, idx, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Mover antes"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <span className="w-4 text-center">{idx + 1}</span>
                          <button
                            type="button"
                            onClick={(e) => handleMoveAction(e, idx, 'down')}
                            disabled={idx === actions.length - 1}
                            className="p-0.5 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Mover depois"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Character selector */}
                      <td className="py-1.5 px-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <CharacterAvatar name={act.charName} element={(characters[act.charIndex]?.element as any) || 'Pyro'} size="xs" showBorder={false} />
                          <select
                            value={act.charIndex}
                            onChange={(e) => handleUpdateAction(act.id, { charIndex: Number(e.target.value) })}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-bold outline-none focus:border-cyan-500 cursor-pointer"
                          >
                            {characters.map((c, i) => (
                              <option key={i} value={i} className="bg-slate-900 text-white">
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Action Type */}
                      <td className="py-1.5 px-2.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={act.actionType}
                          onChange={(e) => handleUpdateAction(act.id, { actionType: e.target.value as ActionType })}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-300 text-xs outline-none focus:border-cyan-500 cursor-pointer"
                        >
                          <option value="skill">E (Skill)</option>
                          <option value="burst">Q (Burst)</option>
                          <option value="normal">Normais (N)</option>
                          <option value="charged">Carregado (CA)</option>
                          <option value="swap">Swap In</option>
                          <option value="plunge">Plunge</option>
                          <option value="special">Especial</option>
                        </select>
                      </td>

                      {/* Label Input */}
                      <td className="py-1.5 px-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={act.actionLabel}
                          onChange={(e) => handleUpdateAction(act.id, { actionLabel: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs outline-none focus:border-cyan-500"
                        />
                      </td>

                      {/* Start Time */}
                      <td className="py-1.5 px-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max={totalDuration}
                          value={act.startTime}
                          onChange={(e) => handleUpdateAction(act.id, { startTime: parseFloat(e.target.value) || 0 })}
                          className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 text-xs font-bold outline-none focus:border-cyan-500"
                        />
                      </td>

                      {/* Duration */}
                      <td className="py-1.5 px-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.1"
                          min="0.2"
                          max="20"
                          value={act.duration}
                          onChange={(e) => handleUpdateAction(act.id, { duration: parseFloat(e.target.value) || 1 })}
                          className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs outline-none focus:border-cyan-500"
                        />
                      </td>

                      {/* Calculated End */}
                      <td className="py-1.5 px-2.5 text-right font-bold text-slate-400">
                        {(act.startTime + act.duration).toFixed(1)}s
                      </td>

                      {/* BOTÃO UNIFICADO: 1 clique seleciona, outro apaga */}
                      <td className="py-1.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            if (isSelected) {
                              // Outro clique: APAGA!
                              handleDeleteAction(e, act.id);
                            } else {
                              // 1º clique: SELECIONA!
                              setSelectedActionId(act.id);
                              if (onSelectAction) onSelectAction(act);
                              showToast(`${act.actionLabel} selecionado. Clique de novo nele para apagar, ou escolha o que faz no painel.`);
                            }
                          }}
                          className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50 hover:bg-rose-900 hover:text-white shadow-sm shadow-rose-500/20 animate-pulse'
                              : 'bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400'
                          }`}
                          title={isSelected ? 'Clique de novo para APAGAR este golpe' : 'Clique para SELECIONAR este golpe'}
                        >
                          {isSelected ? (
                            <span>Apagar</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Selecionar</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-purple-500/50 border border-purple-400/40" />
            <span>Supremo (Burst)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-amber-500/50 border border-amber-400/40" />
            <span>Habilidade (Skill)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-rose-500/50 border border-rose-400/40" />
            <span>Carregado / Combo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-cyan-600/50 border border-cyan-400/40" />
            <span>Troca (Swap)</span>
          </div>
        </div>

        <span className="text-[10px] text-slate-400">
          Clique em qualquer bloco na trilha para inspecionar ou apagar
        </span>
      </div>

    </div>
  );
};
