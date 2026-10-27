/**
 * Talentos: tudo que o personagem recebe dos aliados e de si mesmo (buffs) e o que o time faz no inimigo (debuffs):
 * total por atributo, quanto cada aliado dá (ex.: ATK de Bennett e de Iansan) e a lista com interruptores e a escolha dos stacks.
 */
import { useMemo } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Panel } from '../../design/primitives';
import { assembleTeam } from '../../engine';
import { memberBuffCards } from '../../features/character/characterModel';
import { formatDecimal } from '../../ui/format';
import { MemberBuffs } from '../equipe/MemberBuffs';
import '../equipe.css';
import { aggregateBuffs } from './Dashboard';

const sign = (n: number) => (n >= 0 ? '+' : '−');
const fmt = (r: { total: number; pct: boolean }) => `${sign(r.total)}${r.pct ? `${formatDecimal(Math.abs(r.total), Math.abs(r.total) % 1 ? 1 : 0)}%` : Math.abs(Math.round(r.total)).toLocaleString('pt-BR')}`;

export function ReceivedSection({ v, index }: { v: ProjectView; index: number }) {
  const name = v.project.members[index].character;
  const names = v.project.members.map((m) => m.character);
  const cards = useMemo(() => (v.inSync ? memberBuffCards(v.project, v.resolved, v.bundle, index).filter((c) => c.active) : []), [v.project, v.resolved, v.bundle, index, v.inSync]);
  const total = useMemo(() => aggregateBuffs(cards), [cards]);
  const givers = useMemo(() => {
    const out: { key: string; label: string; color?: string; rows: ReturnType<typeof aggregateBuffs> }[] = [];
    names.forEach((n, i) => {
      const rows = aggregateBuffs(cards.filter((c) => c.giver === i));
      if (rows.length) out.push({ key: n, label: i === index ? `${n} (ele mesmo)` : n, color: v.colors[i], rows });
    });
    const rows = aggregateBuffs(cards.filter((c) => c.giver === null));
    if (rows.length) out.push({ key: 'time', label: 'Time e projeto', rows });
    return out;
  }, [cards, names.join('|'), v.colors, index]);
  const assembly = useMemo(() => assembleTeam(v.resolved.team), [v.resolved.team]);
  const cfg = v.resolved.team.config;
  const debuffs = [
    ...Object.entries(assembly.enemyRes)
      .filter(([, res]) => Math.abs(res - cfg.enemyBaseRes) > 1e-9)
      .map(([el, res]) => ({ key: `res-${el}`, label: `RES ${el === 'Physical' ? 'Física' : el} do inimigo`, text: `${sign(res - cfg.enemyBaseRes)}${formatDecimal(Math.abs(res - cfg.enemyBaseRes) * 100, 0)}% (${formatDecimal(res * 100, 0)}%)` })),
    ...(assembly.enemyDefRed - cfg.enemyDefRed > 1e-9 ? [{ key: 'def', label: 'DEF do inimigo reduzida', text: `−${formatDecimal((assembly.enemyDefRed - cfg.enemyDefRed) * 100, 0)}%` }] : []),
  ];

  return (
    <Panel title={`Buffs e debuffs de ${name}`} aside={<span className="muted small num">{cards.length} buffs ativos</span>}>
      <div className="tl-recv">
        {total.length === 0 ? <p className="muted small">Nenhum buff ativo chega a {name}.</p> : (
          <div className="tot" aria-label="Total dos buffs ativos">
            <span className="lbl">Total recebido</span>
            {total.map((r) => <span key={r.key} className="x" title={r.sources.join(' · ')}>{r.label}<b className="num">{fmt(r)}</b></span>)}
          </div>
        )}
        {givers.map((g) => (
          <div className="giver" key={g.key}>
            <span className="who" style={g.color ? { color: g.color } : undefined}>{g.label}</span>
            {g.rows.map((r) => <span key={r.key} className="x" title={r.sources.join(' · ')}>{r.label}<b className="num">{fmt(r)}</b></span>)}
          </div>
        ))}
        {debuffs.length > 0 && (
          <div className="giver deb" aria-label="Debuffs no inimigo">
            <span className="who">Debuffs no inimigo</span>
            {debuffs.map((d) => <span key={d.key} className="x">{d.label}<b className="num">{d.text}</b></span>)}
          </div>
        )}
      </div>
      <MemberBuffs v={v} index={index} inline />
    </Panel>
  );
}
