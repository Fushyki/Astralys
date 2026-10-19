/**
 * Barra superior fixa, igual em todas as telas: Times · Personagens · Inventário · Otimizador · Ferramentas.
 * Dentro de um time aparece uma faixa com as 3 telas dele: Equipe (com os personagens), Rotação e Dano do time.
 */
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../design/design.css';
import { Menu } from '../design/Menu';
import { ONLINE_ENABLED } from '../online/config';
import { useSession } from '../online/session';

export function StarMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#E9C46A" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />
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
  const onOtimizador = pathname === '/otimizador' || pathname.startsWith(`${base}/otimizador`) && !!projectId;
  const nav: { to: string; label: string; on: boolean }[] = [
    { to: '/vault', label: 'Times', on: !onOtimizador && (pathname.startsWith('/vault') || pathname.startsWith('/projeto') || pathname.startsWith('/card') || pathname.startsWith('/comparar') || pathname.startsWith('/novo')) },
    { to: '/personagens', label: 'Personagens', on: pathname.startsWith('/personagens') },
    { to: '/inventario', label: 'Inventário', on: pathname.startsWith('/inventario') },
    { to: projectId ? `${base}/otimizador/${encodeURIComponent(memberName ?? '')}` : '/otimizador', label: 'Otimizador', on: onOtimizador },
  ];
  const tabs = projectId
    ? [
        { to: base, label: 'Equipe', on: pathname === base || pathname.startsWith(`${base}/personagem`) || pathname.startsWith(`${base}/armas`) },
        { to: `${base}/rotacao`, label: 'Rotação e buffs', on: pathname.startsWith(`${base}/rotacao`) },
        { to: `${base}/time`, label: 'Dano do time', on: pathname.startsWith(`${base}/time`) },
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
          <Menu label="Ferramentas ▾" ariaLabel="Ferramentas" className="dz-navbtn" align="left">
            {(close) => (
              <>
                <Link role="menuitem" className="dz-menu-item" to={projectId ? `${base}/recarga` : '/recarga'} onClick={close}>Recarga de energia</Link>
                <Link role="menuitem" className="dz-menu-item" to={projectId ? `/comparar?a=${projectId}` : '/comparar'} onClick={close}>Comparar dois times</Link>
                {projectId && <Link role="menuitem" className="dz-menu-item" to={`${base}/armas`} onClick={close}>Armas e constelações</Link>}
                {projectId && <Link role="menuitem" className="dz-menu-item" to={`/card/${projectId}`} onClick={close}>Card para compartilhar</Link>}
              </>
            )}
          </Menu>
        </nav>
        <Account />
      </header>
      {projectId && (
        <div className="dz-subnav" aria-label="Telas do time">
          <Link to="/vault" className="back">‹ Times</Link>
          <span className="name" title={projectName}>{projectName}</span>
          <nav aria-label="Telas do time">
            {tabs.map((t, i) => (
              <Link key={t.label} to={t.to} aria-current={t.on ? 'page' : undefined}>
                <span className="step-n" aria-hidden="true">{i + 1}</span>
                {t.label}
              </Link>
            ))}
          </nav>
          {onToggleFavorite && (
            <button type="button" className="dz-btn" onClick={onToggleFavorite} aria-pressed={favorite}>
              {favorite ? 'Salvo nos Times' : 'Salvar nos Times'}
            </button>
          )}
        </div>
      )}
    </>
  );
}
