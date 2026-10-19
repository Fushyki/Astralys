/** Entrar ou criar conta. Só existe quando o site tem uma API configurada (VITE_API_URL). */
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { ONLINE_ENABLED } from '../online/config';
import { useSession } from '../online/session';
import './entrar.css';

export default function Entrar() {
  const navigate = useNavigate();
  const usuario = useSession((s) => s.usuario);
  const signIn = useSession((s) => s.signIn);
  const signUp = useSession((s) => s.signUp);
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ONLINE_ENABLED) return <Navigate to="/" replace />;
  if (usuario) return <Navigate to="/vault" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'criar') await signUp(nome.trim(), email.trim(), senha);
      else await signIn(email.trim(), senha);
      navigate('/vault');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page en-page">
        <form className="dz-panel en-form" onSubmit={submit} aria-label={mode === 'entrar' ? 'Entrar' : 'Criar conta'}>
          <h1 className="h1">{mode === 'entrar' ? 'Entrar' : 'Criar conta'}</h1>
          <p className="muted">Com uma conta, seus times ficam salvos fora deste navegador e você os abre em qualquer lugar.</p>

          <div className="en-tabs" role="tablist" aria-label="Escolha">
            <button type="button" role="tab" aria-selected={mode === 'entrar'} className="dz-btn" onClick={() => setMode('entrar')}>Já tenho conta</button>
            <button type="button" role="tab" aria-selected={mode === 'criar'} className="dz-btn" onClick={() => setMode('criar')}>Criar conta</button>
          </div>

          {mode === 'criar' && (
            <label className="dz-field">
              <span>Nome</span>
              <input className="dz-input" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" required minLength={2} maxLength={100} />
            </label>
          )}
          <label className="dz-field">
            <span>E-mail</span>
            <input className="dz-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          <label className="dz-field">
            <span>Senha</span>
            <input className="dz-input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete={mode === 'criar' ? 'new-password' : 'current-password'} required minLength={mode === 'criar' ? 8 : 1} maxLength={128} />
            {mode === 'criar' && <small className="muted">Pelo menos 8 caracteres. Senhas comuns são recusadas.</small>}
          </label>

          {error && <p className="dz-error" role="alert">{error}</p>}
          <button type="submit" className="dz-btn gold" disabled={busy}>{busy ? 'Aguarde…' : mode === 'entrar' ? 'Entrar' : 'Criar conta e entrar'}</button>
        </form>
      </main>
    </div>
  );
}
