import { ComponentChildren, createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

import { API_ROUTES } from '../../shared/constants/api.const';
import { authService } from '../services/auth.service';

interface AuthContextType {
  // State
  userNameInput: string;
  isLoggedIn: boolean;
  currentUserId: string | null;
  currentUserName: string | null;
  isLoading: boolean;
  authError: string | null;

  // Actions
  setUserNameInput: (name: string) => void;
  login: () => Promise<void>;
  logout: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ComponentChildren;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [userNameInput, setUserNameInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize auth state on provider mount
  useEffect(() => {
    const lastUserName = authService.getUserName();
    if (lastUserName) {
      setUserNameInput(lastUserName);
    }

    // Check for existing user session on initial page load
    const session = authService.getSession();
    if (session) {
      setCurrentUserId(session.userId);
      setCurrentUserName(session.userName);
      setIsLoggedIn(true);
    }
  }, []);

  const login = async () => {
    if (!userNameInput.trim()) {
      setAuthError('Username cannot be empty.');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const response = await fetch(API_ROUTES.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: userNameInput.trim() }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Use the auth service to save the session
        authService.saveSession(data.sessionToken, data.userId, data.userName);
        
        // Update state
        setCurrentUserId(data.userId);
        setCurrentUserName(data.userName);
        setIsLoggedIn(true);
        setUserNameInput('');
      } else {
        setAuthError(data.message || 'Authentication failed.');
      }
    } catch (error) {
      setAuthError('An error occurred. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.clearAuthToken();
    setIsLoggedIn(false);
    setCurrentUserId(null);
    setCurrentUserName(null);
    setUserNameInput('');
    setAuthError(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const authValue: AuthContextType = {
    userNameInput,
    isLoggedIn,
    currentUserId,
    currentUserName,
    isLoading,
    authError,
    setUserNameInput,
    login,
    logout,
    clearAuthError,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}; 