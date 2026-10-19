/** Equipe: visão geral do projeto (KPIs do time e um cartão por personagem). Rota /projeto/:id. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjectView } from '../app/ProjectContext';
import { CharacterPickerDialog } from '../design/CharacterPickerDialog';
import { CharacterAvatar, Chip, KpiCard, StackedBar } from '../design/primitives';
import { MAX_TEAM_SIZE, effectiveTalents } from '../engine';
import { downloadProject } from '../features/rotation/importFile';
import { cloneProject, saveProject } from '../features/rotation/persistence';
import { useRotationStore } from '../features/rotation/store';
import { defaultMember } from '../features/rotation/teamOps';
import { configChips, givenBuffs, keyStats, mainReaction, mainsText, receivedBuffCount, roleOf, setPiecesText } from '../features/team/teamModel';
import { formatDecimal, formatInt, formatPercent } from '../ui/format';
import './equipe.css';

export default function Equipe() {
  const v = useProjectView();
  const navigate = useNavigate();
  const replaceMember = useRotationStore((s) => s.replaceMember);
  const addMember = useRotationStore((s) => s.addMember);
  const removeMember = useRotationStore((s) => s.removeMember);
  const [picker, setPicker] = useState<{ mode: 'replace'; index: number } | { mode: 'add' } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { project, data, bundle, summary, colors } = v;
  const characters = data.game.characters;
  const reaction = mainReaction(bundle);
  const gives = givenBuffs(v.resolved);
  const received = receivedBuffCount(v.resolved);
  const elements = project.members.map((m) => characters.find((c) => c.name === m.character)?.element);
  const chips = configChips(project, elements);
  const names = project.members.map((m) => m.character).join(' · ');
  const actionsOf = (i: number) => project.actions.filter((a) => a.member === i).length;

  const pick = (name: string) => {
    try {
      const ref = defaultMember(name, data.game);
      if (picker?.mode === 'replace') replaceMember(picker.index, ref);
      else addMember(ref);
      setError(null);
      setPicker(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const duplicate = () => {
    const copy = cloneProject(project);
    saveProject(copy);
    navigate(`/projeto/${copy.id}`);
  };

  return (
    <main className="dz-page">
      <section className="dz-pagehead">
        <div className="titles">
          <span className="lbl">Projeto · {project.name}</span>
          <h1 className="h1">{names}</h1>
          <div className="dz-chips">
            {chips.map((c) => (
              <Chip key={c.text} tone={c.accent ? '#f7b48f' : undefined}>{c.text}</Chip>
            ))}
          </div>
        </div>
        <div className="actions">
          <button type="button" className="dz-btn" onClick={duplicate}>Duplicar</button>
          <button type="button" className="dz-btn" onClick={() => downloadProject(project)} title="Baixa o projeto como arquivo do Astralys (.json)">Exportar</button>
          <Link className="dz-btn gold" to={`/projeto/${v.id}/rotacao`}>Editar rotação</Link>
        </div>
      </section>

      <section className="dz-grid c4" aria-label="Indicadores do time">
        <KpiCard label="DPS do time" value={formatInt(summary.dps)} hint="dano médio por segundo" tone="gold" />
        <KpiCard label="Dano da rotação" value={formatInt(summary.avg)} hint={`${summary.actionCount} golpes · média com crítico`} />
        <div className="dz-kpi">
          <span className="lbl">Divisão do dano</span>
          <StackedBar
            parts={summary.members.map((m, i) => ({ key: m.name, label: m.name, fraction: m.fraction, color: colors[i] }))}
            format={(f) => formatPercent(f, f < 0.1 ? 2 : 1)}
          />
        </div>
        <KpiCard
          label="Reação principal"
          small
          value={reaction ? reaction.name : 'Sem reação'}
          hint={reaction ? `${formatPercent(reaction.fraction)} do dano vem da amplificação` : 'Nenhum golpe usa reação'}
        />
      </section>

      {error && <p className="dz-error" role="alert">{error}</p>}

      <section className="dz-grid c4" aria-label="Personagens do time">
        {project.members.map((ref, i) => {
          const character = characters.find((c) => c.name === ref.character);
          const share = summary.members[i]?.fraction ?? 0;
          const role = roleOf(share);
          const talents = effectiveTalents(ref.talents, ref.constellation, character ?? {});
          const stats = bundle.memberStats[i] && v.inSync ? keyStats(bundle, i, role) : [];
          const set = setPiecesText(ref);
          return (
            <article className="eq-card" key={ref.character} style={{ ['--c' as string]: colors[i] }} aria-label={`Personagem ${ref.character}`}>
              <div className="top" />
              <div className="body">
                <button type="button" className="who" onClick={() => setPicker({ mode: 'replace', index: i })} aria-label={`Trocar ${ref.character} por outro personagem`} title="Tocar aqui troca o personagem">
                  <CharacterAvatar name={ref.character} icon={character?.icon} color={colors[i]} size={64} />
                  <div className="meta">
                    <span className="name">{ref.character}</span>
                    <span className="role">{role} · {character?.element}</span>
                    <span className="num sub">Nv {project.config.characterLevel} · C{ref.constellation ?? 0} · talentos {talents.normal}/{talents.skill}/{talents.burst}</span>
                  </div>
                  <span className="swap" aria-hidden="true">⇄</span>
                </button>

                <div className="gear">
                  <div className="line"><span>{ref.weapon}</span><span className="num muted">R{ref.refinement ?? 1}</span></div>
                  <div className="line"><span>{set.name}</span><span className="muted">{set.pieces}</span></div>
                  <span className="muted small">Mains: {mainsText(ref, character?.element)}</span>
                </div>

                <div className="stats">
                  {stats.map((s) => (
                    <div key={s.k}><span className="muted">{s.k}</span><span className="num">{s.v}</span></div>
                  ))}
                </div>

                <div className="dmg">
                  <div className="row"><span className="lbl">Dano na rotação</span><span className="num strong">{formatInt(summary.members[i]?.avg ?? 0)}</span></div>
                  <div className="dz-bar"><i style={{ width: `${Math.max(share * 100, 0.6)}%`, ['--c' as string]: colors[i] }} /></div>
                  <span className="num muted small">{formatPercent(share, share < 0.1 ? 2 : 1)} do time</span>
                </div>

                <div className="gives">
                  <span className="lbl">Buffs que dá ao time</span>
                  <div className="chips">
                    {(gives[i] ?? []).length === 0 && role === 'DPS principal' ? <Chip>Recebe {received[i]} buffs do time</Chip> : null}
                    {(gives[i] ?? []).length === 0 && role !== 'DPS principal' ? <span className="muted small">Nenhum buff com número cadastrado</span> : null}
                    {(gives[i] ?? []).map((g) => <Chip key={g}>{g}</Chip>)}
                  </div>
                </div>

                <div className="acts">
                  <Link className="dz-btn gold" to={`/projeto/${v.id}/personagem/${encodeURIComponent(ref.character)}`}>Ajustar build</Link>
                  <div className="small-acts">
                    <Link className="dz-link" to={`/projeto/${v.id}/otimizador/${encodeURIComponent(ref.character)}`}>Otimizar artefatos</Link>
                    <button type="button" className="dz-link" disabled={project.members.length <= 1} onClick={() => removeMember(i)}>Remover</button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {project.members.length < MAX_TEAM_SIZE && (
          <button type="button" className="eq-add" onClick={() => setPicker({ mode: 'add' })}>
            + Adicionar personagem
          </button>
        )}
      </section>

      <p className="muted small" style={{ margin: 0 }}>
        Rotação de {formatDecimal(project.config.rotationDuration, 1)} s com {summary.actionCount} golpes. Os papéis, os buffs e os stats vêm do cálculo do projeto.
      </p>

      {picker && (
        <CharacterPickerDialog
          title={picker.mode === 'replace' ? `Trocar ${project.members[picker.index].character}` : 'Adicionar personagem'}
          note={
            picker.mode === 'replace' && actionsOf(picker.index) > 0
              ? `Os ${actionsOf(picker.index)} golpes deste personagem saem da rotação, porque o novo personagem tem golpes diferentes. Dá para desfazer (Ctrl+Z).`
              : 'O personagem entra com a melhor arma disponível e substats otimizados; ajuste o build depois.'
          }
          characters={characters}
          exclude={project.members.map((m) => m.character)}
          onPick={pick}
          onClose={() => setPicker(null)}
        />
      )}
    </main>
  );
}
