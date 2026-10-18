/**
 * Faixa de build: o card da arma e os 5 cards de artefato (peça, raridade, main stat e valor). Clicar abre o editor
 * (arma, refinamento, sets, main stats, raridades e ER mínimo).
 */
import { useEffect, useState } from 'react';
import { NumberInput, SelectField } from '../../design/fields';
import { Panel } from '../../design/primitives';
import { FLOWER_HP, MAIN_STAT_VALUES, PLUME_ATK, PIECE_SLOTS, type MemberRef, type PieceSlot } from '../../engine';
import { weaponsFor } from '../../features/rotation/teamOps';
import { useRotationStore } from '../../features/rotation/store';
import { effectCoverage, missingEffects } from '../../features/rotation/teamInfo';
import type { LoadedData } from '../../features/rotation/data';
import { formatDecimal, formatInt } from '../../ui/format';

const SLOT_LABEL: Record<PieceSlot, string> = { flower: 'Flor', plume: 'Pena', sands: 'Areia', goblet: 'Cálice', circlet: 'Tiara' };
const STAT_LABEL: Record<string, string> = {
  'ATK%': 'ATK%', EM: 'Maestria Elemental', ER: 'Recarga de Energia', 'HP%': 'HP%', 'DEF%': 'DEF%', 'DMG%': 'DMG% elemental',
  CR: 'Taxa Crítica', CD: 'Dano Crítico', Healing: 'Bônus de Cura',
};

/** Valor do main stat da peça no nível máximo (flor e pena são fixos). */
function mainValue(slot: PieceSlot, ref: MemberRef): { label: string; value: string } {
  const rarity = ref.artifacts.rarity[slot];
  const idx = rarity === 5 ? 0 : 1;
  if (slot === 'flower') return { label: 'HP', value: formatInt(FLOWER_HP[idx]) };
  if (slot === 'plume') return { label: 'ATK', value: formatInt(PLUME_ATK[idx]) };
  const stat = ref.artifacts[slot];
  const table = MAIN_STAT_VALUES[slot] as Record<string, readonly [number, number]>;
  const v = table[stat]?.[idx] ?? 0;
  const pct = stat !== 'EM';
  return { label: STAT_LABEL[stat] ?? stat, value: pct ? `${formatDecimal(v * 100, 1)}%` : formatInt(v) };
}

export function BuildStrip({ data, index, member: memberRef }: { data: LoadedData; index: number; member: MemberRef }) {
  const [open, setOpen] = useState(false);
  const character = data.game.characters.find((c) => c.name === memberRef.character);
  const weapon = data.game.weapons.find((w) => w.name === memberRef.weapon);
  const refine = memberRef.refinement ?? 1;
  const substat = weapon?.substat ? `${weapon.substat.stat} ${formatDecimal(weapon.substat.value < 1 ? weapon.substat.value * 100 : weapon.substat.value, 1)}${weapon.substat.value < 1 ? '%' : ''}` : '';

  return (
    <Panel>
      <div className="pc-strip">
        <button type="button" className="pc-weapon" onClick={() => setOpen(true)} aria-label={`Editar a arma ${memberRef.weapon}`}>
          <span className="rar">{weapon?.rarity ?? '?'}★</span>
          <span className="info">
            <span className="n">{memberRef.weapon}</span>
            <span className="num sub">Nv 90 · R{refine}{weapon ? ` · ATK ${formatInt(weapon.baseAtk)}` : ''}{substat ? ` · ${substat}` : ''}</span>
          </span>
        </button>
        {PIECE_SLOTS.map((slot) => {
          const m = mainValue(slot, memberRef);
          return (
            <button type="button" key={slot} className="pc-piece" onClick={() => setOpen(true)} aria-label={`Editar ${SLOT_LABEL[slot]}`}>
              <span className="lbl">{SLOT_LABEL[slot]} · {memberRef.artifacts.rarity[slot]}★</span>
              <span className="main">{m.label}</span>
              <span className="num val">{m.value}</span>
            </button>
          );
        })}
      </div>
      <div className="pc-sets">
        <span className="muted">Sets: </span>
        {memberRef.primarySet ? <b>{memberRef.primarySet}{memberRef.secondarySet ? ` + ${memberRef.secondarySet}` : memberRef.fourPiece === false ? ' (2 peças)' : ' (4 peças)'}</b> : <b>nenhum</b>}
        <button type="button" className="dz-link" style={{ marginLeft: 12 }} onClick={() => setOpen(true)}>Editar build</button>
      </div>
      {open && character && <BuildDialog data={data} index={index} memberRef={memberRef} onClose={() => setOpen(false)} />}
    </Panel>
  );
}

function BuildDialog({ data, index, memberRef, onClose }: { data: LoadedData; index: number; memberRef: MemberRef; onClose: () => void }) {
  const update = useRotationStore((s) => s.updateMember);
  const character = data.game.characters.find((c) => c.name === memberRef.character)!;
  const weapons = weaponsFor(character, data.game.weapons);
  const weaponEffect = data.effects.weapons.find((e) => e.weapon === memberRef.weapon);
  const setArtifacts = (patch: Partial<MemberRef['artifacts']>) => update(index, { artifacts: { ...memberRef.artifacts, ...patch } });
  const mainOptions = (slot: 'sands' | 'goblet' | 'circlet') => Object.keys(MAIN_STAT_VALUES[slot]).map((k) => ({ value: k, label: STAT_LABEL[k] ?? k }));
  const setOptions = [
    { value: '', label: 'Nenhum' },
    ...data.game.artifacts.map((s) => ({ value: s.name, label: `${s.name}${data.effects.sets.some((e) => e.set === s.name && (e.twoPiece || e.fourPiece)) ? '' : ' (sem efeito)'}` })),
  ];
  const missing = missingEffects(memberRef, data.effects);
  const cover = effectCoverage(memberRef, data.effects);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dz-dialog" role="dialog" aria-modal="true" aria-label={`Editar build de ${memberRef.character}`}>
        <header>
          <h2 className="h2">Build de {memberRef.character}</h2>
          <button type="button" className="dz-btn sm" onClick={onClose}>Fechar</button>
        </header>
        <div className="pc-dialog-body">
          <div className="pc-form two">
            <SelectField
              label="Arma"
              value={memberRef.weapon}
              onChange={(v) => update(index, { weapon: v })}
              options={weapons.map((w) => ({ value: w.name, label: `${w.rarity}★ ${w.name}${data.effects.weapons.some((e) => e.weapon === w.name) ? '' : ' (sem efeito)'}` }))}
            />
            {weaponEffect?.refinements ? (
              <SelectField label="Refino" value={String(memberRef.refinement ?? 1)} onChange={(v) => update(index, { refinement: Number(v) })} options={[1, 2, 3, 4, 5].map((r) => ({ value: String(r), label: `R${r}` }))} />
            ) : (
              <span />
            )}
            <SelectField label="Set principal" value={memberRef.primarySet ?? ''} onChange={(v) => update(index, { primarySet: v || undefined, ...(v ? {} : { secondarySet: undefined }) })} options={setOptions} />
            <SelectField
              label="Segundo set (2+2)"
              value={memberRef.secondarySet ?? ''}
              onChange={(v) => update(index, { secondarySet: v || undefined })}
              options={memberRef.primarySet ? setOptions : [{ value: '', label: 'Escolha o principal' }]}
            />
          </div>
          <div className="pc-form three">
            <SelectField label="Areia" value={memberRef.artifacts.sands} onChange={(v) => setArtifacts({ sands: v })} options={mainOptions('sands')} />
            <SelectField label="Cálice" value={memberRef.artifacts.goblet} onChange={(v) => setArtifacts({ goblet: v })} options={mainOptions('goblet')} />
            <SelectField label="Tiara" value={memberRef.artifacts.circlet} onChange={(v) => setArtifacts({ circlet: v })} options={mainOptions('circlet')} />
          </div>
          <div className="pc-form five">
            {PIECE_SLOTS.map((slot) => (
              <SelectField
                key={slot}
                label={`${SLOT_LABEL[slot]}`}
                value={String(memberRef.artifacts.rarity[slot])}
                onChange={(v) => setArtifacts({ rarity: { ...memberRef.artifacts.rarity, [slot]: Number(v) as 4 | 5 } })}
                options={[{ value: '5', label: '5★' }, { value: '4', label: '4★' }]}
              />
            ))}
          </div>
          <div className="pc-form two">
            <NumberInput label="ER mínimo" value={Math.round((memberRef.minER ?? 0) * 1000) / 10} min={0} step={5} suffix="%" onCommit={(v) => update(index, { minER: Math.max(0, v) / 100 })} />
          </div>
          {missing.length > 0 && (
            <p className="dz-error">Sem efeito numérico cadastrado: {missing.join(', ')}. Só os stats base e o substat contam; a passiva ainda não entra no cálculo.</p>
          )}
          {!cover.characterHasEffect && <p className="muted small">As passivas de {memberRef.character} (ex.: bônus de dano de talentos) também não estão cadastradas.</p>}
          <Assumptions data={data} memberRef={memberRef} />
        </div>
      </div>
    </div>
  );
}

function Assumptions({ data, memberRef }: { data: LoadedData; memberRef: MemberRef }) {
  const weaponEffect = data.effects.weapons.find((e) => e.weapon === memberRef.weapon);
  const charEffect = data.effects.characters.find((e) => e.character === memberRef.character);
  const charNotes = (charEffect?.buffs ?? []).map((b) => ((memberRef.constellation ?? 0) >= (b.minConstellation ?? 0) ? `${b.label}: ${b.note ?? ''}` : `${b.label}: só a partir de C${b.minConstellation}.`));
  const items = [
    ...charNotes,
    weaponEffect?.note && `${memberRef.weapon}: ${weaponEffect.note}`,
    ...[memberRef.primarySet, memberRef.secondarySet].map((n) => (n ? data.effects.sets.find((e) => e.set === n) : undefined)).map((e) => e?.note && `${e.set}: ${e.note}`),
  ].filter((x): x is string => !!x);
  if (items.length === 0) return null;
  return (
    <details className="pc-assume">
      <summary>O que está assumido nos efeitos ({items.length})</summary>
      <ul>
        {items.map((a) => (<li key={a}>{a}</li>))}
      </ul>
    </details>
  );
}
