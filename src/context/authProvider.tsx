'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserData } from '@/models/UserData'; // Assicurati che il percorso sia corretto
import { auth, db } from '@/firebase/config';
import { EntityKeys } from '@/utils/entityKeys';
import { useRouter } from 'next/navigation';
import { appRoutes } from '@/utils/appRoutes';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
        router.push(appRoutes.login);
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, EntityKeys.usersKey, user.uid);

      const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data() as UserData);
        } else {
          console.log("Nessun documento utente trovato in Firestore per l'UID:", user.uid);
          setUserData(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Errore con onSnapshot:", error);
        setUserData(null);
        setLoading(false);
      });

      return () => unsubscribeFirestore();
    }
  }, [user]);


  const value = useMemo(() => ({ user, userData, loading }), [user, userData, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
};

