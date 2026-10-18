/** Coluna esquerda da calculadora: card do personagem (constelação e talentos) e o painel de substats (rolls). */
import { NumberInput } from '../../design/fields';
import { CharacterAvatar, Panel, Segmented } from '../../design/primitives';
import { SUBSTATS, defaultTotalRolls, effectiveTalents, maxRollsFor, type AnalysisBundle, type MemberRef, type Substat } from '../../engine';
import type { Character } from '../../data/schema';
import { useRotationStore } from '../../features/rotation/store';
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

export function SubstatsPanel({ memberRef, index, bundle, onGood }: { memberRef: MemberRef; index: number; bundle: AnalysisBundle; onGood: () => void }) {
  const update = useRotationStore((s) => s.updateMember);
  const useManual = useRotationStore((s) => s.useManualRolls);
  const useAuto = useRotationStore((s) => s.useAutoRolls);
  const setRoll = useRotationStore((s) => s.setManualRoll);
  const rolls = bundle.optimization.rolls[index];
  if (!rolls) return <Panel title="Substats (rolls)"><p className="note">Calculando…</p></Panel>;

  const manual = !!memberRef.manualRolls;
  const used = Math.round(SUBSTATS.reduce((s, k) => s + rolls[k], 0) * 100) / 100;
  const budget = memberRef.totalRolls ?? defaultTotalRolls(memberRef.artifacts);
  const max = Math.max(1, ...SUBSTATS.map((s) => rolls[s]));
  const forced = memberRef.forcedCritRolls;

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
      <button type="button" className="dz-link" style={{ alignSelf: 'flex-start' }} onClick={onGood}>Usar o inventário GOOD</button>
      <div className="pc-rolls">
        {SUBSTATS.filter((s) => manual || rolls[s] > 0).map((s) => {
          const cap = maxRollsFor(memberRef.artifacts, s);
          return (
            <div className="r" key={s}>
              <span className="k">{SUBSTAT_LABEL[s]}</span>
              {manual ? (
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
