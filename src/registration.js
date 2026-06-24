// Per-device registration state for thecold.email.
// Presence of this record = "this browser has registered." The Supabase RPC
// `is_email_registered` remains the cross-device source of truth; this is just
// the fast local gate so we don't hit the DB on every click.

const KEY = 'tce_registration'

// Returns { email, full_name, registeredAt } or null.
export function getRegistration() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isRegisteredLocal() {
  const r = getRegistration()
  return !!(r && r.email)
}

export function setRegistration({ email, full_name }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      email: (email || '').trim().toLowerCase(),
      full_name: full_name || '',
      registeredAt: new Date().toISOString(),
    }))
  } catch {
    /* storage disabled — gate falls back to the DB check */
  }
}

export function clearRegistration() {
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}
