/** Card (/card/:id): personaliza e exporta a imagem do time (4:5, 16:9 ou 9:16). Sai dos mesmos números do projeto. */
import { toPng } from 'html-to-image';
import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { Segmented, StateCard } from '../design/primitives';
import type { RotationProject } from '../engine';
import { ACCENTS, DEFAULT_ACCENT, DEFAULT_BADGE, buildCardModel, hitTypeLookup } from '../features/card/cardModel';
import { embeddedFontCss } from '../features/card/fontCss';
import { useGameData } from '../features/rotation/data';
import { SAMPLE_ID, loadProject, loadVaultCardFormat, saveProject, saveVaultCardFormat } from '../features/rotation/persistence';
import { useAnalysis } from '../features/rotation/useAnalysis';
import { POSTER_LABEL, POSTER_SIZE, PosterCard, ScaledPoster, type PosterFormat } from './card/PosterCard';
import './cardpage.css';

const BADGES = ['Theorycraft', 'F2P', 'Investimento baixo', 'Investimento alto', 'Meta'];
const FORMATS = (Object.keys(POSTER_LABEL) as PosterFormat[]).map((f) => ({ value: f, label: POSTER_LABEL[f] }));

export default function Card() {
  const { id = SAMPLE_ID } = useParams();
  const { data } = useGameData();
  const [project, setProject] = useState<RotationProject | null>(() => loadProject(id));
  const [format, setFormat] = useState<PosterFormat>('portrait');
  const [vaultFormat, setVaultFormat] = useState<PosterFormat>(loadVaultCardFormat);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const analysis = useAnalysis(project, data);

  const model = useMemo(
    () => (project && data && analysis.status === 'ready' ? buildCardModel(project, analysis.bundle, data.game.characters, hitTypeLookup(analysis.resolved)) : null),
    [project, data, analysis],
  );

  const setCard = (patch: { title?: string; badge?: string; tag?: string; nick?: string; accent?: string }) => {
    if (!project) return;
    const next: RotationProject = { ...project, meta: { ...project.meta, card: { ...project.meta.card, ...patch }, updatedAt: new Date().toISOString() } };
    setProject(next);
    saveProject(next);
  };

  const render = async () => {
    const el = viewRef.current?.querySelector<HTMLElement>('.pc');
    if (!el) throw new Error('O card ainda não está pronto.');
    const { w, h } = POSTER_SIZE[format];
    const fontEmbedCSS = await embeddedFontCss();
    return toPng(el, { width: w, height: h, pixelRatio: 1, cacheBust: true, fontEmbedCSS, style: { transform: 'none', margin: '0' } });
  };

  const act = async (kind: 'download' | 'copy') => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const url = await render();
      if (kind === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(project?.name ?? 'card').replace(/[^\w-]+/g, '_')}-${POSTER_LABEL[format].replace(':', 'x')}.png`;
        a.click();
        setDone('Imagem baixada.');
      } else {
        const blob = await (await fetch(url)).blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setDone('Imagem copiada.');
      }
    } catch (e) {
      setError(`${kind === 'download' ? 'Não foi possível gerar a imagem' : 'Não foi possível copiar a imagem'}: ${e instanceof Error ? e.message : String(e)}${kind === 'copy' ? '. Use "Baixar PNG".' : ''}`);
    } finally {
      setBusy(false);
    }
  };

  if (!project) {
    return (
      <StateCard title="Projeto não encontrado">
        <p>Não existe um projeto salvo com o id “{id}” neste navegador.</p>
        <Link className="dz-btn" to="/vault">Ir aos Times</Link>
      </StateCard>
    );
  }

  const card = project.meta.card ?? {};
  const accent = card.accent ?? DEFAULT_ACCENT;
  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page">
        <section className="dz-pagehead">
          <div className="titles">
            <span className="lbl">Projeto · {project.name}</span>
            <h1 className="h1">Card</h1>
          </div>
          <div className="actions">
            <Link className="dz-btn" to={`/projeto/${project.id}/rotacao`}>Voltar à rotação</Link>
          </div>
        </section>

        <div className="cd-layout">
          <aside className="dz-panel cd-form" aria-label="Personalizar o card">
            <label className="dz-field">
              <span>Título</span>
              <input value={card.title ?? ''} placeholder={project.name} maxLength={60} onChange={(e) => setCard({ title: e.target.value })} />
            </label>
            <label className="dz-field">
              <span>Selo</span>
              <input value={card.badge ?? DEFAULT_BADGE} maxLength={40} list="card-badges" onChange={(e) => setCard({ badge: e.target.value })} />
              <datalist id="card-badges">{BADGES.map((b) => <option key={b} value={b} />)}</datalist>
            </label>
            <label className="dz-field">
              <span>Etiqueta (versão, meta…)</span>
              <input value={card.tag ?? ''} placeholder="Ex.: Meta 7.1" maxLength={40} onChange={(e) => setCard({ tag: e.target.value })} />
            </label>
            <label className="dz-field">
              <span>Seu apelido</span>
              <input value={card.nick ?? ''} placeholder="Aparece como “por …”" maxLength={30} onChange={(e) => setCard({ nick: e.target.value })} />
            </label>
            <div className="dz-field">
              <span>Cor de destaque</span>
              <div className="cd-accents" role="group" aria-label="Cor de destaque">
                {ACCENTS.map((c) => (
                  <button key={c} type="button" className="cd-swatch" style={{ background: c }} aria-pressed={accent === c} aria-label={`Cor ${c}`} onClick={() => setCard({ accent: c })} />
                ))}
              </div>
            </div>
            <div className="dz-field">
              <span>Formato</span>
              <Segmented<PosterFormat> label="Formato" value={format} onChange={setFormat} options={FORMATS} />
              <button type="button" className="dz-btn" disabled={vaultFormat === format} onClick={() => { saveVaultCardFormat(format); setVaultFormat(format); }}>{vaultFormat === format ? `${POSTER_LABEL[format]} é o card de todos os times` : `Usar ${POSTER_LABEL[format]} em todos os times`}</button>
            </div>
            <div className="cd-acts">
              <button type="button" className="dz-btn gold" disabled={!model || busy} onClick={() => void act('download')}>Baixar PNG</button>
              <button type="button" className="dz-btn" disabled={!model || busy} onClick={() => void act('copy')}>Copiar imagem</button>
            </div>
            {error && <p className="dz-error" role="alert">{error}</p>}
            {done && <p className="note" role="status">{done}</p>}
            <p className="note">O card usa os números do projeto. Mude a build ou a rotação lá e volte aqui.</p>
          </aside>

          <div className="cd-view" ref={viewRef}>
            {model ? (
              <ScaledPoster format={format}>
                <PosterCard model={model} format={format} />
              </ScaledPoster>
            ) : analysis.status === 'error' ? (
              <p className="dz-error" role="alert">{analysis.message}</p>
            ) : (
              <p className="note" role="status">Calculando o card…</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
