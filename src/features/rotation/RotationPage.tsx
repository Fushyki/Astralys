/**
 * Página do editor de rotação (/rotacao/:id). Esta primeira parte carrega o projeto, calcula tudo no worker e
 * mostra os indicadores, os painéis de leitura e a lista de ações. A linha do tempo vem na parte seguinte.
 */
import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../../ui/ast.css';
import { BarRow, Hint, Kpi, Panel, StackedBar } from '../../ui/components';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';
import { useGameData } from './data';
import { SAMPLE_ID, loadProject, saveProject } from './persistence';
import { useRotationStore } from './store';
import { summarize, type Summary } from './summary';
import { useAnalysis } from './useAnalysis';
import type { ActionResult } from '../../engine';

const REACTION_LABEL: Record<string, string> = { none: '—', melt: 'Derreter', vaporize: 'Vaporizar', spread: 'Espalhar', aggravate: 'Intensificar' };
const SAVE_DELAY_MS = 400;

function Moon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path d="M15.5 3.2a8.4 8.4 0 1 0 3.3 14.5 7.1 7.1 0 0 1-3.3-14.5z" fill="#d8b668" />
      <circle cx="17.2" cy="5.6" r="1.1" fill="#efe3c2" />
    </svg>
  );
}

function StateCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ast-app">
      <div className="ast-state">
        <h1 className="ast-caps">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Kpis({ s }: { s: Summary }) {
  return (
    <div className="ast-kpis">
      <Kpi label="DPS da rotação" value={formatInt(s.dps)} unit="dano por segundo" description={`Dano médio da rotação dividido pelos ${formatDecimal(s.duration)} s que ela dura.`} />
      <Kpi label="Dano médio da rotação" value={formatInt(s.avg)} unit="dano total esperado" description={`Soma dos ${s.actionCount} golpes, contando o crítico pela sua taxa (CR × CD).`} />
      <Kpi label="Sem nenhum crítico" value={formatInt(s.noCrit)} unit="dano mínimo" description="O mesmo combo se nenhum golpe causasse crítico." />
      <Kpi label="Todos críticos" value={formatInt(s.crit)} unit="dano máximo" description="O mesmo combo se todos os golpes causassem crítico." />
      {s.strongest && (
        <Kpi
          label="Golpe mais forte"
          value={formatPercent(s.strongest.fraction)}
          unit={s.strongest.name}
          description={`${formatInt(s.strongest.avg)} de dano médio${s.strongest.time !== undefined ? `, aos ${formatDecimal(s.strongest.time)} s` : ''}.`}
        />
      )}
    </div>
  );
}

function Panels({ s }: { s: Summary }) {
  return (
    <div className="ast-panels">
      <Panel title="Dano por fonte">
        <Hint>De onde vem o dano. A parte das reações é o ganho da amplificação sobre o golpe.</Hint>
        <StackedBar parts={s.sources} format={(f) => formatPercent(f)} />
      </Panel>
      <Panel title="Dano vindo de reações">
        <Hint>Quanto do dano existe por causa de cada família de reação ({formatPercent(s.reactionShare)} no total).</Hint>
        {s.reactions.map((r) => (
          <BarRow key={r.label} label={r.label} value={formatPercent(r.fraction)} percent={r.fraction * 100} />
        ))}
      </Panel>
      <Panel title="Dano por personagem">
        <Hint>Parte do dano médio total da rotação que cada personagem causa.</Hint>
        {s.members.map((m) => (
          <BarRow key={m.name} label={m.name} value={formatPercent(m.fraction, 2)} percent={Math.max(m.fraction * 100, 1.4)} color={m.color} />
        ))}
      </Panel>
      <Panel title="De onde vem o dano" wide>
        <Hint>Quanto do dano some se você desligar cada fonte. As fontes se multiplicam, então os valores não somam 100%.</Hint>
        {s.why.map((w) => (
          <BarRow key={w.id} label={w.label} value={formatPercent(w.fraction)} percent={(w.fraction / (s.why[0]?.fraction || 1)) * 100} flag={w.flag} />
        ))}
      </Panel>
    </div>
  );
}

function ActionsTable({ actions, total }: { actions: ActionResult[]; total: number }) {
  const selected = useRotationStore((st) => st.selectedActionId);
  const select = useRotationStore((st) => st.select);
  return (
    <div className="ast-scroll">
      <table className="ast-table">
        <caption className="sr-only" style={{ position: 'absolute', left: -9999 }}>Ações da rotação em ordem de tempo</caption>
        <thead>
          <tr>
            <th scope="col">Tempo</th>
            <th scope="col">Personagem</th>
            <th scope="col">Golpe</th>
            <th scope="col">Reação</th>
            <th scope="col">Dano médio</th>
            <th scope="col">% do total</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((r) => {
            const a = r.action;
            const isSel = selected === a.id;
            return (
              <tr
                key={a.id}
                tabIndex={0}
                data-selected={isSel}
                aria-current={isSel ? 'true' : undefined}
                onClick={() => select(isSel ? null : a.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(isSel ? null : a.id);
                  }
                }}
              >
                <td>{formatDecimal(a.time ?? 0)} s</td>
                <td>{a.move.character}</td>
                <td>
                  {a.move.displayName.replace(`${a.move.character} - `, '')}
                  {a.executions > 1 ? <span className="tag"> ×{a.executions}</span> : null}
                </td>
                <td className={a.reaction === 'melt' || a.reaction === 'vaporize' ? 'melt' : 'tag'}>{REACTION_LABEL[a.reaction] ?? a.reaction}</td>
                <td>{formatInt(r.avg)}</td>
                <td>{formatPercent(total > 0 ? r.avg / total : 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function RotationPage() {
  const { id = SAMPLE_ID } = useParams();
  const { data, error: dataError } = useGameData();
  const project = useRotationStore((s) => s.project);
  const dirty = useRotationStore((s) => s.dirty);
  const open = useRotationStore((s) => s.open);
  const markSaved = useRotationStore((s) => s.markSaved);

  // Abre o projeto da rota (salvo localmente ou o exemplo).
  useEffect(() => {
    const p = loadProject(id);
    if (p) open(p);
  }, [id, open]);

  // Salva sozinho, pouco depois da última alteração.
  useEffect(() => {
    if (!project || !dirty) return;
    const t = setTimeout(() => {
      saveProject(project);
      markSaved();
    }, SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [project, dirty, markSaved]);

  const exists = useMemo(() => loadProject(id) !== null, [id]);
  const current = project && project.id === id ? project : null;
  const analysis = useAnalysis(current, data);

  useEffect(() => {
    if (current) document.title = `${current.name} · Astralys`;
  }, [current]);

  if (!exists && !current) {
    return (
      <StateCard title="Projeto não encontrado">
        <p>Não existe um projeto salvo com o id “{id}” neste navegador.</p>
        <Link className="ast-btn" to={`/rotacao/${SAMPLE_ID}`}>Abrir o exemplo</Link>
      </StateCard>
    );
  }
  if (dataError) {
    return (
      <StateCard title="Não foi possível carregar os dados do jogo">
        <p>Recarregue a página. Se o problema continuar, o arquivo de dados pode estar indisponível.</p>
      </StateCard>
    );
  }
  if (analysis.status === 'error') {
    return (
      <StateCard title="Não foi possível calcular a rotação">
        <p>{analysis.message}</p>
        <Link className="ast-btn" to={`/rotacao/${SAMPLE_ID}`}>Abrir o exemplo</Link>
      </StateCard>
    );
  }
  if (!current || analysis.status !== 'ready') {
    return (
      <StateCard title="Calculando a rotação">
        <p>Carregando os dados do jogo e otimizando os substats da equipe.</p>
      </StateCard>
    );
  }

  const summary = summarize(analysis.bundle, analysis.resolved);
  return (
    <div className="ast-app">
      <div className={`ast-shell${analysis.stale ? ' ast-busy' : ''}`}>
        <header className="ast-title">
          <Moon />
          <h1 className="ast-caps">{current.name}</h1>
          <span className="ast-sub">
            Rotação de {formatDecimal(summary.duration)} s · inimigo nível {current.config.enemyLevel}
          </span>
          <Link className="ast-btn" to="/">Voltar ao site</Link>
        </header>
        <div className="ast-members" aria-label="Equipe">
          {summary.members.map((m) => (
            <span className="ast-chip" key={m.name} style={{ ['--c' as string]: m.color }}>
              <i />
              {m.name}
            </span>
          ))}
        </div>
        <Kpis s={summary} />
        <Panels s={summary} />
        <h2 className="ast-sec ast-caps">Ações da rotação</h2>
        <ActionsTable actions={analysis.bundle.optimization.result.actions} total={summary.avg} />
      </div>
    </div>
  );
}
