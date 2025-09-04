'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserData } from '@/models/UserData'; // Assicurati che il percorso sia corretto
import { auth, db } from '@/firebase/config';

// La forma del valore del contesto
interface AuthContextType {
  user: User | null; // L'utente originale di Firebase auth
  userData: UserData | null; // I dati utente personalizzati da Firestore
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener per lo stato di autenticazione di Firebase
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Se l'utente si disconnette, resetta i dati e smetti di caricare
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
      }
    });

    // Pulisce il listener quando il componente viene smontato
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Questo effetto si attiva solo quando c'è un utente loggato
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);

      // onSnapshot ascolta le modifiche al documento dell'utente in tempo reale
      const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          // Se il documento esiste, imposta i dati dell'utente
          setUserData(doc.data() as UserData);
        } else {
          // Se non esiste, imposta i dati a null
          console.log("Nessun documento utente trovato in Firestore per l'UID:", user.uid);
          setUserData(null);
        }
        setLoading(false); // Il caricamento è completo
      }, (error) => {
        console.error("Errore con onSnapshot:", error);
        setUserData(null);
        setLoading(false);
      });

      // Pulisce il listener di Firestore quando l'utente cambia o si disconnette
      return () => unsubscribeFirestore();
    }
  }, [user]); // Si riattiva ogni volta che l'oggetto 'user' cambia


  const value = { user, userData, loading };

  // Non renderizza l'app finché non si è verificato lo stato iniziale dell'utente
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizzato per usare il contesto in modo semplice e sicuro
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
};

