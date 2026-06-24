import { useState, useRef, useMemo } from 'react'
import { M } from './icons'
import { EMOJI_CATEGORIES } from './emojiData'

// Faithful clone of the Google Chat emoji picker: search bar, category tabs,
// section headers, FREQUENTLY USED (persisted in localStorage), big emoji grid.
const RECENT_KEY = 'tce_emoji_recent'
function getRecents() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || [] } catch { return [] }
}

export default function EmojiPicker({ onPick }) {
  const [q, setQ] = useState('')
  const [recents, setRecents] = useState(getRecents)
  const scrollRef = useRef(null)
  const secRefs = useRef({})
  const query = q.trim().toLowerCase()

  // Flat, keyword-filtered list when searching.
  const results = useMemo(() => {
    if (!query) return null
    const out = []
    for (const cat of EMOJI_CATEGORIES)
      for (const it of cat.emojis)
        if (it.k.includes(query)) out.push(it.e)
    return out
  }, [query])

  const pick = (e) => {
    onPick(e)
    const next = [e, ...recents.filter(x => x !== e)].slice(0, 18)
    setRecents(next)
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  const jump = (id) => {
    const el = secRefs.current[id]
    if (el && scrollRef.current) scrollRef.current.scrollTo({ top: el.offsetTop - 4 })
  }

  const Cell = ({ e }) => (
    <button type="button" className="emojip-cell" onMouseDown={ev => ev.preventDefault()} onClick={() => pick(e)}>{e}</button>
  )

  return (
    <div className="emojip">
      <div className="emojip-search">
        <M name="search" size={20} />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search" />
      </div>

      {!query && (
        <div className="emojip-tabs">
          <button type="button" className="is-on" title="Recent" onClick={() => jump('recent')}><M name="schedule" size={20} /></button>
          {EMOJI_CATEGORIES.map(c => (
            <button type="button" key={c.id} title={c.label} onClick={() => jump(c.id)}><M name={c.icon} size={20} /></button>
          ))}
        </div>
      )}

      <div className="emojip-body" ref={scrollRef}>
        {query ? (
          results.length ? (
            <div className="emojip-grid">{results.map((e, i) => <Cell e={e} key={e + i} />)}</div>
          ) : (
            <div className="emojip-none">No emoji found.</div>
          )
        ) : (
          <>
            <div ref={el => (secRefs.current.recent = el)}>
              <div className="emojip-head">FREQUENTLY USED</div>
              {recents.length ? (
                <div className="emojip-grid">{recents.map((e, i) => <Cell e={e} key={e + i} />)}</div>
              ) : (
                <div className="emojip-none">You haven't used any emojis yet.</div>
              )}
            </div>
            {EMOJI_CATEGORIES.map(c => (
              <div key={c.id} ref={el => (secRefs.current[c.id] = el)}>
                <div className="emojip-head">{c.label.toUpperCase()}</div>
                <div className="emojip-grid">{c.emojis.map((it, i) => <Cell e={it.e} key={it.e + i} />)}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
