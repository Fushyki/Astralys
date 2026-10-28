/** Painel "Golpe selecionado": golpe único (instante, hits, reação, cascata, buffs que cobrem) ou contínuo (execuções). */
import { useEffect, useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Button } from '../../design/Button';
import { FAMILY_COLOR, SPECIAL_LABEL, familyOf } from '../../design/damageFamily';
import { Panel } from '../../design/primitives';
import { defaultContributors, memberProcs, type ActionRef } from '../../engine';
import { pointMoveOf, specialOfMove } from '../../engine/project';
import { specialOfMoveRef } from '../../features/rotation/screenModel';
import { REACTION_LABEL } from '../../features/character/characterModel';
import { chainOf } from '../../features/rotation/projectOps';
import { hitBuffRows, hitFigures } from '../../features/rotation/rotationModel';
import { useRotationStore } from '../../features/rotation/store';
import { formatInt, formatPercent } from '../../ui/format';
import { Num, Sel, Seg, dec } from './ui';

const REACTIONS: ActionRef['reaction'][] = ['none', 'melt', 'vaporize', 'spread', 'aggravate'];
const REACTION_OPTIONS = REACTIONS.map((r) => ({ value: r, label: r === 'none' ? 'Sem reação' : REACTION_LABEL[r] }));
const ELEMENTS = ['', 'Physical', 'Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'] as const;
const ELEMENT_LABEL: Record<(typeof ELEMENTS)[number], string> = { '': 'Padrão', Physical: 'Físico', Pyro: 'Pyro', Hydro: 'Hydro', Anemo: 'Anemo', Electro: 'Electro', Dendro: 'Dendro', Cryo: 'Cryo', Geo: 'Geo' };
const EVERY_N = [1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `1 de ${n}` }));

const TrashX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12 M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
);

export function HitPanel({ v }: { v: ProjectView }) {
  const id = useRotationStore((s) => s.selectedActionId);
  const action = v.project.actions.find((a) => a.id === id);
  const memberIndex = action?.member ?? 0;
  const memberName = v.project.members[memberIndex]?.character ?? '';
  const color = v.colors[memberIndex];
  const badge = action ? <span className="dz-badge" style={{ background: '#2a1f3a', color: '#c9b5f2' }}>{memberName}</span> : undefined;
  return (
    <Panel bar title="Golpe selecionado" badge={badge} className="rt-order1">
      {action ? <HitBody key={action.chainId ?? action.id} v={v} action={action} color={color} /> : <p className="rt-empty">Selecione um golpe na linha do tempo.</p>}
    </Panel>
  );
}

function HitBody({ v, action, color }: { v: ProjectView; action: ActionRef; color: string }) {
  const st = useRotationStore.getState;
  const update = useRotationStore((s) => s.updateAction);
  const project = v.project;
  const result = v.bundle.optimization.result.actions.find((r) => r.action.id === action.id);
  const effect = v.resolved.team.members[action.member]?.characterEffect;
  const procs = memberProcs(v.resolved.team.members[action.member], v.data.game.moves);
  const special = specialOfMoveRef(action.move, specialOfMove(action.move, action.move.variant, effect), procs);
  const name = (action.displayName ?? action.move.label).replace(`${action.move.character} - `, '');
  const chainId = action.chainId;
  const execs = chainId ? chainOf(project, chainId) : [];
  const meta = chainId ? project.chains[chainId] : undefined;
  const [start, setStart] = useState(execs[0]?.time ?? action.time);
  const [every, setEvery] = useState(meta?.every ?? 2);
  const [length, setLength] = useState(meta ? Math.max(0.1, meta.until - (execs[0]?.time ?? action.time)) : 10);
  const [everyN, setEveryN] = useState('2');
  useEffect(() => {
    setStart(execs[0]?.time ?? action.time);
    setEvery(meta?.every ?? 2);
    setLength(meta ? Math.max(0.1, meta.until - (execs[0]?.time ?? action.time)) : 10);
  }, [chainId, meta?.every, meta?.until]); // eslint-disable-line react-hooks/exhaustive-deps

  const buffRows = useMemo(() => (result ? hitBuffRows(project, v.resolved, v.bundle, action.id) : []), [project, v.resolved, v.bundle, action.id, result]);
  /** Liga ou desliga uma faixa de buff só para este golpe (ou para todas as execuções do contínuo). */
  const toggleTag = (tag: string, on: boolean) => {
    const cur = action.tagsOff ?? [];
    const next = on ? cur.filter((t) => t !== tag) : [...cur, tag];
    const patch = { tagsOff: next.length ? next : undefined };
    if (chainId) setAll(patch);
    else update(action.id, patch);
  };
  const total = v.bundle.optimization.result.totals.avg;
  /** Dano médio de cada execução do golpe contínuo e a soma (cada execução é uma ação com o próprio instante, reação e buffs). */
  const execAvg = (id: string) => v.bundle.optimization.result.actions.find((r) => r.action.id === id)?.avg ?? 0;
  const chainTotal = execs.reduce((sum, e) => sum + execAvg(e.id), 0);
  const kindLine = chainId ? 'Dano contínuo' : 'Golpe único';
  const reactionLine = special ? SPECIAL_LABEL[special] : action.reaction === 'none' ? 'sem reação' : REACTION_LABEL[action.reaction];
  const familyColor = familyOf(special) ? FAMILY_COLOR[familyOf(special)!] : undefined;
  const memberLabel = project.members[action.member]?.character ?? '';
  const hitsEach = action.executions;
  const teamReaction = action.move.talent === 'reaction' && /^(lunarcharged|lunarcrystallize|stellarswirl)/.test(action.move.label);
  const who = action.contributors?.length ? action.contributors : defaultContributors(v.resolved.team.members.map((m) => m.character.element), action.move.label, action.member);
  const toggleWho = (i: number) => {
    const next = who.includes(i) ? who.filter((x) => x !== i) : [...who, i];
    if (next.length > 0) update(action.id, { contributors: next });
  };

  /** Mudou início, intervalo ou duração: as execuções são refeitas na hora (a duração estica a rotação). */
  const redo = (patch: { start?: number; every?: number; length?: number }) => {
    if (!chainId) return;
    const s = patch.start ?? start;
    st().rebuildChain(chainId, { start: s, every: patch.every ?? every, until: s + (patch.length ?? length) });
  };

  const setAll = (patch: Partial<ActionRef>) => execs.forEach((e) => update(e.id, patch));
  /** Dano fixo: este golpe (ou todas as execuções do contínuo) consome ou não o buff. */
  const flatOff = action.flatOff ?? [];
  const toggleFlat = (id: string, on: boolean) => {
    const next = on ? flatOff.filter((x) => x !== id) : [...new Set([...flatOff, id])];
    if (chainId) setAll({ flatOff: next.length ? next : undefined });
    else update(action.id, { flatOff: next.length ? next : undefined });
  };
  const point = pointMoveOf(action.move, effect);
  const pointsSection = point ? (
    <Num label={point.unit} value={action.points ?? 0} unit="pts" digits={0} min={0} onCommit={(n) => (chainId ? setAll({ points: Math.min(point.max, Math.max(0, Math.round(n))) }) : update(action.id, { points: Math.min(point.max, Math.max(0, Math.round(n))) }))} />
  ) : null;
  const flatSection = result?.flatUse && result.flatUse.length > 0 ? (
    <div className="rt-flat" role="group" aria-label="Dano fixo">
      <span className="rt-lbl">Dano fixo (buffs flat)</span>
      {result.flatUse.map((u) => (
        <div className="fr" key={u.id} data-off={u.off}>
          <label>
            <input type="checkbox" checked={!u.off} onChange={(e) => toggleFlat(u.id, e.target.checked)} aria-label={`Este golpe consome ${u.name}`} />
            <span className="n">{u.name}<small>de {u.source}</small></span>
            <span className="num v">{u.hits > 0 ? `+${formatInt(u.hits * u.perHit)} · ${u.hits} × ${formatInt(u.perHit)}` : u.off ? 'não consome' : 'sem stacks'}</span>
          </label>
          <div className="qty">
            <Seg label={`Quantos golpes: ${u.name}`} value={u.stacks === undefined ? 'all' : 'n'} options={[{ value: 'all', label: 'Todos os golpes' }, { value: 'n', label: 'N golpes' }]} onChange={(m) => st().setFlatStacks(u.id, m === 'all' ? 'all' : (u.stacks ?? 5))} />
            {u.stacks !== undefined && <Num ariaLabel={`Quantidade de golpes de ${u.name}`} className="sm" value={u.stacks} digits={0} min={1} unit="golpes" onCommit={(n) => st().setFlatStacks(u.id, n)} />}
          </div>
        </div>
      ))}
    </div>
  ) : null;
  const buffsSection = buffRows.length > 0 ? (
    <div className="rt-bufs" role="group" aria-label="Buffs ligados neste golpe">
      <span className="rt-lbl">Buffs neste golpe{chainId ? ' (todas as execuções)' : ''}</span>
      {buffRows.map((b) => (
        <label className="br" key={b.tag} data-off={!b.on}>
          <input type="checkbox" checked={b.on} onChange={(e) => toggleTag(b.tag, e.target.checked)} aria-label={`${b.name} vale neste golpe`} />
          <span className="n">{b.name}<small>{b.value}</small></span>
          <span className="num v">{b.effect > 0.0005 ? `${b.on ? '+' : 'ganharia +'}${dec(b.effect * 100, 1)}%` : ''}</span>
        </label>
      ))}
    </div>
  ) : null;

  return (
    <>
      <div className="rt-title">
        <b style={{ color: familyColor }}>{name}</b>
        <span>{kindLine} · {reactionLine}</span>
      </div>
      <Seg full label="Tipo de golpe" value={chainId ? 'chain' : 'single'} onChange={(m) => (m === 'chain' ? st().makeChain(action.id, { every: 2 }) : chainId && st().dissolveChain(chainId))} options={[{ value: 'single', label: 'Golpe único' }, { value: 'chain', label: 'Contínuo' }]} />

      {chainId ? (
        <>
          <div className="rt-three">
            <Num label="Começa em" value={start} unit="s" onCommit={(n) => { setStart(n); redo({ start: n }); }} min={0} />
            <Num label="A cada" value={every} unit="s" className="gold" onCommit={(n) => { setEvery(n); redo({ every: n }); }} min={0.1} />
            <Num label="Duração" value={length} unit="s" onCommit={(n) => { setLength(n); redo({ length: n }); }} min={0.1} />
          </div>
          {pointsSection}
          <div className="rt-two">
            <Num label="Hits por vez" value={hitsEach} digits={0} onCommit={(n) => setAll({ executions: Math.max(1, Math.round(n)) })} min={1} />
            <Sel label="Reação" value={action.reaction} options={REACTION_OPTIONS} onChange={(r) => setAll({ reaction: r })} />
          </div>
          <div className="rt-exec">
            <div className="eh">
              <span className="rt-lbl">Execuções · {execs.length}</span>
              <span className="num" data-testid="chain-total" title="Soma do dano médio de todas as execuções">{formatInt(chainTotal)} · {formatPercent(total > 0 ? chainTotal / total : 0)} do time</span>
              <span style={{ fontSize: 'var(--fs-1)', color: '#a7b0d6' }}>Reação em</span>
              <span style={{ width: 84 }}>
                <Sel className="sm" ariaLabel="Reação em 1 de N" value={everyN} options={EVERY_N} onChange={(n) => { setEveryN(n); if (chainId) st().reactionEveryN(chainId, Number(n), action.reaction === 'none' ? 'melt' : action.reaction); }} />
              </span>
            </div>
            {execs.map((e) => {
              const on = e.reaction !== 'none';
              return (
                <div className="er" key={e.id}>
                  <span className="mk" style={{ background: on ? color : '#0c1128', borderColor: on ? '#eef1ff' : color }} />
                  <Num ariaLabel={`Instante da execução ${dec(e.time, 1)} s`} className="sm" value={e.time} unit="s" onCommit={(t) => st().moveAction(e.id, t)} min={0} />
                  <Sel className="sm" ariaLabel="Reação desta execução" value={e.reaction} options={REACTION_OPTIONS} onChange={(r) => update(e.id, { reaction: r })} />
                  <span className="num dmg" title="Dano médio desta execução">{formatInt(execAvg(e.id))}</span>
                  <button type="button" className="rt-ico sm" aria-label="Remover esta execução" onClick={() => st().removeAction(e.id)}><TrashX /></button>
                </div>
              );
            })}
            <div className="ef">
              <Button variant="ghost" size="sm" onClick={() => chainId && st().addExecution(chainId)}>+ Execução</Button>
              <Button variant="ghost" size="sm" onClick={() => chainId && st().rebuildChain(chainId, { start, every, until: start + length })}>Refazer pelo intervalo</Button>
            </div>
          </div>
          {flatSection}
          {buffsSection}
          <span className="rt-note">Cada ponto tem tempo e reação próprios. Ex.: Durin derrete 1 a cada 2. Na linha do tempo, o ponto cheio tem reação e o vazado não.</span>
        </>
      ) : (
        <>
          <div className="rt-three">
            <Num label="Instante" value={action.time} unit="s" onCommit={(t) => update(action.id, { time: t })} min={0} />
            <Num label={teamReaction ? 'Procs' : 'Hits'} value={action.executions} digits={0} onCommit={(n) => update(action.id, { executions: Math.max(1, Math.round(n)) })} min={1} />
            <Sel label="Reação" value={action.reaction} options={REACTION_OPTIONS} onChange={(r) => update(action.id, { reaction: r })} />
          </div>
          {teamReaction && (
            <div className="rt-contrib" role="group" aria-label="Quem contribui para a reação">
              <span className="rt-lbl">Quem contribui (aplicou os elementos)</span>
              <div className="chips">
                {project.members.map((m, i) => (
                  <button key={m.character} type="button" aria-pressed={who.includes(i)} style={{ ['--c' as string]: v.colors[i] }} onClick={() => toggleWho(i)}>
                    <i />{m.character}
                  </button>
                ))}
              </div>
              {result?.contributors && (
                <div className="list">
                  {result.contributors.map((c) => (
                    <div className="r" key={c.member}>
                      <span>{project.members[c.member]?.character}</span>
                      <span className="num">{formatInt(c.avg)} × {c.weight === 1 ? '100%' : c.weight === 0.5 ? '1/2' : '1/12'}</span>
                    </div>
                  ))}
                </div>
              )}
              <span className="rt-note">O dano é o maior valor + 1/2 do 2º + 1/12 do 3º + 1/12 do 4º (cada um já com o multiplicador de reação, 0,6 do golpe direto), cada um com a Maestria e o crítico dele. A ação conta para {memberLabel}.</span>
            </div>
          )}
          {pointsSection}
          <Sel label="Elemento do dano" value={(action.element ?? '') as (typeof ELEMENTS)[number]} options={ELEMENTS.map((e) => ({ value: e, label: ELEMENT_LABEL[e] }))} onChange={(e) => update(action.id, { element: e === '' ? undefined : e })} />
          {result && (
            <div className="rt-cascade" aria-label="Números do golpe">
              <div className="rt-figs">
                {hitFigures(result).map((f) => (
                  <div className="fig" key={f.key}>
                    <span className="k">{f.label}</span>
                    <span className="num v">{f.unit === 'int' ? formatInt(f.value) : f.unit === 'pct' ? `${dec(f.value * 100, 1)}%` : `×${dec(f.value, 2)}`}</span>
                  </div>
                ))}
              </div>
              <div className="total">
                <span className="rt-lbl">Dano médio · {formatPercent(total > 0 ? result.avg / total : 0)}</span>
                <span className="num" data-testid="hit-avg">{formatInt(result.avg)}</span>
              </div>
            </div>
          )}
          {flatSection}
          {buffsSection}
        </>
      )}

      <div className="rt-acts">
        <Button variant="secondary" size="sm" onClick={() => st().duplicateAction(action.id)}>Duplicar</Button>
        <button type="button" className="dz-btn sm danger" onClick={() => (chainId ? st().removeChain(chainId) : st().removeAction(action.id))}>Remover golpe</button>
      </div>
    </>
  );
}
