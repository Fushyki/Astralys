/** Equipe: visão geral do projeto (KPIs do time e um cartão por personagem). Rota /projeto/:id. */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjectView } from '../app/ProjectContext';
import { CharacterPickerDialog } from '../design/CharacterPickerDialog';
import { Chip, StackedBar } from '../design/primitives';
import { splashUrl } from './card/cardParts';
import { activeDatabaseId, bindProject, databaseOfProject, listDatabases } from '../features/good/goodStore';
import { pieceIconUrl, weaponIconUrl } from '../design/images';
import { MAX_TEAM_SIZE, effectiveDuration, effectiveTalents, type MemberRef } from '../engine';
import type { LoadedData } from '../features/rotation/data';
import { effectStatus } from '../features/rotation/teamInfo';
import { weaponsFor } from '../features/rotation/teamOps';
import { SetPickerDialog } from './personagem/SetPicker';
import { MemberBuffs } from './equipe/MemberBuffs';
import { ReactedChips } from './equipe/ReactedChips';
import type { Element } from '../data/schema';
import { WeaponPickerDialog } from './personagem/WeaponPicker';
import { downloadProject } from '../features/rotation/importFile';
import { cloneProject, saveProject } from '../features/rotation/persistence';
import { useRotationStore } from '../features/rotation/store';
import { defaultMember } from '../features/rotation/teamOps';
import { configChips, givenBuffs, keyStats, mainReaction, mainsText, receivedBuffCount, roleOf, setPiecesText } from '../features/team/teamModel';
import { norm } from '../features/good/goodImport';
import { formatDecimal, formatInt, formatPercent } from '../ui/format';
import './equipe.css';

const PIECES = ['flower', 'plume', 'sands', 'goblet', 'circlet'] as const;
const PIECE_NAME = { flower: 'Flor', plume: 'Pluma', sands: 'Areia', goblet: 'Cálice', circlet: 'Tiara' } as const;

function Splash({ icon, name }: { icon?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return icon && !failed ? <img className="splash" src={splashUrl(icon)} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="splash init" aria-hidden="true">{name.charAt(0)}</b>;
}

function GearImg({ src, fallback }: { src?: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="ph" aria-hidden="true">{fallback}</b>;
}

/** Arma e 5 artefatos só como imagem; tocar abre a troca. Em 2+2 cada set ganha uma cor e o selo "2". */
function EquipGear({ index, memberRef, data, mains, setText }: { index: number; memberRef: MemberRef; data: LoadedData; mains: string; setText: string }) {
  const update = useRotationStore((st) => st.updateMember);
  const [pick, setPick] = useState<'weapon' | 'set' | null>(null);
  const character = data.game.characters.find((c) => c.name === memberRef.character);
  const weapon = data.game.weapons.find((w) => w.name === memberRef.weapon);
  const sets = [memberRef.primarySet, memberRef.secondarySet].filter((n): n is string => !!n).map((n) => data.game.artifacts.find((x) => x.name === n));
  const twoTwo = sets.length === 2;
  const four = sets.length === 1 && memberRef.fourPiece !== false;
  const setFor = (i: number) => (twoTwo && (i === 2 || i === 3) ? sets[1] : sets[0]);
  return (
    <div className="eq-gear" data-mode={twoTwo ? 'two-two' : four ? 'four' : sets.length ? 'two' : 'none'}>
      <button type="button" className="eq-tile weapon" data-rarity={weapon?.rarity ?? 5} onClick={() => setPick('weapon')} aria-label={`Trocar a arma ${memberRef.weapon}`} title={`${memberRef.weapon} (R${memberRef.refinement ?? 1}) · tocar para trocar`}>
        <GearImg src={weapon?.icon ? weaponIconUrl(weapon.icon) : undefined} fallback="" />
        <span className="badge">R{memberRef.refinement ?? 1}</span>
      </button>
      <div className="eq-pieces" role="group" aria-label={`Artefatos: ${setText}. Mains: ${mains}`} title={`${setText} · Mains: ${mains}`}>
        {PIECES.map((slot, i) => {
          // Com peças reais do inventário o set vem de cada peça (primarySet pode estar vazio).
          const real = memberRef.pieces?.find((x) => x.slotKey === slot);
          const set = real ? data.game.artifacts.find((x) => norm(x.name) === norm(real.setKey)) : setFor(i);
          const tone = twoTwo ? (set === sets[0] ? 'a' : 'b') : undefined;
          return (
            <button type="button" key={slot} className="eq-tile piece" data-tone={tone} data-rarity={memberRef.artifacts.rarity[slot]} onClick={() => setPick('set')} aria-label={`${PIECE_NAME[slot]} de ${set?.name ?? 'nenhum set'}: tocar para trocar o set`}>
              <GearImg src={set ? pieceIconUrl(set.id, slot) : undefined} fallback={PIECE_NAME[slot].charAt(0)} />
              {twoTwo && <span className="badge">2</span>}
            </button>
          );
        })}
      </div>
      {pick === 'weapon' && character && (
        <WeaponPickerDialog
          weapons={weaponsFor(character, data.game.weapons)}
          current={memberRef.weapon}
          status={(name) => effectStatus(data.effects.weapons.find((e) => e.weapon === name))}
          onPick={(name) => { update(index, { weapon: name }); setPick(null); }}
          onClose={() => setPick(null)}
        />
      )}
      {pick === 'set' && (
        <SetPickerDialog
          sets={data.game.artifacts}
          current={{ primarySet: memberRef.primarySet, secondarySet: memberRef.secondarySet }}
          status={(name) => effectStatus(data.effects.sets.find((e) => e.set === name))}
          onPick={(c) => { update(index, { primarySet: c.primarySet, secondarySet: c.secondarySet, fourPiece: c.fourPiece }); setPick(null); }}
          onClose={() => setPick(null)}
        />
      )}
    </div>
  );
}

export default function Equipe() {
  const v = useProjectView();
  const navigate = useNavigate();
  const replaceMember = useRotationStore((s) => s.replaceMember);
  const updateMember = useRotationStore((s) => s.updateMember);
  const addMember = useRotationStore((s) => s.addMember);
  const removeMember = useRotationStore((s) => s.removeMember);
  const setCompat = useRotationStore((s) => s.setCompat);
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

  const databases = listDatabases();
  const [dbId, setDbId] = useState<string | null>(() => databaseOfProject(v.id) ?? activeDatabaseId());

  const duplicate = () => {
    const copy = cloneProject(project);
    saveProject(copy);
    const db = databaseOfProject(project.id);
    if (db) bindProject(copy.id, db);
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
          {databases.length > 1 && (
            <label className="eq-db" title="Base de dados do inventário usada por este time">
              <span>Base</span>
              <select className="dz-input" value={dbId ?? ''} onChange={(e) => { bindProject(v.id, e.target.value); setDbId(e.target.value); }} aria-label="Base de dados deste time">
                {databases.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
          )}
          <button type="button" className="dz-btn" onClick={duplicate}>Duplicar</button>
          <button type="button" className="dz-btn" onClick={() => downloadProject(project)} title="Baixa o projeto como arquivo do Astralys (.json)">Exportar</button>
          <Link className="dz-btn gold" to={`/projeto/${v.id}/rotacao`}>Editar rotação</Link>
        </div>
      </section>

      <section className="eq-hero" aria-label="Indicadores do time">
        <div className="dps">
          <span className="k">DPS do time</span>
          <span className="big num">{formatInt(summary.dps)}</span>
        </div>
        <div className="kpis">
          <div><span className="v num">{formatInt(summary.avg)}</span><span className="l">dano da rotação · {summary.actionCount} golpes, média com crítico</span></div>
          <div>
            <span className="v">{reaction ? reaction.name : 'Sem reação'}</span>
            <span className="l">{reaction ? `${formatPercent(reaction.fraction)} do dano vem da amplificação` : 'Nenhum golpe usa reação'}</span>
          </div>
          <div className="split">
            <span className="l">Divisão do dano</span>
            <StackedBar
              parts={summary.members.map((m, i) => ({ key: m.name, label: m.name, fraction: m.fraction, color: colors[i] }))}
              format={(f) => formatPercent(f, f < 0.1 ? 2 : 1)}
            />
          </div>
        </div>
      </section>

      {error && <p className="dz-error" role="alert">{error}</p>}

      {project.compat === 'planilha' && (
        <section className="dz-panel eq-compat" role="note" aria-label="Modo planilha">
          <div>
            <b>Modo planilha</b>
            <p>
              Este time reproduz a planilha original: Mavuika, Citlali, Iansan e Bennett usam só os efeitos dela, sem constelações e passivas curadas. Por isso mudar a constelação
              não muda os buffs. Desligar o modo libera todos os efeitos, mas o DPS deixa de bater com a planilha.
            </p>
          </div>
          <button type="button" className="dz-btn gold" onClick={() => setCompat('none')}>Usar todos os efeitos</button>
        </section>
      )}

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
              <button type="button" className="who" onClick={() => setPicker({ mode: 'replace', index: i })} aria-label={`Trocar ${ref.character} por outro personagem`} title="Tocar aqui troca o personagem">
                <Splash icon={character?.icon} name={ref.character} />
                <div className="meta">
                  <span className="name">{ref.character}</span>
                  <span className="role">{role} · {character?.element}</span>
                  <span className="num sub">Nv {Math.min(90, ref.level ?? project.config.characterLevel)} · C{ref.constellation ?? 0} · talentos {talents.normal}/{talents.skill}/{talents.burst}</span>
                </div>
                <span className="swap" aria-hidden="true">⇄</span>
              </button>
              <div className="body">

                <EquipGear index={i} memberRef={ref} data={data} mains={mainsText(ref, character?.element)} setText={`${set.name} · ${set.pieces}`} />

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

                {(() => {
                  // Set que depende dos elementos com que o dono reage: Scroll (bônus de DMG) e Viridescent (redução de RES).
                  const fp = ref.fourPiece !== false && !ref.secondarySet ? data.effects.sets.find((e) => e.set === ref.primarySet)?.fourPiece : undefined;
                  const resShred = fp?.resShred?.reacted ? fp.resShred : undefined;
                  if (!character || !(resShred || fp?.buffs?.some((b) => b.forReacted))) return null;
                  return (
                    <div className="react">
                      <span className="lbl">{ref.primarySet} · reage com</span>
                      <ReactedChips own={character.element} choices={resShred?.elements.filter((e): e is Element => e !== 'Physical')} els={ref.reacted ?? []} onChange={(next) => updateMember(i, { reacted: next })} />
                      <span className="muted small">
                        {resShred ? 'Só estes elementos perdem RES. Sem escolha, valem os do time.' : `Buffa ${character.element} e os elementos marcados (pode marcar mais de um).`}
                        {project.compat === 'planilha' && !resShred ? ' No modo planilha o Scroll é o buff fixo de 40%; "Usar todos os efeitos" faz a escolha valer.' : ''}
                      </span>
                    </div>
                  );
                })()}

                <div className="acts">
                  <Link className="dz-btn gold" to={`/projeto/${v.id}/personagem/${encodeURIComponent(ref.character)}`}>Ajustar build</Link>
                  <div className="small-acts">
                  </div>
                </div>

                <MemberBuffs v={v} index={i} />
              </div>
            </article>
          );
        })}
        {Array.from({ length: Math.max(0, MAX_TEAM_SIZE - project.members.length) }, (_, k) => (
          <button type="button" key={`vazio-${k}`} className="eq-add" onClick={() => setPicker({ mode: 'add' })} aria-label="Personagem vazio: tocar para escolher">
            <span className="silhouette" aria-hidden="true">?</span>
            <span className="t">Personagem vazio</span>
            <span className="s">Toque para escolher</span>
          </button>
        ))}
      </section>

      <p className="muted small" style={{ margin: 0 }}>
        Rotação de {formatDecimal(effectiveDuration(project), 1)} s com {summary.actionCount} golpes. Os papéis, os buffs e os stats vêm do cálculo do projeto.
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
          onClear={picker.mode === 'replace' && project.members.length > 1 ? () => { removeMember(picker.index); setPicker(null); } : undefined}
          onClose={() => setPicker(null)}
        />
      )}
    </main>
  );
}
