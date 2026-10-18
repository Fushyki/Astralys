/**
 * Página do card infográfico de um projeto (`/rotacao/:id/card`): edita título, selo e etiqueta, escolhe o
 * formato e baixa o PNG. O card sai dos mesmos números do editor.
 */
import { toPng } from 'html-to-image';
import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../../ui/ast.css';
import type { RotationProject } from '../../engine';
import { useGameData } from '../rotation/data';
import { SAMPLE_ID, loadProject, saveProject } from '../rotation/persistence';
import { useAnalysis } from '../rotation/useAnalysis';
import { embeddedFontCss } from './fontCss';
import { buildCardModel, hitTypeLookup, DEFAULT_BADGE } from './cardModel';
import { CARD_SIZE, RotationCard, ScaledCard, type CardFormat } from './RotationCard';

const BADGES = ['Theorycraft', 'F2P', 'Investimento baixo', 'Investimento alto', 'Meta'];

export default function CardPage() {
  const { id = SAMPLE_ID } = useParams();
  const { data } = useGameData();
  const [project, setProject] = useState<RotationProject | null>(() => loadProject(id));
  const [format, setFormat] = useState<CardFormat>('wide');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const analysis = useAnalysis(project, data);

  const model = useMemo(
    () =>
      project && data && analysis.status === 'ready'
        ? buildCardModel(project, analysis.bundle, data.game.characters, hitTypeLookup(analysis.resolved))
        : null,
    [project, data, analysis],
  );

  const setCard = (patch: { title?: string; badge?: string; tag?: string }) => {
    if (!project) return;
    const next: RotationProject = { ...project, meta: { ...project.meta, card: { ...project.meta.card, ...patch }, updatedAt: new Date().toISOString() } };
    setProject(next);
    saveProject(next);
  };

  const render = async () => {
    const el = cardRef.current?.querySelector<HTMLElement>('.ast-card');
    if (!el) throw new Error('O card ainda não está pronto.');
    const { w, h } = CARD_SIZE[format];
    const fontEmbedCSS = await embeddedFontCss();
    return toPng(el, { width: w, height: h, pixelRatio: 2, cacheBust: true, fontEmbedCSS, style: { transform: 'none', margin: '0' } });
  };

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const url = await render();
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(project?.name ?? 'card').replace(/[^\w\-]+/g, '_')}-${format === 'wide' ? '16x9' : '9x16'}.png`;
      a.click();
    } catch (e) {
      setError(`Não foi possível gerar a imagem: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await (await fetch(await render())).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch (e) {
      setError(`Não foi possível copiar a imagem: ${e instanceof Error ? e.message : String(e)}. Use "Baixar PNG".`);
    } finally {
      setBusy(false);
    }
  };

  if (!project) {
    return (
      <div className="ast-app">
        <div className="ast-state">
          <h1 className="ast-caps">Projeto não encontrado</h1>
          <p>Não existe um projeto salvo com o id “{id}” neste navegador.</p>
          <Link className="ast-btn" to="/rotacao">Meus projetos</Link>
        </div>
      </div>
    );
  }

  const card = project.meta.card ?? {};
  return (
    <div className="ast-app">
      <div className="ast-shell">
        <header className="ast-title">
          <h1 className="ast-caps">Card de {project.name}</h1>
          <Link className="ast-btn" to={`/rotacao/${project.id}`}>Voltar ao editor</Link>
          <Link className="ast-btn" to="/rotacao">Meus projetos</Link>
        </header>

        <div className="ast-cardpage">
          <aside className="ast-cardform" aria-label="Personalizar o card">
            <label className="ast-field">
              <span>Título</span>
              <input value={card.title ?? ''} placeholder={project.name} maxLength={60} onChange={(e) => setCard({ title: e.target.value })} />
            </label>
            <label className="ast-field">
              <span>Selo</span>
              <input value={card.badge ?? DEFAULT_BADGE} maxLength={40} list="card-badges" onChange={(e) => setCard({ badge: e.target.value })} />
              <datalist id="card-badges">{BADGES.map((b) => <option key={b} value={b} />)}</datalist>
            </label>
            <label className="ast-field">
              <span>Etiqueta (versão, meta…)</span>
              <input value={card.tag ?? ''} placeholder="Ex.: Meta 7.1" maxLength={40} onChange={(e) => setCard({ tag: e.target.value })} />
            </label>
            <fieldset className="ast-source">
              <legend>Formato</legend>
              <label><input type="radio" name="fmt" checked={format === 'wide'} onChange={() => setFormat('wide')} /> 16:9 (horizontal)</label>
              <label><input type="radio" name="fmt" checked={format === 'tall'} onChange={() => setFormat('tall')} /> 9:16 (vertical)</label>
            </fieldset>
            <div className="ast-cardacts">
              <button type="button" className="ast-btn" disabled={!model || busy} onClick={() => void download()}>Baixar PNG</button>
              <button type="button" className="ast-btn" disabled={!model || busy} onClick={() => void copy()}>Copiar imagem</button>
            </div>
            {error && <p className="ast-error" role="alert">{error}</p>}
            <p className="ast-hint">O card usa os números do editor. Mude a build ou a rotação lá e volte aqui.</p>
          </aside>

          <div className="ast-cardview" ref={cardRef}>
            {model ? (
              <ScaledCard format={format} maxWidth={format === 'wide' ? 1280 : 480}>
                <RotationCard model={model} format={format} />
              </ScaledCard>
            ) : analysis.status === 'error' ? (
              <p className="ast-error" role="alert">{analysis.message}</p>
            ) : (
              <p className="ast-hint" role="status">Calculando o card…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
