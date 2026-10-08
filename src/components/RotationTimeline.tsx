import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Clock, 
  Sparkles, 
  Zap, 
  Swords, 
  ArrowLeftRight, 
  Layers, 
  Award,
  Sliders, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  Play, 
  Pause, 
  Trash2, 
  Copy, 
  MoveHorizontal, 
  AlertTriangle, 
  MousePointer, 
  ArrowDown, 
  Flame, 
  Shield, 
  Plus,
  ArrowUp,
  Check,
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

  // Ruler Scrub Dragging
  const [isScrubbingRuler, setIsScrubbingRuler] = useState<boolean>(false);

  // Hover Tooltip State
  const [hoveredActionData, setHoveredActionData] = useState<{
    action: TimelineAction;
    rect: DOMRect;
  } | null>(null);

  const laneRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const rulerRef = useRef<HTMLDivElement | null>(null);

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

  // Active buffs overlapping the selected action
  const activeBuffsForSelectedAction = useMemo(() => {
    if (!selectedAction) return [];
    const actionStart = selectedAction.startTime;
    const actionEnd = selectedAction.startTime + selectedAction.duration;

    return liveBuffs.filter(buff => {
      return buff.startTime < actionEnd && buff.endTime > actionStart;
    });
  }, [selectedAction, liveBuffs]);

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
      showToast('Posição da ação atualizada');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingActionId, dragStartX, dragInitialTime, actions, totalDuration, commitUpdate]);

  // Scrubbing on Ruler via Mouse Drag
  useEffect(() => {
    if (!isScrubbingRuler) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;

      const clickX = e.clientX - rect.left;
      const scrubTime = Math.max(0, Math.min(totalDuration, parseFloat(((clickX / rect.width) * totalDuration).toFixed(1))));
      setCurrentTime(scrubTime);
    };

    const handleMouseUp = () => {
      setIsScrubbingRuler(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbingRuler, totalDuration]);

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
  }, [selectedActionId, actions]);

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

  const handleRulerScrubStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbingRuler(true);
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const clickX = e.clientX - rect.left;
    const clickedTime = Math.max(0, Math.min(totalDuration, parseFloat(((clickX / rect.width) * totalDuration).toFixed(1))));
    setCurrentTime(clickedTime);
  };

  // Click-to-Create in Empty Track Space with Magnetic Grid & Collision Handling
  const handleTrackClickToCreate = (e: React.MouseEvent<HTMLDivElement>, charIdx: number) => {
    if (draggingActionId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;

    const clickX = e.clientX - rect.left;
    const rawTime = (clickX / rect.width) * totalDuration;

    // Magnetic Snap: round to nearest 0.5s
    let snappedStart = Math.round(rawTime * 2) / 2;
    let duration = 1.2;

    const charActions = actions.filter(a => a.charIndex === charIdx).sort((a, b) => a.startTime - b.startTime);

    // Collision check: if snapped time lands inside an existing action, place right after
    for (const act of charActions) {
      if (snappedStart >= act.startTime && snappedStart < (act.startTime + act.duration)) {
        snappedStart = parseFloat((act.startTime + act.duration).toFixed(1));
      }
    }

    // Collision check: if overlapping the NEXT action, clamp duration or jump ahead
    const nextAct = charActions.find(a => a.startTime > snappedStart);
    if (nextAct) {
      const availableGap = nextAct.startTime - snappedStart;
      if (availableGap < 0.3) {
        snappedStart = parseFloat((nextAct.startTime + nextAct.duration).toFixed(1));
      } else if (availableGap < duration) {
        duration = parseFloat(Math.max(0.4, availableGap).toFixed(1));
      }
    }

    // Boundary clamp against total duration
    if (snappedStart + duration > totalDuration) {
      snappedStart = Math.max(0, parseFloat((totalDuration - duration).toFixed(1)));
    }

    const char = characters[charIdx];
    const charName = char?.name || 'Personagem';
    const availableMoves = getCharacterMoveOptions(charName, char?.element);

    // Default to character's E skill or first available move
    const defaultMove = availableMoves.find(m => m.type === 'skill') || availableMoves[0] || {
      id: 'skill',
      type: 'skill' as ActionType,
      label: 'Habilidade Elemental (E)',
      duration: 1.2,
      damageMultiplier: 0.25
    };

    const finalDuration = Math.min(duration, defaultMove.duration);
    const newAction: TimelineAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      charIndex: charIdx,
      charName,
      actionType: defaultMove.type,
      actionLabel: defaultMove.label,
      startTime: snappedStart,
      duration: finalDuration,
      damage: Math.round((char?.totalDamage || 100000) * (defaultMove.damageMultiplier ?? 0.25))
    };

    const updated = [...actions, newAction];
    commitUpdate(updated, totalDuration);
    setSelectedActionId(newAction.id);
    setCurrentTime(snappedStart);
    showToast(`Golpe criado em ${snappedStart}s (${newAction.actionLabel})`);
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
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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

  // Switch Action Type Pill (Quick type change)
  const handleSelectActionType = (type: ActionType) => {
    if (!selectedActionId) return;
    const act = actions.find(a => a.id === selectedActionId);
    if (!act) return;

    const char = characters[act.charIndex];
    const charMoves = getCharacterMoveOptions(char?.name || '', char?.element);
    const matchingMove = charMoves.find(m => m.type === type);

    const newLabel = matchingMove ? matchingMove.label : 
      type === 'burst' ? 'Q (Supremo)' :
      type === 'skill' ? 'E (Habilidade)' :
      type === 'swap' ? 'Swap In' :
      type === 'charged' ? 'Ataque Carregado' :
      type === 'plunge' ? 'Ataque Imersivo' : 'Combo Normal';

    const newDuration = matchingMove ? matchingMove.duration : act.duration;
    const newDamage = matchingMove && matchingMove.damageMultiplier 
      ? Math.round((char?.totalDamage || 100000) * matchingMove.damageMultiplier)
      : act.damage;

    handleUpdateAction(selectedActionId, {
      actionType: type,
      actionLabel: newLabel,
      duration: newDuration,
      damage: newDamage
    });

    showToast(`Tipo alterado para ${type.toUpperCase()}`);
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

  // Visual Badges & Color Palettes
  const getActionBadgeText = (type: ActionType): string => {
    switch (type) {
      case 'burst': return '[Q]';
      case 'skill': return '[E]';
      case 'normal': return '[N]';
      case 'charged': return '[CA]';
      case 'swap': return '[Swap]';
      case 'plunge': return '[Plunge]';
      case 'special': return '[EX]';
      default: return '[Act]';
    }
  };

  const getActionColor = (type: TimelineAction['actionType']) => {
    switch (type) {
      case 'burst':
        return 'from-purple-950/95 via-purple-900/85 to-slate-900/90 border-purple-500/40 text-purple-200';
      case 'skill':
        return 'from-amber-950/95 via-amber-900/85 to-slate-900/90 border-amber-500/40 text-amber-200';
      case 'charged':
        return 'from-rose-950/95 via-rose-900/85 to-slate-900/90 border-rose-500/40 text-rose-200';
      case 'normal':
        return 'from-slate-800/95 to-slate-900/95 border-slate-700 text-slate-300';
      case 'swap':
        return 'from-cyan-950/95 via-cyan-900/80 to-slate-900/90 border-cyan-500/40 text-cyan-200';
      case 'plunge':
        return 'from-indigo-950/95 via-indigo-900/85 to-slate-900/90 border-indigo-500/40 text-indigo-200';
      default:
        return 'from-slate-800 to-slate-900 border-slate-700 text-slate-300';
    }
  };

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case 'burst':
        return <Zap className="w-3 h-3 text-purple-300 flex-shrink-0" />;
      case 'skill':
        return <Sparkles className="w-3 h-3 text-amber-300 flex-shrink-0" />;
      case 'charged':
        return <Flame className="w-3 h-3 text-rose-300 flex-shrink-0" />;
      case 'normal':
        return <Swords className="w-3 h-3 text-slate-300 flex-shrink-0" />;
      case 'swap':
        return <ArrowLeftRight className="w-3 h-3 text-cyan-300 flex-shrink-0" />;
      case 'plunge':
        return <ArrowDown className="w-3 h-3 text-indigo-300 flex-shrink-0" />;
      default:
        return <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />;
    }
  };

  const actionTypesList: Array<{
    type: ActionType;
    label: string;
    badge: string;
    icon: React.FC<{ className?: string }>;
    colorClass: string;
  }> = [
    { type: 'skill', label: 'Habilidade (E)', badge: '[E]', icon: Sparkles, colorClass: 'bg-amber-950/70 border-amber-500/60 text-amber-300' },
    { type: 'burst', label: 'Supremo (Q)', badge: '[Q]', icon: Zap, colorClass: 'bg-purple-950/70 border-purple-500/60 text-purple-300' },
    { type: 'normal', label: 'Ataque Normal', badge: '[N]', icon: Swords, colorClass: 'bg-slate-900/80 border-slate-700 text-slate-300' },
    { type: 'charged', label: 'Carregado (CA)', badge: '[CA]', icon: Flame, colorClass: 'bg-rose-950/70 border-rose-500/60 text-rose-300' },
    { type: 'swap', label: 'Troca (Swap)', badge: '[Swap]', icon: ArrowLeftRight, colorClass: 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300' },
    { type: 'plunge', label: 'Imersivo (Plunge)', badge: '[Plunge]', icon: ArrowDown, colorClass: 'bg-indigo-950/70 border-indigo-500/60 text-indigo-300' }
  ];

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#070b14] border border-slate-800 shadow-2xl space-y-6 select-none relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-cyan-500/50 text-cyan-300 shadow-2xl text-xs font-mono font-bold animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Rich Tooltip Portal on Hover (Never clipped by track overflow) */}
      {hoveredActionData && !draggingActionId && (
        <div 
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 shadow-2xl animate-fade-in"
          style={{ 
            left: Math.max(160, Math.min(window.innerWidth - 160, hoveredActionData.rect.left + hoveredActionData.rect.width / 2)), 
            top: hoveredActionData.rect.top - 6 
          }}
        >
          <div className="w-72 p-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 text-xs space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <CharacterAvatar 
                  name={hoveredActionData.action.charName} 
                  element={(characters[hoveredActionData.action.charIndex]?.element as any) || 'Pyro'} 
                  size="xs" 
                  showBorder={false} 
                />
                <span className="font-bold text-white text-xs">{hoveredActionData.action.charName}</span>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-300">
                {getActionBadgeText(hoveredActionData.action.actionType)} {hoveredActionData.action.actionType.toUpperCase()}
              </span>
            </div>

            {/* Action Details */}
            <div>
              <p className="font-bold text-sm text-slate-100 truncate">
                {hoveredActionData.action.actionLabel}
              </p>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                <span>Tempo: <strong className="text-cyan-300">{hoveredActionData.action.startTime.toFixed(1)}s - {(hoveredActionData.action.startTime + hoveredActionData.action.duration).toFixed(1)}s</strong></span>
                <span>Duração: <strong className="text-white">{hoveredActionData.action.duration.toFixed(1)}s</strong></span>
              </div>
              {hoveredActionData.action.damage && (
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Dano Estimado: <strong className="text-rose-400">{hoveredActionData.action.damage.toLocaleString('pt-BR')}</strong>
                </div>
              )}
            </div>

            {/* Active Buffs during this window */}
            {(() => {
              const actionBuffs = liveBuffs.filter(b => 
                b.startTime < (hoveredActionData.action.startTime + hoveredActionData.action.duration) &&
                b.endTime > hoveredActionData.action.startTime
              );
              if (actionBuffs.length === 0) return null;
              return (
                <div className="pt-1.5 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Buffs Ativos ({actionBuffs.length}):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {actionBuffs.map(b => (
                      <span 
                        key={b.id} 
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded text-white font-bold"
                        style={{ backgroundColor: `${b.color}40`, border: `1px solid ${b.color}80` }}
                      >
                        {b.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Tooltip Footer Shortcut Hint */}
            <div className="pt-1.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Arraste p/ mover</span>
              <span>•</span>
              <span>Clique p/ inspecionar</span>
              <span>•</span>
              <span>Del p/ apagar</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white font-cinzel tracking-wide">
                Linha do Tempo & Sequência de Rotação
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
              Clique em um espaço vazio para criar um golpe, arraste para reposicionar no tempo ou selecione para inspecionar no painel.
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
      <div className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-2xl bg-[#0c111e] border border-slate-800/80 shadow-inner">
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

        {/* Live on-field status readout & Auto-Cascade Button */}
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

      {/* Main Multi-lane Graphic Track (Pixel-Perfect Alignment & Click-to-Create) */}
      <div 
        className="space-y-3 overflow-x-auto pb-2"
        onClick={() => setSelectedActionId(null)}
      >
        <div className="min-w-[760px] space-y-2.5">
          
          {/* Time Ruler (Identical 2-column flex layout for 100% tick alignment) */}
          <div className="flex items-center gap-2 p-1.5">
            {/* Left Header Spacer */}
            <div className="w-28 sm:w-32 pr-2 border-r border-transparent flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tempo (s)</span>
            </div>

            {/* Right Ruler Area with Drag-Scrubbing */}
            <div 
              ref={rulerRef}
              className="flex-1 relative h-6 border-b border-slate-800 cursor-ew-resize select-none"
              onMouseDown={handleRulerScrubStart}
              title="Clique ou arraste para posicionar a agulha de reprodução"
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

                {/* Track Lane (Right Area) — Click to Create in Empty Space */}
                <div 
                  ref={el => { laneRefs.current[charIdx] = el; }}
                  className="flex-1 h-12 bg-slate-900/60 hover:bg-slate-900/80 rounded-xl relative overflow-hidden border border-slate-800/60 cursor-crosshair transition-colors"
                  onClick={(e) => handleTrackClickToCreate(e, charIdx)}
                  title="Clique em um espaço vazio para criar uma nova ação com snap magnético (0.5s)"
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

                  {/* Action Blocks (Clean, No Emojis, No Internal Delete Buttons, Tooltip on Hover) */}
                  {charActions.map((action) => {
                    const leftPct = (action.startTime / totalDuration) * 100;
                    const widthPct = Math.max(3.0, (action.duration / totalDuration) * 100);
                    const isSelected = selectedActionId === action.id;
                    const isCurrentlyActive = currentTime >= action.startTime && currentTime < (action.startTime + action.duration);
                    const isDragging = draggingActionId === action.id;

                    // Narrow block detection: If under 1.2s or narrow percentage, hide cramped text
                    const isCompact = action.duration < 1.2 || widthPct < 7.5;

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
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredActionData({ action, rect });
                        }}
                        onMouseLeave={() => {
                          setHoveredActionData(null);
                        }}
                        className={`absolute top-1.5 bottom-1.5 rounded-lg border flex items-center justify-between gap-1.5 px-2 text-[10px] font-mono font-bold transition-all duration-150 select-none shadow-md overflow-hidden ${
                          isSelected 
                            ? 'ring-2 ring-cyan-400 border-cyan-400 z-30 scale-[1.02] shadow-lg shadow-cyan-500/30' 
                            : isCurrentlyActive
                              ? 'ring-2 ring-emerald-400 border-emerald-400 z-20 shadow-md shadow-emerald-500/20'
                              : 'hover:brightness-125 z-10'
                        } ${isDragging ? 'opacity-80 cursor-grabbing' : 'cursor-grab'} bg-gradient-to-r ${getActionColor(action.actionType)}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`
                        }}
                      >
                        {/* Compact vs Normal Representation */}
                        {isCompact ? (
                          <div className="w-full flex items-center justify-center gap-1">
                            {getActionIcon(action.actionType)}
                            <span className="text-[10px] font-bold tracking-tight">
                              {getActionBadgeText(action.actionType)}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 font-bold opacity-90 flex-shrink-0">
                                {getActionBadgeText(action.actionType)}
                              </span>
                              {getActionIcon(action.actionType)}
                              <span className="truncate text-[10px] font-medium text-slate-100">
                                {action.actionLabel}
                              </span>
                            </div>

                            <span className="text-[9px] opacity-75 font-mono ml-auto flex-shrink-0">
                              {action.duration}s
                            </span>
                          </>
                        )}
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

      {/* 1. PAINEL FIXO DE PROPRIEDADES / AÇÕES (ACTION INSPECTOR SEMPRE VISÍVEL) */}
      {selectedAction ? (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="p-5 sm:p-6 rounded-2xl bg-[#0a0f1d] border-2 border-cyan-500/50 shadow-2xl shadow-cyan-950/30 space-y-5 animate-fade-in transition-all"
        >
          {/* Header Bar of Selected Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <CharacterAvatar 
                name={selectedAction.charName} 
                element={(characters[selectedAction.charIndex]?.element as any) || 'Pyro'} 
                size="md" 
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                    Ação Selecionada
                  </span>
                  <span className="text-base font-black text-white font-sans">
                    {selectedAction.charName}
                  </span>
                  <span className="text-base font-bold text-cyan-300 font-sans">
                    • {selectedAction.actionLabel}
                  </span>
                  {selectedAction.charIndex === carryIndex && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold">
                      CARRY DPS
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1 flex-wrap">
                  <span>Início: <strong className="text-white">{selectedAction.startTime.toFixed(1)}s</strong></span>
                  <span>•</span>
                  <span>Duração: <strong className="text-white">{selectedAction.duration.toFixed(1)}s</strong></span>
                  <span>•</span>
                  <span>Fim: <strong className="text-white">{(selectedAction.startTime + selectedAction.duration).toFixed(1)}s</strong></span>
                  {selectedAction.damage && (
                    <>
                      <span>•</span>
                      <span>Dano Estimado: <strong className="text-rose-400">{selectedAction.damage.toLocaleString('pt-BR')}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Danger Action & Quick Utilities */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              <button
                type="button"
                onClick={() => handleSnapToPrevious(selectedAction.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer transition-all"
                title="Encosta este golpe no final da ação anterior na rotação"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Encostar no Anterior</span>
              </button>

              <button
                type="button"
                onClick={() => handleDuplicateAction(selectedAction.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-all"
                title="Duplica este golpe"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar</span>
              </button>

              {/* Explicit Highlighted Danger Action Button */}
              <button
                type="button"
                onClick={() => handleDeleteAction(selectedAction.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 hover:text-white border border-rose-600 text-xs font-bold cursor-pointer transition-all shadow-md shadow-rose-950/40"
                title="Remover esta ação da linha do tempo (Delete ou Backspace)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover Ação</span>
                <kbd className="text-[10px] px-1 py-0.2 rounded bg-black/40 text-rose-300 border border-rose-700/50 font-mono">Del</kbd>
              </button>

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

          {/* Section 1: Action Type Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
              Tipo da Habilidade:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {actionTypesList.map(({ type, label, badge, icon: Icon, colorClass }) => {
                const isCurrent = selectedAction.actionType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSelectActionType(type)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isCurrent 
                        ? `${colorClass} ring-2 ring-cyan-400 shadow-md`
                        : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10">{badge}</span>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Timing Precision Controls (Start Time & Duration) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time Stepper & Slider */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                  <MoveHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                  Momento de Início:
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={Math.max(0, totalDuration - selectedAction.duration)}
                    value={selectedAction.startTime}
                    onChange={(e) => handleUpdateAction(selectedAction.id, { startTime: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-xs text-right outline-none focus:border-cyan-400"
                  />
                  <span className="text-xs text-slate-500 font-mono">s</span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max={Math.max(0, totalDuration - selectedAction.duration)}
                step="0.1"
                value={selectedAction.startTime}
                onChange={(e) => handleUpdateAction(selectedAction.id, { startTime: parseFloat(e.target.value) || 0 })}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              {/* Stepper Nudge Buttons */}
              <div className="flex items-center justify-between gap-1 font-mono text-[11px]">
                {[-1.0, -0.5, -0.1, 0.1, 0.5, 1.0].map(delta => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => handleNudgeAction(selectedAction.id, delta)}
                    className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer text-center"
                  >
                    {delta > 0 ? `+${delta}s` : `${delta}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Stepper, Presets & Slider */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Duração da Ação:
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="10.0"
                    value={selectedAction.duration}
                    onChange={(e) => handleUpdateAction(selectedAction.id, { duration: parseFloat(e.target.value) || 1.0 })}
                    className="w-16 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-xs text-right outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-slate-500 font-mono">s</span>
                </div>
              </div>

              <input
                type="range"
                min="0.2"
                max="8.0"
                step="0.1"
                value={selectedAction.duration}
                onChange={(e) => handleUpdateAction(selectedAction.id, { duration: parseFloat(e.target.value) || 1.0 })}
                className="w-full accent-amber-400 cursor-pointer"
              />

              {/* Duration Presets */}
              <div className="flex items-center justify-between gap-1 font-mono text-[10px]">
                {[
                  { dur: 0.5, label: '0.5s Troca' },
                  { dur: 1.0, label: '1.0s Rápido' },
                  { dur: 1.5, label: '1.5s Habilidade' },
                  { dur: 2.0, label: '2.0s Supremo' },
                  { dur: 3.0, label: '3.0s Combo' }
                ].map(p => (
                  <button
                    key={p.dur}
                    type="button"
                    onClick={() => handleUpdateAction(selectedAction.id, { duration: p.dur })}
                    className={`flex-1 py-1 rounded border transition-colors cursor-pointer text-center ${
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

          {/* Section 3: Modifiers & Active Buffs (Snapshot / Buff tags) */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Buffs Ativos & Modificadores da Equipe:</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Janela: {selectedAction.startTime.toFixed(1)}s - {(selectedAction.startTime + selectedAction.duration).toFixed(1)}s
              </span>
            </div>

            {activeBuffsForSelectedAction.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {activeBuffsForSelectedAction.map(buff => (
                  <div 
                    key={buff.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white shadow-sm"
                    style={{
                      backgroundColor: `${buff.color}25`,
                      border: `1px solid ${buff.color}60`
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: buff.color }} />
                    <span>{buff.name}</span>
                    <span className="text-[10px] text-amber-300 font-normal">({buff.statBonus})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-500 italic">
                Nenhum buff de equipe ativo nesta janela de tempo ({selectedAction.startTime.toFixed(1)}s - {(selectedAction.startTime + selectedAction.duration).toFixed(1)}s).
              </div>
            )}
          </div>

          {/* Section 4: Official Kit Strikes Quick Switcher */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Talentos Oficiais Disponíveis ({selectedAction.charName}):</span>
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
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-950/90 border-cyan-400 text-white ring-1 ring-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-cyan-300 font-bold uppercase">
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
      ) : (
        /* Empty State Inspector (Sempre visível para manter a estabilidade do layout) */
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl transition-all">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-center text-cyan-400 shadow-inner flex-shrink-0">
                <Sliders className="w-6 h-6 opacity-70" />
              </div>
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h4 className="text-sm font-bold text-slate-200 font-cinzel">Painel de Propriedades (Action Inspector)</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">Pronto para Edição</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione qualquer ação na timeline para editar propriedades, ou <strong className="text-cyan-300">clique em um espaço vazio</strong> da trilha para criar um novo golpe com snap magnético.
                </p>
              </div>
            </div>

            {/* Productivity Keyboard & Mouse Shortcuts Guide */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 flex-wrap justify-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Clique Vazio: Criar</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <MoveHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Arrastar: Mover</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Del: Excluir</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Espaço: Play/Pausa</span>
              </div>
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
            <span>[Q] Supremo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-amber-500/60 border border-amber-400/50" />
            <span>[E] Habilidade</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-rose-500/60 border border-rose-400/50" />
            <span>[CA] Carregado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-slate-700/80 border border-slate-600/50" />
            <span>[N] Normais</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-cyan-600/60 border border-cyan-400/50" />
            <span>[Swap] Troca</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span>Clique em espaço vazio para criar</span>
          <span>•</span>
          <span>Arraste para mover</span>
          <span>•</span>
          <span>Del para apagar</span>
          <span>•</span>
          <span>Espaço para Play</span>
        </div>
      </div>

    </div>
  );
};
