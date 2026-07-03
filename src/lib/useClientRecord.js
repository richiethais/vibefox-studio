import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './useAuth'

// Module-level cache so navigating between portal pages doesn't refetch the
// client row on every mount. Keyed by user id; cleared on sign-out/user swap.
let cachedUserId = null
let cachedClient = null
let pendingFetch = null

export function clearClientRecordCache() {
  cachedUserId = null
  cachedClient = null
  pendingFetch = null
}

async function fetchClientRecord(userId) {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, company, phone, plan, status, created_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

// Returns { client, clientId, loading, error } for the signed-in user.
export function useClientRecord() {
  const session = useAuth()
  const userId = session?.user?.id ?? null
  const [state, setState] = useState(() => ({
    client: userId && cachedUserId === userId ? cachedClient : null,
    loading: !(userId && cachedUserId === userId),
    error: null,
  }))

  useEffect(() => {
    if (!userId) return
    if (cachedUserId === userId) {
      const timer = window.setTimeout(() => {
        setState({ client: cachedClient, loading: false, error: null })
      }, 0)
      return () => window.clearTimeout(timer)
    }

    let active = true
    if (!pendingFetch) {
      pendingFetch = fetchClientRecord(userId)
        .then(client => {
          cachedUserId = userId
          cachedClient = client
          pendingFetch = null
          return client
        })
        .catch(err => {
          pendingFetch = null
          throw err
        })
    }

    pendingFetch
      .then(client => { if (active) setState({ client, loading: false, error: null }) })
      .catch(err => { if (active) setState({ client: null, loading: false, error: err }) })

    return () => { active = false }
  }, [userId])

  return { client: state.client, clientId: state.client?.id ?? null, loading: state.loading, error: state.error }
}
