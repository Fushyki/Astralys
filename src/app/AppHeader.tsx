/**
 * Barra superior fixa, igual em todas as telas: Times · Personagens · Inventário · Recarga · Comparar (e, dentro de um time, Armas e Card).
 * Dentro de um time aparece uma faixa com as 3 telas dele: Equipe, Personagens e Rotação e buffs.
 */
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../design/design.css';
import { ONLINE_ENABLED } from '../online/config';
import { useSession } from '../online/session';
import { ButtonLink } from '../design/Button';

/** Marca do Astralys: três fios (os buffs) que convergem num ponto (o golpe). Ver `public/favicon.svg`. */
export function StarMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#E9C46A" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <path d="M2 4.5C9 4.5 9 12 15 12" opacity=".6" />
      <path d="M2 12H15" />
      <path d="M2 19.5C9 19.5 9 12 15 12" opacity=".6" />
      <circle cx="18" cy="12" r="3.8" fill="#E9C46A" stroke="none" />
    </svg>
  );
}

export interface AppHeaderProps {
  /** Dentro de um time, a faixa do time aparece. */
  projectId?: string;
  /** Personagem aberto no time (para o atalho do Otimizador). */
  memberName?: string;
  /** Nome do time, para a faixa. */
  projectName?: string;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}

/** Entrar / nome da conta e Sair; só aparece quando o site tem API configurada. */
function Account() {
  const usuario = useSession((s) => s.usuario);
  const signOut = useSession((s) => s.signOut);
  const restore = useSession((s) => s.restore);
  useEffect(() => {
    void restore();
  }, [restore]);
  if (!ONLINE_ENABLED) return null;
  if (!usuario) return <Link to="/entrar" className="dz-btn">Entrar</Link>;
  return (
    <span className="dz-account">
      <span className="dz-account-name" title={usuario.email}>{usuario.nome}</span>
      <button type="button" className="dz-btn" onClick={() => void signOut()}>Sair</button>
    </span>
  );
}

export function AppHeader({ projectId, memberName, projectName, favorite, onToggleFavorite }: AppHeaderProps) {
  const { pathname } = useLocation();
  const base = projectId ? `/projeto/${projectId}` : '';
  const nav: { to: string; label: string; on: boolean }[] = [
    { to: '/vault', label: 'Times', on: pathname.startsWith('/vault') || pathname.startsWith('/novo') || (pathname.startsWith('/projeto') && !pathname.startsWith(`${base}/armas`) && !pathname.startsWith(`${base}/recarga`)) },
    { to: '/personagens', label: 'Personagens', on: pathname.startsWith('/personagens') },
    { to: '/inventario', label: 'Inventário', on: pathname.startsWith('/inventario') },
    { to: projectId ? `${base}/recarga` : '/recarga', label: 'Recarga', on: pathname.endsWith('/recarga') },
    { to: projectId ? `/comparar?a=${projectId}` : '/comparar', label: 'Comparar', on: pathname.startsWith('/comparar') },
    ...(projectId
      ? [
          { to: `${base}/armas`, label: 'Armas', on: pathname.startsWith(`${base}/armas`) },
          { to: `/card/${projectId}`, label: 'Card', on: pathname.startsWith('/card') },
        ]
      : []),
  ];
  const tabs = projectId
    ? [
        { to: base, label: 'Equipe', on: pathname === base },
        { to: memberName ? `${base}/personagem/${encodeURIComponent(memberName)}` : base, label: 'Personagens', on: pathname.startsWith(`${base}/personagem`) },
        { to: `${base}/rotacao`, label: 'Rotação e buffs', on: pathname.startsWith(`${base}/rotacao`) },
      ]
    : [];

  return (
    <>
      <header className="dz-header">
        <Link to="/" className="dz-brand" aria-label="Astralys, página inicial">
          <StarMark />
          <span>ASTRALYS</span>
        </Link>
        <nav className="dz-nav" aria-label="Navegação principal">
          {nav.map((t) => (
            <Link key={t.label} to={t.to} aria-current={t.on ? 'page' : undefined}>{t.label}</Link>
          ))}
        </nav>
        <Account />
      </header>
      {projectId && (
        <div className="dz-subnav" aria-label="Telas do time">
          <ButtonLink variant="ghost" size="sm" to="/vault">‹ Times</ButtonLink>
          <span className="name" title={projectName}>{projectName}</span>
          <nav aria-label="Telas do time">
            {tabs.map((t, i) => (
              <Link key={t.label} to={t.to} aria-current={t.on ? 'page' : undefined}>
                {i + 1} · {t.label}
              </Link>
            ))}
          </nav>
          {onToggleFavorite && (
            <button type="button" className="dz-btn" onClick={onToggleFavorite} aria-pressed={favorite}>
              <span aria-hidden="true" className="star">{favorite ? '★' : '☆'}</span>
              <span className="lbl">{favorite ? 'Salvo nos Times' : 'Salvar nos Times'}</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
