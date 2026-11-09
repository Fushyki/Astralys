/**
 * Comparar times (`/comparar?a=ID&b=ID`): um card 16:9 de comparação para printar e mostrar a um amigo.
 * Cada time é calculado com a própria equipe, build e rotação; a tela personaliza o que aparece no card.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { analyzeProject, resolveProject } from '../engine';
import { buildCardModel, hitTypeLookup, type CardModel } from '../features/card/cardModel';
import { compareModels } from '../features/compare/compareModel';
import { useGameData, type LoadedData } from '../features/rotation/data';
import { listProjects, loadProject } from '../features/rotation/persistence';
import { COMPARE_METRICS, CompareCard, type CompareMetric } from './card/CompareCard';
import { toast } from '../app/toast';
import { copyCardImage, saveCardImage } from './card/copyCard';
import { ScaledPoster } from './card/PosterCard';
import './cardpage.css';
import './comparar.css';

function modelOf(id: string | null, data: LoadedData): CardModel | { error: string } | null {
  if (!id) return null;
  const p = loadProject(id);
  if (!p) return { error: 'Projeto não encontrado neste navegador.' };
  try {
    const r = resolveProject(p, data.game, data.effects);
    const b = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
    return buildCardModel(p, b, data.game.characters, hitTypeLookup(r), data.game.artifacts);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

const isModel = (m: CardModel | { error: string } | null): m is CardModel => !!m && !('error' in m);
const COLORS = ['#e9c46a', '#f08a5d', '#8fd3e8', '#c49cf2'];

function Swatches({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <div className="cd-accents" role="group" aria-label={label}>
      {COLORS.map((c) => (
        <button key={c} type="button" className="cd-swatch" style={{ background: c }} aria-pressed={value === c} aria-label={`${label} ${c}`} onClick={() => onChange(c)} />
      ))}
    </div>
  );
}

export default function Comparar() {
  const [params, setParams] = useSearchParams();
  const { data } = useGameData();
  const projects = useMemo(() => listProjects(), []);
  const aId = params.get('a');
  const bId = params.get('b');
  const a = useMemo(() => (data ? modelOf(aId, data) : null), [data, aId]);
  const b = useMemo(() => (data ? modelOf(bId, data) : null), [data, bId]);
  const cmp = isModel(a) && isModel(b) ? compareModels(a, b) : null;

  const [titleA, setTitleA] = useState('');
  const [titleB, setTitleB] = useState('');
  const [accentA, setAccentA] = useState(COLORS[0]);
  const [accentB, setAccentB] = useState(COLORS[2]);
  const [metrics, setMetrics] = useState<CompareMetric[]>(['dps', 'dpr', 'duration', 'er']);
  const [showGear, setShowGear] = useState(false);
  const [showBars, setShowBars] = useState(true);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  // Cabe na janela: o card escala para a altura que sobra abaixo da barra (mín. 900 px de largura; o que passar rola).
  // A barra de configuração e o card usam a mesma largura, para as colunas A e B continuarem sob as metades do card.
  const [cardW, setCardW] = useState<number | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = viewRef.current;
      if (!el || window.innerWidth <= 1000) return setCardW(null);
      const top = el.getBoundingClientRect().top + window.scrollY;
      const avail = window.innerHeight - top - 12;
      setCardW(Math.round(Math.min(1600, Math.max(900, (avail * 16) / 9), window.innerWidth - 48)));
    };
    measure();
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => { window.removeEventListener('resize', measure); ro.disconnect(); };
  }, []);

  const set = (key: 'a' | 'b', value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const swap = () => {
    setParams(new URLSearchParams({ ...(bId ? { a: bId } : {}), ...(aId ? { b: aId } : {}) }), { replace: true });
    setTitleA(titleB);
    setTitleB(titleA);
    setAccentA(accentB);
    setAccentB(accentA);
  };
  const toggle = (m: CompareMetric) => setMetrics((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : COMPARE_METRICS.map((x) => x.value).filter((x) => x === m || cur.includes(x))));

  const act = async (kind: 'copy' | 'save') => {
    const el = viewRef.current?.querySelector<HTMLElement>('.pc');
    if (!el) return;
    setBusy(true);
    setMsg(null);
    try {
      if (kind === 'copy') await copyCardImage(el, 'wide');
      else await saveCardImage(el, 'wide', 'astralys-comparacao');
      toast(kind === 'copy' ? 'Imagem copiada.' : 'Imagem salva.');
    } catch (e) {
      toast(`Não foi possível gerar a imagem: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const picker = (key: 'a' | 'b', value: string | null) => (
    <label className="dz-field">
      <span>Time {key.toUpperCase()}</span>
      <select value={value ?? ''} onChange={(e) => set(key, e.target.value)} aria-label={`Time ${key.toUpperCase()}`}>
        <option value="">Escolha um time</option>
        {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
      </select>
    </label>
  );

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page">
        <section className="dz-pagehead cp-head">
          <div className="titles">
            <h1 className="h1">Comparar times</h1>
            <span className="muted">Escolha dois times, personalize e copie a imagem para mostrar.</span>
          </div>
          <div className="actions"><Link className="dz-btn" to="/vault">Times</Link></div>
        </section>

        <div className="cd-layout cp-layout" style={cardW ? { ['--cp-w' as string]: `${cardW}px` } : undefined}>
          <aside className="dz-panel cp-bar" aria-label="Personalizar a comparação">
            <div className="cp-cols">
              <div className="cp-grp cp-a">
                {picker('a', aId)}
                <label className="dz-field">
                  <span>Nome de A no card</span>
                  <input value={titleA} maxLength={40} placeholder={isModel(a) ? a.title : 'Time A'} onChange={(e) => setTitleA(e.target.value)} />
                </label>
                <Swatches label="Cor de A" value={accentA} onChange={setAccentA} />
              </div>
              <div className="cp-grp cp-mid">
                <button type="button" className="dz-btn" onClick={swap} disabled={!aId && !bId}>Trocar A e B</button>
                <fieldset className="cp-opts">
                  <legend>No meio do card</legend>
                  {COMPARE_METRICS.map((m) => (
                    <label key={m.value}><input type="checkbox" checked={metrics.includes(m.value)} onChange={() => toggle(m.value)} />{m.label}</label>
                  ))}
                </fieldset>
              </div>
              <div className="cp-grp cp-b">
                {picker('b', bId)}
                <label className="dz-field">
                  <span>Nome de B no card</span>
                  <input value={titleB} maxLength={40} placeholder={isModel(b) ? b.title : 'Time B'} onChange={(e) => setTitleB(e.target.value)} />
                </label>
                <Swatches label="Cor de B" value={accentB} onChange={setAccentB} />
              </div>
            </div>
            <div className="cp-row">
              <label><input type="checkbox" checked={showBars} onChange={(e) => setShowBars(e.target.checked)} />Dano por personagem</label>
              <label><input type="checkbox" checked={showGear} onChange={(e) => setShowGear(e.target.checked)} />Artefatos nos retratos</label>
              <label className="dz-field cp-note">
                <span>Legenda (canto do card)</span>
                <input value={note} maxLength={50} placeholder="Ex.: Abismo 12 · por Davi" onChange={(e) => setNote(e.target.value)} />
              </label>
              <div className="cd-acts">
                <button type="button" className="dz-btn gold" disabled={!cmp || busy} onClick={() => void act('copy')}>Copiar imagem</button>
                <button type="button" className="dz-btn" disabled={!cmp || busy} onClick={() => void act('save')}>Salvar PNG</button>
              </div>
            </div>
            {msg && <p className={msg.ok ? 'note' : 'dz-error'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
          </aside>

          <div className="cd-view" ref={viewRef}>
            {[a, b].map((m, i) => (m && !isModel(m) ? <p key={i} className="dz-error" role="alert">{i === 0 ? 'A' : 'B'}: {m.error}</p> : null))}
            {cmp && isModel(a) && isModel(b) ? (
              <div className="cp-stage">
                <ScaledPoster format="wide" maxHeight={cardW ? Math.round((cardW * 9) / 16) : undefined}>
                  <CompareCard a={a} b={b} cmp={cmp} opts={{ titleA: titleA.trim() || a.title, titleB: titleB.trim() || b.title, accentA, accentB, metrics, showGear, showBars, note: note.trim() }} />
                </ScaledPoster>
              </div>
            ) : (
              <p className="muted cp-empty">Escolha o time A e o time B para montar o card.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
