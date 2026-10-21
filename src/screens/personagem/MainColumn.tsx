/** Coluna principal da calculadora: atributos, tabela de dano, reações do time e buffs recebidos. */
import { useMemo, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Chip, Panel, Segmented } from '../../design/primitives';
import { assembleTeam, damageTable, effectiveTalents, type ReactionChoice } from '../../engine';
import {
  REACTION_LABEL,
  characterReactions,
  moveGroups,
  reactionOptions,
  receivedBuffs,
} from '../../features/character/characterModel';
import { useRotationStore } from '../../features/rotation/store';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';

export function Attributes({ v, index }: { v: ProjectView; index: number }) {
  const character = v.data.game.characters.find((c) => c.name === v.project.members[index].character)!;
  const weapon = v.data.game.weapons.find((w) => w.name === v.project.members[index].weapon);
  const s = v.bundle.memberStats[index];
  const teamElements = v.resolved.team.members.map((m) => m.character.element);
  const options = reactionOptions(character.element, teamElements);
  const pct = (f: number) => formatPercent(f, 1);
  const typeRows: [string, number][] = [
    ['Ataque normal', s.dmgByType.normal],
    ['Ataque carregado', s.dmgByType.charged],
    ['Ataque imersivo', s.dmgByType.plunge],
    ['Habilidade', s.dmgByType.skill],
    ['Supremo', s.dmgByType.burst],
  ];
  const rows: { k: string; base?: string; v: string }[] = [
    { k: 'ATK', base: `${formatInt(character.baseAtk + (weapon?.baseAtk ?? 0))} base`, v: formatInt(s.atk) },
    { k: 'HP', base: `${formatInt(character.baseHp)} base`, v: formatInt(s.hp) },
    { k: 'DEF', base: `${formatInt(character.baseDef)} base`, v: formatInt(s.def) },
    { k: 'Maestria Elemental', v: formatInt(s.em) },
    { k: 'Recarga de Energia', v: pct(s.er) },
    { k: 'Taxa crítica', v: pct(s.critRate) },
    { k: 'Dano crítico', v: pct(s.critDmg) },
    { k: 'Crit Value', v: formatDecimal(2 * s.critRate * 100 + s.critDmg * 100, 1) },
  ];
  return (
    <Panel title="Atributos" aside={<span className="muted small">com buffs ativos</span>}>
      <div>
        {rows.map((r) => (
          <div className="dz-row" key={r.k}>
            <span className="k">{r.k}</span>
            <span>{r.base ? <span className="base num">{r.base}</span> : null}<span className="v num">{r.v}</span></span>
          </div>
        ))}
      </div>
      <span className="lbl">Bônus de dano</span>
      <div>
        <div className="dz-row"><span className="k">{character.element} DMG</span><span className="v num">{pct(s.dmgBonus)}</span></div>
        {typeRows.filter(([, f]) => f !== 0).map(([k, f]) => (
          <div className="dz-row" key={k}><span className="k">{k}</span><span className="v num">{pct(f)}</span></div>
        ))}
        {options.includes('melt') && <div className="dz-row"><span className="k">Bônus de Derreter</span><span className="v num">{pct(s.meltBonus)}</span></div>}
        {options.includes('vaporize') && <div className="dz-row"><span className="k">Bônus de Vaporizar</span><span className="v num">{pct(s.vaporizeBonus)}</span></div>}
      </div>
    </Panel>
  );
}

/** Golpes do kit do personagem com o build e os buffs atuais, para a reação escolhida. */
function useDamageGroups(v: ProjectView, index: number, reaction: ReactionChoice) {
  const ref = v.project.members[index];
  const member = v.resolved.team.members[index];
  const assembly = useMemo(() => assembleTeam(v.resolved.team, { rolls: v.bundle.optimization.rolls }), [v.resolved.team, v.bundle.optimization.rolls]);
  return useMemo(() => {
    const rows = damageTable({ team: v.resolved.team, assembly, rolls: v.bundle.optimization.rolls, member: index, moves: v.data.game.moves, reaction, ampCoefficient: v.resolved.ampCoefficient });
    return moveGroups(rows, effectiveTalents(ref.talents, ref.constellation, member.character));
  }, [v.resolved, v.bundle, v.data.game.moves, assembly, index, reaction, ref, member.character]);
}

export function DamageTablePanel({ v, index }: { v: ProjectView; index: number }) {
  const [reaction, setReaction] = useState<ReactionChoice>('none');
  const member = v.resolved.team.members[index];
  const teamElements = v.resolved.team.members.map((m) => m.character.element);
  const options = reactionOptions(member.character.element, teamElements);
  const active = options.includes(reaction) ? reaction : 'none';
  const groups = useDamageGroups(v, index, active);

  return (
    <Panel
      title="Tabela de dano"
      aside={
        <Segmented
          label="Reação da tabela de dano"
          value={active}
          options={options.map((o) => ({ value: o, label: REACTION_LABEL[o] }))}
          onChange={setReaction}
        />
      }
    >
      <div className="dz-scroll">
        <table className="dz-table pc-dmg">
          <thead>
            <tr><th scope="col">Golpe</th><th scope="col">Não-crít.</th><th scope="col">Crít.</th><th scope="col">Médio</th></tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <GroupRows key={g.talent} g={g} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">Uma execução de cada golpe, com o build e todos os buffs de time ativos. Não conta dano fixo de outros personagens.</p>
    </Panel>
  );
}

function GroupRows({ g }: { g: ReturnType<typeof moveGroups>[number] }) {
  return (
    <>
      <tr className="grp"><td colSpan={4}>{g.title} · nv {g.level}</td></tr>
      {g.lines.map((l) => (
        <tr key={l.id}>
          <td>{l.name}{l.hits > 1 ? <span className="muted"> · {l.hits}×</span> : null}</td>
          <td>{formatInt(l.noCrit)}</td>
          <td>{formatInt(l.crit)}</td>
          <td className="avg">{formatInt(l.avg)}</td>
        </tr>
      ))}
    </>
  );
}

export function ReactionsPanel({ v, index }: { v: ProjectView; index: number }) {
  const member = v.resolved.team.members[index];
  const team = v.resolved.team;
  const assembly = useMemo(() => assembleTeam(team), [team]);
  const list = characterReactions({
    element: member.character.element,
    teamElements: team.members.map((m) => m.character.element),
    em: v.bundle.memberStats[index].em,
    characterLevel: team.config.characterLevel,
    enemy: { level: team.config.enemyLevel, res: assembly.enemyRes, defRed: assembly.enemyDefRed, defIgnore: team.config.enemyDefIgnore },
    ampCoefficient: v.resolved.ampCoefficient,
    reactionBonus: v.bundle.memberStats[index].reactionBonus,
  });
  return (
    <Panel title="Reações deste time">
      <span className="note">Só as reações que {member.character.name} dispara com os elementos do time ({[...new Set(team.members.map((m) => m.character.element))].join(', ')}).</span>
      {list.length === 0 ? (
        <p className="note">Nenhuma reação com os elementos deste time.</p>
      ) : (
        <div className="dz-scroll">
          <table className="dz-table">
            <thead><tr><th scope="col">Reação</th><th scope="col">Tipo</th><th scope="col">Valor</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="muted" style={{ textAlign: 'left' }}>{r.kind}</td>
                  <td className="avg">{r.value.type === 'mult' ? `×${formatDecimal(r.value.amount, 2)}` : formatInt(r.value.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function ReceivedBuffsPanel({ v, index }: { v: ProjectView; index: number }) {
  const setEnabled = useRotationStore((s) => s.setSourceEnabled);
  const list = useMemo(() => receivedBuffs(v.project, v.resolved, v.bundle, index), [v.project, v.resolved, v.bundle, index]);
  const name = v.project.members[index].character;
  return (
    <Panel title="Buffs recebidos" aside={<span className="num muted small">{list.filter((b) => b.active).length} ativos</span>}>
      {list.length === 0 && <p className="note">{name} não recebe buffs de equipe neste projeto.</p>}
      <div className="pc-buffs">
        {list.map((b) => (
          <label className="b" key={b.id} data-active={b.active}>
            <input type="checkbox" checked={b.active} onChange={(e) => setEnabled(b.id, e.target.checked)} aria-label={`${b.name} (${b.giverName})`} />
            <span className="info">
              <span className="n">{b.name}{b.needsConfirmation ? <Chip warn>A CONFIRMAR</Chip> : null}</span>
              <span className="src" style={{ color: b.giver !== null ? v.colors[b.giver] : undefined }}>{b.giverName} · {b.window}</span>
            </span>
            <span className="num val">{b.value}</span>
            <span className="num share">{b.share === null ? (b.active ? '—' : 'desligado') : formatPercent(Math.max(0, b.share), 1)}</span>
          </label>
        ))}
      </div>
      <span className="note">Última coluna: quanto do dano de {name} some sem esse buff. Desmarque para ver o time sem ele.</span>
    </Panel>
  );
}
