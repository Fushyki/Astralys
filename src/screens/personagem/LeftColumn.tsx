/** Coluna esquerda da calculadora: card do personagem (constelação e talentos) e o painel de substats (rolls). */
import { useState } from 'react';
import { NumberInput } from '../../design/fields';
import { CharacterAvatar, Panel, Segmented } from '../../design/primitives';
import { SUBSTATS, defaultTotalRolls, effectiveTalents, maxRollsFor, rollValues, type AnalysisBundle, type MemberRef, type Substat } from '../../engine';
import { SUB_LABEL, formatSub } from '../../features/good/labels';
import type { Character } from '../../data/schema';
import { useRotationStore } from '../../features/rotation/store';
import { FINAL_STAT_SUBS, applyFinalStat, type FinalStatKey } from '../../features/character/finalStatModel';
import { formatInt, formatPercent } from '../../ui/format';

const WEAPON_LABEL: Record<string, string> = { Sword: 'ESPADA', Claymore: 'ESPADÃO', Polearm: 'LANÇA', Catalyst: 'CATALISADOR', Bow: 'ARCO' };
const SUBSTAT_LABEL: Record<Substat, string> = {
  CR: 'Taxa crít.', CD: 'Dano crít.', 'ATK%': 'ATK%', EM: 'Maestria', ER: 'Recarga', ATK: 'ATK fixo', 'HP%': 'HP%', HP: 'HP fixo', 'DEF%': 'DEF%', DEF: 'DEF fixo',
};
const clamp = (v: number) => Math.max(1, Math.min(15, Math.round(v)));
const SPLASH = 'https://api.lunaris.moe/data/assets/gachaimg';

export function CharacterCard({ character, memberRef, index, color, level, share }: { character: Character; memberRef: MemberRef; index: number; color: string; level: number; share: number }) {
  const update = useRotationStore((s) => s.updateMember);
  const talents = effectiveTalents(memberRef.talents, memberRef.constellation, character);
  const c = memberRef.constellation ?? 0;
  return (
    <Panel>
      <div className="pc-portrait" style={{ ['--c' as string]: color }}>
        {character.splash ? <img src={`${SPLASH}/${character.splash}.webp`} alt="" crossOrigin="anonymous" loading="lazy" /> : <CharacterAvatar name={character.name} icon={character.icon} color={color} size={120} />}
        <span className="num lvl">Nv {level}/90</span>
      </div>
      <div className="pc-id">
        <span className="n">{character.name}</span>
        <span className="muted lbl">{character.element.toUpperCase()} · {WEAPON_LABEL[character.weapon] ?? character.weapon}</span>
      </div>
      <div className="pc-cons">
        <span className="lbl">Constelação</span>
        <div className="row" role="group" aria-label="Constelação">
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} type="button" aria-pressed={c === n} aria-label={`Constelação ${n}`} onClick={() => update(index, { constellation: n || undefined })}>C{n}</button>
          ))}
        </div>
      </div>
      <div className="pc-talents">
        <span className="lbl">Talentos</span>
        <div className="row">
          <NumberInput label="Normal" value={memberRef.talents.normal} min={1} max={15} step={1} onCommit={(v) => update(index, { talents: { ...memberRef.talents, normal: clamp(v) } })} />
          <NumberInput label="Habilidade" value={memberRef.talents.skill} min={1} max={15} step={1} onCommit={(v) => update(index, { talents: { ...memberRef.talents, skill: clamp(v) } })} />
          <NumberInput label="Supremo" value={memberRef.talents.burst} min={1} max={15} step={1} onCommit={(v) => update(index, { talents: { ...memberRef.talents, burst: clamp(v) } })} />
        </div>
        <span className="muted small num" data-testid="effective-talents">
          Níveis efetivos: {talents.normal}/{talents.skill}/{talents.burst}{c >= 3 ? ' (com o +3 da constelação)' : ''} · {formatPercent(share, 1)} do dano do time
        </span>
      </div>
    </Panel>
  );
}

/** Substats em % guardam fração (0,33 = 33%); os valores brutos aparecem como o jogo mostra (33,0%). */
const PCT_SUBSTAT = new Set<Substat>(['CR', 'CD', 'ATK%', 'ER', 'HP%', 'DEF%']);
const GOOD_OF: Record<Substat, string> = { CR: 'critRate_', CD: 'critDMG_', 'ATK%': 'atk_', EM: 'eleMas', ER: 'enerRech_', ATK: 'atk', 'HP%': 'hp_', HP: 'hp', 'DEF%': 'def_', DEF: 'def' };

export function SubstatsPanel({ memberRef, index, bundle, onGood, bases }: { memberRef: MemberRef; index: number; bundle: AnalysisBundle; onGood: () => void; bases: { atk: number; hp: number; def: number } }) {
  const update = useRotationStore((s) => s.updateMember);
  const useManual = useRotationStore((s) => s.useManualRolls);
  const useAuto = useRotationStore((s) => s.useAutoRolls);
  const setRoll = useRotationStore((s) => s.setManualRoll);
  const [unit, setUnit] = useState<'rolls' | 'valores'>('valores');
  const [finalNote, setFinalNote] = useState<string | null>(null);
  const rolls = bundle.optimization.rolls[index];
  if (!rolls) return <Panel title="Substats (rolls)"><p className="note">Calculando…</p></Panel>;

  // Com peças reais do inventário não há rolls: os substats são a soma exata das 5 peças.
  if (memberRef.pieces) {
    const sums = new Map<string, number>();
    for (const p of memberRef.pieces) for (const sub of p.substats) sums.set(sub.key, (sums.get(sub.key) ?? 0) + sub.value);
    const rows = SUBSTATS.filter((k) => (sums.get(GOOD_OF[k]) ?? 0) > 0);
    return (
      <Panel title="Substats das peças">
        <div className="pc-rolls">
          {rows.map((k) => (
            <div className="r" key={k}>
              <span className="k">{SUB_LABEL[GOOD_OF[k]] ?? k}</span>
              <span className="num n">{formatSub(GOOD_OF[k], sums.get(GOOD_OF[k]) ?? 0)}</span>
            </div>
          ))}
        </div>
        <span className="muted small">Soma exata dos substats das {memberRef.pieces.length} peças do inventário. Para mudar, troque as peças ou volte ao build genérico.</span>
      </Panel>
    );
  }
  const perRoll = rollValues(memberRef.artifacts);
  const factor = (k: Substat) => (PCT_SUBSTAT.has(k) ? 100 : 1);

  const manual = !!memberRef.manualRolls;
  const used = Math.round(SUBSTATS.reduce((s, k) => s + rolls[k], 0) * 100) / 100;
  const budget = memberRef.totalRolls ?? defaultTotalRolls(memberRef.artifacts);
  const max = Math.max(1, ...SUBSTATS.map((s) => rolls[s]));
  const forced = memberRef.forcedCritRolls;
  const finals = bundle.memberStats[index];
  const FINALS: { key: FinalStatKey; label: string; value: number; shown: number; step: number; pct: boolean }[] = finals
    ? [
        { key: 'atk', label: 'ATK', value: finals.atk, shown: Math.round(finals.atk), step: 10, pct: false },
        { key: 'hp', label: 'HP', value: finals.hp, shown: Math.round(finals.hp), step: 100, pct: false },
        { key: 'def', label: 'DEF', value: finals.def, shown: Math.round(finals.def), step: 10, pct: false },
        { key: 'em', label: 'Maestria', value: finals.em, shown: Math.round(finals.em), step: 1, pct: false },
        { key: 'er', label: 'Recarga (%)', value: finals.er, shown: Math.round(finals.er * 1000) / 10, step: 0.1, pct: true },
        { key: 'critRate', label: 'Taxa crít. (%)', value: finals.critRate, shown: Math.round(finals.critRate * 1000) / 10, step: 0.1, pct: true },
        { key: 'critDmg', label: 'Dano crít. (%)', value: finals.critDmg, shown: Math.round(finals.critDmg * 1000) / 10, step: 0.1, pct: true },
      ]
    : [];
  const setFinal = (f: (typeof FINALS)[number], typed: number) => {
    const r = applyFinalStat({
      key: f.key,
      target: f.pct ? typed / 100 : typed,
      current: f.value,
      base: f.key === 'atk' ? bases.atk : f.key === 'hp' ? bases.hp : bases.def,
      rolls: { ...rolls, ...memberRef.manualRolls },
      perRoll,
      cap: (s) => maxRollsFor(memberRef.artifacts, s),
    });
    update(index, { manualRolls: r.rolls });
    const subs = FINAL_STAT_SUBS[f.key];
    setFinalNote(
      r.limited
        ? `${f.label}: o máximo possível com os substats é ${f.pct ? formatPercent(r.reached, 1) : formatInt(r.reached)} (limite de rolls ou valor abaixo do que as peças já dão). Gravado em ${SUBSTAT_LABEL[subs.pct]}${subs.flat ? ` e ${SUBSTAT_LABEL[subs.flat]}` : ''}.`
        : null,
    );
  };

  return (
    <Panel title="Substats (rolls)">
      <Segmented
        label="Modo dos substats"
        value={manual ? 'manual' : 'auto'}
        options={[
          { value: 'auto', label: 'Otimizar' },
          { value: 'manual', label: 'À mão' },
        ]}
        onChange={(v) => (v === 'manual' ? useManual(index, rolls) : useAuto(index))}
      />
      {manual && (
        <Segmented
          label="Unidade dos substats"
          value={unit}
          options={[
            { value: 'valores', label: 'Valores' },
            { value: 'rolls', label: 'Rolls' },
          ]}
          onChange={setUnit}
        />
      )}
      <button type="button" className="dz-link" style={{ alignSelf: 'flex-start' }} onClick={onGood}>Usar o inventário GOOD</button>
      <div className="pc-rolls">
        {SUBSTATS.filter((s) => manual || rolls[s] > 0).map((s) => {
          const cap = maxRollsFor(memberRef.artifacts, s);
          return (
            <div className="r" key={s}>
              <span className="k">{SUBSTAT_LABEL[s]}</span>
              {manual && unit === 'valores' ? (
                <NumberInput
                  label={`${SUBSTAT_LABEL[s]} (valor total${PCT_SUBSTAT.has(s) ? ' em %' : ''})`}
                  value={Math.round((memberRef.manualRolls![s] ?? rolls[s]) * perRoll[s] * factor(s) * 100) / 100}
                  min={0}
                  step={PCT_SUBSTAT.has(s) ? 0.1 : s === 'EM' ? 1 : 10}
                  invalid={rolls[s] > cap}
                  onCommit={(v) => setRoll(index, s, v / factor(s) / perRoll[s])}
                />
              ) : manual ? (
                <NumberInput label={`${SUBSTAT_LABEL[s]} (máx. ${cap})`} value={memberRef.manualRolls![s] ?? rolls[s]} min={0} max={cap} step={1} invalid={rolls[s] > cap} onCommit={(v) => setRoll(index, s, v)} />
              ) : (
                <>
                  <div className="dz-bar"><i style={{ width: `${(rolls[s] / max) * 100}%`, ['--c' as string]: rolls[s] >= 6 ? 'var(--gold)' : '#4a5585' }} /></div>
                  <span className="num n">{formatInt(rolls[s])}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
      {manual && finals && (
        <>
          <span className="lbl">Stats finais (com buffs ativos)</span>
          <div className="pc-form two">
            {FINALS.map((f) => (
              <NumberInput key={f.key} label={f.label} value={f.shown} min={0} step={f.step} onCommit={(v) => setFinal(f, v)} />
            ))}
          </div>
          <span className="muted small">Digite o valor final: o painel ajusta os substats que faltam (ATK, HP e DEF pelo % e depois pelo fixo).</span>
          {finalNote && <p className="dz-error" role="alert">{finalNote}</p>}
        </>
      )}
      <span className={`muted small num${used > budget ? ' over' : ''}`}>
        {used} de {budget} rolls{forced ? ` · ${forced} fixos em crítico` : ''}
      </span>
      {!manual && (
        <div className="pc-form two">
          <NumberInput label="Rolls totais" value={budget} min={0} step={1} onCommit={(v) => update(index, { totalRolls: Math.round(v) === defaultTotalRolls(memberRef.artifacts) ? undefined : Math.max(0, Math.round(v)) })} />
          <NumberInput label="Rolls em crítico fixos (0 = otimizar)" value={forced ?? 0} min={0} step={1} onCommit={(v) => update(index, { forcedCritRolls: v > 0 ? Math.round(v) : undefined })} />
        </div>
      )}
      {bundle.rollWarnings.filter((w) => w.member === index).map((w) => (
        <p className="dz-error" role="alert" key={w.message}>{w.message}</p>
      ))}
    </Panel>
  );
}
