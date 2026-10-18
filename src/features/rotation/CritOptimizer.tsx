/**
 * Otimizador interativo: mostra como o dano da equipe muda conforme os rolls de substat vão para crítico
 * (Taxa + Dano Crítico) ou para o resto. O ponto dourado é o melhor; o azul é o build atual. Arraste o controle
 * (ou use as setas) para ver cada distribuição e aplique a que quiser.
 */
import { useEffect, useState } from 'react';
import { SUBSTATS, type AnalysisBundle, type ResolvedProject, type RotationProject, type Substat } from '../../engine';
import { Hint, Panel } from '../../ui/components';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';
import { useRotationStore } from './store';
import { useCritSweep } from './useCritSweep';

const W = 640;
const H = 220;
const PAD = { l: 64, r: 16, t: 14, b: 30 };

const LABEL: Record<Substat, string> = {
  CR: 'Taxa Crítica', CD: 'Dano Crítico', 'ATK%': 'ATK%', EM: 'Maestria', ER: 'Recarga', ATK: 'ATK fixo', 'HP%': 'HP%', HP: 'HP fixo', 'DEF%': 'DEF%', DEF: 'DEF fixo',
};

export function CritOptimizer({ project, resolved, bundle, index }: { project: RotationProject; resolved: ResolvedProject; bundle: AnalysisBundle; index: number }) {
  const update = useRotationStore((s) => s.updateMember);
  const { sweep, error } = useCritSweep(resolved, bundle, index);
  const [picked, setPicked] = useState<number | null>(null);
  const name = project.members[index]?.character ?? '';

  useEffect(() => setPicked(null), [index]);

  if (error) return <Panel title={`Otimizador de ${name}`} wide><p className="ast-error ast-full" role="alert">{error}</p></Panel>;
  if (!sweep) return <Panel title={`Otimizador de ${name}`} wide><Hint>Calculando as distribuições…</Hint></Panel>;
  if (sweep.points.length === 0) {
    return (
      <Panel title={`Otimizador de ${name}`} wide>
        <Hint>Este personagem usa rolls definidos à mão, ou não causa dano na rotação. Volte para "Otimizar automaticamente" no build para ver a curva.</Hint>
      </Panel>
    );
  }

  const pts = sweep.points;
  const curRolls = bundle.optimization.rolls[index];
  const curCrit = curRolls.CR + curRolls.CD;
  const curIdx = Math.max(0, pts.findIndex((p) => p.critRolls === curCrit));
  const sel = Math.min(picked ?? curIdx, pts.length - 1);
  const p = pts[sel];
  const best = pts[sweep.best];

  const ys = pts.map((q) => q.teamAvg);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const span = hi - lo || 1;
  const x = (i: number) => PAD.l + (pts.length === 1 ? 0 : (i / (pts.length - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - (v - lo) / span) * (H - PAD.t - PAD.b);
  const path = pts.map((q, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(q.teamAvg).toFixed(1)}`).join(' ');
  const diff = (v: number, ref: number) => (ref ? (v / ref - 1) * 100 : 0);
  const vsCur = diff(p.teamAvg, pts[curIdx].teamAvg);
  const rest = SUBSTATS.filter((s) => s !== 'CR' && s !== 'CD' && p.rolls[s] > 0);
  const applied = project.members[index]?.forcedCritRolls === p.critRolls;
  const tickEvery = Math.ceil(pts.length / 8);

  return (
    <Panel title={`Otimizador de ${name}`} wide>
      <Hint>
        Cada ponto é uma divisão dos rolls livres: quanto vai para crítico (Taxa + Dano) e o resto, distribuído da melhor forma para a rotação. A linha mostra o dano médio da equipe. O eixo vertical não começa em zero, para a diferença aparecer.
      </Hint>
      <div className="ast-full ast-opt">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Dano médio da equipe conforme os rolls em crítico de ${name}. Melhor com ${best.critRolls} rolls em crítico.`}>
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(lo + t * span)} y2={y(lo + t * span)} className="grid" />
              <text x={PAD.l - 8} y={y(lo + t * span) + 4} textAnchor="end" className="tick">{formatInt(lo + t * span)}</text>
            </g>
          ))}
          {pts.map((q, i) =>
            i % tickEvery === 0 || i === pts.length - 1 ? (
              <text key={q.critRolls} x={x(i)} y={H - 8} textAnchor="middle" className="tick">{q.critRolls}</text>
            ) : null,
          )}
          <path d={path} className="line" />
          <line x1={x(sel)} x2={x(sel)} y1={PAD.t} y2={H - PAD.b} className="cursor" />
          <circle cx={x(sweep.best)} cy={y(best.teamAvg)} r={7} className="best" />
          <circle cx={x(curIdx)} cy={y(pts[curIdx].teamAvg)} r={4.5} className="cur" />
          <circle cx={x(sel)} cy={y(p.teamAvg)} r={3} className="sel" />
        </svg>
        <p className="axis">Rolls em Taxa + Dano Crítico</p>
        <label className="ast-slider">
          <span>Rolls em crítico</span>
          <input type="range" min={0} max={pts.length - 1} step={1} value={sel} onChange={(e) => setPicked(Number(e.target.value))} aria-valuetext={`${p.critRolls} rolls em crítico`} />
          <b>{p.critRolls}</b>
        </label>
        <dl className="ast-opt-info">
          <div><dt>Dano médio da equipe</dt><dd>{formatInt(p.teamAvg)}</dd></div>
          <div><dt>Contra o build atual</dt><dd>{Math.abs(vsCur) < 0.005 ? 'igual' : `${vsCur > 0 ? '+' : ''}${formatDecimal(vsCur, 2)}%`}</dd></div>
          <div><dt>Contra o melhor</dt><dd>{sel === sweep.best ? 'é o melhor' : `${formatDecimal(diff(p.teamAvg, best.teamAvg), 2)}%`}</dd></div>
          <div><dt>Taxa / Dano Crítico</dt><dd>{formatPercent(p.critRate)} / {formatPercent(p.critDmg)}</dd></div>
          <div><dt>Rolls em Taxa / Dano</dt><dd>{p.rolls.CR} / {p.rolls.CD}</dd></div>
          <div><dt>Resto dos rolls</dt><dd>{rest.map((s) => `${LABEL[s]} ${p.rolls[s]}`).join(' · ') || 'nenhum'}</dd></div>
        </dl>
        <p className="legend">
          <span className="k best" /> melhor distribuição ({best.critRolls} rolls em crítico) <span className="k cur" /> build atual ({curCrit})
        </p>
        <button type="button" className="ast-btn sm" disabled={applied} onClick={() => update(index, { forcedCritRolls: p.critRolls })}>
          {applied ? 'Em uso' : `Usar ${p.critRolls} rolls em crítico`}
        </button>{' '}
        <button type="button" className="ast-btn sm" disabled={project.members[index]?.forcedCritRolls === undefined} onClick={() => update(index, { forcedCritRolls: undefined })}>
          Deixar o otimizador escolher
        </button>
      </div>
    </Panel>
  );
}
