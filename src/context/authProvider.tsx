'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase/config';

// Definiamo il tipo per il valore del contesto
interface AuthContextType {
  user: User | null;
}

// Creiamo il contesto con un valore di default
const AuthContext = createContext<AuthContextType>({ user: null });

// Definiamo le props per il nostro provider
interface AuthProviderProps {
  children: ReactNode;
}

// Creiamo il componente Provider che gestirà lo stato
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // onAuthStateChanged è un listener di Firebase che si attiva
    // ogni volta che lo stato di autenticazione cambia (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Questa funzione di pulizia viene chiamata quando il componente viene smontato
    // per evitare memory leak
    return () => unsubscribe();
  }, []);

  const value = { user };

  // Non mostriamo i componenti figli finché non abbiamo verificato lo stato dell'utente.
  // Questo previene "sfarfallii" dell'interfaccia.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Creiamo un custom hook per accedere facilmente al contesto da qualsiasi componente
export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
