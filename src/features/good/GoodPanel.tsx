/**
 * Painel "Inventário (GOOD)": importa o arquivo exportado pelo Genshin Optimizer e aplica o build real de um
 * personagem (arma, sets, main stats e a soma exata dos substats) ao membro selecionado.
 */
import { useRef, useState } from 'react';
import type { AnalysisBundle, ResolvedProject, RotationProject } from '../../engine';
import { Hint, Panel } from '../../ui/components';
import { formatDecimal, formatInt } from '../../ui/format';
import type { LoadedData } from '../rotation/data';
import { useRotationStore } from '../rotation/store';
import { buildFromGood, goodCharacterNames, parseGood, type Good } from './goodImport';
import { clearGood, loadGood, saveGood } from './goodStore';
import { searchBestLoadout, weightsFromGains, type SearchResult } from './loadoutSearch';

const SLOT_LABEL: Record<string, string> = { flower: 'Flor', plume: 'Pena', sands: 'Areia', goblet: 'Cálice', circlet: 'Tiara' };
const STAT_LABEL: Record<string, string> = {
  hp: 'HP', hp_: 'HP%', atk: 'ATK', atk_: 'ATK%', def: 'DEF', def_: 'DEF%', eleMas: 'EM', enerRech_: 'ER', critRate_: 'Taxa Crít.', critDMG_: 'Dano Crít.', heal_: 'Cura',
};
const statLabel = (k: string) => STAT_LABEL[k] ?? (/_dmg_$/.test(k) ? `DMG ${k.replace('_dmg_', '')}` : k);
const statValue = (k: string, v: number) => (/_$/.test(k) ? `${formatDecimal(v, 1)}%` : formatInt(v));

export function GoodPanel({ data, name, index, project, resolved, bundle }: { data: LoadedData; name: string; index: number; project: RotationProject; resolved: ResolvedProject; bundle: AnalysisBundle }) {
  const update = useRotationStore((s) => s.updateMember);
  const [good, setGood] = useState<Good | null>(() => loadGood());
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const [allowOthers, setAllowOthers] = useState(false);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [found, setFound] = useState<SearchResult | null>(null);
  const stop = useRef(false);

  const search = async () => {
    if (!good) return;
    setSearching(true);
    setError(null);
    setFound(null);
    setProgress(0);
    stop.current = false;
    try {
      const ref = project.members[index];
      const r = await searchBestLoadout({
        good,
        characterName: name,
        member: index,
        team: resolved.team,
        ref,
        rolls: bundle.optimization.rolls,
        actions: resolved.actions,
        flatEffects: resolved.flatEffects,
        ampCoefficient: resolved.ampCoefficient,
        game: data.game,
        effects: data.effects,
        minRolls: project.config.minRollsPerSubstat,
        weights: weightsFromGains(bundle.gains, index),
        allowEquippedByOthers: allowOthers,
        candidatesPerSlot: 60,
        onProgress: setProgress,
        shouldStop: () => stop.current,
      });
      setFound(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSearching(false);
    }
  };

  const applyFound = () => {
    if (!found) return;
    const { artifacts, primarySet, secondarySet, fourPiece, manualRolls } = found.loadout;
    update(index, { artifacts, primarySet, secondarySet, fourPiece, manualRolls });
    setNotes([`Build do inventário aplicado a ${name}: ${found.loadout.primarySet ?? 'sem set'}${found.loadout.secondarySet ? ` + ${found.loadout.secondarySet}` : ''}.`]);
    setFound(null);
  };

  const onFile = async (file: File) => {
    setError(null);
    setNotes([]);
    try {
      const g = parseGood(JSON.parse(await file.text()));
      if (!saveGood(g)) throw new Error('Não foi possível guardar o inventário: o armazenamento do navegador está cheio ou bloqueado.');
      setGood(g);
    } catch (e) {
      setError(e instanceof SyntaxError ? 'O arquivo não é um JSON válido.' : e instanceof Error ? e.message : String(e));
    }
  };

  const apply = () => {
    if (!good) return;
    try {
      const b = buildFromGood(good, name, data.game);
      update(index, b.patch);
      setNotes([`Build de ${name} aplicado do inventário${b.refinement ? ` (arma R${b.refinement})` : ''}.`, ...b.notes]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const available = good ? goodCharacterNames(good, data.game.characters) : [];
  const has = available.includes(name);

  return (
    <Panel title="Inventário (GOOD)" wide>
      <Hint>
        Importe o arquivo do Genshin Optimizer (Configurações, Baixar dados) para usar o build real dos seus personagens: arma, sets, main stats e a soma exata dos substats das peças equipadas. O arquivo fica só no seu navegador.
      </Hint>
      <div className="ast-full ast-good">
        <div className="acts">
          <button type="button" className="ast-btn sm" onClick={() => input.current?.click()}>
            {good ? 'Trocar o inventário' : 'Importar inventário GOOD'}
          </button>
          {good && (
            <button type="button" className="ast-btn sm" onClick={() => { clearGood(); setGood(null); setNotes([]); }}>Remover o inventário</button>
          )}
          <input ref={input} type="file" accept=".json,application/json" hidden aria-label="Escolher inventário GOOD" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void onFile(f); }} />
        </div>
        {good && (
          <p className="summary">
            {formatInt(good.characters.length)} personagens, {formatInt(good.weapons.length)} armas e {formatInt(good.artifacts.length)} artefatos{good.source ? ` (exportado por ${good.source})` : ''}.
          </p>
        )}
        {good && (
          <div className="acts">
            <button type="button" className="ast-btn" disabled={!has} onClick={apply} title={has ? undefined : `${name} não está neste inventário`}>
              Aplicar o build de {name}
            </button>
            {!has && <span className="ast-hint" style={{ margin: 0 }}>{name} não está neste inventário.</span>}
          </div>
        )}
        {good && (
          <div className="loadout">
            <h3 className="ast-subtitle ast-caps">Melhor build do inventário</h3>
            <p className="ast-hint">
              Procura, entre as peças do inventário, o conjunto de 5 artefatos que mais aumenta o dano da rotação da equipe, usando os substats reais. É uma busca por trocas de uma peça de cada vez a partir de vários conjuntos iniciais, não uma busca exaustiva.
            </p>
            <div className="acts">
              <button type="button" className="ast-btn" disabled={!has || searching} onClick={() => void search()}>
                {searching ? `Buscando… ${formatInt(progress)} conjuntos` : `Buscar o melhor build de ${name}`}
              </button>
              {searching && <button type="button" className="ast-btn sm" onClick={() => { stop.current = true; }}>Parar</button>}
              <label className="ast-check">
                <input type="checkbox" checked={allowOthers} onChange={(e) => setAllowOthers(e.target.checked)} /> Usar também peças equipadas em outros personagens
              </label>
            </div>
            {found && (
              <div className="found" role="status">
                <p className="summary">
                  <b>{formatInt(found.teamAvg)}</b> de dano da equipe
                  {found.equippedAvg ? ` (${found.teamAvg >= found.equippedAvg ? '+' : ''}${formatDecimal((found.teamAvg / found.equippedAvg - 1) * 100, 2)}% contra o conjunto equipado)` : ''}
                  {found.stopped ? ' · busca interrompida' : ''} · {formatInt(found.evaluated)} conjuntos avaliados.
                </p>
                <table className="ast-table ast-found">
                  <thead><tr><th scope="col">Posição</th><th scope="col">Set</th><th scope="col">Main</th><th scope="col">Substats</th></tr></thead>
                  <tbody>
                    {(['flower', 'plume', 'sands', 'goblet', 'circlet'] as const).map((slot) => {
                      const a = found.pieces[slot];
                      return (
                        <tr key={slot} style={{ cursor: 'default' }}>
                          <td>{SLOT_LABEL[slot]}</td>
                          <td>{a.setKey}</td>
                          <td>{statLabel(a.mainStatKey)}</td>
                          <td>{a.substats.map((s) => `${statLabel(s.key)} ${statValue(s.key, s.value)}`).join(' · ')}{a.location ? <span className="ast-flag">em {a.location}</span> : null}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button type="button" className="ast-btn" onClick={applyFound}>Aplicar este build</button>
              </div>
            )}
          </div>
        )}
        {error && <p className="ast-error" role="alert">{error}</p>}
        {notes.length > 0 && (
          <ul className="notes" role="status">
            {notes.map((n, i) => (<li key={i}>{n}</li>))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
