import { createClient } from '@supabase/supabase-js'

// Reads from Vite env vars. Set these in a local `.env` for dev and in the
// Vercel project settings for prod:
//   VITE_SUPABASE_URL       = https://YOUR-PROJECT.supabase.co
//   VITE_SUPABASE_ANON_KEY  = your anon public key
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only build a client if both vars are present, so the app still runs locally
// (and the Make webhook still fires) before the Supabase project exists.
export const supabase = (url && anonKey) ? createClient(url, anonKey) : null

function warnNoClient(what) {
  console.warn(`[supabase] ${what}: client not configured (set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — skipping DB write`)
}

const normEmail = (e) => (e || '').trim().toLowerCase()

// Registration gate. Calls the SECURITY DEFINER RPC `is_email_registered`,
// which returns only a boolean. Returns:
//   true  → this email is already registered
//   false → not registered
//   null  → unknown (no client configured, or the call errored) so callers
//           can fall back to localStorage instead of hard-blocking.
export async function isEmailRegistered(email) {
  if (!supabase) { warnNoClient('isEmailRegistered'); return null }
  const { data, error } = await supabase.rpc('is_email_registered', { p_email: normEmail(email) })
  if (error) { console.error('[supabase] isEmailRegistered failed', error); return null }
  return data === true
}

// Procedure-chat registration → `registrations` table.
export async function insertRegistration(answers) {
  if (!supabase) { warnNoClient('insertRegistration'); return { skipped: true } }
  const row = {
    full_name: answers.full_name || null,
    email: normEmail(answers.email) || null,
    country: answers.country || null,
    age: answers.age || null,
    company: answers.company || null,
    position: answers.position || null,
    social: answers.social || null,
    background: Array.isArray(answers.background) ? answers.background : (answers.background ? [answers.background] : null),
    why_joining: answers.why_joining || null,
    what_you_want: answers.what_you_want || null,
  }
  const { error } = await supabase.from('registrations').insert(row)
  if (error) console.error('[supabase] insertRegistration failed', error)
  return { error }
}

// Compose-window entry → `submissions` table. Files are stored as filename
// metadata only (binary upload to Supabase Storage can be added later).
export async function insertSubmission(fields) {
  if (!supabase) { warnNoClient('insertSubmission'); return { skipped: true } }
  const row = {
    email: fields.email || null,
    target_name: fields.targetName || null,
    target_email: fields.targetEmail || null,
    track: fields.track || null,
    subject: fields.subject || null,
    body: fields.body || null,
    attachments: Array.isArray(fields.files) ? fields.files.map(f => f.name) : null,
  }
  const { error } = await supabase.from('submissions').insert(row)
  if (error) console.error('[supabase] insertSubmission failed', error)
  return { error }
}
