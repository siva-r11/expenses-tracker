import { createContext, useContext, useState } from 'react';

const SESSION_KEY = 'expense-tracker.demo-session.v1';
const DEMO_USER = { name: 'Demo User', email: 'demo@example.com' };

export const DEMO_CREDENTIALS = {
  email: DEMO_USER.email,
  password: 'Expense123!',
};

const AuthContext = createContext(null);

function readSession() {
  let savedSession;
  try {
    savedSession = window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    return { user: null, error: 'Could not read your demo session. Allow browser session storage and try again.' };
  }
  if (savedSession === null) return { user: null, error: '' };
  if (savedSession !== 'demo') {
    return { user: null, error: 'The saved demo session is invalid. Please log in again.' };
  }
  return { user: DEMO_USER, error: '' };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  function login(email, password) {
    if (email.trim().toLowerCase() !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
      setSession((previous) => ({ ...previous, error: 'Email or password is incorrect.' }));
      return false;
    }
    try {
      window.sessionStorage.setItem(SESSION_KEY, 'demo');
    } catch {
      setSession((previous) => ({
        ...previous,
        error: 'Could not start your demo session. Allow browser session storage and try again.',
      }));
      return false;
    }
    setSession({ user: DEMO_USER, error: '' });
    return true;
  }

  function logout() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      setSession((previous) => ({
        ...previous,
        error: 'Could not end your demo session. Allow browser session storage and try again.',
      }));
      return false;
    }
    setSession({ user: null, error: '' });
    return true;
  }

  return (
    <AuthContext.Provider value={{ ...session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
