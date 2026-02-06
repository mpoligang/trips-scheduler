'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { UserData } from '@/models/UserData'
import { createClient } from '@/lib/client'
import { AuthStatus, AuthStatusEnum, AuthStateChangeEventEnum } from '@/models/Auth'
import { usePathname } from 'next/navigation'
import { appRoutes } from '@/utils/appRoutes'

interface AuthContextType {
  user: User | null
  userData: UserData | null
  status: AuthStatus
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children, initialUser }: { children: ReactNode, initialUser: User | null }) {
  const supabase = useMemo(() => createClient(), [])
  const pathname = usePathname()

  // Ref per evitare loop infiniti di fetch
  const isFetchingRef = useRef(false)
  const lastFetchedUserId = useRef<string | null>(null)

  // Lista rotte pubbliche centralizzata per consistenza
  const publicRoutes = useMemo(() => [
    appRoutes.login,
    appRoutes.register,
    appRoutes.forgotPassword,
    appRoutes.verifyEmail,
    appRoutes.privacy,
    appRoutes.landing,
    appRoutes.registrationSuccess,
    appRoutes.processFailed,
    appRoutes.passwordUpdatedSuccess,
    appRoutes.resetPassword // Fondamentale!
  ], [])

  const [user, setUser] = useState<User | null>(initialUser);
  const [userData, setUserData] = useState<UserData | null>(null)
  const [status, setStatus] = useState<AuthStatus>(
    initialUser ? AuthStatusEnum.LOADING_PROFILE : AuthStatusEnum.INITIALIZING
  )

  // ✅ FORCELOGOUT BLINDATO: Non pulisce nulla se siamo su una rotta pubblica
  const forceLogout = useCallback(() => {
    const isPublic = publicRoutes.some(route => pathname.startsWith(route))

    if (typeof globalThis !== 'undefined' && globalThis.location.pathname.includes('reset-password')) {
      console.log("🛑 BYPASS: Sono in reset-password, non pulisco nulla!");
      return;
    }

    // Se siamo su una rotta pubblica (come reset-password), NON svuotiamo lo stato
    // altrimenti cancelliamo la sessione appena creata dal server
    if (isPublic) {
      console.log("🛡️ AuthProvider: Siamo su rotta pubblica, blocco forceLogout.")
      return
    }

    console.log("🚪 AuthProvider: Eseguo logout completo.")
    setUser(null)
    setUserData(null)
    setStatus(AuthStatusEnum.UNAUTHENTICATED)

    if (typeof globalThis !== 'undefined') {
      globalThis.location.href = appRoutes.login
    }
  }, [pathname, publicRoutes])
  const fetchUserData = useCallback(async (userId: string) => {
    // Evita chiamate duplicate
    if (isFetchingRef.current || lastFetchedUserId.current === userId) return;

    isFetchingRef.current = true;

    try {
      // 1. ✅ STEP SICUREZZA: Usiamo la RPC invece della Select diretta
      // La select diretta fallirebbe perché non hai i permessi di lettura su 'email' e 'plan'
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_my_private_profile')
        .maybeSingle();


      if (profileError) { throw profileError; }

      if (profileData) {
        // 2. Recuperiamo i dettagli del piano
        // La RPC ci dà solo l'ID (es. 'free'), ma la tua UI probabilmente vuole l'oggetto intero.
        // La tabella 'plans' è pubblica, quindi possiamo leggerla direttamente.
        let planDetails = null;

        const profile = profileData as UserData;

        if (profile.plan) {
          const { data: planData } = await supabase
            .from('plans')
            .select('*')
            .eq('id', profile.plan)
            .single();
          planDetails = planData;
        }

        // 3. Uniamo i dati per matchare la tua interfaccia UserData
        setUserData({
          ...profile,
          plan: planDetails,
        } as unknown as UserData);

        lastFetchedUserId.current = userId;
      }

      setStatus(AuthStatusEnum.AUTHENTICATED);
    } catch (err) {
      console.error("❌ Errore fetch profilo:", err);
      // Anche se fallisce il profilo, l'utente è tecnicamente autenticato su Auth
      setStatus(AuthStatusEnum.AUTHENTICATED);
    } finally {
      isFetchingRef.current = false;
    }
  }, [supabase]);

  // 1. WATCHDOG NAVIGAZIONE: Ignora le rotte pubbliche
  useEffect(() => {
    const checkAuth = async () => {
      const isPublic = publicRoutes.some(route => pathname.startsWith(route))
      if (isPublic) return

      const { data: { user: verifiedUser } } = await supabase.auth.getUser()
      if (!verifiedUser) {
        forceLogout();
      }
    }
    checkAuth()
  }, [pathname, publicRoutes, supabase, forceLogout])

  // 2. GESTIONE EVENTI AUTH: Cruciale per PASSWORD_RECOVERY
  useEffect(() => {
    if (initialUser && lastFetchedUserId.current !== initialUser.id) {
      fetchUserData(initialUser.id)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔑 Auth Event: ${event}`)
      const isPublic = publicRoutes.some(route => pathname.startsWith(route))
      const isRecovery = event === AuthStateChangeEventEnum.PASSWORD_RECOVERY

      if (session?.user) {
        setUser(session.user)
        const shouldFetch =
          event === AuthStateChangeEventEnum.SIGNED_IN ||
          event === AuthStateChangeEventEnum.TOKEN_REFRESHED ||
          isRecovery ||
          (event === AuthStateChangeEventEnum.INITIAL_SESSION && lastFetchedUserId.current !== session.user.id);

        if (shouldFetch) {
          setStatus(AuthStatusEnum.LOADING_PROFILE)
          await fetchUserData(session.user.id)
        }
      } else {
        // ✅ Evitiamo di sloggare durante l'inizializzazione su rotte pubbliche
        if (event === AuthStateChangeEventEnum.SIGNED_OUT || (event === AuthStateChangeEventEnum.INITIAL_SESSION && !isPublic)) {
          forceLogout()
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchUserData, initialUser, forceLogout, publicRoutes, pathname])

  const value = useMemo(() => ({
    user,
    userData,
    status,
    refreshUserData: async () => {
      if (user) {
        lastFetchedUserId.current = null;
        await fetchUserData(user.id);
      }
    }
  }), [user, userData, status, fetchUserData])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve essere usato in AuthProvider')
  return context
}