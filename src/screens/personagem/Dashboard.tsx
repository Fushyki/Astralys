/**
 * "Resumo" do personagem num painel só (estilo calculadora): equipamento em uma linha, controles de crítico e reação,
 * atributos, golpes por tipo, reações, buffs do time e o panorama da build (stats fora e em campo).
 */
import { useDamageView } from '../../features/character/damageView';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ProjectView } from '../../app/ProjectContext';
import { Segmented } from '../../design/primitives';
import { elementColor } from '../../design/elements';
import { DamageLegend, FamilyBadge, damageColor } from '../../design/damageFamily';
import { assembleTeam, type MemberRef } from '../../engine';
import { overviewRows, sheetStats } from '../../features/character/buildOverview';
import { useRotationStore } from '../../features/rotation/store';
import {
  REACTION_LABEL,
  characterReactions,
  memberBuffCards,
  reactionOptions,
  type MoveLine,
} from '../../features/character/characterModel';
import { formatDecimal, formatHits, formatInt, formatPercent } from '../../ui/format';
import { BuildStrip } from './BuildStrip';
import { useDamageGroups } from './MainColumn';
import type { ReactionChoice } from '../../engine';
import { Button, ButtonLink } from '../../design/Button';

type Crit = 'noCrit' | 'avg' | 'crit';
const CRIT_OPTIONS: { value: Crit; label: string }[] = [
  { value: 'noCrit', label: 'Não crítico' },
  { value: 'avg', label: 'Médio' },
  { value: 'crit', label: 'Crítico' },
];

// ---------- ícones dos atributos (linhas finas, herdam a cor) ----------

const ICONS: Record<string, ReactNode> = {
  hp: <path d="M8 2c3 3.6 5 6 5 8.4A5 5 0 0 1 3 10.4C3 8 5 5.600 8 2Z" />,
  atk: <path d="M3 13 13 3M9 3h4v4M3 13l-1 1M5 9l2 2" />,
  def: <path d="M8 2 13 4v4.500c0 2.800-2 5-5 6-3-1-5-3.200-5-6V4l5-2Z" />,
  em: <><circle cx="8" cy="8" r="1.600" /><ellipse cx="8" cy="8" rx="6" ry="2.400" /><ellipse cx="8" cy="8" rx="6" ry="2.400" transform="rotate(60 8 8)" /><ellipse cx="8" cy="8" rx="6" ry="2.400" transform="rotate(120 8 8)" /></>,
  er: <path d="M13 8a5 5 0 1 1-1.500-3.500M13 2.500v3h-3" />,
  cr: <><circle cx="8" cy="8" r="2" /><path d="M8 1.500v3M8 11.500v3M1.500 8h3M11.500 8h3" /></>,
  cd: <path d="M8 1.500 9.600 6.400 14.500 8 9.600 9.600 8 14.500 6.400 9.600 1.500 8 6.400 6.400Z" />,
  cv: <path d="M8 2l1.800 3.800 4.200.6-3 3 .7 4.200L8 11.600 4.300 13.600l.7-4.200-3-3 4.200-.6L8 2Z" />,
  ele: <path d="M8 1.500c.8 2.500 3.500 4 3.500 7a3.500 3.500 0 0 1-7 0c0-1.200.5-2 1.200-2.800.2 1 .8 1.600 1.400 1.800C6.500 5.500 7.200 3.500 8 1.500Z" />,
  plus: <path d="M8 3v10M3 8h10" />,
};
function Ico({ k }: { k: string }) {
  return (
    <svg className="ico" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.300" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[k]}
    </svg>
  );
}

function Panel({ title, badge, tone, children, className }: { title: string; badge?: string; tone?: 'gold' | 'good' | 'cool'; children: ReactNode; className?: string }) {
  return (
    <section className={`db-panel${className ? ` ${className}` : ''}`}>
      <header>
        <span className="spark" aria-hidden="true">✦</span>
        <h3>{title}</h3>
        {badge && <span className="badge num" data-tone={tone ?? 'cool'}>{badge}</span>}
      </header>
      {children}
    </section>
  );
}

// ---------- golpes por tipo ----------

function MovePanel({ title, badge, tone, lines, crit }: { title: string; badge: string; tone?: 'gold' | 'good' | 'cool'; lines: MoveLine[]; crit: Crit }) {
  return (
    <Panel title={title} badge={badge} tone={tone}>
      <ul className="db-rows">
        {lines.map((l) => (
          <li key={l.id}>
            <span className="k" style={{ color: damageColor(l.element, l.special) }} title={l.special ? undefined : `Dano ${l.element === 'Physical' ? 'Físico' : l.element}`}>
              {l.name} <FamilyBadge special={l.special} />
            </span>
            <b className="num">{formatHits(l[crit], l.result.hitShare)}</b>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ---------- panorama da build ----------

function BuildOverview({ v, index, element }: { v: ProjectView; index: number; element: string }) {
  const useAuto = useRotationStore((s) => s.useAutoRolls);
  const ref = v.project.members[index];
  const member = v.resolved.team.members[index];
  const rolls = v.bundle.optimization.rolls[index];
  const assembly = useMemo(() => assembleTeam(v.resolved.team), [v.resolved.team]);
  const field = v.bundle.memberStats[index];
  if (!rolls || !field || !assembly.sources[index]) return <Panel title="Panorama da build"><p className="muted small">Calculando…</p></Panel>;
  const rows = overviewRows(sheetStats(member, assembly, index, rolls), field, element);
  const badge = ref.pieces ? `${ref.pieces.length}/5 peças` : ref.manualRolls ? 'Substats à mão' : 'Substats otimizados';
  const warnings = v.bundle.rollWarnings.filter((w) => w.member === index);
  return (
    <Panel title="Panorama da build" badge={badge} className="db-over">
      <table>
        <thead>
          <tr><th scope="col">Status</th><th scope="col" title="Personagem sem buffs, como na tela dele no jogo: sem passivas, set de 4 peças nem time">Fora de campo</th><th scope="col" title="Com todos os buffs ativos (arma, set, passivas e time)">Em campo</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} data-stat={r.key}>
              <th scope="row">{r.label}</th>
              <td className="num">{r.out}</td>
              <td className="num" data-up={r.changed || undefined}>{r.in}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">Fora de campo: sem buffs. Em campo: com todos os buffs ativos. Para editar os substats, use a aba Otimizar (alvo Manual).</p>
      {!ref.pieces && ref.manualRolls && <Button variant="secondary" size="sm" onClick={() => useAuto(index)}>Usar substats otimizados</Button>}
      {warnings.map((w) => <p className="dz-error" role="alert" key={w.message}>{w.message}</p>)}
    </Panel>
  );
}


// ---------- buffs do time somados por atributo ----------

interface AggRow { key: string; label: string; pct: boolean; total: number; sources: string[]; flagged: boolean }

/** Número de um chip ("+49%", "+1.202", "−20%", "+0,5%"): vírgula decimal nas porcentagens e ponto de milhar nos inteiros. */
function chipNumber(raw: string, pct: boolean): number {
  const t = raw.replace('−', '-').replace('%', '').replace(/\s/g, '');
  return Number(pct ? t.replace(',', '.') : t.replace(/\./g, '').replace(',', '.'));
}

/** Soma os chips de todos os buffs ativos por atributo (ATK%, ATK fixo, DMG%…), guardando de onde vem cada parte. */
export function aggregateBuffs(cards: { name: string; chips: string[]; needsConfirmation: boolean; tag: string; giverName: string }[]): AggRow[] {
  const rows = new Map<string, AggRow>();
  for (const c of cards) {
    for (const chip of c.chips) {
      const first = /^([+\-−][\d.,]+%?)\s+(.+)$/.exec(chip);
      const second = /^(.+?)\s+([+\-−][\d.,]+%?)$/.exec(chip);
      const m = first ?? second;
      if (!m) continue;
      const value = first ? first[1] : second![2];
      const label = (first ? first[2] : second![1]).trim();
      const pct = value.includes('%');
      const key = `${label}|${pct}`;
      const row = rows.get(key) ?? { key, label: pct && !/%$/.test(label) && /^(ATK|HP|DEF)$/.test(label) ? `${label}%` : label, pct, total: 0, sources: [], flagged: false };
      row.total += chipNumber(value, pct);
      const src = c.needsConfirmation ? 'sem origem' : c.name.replace(/\s*\(.*?\)\s*/g, ' ').replace(/:.*$/, '').trim() || c.giverName;
      if (!row.sources.includes(src)) row.sources.push(src);
      row.flagged ||= c.needsConfirmation;
      rows.set(key, row);
    }
  }
  return [...rows.values()];
}

// ---------- o painel ----------

export function Dashboard({ v, index }: { v: ProjectView; index: number }) {
  const ref: MemberRef = v.project.members[index];
  const member = v.resolved.team.members[index];
  const character = v.data.game.characters.find((c) => c.name === ref.character)!;
  const weapon = v.data.game.weapons.find((w) => w.name === ref.weapon);
  const s = v.bundle.memberStats[index];
  const teamElements = v.resolved.team.members.map((m) => m.character.element);
  const options = reactionOptions(character.element, teamElements);
  const { crit, setCrit, reaction, setReaction } = useDamageView(v.id, ref.character);
  const active = options.includes(reaction) ? reaction : 'none';
  const [editBuild, setEditBuild] = useState(false);
  const groups = useDamageGroups(v, index, active);
  const team = v.resolved.team;
  const assembly = useMemo(() => assembleTeam(team), [team]);
  const reactions = characterReactions({
    element: character.element,
    teamElements,
    em: s.em,
    characterLevel: member.level ?? team.config.characterLevel,
    enemy: { level: team.config.enemyLevel, res: assembly.enemyRes, defRed: assembly.enemyDefRed, defIgnore: team.config.enemyDefIgnore },
    ampCoefficient: v.resolved.ampCoefficient,
    reactionBonus: s.reactionBonus,
  });
  const ampOf = (id: string) => reactions.find((r) => r.id === id && r.value.type === 'mult')?.value.amount;
  const buffs = useMemo(() => memberBuffCards(v.project, v.resolved, v.bundle, index).filter((b) => b.active), [v.project, v.resolved, v.bundle, index]);
  const summed = useMemo(() => aggregateBuffs(buffs), [buffs]);
  const talents = member.talents;
  const pct = (f: number) => formatPercent(f, 1);
  const ec = elementColor(character.element);

  const normal = groups.find((g) => g.talent === 'normal');
  const skill = groups.find((g) => g.talent === 'skill');
  const burst = groups.find((g) => g.talent === 'burst');
  const byHit = (hit: string) => normal?.lines.filter((l) => l.hitType === hit) ?? [];
  const basePieces = {
    atk: character.baseAtk + (weapon?.baseAtk ?? 0), hp: character.baseHp, def: character.baseDef,
  };

  const attrs: { ico: string; k: string; v: string; tone?: string; sub?: string }[] = [
    { ico: 'hp', k: 'HP', v: formatInt(s.hp) },
    { ico: 'atk', k: 'ATK', v: formatInt(s.atk) },
    { ico: 'def', k: 'DEF', v: formatInt(s.def) },
    { ico: 'em', k: 'Proficiência Elemental', v: formatInt(s.em) },
    { ico: 'er', k: 'Recarga de Energia', v: pct(s.er) },
    { ico: 'cr', k: 'Taxa crítica', v: pct(s.critRate) },
    { ico: 'cd', k: 'Dano crítico', v: pct(s.critDmg) },
    { ico: 'cv', k: 'Crit Value', v: formatDecimal(2 * s.critRate * 100 + s.critDmg * 100, 1) },
    { ico: 'ele', k: `Bônus de dano ${character.element}`, v: pct(s.dmgBonus), tone: ec },
  ];
  const typeBonus: [string, number][] = [
    ['Dano de ataque normal', s.dmgByType.normal],
    ['Dano de ataque carregado', s.dmgByType.charged],
    ['Dano de ataque imersivo', s.dmgByType.plunge],
    ['Dano de habilidade', s.dmgByType.skill],
    ['Dano de Supremo', s.dmgByType.burst],
  ];

  return (
    <div className="db">
      <BuildStrip data={v.data} index={index} member={ref} projectId={v.id} compact editOpen={editBuild} onEditClose={() => setEditBuild(false)} />
      <BuildOverview v={v} index={index} element={character.element} />

      <div className="db-toolbar">
        <Segmented label="Crítico" value={crit} options={CRIT_OPTIONS} onChange={setCrit} />
        <Segmented
          label="Reação da tabela de dano"
          value={active}
          options={options.map((o) => ({ value: o, label: ampOf(o) ? `${REACTION_LABEL[o]} ×${formatDecimal(ampOf(o)!, 2)}` : REACTION_LABEL[o] }))}
          onChange={setReaction}
        />
        <span className="grow" />
        {/* "Voltar ao build genérico" / "Usar as peças dele do inventário": a BuildStrip põe o botão aqui, na mesma barra de Editar build, Comparar build e Otimizar */}
        <span id="gear-acts-slot" className="gear-acts-slot" />
        <button type="button" className="dz-btn" onClick={() => setEditBuild(true)} title="Main stats, raridades e ER mínimo">Editar build</button>
        <Link className="dz-btn" to={`/projeto/${v.id}/armas/${encodeURIComponent(ref.character)}`} title="Compara armas, refinos e constelações">Comparar build</Link>
      </div>

      <DamageLegend />

      <div className="db-cols">
        <div className="db-col">
          <Panel title="Atributos" badge="com buffs ativos">
            <ul className="db-rows icons">
              {attrs.map((r) => (
                <li key={r.k}>
                  <span className="k" style={r.tone ? { color: r.tone } : undefined}><Ico k={r.ico} />{r.k}</span>
                  <b className="num">{r.v}{r.ico === 'cr' && s.critRate > 1 + 1e-9 && <i className="dz-chip warn crit-excess" title="O cálculo usa no máximo 100% de Taxa Crítica">excesso de {formatDecimal((s.critRate - 1) * 100, 1)}%</i>}</b>
                </li>
              ))}
            </ul>
            <p className="db-sub num">{formatInt(basePieces.atk)} ATK base · {formatInt(basePieces.hp)} HP base · {formatInt(basePieces.def)} DEF base</p>
          </Panel>
          <Panel title="Bônus extras">
            <ul className="db-rows">
              {typeBonus.filter(([, f], i) => f !== 0 || i === 1 || i === 4).map(([k, f]) => (
                <li key={k}><span className="k">{k}</span><b className="num">{pct(f)}</b></li>
              ))}
              {options.includes('melt') && <li><span className="k">Bônus de Derreter</span><b className="num">{pct(s.meltBonus)}</b></li>}
              {options.includes('vaporize') && <li><span className="k">Bônus de Vaporizar</span><b className="num">{pct(s.vaporizeBonus)}</b></li>}
            </ul>
          </Panel>
        </div>

        <div className="db-col">
          {byHit('normal').length > 0 && <MovePanel title="Ataque normal" badge={`NORMAL · ${talents.normal}`} lines={byHit('normal')} crit={crit} />}
          {byHit('charged').length > 0 && <MovePanel title="Carregado" badge="CARREGADO" tone="good" lines={byHit('charged')} crit={crit} />}
          {byHit('plunge').length > 0 && <MovePanel title="Queda" badge="IMERSIVO" lines={byHit('plunge')} crit={crit} />}
        </div>

        <div className="db-col">
          {skill && <MovePanel title="Habilidade" badge={`HABILIDADE · ${talents.skill}`} tone="gold" lines={skill.lines} crit={crit} />}
          {burst && <MovePanel title="Supremo" badge={`SUPREMO · ${talents.burst}`} tone="gold" lines={burst.lines} crit={crit} />}
        </div>

        <div className="db-col">
          <Panel title="Reações" badge="neste time">
            {reactions.length === 0 ? (
              <p className="muted small">Nenhuma reação com os elementos deste time.</p>
            ) : (
              <ul className="db-rows">
                {reactions.map((r) => (
                  <li key={r.id}>
                    <span className="k" style={{ color: ec }}>{r.name}</span>
                    <b className="num">{r.value.type === 'mult' ? `×${formatDecimal(r.value.amount, 2)}` : formatInt(r.value.amount)}</b>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Buffs do time" badge={String(summed.length)}>
            {summed.length === 0 ? (
              <p className="muted small">Nenhum buff ativo chega a {ref.character}.</p>
            ) : (
              <ul className="db-rows buffs">
                {summed.map((r) => (
                  <li key={r.key} title={r.sources.join(' · ')}>
                    <span className="top">
                      <span className="n">{r.label}</span>
                      <b className="num">{r.pct ? `${r.total >= 0 ? '+' : '−'}${formatDecimal(Math.abs(r.total), Math.abs(r.total) % 1 ? 1 : 0)}%` : `${r.total >= 0 ? '+' : '−'}${formatInt(Math.abs(r.total))}`}</b>
                    </span>
                    <small>{r.sources.slice(0, 3).join(' · ')}{r.sources.length > 3 ? ` · +${r.sources.length - 3}` : ''}{r.flagged ? ' · A CONFIRMAR' : ''}</small>
                  </li>
                ))}
              </ul>
            )}
            <ButtonLink variant="ghost" size="sm" to={`/projeto/${v.id}`}>Ligar e desligar na Equipe</ButtonLink>
          </Panel>
        </div>
      </div>
    </div>
  );
}
