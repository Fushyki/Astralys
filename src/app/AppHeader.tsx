/** Barra superior fixa: marca, abas de navegação e o botão "Salvar no Vault". */
import { Link, useLocation } from 'react-router-dom';
import '../design/design.css';

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

export function AppHeader({ projectId, memberName, favorite, onToggleFavorite }: AppHeaderProps) {
  const { pathname } = useLocation();
  const base = projectId ? `/projeto/${projectId}` : '';
  const tabs: { to: string; label: string; on: boolean }[] = projectId
    ? [
        { to: base, label: 'Equipe', on: pathname === base },
        { to: `${base}/personagem/${encodeURIComponent(memberName ?? '')}`, label: 'Personagens', on: pathname.startsWith(`${base}/personagem`) },
        { to: `${base}/rotacao`, label: 'Rotação e buffs', on: pathname.startsWith(`${base}/rotacao`) },
        { to: `${base}/time`, label: 'Dano do time', on: pathname.startsWith(`${base}/time`) },
        { to: `${base}/armas`, label: 'Armas e constelações', on: pathname.startsWith(`${base}/armas`) },
        { to: `${base}/recarga`, label: 'Recarga', on: pathname.startsWith(`${base}/recarga`) },
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
            {t.label}
          </Link>
        ))}
      </nav>
      {projectId && onToggleFavorite && (
        <button type="button" className="dz-btn" onClick={onToggleFavorite} aria-pressed={favorite}>
          {favorite ? 'Salvo no Vault' : 'Salvar no Vault'}
        </button>
      )}
    </header>
  );
}
