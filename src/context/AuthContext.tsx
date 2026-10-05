import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, getCurrentUser, getStoredToken, getStoredUser, login as apiLogin, register as apiRegister, logout as apiLogout, checkAndConsumeUrlSsoTicket } from '../services/auth';

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  syncStatus: CloudSyncStatus;
  setSyncStatus: (status: CloudSyncStatus) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('idle');

  // Ao iniciar a aplicação, valida tickets de SSO recebidos via URL ou sessão ativa no backend
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        // Verifica se há ticket de SSO de uso único vindo do Ametist
        const ssoUser = await checkAndConsumeUrlSsoTicket();
        if (ssoUser && isMounted) {
          setUser(ssoUser);
          setToken(getStoredToken());
          setSyncStatus('synced');
          return;
        }

        const currentUser = await getCurrentUser();
        if (isMounted) {
          if (currentUser) {
            setUser(currentUser);
            setToken(getStoredToken());
            setSyncStatus('synced');
          } else {
            setUser(null);
            setToken(null);
            setSyncStatus('offline');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Erro ao inicializar SSO:', err);
          setSyncStatus('offline');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await apiLogin(email, pass);
      setUser(res.usuario);
      setToken(res.access_token);
      setSyncStatus('synced');
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<void> => {
    setIsLoading(true);
    try {
      await apiRegister(name, email, pass);
      // Auto login logo após o cadastro
      const res = await apiLogin(email, pass);
      setUser(res.usuario);
      setToken(res.access_token);
      setSyncStatus('synced');
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiLogout();
      setUser(null);
      setToken(null);
      setSyncStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        login,
        register,
        logout,
        syncStatus,
        setSyncStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
