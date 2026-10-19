/** Armas e constelações (/projeto/:id/armas/:nome?): dano da equipe trocando a arma, o refino ou a constelação do personagem. */
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useProjectView } from '../app/ProjectContext';
import { CharacterAvatar, Chip, Panel, Segmented } from '../design/primitives';
import { useRotationStore } from '../features/rotation/store';
import { effectStatus, kitCoverage } from '../features/rotation/teamInfo';
import { useWeaponCompare } from '../features/rotation/useWeaponCompare';
import { formatDecimal, formatInt } from '../ui/format';
import './armas.css';

type Refine = 'r1' | 'r5';

const SHOWN = 12;
const delta = (v: number, base: number) => (base > 0 ? `${v >= base ? '+' : ''}${formatDecimal((v / base - 1) * 100, 2)}%` : '—');

export default function Armas() {
  const v = useProjectView();
  const { nome } = useParams();
  const update = useRotationStore((s) => s.updateMember);
  const [refine, setRefine] = useState<Refine>('r1');
  const [only5, setOnly5] = useState(false);
  const [all, setAll] = useState(false);

  const index = nome ? v.project.members.findIndex((m) => m.character === decodeURIComponent(nome)) : 0;
  const ref = v.project.members[index];
  const refinement = refine === 'r5' ? 5 : 1;
  const { rows, error } = useWeaponCompare(v.project, v.resolved, v.data, Math.max(index, 0), refinement);

  if (index < 0 || !ref) return <Navigate to={`/projeto/${v.id}/armas/${encodeURIComponent(v.project.members[0].character)}`} replace />;

  const character = v.data.game.characters.find((c) => c.name === ref.character);
  const rarity = (w: string) => v.data.game.weapons.find((x) => x.name === w)?.rarity ?? 0;
  const weaponStatus = (w: string) => effectStatus(v.data.effects.weapons.find((e) => e.weapon === w));
  const kit = kitCoverage(v.data.effects.characters.find((c) => c.character === ref.character), character?.constellationBoosts);

  const weaponRows = (rows ?? []).filter((r) => !r.refinement && r.constellation === undefined);
  const conRows = (rows ?? []).filter((r) => r.constellation !== undefined).sort((a, b) => a.constellation! - b.constellation!);
  // A arma atual sempre é a base de comparação, mesmo se o filtro de raridade a esconder.
  const current = weaponRows.find((r) => r.weapon === ref.weapon);
  const filtered = weaponRows.filter((r) => !only5 || rarity(r.weapon) === 5 || r.weapon === ref.weapon);
  const list = all ? filtered : filtered.slice(0, SHOWN);
  const shown = current && !list.includes(current) ? [...list, current] : list;

  const curCon = ref.constellation ?? 0;
  const conNow = conRows.find((r) => r.constellation === curCon)?.teamAvg ?? conRows[0]?.teamAvg ?? 0;
  const conBase = conRows[0]?.teamAvg ?? 0;

  return (
    <main className="dz-page">
      <section className="dz-pagehead">
        <div className="titles">
          <span className="lbl">Projeto · {v.project.name}</span>
          <h1 className="h1">Armas e constelações</h1>
        </div>
      </section>

      <div className="ar-members" role="tablist" aria-label="Personagens do time">
        {v.project.members.map((m, i) => {
          const c = v.data.game.characters.find((x) => x.name === m.character);
          return (
            <Link key={m.character} role="tab" aria-selected={i === index} className="ar-member" to={`/projeto/${v.id}/armas/${encodeURIComponent(m.character)}`}>
              <CharacterAvatar name={m.character} icon={c?.icon} color={v.colors[i]} size={32} />
              {m.character}
            </Link>
          );
        })}
      </div>

      {error && <p className="dz-error" role="alert">{error}</p>}
      {!error && !rows && <p className="note" role="status">Comparando as opções…</p>}

      {rows && (
        <div className="ar-grid">
          <Panel
            title={`Armas de ${ref.character}`}
            aside={
              <div className="ar-filters">
                <Segmented<Refine> label="Refino" value={refine} onChange={setRefine} options={[{ value: 'r1', label: 'R1' }, { value: 'r5', label: 'R5' }]} />
                <button type="button" className="dz-btn" aria-pressed={only5} onClick={() => setOnly5(!only5)}>Só 5★</button>
              </div>
            }
          >
            <p className="note">
              Dano médio da equipe se {ref.character} usasse cada arma (refino {refinement}), com os substats reotimizados. Arma sem efeito cadastrado conta só ATK base e substat, então o valor dela é o mínimo possível.
            </p>
            <div className="ar-scroll">
              <table className="dz-table ar-table">
                <thead><tr><th>Arma</th><th>Dano da equipe</th><th>Contra a atual</th><th /></tr></thead>
                <tbody>
                  {shown.map((r) => {
                    const isCur = r.weapon === ref.weapon;
                    return (
                      <tr key={r.weapon} data-current={isCur}>
                        <td>
                          <span className="ar-name">{rarity(r.weapon)}★ {r.weapon}</span>
                          {isCur && <Chip tone="#e9c46a">atual</Chip>}
                          {weaponStatus(r.weapon) === 'partial' && <Chip warn>parcial</Chip>}{weaponStatus(r.weapon) === 'missing' && <Chip warn>sem efeito</Chip>}
                        </td>
                        <td className="avg">{formatInt(r.teamAvg)}</td>
                        <td>{isCur || !current ? '—' : delta(r.teamAvg, current.teamAvg)}</td>
                        <td>{!isCur && <button type="button" className="dz-link" onClick={() => update(index, { weapon: r.weapon, refinement })}>Usar</button>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length > SHOWN && (
              <button type="button" className="dz-link" onClick={() => setAll(!all)}>{all ? 'Mostrar só as melhores' : `Mostrar todas as ${filtered.length} armas`}</button>
            )}
          </Panel>

          <Panel title={`Constelações de ${ref.character}`}>
            <div className="ar-scroll">
            <table className="dz-table ar-table">
              <thead><tr><th>Constelação</th><th>Dano da equipe</th><th>Contra C0</th><th /></tr></thead>
              <tbody>
                {conRows.map((r) => {
                  const isCur = r.constellation === curCon;
                  return (
                    <tr key={r.constellation} data-current={isCur}>
                      <td>C{r.constellation}{isCur && <Chip tone="#e9c46a">atual</Chip>}</td>
                      <td className="avg">{formatInt(r.teamAvg)}</td>
                      <td>{r.constellation === 0 ? '—' : delta(r.teamAvg, conBase)}</td>
                      <td>{!isCur && <button type="button" className="dz-link" onClick={() => update(index, { constellation: r.constellation || undefined })} title={`${delta(r.teamAvg, conNow)} contra a atual`}>Usar</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <ul className="ar-kit" aria-label="O que cada passiva e constelação faz no cálculo">
              {kit.map((k) => (
                <li key={k.label} data-status={k.status}>
                  <b>{k.label}</b>
                  <span className="st">{k.status === 'modeled' ? 'No cálculo' : k.status === 'boost' ? 'Nível de talento' : k.status === 'utility' ? 'Sem efeito no dano' : k.status === 'partial' ? 'Parcial' : 'Sem cadastro'}</span>
                  <span className="tx">{k.note}</span>
                </li>
              ))}
            </ul>
            <p className="note">
              Entram o +3 de nível de talento (C3 e C5) e os buffs de passivas e constelações com número. "Parcial" quer dizer que uma parte (golpe extra, reação, mecânica Lunar ou Estelar) ainda fica de fora, então o ganho real pode ser maior.
            </p>
            {character && <p className="note">Elemento: {character.element}.</p>}
          </Panel>
        </div>
      )}
    </main>
  );
}
