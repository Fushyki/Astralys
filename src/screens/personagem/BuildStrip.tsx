/**
 * Faixa de build: o card da arma e os 5 cards de artefato (peça, raridade, main stat e valor). Clicar abre o editor
 * (arma, refinamento, sets, main stats, raridades e ER mínimo).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NumberInput, SelectField } from '../../design/fields';
import { Panel } from '../../design/primitives';
import { cleanText, pieceIconUrl, weaponIconUrl } from '../../design/images';
import { FLOWER_HP, MAIN_STAT_VALUES, PLUME_ATK, PIECE_SLOTS, type MemberRef, type PieceSlot } from '../../engine';
import { weaponsFor } from '../../features/rotation/teamOps';
import { WeaponPickerDialog } from './WeaponPicker';
import { SetPickerDialog } from './SetPicker';
import { useRotationStore } from '../../features/rotation/store';
import { EFFECT_STATUS_LABEL, effectCoverage, effectStatus, missingEffects } from '../../features/rotation/teamInfo';
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

/** Texto de passiva com no máximo 3 linhas; "ler tudo" abre o resto. */
function Passive({ text }: { text: string }) {
  const [more, setMore] = useState(false);
  if (!text) return <p className="muted small">Sem descrição.</p>;
  return (
    <div className="pc-ptext">
      <p className={more ? '' : 'clamp'}>{text}</p>
      {text.length > 150 && (
        <button type="button" className="dz-link" onClick={() => setMore((m) => !m)}>{more ? 'Mostrar menos' : 'Ler tudo'}</button>
      )}
    </div>
  );
}

function Img({ src, fallback }: { src: string | undefined; fallback: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="ph" aria-hidden="true">{fallback}</b>;
}

export function BuildStrip({ data, index, member: memberRef, projectId }: { data: LoadedData; index: number; member: MemberRef; projectId: string }) {
  const [open, setOpen] = useState(false);
  const [pickWeapon, setPickWeapon] = useState(false);
  const [pickSet, setPickSet] = useState(false);
  const update = useRotationStore((st) => st.updateMember);
  const character = data.game.characters.find((c) => c.name === memberRef.character);
  const weapon = data.game.weapons.find((w) => w.name === memberRef.weapon);
  const refine = Math.min(5, Math.max(1, memberRef.refinement ?? 1));
  const substat = weapon?.substat ? `${weapon.substat.stat} ${formatDecimal(weapon.substat.value < 1 ? weapon.substat.value * 100 : weapon.substat.value, 1)}${weapon.substat.value < 1 ? '%' : ''}` : '';
  const sets = [memberRef.primarySet, memberRef.secondarySet]
    .filter((n): n is string => !!n)
    .map((n) => data.game.artifacts.find((x) => x.name === n))
    .filter((x): x is NonNullable<typeof x> => !!x);
  const fourPiece = !!memberRef.primarySet && !memberRef.secondarySet && memberRef.fourPiece !== false;
  const weaponFx = data.effects.weapons.find((e) => e.weapon === memberRef.weapon);
  const weaponStatus = effectStatus(weaponFx);
  const setFx = (name: string) => data.effects.sets.find((e) => e.set === name);
  // Com dois sets (2+2), a 1ª, 2ª e 5ª peça ilustram o principal; as outras, o segundo.
  const setFor = (i: number) => (sets.length === 2 && (i === 2 || i === 3) ? sets[1] : sets[0]);

  return (
    <Panel
      title="Equipamento"
      aside={
        <span className="pc-gearacts">
          <Link className="dz-btn sm gold" to={`/projeto/${projectId}/otimizador/${encodeURIComponent(memberRef.character)}`}>Otimizar artefatos</Link>
          <button type="button" className="dz-btn sm" onClick={() => setOpen(true)}>Editar build</button>
        </span>
      }
    >
      <div className="pc-gear">
        <button type="button" className="pc-weapon gear-tile" data-rarity={weapon?.rarity ?? 5} onClick={() => setPickWeapon(true)} aria-label={`Trocar a arma ${memberRef.weapon}`}>
          <span className="art"><Img src={weapon?.icon ? weaponIconUrl(weapon.icon) : undefined} fallback="⚔" /></span>
          <span className="lv num">Nv 90</span>
          <span className="rf num">R{refine}</span>
          <span className="n">{memberRef.weapon}</span>
          <span className="num sub">{weapon ? `ATK ${formatInt(weapon.baseAtk)}` : ''}{substat ? ` · ${substat}` : ''}</span>
        </button>
        {PIECE_SLOTS.map((slot, i) => {
          const m = mainValue(slot, memberRef);
          const set = setFor(i);
          return (
            <button type="button" key={slot} className="pc-piece gear-tile" data-rarity={memberRef.artifacts.rarity[slot]} onClick={() => setOpen(true)} aria-label={`Editar ${SLOT_LABEL[slot]}`}>
              <span className="art"><Img src={set ? pieceIconUrl(set.id, slot) : undefined} fallback={SLOT_LABEL[slot].charAt(0)} /></span>
              <span className="lv num">+{memberRef.artifacts.rarity[slot] === 5 ? 20 : 16}</span>
              <span className="n">{SLOT_LABEL[slot]}</span>
              <span className="main">{m.label}</span>
              <span className="num val">{m.value}</span>
            </button>
          );
        })}
      </div>

      <div className="pc-passives">
        <section className="pc-pcard" aria-label="Passiva da arma">
          <header>
            <span className="art sm"><Img src={weapon?.icon ? weaponIconUrl(weapon.icon) : undefined} fallback="⚔" /></span>
            <div>
              <h3>{weapon?.passive?.name ?? 'Passiva da arma'}{weapon?.passive?.namePt && weapon.passive.namePt !== weapon.passive.name ? <small> · {weapon.passive.namePt}</small> : null}</h3>
              <span className="muted small">{memberRef.weapon}</span>
            </div>
            <div className="pc-refine" role="group" aria-label="Refino da arma">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} type="button" aria-pressed={refine === r} onClick={() => update(index, { refinement: r === 1 ? undefined : r })}>R{r}</button>
              ))}
            </div>
            <span className={`dz-chip ${weaponStatus === 'full' ? 'ok' : weaponStatus === 'none' ? '' : 'warn'}`} title={weaponFx?.note ?? 'Sem cadastro: só ATK base e substat contam'}>
              {EFFECT_STATUS_LABEL[weaponStatus]}
            </span>
          </header>
          <Passive text={cleanText(weapon?.passive?.refinements[refine - 1]?.descriptionPt ?? weapon?.passive?.refinements[refine - 1]?.description)} />
        </section>

        <section className="pc-pcard" aria-label="Bônus dos sets">
          <header>
            <span className="art sm"><Img src={sets[0] ? pieceIconUrl(sets[0].id, 'flower') : undefined} fallback="◆" /></span>
            <div>
              <h3>{sets.length ? sets.map((x) => x.name).join(' + ') : 'Sem set'}</h3>
              <span className="muted small">{sets.length === 2 ? '2 + 2 peças' : fourPiece ? '4 peças' : sets.length ? '2 peças' : 'Nenhum set escolhido'}</span>
            </div>
            <button type="button" className="dz-btn sm" onClick={() => setPickSet(true)}>Trocar set</button>
          </header>
          {sets.length === 0 && <p className="muted small">Sem bônus de set.</p>}
          {sets.map((x) => (
            <div className="pc-bonus" key={x.id}>
              <div className="head">
                <b>{x.name}{x.namePt && x.namePt !== x.name ? <small> · {x.namePt}</small> : null}</b>
                <span className={`dz-chip ${effectStatus(setFx(x.name)) === 'full' ? 'ok' : effectStatus(setFx(x.name)) === 'none' ? '' : 'warn'}`} title={setFx(x.name)?.note}>{EFFECT_STATUS_LABEL[effectStatus(setFx(x.name))]}</span>
              </div>
              {x.bonuses.twoPiece && <p><span className="pcs">2 peças</span> {cleanText(x.bonuses.twoPiece.descriptionPt ?? x.bonuses.twoPiece.description)}</p>}
              {fourPiece && x.bonuses.fourPiece && (
                <div className="four"><span className="pcs">4 peças</span> <Passive text={cleanText(x.bonuses.fourPiece.descriptionPt ?? x.bonuses.fourPiece.description)} /></div>
              )}
            </div>
          ))}
        </section>
      </div>
      {pickWeapon && character && (
        <WeaponPickerDialog
          weapons={weaponsFor(character, data.game.weapons)}
          current={memberRef.weapon}
          status={(name) => effectStatus(data.effects.weapons.find((e) => e.weapon === name))}
          onPick={(name) => { update(index, { weapon: name }); setPickWeapon(false); }}
          onClose={() => setPickWeapon(false)}
        />
      )}
      {pickSet && (
        <SetPickerDialog
          sets={data.game.artifacts}
          current={{ primarySet: memberRef.primarySet, secondarySet: memberRef.secondarySet }}
          status={(name) => effectStatus(data.effects.sets.find((e) => e.set === name))}
          onPick={(c) => { update(index, { primarySet: c.primarySet, secondarySet: c.secondarySet, fourPiece: c.fourPiece }); setPickSet(false); }}
          onClose={() => setPickSet(false)}
        />
      )}
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
    ...data.game.artifacts.map((s) => ({ value: s.name, label: `${s.name}${data.effects.sets.some((e) => e.set === s.name) ? '' : ' (sem efeito)'}` })),
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
          <p className="muted small">A arma e o set têm seletores próprios: clique na arma ou em <b>Trocar set</b>. Aqui ficam os atributos principais das peças.</p>
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
