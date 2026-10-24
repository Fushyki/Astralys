/**
 * Buffs que um personagem recebe, para ligar e desligar na Equipe (como "Received Team Buffs" do Genshin Optimizer):
 * cada fonte (arma, set, passiva, constelação, aliado, ressonância) é um cartão com o interruptor, os números e a janela.
 */
import { useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { memberBuffCards, type BuffCard } from '../../features/character/characterModel';
import { useRotationStore } from '../../features/rotation/store';
import { formatPercent } from '../../ui/format';

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

export function MemberBuffs({ v, index }: { v: ProjectView; index: number }) {
  const setEnabled = useRotationStore((s) => s.setSourceEnabled);
  const [open, setOpen] = useState(false);
  const cards = useMemo(() => (v.inSync ? memberBuffCards(v.project, v.resolved, v.bundle, index) : []), [v.project, v.resolved, v.bundle, index, v.inSync]);
  const names = v.project.members.map((m) => m.character);
  const groups = useMemo(() => groupCards(cards, index, names, v.colors), [cards, index, names.join('|'), v.colors]);
  const toggleable = cards.filter((c) => !c.lockedOff);
  const activeCount = cards.filter((c) => c.active).length;

  const setAll = (on: boolean) => toggleable.forEach((c) => c.active !== on && setEnabled(c.toggleId, on));

  return (
    <div className="eq-buffs" data-open={open}>
      <button type="button" className="bc-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="bc-lbl">Buffs recebidos</span>
        <span className="bc-badge num">{activeCount}/{cards.length}</span>
        <span className="bc-chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="bc-list">
          <div className="bc-bulk">
            <span className="muted small">Desligar um buff tira só dele ({names[index]}).</span>
            <span>
              <button type="button" className="dz-link" onClick={() => setAll(true)}>Ligar todos</button>
              {' · '}
              <button type="button" className="dz-link" onClick={() => setAll(false)}>Desligar todos</button>
            </span>
          </div>
          {cards.length === 0 && <p className="muted small">Nenhum buff com número cadastrado chega a este personagem.</p>}
          {groups.map((g) => (
            <section key={g.key} className="bc-grp" style={{ ['--g' as string]: g.color ?? 'var(--muted)' }}>
              <h4>{g.title}</h4>
              {g.cards.map((c) => (
                <label key={c.toggleId} className="bcard" data-active={c.active} data-locked={c.lockedOff} title={c.lockedOff ? 'Desligado para o time todo em Rotação e buffs' : undefined}>
                  <input type="checkbox" checked={c.active} disabled={c.lockedOff} onChange={(e) => setEnabled(c.toggleId, e.target.checked)} aria-label={`${c.name} (${c.giverName})`} />
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
