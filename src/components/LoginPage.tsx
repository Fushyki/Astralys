import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Sparkles, AlertCircle, Check, LogOut, ExternalLink, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { isValidEmail, checkPasswordStrength } from '../utils/authValidators';
import { useAuth } from '../context/AuthContext';
import { syncOAuthUserWithBackend, buildAmetistSsoUrl } from '../services/auth';
import { ActiveTab } from './Header';
import '../index.css';

interface LoginPageProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, login, register, logout, syncStatus } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Estados de erro inline específicos por campo (Idêntico ao Ametist)
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Verificações de segurança de senha
  const passwordStrength = checkPasswordStrength(password);
  const { hasMinLength, hasUpper, hasNumber, hasSpecial, isValid: isPasswordSecure, missingRules } = passwordStrength;

  const clearErrors = () => {
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');
  };

  const switchTab = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setIsPasswordFocused(false);
    clearErrors();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    let hasError = false;

    // 1. Validação de E-mail
    if (!cleanEmail) {
      setEmailError('Por favor, informe seu e-mail.');
      hasError = true;
    } else if (!isValidEmail(cleanEmail)) {
      setEmailError('Por favor, insira um e-mail válido (ex: seu@email.com).');
      hasError = true;
    }

    // 2. Validação de Senha
    if (!cleanPassword) {
      setPasswordError('Por favor, digite sua senha.');
      hasError = true;
    } else if (isLogin) {
      if (cleanPassword.length < 6) {
        setPasswordError('A senha deve ter pelo menos 6 caracteres.');
        hasError = true;
      }
    } else {
      // Regras de Senha Forte no Cadastro
      if (!isPasswordSecure) {
        setPasswordError(`A senha precisa ter: ${missingRules.join(', ')}.`);
        hasError = true;
      }
    }

    // 3. Validação de Confirmação de Senha (Cadastro)
    if (!isLogin) {
      if (!confirmPassword) {
        setConfirmPasswordError('Por favor, confirme sua senha.');
        hasError = true;
      } else if (cleanPassword !== confirmPassword) {
        setConfirmPasswordError('As senhas não coincidem!');
        hasError = true;
      }
    }

    if (hasError) return;

    setLoading(true);
    
    try {
      if (isLogin) {
        // Tenta autenticação unificada Ametist & Astralys
        try {
          await login(cleanEmail, cleanPassword);
          onNavigate('dashboards');
        } catch (apiErr: any) {
          // Se falhar na API direta, tenta autenticar no Supabase (caso a conta tenha sido criada originalmente no Ametist)
          const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({ 
            email: cleanEmail, 
            password: cleanPassword 
          });
          
          if (supaError || !supaData?.user?.email) {
            setPasswordError('Senha incorreta ou e-mail não cadastrado.');
            return;
          }

          // Sincroniza usuário do Ametist para o banco Astralys
          await syncOAuthUserWithBackend({
            email: supaData.user.email,
            nome: supaData.user.user_metadata?.full_name || supaData.user.email.split('@')[0],
            avatar_url: supaData.user.user_metadata?.avatar_url
          });

          onNavigate('dashboards');
        }
      } else {
        // Cadastro unificado no ecossistema
        const defaultName = cleanEmail.split('@')[0];
        try {
          await register(defaultName, cleanEmail, cleanPassword);
          onNavigate('dashboards');
        } catch (regErr: any) {
          // Se já existir ou der erro no backend, tenta via Supabase
          const { data: supaReg, error: supaRegErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPassword
          });

          if (supaRegErr) {
            if (supaRegErr.message.toLowerCase().includes('email')) {
              setEmailError(supaRegErr.message);
            } else {
              setPasswordError(supaRegErr.message || 'Erro ao criar conta.');
            }
            return;
          }

          if (supaReg?.user?.email) {
            await syncOAuthUserWithBackend({
              email: supaReg.user.email,
              nome: defaultName
            });
            onNavigate('dashboards');
          }
        }
      }
    } catch (err: any) {
      setGeneralError('Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      clearErrors();
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setGeneralError('Erro no login do Google: ' + err.message);
      setLoading(false);
    }
  };

  const handleOpenAmetistSso = async () => {
    try {
      const url = await buildAmetistSsoUrl();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.open('https://ametist-tier-maker.vercel.app', '_blank', 'noopener,noreferrer');
    }
  };

  // Se o usuário JÁ estiver logado no ecossistema, exibe o cartão de perfil conectado
  if (isAuthenticated && user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 110px)', padding: '30px 15px' }}>
        <div 
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'rgba(20, 20, 24, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '24px',
            padding: '35px 28px',
            border: '1px solid rgba(176, 98, 235, 0.25)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(176, 98, 235, 0.12)',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
        >
          {/* Logo Ametist */}
          <div style={{ display: 'inline-flex', padding: '10px', background: 'rgba(176, 98, 235, 0.1)', borderRadius: '16px', marginBottom: '12px', border: '1px solid rgba(176, 98, 235, 0.2)' }}>
            <img src="/ametist-logo.png" alt="Ametist Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          </div>

          <h1 style={{ color: '#fff', fontSize: '1.5rem', margin: '0 0 6px 0', fontWeight: '700' }}>
            Sua Conta Unificada
          </h1>
          <p style={{ color: '#8e8e99', fontSize: '0.85rem', margin: '0 0 20px 0' }}>
            Conectado ao ecossistema Ametist & Astralys
          </p>

          {/* User Bio Card */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              borderRadius: '16px',
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid #2a2a30',
              marginBottom: '20px',
              textAlign: 'left'
            }}
          >
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.nome} 
                style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #b062eb' }} 
              />
            ) : (
              <div 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, #b062eb, #7b2cbf)', 
                  color: '#fff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: '700', 
                  fontSize: '1.2rem' 
                }}
              >
                {user.nome.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.nome}
              </div>
              <div style={{ color: '#8e8e99', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              <div style={{ color: '#4ade80', fontSize: '0.75rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></span>
                Nuvem Ativa ({syncStatus === 'syncing' ? 'Sincronizando' : 'Sincronizado'})
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={() => onNavigate('dashboards')}
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #b062eb, #7b2cbf)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(176, 98, 235, 0.35)',
                transition: 'all 0.25s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span>Ir para os Dashboards Astralys</span>
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={handleOpenAmetistSso}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#d8b4fe',
                border: '1px solid rgba(176, 98, 235, 0.3)',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(176, 98, 235, 0.15)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <ExternalLink size={16} />
              <span>Abrir Ametist Hub com SSO</span>
            </button>

            <button
              type="button"
              onClick={logout}
              style={{
                width: '100%',
                padding: '11px',
                background: 'transparent',
                color: '#ff6b6b',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '6px'
              }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              <LogOut size={15} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TELA DE LOGIN IDÊNTICA DO AMETIST
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 110px)', padding: '30px 15px' }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(20, 20, 24, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '24px',
          padding: '35px 28px',
          border: '1px solid rgba(176, 98, 235, 0.25)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(176, 98, 235, 0.12)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ display: 'inline-flex', padding: '10px', background: 'rgba(176, 98, 235, 0.1)', borderRadius: '16px', marginBottom: '12px', border: '1px solid rgba(176, 98, 235, 0.2)' }}>
            <img src="/ametist-logo.png" alt="Ametist Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.7rem', margin: '0 0 6px 0', fontWeight: '700' }}>
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <p style={{ color: '#8e8e99', fontSize: '0.9rem', margin: 0 }}>
            {isLogin ? 'Acesse suas Tier Lists e modelos salvos' : 'Junte-se ao Ametist e salve suas criações na nuvem'}
          </p>
        </div>

        {/* Abas Alternadoras (Segmented Control) */}
        <div 
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.45)',
            padding: '5px',
            borderRadius: '14px',
            marginBottom: '25px',
            border: '1px solid #2a2a30'
          }}
        >
          <button
            type="button"
            onClick={() => switchTab(true)}
            style={{
              flex: 1,
              padding: '11px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: isLogin ? '700' : '500',
              color: isLogin ? '#ffffff' : '#888899',
              background: isLogin ? 'linear-gradient(135deg, #b062eb, #8338ec)' : 'transparent',
              boxShadow: isLogin ? '0 4px 15px rgba(176, 98, 235, 0.35)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.25s ease'
            }}
          >
            <LogIn size={17} />
            Entrar
          </button>

          <button
            type="button"
            onClick={() => switchTab(false)}
            style={{
              flex: 1,
              padding: '11px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: !isLogin ? '700' : '500',
              color: !isLogin ? '#ffffff' : '#888899',
              background: !isLogin ? 'linear-gradient(135deg, #b062eb, #8338ec)' : 'transparent',
              boxShadow: !isLogin ? '0 4px 15px rgba(176, 98, 235, 0.35)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.25s ease'
            }}
          >
            <UserPlus size={17} />
            Criar Conta
          </button>
        </div>

        {/* Botão Rápido do Google */}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          style={{ 
            width: '100%',
            padding: '13px 16px', 
            backgroundColor: '#ffffff', 
            color: '#1f1f23', 
            border: 'none', 
            borderRadius: '12px', 
            fontWeight: '600', 
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
            marginBottom: '20px'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f3f5'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
          Continuar com Google
        </button>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#2d2d35' }}></div>
          <span style={{ padding: '0 12px', color: '#6e6e7d', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ou use e-mail
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#2d2d35' }}></div>
        </div>

        {/* Erro Geral (se houver) */}
        {generalError && (
          <div className="input-error-badge" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '15px' }}>
            <AlertCircle size={15} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Formulário Principal */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Campo E-mail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label style={{ color: '#b5b5c3', fontSize: '0.85rem', fontWeight: '500' }}>E-mail</label>
            
            {/* Notificação personalizada em cima do box de E-mail */}
            {emailError && (
              <div className="input-error-badge">
                <AlertCircle size={14} />
                <span>{emailError}</span>
              </div>
            )}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', color: emailError ? '#ff6b6b' : '#6e6e7d' }} />
              <input 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                required
                style={{ 
                  width: '100%',
                  padding: '13px 14px 13px 42px', 
                  borderRadius: '12px', 
                  border: emailError ? '1px solid #ff4d4f' : '1px solid #33333d', 
                  background: 'rgba(10, 10, 12, 0.6)', 
                  color: 'white', 
                  outline: 'none', 
                  fontSize: '0.95rem',
                  boxShadow: emailError ? '0 0 10px rgba(255, 77, 79, 0.3)' : 'none',
                  transition: 'border-color 0.25s, box-shadow 0.25s'
                }}
                onFocus={(e) => {
                  if (!emailError) {
                    e.target.style.borderColor = '#b062eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(176, 98, 235, 0.15)';
                  }
                }}
                onBlur={(e) => {
                  if (!emailError) {
                    e.target.style.borderColor = '#33333d';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
            <label style={{ color: '#b5b5c3', fontSize: '0.85rem', fontWeight: '500' }}>Senha</label>
            
            {/* Notificação personalizada em cima do box da Senha */}
            {passwordError && (
              <div className="input-error-badge">
                <AlertCircle size={14} />
                <span>{passwordError}</span>
              </div>
            )}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', color: passwordError ? '#ff6b6b' : '#6e6e7d' }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder={isLogin ? 'Sua senha' : 'Mínimo 8 caracteres'} 
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                onFocus={(e) => {
                  setIsPasswordFocused(true);
                  if (!passwordError) {
                    e.target.style.borderColor = '#b062eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(176, 98, 235, 0.15)';
                  }
                }}
                onBlur={(e) => {
                  setIsPasswordFocused(false);
                  if (!passwordError) {
                    e.target.style.borderColor = '#33333d';
                    e.target.style.boxShadow = 'none';
                  }
                }}
                required
                style={{ 
                  width: '100%',
                  padding: '13px 44px 13px 42px', 
                  borderRadius: '12px', 
                  border: passwordError ? '1px solid #ff4d4f' : '1px solid #33333d', 
                  background: 'rgba(10, 10, 12, 0.6)', 
                  color: 'white', 
                  outline: 'none', 
                  fontSize: '0.95rem',
                  boxShadow: passwordError ? '0 0 10px rgba(255, 77, 79, 0.3)' : 'none',
                  transition: 'border-color 0.25s, box-shadow 0.25s'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#6e6e7d',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Checklist Visual de Requisitos de Senha (Apenas ao clicar no box de senha em Cadastro) */}
            {!isLogin && isPasswordFocused && (
              <div 
                style={{ 
                  background: 'rgba(0, 0, 0, 0.35)', 
                  padding: '10px 12px', 
                  borderRadius: '10px', 
                  marginTop: '4px',
                  border: '1px solid #2a2a30',
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '6px',
                  animation: 'fadeIn 0.2s ease-in-out'
                }}
              >
                <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', color: hasMinLength ? '#4ade80' : '#8e8e99', fontWeight: hasMinLength ? '600' : '400', transition: 'all 0.2s' }}>
                  {hasMinLength ? <Check size={13} color="#4ade80" /> : <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#666' }} />}
                  8+ caracteres
                </span>
                <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', color: hasUpper ? '#4ade80' : '#8e8e99', fontWeight: hasUpper ? '600' : '400', transition: 'all 0.2s' }}>
                  {hasUpper ? <Check size={13} color="#4ade80" /> : <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#666' }} />}
                  1 maiúscula (A-Z)
                </span>
                <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', color: hasNumber ? '#4ade80' : '#8e8e99', fontWeight: hasNumber ? '600' : '400', transition: 'all 0.2s' }}>
                  {hasNumber ? <Check size={13} color="#4ade80" /> : <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#666' }} />}
                  1 número (0-9)
                </span>
                <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', color: hasSpecial ? '#4ade80' : '#8e8e99', fontWeight: hasSpecial ? '600' : '400', transition: 'all 0.2s' }}>
                  {hasSpecial ? <Check size={13} color="#4ade80" /> : <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#666' }} />}
                  1 especial (!@#$)
                </span>
              </div>
            )}
          </div>

          {/* Campo Confirmar Senha (Apenas em Cadastro) */}
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
              <label style={{ color: '#b5b5c3', fontSize: '0.85rem', fontWeight: '500' }}>Confirmar Senha</label>
              
              {/* Notificação personalizada em cima do box de Confirmação */}
              {confirmPasswordError && (
                <div className="input-error-badge">
                  <AlertCircle size={14} />
                  <span>{confirmPasswordError}</span>
                </div>
              )}

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', color: confirmPasswordError ? '#ff6b6b' : '#6e6e7d' }} />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="Digite novamente sua senha" 
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError('');
                  }}
                  required
                  style={{ 
                    width: '100%',
                    padding: '13px 44px 13px 42px', 
                    borderRadius: '12px', 
                    border: confirmPasswordError ? '1px solid #ff4d4f' : '1px solid #33333d', 
                    background: 'rgba(10, 10, 12, 0.6)', 
                    color: 'white', 
                    outline: 'none', 
                    fontSize: '0.95rem',
                    boxShadow: confirmPasswordError ? '0 0 10px rgba(255, 77, 79, 0.3)' : 'none',
                    transition: 'border-color 0.25s, box-shadow 0.25s'
                  }}
                  onFocus={(e) => {
                    if (!confirmPasswordError) {
                      e.target.style.borderColor = '#b062eb';
                      e.target.style.boxShadow = '0 0 0 3px rgba(176, 98, 235, 0.15)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!confirmPasswordError) {
                      e.target.style.borderColor = '#33333d';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#6e6e7d',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showConfirmPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}
          
          {/* Botão de Envio */}
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              padding: '14px', 
              background: 'linear-gradient(135deg, #b062eb, #7b2cbf)', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: '700', 
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 18px rgba(176, 98, 235, 0.35)'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 22px rgba(176, 98, 235, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 18px rgba(176, 98, 235, 0.35)';
            }}
          >
            {loading ? (
              'Processando...'
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                Entrar no Ametist
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Criar Minha Conta Gratuita
              </>
            )}
          </button>
        </form>

        {/* Rodapé / Alternador Secundário */}
        <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => switchTab(!isLogin)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#8e8e99', 
              cursor: 'pointer', 
              fontSize: '0.9rem',
              transition: 'color 0.2s' 
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#8e8e99'}
          >
            {isLogin ? (
              <>Não tem uma conta? <span style={{ color: '#b062eb', fontWeight: 'bold' }}>Cadastre-se gratuitamente</span></>
            ) : (
              <>Já tem uma conta? <span style={{ color: '#b062eb', fontWeight: 'bold' }}>Fazer login</span></>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => onNavigate('landing')} 
            style={{ background: 'none', border: 'none', color: '#555566', cursor: 'pointer', fontSize: '0.85rem', transition: 'color 0.2s' }} 
            onMouseOver={(e) => e.currentTarget.style.color = '#aaaabb'} 
            onMouseOut={(e) => e.currentTarget.style.color = '#555566'}
          >
            ← Voltar para a Página Inicial
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
