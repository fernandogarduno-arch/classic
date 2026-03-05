import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AppAuthCtx = createContext(null)

export function AppAuthProvider({ children }) {
  const [session, setSession]   = useState(undefined)
  const [cliente, setCliente]   = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null)
      if (session) fetchCliente(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) { setSession(null); setCliente(null); return }
      setSession(session)
      fetchCliente(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchCliente(userId) {
    const { data } = await supabase
      .from('clientes')
      .select('id,nombre,apellidos,email,telefono,foto_url,total_clases,status')
      .eq('user_id', userId)
      .maybeSingle()
    setCliente(data)
  }

  async function signInGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null); setCliente(null)
  }

  return (
    <AppAuthCtx.Provider value={{ session, cliente, setCliente, signInGoogle, signOut, fetchCliente }}>
      {children}
    </AppAuthCtx.Provider>
  )
}

export const useAppAuth = () => useContext(AppAuthCtx)
