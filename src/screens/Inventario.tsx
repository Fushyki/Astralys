/** Inventário (/inventario): artefatos e armas importados do Genshin Optimizer (arquivo GOOD) ou da vitrine do jogo (UID). */
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { pieceIconUrl, weaponIconUrl } from '../design/images';
import { mainStatValue, pieceLevel } from '../engine';
import { Chip, Panel, Segmented } from '../design/primitives';
import { enkaToGood, mergeGood } from '../features/enka/enkaImport';
import { norm, parseGood, type Good, type GoodArtifact } from '../features/good/goodImport';
import { clearGood, loadGood, saveGood } from '../features/good/goodStore';
import { useGameData } from '../features/rotation/data';
import { ONLINE_ENABLED } from '../online/config';
import { fetchEnka } from '../online/enka';
import { MAIN_LABEL, SUB_LABEL, characterDisplayName, formatMain, formatSub } from '../features/good/labels';
import { formatInt } from '../ui/format';
import './otimizador.css';
import './inventario.css';

const SLOTS = [
  { key: 'flower', label: 'Flor' }, { key: 'plume', label: 'Pluma' }, { key: 'sands', label: 'Areia' }, { key: 'goblet', label: 'Cálice' }, { key: 'circlet', label: 'Tiara' },
] as const;
const PAGE = 48;

type Tab = 'artefatos' | 'armas';
type Who = 'todos' | 'livres' | 'equipados';

export default function Inventario() {
  const { data } = useGameData();
  const [good, setGood] = useState<Good | null>(() => loadGood());
  const [tab, setTab] = useState<Tab>('artefatos');
  const [slots, setSlots] = useState<string[]>([]);
  const [set, setSet] = useState('');
  const [main, setMain] = useState('');
  const [who, setWho] = useState<Who>('todos');
  const [shown, setShown] = useState(PAGE);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [uid, setUid] = useState(() => {
    try {
      return localStorage.getItem('astralys.uid') ?? '';
    } catch {
      return '';
    }
  });
  const [fetching, setFetching] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const onFile = async (f: File) => {
    setError(null);
    setNotes([]);
    try {
      const g = parseGood(JSON.parse(await f.text()));
      if (!saveGood(g)) throw new Error('Não foi possível guardar o inventário: o armazenamento do navegador está cheio ou bloqueado.');
      setGood(g);
      setNotes([`Importado: ${g.artifacts.length} artefatos, ${g.weapons.length} armas e ${g.characters.length} personagens.`]);
    } catch (e) {
      setError(e instanceof SyntaxError ? 'O arquivo não é um JSON válido.' : e instanceof Error ? e.message : String(e));
    }
  };

  const fromGame = async () => {
    if (!data) return;
    setError(null);
    setNotes([]);
    setFetching(true);
    try {
      const enka = await fetchEnka(uid);
      const r = enkaToGood(enka, data.game);
      if (!r.characters.length) {
        setError(r.notes[0] ?? 'Nenhum personagem importável na vitrine deste jogador.');
        return;
      }
      const merged = mergeGood(loadGood(), r.good);
      if (!saveGood(merged)) throw new Error('Não foi possível guardar o inventário: o armazenamento do navegador está cheio ou bloqueado.');
      try {
        localStorage.setItem('astralys.uid', uid.trim());
      } catch {
        /* sem armazenamento: o UID não fica lembrado */
      }
      setGood(merged);
      setNotes([`${r.nickname ? `${r.nickname} (UID ${r.uid})` : `UID ${r.uid}`}: ${r.characters.length} personagens da vitrine (${r.characters.join(', ')}).`, ...r.notes]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setFetching(false);
    }
  };

  const setName = (key: string) => data?.game.artifacts.find((x) => norm(x.name) === norm(key));
  const sets = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of good?.artifacts ?? []) m.set(a.setKey, (m.get(a.setKey) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [good]);
  const mains = useMemo(() => [...new Set((good?.artifacts ?? []).map((a) => a.mainStatKey))].sort(), [good]);

  const artifacts = useMemo(
    () =>
      (good?.artifacts ?? []).filter(
        (a) => (!slots.length || slots.includes(a.slotKey)) && (!set || a.setKey === set) && (!main || a.mainStatKey === main) && (who === 'todos' || (who === 'livres' ? !a.location : !!a.location)),
      ),
    [good, slots, set, main, who],
  );
  const weapons = useMemo(() => [...(good?.weapons ?? [])].sort((a, b) => (b.level ?? 0) - (a.level ?? 0)), [good]);

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page inv">
        <section className="dz-pagehead">
          <div className="titles">
            <span className="lbl">Inventário</span>
            <h1 className="h1">Suas peças e armas</h1>
            <span className="muted">Importe uma vez e use no Otimizador e na tela de cada personagem. Fica só neste navegador.</span>
          </div>
        </section>

        <Panel title={good ? 'Inventário importado' : 'Importar'}>
          <div className="inv-import">
            <div className="opt">
              <b>Arquivo do Genshin Optimizer</b>
              <span className="muted small">No Genshin Optimizer: Configurações › Baixar dados. Escolha o arquivo .json aqui.</span>
              <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ''; }} />
              <button type="button" className="dz-btn gold" onClick={() => file.current?.click()}>Escolher arquivo</button>
            </div>
            {ONLINE_ENABLED && (
              <div className="opt">
                <b>Vitrine do jogo (UID)</b>
                <span className="muted small">Traz os personagens que estão na sua vitrine, com arma e as 5 peças.</span>
                <div className="row">
                  <input className="dz-input" inputMode="numeric" placeholder="UID" value={uid} onChange={(e) => setUid(e.target.value)} aria-label="UID" />
                  <button type="button" className="dz-btn" disabled={fetching || !data} onClick={() => void fromGame()}>{fetching ? 'Buscando…' : 'Buscar pelo UID'}</button>
                </div>
              </div>
            )}
            {good && (
              <div className="opt now">
                <b>{formatInt(good.artifacts.length)} artefatos · {formatInt(good.weapons.length)} armas · {formatInt(good.characters.length)} personagens</b>
                <div className="row">
                  <Link className="dz-btn gold" to="/otimizador">Otimizar um time</Link>
                  <button type="button" className="dz-btn" onClick={() => { clearGood(); setGood(null); setNotes([]); }}>Apagar do navegador</button>
                </div>
              </div>
            )}
          </div>
          {error && <p className="dz-error" role="alert">{error}</p>}
          {notes.map((n) => <p key={n} className="note">{n}</p>)}
        </Panel>

        {good && (
          <>
            <div className="inv-tools">
              <Segmented label="O que ver" value={tab} options={[{ value: 'artefatos', label: `Artefatos (${good.artifacts.length})` }, { value: 'armas', label: `Armas (${good.weapons.length})` }]} onChange={(t) => { setTab(t); setShown(PAGE); }} />
              {tab === 'artefatos' && (
                <>
                  <div className="ot-chips" role="group" aria-label="Posição">
                    {SLOTS.map((s) => (
                      <button key={s.key} type="button" className="ot-chip" aria-pressed={slots.includes(s.key)} onClick={() => { setSlots(slots.includes(s.key) ? slots.filter((k) => k !== s.key) : [...slots, s.key]); setShown(PAGE); }}>{s.label}</button>
                    ))}
                  </div>
                  <select className="dz-input" aria-label="Set" value={set} onChange={(e) => { setSet(e.target.value); setShown(PAGE); }}>
                    <option value="">Todos os sets</option>
                    {sets.map(([k, n]) => <option key={k} value={k}>{setName(k)?.name ?? k} ({n})</option>)}
                  </select>
                  <select className="dz-input" aria-label="Main stat" value={main} onChange={(e) => { setMain(e.target.value); setShown(PAGE); }}>
                    <option value="">Qualquer main stat</option>
                    {mains.map((k) => <option key={k} value={k}>{MAIN_LABEL[k] ?? k}</option>)}
                  </select>
                  <Segmented label="Quem usa" value={who} options={[{ value: 'todos', label: 'Todas' }, { value: 'livres', label: 'Livres' }, { value: 'equipados', label: 'Equipadas' }]} onChange={(w) => { setWho(w); setShown(PAGE); }} />
                </>
              )}
            </div>

            {tab === 'artefatos' ? (
              <>
                <p className="muted small">{formatInt(artifacts.length)} peças</p>
                <div className="inv-grid arts">
                  {artifacts.slice(0, shown).map((a, i) => <ArtifactTile key={i} a={a} setInfo={setName(a.setKey)}  characters={data?.game.characters} />)}
                </div>
                {artifacts.length > shown && <button type="button" className="dz-btn" onClick={() => setShown(shown + PAGE)}>Mostrar mais ({artifacts.length - shown})</button>}
              </>
            ) : (
              <div className="inv-grid weapons">
                {weapons.slice(0, shown).map((w, i) => {
                  const info = data?.game.weapons.find((x) => norm(x.name) === norm(w.key));
                  return (
                    <div className="inv-weapon" key={i} data-rarity={info?.rarity ?? 4}>
                      <span className="art">{info?.icon ? <img src={weaponIconUrl(info.icon)} alt="" loading="lazy" crossOrigin="anonymous" /> : <b className="ph">⚔</b>}</span>
                      <span className="n">{info?.name ?? w.key}</span>
                      <span className="num sub">Nv {w.level ?? '?'} · R{w.refinement ?? 1}</span>
                      {w.location && <Chip>de {characterDisplayName(w.location, data?.game.characters)}</Chip>}
                    </div>
                  );
                })}
                {weapons.length > shown && <button type="button" className="dz-btn" onClick={() => setShown(shown + PAGE)}>Mostrar mais ({weapons.length - shown})</button>}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ArtifactTile({ a, setInfo, characters }: { a: GoodArtifact; setInfo?: { name: string; id: number }; characters?: readonly { name: string }[] }) {
  const [failed, setFailed] = useState(false);
  const level = pieceLevel(a);
  const slot = SLOTS.find((x) => x.key === a.slotKey)?.label ?? a.slotKey;
  const mainKey = a.slotKey === 'flower' ? 'hp' : a.slotKey === 'plume' ? 'atk' : a.mainStatKey;
  const mainValue = formatMain(mainKey, mainStatValue(mainKey, a.rarity, level));
  return (
    <article className="inv-art" data-rarity={a.rarity}>
      <header>
        <span className="slot">{slot}</span>
        <span className="lvl num">+{level}</span>
      </header>
      <div className="face">
        <span className="art">{setInfo && !failed ? <img src={pieceIconUrl(setInfo.id, a.slotKey as 'flower')} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="ph">◆</b>}</span>
        <div className="mainstat">
          <span className="k">{MAIN_LABEL[mainKey] ?? mainKey}</span>
          <b className="v num">{mainValue}</b>
          <span className="stars" aria-label={`${a.rarity} estrelas`}>{'★'.repeat(a.rarity)}</span>
        </div>
      </div>
      <ul className="subs">
        {a.substats.map((s) => (
          <li key={s.key} data-crit={s.key === 'critRate_' || s.key === 'critDMG_'}><span>{SUB_LABEL[s.key] ?? s.key}</span><b className="num">{formatSub(s.key, s.value)}</b></li>
        ))}
      </ul>
      <footer>
        <span className="set" title={setInfo?.name ?? a.setKey}>{setInfo?.name ?? a.setKey}</span>
        {a.location && <span className="loc">{characterDisplayName(a.location, characters)}</span>}
      </footer>
    </article>
  );
}
