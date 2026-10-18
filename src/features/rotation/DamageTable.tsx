/**
 * Tabela de dano do personagem selecionado (aba "Talentos" do Genshin Optimizer): todos os golpes do kit com o
 * build atual e todos os buffs de time ativos, em dano sem crítico, crítico e médio. Escolha uma reação para ver
 * o ganho nos golpes compatíveis.
 */
import { useMemo, useState } from 'react';
import { assembleTeam, damageTable, reactionTable, type AnalysisBundle, type ReactionChoice, type ResolvedProject } from '../../engine';
import type { Talent } from '../../data/schema';
import { Hint, Panel } from '../../ui/components';
import { ELEMENT_COLOR, formatInt } from '../../ui/format';
import type { LoadedData } from './data';

const TALENTS: { key: Talent; label: string }[] = [
  { key: 'normal', label: 'Ataque normal' },
  { key: 'skill', label: 'Habilidade elemental' },
  { key: 'burst', label: 'Supremo' },
];

const REACTION_GROUPS = [
  { key: 'transformative', label: 'Transformativas' },
  { key: 'lunar', label: 'Lunares' },
  { key: 'stellar', label: 'Estelares' },
] as const;

const REACTIONS: { value: ReactionChoice; label: string }[] = [
  { value: 'none', label: 'Sem reação' },
  { value: 'melt', label: 'Derreter (amplificadora)' },
  { value: 'vaporize', label: 'Vaporizar (amplificadora)' },
  { value: 'spread', label: 'Intensificar (aditiva, Dendro)' },
  { value: 'aggravate', label: 'Propagar (aditiva, Electro)' },
];

export function DamageTable({ resolved, bundle, data, index }: { resolved: ResolvedProject; bundle: AnalysisBundle; data: LoadedData; index: number }) {
  const [reaction, setReaction] = useState<ReactionChoice>('none');
  const member = resolved.team.members[index];
  const assembly = useMemo(() => assembleTeam(resolved.team), [resolved.team]);
  const rows = useMemo(
    () =>
      member
        ? damageTable({ team: resolved.team, assembly, rolls: bundle.optimization.rolls, member: index, moves: data.game.moves, reaction, ampCoefficient: resolved.ampCoefficient })
        : [],
    [resolved, assembly, bundle, data, index, reaction, member],
  );
  const reactions = useMemo(
    () =>
      member
        ? reactionTable({
            characterLevel: resolved.team.config.characterLevel,
            em: bundle.memberStats[index]?.em ?? 0,
            enemy: { level: resolved.team.config.enemyLevel, res: assembly.enemyRes, defRed: resolved.team.config.enemyDefRed, defIgnore: resolved.team.config.enemyDefIgnore },
          })
        : [],
    [member, resolved, bundle, assembly, index],
  );
  if (!member) return null;
  const name = member.character.name;

  return (
    <Panel title={`Tabela de dano de ${name}`} wide>
      <Hint>
        Cada golpe do kit, uma execução, com o build e os buffs de time acima. Não conta dano fixo de outros personagens. Níveis de talento: {member.talents.normal}/{member.talents.skill}/{member.talents.burst}.
      </Hint>
      <label className="ast-field ast-full" style={{ maxWidth: 320, marginBottom: 12 }}>
        <span>Reação</span>
        <select value={reaction} onChange={(e) => setReaction(e.target.value as ReactionChoice)} aria-label="Reação da tabela de dano">
          {REACTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </label>
      <div className="ast-scroll ast-full">
        <table className="ast-table ast-dmgtable">
          <thead>
            <tr>
              <th scope="col">Golpe</th>
              <th scope="col">Sem crítico</th>
              <th scope="col">Crítico</th>
              <th scope="col">Médio</th>
            </tr>
          </thead>
          {TALENTS.map((t) => {
            const list = rows.filter((r) => r.move.talent === t.key);
            if (list.length === 0) return null;
            return (
              <tbody key={t.key}>
                <tr className="group"><th colSpan={4} scope="colgroup">{t.label}</th></tr>
                {list.map((r) => (
                  <tr key={r.move.id} style={{ cursor: 'default' }}>
                    <td>
                      <i className="dot" style={{ background: r.element === 'Physical' ? '#c9c9c9' : ELEMENT_COLOR[r.element] }} aria-hidden="true" />
                      {r.move.label}
                      {r.reactionApplied && reaction !== 'none' ? <span className="ast-flag">reação</span> : null}
                    </td>
                    <td>{formatInt(r.noCrit)}</td>
                    <td>{formatInt(r.crit)}</td>
                    <td>{formatInt(r.avg)}</td>
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>

      <h3 className="ast-subtitle ast-caps ast-full">Dano das reações</h3>
      <p className="ast-hint ast-full">
        Dano da própria reação com a Maestria Elemental de {name} ({formatInt(bundle.memberStats[index]?.em ?? 0)}). Não entram bônus de dano de reação de sets e armas, e as reações Lunares e Estelares saem sem crítico.
      </p>
      <div className="ast-scroll ast-full">
        <table className="ast-table ast-dmgtable ast-reactions">
          <thead>
            <tr>
              <th scope="col">Reação</th>
              <th scope="col" colSpan={3}>Dano</th>
            </tr>
          </thead>
          {REACTION_GROUPS.map((g) => (
            <tbody key={g.key}>
              <tr className="group"><th colSpan={4} scope="colgroup">{g.label}</th></tr>
              {reactions.filter((r) => r.group === g.key).map((r) => (
                <tr key={r.id} style={{ cursor: 'default' }}>
                  <td>
                    <i className="dot" style={{ background: r.element === 'Physical' ? '#c9c9c9' : ELEMENT_COLOR[r.element] }} aria-hidden="true" />
                    {r.name}
                  </td>
                  <td colSpan={3}>{formatInt(r.total)}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </Panel>
  );
}
