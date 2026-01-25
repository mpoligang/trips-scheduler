'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
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

export function AuthProvider({ children, initialSession }: { children: ReactNode, initialSession: Session | null }) {
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
    appRoutes.resetPassword // Fondamentale!
  ], [])

  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [status, setStatus] = useState<AuthStatus>(
    initialSession ? AuthStatusEnum.LOADING_PROFILE : AuthStatusEnum.INITIALIZING
  )

  // ✅ FORCELOGOUT BLINDATO: Non pulisce nulla se siamo su una rotta pubblica
  const forceLogout = useCallback(() => {
    const isPublic = publicRoutes.some(route => pathname.startsWith(route))

    if (typeof window !== 'undefined' && window.location.pathname.includes('reset-password')) {
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

    if (typeof window !== 'undefined') {
      window.location.href = appRoutes.login
    }
  }, [pathname, publicRoutes])

  const fetchUserData = useCallback(async (userId: string) => {
    if (isFetchingRef.current || lastFetchedUserId.current === userId) return
    isFetchingRef.current = true
    try {
      const { data, error } = await supabase.from('profiles').select(`*, plans:plan(*)`).eq('id', userId).maybeSingle()
      if (error) throw error
      if (data) {
        setUserData({ ...data, plan: data.plans } as UserData)
        lastFetchedUserId.current = userId
      }
      setStatus(AuthStatusEnum.AUTHENTICATED)
    } catch (err) {
      console.error("❌ Errore fetch profilo:", err)
      setStatus(AuthStatusEnum.AUTHENTICATED)
    } finally {
      isFetchingRef.current = false
    }
  }, [supabase])

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
    if (initialSession?.user && lastFetchedUserId.current !== initialSession.user.id) {
      fetchUserData(initialSession.user.id)
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
  }, [supabase, fetchUserData, initialSession, forceLogout, publicRoutes, pathname])

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