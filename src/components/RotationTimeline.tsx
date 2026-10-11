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

  const selectedAction = liveActionsWithBuffs.find(a => a.id === selectedActionId) || (liveActionsWithBuffs.length > 0 ? liveActionsWithBuffs[0] : null);

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

  // Add Action explicitly for a character
  const handleAddAction = (charIdx: number, type: ActionType = 'skill', label?: string, duration: number = 1.2) => {
    const char = characters[charIdx] || characters[0];
    const charName = char?.name || 'Personagem';
    const availableMoves = getCharacterMoveOptions(charName, char?.element);
    const matchingMove = availableMoves.find(m => m.type === type);

    const charActions = actions.filter(a => a.charIndex === charIdx);
    const lastCharAct = charActions.length > 0 
      ? charActions.sort((a, b) => (b.startTime + b.duration) - (a.startTime + a.duration))[0] 
      : null;

    let start = lastCharAct 
      ? parseFloat((lastCharAct.startTime + lastCharAct.duration).toFixed(1)) 
      : (actions.length > 0 ? Math.max(...actions.map(a => a.startTime + a.duration)) : 0.0);

    const dur = matchingMove ? matchingMove.duration : duration;
    if (start + dur > totalDuration) {
      start = Math.max(0, parseFloat((totalDuration - dur).toFixed(1)));
    }

    const newAct: TimelineAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      charIndex: charIdx,
      charName,
      actionType: type,
      actionLabel: label || (matchingMove ? matchingMove.label : type === 'burst' ? 'Q (Supremo)' : 'E (Habilidade)'),
      startTime: Math.max(0, parseFloat(start.toFixed(1))),
      duration: dur,
      damage: Math.round((char?.totalDamage || 100000) * (matchingMove?.damageMultiplier ?? 0.25))
    };

    const updated = [...actions, newAct];
    commitUpdate(updated, totalDuration);
    setSelectedActionId(newAct.id);
    setCurrentTime(newAct.startTime);
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

  // Cores por tipo de golpe: blocos chapados, sem degradê.
  const BLOCK_STYLE: Record<string, string> = {
    burst: 'bg-purple-400 text-slate-950',
    skill: 'bg-purple-900 text-purple-100 border border-purple-700',
    normal: 'bg-slate-700 text-slate-100',
    charged: 'bg-rose-800 text-rose-50',
    swap: 'bg-cyan-800 text-cyan-50',
    plunge: 'bg-emerald-800 text-emerald-50',
    special: 'bg-slate-600 text-slate-100'
  };
  const blockStyle = (type: ActionType) => BLOCK_STYLE[type] || BLOCK_STYLE.special;

  const selected = selectedActionId ? liveActionsWithBuffs.find(a => a.id === selectedActionId) || null : null;
  const selectedChar = selected ? characters[selected.charIndex] : null;
  const selectedMoves = selected ? getCharacterMoveOptions(selected.charName, selectedChar?.element) : [];
  const selectedMoveId = selectedMoves.find(m => m.label === selected?.actionLabel)?.id ?? '';

  const numInput =
    'w-16 px-2 py-1 rounded-md bg-slate-950 border border-slate-700 text-sm font-mono text-slate-100 focus:outline-none focus:border-purple-400';

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 select-none relative">

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm">
          {toastMessage}
        </div>
      )}

      {/* Tooltip leve ao passar o mouse */}
      {hoveredActionData && !draggingActionId && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{
            left: Math.max(120, Math.min(window.innerWidth - 120, hoveredActionData.rect.left + hoveredActionData.rect.width / 2)),
            top: hoveredActionData.rect.top - 6
          }}
        >
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs space-y-0.5 shadow-lg">
            <p className="font-semibold text-slate-100">{hoveredActionData.action.actionLabel}</p>
            <p className="text-slate-400 font-mono">
              {hoveredActionData.action.startTime.toFixed(1)}s – {(hoveredActionData.action.startTime + hoveredActionData.action.duration).toFixed(1)}s
              {hoveredActionData.action.damage ? ` · ${hoveredActionData.action.damage.toLocaleString('pt-BR')} dano` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Barra superior: título à esquerda, controles de reprodução à direita */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-semibold text-slate-50 font-cinzel">Rotação</h3>
          <p className="text-sm text-slate-400">
            {actions.length} golpes · {efficiency}% de buffs no carry
            {hasCharacterOverlaps && <span className="text-purple-300"> · golpes sobrepostos</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-400 hover:bg-purple-300 text-slate-950 text-sm font-semibold cursor-pointer transition-colors"
            title="Reproduzir (Espaço)"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isPlaying ? 'Pausar' : 'Reproduzir'}
          </button>
          <button
            type="button"
            onClick={handleResetPlayback}
            className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors"
            title="Voltar ao início"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setPlaybackSpeed(s => (s >= 2 ? 0.5 : s === 0.5 ? 1 : s === 1 ? 1.5 : 2))}
            className="w-12 py-1.5 rounded-lg border border-slate-700 text-sm font-mono text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors"
            title="Velocidade"
          >
            {playbackSpeed}×
          </button>
          <span className="font-mono text-sm text-slate-300 w-24 text-right">
            {currentTime.toFixed(1)} / {totalDuration.toFixed(0)}s
          </span>
          <button
            type="button"
            onClick={handleAutoCascade}
            className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors"
            title="Alinhar golpes em sequência, sem sobreposição"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Linhas por personagem */}
      <div className="px-5 pt-4 pb-3 overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Régua */}
          <div className="flex items-end gap-3 mb-1">
            <div className="w-36 flex-shrink-0" />
            <div
              ref={rulerRef}
              className="flex-1 relative h-6 cursor-ew-resize"
              onMouseDown={handleRulerScrubStart}
              title="Arraste para posicionar a agulha"
            >
              {timeMarkers.map(sec => (
                <span
                  key={sec}
                  className="absolute -translate-x-1/2 text-xs font-mono text-slate-500 pointer-events-none"
                  style={{ left: `${(sec / totalDuration) * 100}%` }}
                >
                  {sec}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            {characters.map((char, charIdx) => {
              const charActions = liveActionsWithBuffs.filter(a => a.charIndex === charIdx);
              const isCarry = charIdx === carryIndex;
              const isOnFieldNow = activeOnFieldAction?.charIndex === charIdx;

              return (
                <div key={charIdx} className="flex items-center gap-3">
                  <div className="w-36 flex-shrink-0 flex items-center gap-2">
                    <CharacterAvatar name={char.name} element={char.element as any} size="sm" showElementDot={false} />
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${isOnFieldNow ? 'text-purple-300 font-semibold' : 'text-slate-200'}`}>
                        {char.name}
                      </p>
                      {isCarry && <p className="text-xs text-slate-500 leading-none">carry</p>}
                    </div>
                  </div>

                  <div
                    ref={el => { laneRefs.current[charIdx] = el; }}
                    className="flex-1 h-11 rounded-md bg-slate-950 border border-slate-800 relative overflow-hidden cursor-crosshair"
                    onClick={(e) => handleTrackClickToCreate(e, charIdx)}
                    title="Clique num espaço vazio para criar um golpe"
                  >
                    {timeMarkers.map(sec => (
                      <div
                        key={sec}
                        className="absolute top-0 bottom-0 w-px bg-slate-800 pointer-events-none"
                        style={{ left: `${(sec / totalDuration) * 100}%` }}
                      />
                    ))}

                    {charActions.map(action => {
                      const leftPct = (action.startTime / totalDuration) * 100;
                      const widthPct = Math.max(3.0, (action.duration / totalDuration) * 100);
                      const isSelected = selectedActionId === action.id;
                      const isDragging = draggingActionId === action.id;
                      const isCompact = action.duration < 1.2 || widthPct < 7.5;
                      const short = getActionBadgeText(action.actionType).replace(/[\[\]]/g, '');

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
                          onClick={(e) => e.stopPropagation()}
                          onMouseEnter={(e) => setHoveredActionData({ action, rect: e.currentTarget.getBoundingClientRect() })}
                          onMouseLeave={() => setHoveredActionData(null)}
                          className={`absolute top-1 bottom-1 rounded px-1.5 flex items-center text-xs font-semibold overflow-hidden ${blockStyle(action.actionType)} ${
                            isSelected ? 'outline outline-2 outline-slate-50 z-30' : 'z-10 hover:brightness-110'
                          } ${isDragging ? 'opacity-80 cursor-grabbing' : 'cursor-grab'}`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        >
                          <span className="truncate">{isCompact ? short : action.actionLabel}</span>
                        </div>
                      );
                    })}

                    {/* Agulha */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-rose-400 z-40 pointer-events-none"
                      style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Buffs: uma faixa fina por buff, só o nome */}
            {liveBuffs.length > 0 && (
              <div className="flex gap-3 pt-2">
                <div className="w-36 flex-shrink-0 text-sm text-slate-500 pt-0.5">Buffs</div>
                <div className="flex-1 space-y-1">
                  {liveBuffs.map(buff => {
                    const leftPct = (buff.startTime / totalDuration) * 100;
                    const widthPct = Math.max(3.5, ((buff.endTime - buff.startTime) / totalDuration) * 100);
                    return (
                      <div key={buff.id} className="relative h-5 rounded bg-slate-950 border border-slate-800">
                        <div
                          className="absolute top-0 bottom-0 rounded px-1.5 flex items-center text-xs text-slate-100 truncate"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: `${buff.color}33`,
                            borderLeft: `3px solid ${buff.color}`
                          }}
                          title={`${buff.name} (${buff.startTime}s–${buff.endTime}s): ${buff.statBonus} · ${buff.sourceChar}`}
                        >
                          <span className="truncate">{buff.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor: só aparece quando um golpe está selecionado */}
      {selected ? (
        <div className="flex flex-wrap items-end gap-4 px-5 py-4 border-t border-slate-800 bg-slate-950/50 rounded-b-xl">
          <div className="min-w-[180px] flex-1">
            <label className="block text-xs text-slate-500 mb-1">{selected.charName}</label>
            <select
              value={selectedMoveId}
              onChange={(e) => {
                const move = selectedMoves.find(m => m.id === e.target.value);
                if (move) handleSwitchActionStrike(move);
              }}
              className="w-full px-2 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-purple-400"
            >
              {selectedMoveId === '' && <option value="">{selected.actionLabel}</option>}
              {selectedMoves.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Início (s)</label>
            <input
              type="number"
              step={0.1}
              min={0}
              value={selected.startTime}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) handleUpdateAction(selected.id, { startTime: Math.max(0, Math.min(totalDuration - selected.duration, v)) });
              }}
              className={numInput}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Duração (s)</label>
            <input
              type="number"
              step={0.1}
              min={0.1}
              value={selected.duration}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0) handleUpdateAction(selected.id, { duration: Math.min(v, totalDuration - selected.startTime) });
              }}
              className={numInput}
            />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => handleDuplicateAction(selected.id)}
              className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
              title="Duplicar"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteAction(selected.id)}
              className="p-2 rounded-lg border border-slate-700 text-rose-400 hover:bg-slate-800 cursor-pointer"
              title="Remover (Del)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedActionId(null)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="px-5 py-3 border-t border-slate-800 text-sm text-slate-500 rounded-b-xl">
          Clique numa linha vazia para criar um golpe. Clique num golpe para editar; arraste para mover.
        </p>
      )}

      {/* Duração total */}
      <div className="flex items-center gap-2 px-5 pb-4 text-sm text-slate-400">
        <label htmlFor="rot-total">Duração da rotação</label>
        <input
          id="rot-total"
          type="number"
          min={1}
          step={1}
          value={totalDuration}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v > 0) commitUpdate(actions, v);
          }}
          className={numInput}
        />
        <span>s</span>
      </div>
    </div>
  );
};
