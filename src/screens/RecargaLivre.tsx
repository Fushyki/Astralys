/**
 * Calculadora de recarga avulsa (/recarga): 4 slots com troca de personagem, times salvos no navegador e backup em arquivo,
 * como a calculadora HTML do Davi. Não depende de um projeto nem de uma rotação.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { MAX_TEAM_SIZE, type RotationProject } from '../engine';
import { useGameData } from '../features/rotation/data';
import { sampleProject } from '../features/rotation/persistence';
import { defaultMember } from '../features/rotation/teamOps';
import {
  mergeTeams,
  parseBackup,
  readSavedTeams,
  serializeBackup,
  snapshotTeam,
  writeSavedTeams,
  type SavedEnergyTeam,
} from '../features/energy/savedTeams';
import { withEnergy, type StoredSlot } from '../features/energy/energyModel';
import { EnergyView } from './recarga/EnergyView';
import './recarga.css';
import { Button } from '../design/Button';

const KEY = 'astralys.recarga-livre';
/** Time inicial, o mesmo da calculadora antiga. */
const START_TEAM = ['Mavuika', 'Citlali', 'Iansan', 'Bennett'];

/** Cenário inicial da calculadora antiga: a Mavuika divide as partículas entre Iansan e Bennett (e não usa o Supremo), a Iansan traz 12 de energia fixa. */
const START_SCENARIO: [string, Partial<StoredSlot>][] = [
  ['Mavuika', { onField: ['Iansan', 'Bennett'], fieldTime: 0.5, useBurst: false }],
  ['Citlali', { fieldTime: 0.15 }],
  ['Iansan', { flat: 12, fieldTime: 0.15 }],
  ['Bennett', { fieldTime: 0.2 }],
];

const load = (): RotationProject | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RotationProject) : null;
  } catch {
    return null;
  }
};

export default function RecargaLivre() {
  const { data } = useGameData();
  const [project, setProject] = useState<RotationProject | null>(load);
  const [saved, setSaved] = useState<SavedEnergyTeam[]>(readSavedTeams);
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const known = useMemo(() => new Set(data?.game.characters.map((c) => c.name) ?? []), [data]);

  // Primeira visita: começa com o time da calculadora antiga (os que existirem nos dados).
  useEffect(() => {
    if (!data || project) return;
    const members = START_TEAM.filter((n) => known.has(n)).map((n) => defaultMember(n, data.game));
    let next: RotationProject = { ...sampleProject(), id: 'recarga-livre', name: 'Recarga avulsa', members, actions: [], buffWindows: [] };
    for (const [who, value] of START_SCENARIO) if (known.has(who)) next = withEnergy(next, { slot: { name: who, value } });
    setProject(next);
  }, [data, project, known]);

  useEffect(() => {
    if (!project) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(project));
    } catch {
      /* sem armazenamento: a tela continua funcionando */
    }
  }, [project]);

  if (!data || !project) {
    return (
      <div className="dz">
        <AppHeader />
        <main className="dz-page"><p className="note" role="status">Carregando os dados do jogo…</p></main>
      </div>
    );
  }

  const persist = (next: SavedEnergyTeam[]) => {
    setSaved(next);
    writeSavedTeams(next);
  };
  const swap = (i: number, to: string) => {
    const old = project.members[i].character;
    const energy = project.meta.energy;
    // A configuração do personagem que saiu não passa para o novo; quem apontava para ele volta ao padrão.
    const slots = energy ? Object.fromEntries(Object.entries(energy.slots).filter(([k]) => k !== old)) : {};
    setProject({
      ...project,
      members: project.members.map((m, k) => (k === i ? defaultMember(to, data.game) : m)),
      meta: { ...project.meta, energy: energy ? { ...energy, slots } : energy },
    });
  };
  const add = () => {
    const free = START_TEAM.find((n) => known.has(n) && !project.members.some((m) => m.character === n)) ?? data.game.characters.find((c) => !project.members.some((m) => m.character === c.name))?.name;
    if (free) setProject({ ...project, members: [...project.members, defaultMember(free, data.game)] });
  };
  const remove = (i: number) => setProject({ ...project, members: project.members.filter((_, k) => k !== i) });

  const save = () => {
    persist(mergeTeams(saved, [snapshotTeam(project, name)]));
    setName('');
    setMessage('Time salvo.');
  };
  const load_ = (t: SavedEnergyTeam) => {
    setProject({
      ...project,
      members: t.members.filter((n) => known.has(n)).map((n) => defaultMember(n, data.game)),
      meta: { ...project.meta, energy: t.energy },
    });
    setMessage(`"${t.name}" carregado.`);
  };
  const del = (id: string) => persist(saved.filter((t) => t.id !== id));
  const exportBackup = () => {
    if (saved.length === 0) {
      setMessage('Salve um time antes de exportar o backup.');
      return;
    }
    const url = URL.createObjectURL(new Blob([serializeBackup(saved)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'astralys_times_recarga.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { teams, skipped } = parseBackup(await file.text(), known);
      persist(mergeTeams(saved, teams));
      setMessage(`${teams.length} time(s) importado(s).${skipped.length ? ` Não aproveitado: ${skipped.join('; ')}.` : ''}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Não consegui ler o arquivo.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page">
        <section className="dz-pagehead">
          <div className="titles">
            <h1 className="h1">Recarga de energia por rotação</h1>
            <span className="muted">Descubra quanta Recarga cada personagem precisa para o ciclo fluir sem travar. Escolha até {MAX_TEAM_SIZE} personagens; não depende de um projeto.</span>
          </div>
        </section>

        <section className="dz-panel rc-saves" aria-label="Times salvos">
          <div className="rc-saves-top">
            <b>Meus times salvos</b>
            <div className="rc-saves-actions">
              <input className="dz-input" placeholder="Nome do seu time…" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome do time" onKeyDown={(e) => e.key === 'Enter' && save()} />
              <button type="button" className="dz-btn gold" onClick={save} disabled={project.members.length === 0}>Salvar time atual</button>
              <button type="button" className="dz-btn" onClick={exportBackup}>Exportar backup</button>
              <button type="button" className="dz-btn" onClick={() => fileRef.current?.click()}>Importar</button>
              <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => importBackup(e.target.files?.[0])} aria-label="Arquivo de backup" />
            </div>
          </div>
          <div className="rc-saved-list">
            {saved.length === 0 && <span className="muted small">Nenhum time salvo ainda. Dê um nome e toque em "Salvar time atual". O backup da calculadora antiga (.json) também pode ser importado.</span>}
            {saved.map((t) => (
              <span key={t.id} className="rc-saved">
                <Button variant="ghost" size="sm" onClick={() => load_(t)} title={t.members.join(' · ')}>⭐ {t.name}</Button>
                <button type="button" className="x" onClick={() => del(t.id)} aria-label={`Excluir ${t.name}`}>×</button>
              </span>
            ))}
          </div>
          {message && <p className="note" role="status">{message}</p>}
        </section>

        {project.members.length < MAX_TEAM_SIZE && (
          <div className="rc-team"><button type="button" className="dz-btn" onClick={add}>Adicionar personagem</button></div>
        )}

        {project.members.length > 0 ? <EnergyView project={project} data={data} onChange={setProject} onSwap={swap} onRemove={remove} /> : <p className="note">Adicione personagens para calcular.</p>}
      </main>
    </div>
  );
}
