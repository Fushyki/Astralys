import { DamageAnalysisResult } from '../types/damageBreakdown';
import { TimelineAction, BuffTrack, RotationTimelineData, ActionType } from '../types/rotationTimeline';

/**
 * Astralys - Rotation Timeline Engine
 * Frame-accurate multi-lane timeline generation, user editing utilities,
 * and dynamic buff duration alignment based on real team action timings.
 */

/**
 * Dynamically computes buff durations and active windows based on the actual
 * actions placed in the timeline and character loadouts (weapons/artifacts).
 */
export function computeBuffsForTimeline(
  actions: TimelineAction[],
  characters: Array<{ name: string; element?: string; weapon?: string; artifactSet?: string; totalDamage?: number }>,
  rotationDuration: number
): BuffTrack[] {
  const buffs: BuffTrack[] = [];
  const duration = rotationDuration > 0 ? rotationDuration : 20;

  characters.forEach((char, idx) => {
    const cName = char.name.toLowerCase();
    const art = (char.artifactSet || '').toLowerCase();
    const wep = (char.weapon || '').toLowerCase();

    // 1. Bennett Q (Inspiration Field)
    if (cName.includes('bennett')) {
      const qAction = actions.find(a => a.charIndex === idx && a.actionType === 'burst') ||
                      actions.find(a => a.charName.toLowerCase().includes('bennett') && a.actionType === 'burst');
      const start = qAction ? parseFloat((qAction.startTime + 0.8).toFixed(1)) : 6.0;
      buffs.push({
        id: `buff-bennett-q-${idx}`,
        name: 'Campo do Bennett (+ATK Flat)',
        sourceChar: char.name,
        startTime: start,
        endTime: Math.min(duration, parseFloat((start + 12.0).toFixed(1))),
        statBonus: '+1250 ATK Flat & Cura',
        color: '#f97316',
        description: 'Campo de Inspiração concede bônus massivo de ATK baseado no ATK básico de Bennett'
      });
    }

    // 2. Noblesse Oblige (4p)
    if (art.includes('noblesse') || art.includes('nobreza') || art.includes('nobless')) {
      const qAction = actions.find(a => a.charIndex === idx && a.actionType === 'burst') ||
                      actions.find(a => a.charName.toLowerCase() === cName && a.actionType === 'burst');
      const start = qAction ? parseFloat((qAction.startTime + 0.5).toFixed(1)) : 5.5;
      buffs.push({
        id: `buff-noblesse-${idx}`,
        name: 'Nobreza Real (+20% ATK Equipe)',
        sourceChar: char.name,
        startTime: start,
        endTime: Math.min(duration, parseFloat((start + 12.0).toFixed(1))),
        statBonus: '+20% ATK Equipe',
        color: '#38bdf8',
        description: 'Ao usar o Supremo, aumenta o ATK de todos os membros da equipe em 20% por 12s'
      });
    }

    // 3. Scroll of the Hero of Cinder City (4p) / Pergaminho da Cidade de Cinzas
    if (art.includes('cinder') || art.includes('cinzas') || art.includes('herói')) {
      const triggerAction = actions.find(a => (a.charIndex === idx || a.charName.toLowerCase() === cName) && (a.actionType === 'skill' || a.actionType === 'burst'));
      const start = triggerAction ? parseFloat((triggerAction.startTime + 0.4).toFixed(1)) : 2.0;
      buffs.push({
        id: `buff-cinder-${idx}`,
        name: 'Cidade de Cinzas (+40% Dano Elemental)',
        sourceChar: char.name,
        startTime: start,
        endTime: Math.min(duration, parseFloat((start + 15.0).toFixed(1))),
        statBonus: '+40% Dano Elemental',
        color: '#eab308',
        description: 'Gera 40% de bônus de dano para os elementos envolvidos em reações da Alma da Noite'
      });
    }

    // 4. Instructor (4p) / Instrutor
    if (art.includes('instructor') || art.includes('instrutor')) {
      const triggerAction = actions.find(a => (a.charIndex === idx || a.charName.toLowerCase() === cName) && (a.actionType === 'skill' || a.actionType === 'burst'));
      const start = triggerAction ? parseFloat((triggerAction.startTime + 0.3).toFixed(1)) : 7.0;
      buffs.push({
        id: `buff-instructor-${idx}`,
        name: 'Instrutor (+120 EM Equipe)',
        sourceChar: char.name,
        startTime: start,
        endTime: Math.min(duration, parseFloat((start + 8.0).toFixed(1))),
        statBonus: '+120 Proficiência Elemental',
        color: '#10b981',
        description: 'Ao desencadear uma reação elemental, aumenta a Proficiência Elemental da equipe em 120 por 8s'
      });
    }

    // 5. Thrilling Tales of Dragon Slayers (TTDS / Histórias de Caçadores de Dragões)
    if (wep.includes('ttds') || wep.includes('dragon') || wep.includes('caçador')) {
      // TTDS passes when this support leaves the field and the Carry (charIndex 0) enters
      const supportActions = actions.filter(a => a.charIndex === idx || a.charName.toLowerCase() === cName);
      const lastSupportAction = supportActions[supportActions.length - 1];
      const carryActions = actions.filter(a => a.charIndex === 0 && (lastSupportAction ? a.startTime >= lastSupportAction.startTime : true));
      const firstCarryAction = carryActions[0];

      const start = firstCarryAction 
        ? parseFloat(firstCarryAction.startTime.toFixed(1)) 
        : (lastSupportAction ? parseFloat((lastSupportAction.startTime + lastSupportAction.duration).toFixed(1)) : 10.0);

      buffs.push({
        id: `buff-ttds-${idx}`,
        name: 'TTDS (+48% ATK Carry)',
        sourceChar: char.name,
        startTime: start,
        endTime: Math.min(duration, parseFloat((start + 10.0).toFixed(1))),
        statBonus: '+48% ATK no Carry',
        color: '#ec4899',
        description: 'Ao trocar para o Carry, concede +48% de ATK adicional por 10s'
      });
    }

    // 6. Xilonen Samplers / Res Shred
    if (cName.includes('xilonen')) {
      const xiloAction = actions.find(a => (a.charIndex === idx || a.charName.toLowerCase().includes('xilonen')) && a.actionType === 'skill');
      const start = xiloAction ? parseFloat((xiloAction.startTime + 0.5).toFixed(1)) : 1.0;
      buffs.push({
        id: `buff-xilonen-${idx}`,
        name: 'Amostradores de Xilonen (-36% RES)',
        sourceChar: char.name,
        startTime: start,
        endTime: Math.min(duration, parseFloat((start + 15.0).toFixed(1))),
        statBonus: '-36% RES Elemental',
        color: '#d97706',
        description: 'Reduz as resistências elementais de Pyro, Hydro, Cryo e Electro em 36% por 15s'
      });
    }

    // 7. Viridescent Venerer (4p) / Sombra Verde (VV)
    if (art.includes('viridescent') || art.includes('sombra') || cName.includes('sucrose') || cName.includes('kazuha')) {
      const anemoAction = actions.find(a => (a.charIndex === idx || a.charName.toLowerCase() === cName) && (a.actionType === 'skill' || a.actionType === 'burst'));
      const start = anemoAction ? parseFloat((anemoAction.startTime + 0.4).toFixed(1)) : 8.0;
      buffs.push({
        id: `buff-vv-${idx}`,
        name: 'Sombra Verde (-40% RES Shred)',
        sourceChar: char.name,
        startTime: start,
        endTime: Math.min(duration, parseFloat((start + 10.0).toFixed(1))),
        statBonus: '-40% RES Elemental',
        color: '#14b8a6',
        description: 'Reduz a resistência elemental do inimigo contra o elemento dispersado em 40% por 10s'
      });
    }

    // 8. Furina Q (Fanfarra Universal)
    if (cName.includes('furina')) {
      const qAction = actions.find(a => (a.charIndex === idx || a.charName.toLowerCase().includes('furina')) && a.actionType === 'burst');
      const start = qAction ? parseFloat((qAction.startTime + 1.0).toFixed(1)) : 2.0;
      buffs.push({
        id: `buff-furina-${idx}`,
        name: 'Fanfarra da Furina (+75% Dano)',
        sourceChar: char.name,
        startTime: start,
        endTime: Math.min(duration, parseFloat((start + 18.0).toFixed(1))),
        statBonus: '+75% Dano Universal',
        color: '#3b82f6',
        description: 'Salão Solitário concede bônus dinâmico de dano para toda a equipe'
      });
    }
  });

  // 9. Polar Star Field / Mecânicas Estelares (Snezhnaya / Sandrone / Columbina)
  const hasStellar = characters.some(c => {
    const n = c.name.toLowerCase();
    return n.includes('sandrone') || n.includes('columbina') || n.includes('flins');
  });
  if (hasStellar) {
    buffs.push({
      id: 'buff-polar-star',
      name: 'Campo Polar Star (Reações Estelares)',
      sourceChar: 'Snezhnaya Field',
      startTime: 2.0,
      endTime: Math.min(duration, 17.5),
      statBonus: '+140 EM & +28% Reações Estelares',
      color: '#818cf8',
      description: 'Aura contínua de amplificação de reações Lunares e Estelares'
    });
  }

  // Fallback if no specific buffs generated
  if (buffs.length === 0) {
    buffs.push({
      id: 'buff-standard-res',
      name: 'Ressonância Elemental da Equipe',
      sourceChar: 'Equipe',
      startTime: 0.0,
      endTime: duration,
      statBonus: '+25% ATK / +15% Taxa CR',
      color: '#f43f5e',
      description: 'Bônus passivo permanente da sinergia elemental dos 4 membros'
    });
  }

  return buffs;
}

/**
 * Cross-references active buffs for each action based on its time window.
 */
export function syncBuffsToActions(actions: TimelineAction[], buffs: BuffTrack[]): void {
  actions.forEach(action => {
    const actMid = action.startTime + (action.duration / 2);
    const activeHere = buffs.filter(b => actMid >= b.startTime && actMid <= b.endTime);
    action.buffsActive = activeHere.map(b => b.name);
  });
}

/**
 * Automatically lines up actions in sequential order without overlaps.
 */
export function autoSequenceActions(actions: TimelineAction[], bufferTime: number = 0.0): TimelineAction[] {
  const sorted = [...actions].sort((a, b) => a.startTime - b.startTime);
  let cur = 0.0;
  return sorted.map(act => {
    const updated = {
      ...act,
      startTime: parseFloat(cur.toFixed(1))
    };
    cur += act.duration + bufferTime;
    return updated;
  });
}

/**
 * Astralys - Rotation Timeline Generator
 * Builds a realistic initial sequence of actions based on the team's characters,
 * spreadsheet hits and rotation duration, then computes dynamic buff alignments.
 */
export function generateTimelineFromDamageResult(result: DamageAnalysisResult): RotationTimelineData {
  const duration = result.rotationDuration > 0 ? result.rotationDuration : 20;
  const chars = result.characters || [];
  const numChars = Math.min(4, chars.length);

  const actions: TimelineAction[] = [];
  let actionIdCounter = 1;

  // Check if we have Mavuika Natlan setup
  const carry = chars[0];
  const carryName = (carry?.name || '').toLowerCase();

  if (carryName.includes('mavuika')) {
    // Bennett -> Buffer 2 (Xilonen or Iansan) -> Citlali (TTDS) -> Mavuika (Nuke Q + Carregados)
    let curTime = 0.0;

    // Slot 2 or 3: Xilonen or Iansan
    const bufferChar = chars.find(c => {
      const n = c.name.toLowerCase();
      return n.includes('xilonen') || n.includes('iansan');
    });
    if (bufferChar) {
      const bIdx = chars.indexOf(bufferChar);
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: bIdx,
        charName: bufferChar.name,
        actionType: 'skill',
        actionLabel: bufferChar.name.toLowerCase().includes('xilonen') ? 'E (Amostradores) + 2N' : 'E (Campo Eletro)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.8,
        damage: Math.round((bufferChar.totalDamage || 0) * 0.4),
        particles: 4
      });
      curTime += 1.8;
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: bIdx,
        charName: bufferChar.name,
        actionType: 'burst',
        actionLabel: 'Q (Supremo)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.6,
        damage: Math.round((bufferChar.totalDamage || 0) * 0.6)
      });
      curTime += 1.6;
    }

    // Bennett
    const bennettChar = chars.find(c => c.name.toLowerCase().includes('bennett'));
    if (bennettChar) {
      const bIdx = chars.indexOf(bennettChar);
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: bIdx,
        charName: bennettChar.name,
        actionType: 'burst',
        actionLabel: 'Q (Viagem Fantástica)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.8,
        damage: Math.round((bennettChar.totalDamage || 0) * 0.7)
      });
      curTime += 1.8;
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: bIdx,
        charName: bennettChar.name,
        actionType: 'skill',
        actionLabel: 'E (Sobrecarga de Paixão)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.0,
        damage: Math.round((bennettChar.totalDamage || 0) * 0.3),
        particles: 3
      });
      curTime += 1.0;
    }

    // Citlali (TTDS + Instrutor -> passes directly to Mavuika)
    const citlaliChar = chars.find(c => c.name.toLowerCase().includes('citlali'));
    if (citlaliChar) {
      const cIdx = chars.indexOf(citlaliChar);
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: cIdx,
        charName: citlaliChar.name,
        actionType: 'skill',
        actionLabel: 'E (Disparo Criogênico)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.2,
        damage: Math.round((citlaliChar.totalDamage || 0) * 0.4),
        particles: 3
      });
      curTime += 1.2;
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: cIdx,
        charName: citlaliChar.name,
        actionType: 'burst',
        actionLabel: 'Q (Supremo Cryo)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.6,
        damage: Math.round((citlaliChar.totalDamage || 0) * 0.6)
      });
      curTime += 1.6;
    }

    // Mavuika (Main Carry Burst Window)
    actions.push({
      id: `act-${actionIdCounter++}`,
      charIndex: 0,
      charName: carry.name,
      actionType: 'swap',
      actionLabel: 'Swap In (Recebe TTDS)',
      startTime: parseFloat(curTime.toFixed(1)),
      duration: 0.5
    });
    curTime += 0.5;

    actions.push({
      id: `act-${actionIdCounter++}`,
      charIndex: 0,
      charName: carry.name,
      actionType: 'burst',
      actionLabel: 'QCccF (Nuke Supremo)',
      startTime: parseFloat(curTime.toFixed(1)),
      duration: 2.2,
      damage: Math.round((carry.totalDamage || 0) * 0.4)
    });
    curTime += 2.2;

    const remainingWindow = Math.max(3.5, duration - curTime);
    actions.push({
      id: `act-${actionIdCounter++}`,
      charIndex: 0,
      charName: carry.name,
      actionType: 'charged',
      actionLabel: 'cdF (Carregados Pyro Stance)',
      startTime: parseFloat(curTime.toFixed(1)),
      duration: parseFloat(remainingWindow.toFixed(1)),
      damage: Math.round((carry.totalDamage || 0) * 0.6)
    });

  } else {
    // Generic Theorycrafting 4-Character Sequence:
    // Slot 3 (Setup) -> Slot 1 (Sub-DPS) -> Slot 2 (Buffer) -> Slot 0 (Main Carry)
    let curTime = 0.0;

    // Slot 3
    if (chars[3]) {
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: 3,
        charName: chars[3].name,
        actionType: 'skill',
        actionLabel: 'E (Habilidade Setup)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.4,
        damage: Math.round((chars[3].totalDamage || 0) * 0.4),
        particles: 3
      });
      curTime += 1.4;
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: 3,
        charName: chars[3].name,
        actionType: 'burst',
        actionLabel: 'Q (Supremo)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.8,
        damage: Math.round((chars[3].totalDamage || 0) * 0.6)
      });
      curTime += 1.8;
    }

    // Slot 1
    if (chars[1]) {
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: 1,
        charName: chars[1].name,
        actionType: 'skill',
        actionLabel: 'E (Sub-DPS)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.3,
        damage: Math.round((chars[1].totalDamage || 0) * 0.35),
        particles: 4
      });
      curTime += 1.3;
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: 1,
        charName: chars[1].name,
        actionType: 'burst',
        actionLabel: 'Q (Supremo Off-field)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.9,
        damage: Math.round((chars[1].totalDamage || 0) * 0.65)
      });
      curTime += 1.9;
    }

    // Slot 2
    if (chars[2]) {
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: 2,
        charName: chars[2].name,
        actionType: 'burst',
        actionLabel: 'Q (Buffer)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.8,
        damage: Math.round((chars[2].totalDamage || 0) * 0.6)
      });
      curTime += 1.8;
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: 2,
        charName: chars[2].name,
        actionType: 'skill',
        actionLabel: 'E (Partículas)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 1.1,
        damage: Math.round((chars[2].totalDamage || 0) * 0.4),
        particles: 3
      });
      curTime += 1.1;
    }

    // Slot 0 (Carry)
    if (chars[0]) {
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: 0,
        charName: chars[0].name,
        actionType: 'swap',
        actionLabel: 'Swap In (Carry)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 0.5
      });
      curTime += 0.5;

      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: 0,
        charName: chars[0].name,
        actionType: 'burst',
        actionLabel: 'Q (Nuke Supremo)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: 2.0,
        damage: Math.round((chars[0].totalDamage || 0) * 0.38)
      });
      curTime += 2.0;

      const remainingWindow = Math.max(3.0, duration - curTime);
      actions.push({
        id: `act-${actionIdCounter++}`,
        charIndex: 0,
        charName: chars[0].name,
        actionType: 'normal',
        actionLabel: result.comboNotation || 'Combo Principal (5N / Stance)',
        startTime: parseFloat(curTime.toFixed(1)),
        duration: parseFloat(remainingWindow.toFixed(1)),
        damage: Math.round((chars[0].totalDamage || 0) * 0.62)
      });
    }
  }

  // Compute dynamic buffs based on real actions
  const buffs = computeBuffsForTimeline(actions, chars, duration);

  // Sync active buffs to each action
  syncBuffsToActions(actions, buffs);

  return {
    totalDuration: duration,
    actions,
    buffs
  };
}

/**
 * Calculates what percentage of the main carry's damage window occurs under optimal buff coverage.
 */
export function calculateBuffCoverageEfficiency(timeline: RotationTimelineData, carryIndex: number = 0): number {
  const carryActions = timeline.actions.filter(a => a.charIndex === carryIndex && a.actionType !== 'swap');
  if (carryActions.length === 0) return 100;

  let totalCarryTime = 0;
  let buffedCarryTime = 0;

  carryActions.forEach(act => {
    totalCarryTime += act.duration;
    if (act.buffsActive && act.buffsActive.length > 0) {
      buffedCarryTime += act.duration;
    }
  });

  return totalCarryTime > 0 ? Math.round((buffedCarryTime / totalCarryTime) * 100) : 100;
}

export interface CharacterMoveOption {
  id: string;
  type: ActionType;
  label: string;
  duration: number;
  damageMultiplier?: number;
  description?: string;
}

/**
 * Returns tailored attack moves and action options for any Genshin character,
 * with specialized kits for meta characters (Mavuika, Bennett, Citlali, Xilonen, Iansan, Flins, etc.)
 * and solid universal fallback options.
 */
export function getCharacterMoveOptions(charName: string, _element?: string): CharacterMoveOption[] {
  const lower = (charName || '').toLowerCase();

  // Mavuika
  if (lower.includes('mavuika')) {
    return [
      { id: 'mavuika-q', type: 'burst', label: 'QCccF (Nuke Supremo)', duration: 2.2, damageMultiplier: 0.45, description: 'Supremo Nuke da Alma da Noite' },
      { id: 'mavuika-e', type: 'skill', label: 'E (Incineration Drive / Moto)', duration: 1.5, damageMultiplier: 0.15, description: 'Invoca e monta na moto' },
      { id: 'mavuika-ca', type: 'charged', label: 'cdF (Carregados Flamejantes)', duration: 3.5, damageMultiplier: 0.40, description: 'Golpes carregados em chamas' },
      { id: 'mavuika-na', type: 'normal', label: '5N3D (Combo Normal)', duration: 2.5, damageMultiplier: 0.20, description: 'Sequência de golpes básicos' },
      { id: 'mavuika-plunge', type: 'plunge', label: 'Plunge (Ataque Imersivo)', duration: 1.2, damageMultiplier: 0.10, description: 'Impacto aéreo da moto' },
      { id: 'mavuika-swap', type: 'swap', label: 'Swap In (Entrada)', duration: 0.5, damageMultiplier: 0.0, description: 'Troca para Mavuika' }
    ];
  }

  // Bennett
  if (lower.includes('bennett')) {
    return [
      { id: 'bennett-q', type: 'burst', label: 'Q (Viagem Fantástica / Campo)', duration: 1.8, damageMultiplier: 0.70, description: 'Buff de ATK e cura' },
      { id: 'bennett-e', type: 'skill', label: 'E (Sobrecarga de Paixão)', duration: 1.0, damageMultiplier: 0.30, description: 'Habilidade rápida / Bateria de partículas' },
      { id: 'bennett-n1', type: 'normal', label: 'N1 (Ataque Normal Bateria)', duration: 0.8, damageMultiplier: 0.05, description: 'Ativa Favonius / Reação' },
      { id: 'bennett-swap', type: 'swap', label: 'Swap In (Entrada)', duration: 0.5, damageMultiplier: 0.0, description: 'Troca para Bennett' }
    ];
  }

  // Citlali
  if (lower.includes('citlali')) {
    return [
      { id: 'citlali-e', type: 'skill', label: 'E (Disparo Criogênico / Itzpapa)', duration: 1.2, damageMultiplier: 0.40, description: 'Aplica Cryo e invoca escudo/totem' },
      { id: 'citlali-q', type: 'burst', label: 'Q (Supremo Cryo / Campo)', duration: 1.6, damageMultiplier: 0.60, description: 'Chuva gélida em área contínua' },
      { id: 'citlali-ca', type: 'charged', label: 'CA (Disparo Carregado)', duration: 1.4, damageMultiplier: 0.20, description: 'Flecha Criogênica carregada' },
      { id: 'citlali-swap', type: 'swap', label: 'Swap In (Recebe / Passa TTDS)', duration: 0.5, damageMultiplier: 0.0, description: 'Transfere livro TTDS' }
    ];
  }

  // Xilonen
  if (lower.includes('xilonen')) {
    return [
      { id: 'xilonen-e', type: 'skill', label: 'E (Amostradores de Patins)', duration: 1.4, damageMultiplier: 0.30, description: 'Entra no estado de Patins e ativa amostradores' },
      { id: 'xilonen-2n', type: 'normal', label: '2N (Amostradores Ativados)', duration: 1.2, damageMultiplier: 0.20, description: 'Dois golpes de patins para ativar Res Shred' },
      { id: 'xilonen-q', type: 'burst', label: 'Q (Ritmo Ocelotl)', duration: 1.8, damageMultiplier: 0.50, description: 'Cura e dano Geo em área' },
      { id: 'xilonen-swap', type: 'swap', label: 'Swap In (Entrada)', duration: 0.5, damageMultiplier: 0.0, description: 'Troca para Xilonen' }
    ];
  }

  // Iansan
  if (lower.includes('iansan')) {
    return [
      { id: 'iansan-e', type: 'skill', label: 'E (Campo Eletro / Carga)', duration: 1.4, damageMultiplier: 0.40, description: 'Avanço Eletro e carga de energia' },
      { id: 'iansan-q', type: 'burst', label: 'Q (Supremo Sobrecarga)', duration: 1.6, damageMultiplier: 0.60, description: 'Explosão de dano e aceleração' },
      { id: 'iansan-na', type: 'normal', label: 'Combo Normal (N3)', duration: 1.8, damageMultiplier: 0.15, description: 'Sequência de golpes físicos/elétricos' },
      { id: 'iansan-swap', type: 'swap', label: 'Swap In (Entrada)', duration: 0.5, damageMultiplier: 0.0, description: 'Troca para Iansan' }
    ];
  }

  // Flins
  if (lower.includes('flins')) {
    return [
      { id: 'flins-q', type: 'burst', label: 'Q (Fórmula Lunar / Colapso)', duration: 2.0, damageMultiplier: 0.50, description: 'Nuke de Dano Lunar massivo' },
      { id: 'flins-e', type: 'skill', label: 'E (Pulso Lunar)', duration: 1.3, damageMultiplier: 0.25, description: 'Onda estelar e corte de resistência' },
      { id: 'flins-ca', type: 'charged', label: 'CA (Ataque Carregado Lunar)', duration: 2.2, damageMultiplier: 0.25, description: 'Disparo concentrado estelar' },
      { id: 'flins-na', type: 'normal', label: 'Combo Normal Lunar', duration: 2.0, damageMultiplier: 0.15, description: 'Ataques rápidos consecutivos' },
      { id: 'flins-swap', type: 'swap', label: 'Swap In (Entrada)', duration: 0.5, damageMultiplier: 0.0, description: 'Troca para Flins' }
    ];
  }

  // Sandrone
  if (lower.includes('sandrone')) {
    return [
      { id: 'sandrone-e', type: 'skill', label: 'E (Invocação Mecânica)', duration: 1.5, damageMultiplier: 0.40, description: 'Invoca autômato sentinela no campo' },
      { id: 'sandrone-q', type: 'burst', label: 'Q (Protocolo de Destruição)', duration: 2.0, damageMultiplier: 0.60, description: 'Bombardeio estelar coordenado' },
      { id: 'sandrone-ca', type: 'charged', label: 'CA (Disparo Pesado)', duration: 1.8, damageMultiplier: 0.20, description: 'Disparo de canhão autômato' },
      { id: 'sandrone-swap', type: 'swap', label: 'Swap In (Entrada)', duration: 0.5, damageMultiplier: 0.0, description: 'Troca para Sandrone' }
    ];
  }

  // Columbina
  if (lower.includes('columbina')) {
    return [
      { id: 'columbina-q', type: 'burst', label: 'Q (Canção do Vazio Estelar)', duration: 2.2, damageMultiplier: 0.55, description: 'Domo cósmico com amplificação de dano' },
      { id: 'columbina-e', type: 'skill', label: 'E (Pulso de Névoa)', duration: 1.4, damageMultiplier: 0.35, description: 'Onda de gelo e suspensão' },
      { id: 'columbina-na', type: 'normal', label: 'Combo Normal Estelar', duration: 1.8, damageMultiplier: 0.10, description: 'Golpes místicos teleguiados' },
      { id: 'columbina-swap', type: 'swap', label: 'Swap In (Entrada)', duration: 0.5, damageMultiplier: 0.0, description: 'Troca para Columbina' }
    ];
  }

  // Furina
  if (lower.includes('furina')) {
    return [
      { id: 'furina-e', type: 'skill', label: 'E (Salão Solitário)', duration: 1.5, damageMultiplier: 0.40, description: 'Invoca os 3 membros do Salon' },
      { id: 'furina-q', type: 'burst', label: 'Q (Que o Povo se Regozije)', duration: 1.8, damageMultiplier: 0.60, description: 'Fanfarra universal com até +75% dano' },
      { id: 'furina-n1', type: 'normal', label: 'N1 (Ataque Normal / Pneuma)', duration: 0.8, damageMultiplier: 0.05, description: 'Golpe de espada e troca de arkhe' },
      { id: 'furina-swap', type: 'swap', label: 'Swap In (Entrada)', duration: 0.5, damageMultiplier: 0.0, description: 'Troca para Furina' }
    ];
  }

  // Kazuha
  if (lower.includes('kazuha')) {
    return [
      { id: 'kazuha-e', type: 'skill', label: 'E (Chihayaburu)', duration: 1.2, damageMultiplier: 0.30, description: 'Salto e aglomeração de inimigos' },
      { id: 'kazuha-plunge', type: 'plunge', label: 'Plunge (Midare Ranzan)', duration: 1.0, damageMultiplier: 0.30, description: 'Impacto aéreo elemental' },
      { id: 'kazuha-q', type: 'burst', label: 'Q (Lâmina de Kazuha)', duration: 1.8, damageMultiplier: 0.40, description: 'Vento de outono e bônus elemental' },
      { id: 'kazuha-swap', type: 'swap', label: 'Swap In (Entrada)', duration: 0.5, damageMultiplier: 0.0, description: 'Troca para Kazuha' }
    ];
  }

  // Default Universal Moves for ANY Character
  return [
    { id: 'gen-q', type: 'burst', label: 'Q (Supremo / Burst)', duration: 2.0, damageMultiplier: 0.50, description: 'Habilidade Suprema' },
    { id: 'gen-e', type: 'skill', label: 'E (Habilidade Elemental)', duration: 1.4, damageMultiplier: 0.30, description: 'Habilidade Elemental / E' },
    { id: 'gen-ca', type: 'charged', label: 'CA (Ataque Carregado)', duration: 1.8, damageMultiplier: 0.30, description: 'Ataque Carregado / Stance' },
    { id: 'gen-combo', type: 'normal', label: 'Combo Normal (N3/N4)', duration: 2.2, damageMultiplier: 0.20, description: 'Sequência de Ataques Normais' },
    { id: 'gen-n1', type: 'normal', label: 'N1 (Ataque Normal Simples)', duration: 0.8, damageMultiplier: 0.05, description: 'Golpe normal pontual' },
    { id: 'gen-plunge', type: 'plunge', label: 'Plunge (Ataque Imersivo)', duration: 1.2, damageMultiplier: 0.15, description: 'Queda aérea de alto impacto' },
    { id: 'gen-swap', type: 'swap', label: 'Swap In (Entrada em Campo)', duration: 0.5, damageMultiplier: 0.0, description: 'Troca para este personagem' }
  ];
}
