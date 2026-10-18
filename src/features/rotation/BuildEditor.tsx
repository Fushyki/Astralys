/**
 * Editor de build (estilo "Theorycraft"): arma, sets, main stats, raridade, talentos, ER mínimo e rolls de
 * substat (otimizados ou definidos à mão), com os stats finais ao vivo e avisos de efeitos sem cadastro.
 */
import {
  MAIN_STAT_VALUES,
  effectiveTalents,
  PIECE_SLOTS,
  SUBSTATS,
  defaultTotalRolls,
  maxRollsFor,
  type AnalysisBundle,
  type MemberRef,
  type PieceSlot,
  type RotationProject,
  type Substat,
} from '../../engine';
import { Hint, Panel } from '../../ui/components';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';
import { NumberField } from '../../ui/NumberField';
import type { LoadedData } from './data';
import { useRotationStore } from './store';
import { effectCoverage, missingEffects } from './teamInfo';
import { weaponsFor } from './teamOps';

const STAT_LABEL: Record<string, string> = {
  'ATK%': 'ATK%', EM: 'Maestria Elemental', ER: 'Recarga de Energia', 'HP%': 'HP%', 'DEF%': 'DEF%',
  'DMG%': 'DMG% elemental', CR: 'Taxa Crítica', CD: 'Dano Crítico', Healing: 'Bônus de Cura',
};
const SUBSTAT_LABEL: Record<Substat, string> = {
  CR: 'Taxa Crítica', CD: 'Dano Crítico', 'ATK%': 'ATK%', EM: 'Maestria Elemental', ER: 'Recarga de Energia',
  ATK: 'ATK fixo', 'HP%': 'HP%', HP: 'HP fixo', 'DEF%': 'DEF%', DEF: 'DEF fixo',
};
const SLOT_LABEL: Record<PieceSlot, string> = { flower: 'Flor', plume: 'Pena', sands: 'Areia', goblet: 'Cálice', circlet: 'Tiara' };

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="ast-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function BuildEditor({ project, data, bundle, index }: { project: RotationProject; data: LoadedData; bundle: AnalysisBundle; index: number }) {
  const update = useRotationStore((s) => s.updateMember);
  const useManual = useRotationStore((s) => s.useManualRolls);
  const useAuto = useRotationStore((s) => s.useAutoRolls);
  const setRoll = useRotationStore((s) => s.setManualRoll);

  const ref: MemberRef | undefined = project.members[index];
  const character = data.game.characters.find((c) => c.name === ref?.character);
  if (!ref || !character) return null;

  const stats = bundle.memberStats[index];
  const rolls = bundle.optimization.rolls[index];
  // A análise pode ainda não conhecer este membro (acabou de ser adicionado): espera em vez de quebrar.
  if (!stats || !rolls) return <Panel title={`Build de ${ref.character}`} wide><Hint>Calculando o build…</Hint></Panel>;
  const manual = !!ref.manualRolls;
  const warnings = bundle.rollWarnings.filter((w) => w.member === index);
  const missing = missingEffects(ref, data.effects);
  const cover = effectCoverage(ref, data.effects);
  const weapons = weaponsFor(character, data.game.weapons);
  const weaponEffect = data.effects.weapons.find((e) => e.weapon === ref.weapon);
  const charEffect = data.effects.characters.find((e) => e.character === ref.character);
  const charNotes = (charEffect?.buffs ?? []).map((b) => ((ref.constellation ?? 0) >= (b.minConstellation ?? 0) ? `${b.label}: ${b.note ?? ''}` : `${b.label}: só a partir de C${b.minConstellation}.`));
  const assumptions = [
    ...charNotes,
    weaponEffect?.note && `${ref.weapon}: ${weaponEffect.note}`,
    ...[ref.primarySet, ref.secondarySet].map((n) => (n ? data.effects.sets.find((e) => e.set === n) : undefined)).map((e) => e?.note && `${e.set}: ${e.note}`),
  ].filter((x): x is string => !!x);
  const budget = ref.totalRolls ?? defaultTotalRolls(ref.artifacts);
  const used = SUBSTATS.reduce((s, k) => s + rolls[k], 0);

  const setArtifacts = (patch: Partial<MemberRef['artifacts']>) => update(index, { artifacts: { ...ref.artifacts, ...patch } });
  const mainOptions = (slot: 'sands' | 'goblet' | 'circlet') =>
    Object.keys(MAIN_STAT_VALUES[slot]).map((k) => ({ value: k, label: STAT_LABEL[k] ?? k }));
  const setOptions = [{ value: '', label: 'Nenhum' }, ...data.game.artifacts.map((s) => ({ value: s.name, label: `${s.name}${data.effects.sets.some((e) => e.set === s.name) ? '' : ' (sem efeito)'}` }))];

  return (
    <Panel title={`Build de ${ref.character}`} wide>
      <Hint>
        Edite a arma, os sets, os main stats e os substats de {ref.character}. Os stats ao lado atualizam sozinhos e o dano da rotação é recalculado.
      </Hint>

      <div className="ast-build">
        <div className="ast-build-form">
          <div className="ast-fields">
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: weaponEffect?.refinements ? 'minmax(0, 1fr) 88px' : 'minmax(0, 1fr)', gap: 10 }}><Select
              label="Arma"
              value={ref.weapon}
              onChange={(v) => update(index, { weapon: v })}
              options={weapons.map((w) => ({ value: w.name, label: `${w.rarity}★ ${w.name}${data.effects.weapons.some((e) => e.weapon === w.name) ? '' : ' (sem efeito)'}` }))}
            />
            {weaponEffect?.refinements && (
              <Select label="Refino" value={String(ref.refinement ?? 1)} onChange={(v) => update(index, { refinement: Number(v) })} options={[1, 2, 3, 4, 5].map((r) => ({ value: String(r), label: `R${r}` }))} />
            )}
            </div>
            <Select label="Set principal" value={ref.primarySet ?? ''} onChange={(v) => update(index, { primarySet: v || undefined, ...(v ? {} : { secondarySet: undefined }) })} options={setOptions} />
            <Select label="Segundo set (2+2)" value={ref.secondarySet ?? ''} onChange={(v) => update(index, { secondarySet: v || undefined })} options={ref.primarySet ? setOptions : [{ value: '', label: 'Escolha o principal' }]} />
          </div>

          <div className="ast-fields three">
            <Select label="Areia" value={ref.artifacts.sands} onChange={(v) => setArtifacts({ sands: v })} options={mainOptions('sands')} />
            <Select label="Cálice" value={ref.artifacts.goblet} onChange={(v) => setArtifacts({ goblet: v })} options={mainOptions('goblet')} />
            <Select label="Tiara" value={ref.artifacts.circlet} onChange={(v) => setArtifacts({ circlet: v })} options={mainOptions('circlet')} />
          </div>

          <div className="ast-fields five">
            {PIECE_SLOTS.map((slot) => (
              <Select
                key={slot}
                label={`${SLOT_LABEL[slot]}`}
                value={String(ref.artifacts.rarity[slot])}
                onChange={(v) => setArtifacts({ rarity: { ...ref.artifacts.rarity, [slot]: Number(v) as 4 | 5 } })}
                options={[{ value: '5', label: '5★' }, { value: '4', label: '4★' }]}
              />
            ))}
          </div>

          <div className="ast-fields four">
            <NumberField label="Normal" value={ref.talents.normal} min={1} max={15} step={1} onCommit={(v) => update(index, { talents: { ...ref.talents, normal: clamp(v, 1, 15) } })} />
            <NumberField label="Habilidade" value={ref.talents.skill} min={1} max={15} step={1} onCommit={(v) => update(index, { talents: { ...ref.talents, skill: clamp(v, 1, 15) } })} />
            <NumberField label="Supremo" value={ref.talents.burst} min={1} max={15} step={1} onCommit={(v) => update(index, { talents: { ...ref.talents, burst: clamp(v, 1, 15) } })} />
            <NumberField label="ER mín." value={Math.round((ref.minER ?? 0) * 1000) / 10} min={0} step={5} suffix="%" onCommit={(v) => update(index, { minER: Math.max(0, v) / 100 })} />
          </div>

          <div className="ast-fields">
            <Select label="Constelação" value={String(ref.constellation ?? 0)} onChange={(v) => update(index, { constellation: Number(v) || undefined })} options={[0, 1, 2, 3, 4, 5, 6].map((c) => ({ value: String(c), label: `C${c}` }))} />
            <p className="ast-hint" style={{ margin: 0, alignSelf: 'end' }}>
              Níveis efetivos: {(() => { const t = effectiveTalents(ref.talents, ref.constellation, character); return `${t.normal}/${t.skill}/${t.burst}`; })()}
              {(ref.constellation ?? 0) >= 3 ? ' (com o +3 da constelação)' : ''}
            </p>
          </div>
          {assumptions.length > 0 && (
            <details className="ast-assume">
              <summary>O que está assumido nos efeitos ({assumptions.length})</summary>
              <ul>
                {assumptions.map((a) => (<li key={a}>{a}</li>))}
              </ul>
            </details>
          )}
        </div>

        <div className="ast-build-form ast-build-subs">
          <fieldset className="ast-source">
            <legend>Substats</legend>
            <label>
              <input type="radio" name={`rolls-${index}`} checked={!manual} onChange={() => useAuto(index)} />
              Otimizar automaticamente (melhor distribuição para a rotação)
            </label>
            <label>
              <input type="radio" name={`rolls-${index}`} checked={manual} onChange={() => useManual(index, rolls)} />
              Definir à mão (rolls por substat)
            </label>
            {!manual && (
              <div className="ast-fields" style={{ marginTop: 8 }}>
                <NumberField label="Rolls totais" value={budget} min={0} step={1} onCommit={(v) => update(index, { totalRolls: Math.round(v) === defaultTotalRolls(ref.artifacts) ? undefined : Math.max(0, Math.round(v)) })} />
                <NumberField label="Rolls em crítico fixos (0 = otimizar)" value={ref.forcedCritRolls ?? 0} min={0} step={1} onCommit={(v) => update(index, { forcedCritRolls: v > 0 ? Math.round(v) : undefined })} />
              </div>
            )}
            {manual && (
              <>
                <div className="ast-rolls">
                  {SUBSTATS.map((s) => {
                    const cap = maxRollsFor(ref.artifacts, s);
                    return (
                      <NumberField key={s} label={`${SUBSTAT_LABEL[s]} (máx. ${cap})`} value={ref.manualRolls![s] ?? rolls[s]} min={0} max={cap} step={1} invalid={rolls[s] > cap} onCommit={(v) => setRoll(index, s, v)} />
                    );
                  })}
                </div>
                <p className={`ast-hint${used > budget ? ' bad' : ''}`} style={{ margin: '8px 0 0' }}>
                  {used} de {budget} rolls usados.
                </p>
              </>
            )}
          </fieldset>

          {warnings.map((w) => (
            <p className="ast-error" role="alert" key={w.message}>{w.message}</p>
          ))}
          {missing.length > 0 && (
            <p className="ast-notice-inline">
              Sem efeito numérico cadastrado: {missing.join(', ')}. Só os stats base e o substat contam; a passiva ainda não entra no cálculo.
            </p>
          )}
          {!cover.characterHasEffect && <p className="ast-hint">As passivas de {ref.character} (ex.: bônus de dano de talentos) também não estão cadastradas.</p>}
        </div>

        <aside className="ast-statbox" aria-label={`Stats finais de ${ref.character}`}>
          <p className="ast-sel-title small">Stats finais (com todos os buffs de time)</p>
          <dl>
            <div><dt>ATK</dt><dd>{formatInt(stats.atk)}</dd></div>
            <div><dt>HP</dt><dd>{formatInt(stats.hp)}</dd></div>
            <div><dt>DEF</dt><dd>{formatInt(stats.def)}</dd></div>
            <div><dt>Maestria Elemental</dt><dd>{formatInt(stats.em)}</dd></div>
            <div><dt>Recarga de Energia</dt><dd>{formatPercent(stats.er)}</dd></div>
            <div><dt>Taxa Crítica</dt><dd>{formatPercent(stats.critRate)}</dd></div>
            <div><dt>Dano Crítico</dt><dd>{formatPercent(stats.critDmg)}</dd></div>
            <div><dt>Crit Value</dt><dd>{formatDecimal(2 * stats.critRate * 100 + stats.critDmg * 100)}</dd></div>
            <div><dt>DMG% geral</dt><dd>{formatPercent(stats.dmgBonus)}</dd></div>
          </dl>
          <p className="ast-sel-title small">Rolls de substat ({used}/{budget})</p>
          <dl className="roll">
            {SUBSTATS.filter((s) => rolls[s] > 0).map((s) => (
              <div key={s}><dt>{SUBSTAT_LABEL[s]}</dt><dd>{rolls[s]}</dd></div>
            ))}
          </dl>
        </aside>
      </div>
    </Panel>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));
