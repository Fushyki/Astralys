/**
 * Aba Talentos do personagem (como a do Genshin Optimizer): ler o que cada talento, passiva e constelação faz e ligar ou
 * desligar os buffs que o personagem dá (cada passiva e constelação curada vira um interruptor).
 */
import { useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { elementColor } from '../../design/elements';
import type { CharacterBuff } from '../../effects/schema';
import { KIT_INFUSIONS, characterBuffDelta, effectiveTalents } from '../../engine';
import type { MemberRef } from '../../engine';
import { buffHome, skillIconUrl, useTalents, type CharacterTalents, type TalentText } from '../../features/character/talents';
import { deltaChips } from '../../features/team/teamModel';
import { useRotationStore } from '../../features/rotation/store';
import { formatInt } from '../../ui/format';
import { useDamageGroups } from './MainColumn';

const SCOPE_TEXT = { self: 'só ele', team: 'o time todo', others: 'os aliados' } as const;
const INFUSIONS = ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Anemo', 'Geo', 'Dendro'] as const;
const TALENT_NAME = { normal: 'Ataque normal', skill: 'Habilidade elemental', burst: 'Supremo' } as const;

function Icon({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  return name && !failed ? <img src={skillIconUrl(name)} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="ph" aria-hidden="true">✦</b>;
}

/** Texto do jogo com quebras de linha; passa de 5 linhas e o resto fica atrás de "Ler tudo". */
function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 260;
  return (
    <div className="tl-desc">
      <p data-clamp={long && !open}>{text}</p>
      {long && (
        <button type="button" className="dz-link" onClick={() => setOpen(!open)}>{open ? 'Ler menos' : 'Ler tudo'}</button>
      )}
    </div>
  );
}

interface BuffRowProps {
  buff: CharacterBuff;
  index: number;
  constellation: number;
  disabled: string[];
  onToggle: (id: string, enabled: boolean) => void;
}

/** Id do motor do buff do personagem: fonte estática (só dele, sempre) ou buff de time (faixa/regra). */
function toggleIdOf(index: number, b: CharacterBuff): string {
  return !b.timed && b.scope === 'self' && b.stats ? `m${index}:cbuff-${b.id}` : `cbuff-${index}-${b.id}`;
}

function BuffRow({ buff, index, constellation, disabled, onToggle }: BuffRowProps) {
  const id = toggleIdOf(index, buff);
  const locked = buff.minConstellation > constellation;
  const active = !locked && !disabled.includes(id);
  const chips = buff.stats ? deltaChips(characterBuffDelta(buff.stats, !!buff.forElements)) : [];
  return (
    <label className="tl-buff" data-active={active} data-locked={locked}>
      <input type="checkbox" checked={active} disabled={locked} onChange={(e) => onToggle(id, e.target.checked)} aria-label={buff.label} />
      <span className="body">
        <span className="top">
          <span className="n">{buff.label}</span>
          <span className="scope">{SCOPE_TEXT[buff.scope]}</span>
        </span>
        {chips.length > 0 && <span className="vals">{chips.map((c) => <span key={c} className="num">{c}</span>)}</span>}
        {buff.convert && <span className="meta">Valor calculado a partir dos stats dele.</span>}
        <span className="meta">
          {locked ? `Libera na C${buff.minConstellation}` : buff.timed ? 'Vale nas janelas da rotação' : 'Vale o tempo todo'}
        </span>
        {buff.note && <span className="meta note">{buff.note}</span>}
      </span>
    </label>
  );
}

function Card({ icon, title, kicker, text, locked, children, onHead }: { icon: string; title: string; kicker: string; text: string; locked?: boolean; children?: React.ReactNode; onHead?: () => void }) {
  return (
    <article className="tl-card" data-locked={locked}>
      <header onClick={onHead} role={onHead ? 'button' : undefined} tabIndex={onHead ? 0 : undefined} onKeyDown={(e) => onHead && (e.key === 'Enter' || e.key === ' ') && onHead()}>
        <span className="ico"><Icon name={icon} /></span>
        <span className="who">
          <b>{title}</b>
          <small>{kicker}</small>
        </span>
      </header>
      <Description text={text} />
      {children}
    </article>
  );
}

export function TalentsPanel({ v, index }: { v: ProjectView; index: number }) {
  const { data: all } = useTalents();
  const setSourceEnabled = useRotationStore((s) => s.setSourceEnabled);
  const updateMember = useRotationStore((s) => s.updateMember);
  const ref = v.project.members[index];
  const member = v.resolved.team.members[index];
  const constellation = ref.constellation ?? 0;
  const talents = effectiveTalents(ref.talents, ref.constellation, member.character);
  const groups = useDamageGroups(v, index, 'none');
  const color = elementColor(member.character.element);
  const infusable = member.character.weapon !== 'Catalyst' && member.character.weapon !== 'Bow' && v.resolved.team.config.elementMode === 'kit';
  const kitInfusion = KIT_INFUSIONS[ref.character];
  const tl: CharacterTalents | undefined = all?.find((t) => t.character === ref.character);
  const buffs = v.data.effects.characters.find((c) => c.character === ref.character)?.buffs ?? [];
  const notes = v.data.effects.characters.find((c) => c.character === ref.character)?.notes ?? [];
  const disabled = v.project.disabled;
  const rows = (pred: (b: CharacterBuff) => boolean) =>
    buffs.filter(pred).map((b) => <BuffRow key={b.id} buff={b} index={index} constellation={constellation} disabled={disabled} onToggle={setSourceEnabled} />);
  const noteOf = (src: string) => notes.find((n) => n.src === src);
  const NoteChip = ({ src }: { src: string }) => {
    const n = noteOf(src);
    return n ? <span className="tl-note" data-kind={n.kind} title={n.note}>{n.kind === 'utility' ? 'Sem efeito no dano' : 'Parcial'}: {n.note}</span> : null;
  };

  if (!tl) return <p className="note" role="status">Carregando os textos dos talentos…</p>;

  const passiveCard = (p: CharacterTalents['passives'][number], kicker: string) => {
    const mine = rows((b) => { const h = buffHome(b.id); return h.kind === 'passive' && h.id === p.id; });
    return (
      <Card key={p.id} icon={p.icon} title={p.name} kicker={kicker} text={p.description}>
        <NoteChip src={p.id} />
        {mine}
      </Card>
    );
  };

  const talentCard = (t: CharacterTalents['skills'][number]) => {
    const g = groups.find((x) => x.talent === t.talent);
    const mine = rows((b) => { const h = buffHome(b.id); return h.kind === 'talent' && h.talent === t.talent; });
    return (
      <Card key={t.talent} icon={t.icon} title={t.name} kicker={`${TALENT_NAME[t.talent]} · nível ${talents[t.talent]}`} text={t.description}>
        {g && g.lines.length > 0 && (
          <ul className="tl-lines" style={{ ['--e' as string]: color }}>
            {g.lines.map((l) => (
              <li key={l.id}>
                <span>{l.name}{l.hits > 1 ? ` · ${l.hits}×` : ''}</span>
                <b className="num">{formatInt(l.avg)}</b>
              </li>
            ))}
          </ul>
        )}
        {g && <small className="muted">Dano médio com o build e os buffs atuais.</small>}
        {mine}
      </Card>
    );
  };

  const known = new Set(buffs.filter((b) => { const h = buffHome(b.id); return h.kind !== 'other'; }).map((b) => b.id));
  const others = buffs.filter((b) => !known.has(b.id));
  const passive = (id: string) => tl.passives.find((p) => p.id === id);

  return (
    <div className="tl" style={{ ['--e' as string]: color }}>
      <p className="note">
        Cada buff de passiva ou constelação com número aparece com um interruptor: desligado, ele sai do cálculo do time inteiro. As constelações acima da dele ficam apagadas;
        toque numa constelação para mudar a dele (hoje C{constellation}).
      </p>
      {infusable && (
        <section className="tl-infusion" aria-label="Infusão dos ataques normais">
          <div>
            <b>Infusão dos ataques normais</b>
            <p>
              {ref.character} usa {member.character.weapon === 'Sword' ? 'espada' : member.character.weapon === 'Claymore' ? 'montante' : 'lança'}: ataque normal, carregado e de queda são <b>Físicos</b>, a não ser com infusão.
              {kitInfusion && <> No jogo: {kitInfusion.element} {kitInfusion.when}.</>}
            </p>
          </div>
          <div className="dz-seg" role="group" aria-label="Elemento da infusão">
            <button type="button" aria-pressed={!ref.normalInfusion} onClick={() => updateMember(index, { normalInfusion: undefined })}>Nenhuma</button>
            {INFUSIONS.map((e) => (
              <button key={e} type="button" aria-pressed={ref.normalInfusion === e} onClick={() => updateMember(index, { normalInfusion: e })} style={{ ['--c' as string]: elementColor(e) }}>{e}</button>
            ))}
          </div>
          {kitInfusion && ref.normalInfusion !== kitInfusion.element && (
            <button type="button" className="dz-btn sm" onClick={() => updateMember(index, { normalInfusion: kitInfusion.element as NonNullable<MemberRef['normalInfusion']> })}>Ligar a infusão do kit ({kitInfusion.element})</button>
          )}
        </section>
      )}
      <div className="tl-grid">
        <section aria-label="Constelações" className="tl-col">
          <h3>Constelações</h3>
          {tl.constellations.map((c) => (
            <Card
              key={c.n}
              icon={c.icon}
              title={c.name}
              kicker={`Constelação ${c.n}${c.n <= constellation ? '' : ' · bloqueada'}`}
              text={c.description}
              locked={c.n > constellation}
              onHead={() => updateMember(index, { constellation: c.n === constellation ? c.n - 1 : c.n })}
            >
              <NoteChip src={`const${c.n}`} />
              {rows((b) => { const h = buffHome(b.id); return h.kind === 'const' && h.n === c.n; })}
            </Card>
          ))}
        </section>

        <section aria-label="Ataque normal" className="tl-col">
          <h3>{TALENT_NAME.normal}</h3>
          {tl.skills.filter((s) => s.talent === 'normal').map(talentCard)}
          {passive('p1') && passiveCard(passive('p1')!, 'Passiva · Ascensão 1')}
        </section>

        <section aria-label="Habilidade elemental" className="tl-col">
          <h3>{TALENT_NAME.skill}</h3>
          {tl.skills.filter((s) => s.talent === 'skill').map(talentCard)}
          {passive('p2') && passiveCard(passive('p2')!, 'Passiva · Ascensão 4')}
        </section>

        <section aria-label="Supremo" className="tl-col">
          <h3>{TALENT_NAME.burst}</h3>
          {tl.skills.filter((s) => s.talent === 'burst').map(talentCard)}
          {tl.passives.filter((p) => p.id !== 'p1' && p.id !== 'p2').map((p) => passiveCard(p, 'Passiva'))}
        </section>
      </div>

      {others.length > 0 && (
        <section className="tl-others" aria-label="Outros buffs">
          <h3>Outros buffs do personagem</h3>
          <div className="tl-others-grid">{rows((b) => !known.has(b.id))}</div>
        </section>
      )}
    </div>
  );
}
