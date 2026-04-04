import { createClient } from '@supabase/supabase-js'

const AUTH_PERSISTENCE_KEY = 'vf_auth_persistence_mode'
const LOCAL_MODE = 'local'
const SESSION_MODE = 'session'

function getStorage(mode) {
  if (typeof window === 'undefined') return null

  try {
    return mode === SESSION_MODE ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

function safeGet(storage, key) {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function safeSet(storage, key, value) {
  try {
    storage?.setItem(key, value)
  } catch {
    // Ignore storage write failures and fall back to in-memory auth behavior.
  }
}

function safeRemove(storage, key) {
  try {
    storage?.removeItem(key)
  } catch {
    // Ignore storage cleanup failures.
  }
}

function getPersistenceMode() {
  const sessionStorage = getStorage(SESSION_MODE)
  return safeGet(sessionStorage, AUTH_PERSISTENCE_KEY) === SESSION_MODE ? SESSION_MODE : LOCAL_MODE
}

function getPreferredStorage() {
  const mode = getPersistenceMode()
  return getStorage(mode) || getStorage(LOCAL_MODE)
}

function getFallbackStorage() {
  const mode = getPersistenceMode()
  return getStorage(mode === SESSION_MODE ? LOCAL_MODE : SESSION_MODE)
}

export function setAuthPersistenceMode(mode) {
  const nextMode = mode === SESSION_MODE ? SESSION_MODE : LOCAL_MODE
  const localStorage = getStorage(LOCAL_MODE)
  const sessionStorage = getStorage(SESSION_MODE)

  if (nextMode === SESSION_MODE) {
    safeSet(sessionStorage, AUTH_PERSISTENCE_KEY, SESSION_MODE)
  } else {
    safeRemove(sessionStorage, AUTH_PERSISTENCE_KEY)
  }

  safeRemove(localStorage, AUTH_PERSISTENCE_KEY)
}

export function clearAuthPersistenceMode() {
  safeRemove(getStorage(LOCAL_MODE), AUTH_PERSISTENCE_KEY)
  safeRemove(getStorage(SESSION_MODE), AUTH_PERSISTENCE_KEY)
}

const authStorage = {
  getItem(key) {
    const preferred = getPreferredStorage()
    const fallback = getFallbackStorage()
    const preferredValue = safeGet(preferred, key)

    if (preferredValue !== null) return preferredValue
    return safeGet(fallback, key)
  },
  setItem(key, value) {
    const preferred = getPreferredStorage()
    const fallback = getFallbackStorage()
    safeSet(preferred, key, value)
    safeRemove(fallback, key)
  },
  removeItem(key) {
    safeRemove(getStorage(LOCAL_MODE), key)
    safeRemove(getStorage(SESSION_MODE), key)
  },
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      flowType: 'implicit',
      persistSession: true,
      storage: authStorage,
    },
  }
)
