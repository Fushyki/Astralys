/** Barra superior fixa: marca, abas de navegação e o botão "Salvar no Vault". */
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
  /** Dentro de um projeto, as abas do projeto aparecem. */
  projectId?: string;
  /** Personagem aberto na aba Personagens (para o link da aba). */
  memberName?: string;
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

export function AppHeader({ projectId, memberName, favorite, onToggleFavorite }: AppHeaderProps) {
  const { pathname } = useLocation();
  const base = projectId ? `/projeto/${projectId}` : '';
  const personagens = `${base}/personagem/${encodeURIComponent(memberName ?? '')}`;
  const onArmas = pathname.startsWith(`${base}/armas`);
  const onRecarga = pathname.startsWith(`${base}/recarga`);
  const tabs: { to: string; label: string; on: boolean; n?: number }[] = projectId
    ? [
        { to: base, label: 'Equipe', on: pathname === base, n: 1 },
        { to: personagens, label: 'Personagens', on: pathname.startsWith(`${base}/personagem`), n: 2 },
        { to: `${base}/rotacao`, label: 'Rotação e buffs', on: pathname.startsWith(`${base}/rotacao`), n: 3 },
        { to: `${base}/time`, label: 'Dano do time', on: pathname.startsWith(`${base}/time`), n: 4 },
        // Telas de apoio ganham uma aba só enquanto você está nelas; o resto fica no menu "Mais".
        ...(onArmas ? [{ to: `${base}/armas`, label: 'Armas e constelações', on: true }] : []),
        ...(onRecarga ? [{ to: `${base}/recarga`, label: 'Recarga', on: true }] : []),
        { to: '/vault', label: 'Vault', on: false },
      ]
    : [
        { to: '/recarga', label: 'Recarga', on: pathname.startsWith('/recarga') },
        { to: '/vault', label: 'Vault', on: pathname.startsWith('/vault') || pathname.startsWith('/card') },
      ];

  return (
    <header className="dz-header">
      <Link to="/" className="dz-brand" aria-label="Astralys, página inicial">
        <StarMark />
        <span>ASTRALYS</span>
      </Link>
      <nav className="dz-nav" aria-label="Navegação principal">
        {tabs.map((t) => (
          <Link key={t.label} to={t.to} aria-current={t.on ? 'page' : undefined}>
            {t.n ? <span className="step-n" aria-hidden="true">{t.n}</span> : null}
            {t.label}
          </Link>
        ))}
      </nav>
      {projectId && (
        <Menu label="Mais ▾" ariaLabel="Mais telas do projeto" className="dz-navbtn" align="left">
          {(close) => (
            <>
              <Link role="menuitem" className="dz-menu-item" to={`${base}/armas`} onClick={close}>Armas e constelações</Link>
              <Link role="menuitem" className="dz-menu-item" to={`${base}/recarga`} onClick={close}>Recarga de energia</Link>
              <Link role="menuitem" className="dz-menu-item" to={`/comparar?a=${projectId}`} onClick={close}>Comparar com outro time</Link>
              <Link role="menuitem" className="dz-menu-item" to={`/card/${projectId}`} onClick={close}>Card para compartilhar</Link>
            </>
          )}
        </Menu>
      )}
      {projectId && onToggleFavorite && (
        <button type="button" className="dz-btn" onClick={onToggleFavorite} aria-pressed={favorite}>
          {favorite ? 'Salvo no Vault' : 'Salvar no Vault'}
        </button>
      )}
      <Account />
    </header>
  );
}
