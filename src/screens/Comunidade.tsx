/** Galeria da comunidade (/comunidade): times publicados sem conta, com busca por personagem e a rotação de cada um. */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { elementColor } from '../design/elements';
import { CharacterAvatar } from '../design/primitives';
import { useSettings } from '../app/settings';
import { toast } from '../app/toast';
import { removeAsAdmin, unpublishPublic, useTeam } from '../features/community/publish';
import { ownedPublic } from '../features/community/published';
import { useGameData } from '../features/rotation/data';
import { listTeams, type CommunityTeam } from '../online/api';
import { ONLINE_ENABLED } from '../online/config';
import { formatDecimal } from '../ui/format';
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
            const r = t.resumo;
            const duration = Math.max(r?.duration ?? 0, 0.1);
            return (
              <li key={t.id} className="dz-panel cm-card">
                <header className="cm-head">
                  <b className="cm-name">{t.nome}</b>
                  <span className="muted small">por {t.author}{t.version ? ` · patch ${t.version}` : ''}</span>
                </header>
                <div className="cm-faces">
                  {t.members.map((n) => (
                    <span key={n} className="cm-face" title={n}>
                      <CharacterAvatar name={n} icon={characterOf(n)?.icon} color={elementColor(characterOf(n)?.element)} size={52} />
                    </span>
                  ))}
                </div>
                {r && (
                  <>
                    <div className="cm-tl" role="img" aria-label={`Linha do tempo da rotação: ${r.actionCount} golpes em ${formatDecimal(r.duration, 1)} segundos`}>
                      {r.members.map((m, mi) => {
                        const color = elementColor(characterOf(m.character)?.element);
                        const mine = r.sequence.filter((x) => x.member === mi);
                        return (
                          <div key={mi} className="cm-lane" style={{ ['--c' as string]: color }}>
                            <span className="cm-lane-n">{m.character}</span>
                            <span className="cm-track">
                              {mine.map((x, i) => (
                                <i key={i} title={`${x.label}${x.times > 1 ? ` ×${x.times}` : ''}${x.time !== undefined ? ` · ${formatDecimal(x.time, 1)} s` : ''}`}
                                  style={{ left: `${Math.min(97, ((x.time ?? (r.sequence.indexOf(x) / Math.max(1, r.sequence.length)) * duration) / duration) * 100)}%` }} />
                              ))}
                            </span>
                          </div>
                        );
                      })}
                      <div className="cm-axis num"><span>0 s</span><span>{formatDecimal(r.duration, 1)} s</span></div>
                    </div>
                    <div className="cm-kp">
                      <span><b className="num">{formatDecimal(r.duration, 1)}</b> s</span>
                      <span><b className="num">{r.actionCount}</b> golpes</span>
                    </div>
                  </>
                )}
                <footer className="cm-foot">
                  <button type="button" className="dz-btn gold" onClick={() => void utilizar(t.id)}>Utilizar</button>
                  <button type="button" className="dz-btn" onClick={() => void copiarLink(t.id)}>Copiar link</button>
                  {isAdmin && !ownedPublic(t.id) && <button type="button" className="dz-btn" onClick={() => removerAdmin(t.id)}>Remover (admin)</button>}
                  {ownedPublic(t.id) && <button type="button" className="dz-btn" onClick={() => void parar(t.id)}>Parar de compartilhar</button>}
                </footer>
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
