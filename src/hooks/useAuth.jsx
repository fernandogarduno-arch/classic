import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [perfil, setPerfil]   = useState(null)

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        setSession(null)
        return
      }
      setSession(session)
      fetchPerfil(session.user.id)
    })

    // Escuchar cambios de sesión (incluyendo refresh automático)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        setSession(session)
        return
      }
      if (event === 'SIGNED_OUT' || !session) {
        setSession(null)
        setPerfil(null)
        return
      }
      setSession(session)
      if (session?.user?.id) fetchPerfil(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchPerfil(userId) {
    const { data } = await supabase
      .from('perfiles_sistema')
      .select('*')
      .eq('user_id', userId)
      .single()
    setPerfil(data)
  }

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    setPerfil(null)
    return supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, perfil, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
