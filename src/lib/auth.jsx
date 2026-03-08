import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
}
