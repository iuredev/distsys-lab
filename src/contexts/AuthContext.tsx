import { createContext, useContext } from 'react';

interface AuthContextValue {
  user: { uid: string } | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: false });

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContext.Provider value={{ user: null, loading: false }}>{children}</AuthContext.Provider>;
}
