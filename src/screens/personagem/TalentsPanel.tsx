/**
 * Aba Talentos e constelações (guia visual v2): coluna da constelação (mapa de estrelas + C1 a C6), três talentos com os
 * golpes em grupos e três passivas. As condições (checkbox + valor + efeitos) são os buffs curados do personagem:
 * ligar ou desligar muda o cálculo do time inteiro na hora.
 */
import { useEffect, useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Button } from '../../design/Button';
import { elementColor } from '../../design/elements';
import { Segmented, StarIcon } from '../../design/primitives';
import type { CharacterBuff } from '../../effects/schema';
import { KIT_INFUSIONS, assembleTeam, characterBuffDelta, effectiveTalents } from '../../engine';
import type { MemberRef, ReactionChoice } from '../../engine';
import { REACTION_LABEL, characterReactions, memberBuffCards, reactionOptions, type MoveLine } from '../../features/character/characterModel';
import { buffHome, paramRows, skillIconUrl, splitChip, useTalents, type CharacterTalents, type TalentText } from '../../features/character/talents';
import { useRotationStore } from '../../features/rotation/store';
import { deltaChips } from '../../features/team/teamModel';
import { formatDecimal, formatInt } from '../../ui/format';
import { useDamageGroups } from './MainColumn';
import '../talentos.css';

type Crit = 'noCrit' | 'avg' | 'crit';
const CRIT_OPTIONS: { value: Crit; label: string }[] = [{ value: 'noCrit', label: 'Não crítico' }, { value: 'avg', label: 'Médio' }, { value: 'crit', label: 'Crítico' }];
const INFUSIONS = ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Anemo', 'Geo', 'Dendro'] as const;
const TALENT_TYPE = { normal: 'Ataque normal', skill: 'Habilidade elemental', burst: 'Supremo' } as const;
const UNLOCK: Record<string, string> = { p1: 'Ascensão 1', p2: 'Ascensão 4' };
/** Pontos do mapa de estrelas (viewBox 250 × 120) e a ramificação final. */
const NODES: [number, number][] = [[22, 96], [66, 58], [114, 74], [150, 26], [200, 42], [228, 100]];

function Icon({ name, color }: { name: string; color?: string }) {
  const [failed, setFailed] = useState(false);
  return name && !failed ? <img src={skillIconUrl(name)} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} style={color ? { borderColor: color } : undefined} /> : <StarIcon size={20} color={color} />;
}

/** Título de seção do texto do jogo: linha curta, sem ponto final. */
const isHeading = (line: string) => line.length <= 44 && !/[.!?:]$/.test(line.trim());

/** Texto completo do jogo em parágrafos, com os títulos de seção em destaque. */
function FullText({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trim());
  return (
    <div className="tl-full">
      {lines.map((l, i) => (l ? (isHeading(l) && i > 0 ? <h3 key={i}>{l}</h3> : <p key={i}>{l}</p>) : null))}
      {lines.some((l) => /(\.\.\.|…)$/.test(l)) && <p className="tl-cut">Os trechos que terminam em "..." já vêm cortados do Lunaris; o Astralys não tem a continuação.</p>}
    </div>
  );
}

/** Descrição curta (até 3 linhas); "ver tudo" abre o texto completo do jogo, com rolagem. */
function OneLine({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  // A prévia leva só as frases (sem os títulos de seção, que no texto corrido ficariam colados na frase seguinte).
  const flat = text.split('\n').map((l) => l.trim()).filter((l) => l && !isHeading(l)).join(' ') || text.replace(/\s*\n+\s*/g, ' ');
  return (
    <div className="tl-desc">
      <p>{flat}</p>
      {flat.length > 120 && <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>ver tudo</Button>}
      {open && (
        <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="dz-dialog wide tl-dialog" role="dialog" aria-modal="true" aria-label={title}>
            <header>
              <h2 className="h2">{title}</h2>
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Fechar</Button>
            </header>
            <FullText text={text} />
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ label, value, text, onDec, onInc, decOff, incOff }: { label: string; value: number; text: string; onDec: () => void; onInc: () => void; decOff?: boolean; incOff?: boolean }) {
  return (
    <div className="step" role="group" aria-label={label} data-value={value}>
      <button type="button" aria-label={`Diminuir: ${label}`} onClick={onDec} disabled={decOff}>−</button>
      <span className="num">{text}</span>
      <button type="button" aria-label={`Aumentar: ${label}`} onClick={onInc} disabled={incOff}>+</button>
    </div>
  );
}

function ratio(rows: { name: string; value: string }[]) {
  return rows;
}

interface CondProps {
  buff: CharacterBuff;
  index: number;
  constellation: number;
  disabled: string[];
  chips: string[];
  onToggle: (id: string, enabled: boolean) => void;
}

/** Id do motor do buff do personagem: fonte estática (só dele, sempre) ou buff de time (faixa/regra). */
function toggleIdOf(index: number, b: CharacterBuff): string {
  return !b.timed && b.scope === 'self' && b.stats ? `m${index}:cbuff-${b.id}` : `cbuff-${index}-${b.id}`;
}

/** Condição: caixa dourada com o checkbox, o texto, o valor em destaque e os efeitos que ela dá. */
function Condition({ buff, index, constellation, disabled, chips, onToggle }: CondProps) {
  const id = toggleIdOf(index, buff);
  const locked = buff.minConstellation > constellation;
  const active = !locked && !disabled.includes(id);
  const fallback = buff.stats ? deltaChips(characterBuffDelta(buff.stats, !!buff.forElements)) : [];
  const rows = ratio((chips.length ? chips : fallback).map(splitChip));
  return (
    <div className="tl-cond" data-active={active} data-locked={locked}>
      <label>
        <input type="checkbox" checked={active} disabled={locked} onChange={(e) => onToggle(id, e.target.checked)} aria-label={buff.label} />
        <span className="txt" title={buff.note}>{buff.label}{locked ? ` · libera na C${buff.minConstellation}` : buff.timed ? '' : ' · sempre'}</span>
        {rows[0] && <span className="dz-badge gold num">{rows[0].value || rows[0].name}</span>}
      </label>
      <div className="rows">
        {rows.map((r) => (
          <div className="r" key={r.name + r.value}><span className="k">{r.name}</span><span className="v num">{r.value}</span></div>
        ))}
        {rows.length === 0 && <div className="r"><span className="k">{buff.convert ? 'Calculado a partir dos stats dele' : 'Efeito sem número fixo'}</span></div>}
      </div>
    </div>
  );
}

export function TalentsPanel({ v, index }: { v: ProjectView; index: number }) {
  const { data: all } = useTalents();
  const setSourceEnabled = useRotationStore((s) => s.setSourceEnabled);
  const updateMember = useRotationStore((s) => s.updateMember);
  const ref: MemberRef = v.project.members[index];
  const member = v.resolved.team.members[index];
  const character = member.character;
  const constellation = ref.constellation ?? 0;
  const eff = effectiveTalents(ref.talents, ref.constellation, character);
  const [crit, setCrit] = useState<Crit>('avg');
  const [reaction, setReaction] = useState<ReactionChoice>('none');
  const teamElements = v.resolved.team.members.map((m) => m.character.element);
  const options = reactionOptions(character.element, teamElements);
  const activeReaction = options.includes(reaction) ? reaction : 'none';
  const groups = useDamageGroups(v, index, activeReaction);
  const color = elementColor(character.element);
  const tl: CharacterTalents | undefined = all?.find((t) => t.character === ref.character);
  const effects = v.data.effects.characters.find((c) => c.character === ref.character);
  const buffs = effects?.buffs ?? [];
  const notes = effects?.notes ?? [];
  const disabled = v.project.disabled;
  const cards = useMemo(() => memberBuffCards(v.project, v.resolved, v.bundle, index), [v.project, v.resolved, v.bundle, index]);
  const chipsOf = (b: CharacterBuff) => cards.find((c) => c.id === `cbuff-${index}-${b.id}` || c.id === `m${index}:cbuff-${b.id}`)?.chips ?? [];
  const assembly = useMemo(() => assembleTeam(v.resolved.team), [v.resolved.team]);
  const reactions = characterReactions({
    element: character.element,
    teamElements,
    em: v.bundle.memberStats[index].em,
    characterLevel: v.resolved.team.config.characterLevel,
    enemy: { level: v.resolved.team.config.enemyLevel, res: assembly.enemyRes, defRed: assembly.enemyDefRed, defIgnore: v.resolved.team.config.enemyDefIgnore },
    ampCoefficient: v.resolved.ampCoefficient,
    reactionBonus: v.bundle.memberStats[index].reactionBonus,
  });
  const infusable = character.weapon !== 'Catalyst' && character.weapon !== 'Bow' && v.resolved.team.config.elementMode === 'kit';
  const kitInfusion = KIT_INFUSIONS[ref.character];

  if (!tl) return <p className="note" role="status">Carregando os textos dos talentos…</p>;

  const conds = (pred: (b: CharacterBuff) => boolean) =>
    buffs.filter(pred).map((b) => <Condition key={b.id} buff={b} index={index} constellation={constellation} disabled={disabled} chips={chipsOf(b)} onToggle={setSourceEnabled} />);
  const noteOf = (src: string) => notes.find((n) => n.src === src);
  const valueOf = (l: MoveLine) => `${l.hits > 1 ? `${l.hits}× ` : ''}${formatInt(l[crit])}`;
  const rowsOf = (lines: MoveLine[]) => lines.map((l) => ({ key: l.id, name: l.name, value: valueOf(l), tone: l.element === 'Physical' ? undefined : elementColor(l.element) }));
  const setTalent = (k: 'normal' | 'skill' | 'burst', d: number) => updateMember(index, { talents: { ...ref.talents, [k]: Math.max(1, Math.min(15, ref.talents[k] + d)) } });
  const setCons = (n: number) => updateMember(index, { constellation: Math.max(0, Math.min(6, n)) || undefined });

  type Group = { title: string; rows: { key: string; name: string; value: string; tone?: string }[] };
  const groupsOf = (talent: 'normal' | 'skill' | 'burst'): Group[] => {
    const lines = groups.find((g) => g.talent === talent)?.lines ?? [];
    const by = (types: string[]) => lines.filter((l) => types.includes(l.hitType));
    const out: Group[] = [];
    if (talent === 'normal') {
      out.push({ title: 'Ataque normal', rows: rowsOf(by(['normal'])) }, { title: 'Ataque carregado', rows: rowsOf(by(['charged'])) }, { title: 'Ataque imersivo', rows: rowsOf(by(['plunge'])) });
    } else {
      const basics = by(['normal', 'charged', 'plunge']);
      const rest = lines.filter((l) => !basics.includes(l));
      out.push({ title: talent === 'skill' ? 'Habilidade' : 'Supremo', rows: rowsOf(rest) });
      if (basics.length) out.push({ title: 'Golpes de ataque normal neste modo', rows: rowsOf(basics) });
    }
    return out.filter((g) => g.rows.length > 0);
  };

  const talentCard = (t: CharacterTalents['skills'][number]) => {
    const k = t.talent;
    const level = eff[k];
    const params = paramRows(t.params, level);
    const mine = conds((b) => { const h = buffHome(b.id); return h.kind === 'talent' && h.talent === k; });
    const tone = k === 'normal' ? { bg: '#1e2a5a', fg: '#b9c6ff', ring: '#3a4680' } : k === 'skill' ? { bg: '#173a48', fg: '#a8ddeb', ring: color } : { bg: '#3a3016', fg: '#f1c96b', ring: '#6b5524' };
    return (
      <article className="tl-card" key={k} aria-label={t.name}>
        <header>
          <span className="ico"><Icon name={t.icon} color={tone.ring} /></span>
          <span className="who">
            <b>{t.name}</b>
            <span className="dz-badge" style={{ background: tone.bg, color: tone.fg }}>{TALENT_TYPE[k]}</span>
          </span>
          <Stepper label={`Nível de ${TALENT_TYPE[k]}`} value={ref.talents[k]} text={`Nv ${level}`} onDec={() => setTalent(k, -1)} onInc={() => setTalent(k, 1)} decOff={ref.talents[k] <= 1} incOff={ref.talents[k] >= 15} />
        </header>
        <OneLine title={t.name} text={t.description} />
        <div className="body">
          {groupsOf(k).map((g) => (
            <div className="grp" key={g.title}>
              <div className="gh">{g.title}</div>
              {g.rows.map((r) => (
                <div className="r" key={r.key}><span className="k" style={r.tone ? { color: r.tone } : undefined}>{r.name}</span><span className="v num">{r.value}</span></div>
              ))}
            </div>
          ))}
          {params.length > 0 && (
            <div className="grp">
              <div className="gh">Duração e limites</div>
              {params.map((p) => <div className="r" key={p.label}><span className="k">{p.label}</span><span className="v num">{p.value}</span></div>)}
            </div>
          )}
          {mine}
        </div>
      </article>
    );
  };

  const passiveCard = (title: string, list: CharacterTalents['passives']) => (
    <article className="tl-card passive" key={title} aria-label={title}>
      {list.map((p, i) => {
        const mine = conds((b) => { const h = buffHome(b.id); return h.kind === 'passive' && h.id === p.id; });
        const note = noteOf(p.id);
        return (
          <section key={p.id} className="pas">
            <header>
              <span className="ico round"><Icon name={p.icon} color="#a8ddeb" /></span>
              <span className="who">
                <b>{p.name}</b>
                <span className="dz-badge" style={{ background: '#1e3324', color: '#b5e3a3' }}>{UNLOCK[p.id] ?? 'Talento passivo'}</span>
              </span>
            </header>
            <OneLine title={p.name} text={p.description} />
            <div className="body">
              {mine}
              {mine.length === 0 && <span className="empty">{note?.kind === 'utility' ? `Sem efeito no dano: ${note.note}` : note ? `Parcial: ${note.note}` : 'Sem efeito numérico cadastrado para este time.'}</span>}
            </div>
            {i < list.length - 1 && <hr />}
          </section>
        );
      })}
    </article>
  );

  const passives = tl.passives;
  const third = passives.filter((p) => p.id !== 'p1' && p.id !== 'p2');
  const a1 = passives.find((p) => p.id === 'p1');
  const a4 = passives.find((p) => p.id === 'p2');

  return (
    <div className="tl" style={{ ['--e' as string]: color }}>
      <div className="tl-bar">
        <span className="grow" />
        <Segmented label="Crítico" value={crit} options={CRIT_OPTIONS} onChange={setCrit} />
        <Segmented label="Reação da tabela de dano" value={activeReaction} options={options.map((o) => ({ value: o, label: REACTION_LABEL[o] }))} onChange={setReaction} />
      </div>

      <section className="tl-reacts" aria-label={`Reações de ${ref.character}`}>
        <span className="lb"><StarIcon /> Reações de {ref.character}</span>
        {reactions.length === 0 && <span className="muted small">Nenhuma reação com os elementos deste time.</span>}
        {reactions.map((r) => (
          <span key={r.id} className="x"><span style={{ color }}>{r.name}</span><b className="num">{r.value.type === 'mult' ? `×${formatDecimal(r.value.amount, 2)}` : formatInt(r.value.amount)}</b></span>
        ))}
      </section>

      {infusable && (
        <section className="tl-infusion" aria-label="Infusão dos ataques normais">
          <div>
            <b>Infusão dos ataques normais</b>
            <p>
              {ref.character} usa {character.weapon === 'Sword' ? 'espada' : character.weapon === 'Claymore' ? 'montante' : 'lança'}: ataque normal, carregado e de queda são <b>Físicos</b>, a não ser com infusão.
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
            <Button variant="secondary" size="sm" onClick={() => updateMember(index, { normalInfusion: kitInfusion.element as NonNullable<MemberRef['normalInfusion']> })}>Ligar a infusão do kit ({kitInfusion.element})</Button>
          )}
        </section>
      )}

      <section className="tl-grid">
        <aside className="tl-card cons" aria-label="Constelação">
          <header className="bar">
            <StarIcon />
            <h2 className="h2">Constelação</h2>
            <Stepper label="Constelação" value={constellation} text={`C${constellation}`} onDec={() => setCons(constellation - 1)} onInc={() => setCons(constellation + 1)} decOff={constellation <= 0} incOff={constellation >= 6} />
          </header>
          <svg viewBox="0 0 250 120" role="group" aria-label={`Constelação de ${ref.character}, C${constellation}`}>
            <g fill="none" strokeWidth="1.3">
              {NODES.slice(1).map((n, i) => <line key={i} x1={NODES[i][0]} y1={NODES[i][1]} x2={n[0]} y2={n[1]} stroke={i + 2 <= constellation ? 'var(--gold)' : '#2e3a70'} />)}
              <line x1="114" y1="74" x2="140" y2="108" stroke="#2e3a70" />
            </g>
            {NODES.map(([x, y], i) => {
              const n = i + 1;
              const lit = n <= constellation;
              return (
                <g key={n} role="button" tabIndex={0} aria-pressed={lit} aria-label={`Constelação ${n}`} className="node" onClick={() => setCons(n === constellation ? n - 1 : n)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setCons(n === constellation ? n - 1 : n))}>
                  <circle cx={x} cy={y} r="10" fill={lit ? 'var(--gold)' : '#0c1128'} stroke={lit ? 'var(--gold)' : '#3a4680'} strokeWidth="1.2" />
                  <text x={x} y={y + 3.5} textAnchor="middle" fill={lit ? '#1a1405' : '#7e88b6'}>C{n}</text>
                </g>
              );
            })}
          </svg>
          <div className="list">
            {tl.constellations.map((c) => {
              const lit = c.n <= constellation;
              const mine = conds((b) => { const h = buffHome(b.id); return h.kind === 'const' && h.n === c.n; });
              const note = noteOf(`const${c.n}`);
              return (
                <div className="cst" key={c.n} data-lit={lit}>
                  <button type="button" className="head" aria-label={`Acender até a constelação ${c.n}`} onClick={() => setCons(c.n === constellation ? c.n - 1 : c.n)}>
                    <span className="ring num">C{c.n}</span>
                    <span className="t"><b>{c.name}</b></span>
                  </button>
                  <OneLine title={`C${c.n} · ${c.name}`} text={c.description} />
                  {mine.length > 0 && <div className="body">{mine}</div>}
                  {mine.length === 0 && lit && note && <span className="empty">{note.kind === 'utility' ? `Sem efeito no dano: ${note.note}` : `Parcial: ${note.note}`}</span>}
                </div>
              );
            })}
            <span className="empty">Apagadas = ainda não desbloqueadas. Clique para acender até ela.</span>
          </div>
        </aside>

        {tl.skills.map(talentCard)}
        {a1 && passiveCard(a1.name, [a1])}
        {a4 && passiveCard(a4.name, [a4])}
        {third.length > 0 && passiveCard('Talento passivo', third)}
      </section>
    </div>
  );
}
