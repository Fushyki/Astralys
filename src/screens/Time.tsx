/** Dano do time (/projeto/:id/time): KPIs, dano acumulado, divisão por personagem, valor dos buffs e ranking de golpes. */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProjectView } from '../app/ProjectContext';
import { CumulativeChart, Donut } from '../design/charts';
import { BarRow, Chip, KpiCard, Panel, StackedBar } from '../design/primitives';
import { mainReaction } from '../features/team/teamModel';
import { buffValues, burstLabel, cumulativeCurve, memberNames, quickRead, topHits } from '../features/time/timeModel';
import { formatDecimal, formatInt, formatPercent } from '../ui/format';
import './time.css';

const pct = (f: number) => formatPercent(f, f < 0.1 ? 2 : 1);

export default function Time() {
  const v = useProjectView();
  const { summary, bundle, colors, resolved } = v;

  const names = useMemo(() => memberNames(resolved), [resolved]);
  const curve = useMemo(() => cumulativeCurve(bundle), [bundle]);
  const hits = useMemo(() => topHits(bundle, 10), [bundle]);
  const values = useMemo(() => buffValues(summary, bundle), [summary, bundle]);
  const reaction = mainReaction(bundle);
  const read = quickRead(summary, values, reaction);

  const points = curve.map((p) => ({ t: p.t, total: p.total, color: colors[p.member] ?? '#e9c46a', label: p.burst ? burstLabel(p, names[p.member] ?? '') : undefined }));
  const topValue = Math.max(...values.map((x) => x.fraction), 0.0001);
  const best = summary.members.reduce((a, b) => (b.fraction > a.fraction ? b : a), summary.members[0]);
  const flagged = values.filter((x) => x.flagged).length;

  return (
    <main className="dz-page">
      <section className="dz-pagehead">
        <div className="titles">
          <span className="lbl">Projeto · {v.project.name}</span>
          <h1 className="h1">Dano do time</h1>
        </div>
        <div className="actions">
          <Link className="dz-btn" to={`/comparar?a=${v.id}`}>Comparar com outro time</Link>
          <Link className="dz-btn gold" to={`/rotacao/${v.id}/card`}>Gerar card</Link>
        </div>
      </section>

      <section className="dz-grid c5" aria-label="Indicadores do time">
        <KpiCard label="DPS do time" value={<span data-testid="team-dps">{formatInt(summary.dps)}</span>} hint="dano médio por segundo" tone="gold" />
        <KpiCard label="Dano da rotação" value={<span data-testid="team-dpr">{formatInt(summary.avg)}</span>} hint="média com crítico" />
        <KpiCard label="Duração" value={`${formatDecimal(summary.duration, 1)} s`} hint={`${summary.actionCount} golpes`} />
        <KpiCard label="Dano sem crítico" value={formatInt(summary.noCrit)} hint={`com crítico: ${formatInt(summary.crit)}`} />
        <KpiCard label="Reação principal" small value={reaction ? reaction.name : 'Sem reação'} hint={reaction ? `${formatPercent(reaction.fraction)} do dano` : 'Nenhum golpe usa reação'} />
      </section>

      <div className="tm-grid">
        <Panel title="Dano acumulado na rotação">
          <CumulativeChart points={points} duration={summary.duration} ariaLabel="Dano acumulado ao longo da rotação, com os Supremos marcados" />
        </Panel>
        <Panel title="Divisão do dano">
          <Donut
            ariaLabel="Divisão do dano por personagem"
            format={pct}
            parts={summary.members.map((m, i) => ({ key: m.name, label: m.name, fraction: m.fraction, color: colors[i], value: formatInt(m.avg) }))}
          />
          {best && <p className="note">{best.name} causa a maior parte: {pct(best.fraction)}.</p>}
        </Panel>
      </div>

      <div className="tm-grid even">
        <Panel title="Quanto vale cada buff" aside={flagged > 0 ? <Chip warn>{flagged} a confirmar</Chip> : undefined}>
          <div className="tm-bars">
            {values.map((b) => (
              <BarRow
                key={b.id}
                label={b.label}
                value={pct(b.fraction)}
                percent={(b.fraction / topValue) * 100}
                color={b.flagged ? 'var(--warn)' : 'var(--gold)'}
                flag={b.flagged ? <Chip warn>a confirmar</Chip> : undefined}
              />
            ))}
          </div>
          <p className="note">Valor = parte do dano que some ao tirar a fonte da rotação.</p>
        </Panel>

        <div className="tm-stack">
          <Panel title="De onde vem o dano">
            <StackedBar parts={summary.sources} format={pct} />
          </Panel>
          <Panel title="Leitura rápida">
            <ul className="tm-read">
              {read.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="Golpes que mais causam dano">
        <table className="dz-table tm-top">
          <thead>
            <tr><th>#</th><th>Golpe</th><th>Quando</th><th>Dano médio</th><th>Do total</th></tr>
          </thead>
          <tbody>
            {hits.map((h) => (
              <tr key={h.actionId}>
                <td className="rk">{h.rank}</td>
                <td>
                  <Link to={`/projeto/${v.id}/rotacao`} className="tm-hit">
                    <i className="dz-dot" style={{ ['--c' as string]: colors[h.member] }} />
                    {names[h.member]} · {h.name}
                  </Link>
                </td>
                <td>{formatDecimal(h.time, 1)} s</td>
                <td className="avg">{formatInt(h.avg)}</td>
                <td>{pct(h.fraction)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </main>
  );
}
