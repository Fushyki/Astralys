import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  X,
  Play,
  Pause,
  FastForward,
  Trash2,
  Copy,
  MoveHorizontal,
  AlertTriangle,
  ChevronRight
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
  const [showActionTable, setShowActionTable] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Playback Simulation State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Drag-to-Slide State
  const [draggingActionId, setDraggingActionId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragInitialTime, setDragInitialTime] = useState<number>(0);
  const laneRefs = useRef<Record<number, HTMLDivElement | null>>({});

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

  // Detect which action is currently executing at currentTime
  const activeOnFieldAction = useMemo(() => {
    return liveActionsWithBuffs.find(a => 
      currentTime >= a.startTime && currentTime < (a.startTime + a.duration)
    );
  }, [liveActionsWithBuffs, currentTime]);

  // Detect overlaps on same character
  const hasCharacterOverlaps = useMemo(() => {
    for (let cIdx = 0; cIdx < characters.length; cIdx++) {
      const charActs = actions.filter(a => a.charIndex === cIdx).sort((a, b) => a.startTime - b.startTime);
      for (let i = 0; i < charActs.length - 1; i++) {
        if (charActs[i].startTime + charActs[i].duration > charActs[i + 1].startTime + 0.05) {
          return true;
        }
      }
    }
    return false;
  }, [actions, characters.length]);

  // Commit changes to parent and localStorage
  const commitUpdate = useCallback((newActions: TimelineAction[], newDuration: number) => {
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
  }, [characters, onChangeTimeline]);

  // Smooth 60fps Playhead Scrubber Animation
  useEffect(() => {
    if (!isPlaying) return;
    let lastTimestamp = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const elapsedSeconds = ((now - lastTimestamp) / 1000) * playbackSpeed;
      lastTimestamp = now;

      setCurrentTime(prev => {
        const next = prev + elapsedSeconds;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return parseFloat(next.toFixed(2));
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, totalDuration]);

  // Horizontal Drag to Slide Action Blocks
  useEffect(() => {
    if (!draggingActionId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const action = actions.find(a => a.id === draggingActionId);
      if (!action) return;

      const laneEl = laneRefs.current[action.charIndex];
      if (!laneEl) return;

      const rect = laneEl.getBoundingClientRect();
      if (rect.width <= 0) return;

      const deltaX = e.clientX - dragStartX;
      const deltaTime = (deltaX / rect.width) * totalDuration;
      const maxStart = Math.max(0, totalDuration - action.duration);
      const newStart = Math.max(0, Math.min(maxStart, Math.round((dragInitialTime + deltaTime) * 10) / 10));

      setActions(prev => prev.map(a => a.id === draggingActionId ? { ...a, startTime: newStart } : a));
    };

    const handleMouseUp = () => {
      setDraggingActionId(null);
      commitUpdate(actions, totalDuration);
      showToast('Posição do golpe atualizada');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingActionId, dragStartX, dragInitialTime, actions, totalDuration, commitUpdate]);

  // Keyboard Shortcuts: Space to Play/Pause, Esc to deselect, Delete to remove selected
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTagName = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTagName === 'input' || activeTagName === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'Escape') {
        setSelectedActionId(null);
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedActionId) {
          e.preventDefault();
          handleDeleteAction(selectedActionId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedActionId]);

  // Playback Controls
  const togglePlay = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleResetPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const clickX = e.clientX - rect.left;
    const clickedTime = Math.max(0, Math.min(totalDuration, parseFloat(((clickX / rect.width) * totalDuration).toFixed(1))));
    setCurrentTime(clickedTime);
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

    const updated = [...actions, newAct];
    commitUpdate(updated, totalDuration);
    setSelectedActionId(newAct.id);
    showToast(`"${newAct.actionLabel}" adicionado à rotação!`);
  };

  // Update existing action properties
  const handleUpdateAction = (id: string, updates: Partial<TimelineAction>) => {
    const updated = actions.map(act => {
      if (act.id !== id) return act;
      
      const newCharIndex = updates.charIndex !== undefined ? updates.charIndex : act.charIndex;
      const charName = characters[newCharIndex]?.name || act.charName;

      return {
        ...act,
        ...updates,
        charIndex: newCharIndex,
        charName
      };
    });

    commitUpdate(updated, totalDuration);
  };

  // Nudge Action Time earlier or later
  const handleNudgeAction = (id: string, delta: number) => {
    const act = actions.find(a => a.id === id);
    if (!act) return;

    const maxStart = Math.max(0, totalDuration - act.duration);
    const newStart = Math.max(0, Math.min(maxStart, parseFloat((act.startTime + delta).toFixed(1))));
    handleUpdateAction(id, { startTime: newStart });
  };

  // Snap Action to End of Previous Action
  const handleSnapToPrevious = (id: string) => {
    const act = actions.find(a => a.id === id);
    if (!act) return;

    const otherActs = actions.filter(a => a.id !== id && a.startTime <= act.startTime);
    if (otherActs.length === 0) {
      handleUpdateAction(id, { startTime: 0.0 });
      showToast('Ação alinhada para o início (0.0s)');
      return;
    }

    const prevAct = otherActs.sort((a, b) => (b.startTime + b.duration) - (a.startTime + a.duration))[0];
    const newStart = Math.max(0, Math.min(totalDuration - act.duration, parseFloat((prevAct.startTime + prevAct.duration).toFixed(1))));
    handleUpdateAction(id, { startTime: newStart });
    showToast(`Encostado logo após ${prevAct.actionLabel} (${newStart}s)`);
  };

  // Duplicate Action
  const handleDuplicateAction = (id: string) => {
    const act = actions.find(a => a.id === id);
    if (!act) return;

    const newStart = Math.min(totalDuration - act.duration, parseFloat((act.startTime + act.duration).toFixed(1)));
    const cloned: TimelineAction = {
      ...act,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      actionLabel: `${act.actionLabel} (2)`,
      startTime: newStart
    };

    const updated = [...actions, cloned];
    commitUpdate(updated, totalDuration);
    setSelectedActionId(cloned.id);
    showToast(`Ação duplicada com sucesso!`);
  };

  // Switch Strike Type
  const handleSwitchActionStrike = (move: CharacterMoveOption) => {
    if (!selectedActionId) return;
    const act = actions.find(a => a.id === selectedActionId);
    if (!act) return;

    const char = characters[act.charIndex];
    const totalDmg = char?.totalDamage || 100000;
    const newDamage = Math.round(totalDmg * (move.damageMultiplier ?? 0.1));

    handleUpdateAction(selectedActionId, {
      actionType: move.type,
      actionLabel: move.label,
      duration: move.duration,
      damage: newDamage
    });

    showToast(`Alterado para: ${move.label}`);
  };

  // Explicit Delete Action
  const handleDeleteAction = (id: string) => {
    const toDelete = actions.find(a => a.id === id);
    const updated = actions.filter(act => act.id !== id);
    if (selectedActionId === id) {
      setSelectedActionId(null);
    }
    commitUpdate(updated, totalDuration);
    showToast(`"${toDelete?.actionLabel || 'Ação'}" removida da rotação.`);
  };

  // Reorder Actions in table
  const handleMoveAction = (e: React.MouseEvent, index: number, direction: 'up' | 'down') => {
    e.stopPropagation();
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= actions.length) return;

    const copy = [...actions];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;

    // Swap start times to maintain smooth chronological order
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
    showToast('Ações auto-organizadas em sequência contínua');
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
        return 'from-purple-950/90 via-purple-900/80 to-slate-900/90 border-purple-500/40 text-purple-200 hover:border-purple-300';
      case 'skill':
        return 'from-amber-950/90 via-amber-900/80 to-slate-900/90 border-amber-500/40 text-amber-200 hover:border-amber-300';
      case 'charged':
        return 'from-rose-950/90 via-rose-900/80 to-slate-900/90 border-rose-500/40 text-rose-200 hover:border-rose-300';
      case 'normal':
        return 'from-slate-800/90 to-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500';
      case 'swap':
        return 'from-cyan-950/90 via-slate-900/80 to-slate-900/90 border-cyan-500/40 text-cyan-200 hover:border-cyan-300';
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
    <div className="p-5 sm:p-6 rounded-3xl bg-[#090e17] border border-slate-800 shadow-2xl space-y-6 select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-cyan-500/50 text-cyan-300 shadow-2xl text-xs font-mono font-bold animate-fade-in backdrop-blur-md">
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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white font-cinzel tracking-wide">
                Linha do Tempo de Rotação da Equipe
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
                {totalDuration}s Frame-Accurate
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
                {actions.length} Ações
              </span>
              {hasCharacterOverlaps && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Sobreposição Detectada
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditMode 
                ? 'Edição Ativa: Arraste os blocos horizontalmente para mover no tempo, adicione golpes ou clique para inspecionar.'
                : 'Arraste os blocos na trilha para mover o tempo, reproduza em tempo real ou edite golpes.'}
            </p>
          </div>
        </div>

        {/* Global Controls & Efficiency Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowActionTable(!showActionTable)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Exibir ou ocultar lista detalhada de ações em formato de tabela"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showActionTable ? 'Ocultar Tabela' : `Tabela (${actions.length})`}</span>
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
                <span>Concluir</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>+ Adicionar Golpes</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <Award className="w-4 h-4 text-emerald-400" />
            <div className="text-right font-mono">
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Cobertura de Buffs</span>
              <span className="text-xs font-black text-emerald-300">
                {efficiency}% no Carry
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Playback Simulation Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-2xl bg-[#0d121f] border border-slate-800/80 shadow-inner">
        <div className="flex items-center gap-2">
          {/* Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white shadow-rose-900/30'
            }`}
            title="Reproduzir rotação frame a frame (Espaço)"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Reproduzir</span>
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetPlayback}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reiniciar indicador para 0.0s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px] font-mono">
            {[0.5, 1, 1.5, 2].map(speed => (
              <button
                key={speed}
                type="button"
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  playbackSpeed === speed
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}×
              </button>
            ))}
          </div>

          {/* Time Scrubber Display */}
          <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-white">{currentTime.toFixed(1)}s</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{totalDuration.toFixed(1)}s</span>
          </div>
        </div>

        {/* Live on-field status readout */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {activeOnFieldAction ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>No Campo: <strong>{activeOnFieldAction.charName}</strong> ({activeOnFieldAction.actionLabel})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-500">
              <span>Intervalo de Transição / Troca</span>
            </div>
          )}

          {/* Auto-Organize Action Button */}
          <button
            type="button"
            onClick={handleAutoCascade}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 hover:text-white font-semibold transition-all cursor-pointer text-xs"
            title="Organiza todas as ações sequencialmente sem sobreposição"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Auto-Alinhar</span>
          </button>
        </div>
      </div>

      {/* Quick Action Creator Toolbar (When In Edit Mode) */}
      {isEditMode && (
        <div className="p-4 rounded-2xl bg-[#0c121e] border border-cyan-500/30 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Adicionar Golpe por Integrante da Equipe</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSnapDuration}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-all"
                title="Ajusta o tempo total da rotação para o fim do último golpe executado"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Ajustar Duração ao Último Golpe</span>
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
                    className="p-1.5 rounded bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-center transition-all cursor-pointer"
                  >
                    + Swap (0.6s)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAction(cIdx, 'skill', 'Habilidade Elemental (E)', 1.2)}
                    className="p-1.5 rounded bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 text-center transition-all cursor-pointer"
                  >
                    + E Skill (1.2s)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAction(cIdx, 'burst', 'Supremo (Q)', 1.8)}
                    className="p-1.5 rounded bg-slate-900 hover:bg-purple-950 text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40 text-center transition-all cursor-pointer"
                  >
                    + Q Burst (1.8s)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAction(cIdx, cIdx === carryIndex ? 'charged' : 'normal', cIdx === carryIndex ? 'Ataque Carregado' : 'Ataques Normais', 3.0)}
                    className="p-1.5 rounded bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-center transition-all cursor-pointer"
                  >
                    {cIdx === carryIndex ? '+ Carregado (3s)' : '+ Normais (3s)'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total Duration input */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Duração Total da Rotação:</span>
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

            <span className="text-[11px] text-slate-400 font-mono">
              💡 As faixas de buffs abaixo acompanham e atualizam suas durações automaticamente.
            </span>
          </div>
        </div>
      )}

      {/* Main Multi-lane Graphic Track (Pixel-Perfect Alignment) */}
      <div 
        className="space-y-3 overflow-x-auto pb-2"
        onClick={() => setSelectedActionId(null)}
      >
        <div className="min-w-[760px] space-y-2.5">
          
          {/* Time Ruler (Identical 2-column flex layout for 100% pixel-perfect tick alignment) */}
          <div className="flex items-center gap-2 p-1.5">
            {/* Left Header Spacer matching character avatar card */}
            <div className="w-28 sm:w-32 pr-2 border-r border-transparent flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tempo (s)</span>
            </div>

            {/* Right Ruler Area */}
            <div 
              className="flex-1 relative h-6 border-b border-slate-800 cursor-pointer"
              onClick={handleScrubClick}
              title="Clique para posicionar a agulha de reprodução neste segundo"
            >
              {timeMarkers.map(sec => (
                <div 
                  key={sec} 
                  className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${(sec / totalDuration) * 100}%` }}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-400">{sec}s</span>
                  <div className="w-px h-1.5 bg-slate-700 mt-0.5" />
                </div>
              ))}

              {/* Scrubber Playhead Pointer on Ruler */}
              <div 
                className="absolute top-1 bottom-0 pointer-events-none -translate-x-1/2 z-40"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              >
                <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 -mt-1 shadow-md shadow-rose-500/50" />
              </div>
            </div>
          </div>

          {/* 4 Character Lanes */}
          {characters.map((char, charIdx) => {
            const charActions = liveActionsWithBuffs.filter(a => a.charIndex === charIdx);
            const isCarry = charIdx === carryIndex;
            const isOnFieldNow = activeOnFieldAction?.charIndex === charIdx;

            return (
              <div 
                key={charIdx}
                className={`flex items-center gap-2 p-1.5 rounded-2xl transition-all ${
                  isOnFieldNow
                    ? 'bg-slate-900/90 border border-cyan-500/50 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {/* Character Badge Header (Left column) */}
                <div className="w-28 sm:w-32 flex items-center gap-2 flex-shrink-0 pr-2 border-r border-slate-800/80">
                  <div className="relative">
                    <CharacterAvatar name={char.name} element={char.element as any} size="sm" />
                    {isOnFieldNow && (
                      <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white truncate">{char.name}</span>
                      {isCarry && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                          DPS
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {isOnFieldNow ? (
                        <span className="text-emerald-400 font-bold">EM CAMPO</span>
                      ) : (
                        `${charActions.length} ações`
                      )}
                    </span>
                  </div>
                </div>

                {/* Track Lane (Right Area) */}
                <div 
                  ref={el => { laneRefs.current[charIdx] = el; }}
                  className="flex-1 h-12 bg-slate-900/60 rounded-xl relative overflow-hidden border border-slate-800/60 cursor-crosshair"
                  onClick={(e) => {
                    // Clicking empty lane area scrubs playhead to that point
                    handleScrubClick(e);
                  }}
                >
                  {/* Subtle Grid Guidelines matching time markers */}
                  {timeMarkers.map(sec => (
                    <div 
                      key={sec}
                      className="absolute top-0 bottom-0 w-px bg-slate-800/40 pointer-events-none"
                      style={{ left: `${(sec / totalDuration) * 100}%` }}
                    />
                  ))}

                  {/* Playhead Scrubber Line */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] z-40 pointer-events-none -translate-x-1/2"
                    style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                  />

                  {/* Action Blocks */}
                  {charActions.map((action) => {
                    const leftPct = (action.startTime / totalDuration) * 100;
                    const widthPct = Math.max(3.5, (action.duration / totalDuration) * 100);
                    const isSelected = selectedActionId === action.id;
                    const isCurrentlyActive = currentTime >= action.startTime && currentTime < (action.startTime + action.duration);
                    const isDragging = draggingActionId === action.id;

                    return (
                      <div
                        key={action.id}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedActionId(action.id);
                          if (onSelectAction) onSelectAction(action);
                          setDraggingActionId(action.id);
                          setDragStartX(e.clientX);
                          setDragInitialTime(action.startTime);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedActionId(action.id);
                          if (onSelectAction) onSelectAction(action);
                        }}
                        className={`absolute top-1.5 bottom-1.5 rounded-lg border flex items-center justify-between gap-1.5 px-2 text-[10px] font-mono font-bold transition-all duration-150 select-none shadow-md overflow-hidden ${
                          isSelected 
                            ? 'ring-2 ring-rose-400 border-rose-400 z-30 scale-[1.02] shadow-lg shadow-rose-500/30' 
                            : isCurrentlyActive
                              ? 'ring-2 ring-emerald-400 border-emerald-400 z-20 shadow-md shadow-emerald-500/20'
                              : 'hover:brightness-125 z-10'
                        } ${isDragging ? 'opacity-80 cursor-grabbing' : 'cursor-grab'} bg-gradient-to-r ${getActionColor(action.actionType)}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`
                        }}
                        title={`${action.charName} • ${action.actionLabel} (${action.startTime}s - ${(action.startTime + action.duration).toFixed(1)}s) [Clique e arraste para mover]`}
                      >
                        {/* Drag Handle Indicator */}
                        <div className="flex items-center gap-1 min-w-0 truncate">
                          {getActionIcon(action.actionType)}
                          <span className="truncate">{action.actionLabel}</span>
                        </div>

                        {/* Duration / Damage Tag */}
                        <div className="flex items-center gap-1 flex-shrink-0 font-mono ml-auto">
                          <span className="text-[9px] opacity-75 font-mono">
                            {action.duration}s
                          </span>
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
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Faixas de Buffs da Equipe ({liveBuffs.length} detectados)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Alinhamento dinâmico calculado com base nos golpes
              </span>
            </div>

            <div className="space-y-1.5 pl-28 sm:pl-32">
              {liveBuffs.map((buff) => {
                const leftPct = (buff.startTime / totalDuration) * 100;
                const widthPct = Math.max(3.5, ((buff.endTime - buff.startTime) / totalDuration) * 100);
                const isBuffActiveNow = currentTime >= buff.startTime && currentTime <= buff.endTime;

                return (
                  <div key={buff.id} className="relative h-6 bg-slate-950/80 rounded-lg overflow-hidden border border-slate-800/60">
                    {/* Playhead Scrubber Line passing through buffs */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] z-30 pointer-events-none -translate-x-1/2"
                      style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                    />

                    <div 
                      className={`absolute top-0.5 bottom-0.5 rounded-md px-2 flex items-center justify-between text-[10px] font-mono font-bold text-white shadow-sm overflow-hidden transition-all ${
                        isBuffActiveNow ? 'ring-1 ring-white/30 brightness-125' : 'opacity-85'
                      }`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: `${buff.color}20`,
                        border: `1px solid ${buff.color}50`
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

      {/* 1. PAINEL DE AJUSTE FINO DO GOLPE SELECIONADO */}
      {selectedAction && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0c1322] via-[#0e1628] to-[#0c1322] border-2 border-cyan-500/50 shadow-2xl space-y-4 animate-fade-in"
        >
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

            {/* Smart Utilities & Explicit Delete Button */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {/* Snap to Previous Action Button */}
              <button
                type="button"
                onClick={() => handleSnapToPrevious(selectedAction.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer transition-all"
                title="Encosta este golpe no final da ação anterior na rotação"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Encostar no Anterior</span>
              </button>

              {/* Duplicate Action Button */}
              <button
                type="button"
                onClick={() => handleDuplicateAction(selectedAction.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-semibold cursor-pointer transition-all"
                title="Duplica este golpe logo após o término deste"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar</span>
              </button>

              {/* Explicit Red Delete Button */}
              <button
                type="button"
                onClick={() => handleDeleteAction(selectedAction.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-600/60 text-xs font-bold cursor-pointer transition-all shadow-sm"
                title="Apagar este golpe da rotação"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Apagar Golpe</span>
              </button>

              {/* Deselect button */}
              <button
                type="button"
                onClick={() => setSelectedActionId(null)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Desmarcar seleção (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timing Slider & Quick Nudge Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Start Time Scrubbing Slider & Nudge */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <MoveHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                  Momento de Início:
                </span>
                <span className="font-bold text-cyan-300 text-sm">{selectedAction.startTime}s</span>
              </div>

              {/* Range Slider for Start Time */}
              <input
                type="range"
                min="0"
                max={Math.max(0, totalDuration - selectedAction.duration)}
                step="0.1"
                value={selectedAction.startTime}
                onChange={(e) => handleUpdateAction(selectedAction.id, { startTime: parseFloat(e.target.value) || 0 })}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              {/* Quick Nudge Buttons */}
              <div className="flex items-center justify-between gap-1 pt-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => handleNudgeAction(selectedAction.id, -1.0)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                >
                  -1.0s
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeAction(selectedAction.id, -0.5)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                >
                  -0.5s
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeAction(selectedAction.id, -0.1)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                >
                  -0.1s
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeAction(selectedAction.id, 0.1)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                >
                  +0.1s
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeAction(selectedAction.id, 0.5)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                >
                  +0.5s
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeAction(selectedAction.id, 1.0)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                >
                  +1.0s
                </button>
              </div>
            </div>

            {/* Duration Slider & Presets */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Duração da Execução:
                </span>
                <span className="font-bold text-amber-300 text-sm">{selectedAction.duration}s</span>
              </div>

              {/* Range Slider for Duration */}
              <input
                type="range"
                min="0.2"
                max="8.0"
                step="0.1"
                value={selectedAction.duration}
                onChange={(e) => handleUpdateAction(selectedAction.id, { duration: parseFloat(e.target.value) || 1 })}
                className="w-full accent-amber-400 cursor-pointer"
              />

              {/* Duration Presets */}
              <div className="flex items-center justify-between gap-1 pt-1 font-mono text-[10px]">
                {[
                  { dur: 0.5, label: '0.5s Swap' },
                  { dur: 1.0, label: '1.0s Fast' },
                  { dur: 1.5, label: '1.5s Skill' },
                  { dur: 2.0, label: '2.0s Burst' },
                  { dur: 3.0, label: '3.0s Combo' }
                ].map(p => (
                  <button
                    key={p.dur}
                    type="button"
                    onClick={() => handleUpdateAction(selectedAction.id, { duration: p.dur })}
                    className={`px-2 py-1 rounded border transition-colors cursor-pointer ${
                      selectedAction.duration === p.dur
                        ? 'bg-amber-600 text-white border-amber-500 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Label Name Edit */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 font-mono">Rótulo / Nome do Golpe:</span>
            <input
              type="text"
              value={selectedAction.actionLabel}
              onChange={(e) => handleUpdateAction(selectedAction.id, { actionLabel: e.target.value })}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono outline-none focus:border-cyan-500"
              placeholder="Digite o nome do golpe..."
            />
          </div>

          {/* Character Strike Switcher */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Substituir pelo Talento Oficial ({selectedAction.charName}):</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {getCharacterMoveOptions(selectedAction.charName, characters[selectedAction.charIndex]?.element).map(move => {
                const isCurrent = selectedAction.actionLabel === move.label;

                return (
                  <button
                    key={move.id}
                    type="button"
                    onClick={() => handleSwitchActionStrike(move)}
                    className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                      isCurrent
                        ? 'bg-cyan-950/90 border-cyan-400 text-white ring-1 ring-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title={move.description || move.label}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-cyan-300 font-bold uppercase">
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
        </div>
      )}

      {/* 2. TABELA COMPLETA DE SEQUÊNCIA DE AÇÕES (Toggleable) */}
      {showActionTable && (
        <div className="p-4 rounded-2xl bg-[#090d16] border border-slate-800 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Sequência de Ações da Rotação ({actions.length} golpes)</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Clique em uma linha para inspecionar e editar
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
                  <th className="py-2 px-3 w-28 text-center">Ações</th>
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

                      {/* Explicit Action Buttons */}
                      <td className="py-1.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedActionId(act.id)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-900 text-slate-300 hover:text-white'
                            }`}
                            title="Selecionar este golpe para ajustar"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAction(act.id)}
                            className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-white border border-rose-600/40 transition-colors cursor-pointer"
                            title="Apagar este golpe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend & Instructions */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-purple-500/60 border border-purple-400/50" />
            <span>Supremo (Q)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-amber-500/60 border border-amber-400/50" />
            <span>Habilidade (E)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-rose-500/60 border border-rose-400/50" />
            <span>Carregado (CA)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-slate-700/80 border border-slate-600/50" />
            <span>Normais (N)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-cyan-600/60 border border-cyan-400/50" />
            <span>Troca (Swap)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span>Arraste os blocos para mover no tempo</span>
          <span>•</span>
          <span>Espaço para Play/Pausa</span>
        </div>
      </div>

    </div>
  );
};
