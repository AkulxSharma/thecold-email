// Per-email read / starred state for the Best Emails list.
// Persisted in localStorage so a visitor's read + starred marks survive reloads.
// Keyed by email index (stable as long as BEST_EMAILS order is fixed); scales
// fine to ~150 entries since each map is just a tiny { [i]: true } object.

const READ_KEY = 'bestEmails_readState'
const STAR_KEY = 'bestEmails_starredState'

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {} } catch { return {} }
}
function save(key, map) {
  try { localStorage.setItem(key, JSON.stringify(map)) } catch { /* ignore quota/denied */ }
}

export const loadReadState = () => load(READ_KEY)
export const saveReadState = (map) => save(READ_KEY, map)
export const loadStarredState = () => load(STAR_KEY)
export const saveStarredState = (map) => save(STAR_KEY, map)
