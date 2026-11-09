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
import { Menu } from '../design/Menu';
import { Segmented } from '../design/primitives';
import { POSTER_LABEL, type PosterFormat } from '../screens/card/PosterCard';
import { useSettings, type CardBg } from './settings';

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

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Engrenagem no cabeçalho: reúne as escolhas de visual para não ocupar espaço nas telas. */
function SettingsMenu() {
  const { cardBg, setCardBg, cardFormat, setCardFormat } = useSettings();
  return (
    <Menu label={<GearIcon />} ariaLabel="Configurações" className="dz-cfgbtn" align="right">
      {() => (
        <div className="dz-settings">
          <h2 className="dz-settings-title">Configurações</h2>
          <div className="dz-settings-group">
            <span>Fundo dos cards</span>
            <Segmented<CardBg> label="Fundo dos cards" value={cardBg} onChange={setCardBg} options={[{ value: 'color', label: 'Cor do personagem' }, { value: 'plain', label: 'Neutro' }]} />
          </div>
          <div className="dz-settings-group">
            <span>Card dos times</span>
            <Segmented<PosterFormat> label="Card dos times" value={cardFormat} onChange={setCardFormat} options={(Object.keys(POSTER_LABEL) as PosterFormat[]).map((f) => ({ value: f, label: POSTER_LABEL[f] }))} />
          </div>
        </div>
      )}
    </Menu>
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
        <SettingsMenu />
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
