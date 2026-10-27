/**
 * Buffs que um personagem recebe, para ligar e desligar na Equipe (como "Received Team Buffs" do Genshin Optimizer):
 * cada fonte (arma, set, passiva, constelação, aliado, ressonância) é um cartão com o interruptor, os números e a janela.
 */
import { useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { memberBuffCards, type BuffCard } from '../../features/character/characterModel';
import { useRotationStore } from '../../features/rotation/store';
import { formatPercent } from '../../ui/format';
import { Button } from '../../design/Button';

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
                <label key={c.toggleId} className="bcard" data-active={c.active} data-locked={c.lockedOff} title={c.lockedOff ? 'Desligado para o time todo em Rotação e buffs' : undefined}>
                  <input type="checkbox" checked={c.active} disabled={c.lockedOff} onChange={(e) => setEnabled(c, e.target.checked)} aria-label={`${c.name} (${c.giverName})`} />
                  <span className="bc-body">
                    <span className="bc-top">
                      <span className="bc-n">{c.needsConfirmation ? 'Buff sem origem conhecida' : c.name}</span>
                      <span className="bc-tag">{c.tag}</span>
                    </span>
                    {c.chips.length > 0 && (
                      <span className="bc-vals">
                        {c.chips.map((s) => <span key={s} className="num">{s}</span>)}
                      </span>
                    )}
                    {c.stack && (
                      <span className="bc-stacks" role="group" aria-label={`Quantidade de ${c.stack.unit ?? 'stacks'}`}>
                        <span>{c.stack.unit ?? 'Stacks'}</span>
                        <button type="button" aria-label="Menos" disabled={c.stack.n <= 0} onClick={(e) => { e.preventDefault(); updateMember(c.stack!.giver, { stacks: { ...v.project.members[c.stack!.giver].stacks, [c.stack!.buffId]: c.stack!.n - 1 } }); }}>−</button>
                        <b className="num">{c.stack.n}<small>/{c.stack.max}</small></b>
                        <button type="button" aria-label="Mais" disabled={c.stack.n >= c.stack.max} onClick={(e) => { e.preventDefault(); updateMember(c.stack!.giver, { stacks: { ...v.project.members[c.stack!.giver].stacks, [c.stack!.buffId]: c.stack!.n + 1 } }); }}>+</button>
                      </span>
                    )}
                    <span className="bc-meta">
                      <span>{c.timed ? `Janela: ${c.window}` : 'Vale o tempo todo'}</span>
                      {c.lockedOff && <span className="bc-warn">desligado para o time</span>}
                      {c.share !== null && c.share > 0.0005 && <span className="num">{formatPercent(c.share, 1)} do dano dele</span>}
                    </span>
                  </span>
                </label>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
