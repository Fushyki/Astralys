/** Galeria da comunidade (/comunidade): times publicados sem conta, com busca por personagem e a rotação de cada um. */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { memberColors } from '../design/elements';
import type { CardModel } from '../features/card/cardModel';
import { LITE_SIZE, PosterCard, ScaledPoster } from './card/PosterCard';
import { useSettings } from '../app/settings';
import { toast } from '../app/toast';
import { removeAsAdmin, unpublishPublic, useTeam } from '../features/community/publish';
import { ownedPublic } from '../features/community/published';
import { useGameData } from '../features/rotation/data';
import { listTeams, type CommunityTeam } from '../online/api';
import { ONLINE_ENABLED } from '../online/config';
import './comunidade.css';

const PAGE = 24;

export default function Comunidade() {
  const { data } = useGameData();
  const [q, setQ] = useState('');
  const [personagem, setPersonagem] = useState('');
  const [versao, setVersao] = useState('');
  const [items, setItems] = useState<CommunityTeam[]>([]);
  const [more, setMore] = useState(false);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);

  const navigate = useNavigate();
  const isAdmin = useSettings((st) => st.adminOk);
  const removerAdmin = (id: string) => {
    if (!window.confirm('Remover este time da galeria para todos?')) return;
    removeAsAdmin(id)
      .then(() => {
        setItems((l) => l.filter((t) => t.id !== id));
        toast('Time removido (admin).');
      })
      .catch((e: Error) => toast(e.message, 'error'));
  };
  const utilizar = (id: string) =>
    useTeam(id).then((copyId) => navigate(`/projeto/${copyId}`)).catch((e: Error) => toast(e.message, 'error'));
  const copiarLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${id}`);
      toast('Link copiado.');
    } catch {
      toast(`${window.location.origin}/p/${id}`);
    }
  };
  const parar = (id: string) =>
    unpublishPublic(id)
      .then(() => {
        setItems((l) => l.filter((t) => t.id !== id));
        toast('Time removido da galeria.');
      })
      .catch((e: Error) => toast(e.message, 'error'));

  const characters = data?.game.characters ?? [];
  const characterOf = (name: string) => characters.find((c) => c.name === name);

  /** O card da galeria é o 4:5 do site (versão enxuta), montado só com o resumo que o time publicou. */
  const modelOf = (t: CommunityTeam): CardModel | null => {
    const r = t.resumo;
    if (!r) return null;
    const duration = Math.max(r.duration, 0.1);
    const colors = memberColors(t.members.map((n) => characterOf(n)?.element));
    const members = t.members.map((n, i) => ({ name: n, element: characterOf(n)?.element ?? null, icon: characterOf(n)?.icon, share: 0, avg: 0, weapon: '', sets: [], gear: [], mains: '', er: 1, critRate: 0, critDmg: 0, color: colors[i] }));
    // Times publicados antes do card não têm os golpes do card: a sequência (com o instante, quando há) ocupa o lugar.
    const hits = r.hits ?? r.sequence.map((x, i) => ({ at: x.time !== undefined ? Math.min(1, x.time / duration) : i / Math.max(1, r.sequence.length), member: x.member, weight: 0.5, burst: false, letter: '', count: Math.max(1, x.times) }));
    return {
      title: t.nome, badge: '', tag: '', members, dps: 0, dpr: 0, duration: r.duration, sequence: '', enemyLevel: 0, nick: t.author,
      accent: colors[0] ?? '#e9c46a', characterLevel: 0, reaction: null,
      lanes: t.members.map((_, i) => ({ member: i, hits: hits.filter((h) => h.member === i) })),
    };
  };

  // mudou um filtro: volta para a primeira página
  useEffect(() => {
    setOffset(0);
  }, [q, personagem, versao]);

  useEffect(() => {
    if (!ONLINE_ENABLED) { setState('ok'); return; } // sem servidor configurado: só o aviso, sem ficar carregando
    let cancelled = false;
    setState('loading');
    // espera o usuário parar de digitar (só na primeira página)
    const t = setTimeout(() => {
      listTeams({ q, personagem, versao, offset, limit: PAGE })
        .then((r) => {
          if (cancelled) return;
          setItems((prev) => (offset === 0 ? r : [...prev, ...r]));
          setMore(r.length === PAGE);
          setState('ok');
        })
        .catch((e: Error) => {
          if (cancelled) return;
          setError(e.message);
          setState('error');
        });
    }, offset === 0 ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, personagem, versao, offset]);

  const filtered = !!(q || personagem || versao);

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page">
        <section className="dz-pagehead">
          <div className="titles">
            <h1 className="h1">Comunidade</h1>
            <span className="muted">Times e rotações publicados por qualquer pessoa, sem conta. Para publicar o seu, use “Compartilhar” em Times.</span>
          </div>
        </section>

        {!ONLINE_ENABLED && <p className="dz-error" role="alert">A galeria precisa do servidor do Astralys, que não está configurado neste site.</p>}

        <section className="vt-filters" aria-label="Filtros">
          <input className="dz-input" type="search" placeholder="Buscar por personagem, nome do time ou autor" aria-label="Buscar times" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="dz-input" aria-label="Personagem" value={personagem} onChange={(e) => setPersonagem(e.target.value)}>
            <option value="">Todos os personagens</option>
            {characters.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <input className="dz-input cm-ver" type="text" inputMode="decimal" placeholder="Versão (ex.: 5.8)" aria-label="Versão do jogo" value={versao} onChange={(e) => setVersao(e.target.value)} />
          {filtered && <button type="button" className="dz-btn" onClick={() => { setQ(''); setPersonagem(''); setVersao(''); }}>Limpar filtros</button>}
        </section>

        {state === 'error' && <p className="dz-error" role="alert">{error || 'Não consegui abrir a galeria.'}</p>}
        {state === 'ok' && ONLINE_ENABLED && items.length === 0 && (
          <div className="dz-panel cm-empty">
            <h2 className="h2">Nenhum time encontrado</h2>
            <p className="muted">{filtered ? 'Nenhum time publicado bate com esses filtros.' : 'Ainda não há times publicados. Seja o primeiro: compartilhe um time do seu Vault.'}</p>
          </div>
        )}

        <ul className="cm-list">
          {items.map((t) => {
            const model = modelOf(t);
            return (
              <li key={t.id} className="cm-item">
                {model ? (
                  <ScaledPoster format="portrait" size={LITE_SIZE}><PosterCard model={model} format="portrait" lite /></ScaledPoster>
                ) : (
                  <div className="dz-panel cm-nodata"><b>{t.nome}</b><span className="muted small">por {t.author}</span></div>
                )}
                <div className="cm-actions">
                  <button type="button" className="dz-btn gold" onClick={() => void utilizar(t.id)}>Utilizar</button>
                  <button type="button" className="dz-btn" onClick={() => void copiarLink(t.id)}>Copiar link</button>
                  {isAdmin && !ownedPublic(t.id) && <button type="button" className="dz-btn" onClick={() => removerAdmin(t.id)}>Remover (admin)</button>}
                  {ownedPublic(t.id) && <button type="button" className="dz-btn" onClick={() => void parar(t.id)}>Parar de compartilhar</button>}
                </div>
              </li>
            );
          })}
        </ul>

        {state === 'loading' && <p className="muted" role="status">Carregando…</p>}
        {state === 'ok' && more && <button type="button" className="dz-btn cm-loadmore" onClick={() => setOffset(items.length)}>Carregar mais</button>}
      </main>
    </div>
  );
}
