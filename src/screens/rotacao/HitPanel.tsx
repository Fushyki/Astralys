/** Painel "Golpe selecionado": golpe único (instante, hits, reação, cascata, buffs que cobrem) ou contínuo (execuções). */
import { useEffect, useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Button } from '../../design/Button';
import { FAMILY_COLOR, SPECIAL_LABEL, familyOf } from '../../design/damageFamily';
import { Panel } from '../../design/primitives';
import type { ActionRef } from '../../engine';
import { specialOfMove } from '../../engine/project';
import { REACTION_LABEL } from '../../features/character/characterModel';
import { chainOf } from '../../features/rotation/projectOps';
import { coveringBuffs, hitCascade } from '../../features/rotation/rotationModel';
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
  const special = specialOfMove(action.move, action.move.variant, effect);
  const name = (action.displayName ?? action.move.label).replace(`${action.move.character} - `, '');
  const chainId = action.chainId;
  const execs = chainId ? chainOf(project, chainId) : [];
  const meta = chainId ? project.chains[chainId] : undefined;
  const [start, setStart] = useState(execs[0]?.time ?? action.time);
  const [every, setEvery] = useState(meta?.every ?? 2);
  const [until, setUntil] = useState(meta?.until ?? action.time + 10);
  const [everyN, setEveryN] = useState('2');
  useEffect(() => {
    setStart(execs[0]?.time ?? action.time);
    setEvery(meta?.every ?? 2);
    setUntil(meta?.until ?? action.time + 10);
  }, [chainId, meta?.every, meta?.until]); // eslint-disable-line react-hooks/exhaustive-deps

  const covering = useMemo(() => (chainId || !result ? [] : coveringBuffs(project, v.resolved, v.bundle, action.id)), [project, v.resolved, v.bundle, action.id, chainId, result]);
  const total = v.bundle.optimization.result.totals.avg;
  const kindLine = chainId ? 'Dano contínuo' : 'Golpe único';
  const reactionLine = special ? SPECIAL_LABEL[special] : action.reaction === 'none' ? 'sem reação' : REACTION_LABEL[action.reaction];
  const familyColor = familyOf(special) ? FAMILY_COLOR[familyOf(special)!] : undefined;
  const hitsEach = action.executions;

  const setAll = (patch: Partial<ActionRef>) => execs.forEach((e) => update(e.id, patch));

  return (
    <>
      <div className="rt-title">
        <b style={{ color: familyColor }}>{name}</b>
        <span>{kindLine} · {reactionLine}</span>
      </div>
      <Seg full label="Tipo de golpe" value={chainId ? 'chain' : 'single'} onChange={(m) => (m === 'chain' ? st().makeChain(action.id, { every: 2, until: action.time + 10 }) : chainId && st().dissolveChain(chainId))} options={[{ value: 'single', label: 'Golpe único' }, { value: 'chain', label: 'Contínuo' }]} />

      {chainId ? (
        <>
          <div className="rt-three">
            <Num label="Começa em" value={start} unit="s" onCommit={setStart} min={0} />
            <Num label="A cada" value={every} unit="s" className="gold" onCommit={setEvery} min={0.1} />
            <Num label="Até" value={until} unit="s" onCommit={setUntil} min={0} />
          </div>
          <div className="rt-two">
            <Num label="Hits por vez" value={hitsEach} digits={0} onCommit={(n) => setAll({ executions: Math.max(1, Math.round(n)) })} min={1} />
            <Sel label="Reação" value={action.reaction} options={REACTION_OPTIONS} onChange={(r) => setAll({ reaction: r })} />
          </div>
          <div className="rt-exec">
            <div className="eh">
              <span className="rt-lbl">Execuções · {execs.length}</span>
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
                  <button type="button" className="rt-ico sm" aria-label="Remover esta execução" onClick={() => st().removeAction(e.id)}><TrashX /></button>
                </div>
              );
            })}
            <div className="ef">
              <Button variant="ghost" size="sm" onClick={() => chainId && st().addExecution(chainId)}>+ Execução</Button>
              <Button variant="ghost" size="sm" onClick={() => chainId && st().rebuildChain(chainId, { start, every, until })}>Refazer pelo intervalo</Button>
            </div>
          </div>
          <span className="rt-note">Cada ponto tem tempo e reação próprios. Ex.: Durin derrete 1 a cada 2. Na linha do tempo, o ponto cheio tem reação e o vazado não.</span>
        </>
      ) : (
        <>
          <div className="rt-three">
            <Num label="Instante" value={action.time} unit="s" onCommit={(t) => update(action.id, { time: t })} min={0} />
            <Num label="Hits" value={action.executions} digits={0} onCommit={(n) => update(action.id, { executions: Math.max(1, Math.round(n)) })} min={1} />
            <Sel label="Reação" value={action.reaction} options={REACTION_OPTIONS} onChange={(r) => update(action.id, { reaction: r })} />
          </div>
          <Sel label="Elemento do dano" value={(action.element ?? '') as (typeof ELEMENTS)[number]} options={ELEMENTS.map((e) => ({ value: e, label: ELEMENT_LABEL[e] }))} onChange={(e) => update(action.id, { element: e === '' ? undefined : e })} />
          {result && (
            <div className="rt-cascade" aria-label="Cascata de multiplicadores">
              {hitCascade(result).map((s) => (
                <div className="step" key={s.key}>
                  <span className="k">{s.label}</span>
                  <span className="num m">{s.factor === null ? '' : `×${dec(s.factor, 3)}`}</span>
                  <span className="num v">{formatInt(s.value)}</span>
                </div>
              ))}
              <div className="total">
                <span className="rt-lbl">Dano médio · {formatPercent(total > 0 ? result.avg / total : 0)}</span>
                <span className="num" data-testid="hit-avg">{formatInt(result.avg)}</span>
              </div>
            </div>
          )}
          {covering.length > 0 && (
            <div className="rt-cov" aria-label="Buffs que cobrem este golpe">
              {covering.slice(0, 8).map((c) => <span className="chip" key={c.id}>{c.name}<b>+{dec(c.loss * 100, 1)}%</b></span>)}
            </div>
          )}
        </>
      )}

      <div className="rt-acts">
        <Button variant="secondary" size="sm" onClick={() => st().duplicateAction(action.id)}>Duplicar</Button>
        <button type="button" className="dz-btn sm danger" onClick={() => (chainId ? st().removeChain(chainId) : st().removeAction(action.id))}>Remover golpe</button>
      </div>
    </>
  );
}
