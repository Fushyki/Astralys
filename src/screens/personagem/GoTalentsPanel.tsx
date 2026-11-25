/**
 * Aba Talentos calculada pelas fichas do Genshin Optimizer: golpes, curas, bônus, durações e condições ligáveis (desligadas por padrão),
 * mais os buffs que os colegas dão. As condições com buff curado (`condition`) ligam a rotação e ficam no projeto; as outras
 * valem só nesta aba.
 */
import { useEffect, useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { damageColor } from '../../design/damageFamily';
import { elementColor } from '../../design/elements';
import { Segmented, StarIcon } from '../../design/primitives';
import { effectiveTalents, type MemberRef } from '../../engine';
import { useDamageView } from '../../features/character/damageView';
import { useTalents } from '../../features/character/talents';
import { useRotationStore } from '../../features/rotation/store';
import { goKey, goRequest, rotationConditions, type GoConditionals, type RotationCondition } from '../../features/talentos/goRequest';
import { formatDecimal, formatInt } from '../../ui/format';
import type { GoBlock, GoRow, GoTalents } from '../../vendor/go/talentos';
import { Icon, OneLine, Stepper } from './TalentsPanel';
import '../talentos.css';

type Go = typeof import('../../vendor/go/talentos');
type Crit = 'noCrit' | 'avg' | 'crit';
const CRIT_OPTIONS: { value: Crit; label: string }[] = [{ value: 'noCrit', label: 'Não crítico' }, { value: 'avg', label: 'Médio' }, { value: 'crit', label: 'Crítico' }];
const HIT_MODE = { noCrit: 'hit', avg: 'avgHit', crit: 'critHit' } as const;
const TALENT_TYPE = { normal: 'Ataque normal', skill: 'Habilidade elemental', burst: 'Supremo' } as const;
const storageKey = (id: string) => `astralys.goCond.${id}`;

function readConditionals(id: string): GoConditionals {
  try { return JSON.parse(localStorage.getItem(storageKey(id)) ?? '{}') as GoConditionals; } catch { return {}; }
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function tone(element: string) {
  if (!element || element === 'invalid' || element === 'heal') return undefined;
  const special = /^(lunar|stellar)/.test(element) ? element : undefined;
  return damageColor(special ? undefined : capital(element), special);
}
function show(r: GoRow) {
  if (typeof r.value === 'string') return r.value;
  if (r.unit === '%') return `${formatDecimal(r.value, 1)}%`;
  const n = Math.abs(r.value) < 20 && !Number.isInteger(r.value) ? formatDecimal(r.value, 1) : formatInt(r.value);
  return r.unit ? `${n} ${r.unit}` : n;
}

function Rows({ rows }: { rows: GoRow[] }) {
  return <>{rows.map((r, i) => (
    <div className="r" key={`${r.label}${i}`}><span className="k" style={{ color: tone(r.element) }}>{r.label}{r.team && <> <span className="dz-badge">time</span></>}</span><span className="v num">{show(r)}</span></div>
  ))}</>;
}

type Linked = Record<string, Record<string, RotationCondition>>;

/** Condições cujo efeito a rotação traz por outro caminho. */
const ROTATION_HINT: Record<string, string> = { 'Zibai.c4Splendor': 'Na rotação, adicione o golpe extra “Zibai C4: Scattermoon Splendor”.' };

/** O que a condição faz na rotação, dito no próprio cartão. */
function rotationNote(key: string, c: RotationCondition | undefined, on: boolean) {
  if (!c) return ROTATION_HINT[key] ?? 'Vale só nesta aba; não muda a rotação.';
  if (on && c.needsWindow) return 'Muda a rotação, mas a parte com duração só vale com a janela marcada em Rotação e buffs.';
  return 'Muda a rotação.';
}

function Blocks({ blocks, linked, onSet }: { blocks: GoBlock[]; linked: Linked; onSet: (owner: string, id: string, value: string) => void }) {
  return <>{blocks.map((b, i) => {
    if (b.kind === 'text') return null;
    if (b.kind === 'rows') {
      const before = blocks[i - 1];
      return <div className="grp" key={i}>{before?.kind === 'text' && <div className="gh">{before.text}</div>}<Rows rows={b.rows} /></div>;
    }
    const single = b.options.length === 1;
    return (
      <div className="tl-cond go" data-active={!!b.value} data-locked={false} key={`${b.owner}.${b.id}.${i}`}>
        <label>
          {single && <input type="checkbox" checked={!!b.value} onChange={(e) => onSet(b.owner, b.id, e.target.checked ? b.options[0].value : '')} aria-label={b.title} />}
          <span className="txt">{b.title}{b.team && <> <span className="dz-badge">time</span></>}</span>
          {!single && (
            <select value={b.value} onChange={(e) => onSet(b.owner, b.id, e.target.value)} aria-label={b.title}>
              <option value="">Desligado</option>
              {b.options.map((o) => <option key={o.value} value={o.value}>{o.label === 'Ligado' ? o.value : o.label}</option>)}
            </select>
          )}
        </label>
        {b.rows.length > 0 && <div className="rows"><Rows rows={b.rows} /></div>}
        <span className="note">{rotationNote(`${b.owner}.${b.id}`, linked[b.owner]?.[b.id], !!b.value)}</span>
      </div>
    );
  })}</>;
}

export function GoTalentsPanel({ v, index }: { v: ProjectView; index: number }) {
  const { data: all } = useTalents();
  const updateMember = useRotationStore((s) => s.updateMember);
  const ref: MemberRef = v.project.members[index];
  const character = v.resolved.team.members[index].character;
  const constellation = ref.constellation ?? 0;
  const eff = effectiveTalents(ref.talents, ref.constellation, character);
  const { crit, setCrit } = useDamageView(v.id, ref.character);
  const [go, setGo] = useState<Go | null>(null);
  const [failed, setFailed] = useState(false);
  const [local, setLocal] = useState<GoConditionals>(() => readConditionals(v.id));
  const setCondition = useRotationStore((s) => s.setCondition);
  const linked = useMemo(() => rotationConditions(v.project, v.resolved, v.data.effects.characters), [v.project, v.resolved, v.data]);
  // O estado das condições ligadas à rotação vem do projeto e passa por cima do que está só no navegador.
  const conds = useMemo<GoConditionals>(() => {
    const out: GoConditionals = { ...local };
    for (const [owner, map] of Object.entries(linked)) out[owner] = { ...local[owner], ...Object.fromEntries(Object.entries(map).map(([id, c]) => [id, c.value])) };
    return out;
  }, [local, linked]);

  useEffect(() => { import('../../vendor/go/talentos').then(setGo, () => setFailed(true)); }, []);

  const result = useMemo<GoTalents | null>(() => {
    // `inSync`: os rolls do resultado são deste mesmo time.
    if (!go || !v.inSync) return null;
    return go.computeTalents(goRequest(v.project, v.resolved, v.bundle.optimization.rolls, index, HIT_MODE[crit], conds));
  }, [go, v.inSync, v.project, v.resolved, v.bundle, index, crit, conds]);

  const onSet = (owner: string, id: string, value: string) => {
    const c = linked[owner]?.[id];
    if (c) {
      setCondition(c.ids, !!value, v.resolved.gearIds, value && c.stackKey ? { member: c.member, key: c.stackKey, n: Number(value) } : undefined);
      return;
    }
    const mine = { ...local[owner], [id]: value };
    if (!value) delete mine[id];
    const next = { ...local, [owner]: mine };
    setLocal(next);
    localStorage.setItem(storageKey(v.id), JSON.stringify(next));
  };
  const tl = all?.find((t) => t.character === ref.character);
  if (failed) return <p className="note" role="alert">Não foi possível carregar a ficha do personagem. Recarregue a página.</p>;
  if (!tl || !result) return <p className="note" role="status">Calculando os talentos…</p>;

  const blocksOf = (key: string) => result.cards.find((c) => c.key === key)?.blocks ?? [];
  const setTalent = (k: 'normal' | 'skill' | 'burst', d: number) => updateMember(index, { talents: { ...ref.talents, [k]: Math.max(1, Math.min(15, ref.talents[k] + d)) } });
  const setCons = (n: number) => updateMember(index, { constellation: Math.max(0, Math.min(6, n)) || undefined });
  const color = elementColor(character.element);

  return (
    <div className="tl" style={{ ['--e' as string]: color }}>
      <div className="tl-bar">
        <span className="note">Calculado com a ficha do Genshin Optimizer. Cada condição diz se muda a rotação; em times novos elas começam desligadas.</span>
        <span className="grow" />
        <Segmented label="Crítico" value={crit} options={CRIT_OPTIONS} onChange={setCrit} />
      </div>
      <section className="tl-grid">
        <aside className="tl-card cons" aria-label="Constelação">
          <header className="bar">
            <StarIcon />
            <h2 className="h2">Constelação</h2>
            <Stepper label="Constelação" value={constellation} text={`C${constellation}`} onDec={() => setCons(constellation - 1)} onInc={() => setCons(constellation + 1)} decOff={constellation <= 0} incOff={constellation >= 6} />
          </header>
          <div className="list">
            {tl.constellations.map((c) => {
              const lit = c.n <= constellation;
              return (
                <div className="cst" key={c.n} data-lit={lit}>
                  <button type="button" className="head" aria-label={`Acender até a constelação ${c.n}`} onClick={() => setCons(c.n === constellation ? c.n - 1 : c.n)}>
                    <span className="ring num">C{c.n}</span>
                    <span className="t"><b>{c.name}</b></span>
                  </button>
                  <OneLine title={`C${c.n} · ${c.name}`} text={c.description} limit={230} />
                  {lit && <div className="body"><Blocks blocks={blocksOf(`constellation${c.n}`)} linked={linked} onSet={onSet} /></div>}
                </div>
              );
            })}
          </div>
        </aside>

        {tl.skills.map((t) => (
          <article className="tl-card" key={t.talent} aria-label={t.name}>
            <header>
              <span className="ico"><Icon name={t.icon} color={color} /></span>
              <span className="who"><b>{t.name}</b><span className="dz-badge">{TALENT_TYPE[t.talent]}</span></span>
              <Stepper label={`Nível de ${TALENT_TYPE[t.talent]}`} value={ref.talents[t.talent]} text={`Nv ${eff[t.talent]}`} onDec={() => setTalent(t.talent, -1)} onInc={() => setTalent(t.talent, 1)} decOff={ref.talents[t.talent] <= 1} incOff={ref.talents[t.talent] >= 15} />
            </header>
            <OneLine title={t.name} text={t.description} />
            <div className="body"><Blocks blocks={blocksOf(t.talent === 'normal' ? 'auto' : t.talent)} linked={linked} onSet={onSet} /></div>
          </article>
        ))}

        {tl.passives.slice(0, 3).map((p, i) => (
          <article className="tl-card" key={p.id} aria-label={p.name}>
            <header>
              <span className="ico"><Icon name={p.icon} /></span>
              <span className="who"><b>{p.name}</b><span className="dz-badge">{i === 0 ? 'Ascensão 1' : i === 1 ? 'Ascensão 4' : 'Talento passivo'}</span></span>
            </header>
            <OneLine title={p.name} text={p.description} />
            <div className="body"><Blocks blocks={blocksOf(`passive${i + 1}`)} linked={linked} onSet={onSet} /></div>
          </article>
        ))}

        {result.fromTeam.map((mate) => {
          const name = v.resolved.team.members.find((m) => goKey(m.character.name) === mate.key)?.character.name ?? mate.key;
          return (
            <article className="tl-card" key={mate.key} aria-label={`Buffs de ${name}`}>
              <header><span className="who"><b>Buffs de {name}</b><span className="dz-badge">time</span></span></header>
              <div className="body"><Blocks blocks={mate.blocks} linked={linked} onSet={onSet} /></div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
