import './chat.css'
import { useState, useRef, useEffect } from 'react'
import { M } from './icons'
import { ENTER_FORM, chatMeme } from './data.js'
import { insertRegistration, isEmailRegistered } from './supabase.js'
import { setRegistration } from './registration.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/.+/i
const QUESTIONS = ENTER_FORM.questions

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
  if (qq.options) return `${qq.q} (${qq.type === 'checkbox' ? 'pick any, comma-separated' : 'options'}: ${qq.options.join(', ')})`
  return qq.q
}

// Validate a typed answer for the current field. Every field is mandatory and
// type-restricted. Returns an error string, or null when the answer is valid.
function answerError(qq, text) {
  const t = text.trim()
  if (!t || t.toLowerCase() === 'skip') return 'This field is mandatory — please type a real answer (you can’t skip it).'
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
  if (qq.type === 'dropdown' || qq.type === 'radio') return qq.options.find(o => o.toLowerCase() === t.toLowerCase())
  if (qq.type === 'checkbox') return t.split(',').map(s => s.trim()).filter(Boolean).map(x => qq.options.find(o => o.toLowerCase() === x.toLowerCase()))
  return t
}

// Faithful 1:1 clone of a Google Chat 1:1 DM view, now wired as the
// registration chatbot: the opening script is untouched, the smart-reply
// chips are live, and "How do I register?" walks the user through the
// registration form one field at a time via the composer.
export default function ViewChat({ onRegistered }) {
  const [msgs, setMsgs] = useState([])      // dynamic turns appended below the static script
  const [flow, setFlow] = useState(null)    // active question index, or null when not registering
  const [done, setDone] = useState(false)   // registration completed
  const [draft, setDraft] = useState('')
  const [cardOpen, setCardOpen] = useState(false)   // contact card popup
  const answers = useRef({})
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
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) })
  }, [msgs, flow, done])

  const botSay = (...texts) => setMsgs(m => [...m, ...texts.map(text => ({ side: 'in', text }))])
  const meSay = (text) => setMsgs(m => [...m, { side: 'out', text }])

  const beginRegister = () => {
    meSay('How do I register?')
    answers.current = {}
    botSay('Awesome — let’s get you registered. I’ll ask a few quick things, just reply right here. 👇', askText(QUESTIONS[0]))
    setFlow(0)
  }

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

    if (flow == null) { meSay(text); return }

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
                <button className="gchat-card-add" title="Add to contacts"><M name="person_add" size={20} /></button>
                <div className="gchat-card-top">
                  <span className="gchat-card-av"><img src={pfp.img} alt="" onError={e => { e.currentTarget.style.display = 'none' }} /></span>
                  <div className="gchat-card-id">
                    <div className="gchat-card-name">{pfp.name}</div>
                    <div className="gchat-card-email">{pfp.email}</div>
                  </div>
                </div>
                <div className="gchat-card-quote">“{pfp.tip}”</div>
                <div className="gchat-card-actions">
                  <button className="gchat-card-msg"><M name="chat_bubble" size={18} /> Message</button>
                  <button className="gchat-card-ico" title="Email"><M name="mail" size={18} /></button>
                  <button className="gchat-card-ico" title="Video call"><M name="videocam" size={18} /></button>
                  <button className="gchat-card-ico" title="Schedule"><M name="calendar_today" size={18} /></button>
                </div>
                <button className="gchat-card-detail">Open detailed view <M name="open_in_new" size={16} /></button>
              </div>
            </>
          )}
        </div>
        <div className="gchat-hd-r">
          <button className="gchat-ic" title="Call"><M name="videocam" size={20} /></button>
          <button className="gchat-ic" title="Files"><M name="folder_open" size={20} /></button>
          <button className="gchat-ic" title="History"><M name="hourglass_empty" size={20} /></button>
          <button className="gchat-ic" title="Pin"><M name="push_pin" size={20} /></button>
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
            <div className="gchat-bubble gchat-bubble-out">{m.text}{i === msgs.length - 1 && <Receipt />}</div>
          </div>
        ) : (
          <div className="gchat-row gchat-row-in" key={i}>
            <span className="gchat-row-av"><img src={pfp.img} alt="" onError={e => { e.currentTarget.style.display = 'none' }} /></span>
            <div className="gchat-row-body">
              <div className="gchat-meta"><b>{pfp.name}</b> Now</div>
              <div className="gchat-bubble gchat-bubble-in"><Rich text={m.text} />{i === msgs.length - 1 && <Receipt />}</div>
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
        <div className="gchat-input">
          <input
            className="gchat-input-field"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={flow != null ? 'Type your answer…' : 'History is on'}
          />
          <div className="gchat-input-tools">
            <button type="button" className="gchat-tool gchat-tool-a">A</button>
            <button type="button" className="gchat-tool"><M name="mood" size={20} /></button>
            <button type="button" className="gchat-tool"><M name="gif_box" size={20} /></button>
            <button type="button" className="gchat-tool"><M name="upload" size={20} /></button>
            <button type="button" className="gchat-tool"><M name="mic" size={20} /></button>
          </div>
        </div>
        <button type="button" className="gchat-send-caret"><M name="expand_more" size={18} /></button>
        <button type="submit" className={'gchat-send' + (draft.trim() ? ' is-active' : '')} disabled={!draft.trim()}><M name="send" size={18} /></button>
      </form>
    </div>
  )
}

// Minimal **bold** renderer + newline support for bot messages.
function Rich({ text }) {
  return text.split('\n').map((line, li) => (
    <div key={li}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, pi) =>
        part.startsWith('**') && part.endsWith('**')
          ? <b key={pi}>{part.slice(2, -2)}</b>
          : <span key={pi}>{part}</span>
      )}
    </div>
  ))
}
