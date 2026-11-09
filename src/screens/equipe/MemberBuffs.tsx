/**
 * Buffs que um personagem recebe, para ligar e desligar na Equipe (como "Received Team Buffs" do Genshin Optimizer):
 * cada fonte (arma, set, passiva, constelação, aliado, ressonância) é um cartão com o interruptor, os números e a janela.
 */
import { useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { memberBuffCards, memberGivenCards, teamLevelCards, type BuffCard, type GivenCard } from '../../features/character/characterModel';
import { useRotationStore } from '../../features/rotation/store';
import { formatPercent } from '../../ui/format';
import { StackInput } from '../personagem/StackInput';
import { Button } from '../../design/Button';
import { ReactedChips } from './ReactedChips';

interface Group {
  key: string;
  title: string;
  color?: string;
  cards: BuffCard[];
}

function groupCards(cards: BuffCard[], member: number, names: string[], colors: string[]): Group[] {
  const groups: Group[] = [];
  const own = cards.filter((c) => c.giver === member);
  if (own.length) groups.push({ key: 'own', title: `Dele: arma, set e passivas`, color: colors[member], cards: own });
  names.forEach((n, i) => {
    if (i === member) return;
    const mine = cards.filter((c) => c.giver === i);
    if (mine.length) groups.push({ key: `m${i}`, title: `De ${n}`, color: colors[i], cards: mine });
  });
  const team = cards.filter((c) => c.giver === null);
  if (team.length) groups.push({ key: 'team', title: 'Do time e do projeto', cards: team });
  return groups;
}

/** Um cartão de buff: interruptor, números, stacks, elementos da reação e a janela. */
function CardRow({ c, v, onToggle, scope }: { c: BuffCard; v: ProjectView; onToggle: (on: boolean) => void; scope?: string }) {
  const updateMember = useRotationStore((s) => s.updateMember);
  const names = v.project.members.map((m) => m.character);
  return (
    <label className="bcard" data-active={c.active} data-locked={c.lockedOff} title={c.lockedOff ? 'Desligado para o time todo em Rotação e buffs' : undefined}>
      <input type="checkbox" checked={c.active} disabled={c.lockedOff} onChange={(e) => onToggle(e.target.checked)} aria-label={`${c.name} (${c.giverName})`} />
      <span className="bc-body">
        <span className="bc-top">
          <span className="bc-n">{c.needsConfirmation ? 'Buff sem origem conhecida' : c.name}</span>
          <span className="bc-tag">{scope ? `${c.tag} · ${scope}` : c.tag}</span>
        </span>
        {c.chips.length > 0 && (
          <span className="bc-vals">
            {c.chips.map((s) => <span key={s} className="num">{s}</span>)}
          </span>
        )}
        {c.stack && (
          <span className="bc-stacks" role="group" aria-label={`Quantidade de ${c.stack.unit ?? 'stacks'}`}>
            <span>{c.stack.unit ?? 'Stacks'}</span>
            <StackInput value={c.stack.n} max={c.stack.max} step={c.stack.step} label={`${c.stack.unit ?? 'Stacks'} de ${c.name}`} onChange={(n) => updateMember(c.stack!.giver, { stacks: { ...v.project.members[c.stack!.giver].stacks, [c.stack!.buffId]: n } })} />
          </span>
        )}
        {c.reacted && (
          <>
            <span className="bc-lbl2">Elementos da reação</span>
            <ReactedChips own={c.reacted.own} choices={c.reacted.choices} els={c.reacted.els} onChange={(next) => updateMember(c.reacted!.giver, { reacted: next })} />
          </>
        )}
        <span className="bc-meta">
          <span>{c.timed ? `Janela: ${c.window}` : 'Vale o tempo todo'}</span>
          {c.lockedOff && <span className="bc-warn">desligado para o time</span>}
          {c.share !== null && c.share > 0.0005 && <span className="num">{formatPercent(c.share, 1)} do dano dele</span>}
        </span>
      </span>
    </label>
  );
}

/** `inline`: a lista fica sempre aberta, sem o cabeçalho que abre e fecha (usado na tela de Talentos). */
export function MemberBuffs({ v, index, inline = false }: { v: ProjectView; index: number; inline?: boolean }) {
  const setBuff = useRotationStore((s) => s.setBuff);
  const updateMember = useRotationStore((s) => s.updateMember);
  const [open, setOpen] = useState(false);
  const cards = useMemo(() => (v.inSync ? memberBuffCards(v.project, v.resolved, v.bundle, index) : []), [v.project, v.resolved, v.bundle, index, v.inSync]);
  const names = v.project.members.map((m) => m.character);
  const groups = useMemo(() => groupCards(cards, index, names, v.colors), [cards, index, names.join('|'), v.colors]);
  const toggleable = cards.filter((c) => !c.lockedOff);
  const activeCount = cards.filter((c) => c.active).length;

  const setEnabled = (c: BuffCard, on: boolean) =>
    setBuff({ toggleId: c.toggleId, baseId: c.toggleId.split('@')[0], gear: c.gear, receiver: names[index], receivers: c.receivers }, on);
  const setAll = (on: boolean) => toggleable.forEach((c) => c.active !== on && setEnabled(c, on));

  return (
    <div className="eq-buffs" data-open={inline || open}>
      {!inline && (
        <button type="button" className="bc-head" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="bc-lbl">Buffs recebidos</span>
          <span className="bc-badge num">{activeCount}/{cards.length}</span>
          <span className="bc-chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>
      )}
      {(inline || open) && (
        <div className="bc-list">
          <div className="bc-bulk">
            <span className="muted small">Desligar um buff tira só dele ({names[index]}).</span>
            <span>
              <Button variant="ghost" size="sm" onClick={() => setAll(true)}>Ligar todos</Button>
              {' · '}
              <Button variant="ghost" size="sm" onClick={() => setAll(false)}>Desligar todos</Button>
            </span>
          </div>
          {cards.some((c) => c.gear && !c.active) && <p className="bc-note">Os buffs de arma e de artefatos começam desligados: ligue só os que valem neste time.</p>}
          {cards.length === 0 && <p className="muted small">Nenhum buff com número cadastrado chega a este personagem.</p>}
          {groups.map((g) => (
            <section key={g.key} className="bc-grp" style={{ ['--g' as string]: g.color ?? 'var(--muted)' }}>
              <h4>{g.title}</h4>
              {g.cards.map((c) => (
                <CardRow key={c.toggleId} c={c} v={v} onToggle={(on) => setEnabled(c, on)} />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

const SCOPE_ORDER: GivenCard['scope'][] = ['team', 'others', 'self', 'some'];
const SCOPE_TITLE: Record<GivenCard['scope'], string> = { team: 'Buffa o time todo', others: 'Buffa os aliados', self: 'Buffa só ele', some: 'Buffa personagens específicos' };

/**
 * Habilidades que o personagem passa (Equipe): arma, set, passivas e constelações dele, agrupadas pelo alcance (time todo, aliados,
 * só ele). Ligar ou desligar vale para todos que recebem; o que cada um recebe aparece na aba Talentos dele.
 */
export function GivenBuffs({ v, index }: { v: ProjectView; index: number }) {
  const setGiven = useRotationStore((s) => s.setGivenBuff);
  const [open, setOpen] = useState(false);
  const cards = useMemo(() => (v.inSync ? memberGivenCards(v.project, v.resolved, v.bundle, index) : []), [v.project, v.resolved, v.bundle, index, v.inSync]);
  const name = v.project.members[index].character;
  const activeCount = cards.filter((c) => c.active).length;
  const setAll = (on: boolean) => cards.forEach((c) => c.active !== on && setGiven(c.baseId, c.gear, on));
  const groups = SCOPE_ORDER.map((k) => ({ key: k, cards: cards.filter((c) => c.scope === k) })).filter((g) => g.cards.length > 0);

  return (
    <div className="eq-buffs" data-open={open}>
      <button type="button" className="bc-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="bc-lbl">Habilidades que {name} passa</span>
        <span className="bc-badge num">{activeCount}/{cards.length}</span>
        <span className="bc-chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="bc-list">
          <div className="bc-bulk">
            <span className="muted small">Desligar tira a habilidade de todos que a recebem.</span>
            <span>
              <Button variant="ghost" size="sm" onClick={() => setAll(true)}>Ligar todas</Button>
              {' · '}
              <Button variant="ghost" size="sm" onClick={() => setAll(false)}>Desligar todas</Button>
            </span>
          </div>
          {cards.some((c) => c.gear && !c.active) && <p className="bc-note">Os buffs de arma e de artefatos começam desligados: ligue só os que valem neste time.</p>}
          {cards.length === 0 && <p className="muted small">{name} não passa nenhum buff com número cadastrado.</p>}
          {groups.map((g) => (
            <section key={g.key} className="bc-grp" style={{ ['--g' as string]: v.colors[index] }}>
              <h4>{g.key === 'some' ? SCOPE_TITLE.some : SCOPE_TITLE[g.key]}</h4>
              {g.cards.map((c) => (
                <CardRow key={c.baseId} c={c} v={v} scope={g.key === 'some' ? c.scopeLabel : undefined} onToggle={(on) => setGiven(c.baseId, c.gear, on)} />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ressonância e buffs extras do projeto: não são de nenhum personagem, então ficam fora das colunas. */
export function TeamBuffs({ v }: { v: ProjectView }) {
  const setGiven = useRotationStore((s) => s.setGivenBuff);
  const cards = useMemo(() => (v.inSync ? teamLevelCards(v.project, v.resolved, v.bundle) : []), [v.project, v.resolved, v.bundle, v.inSync]);
  if (cards.length === 0) return null;
  return (
    <section className="dz-panel eq-teambuffs eq-buffs" data-open="true" aria-label="Buffs do time e do projeto">
      <h3 className="h3">Buffs do time e do projeto</h3>
      <div className="bc-list list">
        {cards.map((c) => (
          <CardRow key={c.toggleId} c={c} v={v} onToggle={(on) => setGiven(c.toggleId.split('@')[0], c.gear, on)} scope={c.receivers.length === 1 && c.giverName === 'Projeto' ? c.receivers[0] : undefined} />
        ))}
      </div>
    </section>
  );
}
