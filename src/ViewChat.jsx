import './chat.css'
import { useState, useRef, useEffect } from 'react'
import { M } from './icons'
import { ENTER_FORM, chatMeme, isCountry } from './data.js'
import { insertRegistration, isEmailRegistered } from './supabase.js'
import { setRegistration, getRegistration } from './registration.js'
import EmojiPicker from './EmojiPicker.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/.+/i
const QUESTIONS = ENTER_FORM.questions

// Social profile — forgiving, FORMAT-only (static site: no live network checks).
// Accepts a full/scheme-less URL (x.com/you, https://linkedin.com/in/you,
// instagram.com/you, tiktok.com/@you), or a bare handle (@you / you). A bare
// handle is normalized to the most common handle platform (X). Returns the
// normalized profile URL, or null for obvious junk (spaces, neither url nor handle).
const SOCIAL_DOMAIN_RE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i
const SOCIAL_HANDLE_RE = /^@?[A-Za-z0-9._]{1,40}$/
function normalizeSocial(raw) {
  const t = (raw || '').trim()
  if (!t || /\s/.test(t)) return null
  if (SOCIAL_DOMAIN_RE.test(t)) {
    const url = /^https?:\/\//i.test(t) ? t : 'https://' + t
    return url.replace(/\/+$/, '')
  }
  if (SOCIAL_HANDLE_RE.test(t)) return 'https://x.com/' + t.replace(/^@/, '')
  return null
}

// Make.com custom-webhook URL — on successful registration the collected answers
// are POSTed here, and the Make scenario (Webhook → Email) sends the user their
// confirmation email. TODO(Akul): paste the webhook URL from your Make scenario.
const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/sdmo9177ivf9dkefeidsul7yfn3ccapn'

// Fire-and-forget POST of the registration payload to the Make automation.
function notifyMake(payload) {
  if (!MAKE_WEBHOOK_URL) { console.warn('[register] MAKE_WEBHOOK_URL not set — skipping confirmation email'); return }
  fetch(MAKE_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(err => console.warn('[register] Make webhook failed', err))
}

// Build the bot's prompt text for one registration field. Every field is
// mandatory, so no "optional / skip" hint is shown.
function askText(qq) {
  // Background is open-ended: the presets are just examples, custom answers welcome.
  if (qq.name === 'background') return `${qq.q} (e.g. ${qq.options.join(', ')} — or type your own, comma-separated)`
  if (qq.options) return `${qq.q} (${qq.type === 'checkbox' ? 'pick any, comma-separated' : 'options'}: ${qq.options.join(', ')})`
  return qq.q
}

// Validate a typed answer for the current field. Every field is mandatory and
// type-restricted. Returns an error string, or null when the answer is valid.
function answerError(qq, text) {
  const t = text.trim()
  if (!t || t.toLowerCase() === 'skip') return 'This field is mandatory — please type a real answer (you can’t skip it).'
  // Full name must be the user's real full name — at least two separate words.
  if (qq.name === 'full_name') {
    const words = t.split(/\s+/).filter(w => /[A-Za-z]/.test(w))
    return words.length >= 2
      ? null : 'Please enter your full name — first and last (at least two words).'
  }
  // Country must match a real country name (or a common alias like USA/UK/UAE).
  if (qq.name === 'country') {
    return isCountry(t)
      ? null : 'Please enter a real country name (e.g. United States, India, United Kingdom).'
  }
  // Age is asked as an exact number, not a band — realistic ages only.
  if (qq.name === 'age') {
    const n = Number(t)
    return Number.isInteger(n) && n >= 13 && n <= 100
      ? null : 'Please enter a realistic age as a number between 13 and 100.'
  }
  // Background is open-ended — accept any custom answer (the options are just
  // suggestions), so titles like "CEO" or "Designer" are valid.
  if (qq.name === 'background') return null
  // Social accepts a bare handle OR any profile link — format check only.
  if (qq.name === 'social') {
    return normalizeSocial(t)
      ? null : 'Drop a handle or a link — like @yourname, x.com/yourname, or linkedin.com/in/you.'
  }
  switch (qq.type) {
    case 'email':
      return EMAIL_RE.test(t) ? null : 'That doesn’t look like a valid email — check for typos.'
    case 'url':
      return URL_RE.test(t) ? null : 'Enter a full link starting with https:// (e.g. https://example.com).'
    case 'dropdown':
    case 'radio':
      return qq.options.some(o => o.toLowerCase() === t.toLowerCase())
        ? null : `Please pick one of: ${qq.options.join(', ')}.`
    case 'checkbox': {
      const toks = t.split(',').map(s => s.trim()).filter(Boolean)
      if (!toks.length) return `Pick at least one of: ${qq.options.join(', ')}.`
      const bad = toks.filter(x => !qq.options.some(o => o.toLowerCase() === x.toLowerCase()))
      return bad.length ? `“${bad.join(', ')}” isn’t an option. Pick from: ${qq.options.join(', ')}.` : null
    }
    default:
      return null // short / paragraph — non-empty already satisfied above
  }
}

// Normalize a validated answer to its canonical form (matched option casing).
function canonical(qq, text) {
  const t = text.trim()
  if (qq.name === 'social') return normalizeSocial(t) || t
  if (qq.type === 'dropdown' || qq.type === 'radio') return qq.options.find(o => o.toLowerCase() === t.toLowerCase())
  // Checkbox (incl. open-ended "background"): match preset casing where it
  // matches, otherwise keep the user's own custom value.
  if (qq.type === 'checkbox') return t.split(',').map(s => s.trim()).filter(Boolean)
    .map(x => (qq.options || []).find(o => o.toLowerCase() === x.toLowerCase()) || x)
  return t
}

// Faithful 1:1 clone of a Google Chat 1:1 DM view, now wired as the
// registration chatbot: the opening script is untouched, the smart-reply
// chips are live, and "How do I register?" walks the user through the
// registration form one field at a time via the composer.
export default function ViewChat({ onRegistered, autoRegister = false }) {
  const [msgs, setMsgs] = useState([])      // dynamic turns appended below the static script
  const [flow, setFlow] = useState(null)    // active question index, or null when not registering
  const [done, setDone] = useState(false)   // registration completed
  const [draft, setDraft] = useState('')
  const [cardOpen, setCardOpen] = useState(false)   // contact card popup
  const [fmtOpen, setFmtOpen] = useState(false)     // formatting (A) popover
  const [emojiOpen, setEmojiOpen] = useState(false) // emoji picker popover
  const answers = useRef({})
  const inputRef = useRef(null)
  const endRef = useRef(null)
  const scrollRef = useRef(null)   // the scrollable panel itself
  // Chat sender persona — random, GUARANTEED never the user's session pfp.
  const pfp = chatMeme()

  // read-receipt avatar = the chat persona (always matches the chat avatar
  // above), shown only on the conversation's last message.
  const Receipt = () => (
    <span className="gchat-bubble-badge">
      <img src={pfp.img} alt="" onError={e => { e.currentTarget.style.display = 'none' }} />
    </span>
  )

  // Autoscroll the panel to the newest message. scrollIntoView on a sentinel is
  // unreliable here (sticky composer overlaps it), so scroll the panel itself to
  // its full height after layout settles.
  //
  // The chat OPENS AT THE TOP on a normal load: we skip the very first effect run
  // so the static welcome script isn't scrolled past. Subsequent message appends
  // DO autoscroll. Exception: when autoRegister is set we start at the bottom
  // (latest message) so the auto-started registration flow is in view.
  // StrictMode-robust: never scroll on the initial/static render (msgs starts
  // empty), only when a NEW message is actually appended. Tracking the previous
  // length means a double-invoked effect can't sneak a scroll-to-bottom in.
  // (autoRegister's jump-to-bottom is handled by the dedicated effect below.)
  const prevLen = useRef(0)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (msgs.length > prevLen.current) {
      requestAnimationFrame(() => { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) })
    }
    prevLen.current = msgs.length
  }, [msgs, flow, done])

  // ---- one-by-one bot reveal -------------------------------------------------
  // Bot replies don't drop in all at once: each queued text first shows an
  // animated typing-dots bubble, waits a length-scaled beat (~0.6–1.4s), then
  // swaps in place for the real bubble — then the next one starts. A unique id
  // marks the placeholder so the swap stays put even if the user sends a message
  // mid-reveal (order can't get corrupted). meSay (user) is always instant.
  const botQueue = useRef([])     // pending bot texts waiting to be revealed
  const botBusy = useRef(false)   // a reveal is currently in flight
  const idSeq = useRef(0)         // monotonic id for placeholder bubbles

  const pumpBot = () => {
    if (botBusy.current) return
    const text = botQueue.current.shift()
    if (text == null) return
    botBusy.current = true
    const id = ++idSeq.current
    setMsgs(m => [...m, { side: 'in', typing: true, id }])
    // scale the typing delay by length, clamped to 0.6–1.4s
    const delay = Math.min(1400, Math.max(600, text.length * 22))
    setTimeout(() => {
      setMsgs(m => m.map(x => (x.id === id ? { side: 'in', text, id } : x)))
      botBusy.current = false
      pumpBot()
    }, delay)
  }

  const botSay = (...texts) => { botQueue.current.push(...texts); pumpBot() }
  const meSay = (text) => setMsgs(m => [...m, { side: 'out', text }])

  // Insert a string at the input caret (replacing any selection), then restore
  // focus + caret. Used by the emoji picker.
  const insertAtCaret = (text) => {
    const el = inputRef.current
    const start = el ? el.selectionStart : draft.length
    const end = el ? el.selectionEnd : draft.length
    setDraft(draft.slice(0, start) + text + draft.slice(end))
    requestAnimationFrame(() => {
      if (!el) return
      const pos = start + text.length
      el.focus(); el.setSelectionRange(pos, pos)
    })
  }
  // Prepend a marker (e.g. "- " or "> ") to the start of the line at the caret.
  const prefixLines = (prefix) => {
    const el = inputRef.current
    const start = el ? el.selectionStart : draft.length
    const lineStart = draft.lastIndexOf('\n', start - 1) + 1
    setDraft(draft.slice(0, lineStart) + prefix + draft.slice(lineStart))
    requestAnimationFrame(() => {
      if (!el) return
      const pos = start + prefix.length
      el.focus(); el.setSelectionRange(pos, pos)
    })
  }
  // Wrap the current selection (or insert empty markers at the caret) with a
  // Google-Chat formatting mark: *bold*, _italic_, ~strike~, `code`.
  const wrapSelection = (mark) => {
    const el = inputRef.current
    const start = el ? el.selectionStart : draft.length
    const end = el ? el.selectionEnd : draft.length
    const sel = draft.slice(start, end)
    setDraft(draft.slice(0, start) + mark + sel + mark + draft.slice(end))
    requestAnimationFrame(() => {
      if (!el) return
      const pos = sel ? start + mark.length + sel.length + mark.length : start + mark.length
      el.focus(); el.setSelectionRange(pos, pos)
    })
  }

  const beginRegister = () => {
    meSay('How do I register?')
    answers.current = {}
    botSay('Awesome — let’s get you registered. I’ll ask a few quick things, just reply right here. 👇', askText(QUESTIONS[0]))
    setFlow(0)
  }

  // Auto-start registration when launched from Submit (unregistered user). Fires
  // once: jump to the latest message and kick off beginRegister() as if the user
  // had tapped "How do I register?".
  const didAuto = useRef(false)
  useEffect(() => {
    if (!autoRegister || didAuto.current) return
    didAuto.current = true
    const el = scrollRef.current
    if (el) requestAnimationFrame(() => { el.scrollTo({ top: el.scrollHeight }) })
    beginRegister()
  }, [autoRegister])

  // Already-registered device (e.g. page reload after registering): don't make
  // them register again. Recognize the saved registration, skip the flow, and
  // go straight to the "continue to your submission" state. Only when NOT
  // auto-started by the submit gate (autoRegister means they're unregistered).
  const didBoot = useRef(false)
  useEffect(() => {
    if (didBoot.current || autoRegister) return
    const existing = getRegistration()
    if (!existing || !existing.email) return
    didBoot.current = true
    answers.current = { email: existing.email, full_name: existing.full_name }
    setDone(true)
    botSay(`Welcome back — ${existing.email} is already registered. ✅`,
      'No need to do it again. Tap below to head straight to your submission.')
  }, [autoRegister])

  const showTracks = () => {
    meSay('Show me the tracks')
    botSay('Four tracks — pick whichever fits your email:',
      '1) The Unreachable — a reply from someone who never replies.\n2) Best Subject Line — a reply earned by the subject line alone.\n3) The Two-Liner — a reply from ≤2 sentences.\n4) The Ask — land a huge yes.',
      'Want to register? Tap “How do I register?” or just say the word.')
  }

  const sayGotIt = () => {
    meSay('Got it!')
    botSay('🙌 Let’s get the reply. Tap “How do I register?” whenever you’re ready.')
  }

  const finishRegistration = () => {
    const name = (answers.current.full_name || '').trim().split(' ')[0] || 'there'
    const email = (answers.current.email || 'your inbox').trim()
    setFlow(null)
    setDone(true)
    // Remember this device as registered so the Enter-gate routes to /submit.
    setRegistration({ email: answers.current.email, full_name: answers.current.full_name })
    // Persist to Supabase, then trigger the Make automation → confirmation email.
    insertRegistration(answers.current)
    notifyMake({ ...answers.current, event: 'thecold.email', registeredAt: new Date().toISOString() })
    botSay(
      `🎉 You’re registered, ${name}! A confirmation is on its way to ${email}.`,
      '**Step 2 — Send your cold emails.** Pick a target who doesn’t already know you and send as many cold emails as you like. Only the ones that earn a real reply count toward the competition.',
      '**Step 3 — Submit the winners.** Got a genuine reply? Submit a screenshot or PDF of the full thread to judges@thecold.email by Jul 7. No reply, no entry 🙂'
    )
  }

  const alreadyRegistered = (email) => {
    setFlow(null)
    setDone(true)
    setRegistration({ email })
    botSay(`Looks like ${email} is already registered — no need to do it twice. ✅`,
      'Taking you straight to your submission. Tap the button below to continue.')
  }

  const send = async () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')

    // Not in the registration flow yet: the user typed instead of tapping a
    // smart-reply chip. Echo it, then nudge them to pick one of the options.
    if (flow == null) {
      meSay(text)
      if (!done) botSay('Tap one of the options below to get started 👇  —  “How do I register?”, “Show me the tracks”, or “Got it!”.')
      return
    }

    const qq = QUESTIONS[flow]
    const err = answerError(qq, text)
    meSay(text)
    if (err) { botSay(err); return }  // re-ask same field

    answers.current[qq.name] = canonical(qq, text)

    // Dedup: as soon as we have a valid email, check the DB. If this person is
    // already registered (e.g. returning on a new device), skip the rest and
    // send them to submission. null = DB unreachable → just continue.
    if (qq.type === 'email') {
      const exists = await isEmailRegistered(text)
      if (exists === true) { alreadyRegistered(answers.current[qq.name]); return }
    }

    const next = flow + 1
    if (next >= QUESTIONS.length) { finishRegistration(); return }
    setFlow(next)
    botSay(askText(QUESTIONS[next]))
  }

  const onSubmit = (e) => { e.preventDefault(); send() }

  return (
    <div className="view-panel gchat-dm" ref={scrollRef}>
      {/* ---- conversation header ---- */}
      <div className="gchat-hd">
        <div className="gchat-hd-l">
          <button className="gchat-ic" title="Back"><M name="arrow_back" size={20} /></button>
          <span className="gchat-hd-av"><img src={pfp.img} alt="" onError={e => { e.currentTarget.style.display = 'none' }} /></span>
          <button className="gchat-hd-name" onClick={() => setCardOpen(o => !o)}>{pfp.name} <M name="expand_more" size={20} /></button>
          {cardOpen && (
            <>
              <div className="gchat-card-scrim" onClick={() => setCardOpen(false)} />
              <div className="gchat-card" role="dialog">
                <div className="gchat-card-top">
                  <span className="gchat-card-av"><img src={pfp.img} alt="" onError={e => { e.currentTarget.style.display = 'none' }} /></span>
                  <div className="gchat-card-id">
                    <div className="gchat-card-name">{pfp.name}</div>
                    <div className="gchat-card-email">{pfp.email}</div>
                  </div>
                </div>
                <div className="gchat-card-quote">“{pfp.tip}”</div>
              </div>
            </>
          )}
        </div>
        <div className="gchat-hd-r">
          <button className="gchat-ic" title="Call"><M name="videocam" size={20} /></button>
          <span className="gchat-hd-div" />
          <div className="gchat-hd-grp">
            <button className="gchat-ic" title="Files"><M name="folder_open" size={20} /></button>
            <button className="gchat-ic" title="History"><M name="hourglass_empty" size={20} /></button>
            <button className="gchat-ic" title="Pin"><M name="push_pin" size={20} /></button>
          </div>
        </div>
      </div>

      {/* ---- scrollable conversation ---- */}
      <div className="gchat-conv">
        {/* intro card */}
        <div className="gchat-intro">
          <span className="gchat-intro-av"><img src={pfp.img} alt="" onError={e => { e.currentTarget.style.display = 'none' }} /></span>
          <div className="gchat-intro-name">{pfp.name}</div>
          <div className="gchat-intro-email">{pfp.email}</div>
          <div className="gchat-intro-sub">You created this chat today</div>
        </div>

        <div className="gchat-history">
          <M name="history" size={16} /> <span>HISTORY IS ON</span>
        </div>
        <div className="gchat-history-sub">Messages sent with history on are saved</div>

        <div className="gchat-day">Today</div>

        {/* outgoing */}
        <div className="gchat-row gchat-row-out">
          <div className="gchat-meta gchat-meta-r">2 min</div>
          <div className="gchat-bubble gchat-bubble-out">hey! how do I enter the competition?</div>
        </div>

        {/* incoming — welcome + what it is */}
        <div className="gchat-row gchat-row-in">
          <span className="gchat-row-av"><img src={pfp.img} alt="" onError={e => { e.currentTarget.style.display = 'none' }} /></span>
          <div className="gchat-row-body">
            <div className="gchat-meta"><b>{pfp.name}</b> Now</div>
            <div className="gchat-bubble gchat-bubble-in">Welcome to thecold.email 👋</div>
            <div className="gchat-bubble gchat-bubble-in">It's a competition to find the best cold emails on the planet — proven by who actually replied. The whole tagline: <b>Get the reply.</b></div>
          </div>
        </div>

        {/* incoming — how it works */}
        <div className="gchat-row gchat-row-in">
          <span className="gchat-row-av"><img src={pfp.img} alt="" onError={e => { e.currentTarget.style.display = 'none' }} /></span>
          <div className="gchat-row-body">
            <div className="gchat-meta"><b>{pfp.name}</b> Now</div>
            <div className="gchat-bubble gchat-bubble-in">Three steps: 1) Send a cold email 2) Get a real reply 3) Prove it &amp; compete.</div>
            <div className="gchat-bubble gchat-bubble-in">Only emails that earn a genuine reply count. Submit a screenshot or PDF of the thread. No reply, no entry 🙂</div>
          </div>
        </div>

        {/* outgoing */}
        <div className="gchat-row gchat-row-out">
          <div className="gchat-meta gchat-meta-r">Now</div>
          <div className="gchat-bubble gchat-bubble-out">got it. what's the procedure + timeline?</div>
        </div>

        {/* incoming — procedure + timeline */}
        <div className="gchat-row gchat-row-in">
          <span className="gchat-row-av"><img src={pfp.img} alt="" onError={e => { e.currentTarget.style.display = 'none' }} /></span>
          <div className="gchat-row-body">
            <div className="gchat-meta"><b>{pfp.name}</b> Now</div>
            <div className="gchat-bubble gchat-bubble-in">Procedure is just: Register → Send cold emails → Submit the ones that reply.</div>
            <div className="gchat-bubble gchat-bubble-in">Register Jun 24–30 (closes Jul 6). Submissions Jul 1–7 — get your reply in by Jul 7.</div>
          </div>
        </div>

        {/* incoming — tracks + prizes */}
        <div className="gchat-row gchat-row-in">
          <span className="gchat-row-av"><img src={pfp.img} alt="" onError={e => { e.currentTarget.style.display = 'none' }} /></span>
          <div className="gchat-row-body">
            <div className="gchat-meta"><b>{pfp.name}</b> Now</div>
            <div className="gchat-bubble gchat-bubble-in">Four tracks: The Unreachable, Best Subject Line, The Two-Liner, and The Ask. Pick one and go.</div>
            <div className="gchat-bubble gchat-bubble-in">Prizes: $500 per track winner, plus a $1,000 grand prize for the best cold email overall. Every qualifying entry is in the running.{msgs.length === 0 && <Receipt />}</div>
          </div>
        </div>

        {/* ---- dynamic turns (registration chatbot) ---- */}
        {msgs.map((m, i) => m.side === 'out' ? (
          <div className="gchat-row gchat-row-out" key={i}>
            <div className="gchat-meta gchat-meta-r">Now</div>
            <div className="gchat-bubble gchat-bubble-out"><Rich text={m.text} />{i === msgs.length - 1 && <Receipt />}</div>
          </div>
        ) : (
          <div className="gchat-row gchat-row-in" key={i}>
            <span className="gchat-row-av"><img src={pfp.img} alt="" onError={e => { e.currentTarget.style.display = 'none' }} /></span>
            <div className="gchat-row-body">
              <div className="gchat-meta"><b>{pfp.name}</b> Now</div>
              {m.typing ? (
                <div className="gchat-bubble gchat-bubble-in gchat-typing" aria-label="typing">
                  <span className="gchat-dot" /><span className="gchat-dot" /><span className="gchat-dot" />
                </div>
              ) : (
                <div className="gchat-bubble gchat-bubble-in"><Rich text={m.text} />{i === msgs.length - 1 && <Receipt />}</div>
              )}
            </div>
          </div>
        ))}

        {/* smart-reply chips — shown whenever the bot is waiting (not mid-flow, not finished) */}
        {flow == null && !done && (
          <div className="gchat-chips">
            <button className="gchat-chip" onClick={beginRegister}>How do I register?</button>
            <button className="gchat-chip" onClick={showTracks}>Show me the tracks</button>
            <button className="gchat-chip" onClick={sayGotIt}>Got it!</button>
          </div>
        )}

        {/* submit CTA — appears after Step 3 (or when already registered) */}
        {done && (
          <div className="gchat-submit-row">
            <button className="gchat-submit-cta" onClick={() => onRegistered && onRegistered({ email: answers.current.email, full_name: answers.current.full_name })}>
              <M name="send" size={18} /> Continue to your submission
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ---- composer ---- */}
      <form className="gchat-composer" onSubmit={onSubmit}>
        <button type="button" className="gchat-plus"><M name="add" size={22} /></button>
        <div className={'gchat-input' + (fmtOpen ? ' is-fmt' : '')}>
          {fmtOpen && (
            <div className="gchat-fmtbar">
              <button type="button" className="is-on" onMouseDown={e => e.preventDefault()} onClick={() => wrapSelection('*')} title="Bold"><M name="format_bold" size={20} /></button>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => wrapSelection('_')} title="Italic"><M name="format_italic" size={20} /></button>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => wrapSelection('_')} title="Underline"><M name="format_underlined" size={20} /></button>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => wrapSelection('*')} title="Text color"><M name="format_color_text" size={20} /></button>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => wrapSelection('~')} title="Strikethrough"><M name="format_strikethrough" size={20} /></button>
              <span className="gchat-fmt-sep" />
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => prefixLines('- ')} title="Bulleted list"><M name="format_list_bulleted" size={20} /></button>
              <span className="gchat-fmt-sep" />
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => prefixLines('> ')} title="Quote"><M name="format_quote" size={20} /></button>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => insertAtCaret('https://')} title="Insert link"><M name="link" size={20} /></button>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => wrapSelection('`')} title="Code"><M name="code" size={20} /></button>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => wrapSelection('```')} title="Code block"><M name="data_object" size={20} /></button>
            </div>
          )}
          <input
            ref={inputRef}
            className="gchat-input-field"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={flow != null ? 'Type your answer…' : 'History is on'}
          />
          <div className="gchat-input-tools">
            <div className="gchat-tool-wrap">
              <button type="button" className={'gchat-tool gchat-tool-a' + (fmtOpen ? ' is-on' : '')} title="Formatting"
                onClick={() => { setFmtOpen(o => !o); setEmojiOpen(false) }}>A</button>
            </div>
            <div className="gchat-tool-wrap">
              <button type="button" className="gchat-tool" title="Emoji"
                onClick={() => { setEmojiOpen(o => !o); setFmtOpen(false) }}><M name="mood" size={20} /></button>
              {emojiOpen && (
                <div className="gchat-emoji-pop">
                  <EmojiPicker onPick={insertAtCaret} />
                </div>
              )}
            </div>
          </div>
        </div>
        <button type="button" className="gchat-send-caret"><M name="expand_more" size={18} /></button>
        <button type="submit" className={'gchat-send' + (draft.trim() ? ' is-active' : '')} disabled={!draft.trim()}><M name="send" size={18} /></button>
      </form>
    </div>
  )
}

// Inline renderer for Google-Chat-style marks, applied to both bot and user
// bubbles so the composer formatting bar is actually functional:
//   **bold** / *bold* · _italic_ · ~strike~ · `code`
function renderInline(line, keyPrefix) {
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g
  return line.split(re).map((part, pi) => {
    const k = `${keyPrefix}-${pi}`
    if (/^\*\*[\s\S]+\*\*$/.test(part)) return <b key={k}>{part.slice(2, -2)}</b>
    if (/^\*[\s\S]+\*$/.test(part))     return <b key={k}>{part.slice(1, -1)}</b>
    if (/^_[\s\S]+_$/.test(part))       return <i key={k}>{part.slice(1, -1)}</i>
    if (/^~[\s\S]+~$/.test(part))       return <s key={k}>{part.slice(1, -1)}</s>
    if (/^`[\s\S]+`$/.test(part))       return <code key={k}>{part.slice(1, -1)}</code>
    return <span key={k}>{part}</span>
  })
}
function Rich({ text }) {
  return (text || '').split('\n').map((line, li) => (
    <div key={li}>{renderInline(line, String(li))}</div>
  ))
}
