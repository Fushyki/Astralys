/**
 * Painéis de apoio à build: o valor de +1 roll em cada substat para cada personagem (mapa de calor) e a
 * comparação de armas do personagem selecionado.
 */
import { useState } from 'react';
import { SUBSTATS, type AnalysisBundle, type ResolvedProject, type RotationProject, type Substat } from '../../engine';
import { Hint, Panel } from '../../ui/components';
import { formatDecimal, formatInt } from '../../ui/format';
import type { LoadedData } from './data';
import { useRotationStore } from './store';
import { useWeaponCompare } from './useWeaponCompare';

const LABEL: Record<Substat, string> = {
  CR: 'Taxa Crítica', CD: 'Dano Crítico', 'ATK%': 'ATK%', EM: 'Maestria Elemental', ER: 'Recarga de Energia', ATK: 'ATK fixo', 'HP%': 'HP%', HP: 'HP fixo', 'DEF%': 'DEF%', DEF: 'DEF fixo',
};

/** Quanto DPS da equipe cada personagem ganha com +1 roll de cada substat. */
export function GainHeatmap({ project, bundle }: { project: RotationProject; bundle: AnalysisBundle }) {
  const gains = bundle.gains;
  const max = Math.max(1e-12, ...gains.filter((g) => !g.atCap).map((g) => g.relativeGain));
  const cell = (member: number, s: Substat) => gains.find((g) => g.member === member && g.substat === s);
  // Só os substats que valem alguma coisa para alguém aparecem.
  const rows = SUBSTATS.filter((s) => gains.some((g) => g.substat === s && g.relativeGain > 1e-9));
  return (
    <Panel title="Valor de +1 roll" wide>
      <Hint>
        Quanto o dano da equipe sobe com mais um roll de cada substat, para cada personagem. Quanto mais forte a cor, mais vale. "máx." = o personagem já está no limite de rolls desse substat, então o ganho é só teórico.
      </Hint>
      <div className="ast-scroll ast-full">
        <table className="ast-table ast-heat">
          <thead>
            <tr>
              <th scope="col">Substat</th>
              {project.members.map((m) => (
                <th scope="col" key={m.character}>{m.character}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s} style={{ cursor: 'default' }}>
                <td>{LABEL[s]}</td>
                {project.members.map((m, i) => {
                  const g = cell(i, s);
                  if (!g || g.relativeGain <= 1e-9) return <td key={m.character} className="none">—</td>;
                  const alpha = g.atCap ? 0 : Math.min(1, g.relativeGain / max);
                  return (
                    <td key={m.character} style={{ background: `color-mix(in srgb, var(--gold) ${Math.round(alpha * 70)}%, transparent)` }} title={`+${formatInt(g.dpsGain)} DPS`}>
                      +{formatDecimal(g.relativeGain * 100, 2)}%{g.atCap ? <span className="ast-flag">máx.</span> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

const SHOWN = 10;

/** Dano da equipe trocando a arma do personagem selecionado (substats reotimizados para cada arma). */
export function WeaponCompare({ project, resolved, data, index }: { project: RotationProject; resolved: ResolvedProject; data: LoadedData; index: number }) {
  const update = useRotationStore((s) => s.updateMember);
  const { rows, error } = useWeaponCompare(project, resolved, data, index);
  const [all, setAll] = useState(false);
  const ref = project.members[index];
  const name = ref?.character ?? '';
  if (!ref) return null;
  if (error) return <Panel title={`Armas de ${name}`} wide><p className="ast-error ast-full" role="alert">{error}</p></Panel>;
  if (!rows) return <Panel title={`Armas de ${name}`} wide><Hint>Comparando as armas…</Hint></Panel>;

  const current = rows.find((r) => r.weapon === ref.weapon);
  const hasEffect = (w: string) => data.effects.weapons.some((e) => e.weapon === w);
  const rarity = (w: string) => data.game.weapons.find((x) => x.name === w)?.rarity ?? 0;
  const list = all ? rows : rows.slice(0, SHOWN);
  const shown = current && !list.includes(current) ? [...list, current] : list;

  return (
    <Panel title={`Armas de ${name}`} wide>
      <Hint>
        Dano médio da equipe se {name} usasse cada arma, com os substats reotimizados. Armas sem efeito cadastrado contam só ATK base e substat, então o valor delas é o mínimo possível.
      </Hint>
      <div className="ast-scroll ast-full">
        <table className="ast-table ast-weapons">
          <thead>
            <tr>
              <th scope="col">Arma</th>
              <th scope="col">Dano da equipe</th>
              <th scope="col">Contra a atual</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const diff = current ? (r.teamAvg / current.teamAvg - 1) * 100 : 0;
              const isCur = r.weapon === ref.weapon;
              return (
                <tr key={r.weapon} data-selected={isCur} style={{ cursor: 'default' }}>
                  <td>
                    {rarity(r.weapon)}★ {r.weapon}
                    {hasEffect(r.weapon) ? null : <span className="ast-flag">sem efeito</span>}
                    {isCur ? <span className="ast-flag">atual</span> : null}
                  </td>
                  <td>{formatInt(r.teamAvg)}</td>
                  <td>{isCur ? '—' : `${diff > 0 ? '+' : ''}${formatDecimal(diff, 2)}%`}</td>
                  <td>
                    {isCur ? null : (
                      <button type="button" className="ast-link" onClick={() => update(index, { weapon: r.weapon })}>Usar</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > SHOWN && (
        <button type="button" className="ast-link ast-full" onClick={() => setAll(!all)}>
          {all ? 'Mostrar só as melhores' : `Mostrar todas as ${rows.length} armas`}
        </button>
      )}
    </Panel>
  );
}
