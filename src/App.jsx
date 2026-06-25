import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { EMAILS, TOPIC_NAMES, DEADLINES, SEND_WINDOW, BEST_EMAILS, EVENTS, MEMES, RULES_PAGE, TRACK_PAGES, TRACK_REMEMBER, ENTER_FORM, sessionMeme } from './data.js'
import * as I from './icons.jsx'
import ViewStory from './ViewStory.jsx'
import ViewChat from './ViewChat.jsx'
import { insertSubmission, isEmailRegistered } from './supabase.js'
import { getRegistration, isRegisteredLocal, setRegistration } from './registration.js'

const GMAIL_LOGO = '/logo.png'

// ================================================================
// BACKEND — Google Form embed (Akul will supply the URLs)
// Capture/confirmation runs through two Google Forms. Until the URLs land,
// the UI uses local validation + toast/confirmation so it's fully testable.
// ================================================================
const REGISTRATION_FORM_URL = '' // TODO: Akul's Google Form — Funnel 1 (registration)
const SUBMISSION_FORM_URL = ''   // TODO: Akul's Google Form — Funnel 2 (submission)

// Shared field validators (used by both funnels)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i

// Track content pulled from the single source of truth (data.js)
const TRACKS = ['unreachable', 'subject', 'twoliner', 'ask'].map(t => EMAILS.find(e => e.topic === t))

// ================================================================
// ROUTING — single source of truth
// ================================================================
// URL slug <-> internal track topic key (used by TRACK_PAGES / TOPIC_NAMES)
const TOPIC_TO_SLUG = {
  unreachable: 'unreachable',
  subject:     'best-subject-line',
  twoliner:    'two-liner',
  ask:         'the-ask',
}
const SLUG_TO_TOPIC = Object.fromEntries(Object.entries(TOPIC_TO_SLUG).map(([t, s]) => [s, t]))

// Internal view key (used by every existing goto()/setView() call site) -> URL path.
// Track keys are derived from TOPIC_TO_SLUG so the slug map stays the only source of truth.
const VIEW_TO_PATH = {
  overview:      '/',
  enter:         '/the-procedure',
  calendar:      '/calendar',
  best:          '/best-emails',
  winners:       '/winners',
  'tracks-home': '/tracks',
  rule:          '/rules',
  prizes:        '/prize-pool',
  about:         '/about',
  ...Object.fromEntries(Object.entries(TOPIC_TO_SLUG).map(([t, s]) => [`track-${t}`, `/tracks/${s}`])),
}
// Map an internal view key (e.g. 'prizes', 'track-unreachable') to its URL path.
function viewToPath(view) {
  return VIEW_TO_PATH[view] || '/'
}

// Date-driven event status for the "Active" presence pill. Phases switch by the
// real calendar date; the dropdown shows a live countdown to the next milestone.
function eventPhase(now = new Date()) {
  const d = (y, m, day) => new Date(y, m - 1, day)
  const day0 = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
  const today = day0(now)
  const daysTo = (target) => Math.round((day0(target) - today) / 86400000)
  const fmt = (n, noun) => n <= 0 ? `${noun} today` : `${noun} in ${n} day${n === 1 ? '' : 's'}`

  const open = d(2026, 6, 24), regClose = d(2026, 6, 30), subClose = d(2026, 7, 7)
  const judge = d(2026, 7, 8), winners = d(2026, 7, 10)

  if (today < open)        return { label: 'Upcoming',          color: '#1a73e8', note: fmt(daysTo(open), 'Registration opens') }
  if (today <= regClose)   return { label: 'Registration open', color: '#1e8e3e', note: fmt(daysTo(regClose), 'Registration closes') }
  if (today <= subClose)   return { label: 'Submissions open',  color: '#f9ab00', note: fmt(daysTo(subClose), 'Submissions close') }
  if (today < winners)     return { label: 'Judging',           color: '#e8710a', note: fmt(daysTo(winners), 'Winners announced') }
  if (today.getTime() === day0(winners).getTime())
                           return { label: 'Winners announced', color: '#1e8e3e', note: 'Winners are live today 🎉' }
  return { label: 'Event ended', color: '#9aa0a6', note: 'Thanks for playing — see you next round.' }
}

// Event announcements feed (the bell dropdown). Each item is tied to a date;
// the feed orders them most-relevant-first and tags each Now / past / upcoming.
const ANNOUNCEMENTS = [
  { date: '2026-06-24', color: '#1e8e3e', title: 'Registration is open', body: 'Send your first cold email and start collecting real replies.' },
  { date: '2026-06-30', color: '#f9ab00', title: 'Last day to register', body: 'Registration closes at end of day — get in now.' },
  { date: '2026-07-01', color: '#1a73e8', title: 'Submissions are open', body: 'Submit the cold emails that earned a genuine reply.' },
  { date: '2026-07-07', color: '#d93025', title: 'Submissions close today', body: 'Final call — get your reply in before the deadline.' },
  { date: '2026-07-08', color: '#e8710a', title: 'Judging has begun', body: 'The judges are reading every entry against the rubric.' },
  { date: '2026-07-10', color: '#1e8e3e', title: 'Winners announced', body: 'See who wrote the cold emails that got the reply.' },
]
function buildAnnouncements(now = new Date()) {
  const day0 = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
  const today = day0(now)
  const items = ANNOUNCEMENTS.map(a => {
    const [y, m, d] = a.date.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    const diff = Math.round((day0(dt) - today) / 86400000)
    let when, status
    if (diff === 0) { when = 'Now'; status = 'now' }
    else if (diff < 0) { when = diff === -1 ? 'Yesterday' : `${-diff} days ago`; status = 'past' }
    else { when = diff === 1 ? 'Tomorrow' : `in ${diff} days`; status = 'upcoming' }
    return { ...a, dt, diff, when, status }
  })
  const past = items.filter(i => i.diff <= 0).sort((a, b) => b.dt - a.dt)
  const future = items.filter(i => i.diff > 0).sort((a, b) => a.dt - b.dt)
  const ordered = [...past, ...future]
  const unread = items.filter(i => i.status === 'now').length || (past.length && past[0].diff >= -1 ? 1 : 0)
  return { ordered, unread }
}

// ---------------- TOP BAR ----------------
function TopBar({ onMenu, onLogo, onJemini, navigate }) {
  const phase = eventPhase()
  const feed = buildAnnouncements()
  const [q, setQ] = useState('')
  const [meme] = useState(() => sessionMeme())
  const [pfpOpen, setPfpOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const statusRef = useRef(null)
  const notifRef = useRef(null)
  // Close the status menu on any outside click (lightest pattern: document listener).
  useEffect(() => {
    if (!statusOpen) return
    const onDoc = (e) => { if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [statusOpen])
  useEffect(() => {
    if (!notifOpen) return
    const onDoc = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [notifOpen])
  const statusGo = (path) => { setStatusOpen(false); navigate(path) }
  return (
    <div className="topbar">
      <div className="icon-btn" title="Main menu" onClick={onMenu}><I.Menu /></div>
      <div className="logo" onClick={onLogo}><img src={GMAIL_LOGO} alt="" /><span className="wordmark">thecold.email</span></div>
      <div className="search">
        <div className="icon-btn" style={{ width: 40, height: 40 }}><I.Search /></div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search mail" />
        {q && <div className="clear-x" onClick={() => setQ('')}><I.Close w={20} /></div>}
      </div>
      <div className="top-right">
        <div className="jemini" onClick={e => { e.stopPropagation(); onJemini() }}><I.Spark /> ColdGPT</div>
        <div className="notif-wrap" ref={notifRef}>
          <div className="icon-btn" title="Announcements" style={{ cursor: 'pointer' }} onClick={() => setNotifOpen(o => !o)}>
            <I.Feedback />
            {feed.unread > 0 && <span className="notif-badge">{feed.unread}</span>}
          </div>
          {notifOpen && (
            <div className="notif-menu">
              <div className="notif-head">
                <span>Announcements</span>
                <span className="notif-head-pill"><span className="status-dot" style={{ background: phase.color }} /> {phase.label}</span>
              </div>
              <div className="notif-list">
                {feed.ordered.map((a, i) => (
                  <div key={i} className={`notif-item notif-${a.status}`}>
                    <span className="notif-dot" style={{ background: a.color }} />
                    <div className="notif-body">
                      <div className="notif-title">{a.title}{a.status === 'now' && <span className="notif-live">LIVE</span>}</div>
                      <div className="notif-sub">{a.body}</div>
                      <div className="notif-when">{a.when}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="status-wrap" ref={statusRef}>
          <div className={`status-pill${statusOpen ? ' open' : ''}`} onClick={() => setStatusOpen(o => !o)}>
            <span className="status-dot" style={{ background: phase.color }} /> {phase.label} <I.CaretDown />
          </div>
          {statusOpen && (
            <div className="status-menu">
              <div className="status-menu-note"><span className="status-dot" style={{ background: phase.color }} /> {phase.note}</div>
              <div className="status-menu-sep" />
              <div className="status-menu-item" onClick={() => statusGo('/the-procedure')}>The Procedure</div>
              <div className="status-menu-item" onClick={() => statusGo('/calendar')}>Event Calendar</div>
              <div className="status-menu-item" onClick={() => statusGo('/prize-pool')}>Prize pool</div>
            </div>
          )}
        </div>
        <div className="avatar-ring" title={`${meme.name}: click for the takeaway`} onClick={() => setPfpOpen(true)}>
          <img className="avatar-img" src={meme.img} alt={meme.name} onError={e => { e.currentTarget.style.display = 'none' }} />
        </div>
      </div>
      {pfpOpen && (
        <div className="pfp-overlay" onClick={() => setPfpOpen(false)}>
          <div className="pfp-card" onClick={e => e.stopPropagation()}>
            <div className="pfp-email">{meme.email}</div>
            <div className="pfp-ring"><img className="pfp-photo" src={meme.img} alt={meme.name} /></div>
            <div className="pfp-hi">Hi, {meme.hi}!</div>
            <div className="pfp-tip">{meme.tip}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------- SIDEBAR ----------------
function NavItem({ icon, label, count, active, onClick, cls = '' }) {
  return (
    <div className={`nav-item ${cls} ${active ? 'active' : ''}`} onClick={onClick}>
      {icon && <span className="ni-icon">{icon}</span>}
      <span className="label">{label}</span>
      {count != null && <span className="count">{count}</span>}
    </div>
  )
}

function Sidebar({ onCompose, goto, pathname, open }) {
  // Highlight derives from the URL. Home is active for both '/' and '/home'.
  const isActive = (view) =>
    view === 'overview' ? (pathname === '/' || pathname === '/home') : pathname === viewToPath(view)
  const [collapsed, setCollapsed] = useState(() => new Set())  // collapsed section groups (default: both expanded)
  const toggleCollapse = k => setCollapsed(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })
  // Caret rotates -90deg when its group is collapsed.
  const caret = (k) => (
    <span className="section-caret" style={{ transform: collapsed.has(k) ? 'rotate(-90deg)' : 'none' }}><I.CaretDown /></span>
  )
  return (
    <div className={`sidebar${open ? '' : ' sidebar-collapsed'}`}>
      <div className="compose" onClick={onCompose}><I.Pencil /> Submit</div>

      <NavItem icon={<I.M name="inbox" />}         label="Home"           count="2047" active={isActive('overview')} onClick={() => goto('overview')} />
      <NavItem icon={<I.M name="star" />}          label="The Procedure"                      active={isActive('enter')}    onClick={() => goto('enter')} />
      <NavItem icon={<I.M name="calendar_month" />} label="Event Calendar"                    active={isActive('calendar')} onClick={() => goto('calendar')} />
      <NavItem icon={<I.M name="auto_awesome" />}  label="Best Emails"                    active={isActive('best')}     onClick={() => goto('best')} />
      <NavItem icon={<I.M name="article" />}       label="Manifesto"                      active={isActive('about')}    onClick={() => goto('about')} />

      <div className={`section-head section-head-btn${isActive('tracks-home') ? ' active' : ''}`} onClick={() => goto('tracks-home')}>
        <span className="section-caret-btn" title="Collapse" onClick={e => { e.stopPropagation(); toggleCollapse('tracks') }}>{caret('tracks')}</span> TRACKS
      </div>
      {!collapsed.has('tracks') && (<>
        <NavItem icon={<I.Plane size={20} />}  label="The Unreachable"    active={isActive('track-unreachable')} onClick={() => goto('track-unreachable')} />
        <NavItem icon={<I.SparkPen size={20} />} label="Best Subject Line"  active={isActive('track-subject')}     onClick={() => goto('track-subject')} />
        <NavItem icon={<I.M name="short_text" />} label="The Two-Liner"      active={isActive('track-twoliner')}    onClick={() => goto('track-twoliner')} />
        <NavItem icon={<I.M name="help" />} label="The Ask"            active={isActive('track-ask')}         onClick={() => goto('track-ask')} />
      </>)}

      <div className="section-head section-head-btn" onClick={() => toggleCollapse('event')}>
        <span className="section-caret-btn" title="Collapse">{caret('event')}</span> THE EVENT
      </div>
      {!collapsed.has('event') && (<>
        <NavItem icon={<I.M name="rule" />}        label="The Rule"   active={isActive('rule')}    onClick={() => goto('rule')} />
        <NavItem icon={<I.M name="emoji_events" />} label="Prizes"     active={isActive('prizes')}  onClick={() => goto('prizes')} />
      </>)}
    </div>
  )
}

// ---------------- ENTRY FORM (Compose) ----------------
const TRACK_OPTIONS = ['The Best Cold Email (overall)', 'The Unreachable', 'Best Subject Line', 'The Two-Liner', 'The Ask']
// Route guard: the submission page is only reachable once registered on this
// device. Unregistered visitors (incl. new devices) are sent to registration.
function RequireRegistration({ children }) {
  if (!isRegisteredLocal()) return <Navigate to="/the-procedure" replace />
  return children
}

function ComposeWindow({ onClose, onSend, page }) {
  const [track, setTrack] = useState(TRACK_OPTIONS[0])
  // Email is prefilled from the registration record and locked, so the
  // submit-time gate always checks the same email they registered with.
  const [email, setEmail] = useState(() => getRegistration()?.email || '')
  const [targetName, setTargetName] = useState('')
  const [targetEmail, setTargetEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState([])
  const fileRef = useRef()
  const addFiles = (list) => setFiles(f => [...f, ...Array.from(list)])
  return (
    <div className={'compose-win' + (page ? ' compose-win-page' : '')}>
      <div className="cw-head">
        <span className="cw-title">New Message</span>
        <div className="cw-head-icons">
          <span className="cw-hi" title="Minimize"><I.M name="remove" size={18} /></span>
          <span className="cw-hi" title="Full screen"><I.M name="open_in_full" size={15} /></span>
          <span className="cw-hi" title="Close" onClick={onClose}><I.M name="close" size={18} /></span>
        </div>
      </div>

      {/* Entrant + target identity — always visible (these never collapse) */}
      <div className="cw-field">
        <span className="cw-label">Enter Your Email</span>
        <input type="email" value={email} readOnly title="Locked to the email you registered with" placeholder="you@example.com" />
      </div>
      <div className="cw-field">
        <span className="cw-label">Target Name</span>
        <input value={targetName} onChange={e => setTargetName(e.target.value)} placeholder="Name of Person Emailed" />
      </div>
      <div className="cw-field">
        <span className="cw-label">Target Email</span>
        <input type="email" value={targetEmail} onChange={e => setTargetEmail(e.target.value)} placeholder="Email Address of the Target" />
      </div>
      <div className="cw-field cw-field-fixed">
        <span className="cw-label">To</span>
        <span className="cw-to-chip"><I.M name="verified" size={16} /> judges@thecold.email</span>
        <span className="cw-to-note">Fixed destination</span>
      </div>

      {/* Track selection — custom-styled select */}
      <div className="cw-track">
        <span className="cw-track-label">Track Selection</span>
        <div className="cw-track-control">
          <select value={track} onChange={e => setTrack(e.target.value)} className="cw-track-select">
            {TRACK_OPTIONS.map(t => <option key={t}>{t}</option>)}
          </select>
          <span className="cw-track-caret"><I.M name="expand_more" size={20} /></span>
        </div>
      </div>

      <div className="cw-field cw-field-plain">
        <input className="cw-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
      </div>
      <div className="cw-body">
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Attach screenshot / PDF of the entire Email thread using the 'Attach Files' Button below. Feel free to add any side notes/info you want the judges to have." />
      </div>

      {files.length > 0 && (
        <div className="cw-attachments">
          <div className="cw-attach-head">
            <I.M name="check_circle" size={16} />
            {files.length} file{files.length > 1 ? 's' : ''} attached
          </div>
          {files.map((f, i) => (
            <div className="cw-chip" key={i}>
              <I.M name="description" size={18} />
              <span className="cw-chip-name">{f.name}</span>
              <span className="cw-chip-x" title="Remove" onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}><I.M name="close" size={16} /></span>
            </div>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" multiple accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); e.target.value = '' }} />

      {/* Submit row */}
      <div className="cw-actions">
        <button className="cw-send" onClick={() => onSend({ track, email, targetName, targetEmail, subject, body, files })}>
          Submit
        </button>
        <div className="cw-act-icons">
          <span className="cw-act-ic cw-attach-cta" title="Attach Files" onClick={() => fileRef.current && fileRef.current.click()}><I.M name="attach_file" size={20} /></span>
          <span className="cw-act-ic"><I.M name="link" size={20} /></span>
          <span className="cw-act-ic"><I.M name="mood" size={20} /></span>
          <span className="cw-act-ic"><I.M name="add_to_drive" size={20} /></span>
          <span className="cw-act-ic"><I.M name="image" size={20} /></span>
        </div>
        <span className="cw-trash" title="Discard" onClick={onClose}><I.M name="delete" size={20} /></span>
      </div>
    </div>
  )
}

// ---------------- JEMINI (assistant) ----------------
// Deterministic, on-brand responder. No backend / no API key — keyword routes
// to answers built from the event facts. Same shape as a real chat panel.
function jeminiAnswer(qRaw) {
  const q = qRaw.toLowerCase()
  const has = (...words) => words.some(w => q.includes(w))

  if (has('hi', 'hey', 'hello', 'yo ')) return "Hey. Ask me about the tracks, prizes, the rule, deadlines, or how to enter."
  if (has('unreachable')) return "The Unreachable: get a reply from someone who never replies, like a founder, a celeb, or an investor. Scored on how unreachable they are + the reply. $500."
  if (has('subject')) return "Best Subject Line: the reply was earned by the subject line alone. Scored on the line itself + that it landed a reply. $500."
  if (has('two-liner', 'two liner', 'twoliner', '2 line', 'short')) return "The Two-Liner: land a reply in 2 sentences or fewer. Scored on brevity + the reply. $500."
  if (has('the ask', 'big ask', 'huge', 'land')) return "The Ask: land a huge yes: money, a meeting, a job, a partnership. Scored on the size of the yes. $500."
  if (has('track')) return "4 tracks, $500 each:\n• The Unreachable\n• Best Subject Line\n• The Two-Liner\n• The Ask\nEvery entry also competes for The Best Cold Email, the $1,000 grand prize."
  if (has('prize', 'money', 'win', 'cash', '$', 'pay')) return "$3,000 total:\n• The Best Cold Email (grand): $1,000\n• Each of the 4 tracks: $500"
  if (has('grand', 'best cold email', 'overall')) return "The Best Cold Email is the $1,000 grand prize: the single best email of the event. Every entry, any track, is in the running."
  if (has('rule', 'cheat', 'allowed', 'disqualif', 'fake')) return "One rule: real replies only. Someone who doesn’t already know you has to write back. No impersonation, no lying, no pre-existing relationship, no mass-blasting. Break any → disqualified."
  if (has('judg', 'score', 'rubric', 'how do you decide')) return "Two steps: (1) a pass/fail gate, real reply, no rule broken; (2) a 100-point rubric per track. Highest per track wins; strongest overall takes the grand prize."
  if (has('enter', 'how do i', 'submit', 'join', 'sign up', 'apply')) return "Send a cold email → get a real reply → submit the form with a screenshot of the reply before Jul 7. Hit Enter (top-left) to start."
  if (has('deadline', 'date', 'when', 'timeline', 'launch', 'close', 'over')) return "Timeline:\n• Jun 24: launch\n• Jun 30: registration closes\n• Jul 7: submissions close\n• Jul 10: winners announced"
  if (has('what', 'about', 'this', 'explain')) return "thecold.email is a competition to find the best cold emails on the planet, proven by who actually replied. Get the reply."
  return "Not sure on that one. Try: tracks, prizes, the rule, judging, deadlines, or how to enter."
}

const JEMINI_CHIPS = ['What are the tracks?', 'How do I enter?', "What's the rule?", 'Prizes?', 'Deadlines?']
// Follow-up prompts surfaced after each reply so there's always a next thing to tap.
const JEMINI_FOLLOWUPS = [
  'How is it judged?',
  'When are winners announced?',
  'What counts as a real reply?',
  "What's the grand prize?",
  'Tell me about The Unreachable',
  'Can I enter more than one track?',
  'When does registration close?',
]
// Rotate a small set of context-relevant follow-ups so the chip row keeps changing.
function followupChips(msgs) {
  if (msgs.length === 0) return JEMINI_CHIPS
  const turns = msgs.filter(m => m.role === 'you').length
  const start = (turns * 2) % JEMINI_FOLLOWUPS.length
  const out = []
  for (let i = 0; i < 4; i++) out.push(JEMINI_FOLLOWUPS[(start + i) % JEMINI_FOLLOWUPS.length])
  return out
}

function JeminiPanel({ onClose, open }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const scrollRef = useRef()
  const started = msgs.length > 0
  // Replies are synchronous, so the bot is "idle" whenever the last turn is its
  // reply (or there are no messages yet) — that's when we re-offer the chips.
  const idle = msgs.length === 0 || msgs[msgs.length - 1].role === 'bot'
  const chips = followupChips(msgs)

  const send = (text) => {
    const t = (text ?? input).trim()
    if (!t) return
    const reply = jeminiAnswer(t)
    setMsgs(m => [...m, { role: 'you', text: t }, { role: 'bot', text: reply }])
    setInput('')
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, 0)
  }

  return (
    <div className={`jemini-panel${open ? '' : ' jemini-closed'}`} onClick={e => e.stopPropagation()}>
      {/* toolbar */}
      <div className="jp-bar">
        <span className="jp-bar-title">ColdGPT</span>
        <div className="jp-bar-icons">
          <span className="jp-bar-ic" title="New chat" onClick={() => setMsgs([])}><I.M name="add" size={20} /></span>
          <span className="jp-bar-ic" title="Expand"><I.M name="open_in_full" size={18} /></span>
          <span className="jp-bar-ic" title="Reset" onClick={() => setMsgs([])}><I.M name="refresh" size={20} /></span>
          <span className="jp-bar-ic" title="Close" onClick={onClose}><I.M name="close" size={20} /></span>
        </div>
      </div>

      {/* body */}
      <div className="jp-scroll" ref={scrollRef}>
        {!started ? (
          <div className="jp-empty">
            <h2 className="jp-greet">What's on your mind?</h2>
            <div className="jp-help"><I.M name="subdirectory_arrow_right" size={20} /> Ask me anything about thecold.email.</div>
            <div className="jp-chips">
              {JEMINI_CHIPS.map(c => <span key={c} className="jp-chip" onClick={() => send(c)}>{c}</span>)}
            </div>
          </div>
        ) : (
          <div className="jp-msgs">
            {msgs.map((m, i) => <div key={i} className={`jp-msg jp-${m.role}`}>{m.text}</div>)}
            {idle && (
              <div className="jp-chips jp-chips-followup">
                {chips.map(c => <span key={c} className="jp-chip" onClick={() => send(c)}>{c}</span>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ================================================================
// VIEW COMPONENTS
// ================================================================

// ---------------- VIEW: OVERVIEW (Inbox / Hero) ----------------
// Format a YYYY-MM-DD deadline date into "Jun 24" (avoids Date() timezone drift)
function shortDate(iso) {
  const [, m, d] = iso.split('-')
  return `${MONTH_ABBR[+m - 1]} ${+d}`
}

// The 4 tracks, in sidebar order — topic keys map to TRACK_ICONS + the track-* views
const TRACK_TEASERS = ['unreachable', 'subject', 'twoliner', 'ask']
const TRACK_TEASER_COPY = {
  unreachable: { body: 'Pick someone who almost never replies: a founder, an exec, a name everyone knows. Get them to write back.', tag: 'Get the reply no one gets.' },
  subject:     { body: 'Write a subject line so good they have to open it. The reply you earn is credited to those few words.', tag: 'Win on the open.' },
  twoliner:    { body: 'Two sentences or less. No room to ramble. Every word has to pull its weight and still land a reply.', tag: 'Say less, get more.' },
  ask:         { body: 'Land a real "yes" from someone who could open a door: a job, an intro, money, a favor. The bigger the ask, the bigger the win.', tag: 'Ask big, win big.' },
}

// ---- wallet.google-style pinned scroll hero ----
const WAL_COLORS = ['#34A853', '#FBBC04', '#EA4335', '#4285F4'] // green, amber, red, blue (top→bottom)
const _clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)
const _lerp = (a, b, t) => a + (b - a) * t
const _seg = (p, a, b) => _clamp01((p - a) / (b - a))
const _ease = t => t * t * (3 - 2 * t) // smoothstep

function WalletHero({ onEnter, goto }) {
  const outerRef = useRef(null)
  const [p, setP] = useState(0)
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800))
  const reduced = typeof window !== 'undefined'
    && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduced) return
    const outer = outerRef.current
    if (!outer) return
    const scroller = outer.closest('.view-panel') || window
    let raf = 0
    const measure = () => {
      const h = (scroller === window ? window.innerHeight : scroller.clientHeight) || 800
      setVh(h)
    }
    const compute = () => {
      raf = 0
      const h = (scroller === window ? window.innerHeight : scroller.clientHeight) || 800
      const top = outer.offsetTop
      const scrollTop = scroller === window ? window.scrollY : scroller.scrollTop
      const travel = outer.offsetHeight - h
      setP(_clamp01(travel > 0 ? (scrollTop - top) / travel : 0))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute) }
    measure(); compute()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', () => { measure(); compute() })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])

  const cards = TRACK_TEASERS.slice(0, 4)
  // Phones are tall: the vh-proportional start offset pushes the deck far below
  // the text. Start the deck much closer to the headline on small screens.
  const mobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const deckStartFactor = mobile ? 0.05 : 0.16
  // Extra downward offset at the START only (rises away to 0) so the deck clears
  // the subtext on desktop; the END stays vertically centered.
  const deckStartPush = mobile ? 0 : 96

  // floating pill nav removed per request
  const pill = null

  // ----- reduced motion: static STATE A only -----
  if (reduced) {
    return (
      <section className="walhero walhero-static">
        {pill}
        <div className="walhero-headline">
          <h1 className="walhero-title">The world replies to those who know how to write.</h1>
          <p className="walhero-sub">One email. The right words. A reply you weren’t supposed to get.</p>
        </div>
        <div className="walhero-static-cards">
          {cards.map((topic, i) => (
            <button className="wcard" key={topic} onClick={() => goto(`track-${topic}`)}
              style={{ '--wc': WAL_COLORS[i] }}>
              <span className="wcard-icon">{TRACK_ICONS[topic]}</span>
              <span className="wcard-name">{TOPIC_NAMES[topic]}</span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  // ----- animated states -----
  const hHide = _ease(_seg(p, 0.04, 0.34))   // headline rises + fades out first
  const rise  = _ease(_seg(p, 0.12, 0.82))   // cards rise into the stacked deck, then hold

  const headStyle = {
    opacity: 1 - hHide,
    transform: `translate(-50%, calc(-50% - ${hHide * 160}px))`,
    pointerEvents: hHide > 0.5 ? 'none' : 'auto',
  }

  return (
    <section className="walhero" ref={outerRef}>
      <div className="walhero-stage" style={{ height: vh }}>
        {pill}

        <div className="walhero-headline" style={headStyle}>
          <h1 className="walhero-title">The world replies to those who know how to write.</h1>
          <p className="walhero-sub">One email. The right words. A reply you weren’t supposed to get.</p>
        </div>

        <div className="walhero-deck">
          {cards.map((topic, i) => {
            const startOff = vh * deckStartFactor + deckStartPush + i * 14
            const fanOff   = (i - 1.5) * 78
            const offY  = _lerp(startOff, fanOff, rise)
            const scale = _lerp(0.9, 1.0, rise)
            const rot   = _lerp((i - 1.5) * 5, 0, rise)
            const style = {
              '--wc': WAL_COLORS[i],
              zIndex: 10 - i,
              transform: `translate(-50%, calc(-50% + ${offY}px)) scale(${scale}) rotate(${rot}deg)`,
            }
            return (
              <button className="wcard" key={topic} style={style}
                onClick={() => goto(`track-${topic}`)}>
                <span className="wcard-icon">{TRACK_ICONS[topic]}</span>
                <span className="wcard-name">{TOPIC_NAMES[topic]}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------- VIEW: ABOUT (standalone manifesto) ----------------
// Plain-text placeholder page for now — real manifesto/design comes later.
function ViewAbout() {
  return (
    <div className="view-panel">
      <div className="manifesto-page">
        <h1>Manifesto</h1>
        <p>Every closed door has an inbox. The cold email is the one knock that still works, and almost no one dares to use it.</p>
        <p>The world is far more reachable than it looks. It opens for anyone willing to write to a stranger and ask.</p>
        <p>One email, sent to the right person at the right moment, can change the shape of a life.</p>
        <p>The world replies to those who dare to write.</p>
        <p className="manifesto-page-note">Working draft. The final manifesto is coming from the team.</p>
      </div>
    </div>
  )
}

function ViewOverview({ onEnter, goto }) {
  // Scroll-linked fade: each post-hero section's opacity tracks how far it has
  // entered the viewport, so you actually SEE it fade + rise in as you scroll
  // (a one-shot transition finishes off-screen and is never seen).
  useEffect(() => {
    const els = [...document.querySelectorAll('.home > section:not(.walhero), .home > footer')]
    if (!els.length) return
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { els.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none' }); return }
    const scroller = document.querySelector('.view-panel')
    const target = scroller || window
    let raf = 0
    const update = () => {
      raf = 0
      const sr = scroller ? scroller.getBoundingClientRect()
        : { bottom: window.innerHeight, height: window.innerHeight }
      const dist = sr.height * 0.42 // fade completes over the first ~42% of entry
      els.forEach(el => {
        const top = el.getBoundingClientRect().top
        const entered = sr.bottom - top            // px the top has risen past the fold
        const p = Math.max(0, Math.min(1, entered / dist))
        el.style.opacity = String(p)
        el.style.transform = `translateY(${(1 - p) * 28}px)`
      })
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    target.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="view-panel">
      <div className="home">

        {/* 1 — HERO (wallet.google-style pinned scroll sequence) */}
        <WalletHero onEnter={onEnter} goto={goto} />

        {/* Launch film — NotebookLM-style: centered title + wide centered media card */}
        <section className="home-film">
          <h2 className="home-film-title">Watch how the world replies</h2>
          <div className="home-film-row">
            <div className="home-film-media">
              <div className="home-video-play"><I.M name="play_arrow" size={40} /></div>
              <span className="home-film-badge">Drops June 24</span>
            </div>
          </div>
        </section>

        {/* 2 — DEADLINE STRIP */}
        <section className="home-deadlines">
          <div className="home-deadline">
            <span className="home-deadline-date">Jun 24 – 30</span>
            <span className="home-deadline-label">Registration</span>
          </div>
          <div className="home-deadline">
            <span className="home-deadline-date">Jul 1 – 7</span>
            <span className="home-deadline-label">Submissions</span>
          </div>
        </section>

        {/* 3 — WHAT IS THIS / how it works */}
        <section className="home-what">
          <h2 className="home-h2">One cold email. One real reply. That's the whole game.</h2>
          <div className="home-flow">
            <div className="home-flow-step"><span className="home-flow-num">1</span>Send a cold email</div>
            <I.M name="arrow_forward" size={20} />
            <div className="home-flow-step"><span className="home-flow-num">2</span>Get a real reply</div>
            <I.M name="arrow_forward" size={20} />
            <div className="home-flow-step"><span className="home-flow-num">3</span>Prove it &amp; compete</div>
          </div>
        </section>

        {/* 4 — TRACK TEASER — NotebookLM-style columns (icon · heading · body · italic tagline) */}
        <section className="home-tracks">
          <h2 className="home-tracks-title">Four ways to get the reply</h2>
          <div className="home-track-cols">
            {TRACK_TEASERS.map(topic => (
              <button className="home-track-col" key={topic} onClick={() => goto(`track-${topic}`)}>
                <span className="home-track-col-icon">{TRACK_ICONS[topic]}</span>
                <h3 className="home-track-col-name">{TOPIC_NAMES[topic]}</h3>
                <p className="home-track-col-body">{TRACK_TEASER_COPY[topic].body}</p>
                <span className="home-track-col-tag">{TRACK_TEASER_COPY[topic].tag}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 5 — PRIZE TEASER */}
        <section className="home-prize-teaser">
          <span className="home-prize-icon"><I.M name="payments" size={48} /></span>
          <div className="home-prize-big">$3,000</div>
          <p className="home-prize-desc">A cash prize for every track, plus a bigger grand prize for the best cold email overall.</p>
          <button className="home-prize-btn dark" onClick={() => goto('prizes')}>
            See the breakdown <I.M name="arrow_forward" size={16} />
          </button>
        </section>

        {/* 7 — FOOTER */}
        <footer className="home-footer">
          <div className="home-footer-brand">
            <img src="/logo.png" alt="" className="home-footer-logo" />
            <span className="home-footer-wordmark">thecold.email</span>
          </div>
          <div className="home-footer-socials">
            <a href="#" className="home-footer-link">X</a>
            <a href="https://instagram.com/thecold.email" className="home-footer-link" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="#" className="home-footer-link">LinkedIn</a>
            <a href="https://www.tiktok.com/@thecold.email" className="home-footer-link" target="_blank" rel="noopener noreferrer">TikTok</a>
          </div>
          <div className="home-footer-sponsors">Sponsors: your logo here</div>
        </footer>

      </div>
    </div>
  )
}

// ---------------- VIEW: WINNERS (Starred) ----------------
function ViewWinners() {
  const prizes = [
    { label: '★ The Best Cold Email', amount: '$1,000', grand: true },
    { label: 'The Unreachable', amount: '$500' },
    { label: 'Best Subject Line', amount: '$500' },
    { label: 'The Two-Liner', amount: '$500' },
    { label: 'The Ask', amount: '$500' },
  ]
  return (
    <div className="view-panel">
      <div className="view-header">
        <h2 className="view-title">Winners</h2>
      </div>
      <div className="view-body">
        <div className="winners-card">
          <div className="winners-lock-badge">
            <I.Trophy />
            <span>Winners announced July 10, 2026</span>
          </div>
          <div className="winners-prizes">
            {prizes.map((p, i) => (
              <div key={i} className={`winners-row${p.grand ? ' winners-grand' : ''}`}>
                <span className="winners-label winners-blurred">{p.label}</span>
                <span className="winners-amount winners-blurred">{p.amount}</span>
                <span className="winners-lock-icon"><I.EyeOff /></span>
              </div>
            ))}
          </div>
          <p className="winners-note">Results locked until the announcement. Check back July 10.</p>
        </div>
      </div>
    </div>
  )
}

// ---------------- VIEW: TBD (blank) ----------------
function ViewSpam() {
  return (
    <div className="view-panel">
      <div className="view-body"></div>
    </div>
  )
}

// ---------------- VIEW: ENTER (Sent / How to Enter) ----------------
// Google Forms icon (purple)
const FORMS_ICON = (
  <svg width="22" height="28" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M29 0H6C2.69 0 0 2.69 0 6v52c0 3.31 2.69 6 6 6h36c3.31 0 6-2.69 6-6V19L29 0z" fill="#7248B9"/>
    <path d="M29 0v13c0 3.31 2.69 6 6 6h13L29 0z" fill="#C5A1EA"/>
    <path d="M22.4 32.3h12.8v3H22.4v-3zm0 6.4h12.8v3H22.4v-3zm0 6.4h12.8v3H22.4v-3z" fill="#fff"/>
    <circle cx="16" cy="33.8" r="1.8" fill="#fff"/><circle cx="16" cy="40.2" r="1.8" fill="#fff"/><circle cx="16" cy="46.6" r="1.8" fill="#fff"/>
  </svg>
)

// Shared "how to enter" steps
const ENTER_STEPS = [
  { n: 1, icon: 'how_to_reg',       title: 'Register',                 text: 'Fill the form below. We save your details and email you a confirmation.' },
  { n: 2, icon: 'send',             title: 'Send cold emails',          text: 'Pick a track. Write to people who have every reason to ignore you: founders, execs, the ones you look up to. No templates, no spray. Send as many as you want.' },
  { n: 3, icon: 'mark_email_read',  title: 'Submit the ones that reply', text: 'Only emails that get a real reply count. Attach a screenshot/PDF of any thread that landed a response and submit it.' },
]

function ViewEnter({ onEnter, onRegistered }) {
  // Procedure page is now the chat-only registration flow. The Maps / Classroom
  // / Story tabs + switcher below are kept (dead) for an end-of-project sweep.
  return <ViewChat onRegistered={onRegistered} />

  /* eslint-disable no-unreachable */
  const [ui, setUi] = useState('maps') // 'maps' | 'classroom' | 'story' | 'chat'
  const [active, setActive] = useState(0) // active route stop in the Maps UI
  const [expanded, setExpanded] = useState(false) // is a step's detail (form) open?
  const [panelW, setPanelW] = useState(420) // draggable width of the directions panel

  const startDrag = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelW
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    const move = (ev) => setPanelW(Math.min(680, Math.max(320, startW + (ev.clientX - startX))))
    const up = () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }
  const [submitted, setSubmitted] = useState(false)
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})

  const setField = (name, v) => {
    setValues(p => ({ ...p, [name]: v }))
    setErrors(p => (p[name] ? { ...p, [name]: undefined } : p))
  }
  const toggleCheck = (name, opt) => {
    setValues(p => {
      const cur = Array.isArray(p[name]) ? p[name] : []
      const next = cur.includes(opt) ? cur.filter(o => o !== opt) : [...cur, opt]
      return { ...p, [name]: next }
    })
    setErrors(p => (p[name] ? { ...p, [name]: undefined } : p))
  }

  // Per-field validation by data type. Required fields block submit;
  // optional fields only block if their format is wrong (email / URL).
  const validate = () => {
    const e = {}
    ENTER_FORM.questions.forEach(qq => {
      const v = values[qq.name]
      const empty = qq.type === 'checkbox' ? !(Array.isArray(v) && v.length) : !(v && String(v).trim())
      if (qq.required && empty) {
        if (qq.type === 'email')        e[qq.name] = 'We need your email to send your confirmation.'
        else if (qq.type === 'checkbox' || qq.type === 'radio') e[qq.name] = 'Pick at least one option to continue.'
        else if (qq.type === 'dropdown') e[qq.name] = 'Choose an option to continue.'
        else                            e[qq.name] = 'This one’s required — add a short answer.'
        return
      }
      if (empty) return
      if (qq.type === 'email' && !EMAIL_RE.test(String(v).trim())) e[qq.name] = 'That doesn’t look like a valid email — check for typos.'
      if (qq.type === 'url' && !URL_RE.test(String(v).trim())) e[qq.name] = 'Enter a full link starting with https:// (e.g. https://example.com).'
    })
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    // TODO(Akul): POST `values` to REGISTRATION_FORM_URL (Google Form) or
    // redirect/embed for confirmation once the form URL is supplied.
    setSubmitted(true)
  }

  const renderInput = (qq) => {
    const v = values[qq.name]
    const err = errors[qq.name]
    const cls = 'enter-input' + (err ? ' has-error' : '')
    switch (qq.type) {
      case 'email':     return <input type="email" className={cls} placeholder={qq.ph || 'Your answer'} value={v || ''} onChange={e => setField(qq.name, e.target.value)} />
      case 'url':       return <input type="url"   className={cls} placeholder={qq.ph || 'https://'} value={v || ''} onChange={e => setField(qq.name, e.target.value)} />
      case 'paragraph': return <textarea className={'enter-textarea' + (err ? ' has-error' : '')} rows={3} placeholder={qq.ph || 'Your answer'} value={v || ''} onChange={e => setField(qq.name, e.target.value)} />
      case 'dropdown':  return (
        <select className={'enter-select' + (err ? ' has-error' : '')} value={v || ''} onChange={e => setField(qq.name, e.target.value)}>
          <option value="" disabled>Choose</option>
          {qq.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
      case 'radio':     return (
        <div className="enter-choices">
          {qq.options.map(o => (
            <label className="enter-choice" key={o} onClick={() => setField(qq.name, o)}>
              <span className={'enter-radio' + (v === o ? ' checked' : '')} /> {o}
            </label>
          ))}
        </div>
      )
      case 'checkbox':  return (
        <div className="enter-choices">
          {qq.options.map(o => {
            const on = Array.isArray(v) && v.includes(o)
            return (
              <label className="enter-choice" key={o} onClick={() => toggleCheck(qq.name, o)}>
                <span className={'enter-checkbox' + (on ? ' checked' : '')} /> {o}
              </label>
            )
          })}
        </div>
      )
      default:          return <input type="text" className={cls} placeholder={qq.ph || 'Your answer'} value={v || ''} onChange={e => setField(qq.name, e.target.value)} />
    }
  }

  // Rendered via direct function calls (not <Field/>) so the form keeps input
  // focus — inner components defined in a parent remount on every keystroke.
  const Field = (qq) => (
    <label className="enter-field" key={qq.name}>
      <span className="enter-field-q">{qq.q}{qq.required && <span className="enter-req"> *</span>}</span>
      {renderInput(qq)}
      {errors[qq.name] && <span className="enter-error"><I.M name="error" size={15} /> {errors[qq.name]}</span>}
    </label>
  )

  const required = ENTER_FORM.questions.filter(q => q.required)
  const optional = ENTER_FORM.questions.filter(q => !q.required)

  const FieldList = () => (
    <>
      <div className="enter-section">
        <div className="enter-section-head">About you</div>
        <div className="enter-fields">
          {required.map(qq => Field(qq))}
        </div>
      </div>
      <div className="enter-section">
        <div className="enter-section-head">Optional details <span className="enter-section-hint">(skip any of these)</span></div>
        <div className="enter-fields">
          {optional.map(qq => Field(qq))}
        </div>
      </div>
    </>
  )

  const Done = (cls) => (
    <div className={'enter-done ' + cls}>
      <I.M name="check_circle" size={40} />
      <h3>You’re registered.</h3>
      <p>We’ve emailed you a confirmation. Now go send one real cold email, then come back and submit the reply.</p>
      <div className="enter-done-actions">
        <button className="gclass-btn gclass-btn-row" onClick={onEnter}>
          <I.M name="send" size={18} /> Continue to submission
        </button>
        <span className="enter-link" onClick={() => { setSubmitted(false); setValues({}); setErrors({}) }}>Register someone else</span>
      </div>
    </div>
  )

  // ---------------- CLASSROOM SHELL ----------------
  const Classroom = () => (
    <div className="enter-canvas gclass">
      <div className="gclass-banner">
        <div className="gclass-banner-in">
          <p className="gclass-section">thecold.email</p>
          <h1 className="gclass-title">The Procedure</h1>
          <p className="gclass-sub">How to enter · Register → Submit</p>
        </div>
      </div>
      <div className="gclass-body">
        <aside className="gclass-side">
          <div className="gclass-card gclass-due">
            <h4>Due soon</h4>
            <p className="gclass-duedate"><I.M name="event" size={16} /> Registration closes Jul 6</p>
            <p className="gclass-duedate"><I.M name="event" size={16} /> Submit reply by Jul 7</p>
          </div>
        </aside>
        <main className="gclass-main">
          <div className="gclass-assign">
            <span className="gclass-assign-ico"><I.M name="assignment" size={22} /></span>
            <div>
              <h2 className="gclass-assign-title">{ENTER_FORM.title}</h2>
              <p className="gclass-assign-meta">100 points · Due Jul 7</p>
            </div>
          </div>

          <div className="gclass-card gclass-instr">
            <p>{ENTER_FORM.desc}</p>
            <ol className="gclass-steps">
              {ENTER_STEPS.map(s => <li key={s.n}><b>{s.title}.</b> {s.text}</li>)}
            </ol>
          </div>

          <div className="gclass-funnels">
            <div className={'gclass-card gclass-funnel' + (submitted ? ' is-done' : '')}>
              <div className="gclass-funnel-head">
                <span className="gclass-step-badge">{submitted ? <I.M name="check" size={18} /> : 1}</span>
                <div className="gclass-funnel-heading">
                  <span className="gclass-step-eyebrow">Step 1 of 2</span>
                  <h3 className="gclass-h3">Registration</h3>
                </div>
              </div>
              {submitted ? Done('enter-done-light') : (
                <>
                  {FieldList()}
                  <button className="gclass-btn" onClick={handleSubmit}>Hand in registration</button>
                </>
              )}
            </div>

            <div className="gclass-funnel-connector" aria-hidden="true">
              <span className="gclass-connector-line" />
              <I.M name="arrow_downward" size={18} />
            </div>

            <div className="gclass-card gclass-funnel gclass-attach">
              <div className="gclass-funnel-head">
                <span className="gclass-step-badge">2</span>
                <div className="gclass-funnel-heading">
                  <span className="gclass-step-eyebrow">Step 2 of 2</span>
                  <h3 className="gclass-h3">Your submission</h3>
                </div>
              </div>
              <p>When they reply, attach a screenshot/PDF of the thread and submit your entry through the submission window.</p>
              <button className="gclass-submit-btn" type="button" onClick={onEnter}
                 onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEnter() } }}>
                <I.M name="send" size={18} /> Open the submission window
              </button>
              <p className="gclass-funnel-help">Opens the submission window — no email leaves your inbox here.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )

  // ---------------- MAPS SHELL (full Google Maps clone) ----------------
  // Map coordinates (0–100 viewBox) for the 3 route stops. Spread wide so the
  // blue dot's glide between stops reads as a long, visible animation.
  // Route waypoints mirror the reference map: Tea stalls → Vivek Public School → destination.
  const STOPS = [
    { x: 51, y: 27 }, // 1 · Register      (Tea stalls)
    { x: 42, y: 49 }, // 2 · Send cold emails (Vivek Public School)
    { x: 33, y: 78 }, // 3 · Submit (destination pin — sits at the route's end)
  ]
  // The purple path: down from Tea stalls, past the school, then the hard left to the pin.
  const ROUTE_D = 'M51 27 L46.5 36 L43 41 L42 49 L41.3 60 L41 67 L40.3 73 L34.5 75.4 L33 78'
  const ETA = ['2 min', '1 min', 'Arrive']
  const NAV_ICON = ['straight', 'turn_right', 'place']
  const lastStop = STOPS.length - 1
  // Address strings shown in the directions panel (truncated with an ellipsis by CSS).
  const TRIP = [
    'Your inbox',
    'Sending cold emails',
    'In the competition',
  ]
  const openStop = (i) => { setActive(i); setExpanded(true) }

  const StepDetail = (i) => {
    if (i === 0) {
      return submitted ? Done('enter-done-light') : (
        <>
          {FieldList()}
          <button className="gmaps-go" onClick={handleSubmit}>
            <I.M name="send" size={16} /> Hand in registration
          </button>
        </>
      )
    }
    if (i === 1) {
      return <p className="gmaps-step-text">{ENTER_STEPS[1].text}</p>
    }
    return (
      <>
        <p className="gmaps-step-text">{ENTER_STEPS[2].text}</p>
        <button className="gmaps-go" type="button" onClick={onEnter}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEnter() } }}>
          <I.M name="send" size={16} /> Open the submission window
        </button>
        <p className="gmaps-step-help">No email leaves your inbox here.</p>
      </>
    )
  }

  // Google Maps balloon marker — teardrop body + darker inner circle.
  const MapPin = ({ size, fill, dark }) => (
    <svg width={size} height={Math.round(size * 1.35)} viewBox="0 0 24 32" style={{ display: 'block' }}>
      <path fill={fill} d="M12 0C5.37 0 0 5.37 0 12c0 7.7 9.9 18.6 11.05 19.83.51.55 1.39.55 1.9 0C14.1 30.6 24 19.7 24 12 24 5.37 18.63 0 12 0z" />
      <circle cx="12" cy="12" r="4.3" fill={dark} />
    </svg>
  )

  // Exact Google-Maps destination pin: solid red teardrop balloon hovering
  // above a white target dot (white ring + dark center) planted on the route.
  const PinExact = ({ size = 44 }) => (
    <svg width={size} height={Math.round(size * 1.46)} viewBox="0 0 30 44" style={{ display: 'block' }}>
      {/* ground shadow under the target dot */}
      <ellipse cx="15" cy="40.5" rx="6.6" ry="2" fill="rgba(0,0,0,.30)" />
      {/* target dot — white ring + dark center, sits on the road */}
      <circle cx="15" cy="38" r="6.3" fill="#fff" />
      <circle cx="15" cy="38" r="3.2" fill="#202124" />
      {/* red teardrop balloon floating above the dot */}
      <path fill="#ea4335" d="M15 1.5C9.2 1.5 4.5 6.2 4.5 12c0 7.3 8.9 15.1 10 16.1.3.27.7.27 1 0C16.6 27.1 25.5 19.3 25.5 12 25.5 6.2 20.8 1.5 15 1.5z" />
      <circle cx="15" cy="12" r="3.7" fill="#b31412" />
    </svg>
  )

  // Route waypoint marker — white disc with a dark ring + center, like Maps stops.
  const WayDot = ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 17 17" style={{ display: 'block' }}>
      <circle cx="8.5" cy="8.5" r="7" fill="#fff" stroke="#3c4043" strokeWidth="2.4" />
      <circle cx="8.5" cy="8.5" r="2.7" fill="#3c4043" />
    </svg>
  )

  const Maps = () => (
    <div className="enter-canvas gmaps">
      <div className="gmaps-app">
        {/* ---- LEFT: directions panel — Google Maps directions clone ---- */}
        <div className="gmaps-panel gmd" style={{ width: panelW }}>
          {/* travel-mode tabs */}
          <div className="gmd-modes">
            <span className="gmd-mode is-dim" title="Directions"><I.M name="directions" size={22} /></span>
            <span className="gmd-mode is-active" title="Driving"><I.M name="directions_car" size={22} /><i>3 min</i></span>
            <span className="gmd-mode" title="Two-wheeler"><I.M name="two_wheeler" size={22} /><i>3 min</i></span>
            <span className="gmd-mode" title="Transit"><I.M name="directions_transit" size={22} /></span>
            <span className="gmd-mode" title="Walking"><I.M name="directions_walk" size={22} /><i>17 min</i></span>
            <span className="gmd-mode is-dim" title="Cycling"><I.M name="directions_bike" size={22} /></span>
            <button className="gmd-close" title="Collapse" onClick={() => setExpanded(false)}><I.M name="close" size={22} /></button>
          </div>
          <div className="gmd-compare"><span /></div>

          {/* origin → waypoint → destination */}
          <div className="gmd-trip">
            <div className="gmd-rail" aria-hidden="true">
              <span className="gmd-o" /><span className="gmd-dotline" />
              <span className="gmd-o" /><span className="gmd-dotline" />
              <span className="gmd-pin"><I.M name="location_on" size={24} /></span>
            </div>
            <div className="gmd-fields">
              {TRIP.map((t, i) => (
                <button key={i} className={'gmd-field' + (active === i && expanded ? ' is-active' : '')} onClick={() => openStop(i)}>
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* inline step detail (registration form / actions) — opens on field click */}
          {expanded && (
            <div className="gmd-detail">
              <div className="gmd-detail-h">
                <span className="gmd-detail-step">Stop {active + 1} · {ENTER_STEPS[active].title}</span>
                <button className="gmd-detail-x" title="Close" onClick={() => setExpanded(false)}><I.M name="expand_less" size={20} /></button>
              </div>
              {StepDetail(active)}
            </div>
          )}

          <div className="gmd-band" />

          <div className="gmd-routecard">
            <div className="gmd-routetop">
              <span className="gmd-routecar"><I.M name="directions_car" size={24} /></span>
              <div className="gmd-routemain">
                <div className="gmd-routetitle">via The Procedure</div>
                <div className="gmd-routesub">Fastest way in</div>
              </div>
              <div className="gmd-routeeta"><b>~5 min</b><span>3 stops</span></div>
            </div>
            <div className="gmd-routelinks">
              <button onClick={() => openStop(0)}>Details</button>
              <button onClick={onEnter}>Preview</button>
            </div>
          </div>

          <div className="gmd-band" />
          <div className="gmd-explore">
            <div className="gmd-explore-h">The Procedure · 3 steps</div>
            <div className="gmd-cats">
              {ENTER_STEPS.map((s, i) => (
                <button key={s.n} className="gmd-cat" onClick={() => openStop(i)}>
                  <span className="gmd-cat-ic" style={{ background: ['#1a73e8', '#1e8e3e', '#d93025'][i] }}><I.M name={s.icon} size={24} /></span>
                  {['Register', 'Send', 'Submit'][i]}
                </button>
              ))}
            </div>
          </div>

          <div className="gmd-band" />
          <div className="gmd-due">
            <I.M name="schedule" size={16} /> Registration closes Jul 6 · Submit reply by Jul 7
          </div>
        </div>

        {/* drag handle to resize the panel */}
        <div className="gmaps-resizer" onMouseDown={startDrag} role="separator" aria-orientation="vertical" title="Drag to resize">
          <span className="gmaps-resizer-grip" />
        </div>

        {/* ---- RIGHT: map canvas — Amritsar (Tea stalls → Vivek Public School → destination) ---- */}
        <div className="gmaps-map">
          <svg className="gmaps-canvas" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* base land + lighter built-up / airport zones */}
            <rect x="0" y="0" width="100" height="100" fill="#cfe8c6" />
            <path d="M52 74 L100 66 L100 100 L46 100 Z" fill="#eceff0" />
            <ellipse cx="93" cy="46" rx="13" ry="22" fill="#bfe1b3" />
            <ellipse cx="17" cy="92" rx="16" ry="12" fill="#bfe1b3" />
            <path d="M0 13 L25 17 L21 41 L0 45 Z" fill="#dde3ea" />
            {/* canal shadowing the route */}
            <path className="gmaps-canal" d="M50 24 L43 40 L41 50 L40.4 67 L39.5 74 L31 78" vectorEffect="non-scaling-stroke" />
            {/* minor road network */}
            <g className="gmaps-minor">
              <path d="M0 31 L40 23 L72 11" vectorEffect="non-scaling-stroke" />
              <path d="M4 56 L46 48 L82 41" vectorEffect="non-scaling-stroke" />
              <path d="M9 81 L52 73 L92 65" vectorEffect="non-scaling-stroke" />
              <path d="M31 -2 L36 42 L40 102" vectorEffect="non-scaling-stroke" />
              <path d="M61 28 L66 70 L72 102" vectorEffect="non-scaling-stroke" />
              <path d="M79 33 L85 76 L91 102" vectorEffect="non-scaling-stroke" />
              <path d="M50 60 L100 52" vectorEffect="non-scaling-stroke" />
              <path d="M53 84 L100 77" vectorEffect="non-scaling-stroke" />
              <path d="M63 44 L99 39" vectorEffect="non-scaling-stroke" />
              <path d="M70 90 L100 84" vectorEffect="non-scaling-stroke" />
              <path d="M46 90 L74 96" vectorEffect="non-scaling-stroke" />
            </g>
            {/* major highway: gray casing + traffic-coloured overlay */}
            <path className="gmaps-hwy-case" d="M41 -2 L51 21 L61 43 L74 68 L89 102" vectorEffect="non-scaling-stroke" />
            <path className="gmaps-hwy-ok"   d="M41 -2 L51 21 L61 43 L74 68 L89 102" vectorEffect="non-scaling-stroke" />
            <path className="gmaps-hwy-slow" d="M49 17 L52 24" vectorEffect="non-scaling-stroke" />
            <path className="gmaps-hwy-bad"  d="M73 66 L76 73" vectorEffect="non-scaling-stroke" />
            <path className="gmaps-hwy-slow" d="M85 94 L88 100" vectorEffect="non-scaling-stroke" />
            {/* purple route */}
            <path className="gmaps-route-case" d={ROUTE_D} vectorEffect="non-scaling-stroke" />
            <path className="gmaps-route-ln"   d={ROUTE_D} vectorEffect="non-scaling-stroke" />
          </svg>

          {/* 354 highway shields */}
          <span className="gmaps-shield" style={{ left: '44%', top: '15%' }}>9A</span>
          <span className="gmaps-shield" style={{ left: '60.5%', top: '42%' }}>9A</span>

          {/* POI labels */}
          <div className="gmaps-lbl gmaps-lbl-muted" style={{ left: '6%', top: '17%', width: '21%' }}>Hudson Regional Airport</div>
          <div className="gmaps-lbl gmaps-lbl-pa" style={{ left: '6.5%', top: '31%', width: '19%' }}>Terminal Access Rd</div>
          <div className="gmaps-lbl gmaps-lbl-muted" style={{ left: '60%', top: '2%', width: '15%' }}>St. Mark's Chapel</div>
          <span className="gmaps-poimk" style={{ left: '70%', top: '3.5%', background: '#9334e6' }}><I.M name="church" size={12} /></span>
          <div className="gmaps-lbl gmaps-lbl-muted" style={{ left: '43.5%', top: '22.5%', width: '12%' }}>The Carlyle Hotel</div>
          <span className="gmaps-poimk" style={{ left: '54%', top: '24%', background: '#c5221f' }}><I.M name="hotel" size={12} /></span>
          <div className="gmaps-lbl gmaps-lbl-dark" style={{ left: '60%', top: '22%' }}>Joe's Coffee Cart</div>
          <span className="gmaps-poimk" style={{ left: '66%', top: '26%', background: '#e0457b' }}><I.M name="hotel" size={12} /></span>
          <div className="gmaps-lbl gmaps-lbl-dark" style={{ left: '52%', top: '44%' }}>Hudson Public School</div>
          <div className="gmaps-lbl gmaps-lbl-park" style={{ left: '77.5%', top: '46%' }}>Riverside Park</div>
          <div className="gmaps-lbl gmaps-lbl-purple" style={{ left: '61%', top: '70%', width: '11%' }}>Gramercy Garden Hotel</div>
          <span className="gmaps-poimk" style={{ left: '69%', top: '73.5%', background: '#9c5d1e' }}><I.M name="hotel" size={12} /></span>
          <div className="gmaps-lbl gmaps-lbl-purple" style={{ left: '33%', top: '85%' }}>Gotham Diner</div>
          <span className="gmaps-poimk" style={{ left: '43%', top: '85.5%', background: '#e0457b' }}><I.M name="restaurant" size={12} /></span>
          <div className="gmaps-lbl gmaps-lbl-dark2" style={{ left: '29%', top: '90%' }}>Greenpoint</div>
          <div className="gmaps-lbl gmaps-lbl-purple" style={{ left: '64%', top: '92%' }}>Haven Rooftop</div>

          {/* road-name labels rotated along the highway */}
          <div className="gmaps-road-lbl" style={{ left: '63%', top: '55%' }}>Broadway</div>
          <div className="gmaps-road-lbl" style={{ left: '75%', top: '75%' }}>Hudson Pkwy</div>
          <div className="gmaps-road-lbl" style={{ left: '82%', top: '92%' }}>Canal St</div>

          {/* 3 min / 1.3 km route badge */}
          <div className="gmaps-eta" style={{ left: '33%', top: '58%' }}>
            <I.M name="directions_car" size={15} />
            <span><b>3 min</b><i>1.3 km</i></span>
          </div>

          {/* route stops + destination pin */}
          {STOPS.map((p, i) => {
            const isDest = i === lastStop
            return (
              <button key={i}
                className={'gmaps-mpin' + (isDest ? ' gmaps-mpin-dest' : ' gmaps-mpin-dot') + (active === i && expanded ? ' is-active' : '')}
                style={{ left: p.x + '%', top: p.y + '%' }}
                onClick={() => openStop(i)}>
                {isDest ? <PinExact size={44} /> : <WayDot size={17} />}
                <span className="gmaps-mpin-tip">{ENTER_STEPS[i].title}</span>
              </button>
            )
          })}

          {/* search-along-route + category chips */}
          <div className="gmaps-srch"><I.M name="search" size={18} /><span>Search along the route…</span></div>
          <div className="gmaps-chips">
            <span className="gmaps-chip"><I.M name="local_gas_station" size={15} /> Gas</span>
            <span className="gmaps-chip"><I.M name="ev_station" size={15} /> EV charging</span>
            <span className="gmaps-chip"><I.M name="hotel" size={15} /> Hotels</span>
          </div>

          {/* controls */}
          <button className="gmaps-pegman" title="Street View" tabIndex={-1}><I.M name="directions_walk" size={20} /></button>
          <button className="gmaps-myloc" title="Your location" onClick={() => openStop(0)}><I.M name="my_location" size={20} /></button>
          <div className="gmaps-ctrl gmaps-zoom">
            <button className="gmaps-ctrl-btn" tabIndex={-1}><I.M name="add" size={18} /></button>
            <span className="gmaps-ctrl-sep" />
            <button className="gmaps-ctrl-btn" tabIndex={-1}><I.M name="remove" size={18} /></button>
          </div>
          <div className="gmaps-attr">Map data ©2026 · 200 m</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="view-panel enter-shell">
      <div className="enter-uinav">
        <button className={'enter-uitab' + (ui === 'maps' ? ' is-active' : '')} onClick={() => setUi('maps')}>
          <I.M name="map" size={18} /> Maps
        </button>
        <button className={'enter-uitab' + (ui === 'classroom' ? ' is-active' : '')} onClick={() => setUi('classroom')}>
          <I.M name="school" size={18} /> Classroom
        </button>
        <button className={'enter-uitab' + (ui === 'story' ? ' is-active' : '')} onClick={() => setUi('story')}>
          <I.M name="auto_stories" size={18} /> The Story
        </button>
        <button className={'enter-uitab' + (ui === 'chat' ? ' is-active' : '')} onClick={() => setUi('chat')}>
          <I.M name="forum" size={18} /> Team Chat
        </button>
      </div>
      {ui === 'maps' ? Maps() : ui === 'classroom' ? Classroom() : ui === 'story' ? <ViewStory /> : <ViewChat />}
    </div>
  )
}

// ================================================================
// VIEW: CALENDAR — Google Calendar WEEK View
// ================================================================
const WEEKDAYS_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_ABBR  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Hours displayed in the timed grid (6 AM → 7 PM inclusive)
const HOUR_START = 6
const HOUR_END   = 19  // last hour label shown; grid goes to 20 (end of 7pm slot)
const GRID_TOP_HOUR    = 6   // earliest hour in the grid
const GRID_BOTTOM_HOUR = 20  // grid ends at 20:00 (exclusive)
const GRID_HOURS       = GRID_BOTTOM_HOUR - GRID_TOP_HOUR // 14 hours
const HOUR_PX          = 56  // px per hour

// GCal color palette
const COLOR_MAP = {
  blue:       '#1a73e8',
  'faint-blue': 'rgba(26,115,232,0.15)',
  green:      '#0b8043',
  purple:     '#8e24aa',
  amber:      '#f09300',
  orange:     '#e8710a',
  red:        '#d50000',
  teal:       '#009688',
  graphite:   '#616161',
}
const COLOR_TEXT = {
  'faint-blue': '#1a73e8',
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function fmtYMD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
// Return Monday of the week that contains `date`
function weekStart(date) {
  const d = new Date(date)
  const dow = d.getDay() // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow // shift so Mon=0
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Events are authored in IST (+5:30). Convert each timed event into a target
// IANA timezone so it lands on the right day/slot for the viewer. The target tz
// is resolved from the viewer's IP (so a VPN is respected), falling back to the
// device clock. DST-safe: we build the true UTC instant, then read it back in tz.
const IST_OFFSET_MIN = 330
// Device timezone, used as the default + fallback.
const DEVICE_TZ = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata' }
  catch { return 'Asia/Kolkata' }
})()
// IST wall-clock (ymd, hhmm) → { date, time } in the given IANA timezone.
function istToTz(ymd, hhmm, tz) {
  const [y, mo, d] = ymd.split('-').map(Number)
  const [h, mi] = hhmm.split(':').map(Number)
  const instant = new Date(Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET_MIN * 60000)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(instant).reduce((a, p) => (a[p.type] = p.value, a), {})
  const hr = parts.hour === '24' ? '00' : parts.hour
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${hr}:${parts.minute}` }
}
// Short label for a timezone, e.g. "PDT", "GMT+2" (fallback "local")
function tzAbbr(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date())
    return parts.find(p => p.type === 'timeZoneName')?.value || 'local'
  } catch { return 'local' }
}
// Map all events into target tz (timed only; all-day banners stay as date markers).
function localizeEvents(tz) {
  return EVENTS.map(ev => {
    if (ev.allDay || !ev.start) return ev
    const s = istToTz(ev.date, ev.start, tz)
    const e = istToTz(ev.date, ev.end, tz)
    const end = e.date === s.date ? e.time : '23:59' // clamp if it crosses local midnight
    return { ...ev, date: s.date, start: s.time, end, istDate: ev.date, istStart: ev.start, istEnd: ev.end }
  })
}
// Resolve the viewer's timezone from their IP (respects VPN). Falls back to device.
// GeoJS is CORS-enabled + key-free and works from the browser; ipapi.co is a
// secondary fallback. (The old ipwho.is endpoint started returning 403, and
// ipapi.co alone was CORS-blocked here, so the tz silently fell back to device.)
async function fetchIpTz() {
  try {
    const r = await fetch('https://get.geojs.io/v1/ip/geo.json')
    if (r.ok) { const j = await r.json(); if (j && j.timezone) return j.timezone }
  } catch {}
  try {
    const r = await fetch('https://ipapi.co/json/')
    if (r.ok) { const j = await r.json(); if (j && j.timezone) return j.timezone }
  } catch {}
  return null
}

// Default week: Mon Jun 22 2026
const DEFAULT_WEEK = new Date(2026, 5, 22)
const TODAY_YMD = '2026-06-18'

// "09:00" → "9:00 AM"
function fmt12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`
}
// Date/time line for the event popup
function eventWhen(ev, tzLabel = 'local') {
  const base = parseDate(ev.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  if (ev.allDay) {
    if (ev.dateEnd) return `${base} – ${parseDate(ev.dateEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
    return base
  }
  const local = `${base} · ${fmt12(ev.start)} – ${fmt12(ev.end)} ${tzLabel}`
  if (ev.istStart) return `${local}  (${fmt12(ev.istStart)} – ${fmt12(ev.istEnd)} IST)`
  return local
}

// Build a Google Calendar "add event" template link for the whole competition
// window — an all-day, multi-day event from Launch (Jun 24) through Submissions
// close (Jul 7). GCal treats the end date as exclusive, so we add one day.
// The four key dates (launch / reg close / submit / winners) go in the details.
function gcalAddUrl() {
  const ymd = s => s.replace(/-/g, '')
  const find = re => (DEADLINES.find(d => re.test(d.label)) || {}).date
  const launch   = find(/launch/i)      || '2026-06-24'
  const regClose = find(/reg closes/i)   || '2026-06-30'
  const submit   = find(/submit/i)       || '2026-07-07'
  const winners  = find(/winners/i)      || '2026-07-10'
  // End date is exclusive in Google Calendar, so push it one day past the submit deadline.
  const [y, m, d] = submit.split('-').map(Number)
  const endExcl = fmtYMD(addDays(new Date(y, m - 1, d), 1))
  const nice = s => parseDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const details =
    `Launch & registrations open: ${nice(launch)}\n` +
    `Registrations close: ${nice(regClose)}\n` +
    `Submissions close: ${nice(submit)}\n` +
    `Winners announced: ${nice(winners)}\n\n` +
    `Get the reply. https://thecold.email`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'thecold.email: The Cold Email Competition',
    dates: `${ymd(launch)}/${ymd(endExcl)}`,
    details,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function ViewCalendar() {
  const [monDate, setMonDate] = useState(weekStart(DEFAULT_WEEK))
  const [sel, setSel] = useState(null)  // selected event → detail popup

  // Viewer timezone: start from device clock, then upgrade to IP-based (VPN-aware).
  const [tz, setTz] = useState(DEVICE_TZ)
  useEffect(() => {
    let alive = true
    fetchIpTz().then(t => { if (alive && t) setTz(t) })
    return () => { alive = false }
  }, [])
  const events  = localizeEvents(tz)
  const tzLabel = tzAbbr(tz)

  // The 7 days Mon→Sun
  const days = Array.from({ length: 7 }, (_, i) => addDays(monDate, i))
  const dayYMDs = days.map(fmtYMD)

  // Title: month name + year, e.g. "June 2026" (or "Jun – Jul 2026" if the week spans two months)
  const sunDate = days[6]
  const weekTitle = monDate.getMonth() === sunDate.getMonth()
    ? `${monDate.toLocaleString('en-US', { month: 'long' })} ${sunDate.getFullYear()}`
    : `${MONTH_ABBR[monDate.getMonth()]} – ${MONTH_ABBR[sunDate.getMonth()]} ${sunDate.getFullYear()}`

  // Nav — span every event week, plus one buffer week before and after.
  // Events run across 3 weeks → 5 navigable weeks total.
  const eventTimes = events.map(e => parseDate(e.date).getTime())
  const firstWeek = weekStart(new Date(Math.min(...eventTimes)))
  const lastWeek  = weekStart(new Date(Math.max(...eventTimes)))
  const minWeekTs = addDays(firstWeek, -7).getTime()
  const maxWeekTs = addDays(lastWeek,   7).getTime()
  const atMin = monDate.getTime() <= minWeekTs
  const atMax = monDate.getTime() >= maxWeekTs
  const goPrev  = () => setMonDate(d => atMin ? d : addDays(d, -7))
  const goNext  = () => setMonDate(d => atMax ? d : addDays(d,  7))
  const goToday = () => setMonDate(weekStart(new Date(2026, 5, 18)))

  // Partition events into all-day and timed, filtered to visible week
  const monTs  = monDate.getTime()
  const sunTs  = addDays(monDate, 7).getTime() - 1

  const allDayEvents = []
  const timedByDay   = {}  // ymd → [event, ...]
  dayYMDs.forEach(ymd => { timedByDay[ymd] = [] })

  events.forEach(ev => {
    if (ev.allDay) {
      const evStart = parseDate(ev.date).getTime()
      const evEnd   = ev.dateEnd ? parseDate(ev.dateEnd).getTime() : evStart
      // Overlaps the visible week?
      if (evEnd >= monTs && evStart <= sunTs) {
        allDayEvents.push(ev)
      }
    } else {
      if (dayYMDs.includes(ev.date)) {
        timedByDay[ev.date].push(ev)
      }
    }
  })

  // Count events in visible week
  const totalEvents = allDayEvents.length + Object.values(timedByDay).flat().length

  // For each day column, group all-day events
  // Build per-day all-day event list (for the all-day row)
  const allDayByDay = {}
  dayYMDs.forEach(ymd => { allDayByDay[ymd] = [] })
  const dayObjs = days.map(fmtYMD)

  allDayEvents.forEach(ev => {
    const evStartYMD = ev.date
    const evEndYMD   = ev.dateEnd || ev.date
    dayObjs.forEach((ymd, i) => {
      const d = days[i]
      const ts = d.getTime()
      const s  = parseDate(evStartYMD).getTime()
      const e  = parseDate(evEndYMD).getTime()
      if (ts >= s && ts <= e) {
        allDayByDay[ymd].push(ev)
      }
    })
  })

  const MAX_ALLDAY_VISIBLE = 3

  // Hour labels 6 AM → 7 PM
  const hourLabels = []
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    hourLabels.push(h)
  }

  // Position helpers
  function topPct(startMin) {
    const offsetMin = startMin - GRID_TOP_HOUR * 60
    return (offsetMin / (GRID_HOURS * 60)) * 100
  }
  function heightPct(startMin, endMin) {
    return ((endMin - startMin) / (GRID_HOURS * 60)) * 100
  }

  // Overlap grouping: for a day's timed events, assign column slots
  function groupOverlapping(events) {
    // Sort by start
    const sorted = [...events].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
    const cols = []   // cols[i] = array of events in column i
    const assigned = sorted.map(ev => {
      const startM = timeToMinutes(ev.start)
      const endM   = timeToMinutes(ev.end)
      // Find first column where last event ends <= startM
      let col = cols.findIndex(c => {
        const last = c[c.length - 1]
        return timeToMinutes(last.end) <= startM
      })
      if (col === -1) { col = cols.length; cols.push([]) }
      cols[col].push(ev)
      return { ev, col }
    })
    return { assigned, totalCols: cols.length }
  }

  return (
    <div className="view-panel view-panel-calendar">
      {/* ---- Header bar ---- */}
      <div className="gcalw-topbar">
        <div className="gcalw-nav-left">
          <button className="gcalw-nav-round" title="Previous week" onClick={goPrev}>‹</button>
          <button className="gcalw-nav-round" title="Next week"     onClick={goNext}>›</button>
          <button className="gcalw-today-btn" onClick={goToday}>Today</button>
          <span className="gcalw-title">{weekTitle}</span>
        </div>
        <div className="gcalw-nav-right">
          <span className="gcalw-event-count">{totalEvents} events</span>
          <a className="gcal-add-btn" href={gcalAddUrl()} target="_blank" rel="noopener noreferrer"
             title="Add the competition dates to your own calendar">
            <I.M name="calendar_add_on" size={18} /> Add to your calendar
          </a>
        </div>
      </div>

      {/* ---- Scrollable board: header + all-day + timed grid pan together on small screens ---- */}
      <div className="gcalw-board">
      {/* ---- Day column headers ---- */}
      <div className="gcalw-header-row">
        {/* Gutter placeholder */}
        <div className="gcalw-gutter-label" />
        {days.map((day, i) => {
          const ymd     = dayYMDs[i]
          const isToday = ymd === TODAY_YMD
          const dow     = WEEKDAYS_SHORT[i]
          return (
            <div key={ymd} className="gcalw-day-head">
              <span className="gcalw-dow">{dow}</span>
              <span className={`gcalw-day-num${isToday ? ' gcalw-today' : ''}`}>
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* ---- All-day row ---- */}
      <div className="gcalw-allday-row">
        <div className="gcalw-gutter-label gcalw-allday-gutter">no time</div>
        {days.map((day, i) => {
          const ymd   = dayYMDs[i]
          const evs   = allDayByDay[ymd] || []
          const shown = evs.slice(0, MAX_ALLDAY_VISIBLE)
          const more  = evs.length - shown.length
          return (
            <div key={ymd} className="gcalw-allday-cell">
              {shown.map((ev, j) => {
                const bg   = COLOR_MAP[ev.color] || '#1a73e8'
                const isFaint = ev.color === 'faint-blue'
                return (
                  <div
                    key={j}
                    className="gcalw-allday-pill"
                    style={{
                      background: bg,
                      color: isFaint ? COLOR_TEXT['faint-blue'] : '#fff',
                      border: isFaint ? '1px solid rgba(26,115,232,0.4)' : 'none',
                      cursor: 'pointer',
                    }}
                    title={ev.title}
                    onClick={(e) => setSel({ ev, x: e.clientX, y: e.clientY })}
                  >
                    {ev.title}
                  </div>
                )
              })}
              {more > 0 && (
                <div className="gcalw-allday-more">+{more} more</div>
              )}
            </div>
          )
        })}
      </div>

      {/* ---- Timed grid (scrolls) ---- */}
      <div className="gcalw-grid-scroll">
        <div className="gcalw-grid-inner" style={{ height: GRID_HOURS * HOUR_PX }}>
          {/* Hour lines + gutter labels */}
          {hourLabels.map(h => {
            const top = (h - GRID_TOP_HOUR) * HOUR_PX
            const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
            return (
              <div key={h} className="gcalw-hour-row" style={{ top, height: HOUR_PX }}>
                <div className="gcalw-hour-label">{label}</div>
                <div className="gcalw-hour-line" />
              </div>
            )
          })}

          {/* Day columns (7) */}
          <div className="gcalw-day-cols">
            {days.map((day, i) => {
              const ymd    = dayYMDs[i]
              const events = timedByDay[ymd] || []
              const { assigned, totalCols } = groupOverlapping(events)

              return (
                <div key={ymd} className="gcalw-day-col">
                  {assigned.map(({ ev, col }) => {
                    const startM = timeToMinutes(ev.start)
                    const endM   = timeToMinutes(ev.end)
                    const topPx  = (startM - GRID_TOP_HOUR * 60) * (HOUR_PX / 60)
                    const heightPx = Math.max((endM - startM) * (HOUR_PX / 60), 18)
                    const widthPct = 100 / totalCols
                    const bg     = COLOR_MAP[ev.color] || '#1a73e8'
                    return (
                      <div
                        key={ev.title + ev.start}
                        className="gcalw-event-block"
                        style={{
                          top:    topPx,
                          height: heightPx,
                          left:   `${col * widthPct + 1}%`,
                          width:  `${widthPct - 2}%`,
                          background: bg,
                          cursor: 'pointer',
                        }}
                        title={`${ev.start}–${ev.end} ${ev.title}`}
                        onClick={(e) => setSel({ ev, x: e.clientX, y: e.clientY })}
                      >
                        <div className="gcalw-event-title">{ev.title}</div>
                        <div className="gcalw-event-time">{ev.start}–{ev.end}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      </div>

      {/* ---- Event detail popup (Google Calendar style) ---- */}
      {sel && (() => {
        const CARD_W = 440, CARD_H = 360, PAD = 12
        const left = Math.max(PAD, Math.min(sel.x + 8, window.innerWidth - CARD_W - PAD))
        const top  = Math.max(PAD, Math.min(sel.y + 8, window.innerHeight - CARD_H - PAD))
        // animate outward from the click point relative to the card's top-left
        const ox = Math.max(0, Math.min(sel.x - left, CARD_W))
        const oy = Math.max(0, Math.min(sel.y - top, CARD_H))
        return (
          <div className="gcev-overlay" onClick={() => setSel(null)}>
            <div className="gcev-card" onClick={e => e.stopPropagation()}
              style={{ left, top, transformOrigin: `${ox}px ${oy}px` }}>
              <div className="gcev-actions">
                <span className="gcev-ic" title="Delete"><I.M name="delete" size={20} /></span>
                <span className="gcev-ic" title="More options"><I.M name="more_vert" size={20} /></span>
                <span className="gcev-ic" title="Close" onClick={() => setSel(null)}><I.M name="close" size={20} /></span>
              </div>
              <div className="gcev-head">
                <span className="gcev-dot" style={{ background: COLOR_MAP[sel.ev.color] || '#1a73e8' }} />
                <div className="gcev-head-text">
                  <div className="gcev-title">{sel.ev.title}</div>
                  <div className="gcev-when">{eventWhen(sel.ev, tzLabel)}</div>
                </div>
              </div>
              <div className="gcev-row">
                <span className="gcev-row-ic"><I.M name="segment" size={20} /></span>
                <div className="gcev-row-text">
                  <div>{sel.ev.allDay ? 'All-day event' : 'thecold.email event'}</div>
                  <div className="gcev-row-sub">Get the reply. One cold email can change everything.</div>
                </div>
              </div>
              <div className="gcev-row">
                <span className="gcev-row-ic"><I.M name="calendar_month" size={20} /></span>
                <div className="gcev-row-text">thecold.email</div>
              </div>
              <div className="gcev-row">
                <span className="gcev-row-ic"><I.M name="public" size={20} /></span>
                <div className="gcev-row-text">Public</div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ---------------- VIEW: BEST EMAIL EVER ----------------
const AVATAR_COLORS = ['#1a73e8', '#34a853', '#ea4335', '#fbbc04', '#9c27b0']

// First line of a body, used as the inbox-row snippet
function snippet(text) {
  return text.split('\n').map(l => l.trim()).filter(Boolean).slice(1).join(' ').slice(0, 90)
}

// Build a clean, standalone HTML page for one email thread
function threadHtml(em) {
  const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  const cleanSubject = em.subject.replace(/^\[PLACEHOLDER\]\s*/, '')
  const msgs = [
    { name: em.from, email: em.fromEmail, to: em.to ? `to ${em.to}` : 'to judges',
      date: em.replyFrom ? em.date : 'Example entry', body: em.body },
    { name: em.replyFrom || 'Recipient', email: em.replyEmail, to: 'to me',
      date: em.replyDate || 'Real reply', body: em.reply },
  ]
  const msgHtml = msgs.map(m => `
    <div class="msg">
      <div class="who"><strong>${esc(m.name)}</strong>${m.email ? ` &lt;${esc(m.email)}&gt;` : ''}<span class="date">${esc(m.date)}</span></div>
      <div class="to">${esc(m.to)}</div>
      <div class="body">${esc(m.body)}</div>
    </div>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(cleanSubject)}</title>
<style>
  body { font-family: Arial, 'Helvetica Neue', sans-serif; color:#202124; margin:40px; max-width:720px; }
  h1 { font-size:22px; font-weight:400; margin:0 0 8px; }
  .brand { color:#5f6368; font-size:12px; margin:0 0 20px; }
  .msg { border-top:1px solid #e0e0e0; padding:18px 0; }
  .who { font-size:14px; }
  .date { color:#5f6368; font-size:12px; margin-left:10px; }
  .to { color:#5f6368; font-size:12px; margin:2px 0 12px; }
  .body { white-space:pre-wrap; font-size:14px; line-height:1.6; }
</style></head>
<body><h1>${esc(cleanSubject)}</h1><div class="brand">thecold.email${em.tag ? ` · ${esc(em.tag)}` : ''}</div>${msgHtml}</body></html>`
}

// Open the email thread in a new tab (clean standalone page)
function openThread(em) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.open()
  w.document.write(threadHtml(em))
  w.document.close()
  w.focus()
}

// Open the email thread in a new tab, then pop the print dialog
function printThread(em) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.open()
  w.document.write(threadHtml(em))
  w.document.close()
  w.focus()
  // give the new tab a moment to lay out before invoking the print dialog
  setTimeout(() => w.print(), 250)
}

function ViewBest() {
  const [open, setOpen] = useState(null) // null = inbox list; index = open thread
  const [aiOpen, setAiOpen] = useState(true)
  const [collapsedMsgs, setCollapsedMsgs] = useState(() => new Set()) // indices collapsed to first line

  // -------- Open thread (reading pane) --------
  if (open != null) {
    const em = BEST_EMAILS[open]
    const color = AVATAR_COLORS[open % AVATAR_COLORS.length]
    const msgs = [
      { name: em.from, email: em.fromEmail, av: color, img: em.avatar,
        to: em.to ? `to ${em.to}` : 'to judges', date: em.replyFrom ? em.date : 'Example entry', body: em.body },
      { name: em.replyFrom || 'Recipient', email: em.replyEmail, av: '#5f6368', img: em.replyAvatar,
        to: 'to me', date: em.replyDate || '✓ Real reply', body: em.reply },
    ]
    const allCollapsed = msgs.length > 0 && collapsedMsgs.size >= msgs.length
    const toggleAll = () => setCollapsedMsgs(allCollapsed ? new Set() : new Set(msgs.map((_, i) => i)))
    const toggleMsg = (i) => setCollapsedMsgs(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
    return (
      <div className="view-panel gm-panel">
        {/* Dark Gmail toolbar */}
        <div className="gm-topbar">
          <div className="gm-topbar-left">
            <span className="gm-tic" title="Back" onClick={() => setOpen(null)}><I.M name="arrow_back" size={22} /></span>
            <span className="gm-tsep" />
            <span className="gm-tic" title="Archive"><I.M name="archive" size={20} /></span>
            <span className="gm-tic" title="Report spam"><I.M name="report" size={20} /></span>
            <span className="gm-tic" title="Delete"><I.M name="delete" size={20} /></span>
            <span className="gm-tsep-bar" />
            <span className="gm-tic" title="Mark as unread"><I.M name="mark_email_unread" size={20} /></span>
            <span className="gm-tic" title="Move to"><I.M name="drive_file_move" size={20} /></span>
            <span className="gm-tic" title="More"><I.M name="more_vert" size={20} /></span>
          </div>
          <div className="gm-topbar-right">
            <span className="gm-count">3 of 38,105</span>
            <span className="gm-tic" title="Newer"><I.M name="chevron_left" size={22} /></span>
            <span className="gm-tic" title="Older"><I.M name="chevron_right" size={22} /></span>
            <span className="gm-tic" title="Keyboard"><I.M name="keyboard" size={20} /><I.M name="arrow_drop_down" size={16} /></span>
          </div>
        </div>
        <div className="gm-thread">
          {/* Subject bar */}
          <div className="gm-subject-bar">
            <div className="gm-subject-left">
              <h2 className="gm-subject">{em.subject}</h2>
              <span className="gm-important" title="Important"><I.M name="label_important" size={18} /></span>
              <span className="gm-label-chip">{em.tag || 'Inbox'} <I.M name="close" size={14} /></span>
            </div>
            <div className="gm-subject-right">
              <span className="gm-ic" title={allCollapsed ? 'Expand all' : 'Collapse all'} onClick={toggleAll}><I.M name={allCollapsed ? 'unfold_more' : 'unfold_less'} size={20} /></span>
              <span className="gm-ic" title="Print all" onClick={() => printThread(em)}><I.M name="print" size={20} /></span>
              <span className="gm-ic" title="In new window" onClick={() => openThread(em)}><I.M name="open_in_new" size={20} /></span>
            </div>
          </div>

          {/* Messages */}
          {msgs.map((m, i) => {
            const isCollapsed = collapsedMsgs.has(i)
            return (
            <div className="gm-msg" key={i}>
              {m.img
                ? <img className="gm-avatar gm-avatar-img" src={m.img} alt={m.name} />
                : <div className="gm-avatar" style={{ background: m.av }}>
                    {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>}
              <div className="gm-msg-main">
                <div className="gm-msg-top gm-msg-top-toggle" onClick={() => toggleMsg(i)} title={isCollapsed ? 'Expand' : 'Collapse'}>
                  <div className="gm-msg-who">
                    <div className="gm-msg-l1">
                      <span className="gm-from">{m.name}</span>
                      {m.email && <span className="gm-email">&lt;{m.email}&gt;</span>}
                    </div>
                    <div className="gm-to">{m.to} <I.M name="arrow_drop_down" size={16} /></div>
                  </div>
                  <div className="gm-msg-actions" onClick={e => e.stopPropagation()}>
                    <span className="gm-date">{m.date}</span>
                    <span className="gm-ic" title="Star"><I.M name="star_border" size={18} /></span>
                    <span className="gm-ic" title="React"><I.M name="add_reaction" size={18} /></span>
                    <span className="gm-ic" title="Reply"><I.M name="reply" size={18} /></span>
                    <span className="gm-ic" title="More"><I.M name="more_vert" size={18} /></span>
                  </div>
                </div>
                <div
                  className={isCollapsed ? 'gm-body gm-body-collapsed' : 'gm-body'}
                  onClick={isCollapsed ? () => toggleMsg(i) : undefined}
                >
                  {isCollapsed
                    ? (m.body.split('\n').map(l => l.trim()).filter(Boolean)[0] || '')
                    : m.body}
                </div>
              </div>
            </div>
            )
          })}

          {/* Footer actions */}
          <div className="gm-foot">
            <button className="gm-foot-btn"><I.M name="reply" size={18} /> Reply</button>
            <button className="gm-foot-btn"><I.M name="forward" size={18} /> Forward</button>
            <button className="gm-foot-emoji" title="React"><I.M name="add_reaction" size={20} /></button>
          </div>
        </div>
      </div>
    )
  }

  // -------- Inbox list --------
  return (
    <div className="view-panel">
      <div className="view-body view-body-best">
        <div className="ai-overview">
          <div className="ai-ov-head">
            <span className="ai-ov-spark"><I.Spark size={20} /></span>
            <span className="ai-ov-title">AI Overview</span>
            <span className="ai-ov-chevron" onClick={() => setAiOpen(o => !o)} title={aiOpen ? 'Collapse' : 'Expand'}>
              <I.M name={aiOpen ? 'expand_less' : 'expand_more'} size={22} />
            </span>
          </div>
          {aiOpen && (
            <p className="ai-ov-body">
              These are example cold emails, the best of thecold.email, proven by who actually replied. Akul will replace them with the real winning entries.
            </p>
          )}
        </div>
        <div className="bx-list">
          {BEST_EMAILS.map((em, i) => (
            <div className="bx-row" key={i} onClick={() => setOpen(i)}>
              <span className="bx-check" onClick={e => e.stopPropagation()}><I.M name="check_box_outline_blank" size={18} /></span>
              <span className="bx-star-btn" onClick={e => e.stopPropagation()} title="Star"><I.M name="star" size={18} /></span>
              <span className="bx-sender">{em.from}</span>
              <span className="bx-snippet">
                {em.tag && <span className="bx-tag">{em.tag}</span>}
                <span className="bx-subj">{em.subject.replace(/^\[PLACEHOLDER\]\s*/, '')}</span>
                <span className="bx-dash"> - {snippet(em.body)}</span>
              </span>
              <span className="bx-date">{em.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------- VIEW: TRACK DETAIL ----------------
// Renders a single track's full detail from the EMAILS data
const TRACK_ICONS = {
  unreachable: <I.Plane size={24} />,
  subject:     <I.SparkPen size={24} />,
  twoliner:    <I.M name="short_text" size={24} />,
  ask:         <I.M name="help" size={24} />,
}

function ViewTrack({ topic }) {
  const data = TRACK_PAGES[topic]
  if (!data) return <div className="view-panel"><div className="view-body"><p>Track not found.</p></div></div>

  // Every track renders in the marked-up Google Doc style, using its own content.
  return <ViewTrackDoc data={data} title={TOPIC_NAMES[topic]} topic={topic} />
}

function ViewTrackUNUSED({ topic }) {
  const data = TRACK_PAGES[topic]
  return (
    <div className="view-panel">
      <div className="view-header">
        <span className="view-header-icon">{TRACK_ICONS[topic]}</span>
        <h2 className="view-title">{TOPIC_NAMES[topic]}</h2>
        <span className="track-prize-badge">$500</span>
      </div>
      <div className="view-body trackp">

        {/* The Goal */}
        <section className="trackp-sec">
          <h3 className="trackp-h">The Goal</h3>
          <p className="trackp-goal">{data.goal}</p>
          {data.goalExtra && <p className="trackp-sub">{data.goalExtra}</p>}
        </section>

        {/* How It's Won */}
        <section className="trackp-sec">
          <h3 className="trackp-h">How It's Won</h3>
          {data.howWon.map((l, i) => <p key={i} className="trackp-para">{l}</p>)}
        </section>

        {/* What This Track Rewards */}
        <section className="trackp-sec">
          <h3 className="trackp-h">What This Track Rewards</h3>
          {data.rewards.map((l, i) => <p key={i} className="trackp-para">{l}</p>)}
        </section>

        {/* What Judges Look For */}
        <section className="trackp-sec">
          <h3 className="trackp-h">What Judges Look For</h3>
          <ul className="trackp-list trackp-yes">
            {data.judges.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </section>

        {/* Strong Entries */}
        <section className="trackp-sec">
          <h3 className="trackp-h">Strong Entries</h3>
          <ul className="trackp-list trackp-dot">
            {data.strong.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </section>

        {/* Common Mistakes */}
        <section className="trackp-sec">
          <h3 className="trackp-h">Common Mistakes</h3>
          <ul className="trackp-list trackp-no">
            {data.mistakes.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </section>

        {/* Scoring */}
        <section className="trackp-sec">
          <h3 className="trackp-h">Scoring</h3>
          <div className="track-rubric">
            {data.scoring.map((s, i) => (
              <div className="track-rubric-row" key={i}>
                <span className="track-rubric-label">{s.label}</span>
                <span className="track-rubric-bar-wrap">
                  <span className="track-rubric-bar" style={{ width: `${s.pts}%` }} />
                  <span className="track-rubric-pts">{s.pts} pts</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Prize */}
        <section className="trackp-sec trackp-prize-sec">
          <h3 className="trackp-h">Prize</h3>
          <div className="trackp-prize">$500</div>
        </section>

        {/* Grand prize note */}
        <div className="track-grand-note">
          Every qualifying entry is also automatically considered for the <strong>★ Best Cold Email ($1,000 grand prize)</strong>.
        </div>

        {/* Remember — blue info box (every track) */}
        <div className="trackp-remember">
          <div className="trackp-remember-title"><I.M name="info" size={18} /> Remember</div>
          <p className="trackp-remember-lead">{TRACK_REMEMBER.lead}</p>
          <p className="trackp-remember-bold">{TRACK_REMEMBER.bold}</p>
          <p className="trackp-remember-body">{TRACK_REMEMBER.body}</p>
          <p className="trackp-remember-tag">{TRACK_REMEMBER.tag}</p>
        </div>

      </div>
    </div>
  )
}

// ---------------- VIEW: BEST SUBJECT LINE (Google Finance) ----------------
// Renders the subject-line track styled as a faithful Google Finance quote page.
function ViewTrackFinance({ data }) {
  const ranges = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX']
  // Decorative upward-trending series -> SVG area + line path (Finance blue).
  const series = [38, 41, 39, 44, 43, 49, 47, 55, 60, 58, 66, 71, 69, 78, 82, 80, 88, 92, 90, 100]
  const W = 720, H = 240, PAD = 8
  const max = 108, min = 28
  const pts = series.map((v, i) => {
    const x = PAD + (i * (W - PAD * 2)) / (series.length - 1)
    const y = H - PAD - ((v - min) / (max - min)) * (H - PAD * 2)
    return [x, y]
  })
  const linePath = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${pts[pts.length - 1][0].toFixed(1)} ${H} L${pts[0][0].toFixed(1)} ${H} Z`
  const lastY = pts[pts.length - 1][1]
  const lastX = pts[pts.length - 1][0]

  // Key stats: scoring rubric rows + on-theme metrics.
  const stats = [
    ...data.scoring.map(s => ({ label: s.label, value: `${s.pts} pts`, bar: s.pts })),
    { label: 'Prize', value: '$500' },
    { label: 'Grand prize', value: '$1,000' },
    { label: 'Replies counted', value: 'Real only' },
    { label: 'Judging criteria', value: data.judges.join(' · ') },
  ]

  return (
    <div className="view-panel gfin-canvas">
      <div className="gfin-wrap">

        {/* Quote header */}
        <div className="gfin-head">
          <div className="gfin-name-row">
            <h1 className="gfin-name">Best Subject Line</h1>
            <span className="gfin-ticker">SUBJ · TCE</span>
          </div>
          <div className="gfin-price-row">
            <span className="gfin-price">100.00</span>
            <span className="gfin-unit">pts</span>
            <span className="gfin-change gfin-up">
              <I.M name="arrow_drop_up" size={22} />+14.40 (+16.81%)
            </span>
          </div>
          <div className="gfin-subline">Closed · Track · Best Subject Line · in USD ($500 prize)</div>
        </div>

        {/* Range tabs */}
        <div className="gfin-ranges">
          {ranges.map(r => (
            <button key={r} className={`gfin-range${r === '1Y' ? ' gfin-range-active' : ''}`} type="button">{r}</button>
          ))}
        </div>

        {/* Chart */}
        <div className="gfin-chart">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="gfin-svg" role="img" aria-label="Subject line score trend">
            <defs>
              <linearGradient id="gfinFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#1a73e8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line className="gfin-baseline" x1="0" y1={H - PAD} x2={W} y2={H - PAD} />
            <path d={areaPath} fill="url(#gfinFill)" />
            <path d={linePath} fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={lastX} cy={lastY} r="3.5" fill="#1a73e8" />
          </svg>
        </div>

        {/* Key stats / rubric */}
        <section className="gfin-sec">
          <h2 className="gfin-sec-h">Key stats</h2>
          <div className="gfin-stats">
            {stats.map((s, i) => (
              <div className="gfin-stat-row" key={i}>
                <span className="gfin-stat-label">{s.label}</span>
                <span className="gfin-stat-val">
                  {s.bar != null && (
                    <span className="gfin-stat-bar-wrap">
                      <span className="gfin-stat-bar" style={{ width: `${s.bar}%` }} />
                    </span>
                  )}
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="gfin-sec">
          <h2 className="gfin-sec-h">About</h2>
          <p className="gfin-about gfin-about-lead">{data.goal}</p>
          {data.rewards.map((l, i) => <p key={`r${i}`} className="gfin-about">{l}</p>)}
          <div className="gfin-about-facts">
            {data.howWon.map((l, i) => (
              <div className="gfin-fact" key={`h${i}`}>
                <I.M name="check_circle" size={16} />
                <span>{l}</span>
              </div>
            ))}
          </div>
        </section>

        {/* News / related: Strong entries */}
        <section className="gfin-sec">
          <h2 className="gfin-sec-h">Strong entries</h2>
          <div className="gfin-news">
            {data.strong.map((l, i) => (
              <div className="gfin-news-row" key={i}>
                <div className="gfin-news-meta">Judging note · Subject craft</div>
                <div className="gfin-news-head">{l}</div>
                <div className="gfin-news-spark"><I.M name="trending_up" size={20} /></div>
              </div>
            ))}
          </div>
        </section>

        {/* Common mistakes */}
        <section className="gfin-sec">
          <h2 className="gfin-sec-h">Common mistakes</h2>
          <ul className="gfin-mistakes">
            {data.mistakes.map((l, i) => (
              <li key={i}><I.M name="cancel" size={16} /><span>{l}</span></li>
            ))}
          </ul>
        </section>

        {/* Remember callout */}
        <div className="gfin-remember">
          <div className="gfin-remember-lead">{TRACK_REMEMBER.lead}</div>
          <div className="gfin-remember-bold">{TRACK_REMEMBER.bold}</div>
          <div className="gfin-remember-body">{TRACK_REMEMBER.body}</div>
          <div className="gfin-remember-tag">{TRACK_REMEMBER.tag}</div>
        </div>

        <div className="gfin-disclaimer">
          Scores are illustrative. Every qualifying entry is also considered for the Best Cold Email ($1,000 grand prize).
        </div>

      </div>
    </div>
  )
}

// ---------------- VIEW: THE UNREACHABLE (Google Docs) ----------------
// Renders the unreachable track styled as a faithful Google Docs document.
// inline rich text for track copy: **bold**, __underline__
function RT({ children }) {
  if (typeof children !== 'string') return children
  return children.split(/(\*\*[^*]+\*\*|__[^_]+__)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.startsWith('__') && p.endsWith('__')) return <u key={i}>{p.slice(2, -2)}</u>
    return p
  })
}

// ---- shared decorative hand-drawn arrow (used by the marked-up doc page + thumbnail) ----
function HandArrow({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 90 56" aria-hidden="true">
      <path d="M4 8 C 30 4, 64 14, 78 44" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M78 44 L 64 38 M78 44 L 82 28" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

// ===================== TRACK THEME DISPATCH =====================
// Every track page renders in the marked-up Google Doc style; TrackMarkedDoc
// pulls each track's own content from TRACK_PAGES[topic] (passed in as `data`).
function ViewTrackDoc({ data, title, topic }) {
  return <TrackMarkedDoc data={data} title={title} topic={topic} />
}

// ===================== SHARED GOOGLE DOCS FRAME =====================
// The Google Docs chrome (title bar + menu row + formatting toolbar, all sticky)
// plus the centered white page sheet. ALL 4 track themes render inside this so the
// top of every track page is identical Google Docs chrome; only the page content differs.
// `canvasClass` / `pageClass` let each theme add its namespace to tint/shape its sheet.
// Google-Docs-style font picker. Roboto is web-loaded (index.html); the rest are
// web-safe system fonts so they always render. `stack` is the actual CSS font-family.
const DOC_FONTS = [
  { name: 'Arial', stack: "Arial, 'Roboto', sans-serif" },
  { name: 'Roboto', stack: "'Roboto', Arial, sans-serif" },
  { name: 'Times New Roman', stack: "'Times New Roman', Times, serif" },
  { name: 'Georgia', stack: "Georgia, 'Times New Roman', serif" },
  { name: 'Verdana', stack: "Verdana, Geneva, sans-serif" },
  { name: 'Courier New', stack: "'Courier New', Courier, monospace" },
]

function DocFrame({ title, canvasClass = '', pageClass = '', children }) {
  const menus = ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Extensions', 'Help']
  const [font, setFont] = useState(DOC_FONTS[0])      // selected body font (default Arial)
  const [fontOpen, setFontOpen] = useState(false)     // is the font dropdown open
  const fontWrapRef = useRef(null)

  // close the font menu when clicking anywhere outside it
  useEffect(() => {
    if (!fontOpen) return
    const onDocClick = (e) => {
      if (fontWrapRef.current && !fontWrapRef.current.contains(e.target)) setFontOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [fontOpen])

  // children that care about reflow (TrackMarkedDoc) receive the active font so they
  // can re-measure their decorations; the font is also applied to the page wrapper.
  const renderedChildren = typeof children === 'function' ? children(font.stack) : children

  return (
    <div className={`view-panel gdoc-canvas ${canvasClass}`.trim()}>
      <div className="gdoc-chrome">
      {/* Title bar */}
      <div className="gdoc-titlebar">
        <span className="gdoc-doc-icon" aria-label="Google Docs">
          <svg width="22" height="28" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
            <path d="M29 0H6C2.69 0 0 2.69 0 6v52c0 3.31 2.69 6 6 6h36c3.31 0 6-2.69 6-6V19L29 0z" fill="#4285F4"/>
            <path d="M29 0v13c0 3.31 2.69 6 6 6h13L29 0z" fill="#A1C2FA"/>
            <rect x="12" y="30" width="24" height="3.4" rx="1.7" fill="#fff"/>
            <rect x="12" y="38.5" width="24" height="3.4" rx="1.7" fill="#fff"/>
            <rect x="12" y="47" width="16" height="3.4" rx="1.7" fill="#fff"/>
          </svg>
        </span>
        <div className="gdoc-title-block">
          <div className="gdoc-title-row">
            <span className="gdoc-docname">{title}</span>
            <span className="gdoc-star" title="Star"><I.M name="star_border" size={18} /></span>
            <span className="gdoc-move" title="Move"><I.M name="drive_file_move" size={18} /></span>
          </div>
          <div className="gdoc-menubar">
            {menus.map(m => <span className="gdoc-menu" key={m}>{m}</span>)}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="gdoc-toolbar">
        <span className="gdoc-tb-btn" title="Undo"><I.M name="undo" size={20} /></span>
        <span className="gdoc-tb-btn" title="Redo"><I.M name="redo" size={20} /></span>
        <span className="gdoc-tb-btn" title="Print"><I.M name="print" size={20} /></span>
        <span className="gdoc-tb-btn" title="Spelling"><I.M name="spellcheck" size={20} /></span>
        <span className="gdoc-tb-sep" />
        <span className="gdoc-tb-zoom">100%<I.M name="arrow_drop_down" size={18} /></span>
        <span className="gdoc-tb-sep" />
        <span className="gdoc-tb-style">Normal text<I.M name="arrow_drop_down" size={18} /></span>
        <span className="gdoc-tb-sep" />
        <span className="gdoc-font-wrap" ref={fontWrapRef}>
          <span
            className="gdoc-tb-font"
            title="Font"
            onClick={() => setFontOpen(o => !o)}
          >
            {font.name}<I.M name="arrow_drop_down" size={18} />
          </span>
          {fontOpen && (
            <div className="gdoc-font-menu" role="menu">
              {DOC_FONTS.map(f => (
                <div
                  key={f.name}
                  role="menuitemradio"
                  aria-checked={f.name === font.name}
                  className={`gdoc-font-item${f.name === font.name ? ' is-active' : ''}`}
                  style={{ fontFamily: f.stack }}
                  onClick={() => { setFont(f); setFontOpen(false) }}
                >
                  <I.M name="check" size={18} className="gdoc-font-check" />
                  {f.name}
                </div>
              ))}
            </div>
          )}
        </span>
        <span className="gdoc-tb-sep" />
        <span className="gdoc-tb-step">−</span>
        <span className="gdoc-tb-size">11</span>
        <span className="gdoc-tb-step">+</span>
        <span className="gdoc-tb-sep" />
        <span className="gdoc-tb-btn gdoc-tb-bold" title="Bold">B</span>
        <span className="gdoc-tb-btn gdoc-tb-italic" title="Italic">I</span>
        <span className="gdoc-tb-btn gdoc-tb-underline" title="Underline">U</span>
        <span className="gdoc-tb-btn gdoc-tb-color" title="Text color">A<span className="gdoc-tb-color-bar" /></span>
        <span className="gdoc-tb-sep" />
        <span className="gdoc-tb-btn" title="Link"><I.M name="link" size={20} /></span>
        <span className="gdoc-tb-btn" title="Comment"><I.M name="add_comment" size={20} /></span>
        <span className="gdoc-tb-sep" />
        <span className="gdoc-tb-btn" title="Align left"><I.M name="format_align_left" size={20} /></span>
        <span className="gdoc-tb-btn" title="Bulleted list"><I.M name="format_list_bulleted" size={20} /></span>
        <span className="gdoc-tb-btn" title="Numbered list"><I.M name="format_list_numbered" size={20} /></span>
        <span className="gdoc-tb-btn" title="Indent"><I.M name="format_indent_increase" size={20} /></span>
      </div>
      </div>{/* /gdoc-chrome */}

      {/* The page */}
      <div className="gdoc-page-wrap">
        <div className={`gdoc-page ${pageClass}`.trim()} style={{ fontFamily: font.stack }}>
          {renderedChildren}
        </div>
      </div>
    </div>
  )
}

// ===================== THEME 1: MARKED-UP GOOGLE DOC =====================
// Per-track decoration layer. The marked-doc THEME is shared, but each track gets
// its own reviewer scribbles so the 4 pages read as distinct hand-marked docs.
//   notes:    [n1, n2, n3] handwritten margin-note texts (gutter, anchored to
//             goal / howWon / mistakes respectively)
//   arrows:   which of the two hand arrows to draw ({a1, a2} booleans)
//   comments: the two Google-Docs comment bubbles ({av, name, text})
//   marks:    which line index gets each mark. Indices are clamped/guarded at
//             render so a track with fewer lines never crashes:
//               hlGreen  -> index into data.howWon  (green highlighter)
//               strike   -> index into data.rewards (strikethrough + edit note)
//               editText -> the little edit label beside the strike
//               underline-> index into data.judges  (underline)
//             (the yellow highlight on The Goal lead line is constant for all tracks)
// Per-track decoration. Every page shares ONE marked-up-Google-Doc vocabulary
// (handwritten margin notes, highlighter swipes, doodle arrows, stars, reviewer
// comment bubbles, hand strike/underline/circle/squiggle edits, grouping
// brackets, boxed tags) — but each track composes a DIFFERENT set in different
// places, so the four read like four genuinely different brainstormed docs, not
// recolours of one template. Each is given an "annotator personality":
//   unreachable = war-room strategist (arrows + a grouping bracket)
//   subject     = copywriter A/B-testing words (many inline circles + version tags)
//   twoliner    = ruthless editor (strike-heavy, deliberately SPARSE)
//   ask         = dealmaker (bold, double-underline, annotates the scoring table)
//
// title:  { type: 'circle'|'highlight'|'underline'|'box', color }
// margin: overlay items placed in the gutters / off-sheet margin, each anchored
//         to a section heading (offsetTop measured at runtime) + a dy nudge:
//   { kind:'note',    anchor, dy, side:'L'|'R', x?, text, color, rot }
//   { kind:'arrow',   anchor, dy, side, x?, color, variant:'curlL'|'curlR'|'up'|'down' }
//   { kind:'doodle',  anchor, dy, side, x?, glyph, color, rot, size }
//   { kind:'tag',     anchor, dy, side, x?, text, color }
//   { kind:'bracket', from, to, dyTop?, dyBot?, side, x?, text, color }
//   { kind:'comment', anchor, dy, av, name, text, color, reply?:{av,name,text,color} }
// inline: marks that WRAP an existing content line (never alter its text):
//   { section:'goal'|'won'|'rewards'|'judges'|'strong'|'mistakes'|'scoring', idx,
//     type:'hl-y'|'hl-g'|'hl-o'|'hl-p'|'circ'|'squig'|'strike'|'underline'|'underline2', edit? }
const TRACK_DECOR = {
  // ---- Track 1: war-room strategist — LEFT-gutter dominant: a grouping bracket
  //      down the core list + a left star; sparse right notes. Mark zone skews LEFT. ----
  unreachable: {
    title: { type: 'circle', color: 'rgba(217,48,37,.55)' },
    margin: [
      { kind: 'note',  anchor: 'goal', dy: 66, side: 'R', x: -82, text: 'who can we reach??', color: '#d93025', rot: -6 },
      { kind: 'bracket', from: 'rewards', to: 'judges', dyTop: 66, dyBot: -22, side: 'L', x: -34, text: 'the core', color: '#1a73e8' },
      { kind: 'doodle', anchor: 'judges', dy: 40, side: 'L', x: -60, glyph: '✶', color: '#d93025', rot: -12, size: 28 },
      { kind: 'note',  anchor: 'mistakes', dy: 50, side: 'R', x: -80, text: 'too easy?', color: '#e37400', rot: 7 },
      { kind: 'comment', anchor: 'rewards', dy: 6,  av: 'AR', name: 'Aria',   text: 'Lead with why only they can help.', color: '#1a73e8' },
      { kind: 'comment', anchor: 'scoring', dy: 16, av: 'JD', name: 'Jordan', text: 'The harder the target, the better.', color: '#1e8e3e' },
    ],
    inline: [
      { section: 'goal',     idx: 0, type: 'hl-y' },
      { section: 'rewards',  idx: 1, type: 'strike', edit: 'tighten' },
      { section: 'judges',   idx: 0, type: 'underline' },
      { section: 'mistakes', idx: 0, type: 'squig' },
    ],
  },
  // ---- Track 2: copywriter — INLINE-CIRCLE dominant: many word-circles spread
  //      through the doc, version tags in the right margin, one threaded comment. ----
  subject: {
    title: { type: 'highlight', color: 'rgba(255,234,84,.8)' },
    margin: [
      { kind: 'note',  anchor: 'goal', dy: 62, side: 'R', x: -80, text: 'the HOOK', color: '#f9ab00', rot: -5 },
      { kind: 'tag',   anchor: 'won', dy: 48, side: 'R', x: -76, text: 'v2?', color: '#1a73e8' },
      { kind: 'doodle', anchor: 'strong', dy: -2, side: 'L', x: -60, glyph: '✦', color: '#f9ab00', rot: -12, size: 28 },
      { kind: 'note',  anchor: 'strong', dy: 44, side: 'R', x: -84, text: 'more of this', color: '#1e8e3e', rot: 5 },
      { kind: 'comment', anchor: 'judges',   dy: 2,  av: 'MK', name: 'Mara', text: 'Spark curiosity without overpromising.', color: '#1a73e8' },
      { kind: 'comment', anchor: 'mistakes', dy: 18, av: 'TP', name: 'Theo', text: 'Short and plain beats clever.', color: '#1e8e3e' },
    ],
    inline: [
      { section: 'goal',     idx: 0, type: 'hl-o' },
      { section: 'won',      idx: 2, type: 'circ' },
      { section: 'judges',   idx: 0, type: 'circ' },
      { section: 'judges',   idx: 1, type: 'circ' },
      { section: 'strong',   idx: 2, type: 'hl-p' },
      { section: 'mistakes', idx: 0, type: 'strike', edit: 'never' },
      { section: 'mistakes', idx: 1, type: 'squig' },
    ],
  },
  // ---- Track 3: ruthless editor — deliberately SPARSE: one top note, one mid tag,
  //      one star. Lots of empty margin — the restraint IS the page's signature. ----
  twoliner: {
    title: { type: 'underline', color: '#d93025' },
    margin: [
      { kind: 'note',  anchor: 'goal', dy: 66, side: 'R', x: -82, text: 'every word counts', color: '#d93025', rot: -5 },
      { kind: 'tag',   anchor: 'rewards', dy: 150, side: 'R', x: -78, text: '−2 lines', color: '#d93025' },
      { kind: 'doodle', anchor: 'strong', dy: -2, side: 'L', x: -60, glyph: '✱', color: '#d93025', rot: -12, size: 28 },
      { kind: 'comment', anchor: 'rewards', dy: 6,   av: 'SL', name: 'Sam',   text: 'Cut every word not pulling weight.', color: '#1a73e8' },
      { kind: 'comment', anchor: 'rewards', dy: 120, av: 'ND', name: 'Nadia', text: 'Say one thing, say it sharp.', color: '#1e8e3e' },
    ],
    inline: [
      { section: 'goal',    idx: 0, type: 'hl-y' },
      { section: 'rewards', idx: 3, type: 'strike', edit: 'cut' },
      { section: 'rewards', idx: 4, type: 'underline' },
    ],
  },
  // ---- Track 4: dealmaker — SPREAD across every section + the only page that
  //      annotates the scoring table (circled cell). Bold, evenly-distributed marks. ----
  ask: {
    title: { type: 'box', color: '#1a73e8' },
    margin: [
      { kind: 'note',  anchor: 'goal', dy: 64, side: 'R', x: -80, text: 'go BIG', color: '#1a73e8', rot: -6 },
      { kind: 'note',  anchor: 'won', dy: 38, side: 'R', x: -86, text: 'raise the stakes', color: '#1e8e3e', rot: 4 },
      { kind: 'doodle', anchor: 'judges', dy: 40, side: 'L', x: -60, glyph: '★', color: '#1a73e8', rot: -10, size: 28 },
      { kind: 'tag',   anchor: 'strong', dy: 36, side: 'R', x: -78, text: 'proof!', color: '#d93025' },
      { kind: 'note',  anchor: 'mistakes', dy: 50, side: 'R', x: -82, text: 'proof?? →', color: '#d93025', rot: 7 },
      { kind: 'comment', anchor: 'judges',   dy: 2,  av: 'RV', name: 'Rey',  text: 'Ask for the meeting, not just a reply.', color: '#1a73e8' },
      { kind: 'comment', anchor: 'mistakes', dy: 24, av: 'GB', name: 'Gabe', text: 'One clear ask beats three soft ones.', color: '#1e8e3e' },
    ],
    inline: [
      { section: 'goal',     idx: 0, type: 'hl-p' },
      { section: 'won',      idx: 0, type: 'hl-y' },
      { section: 'judges',   idx: 0, type: 'underline2' },
      { section: 'strong',   idx: 0, type: 'hl-g' },
      { section: 'scoring',  idx: 0, type: 'circ' },
      { section: 'mistakes', idx: 0, type: 'squig' },
    ],
  },
}
const DEFAULT_DECOR = TRACK_DECOR.unreachable
// clamp an index into [0, len-1]; returns -1 when there is no line at all
const clampIdx = (i, len) => (len > 0 ? Math.min(Math.max(i, 0), len - 1) : -1)

// section lengths used to clamp inline-mark indices onto a real line
const sectionLen = (data, section) => ({
  goal: 1, won: data.howWon.length, rewards: data.rewards.length,
  judges: data.judges.length, strong: data.strong.length,
  mistakes: data.mistakes.length, scoring: data.scoring.length,
}[section] ?? 0)

function TrackMarkedDoc({ data, title, topic }) {
  const decor = TRACK_DECOR[topic] || DEFAULT_DECOR
  // Inline marks → lookup by `${section}:${idx}`. Indices are clamped to this
  // track's real array length so a mark never targets a line that doesn't exist.
  const inlineMap = new Map()
  for (const m of decor.inline) {
    const idx = clampIdx(m.idx, sectionLen(data, m.section))
    if (idx >= 0) inlineMap.set(`${m.section}:${idx}`, m)
  }
  // Wrap one content line in its inline mark (if any) — never changes the text.
  const renderLine = (section, idx, text) => {
    const m = inlineMap.get(`${section}:${idx}`)
    if (!m) return <RT>{text}</RT>
    if (m.type === 'strike') return <><span className="mkd-strike"><RT>{text}</RT></span> <span className="mkd-edit">{m.edit}</span></>
    const cls = m.type.startsWith('hl-') ? `mkd-hl mkd-${m.type}` : `mkd-${m.type}`
    return <span className={cls}><RT>{text}</RT></span>
  }

  // Anchors: every section heading (and the title) registers its element so we
  // can measure its offsetTop relative to .mkd-doc-inner and place margin
  // decorations beside it — re-measured on any reflow (font change / resize).
  const pageRef = useRef(null)
  const anchors = useRef({})
  const setAnchor = (k) => (el) => { anchors.current[k] = el }
  const [tops, setTops] = useState({})

  useLayoutEffect(() => {
    const page = pageRef.current
    if (!page) return
    const measure = () => {
      const next = {}
      for (const k in anchors.current) {
        const el = anchors.current[k]
        next[k] = el ? el.offsetTop : null
      }
      setTops(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(page)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [data, title, topic])

  // Place one margin/overlay decoration from its anchor's measured top + dy.
  const MarginItem = ({ m }) => {
    if (m.kind === 'comment') {
      const top = tops[m.anchor]
      return (
        <div className="mkd-cwrap" style={top != null ? { top: top + (m.dy || 0) } : undefined}>
          <div className="mkd-bubble">
            <span className="mkd-comment-av" style={{ background: m.color }}>{m.av}</span>
            <div className="mkd-comment-body"><b>{m.name}</b><span>{m.text}</span></div>
          </div>
          {m.reply && (
            <div className="mkd-bubble mkd-bubble-reply">
              <span className="mkd-comment-av" style={{ background: m.reply.color }}>{m.reply.av}</span>
              <div className="mkd-comment-body"><b>{m.reply.name}</b><span>{m.reply.text}</span></div>
            </div>
          )}
        </div>
      )
    }
    if (m.kind === 'bracket') {
      const from = tops[m.from], to = tops[m.to]
      if (from == null || to == null) return null
      const top = from + (m.dyTop || 0)
      const height = (to + (m.dyBot || 0)) - top
      const sideStyle = m.side === 'L' ? { left: m.x ?? -34 } : { right: m.x ?? -34 }
      return <div className="mkd-bracket" style={{ top, height, '--c': m.color, ...sideStyle }}><span className="mkd-bracket-note">{m.text}</span></div>
    }
    const top = tops[m.anchor]
    if (top == null) return null
    const base = { top: top + (m.dy || 0), ...(m.side === 'L' ? { left: m.x ?? -72 } : { right: m.x ?? -86 }) }
    if (m.kind === 'note')   return <span className="mkd-note" style={{ ...base, color: m.color, transform: `rotate(${m.rot || 0}deg)` }}>{m.text}</span>
    if (m.kind === 'tag')    return <span className="mkd-tag" style={{ ...base, '--c': m.color }}>{m.text}</span>
    if (m.kind === 'doodle') return <span className="mkd-star" style={{ ...base, color: m.color, fontSize: `${m.size || 28}pt`, transform: `rotate(${m.rot ?? -12}deg)` }}>{m.glyph}</span>
    if (m.kind === 'arrow')  return <HandArrow className={`mkd-arrow mkd-arrow-${m.variant || 'curlL'}`} style={{ ...base, color: m.color, ...(m.w ? { width: m.w } : {}), ...(m.h ? { height: m.h } : {}) }} />
    return null
  }

  const titleCls = decor.title.type === 'circle' ? 'mkd-circle' : `mkd-title-${decor.title.type}`

  return (
    <DocFrame title={title} canvasClass="mkd-canvas" pageClass="mkd-page">
      {() => (<div className="mkd-doc-inner" ref={pageRef}>
          {/* Decoration layer: each track declares its own set in TRACK_DECOR;
              positioned by measured section anchors so they reflow with the text. */}
          {decor.margin.map((m, i) => <MarginItem key={i} m={m} />)}

          <h1 className={`gdoc-h1 ${titleCls}`} style={{ '--c': decor.title.color }} ref={setAnchor('title')}>{title}</h1>

          <h2 className="gdoc-h2" ref={setAnchor('goal')}>The Goal</h2>
          <div className="gdoc-goal">
            <p className="gdoc-p gdoc-goal-lead">{renderLine('goal', 0, data.goal)}</p>
            {data.goalExtra && <p className="gdoc-p gdoc-goal-extra"><RT>{data.goalExtra}</RT></p>}
          </div>

          <h2 className="gdoc-h2" ref={setAnchor('won')}>How It's Won</h2>
          {data.howWon.map((l, i) => <p className="gdoc-p" key={i}>{renderLine('won', i, l)}</p>)}

          <h2 className="gdoc-h2" ref={setAnchor('rewards')}>What This Track Rewards</h2>
          {data.rewards.map((l, i) => <p className="gdoc-p" key={i}>{renderLine('rewards', i, l)}</p>)}

          <h2 className="gdoc-h2" ref={setAnchor('judges')}>What Judges Look For</h2>
          <ul className="gdoc-list">
            {data.judges.map((l, i) => <li key={i}><span className="gdoc-mark gdoc-mark-tri">▸</span><span>{renderLine('judges', i, l)}</span></li>)}
          </ul>

          <h2 className="gdoc-h2" ref={setAnchor('strong')}>Strong Entries</h2>
          <ul className="gdoc-list">
            {data.strong.map((l, i) => <li key={i}><span className="gdoc-mark gdoc-mark-dot">•</span><span>{renderLine('strong', i, l)}</span></li>)}
          </ul>

          <h2 className="gdoc-h2" ref={setAnchor('mistakes')}>Common Mistakes</h2>
          <ul className="gdoc-list">
            {data.mistakes.map((l, i) => <li key={i}><span className="gdoc-mark gdoc-mark-dot">•</span><span>{renderLine('mistakes', i, l)}</span></li>)}
          </ul>

          <h2 className="gdoc-h2" ref={setAnchor('scoring')}>Scoring</h2>
          <table className="gdoc-table">
            <thead>
              <tr><th>Criteria</th><th className="gdoc-table-pts">Points</th></tr>
            </thead>
            <tbody>
              {data.scoring.map((s, i) => (
                <tr key={i}><td>{s.label}</td><td className="gdoc-table-pts">{inlineMap.has(`scoring:${i}`) ? <span className="mkd-circ">{s.pts}</span> : s.pts}</td></tr>
              ))}
            </tbody>
          </table>

          <h2 className="gdoc-h2" ref={setAnchor('prize')}>Prize</h2>
          <div className="gdoc-prize">
            <span className="gdoc-prize-icon"><I.M name="emoji_events" size={22} /></span>
            <p className="gdoc-p gdoc-prize-text"><strong className="mkd-hl mkd-hl-y">$500</strong> for the winning entry. Every qualifying entry is also automatically considered for the Best Cold Email ($1,000 grand prize).</p>
          </div>
      </div>)}
    </DocFrame>
  )
}

// ---------------- VIEW: TRACKS HOME (Google Docs start page) ----------------
const DOCS_ICON = (
  <svg width="18" height="22" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M29 0H6C2.69 0 0 2.69 0 6v52c0 3.31 2.69 6 6 6h36c3.31 0 6-2.69 6-6V19L29 0z" fill="#4285F4"/>
    <path d="M29 0v13c0 3.31 2.69 6 6 6h13L29 0z" fill="#A1C2FA"/>
    <rect x="12" y="30" width="24" height="3.4" rx="1.7" fill="#fff"/>
    <rect x="12" y="38.5" width="24" height="3.4" rx="1.7" fill="#fff"/>
    <rect x="12" y="47" width="16" height="3.4" rx="1.7" fill="#fff"/>
  </svg>
)

function ViewTracksHome({ goto, onEnter }) {
  const topics = ['unreachable', 'subject', 'twoliner', 'ask']
  const dates = ['Opened 9:22 PM', 'Jun 19, 2026', 'Jun 17, 2026', 'Jun 17, 2026']
  // Thumbnail = faithful 1:1 miniature of the real marked-up Google Doc track
  // page (TrackMarkedDoc). EVERY track uses this single preview, rendering its
  // OWN content from TRACK_PAGES[t]: same section order/headings, the closed
  // hand-drawn circle around the title (.gmini-mkd-circle ↔ .mkd-circle), the
  // yellow highlight on The Goal, green highlight on the first How It's Won
  // line, the strike+edit on Rewards, ▸ marks on Judges (first underlined),
  // • bullets on Strong Entries / Common Mistakes, a scoring row, the prize
  // callout, plus handwritten margin notes, a hand arrow and a Google-Docs
  // comment bubble — all scaled to thumbnail size. Decoration clips at the
  // frame edge (thumbnails are overflow:hidden). Copy comes from TRACK_PAGES[t];
  // only tiny decorative labels are hardcoded.
  const mini = (t, lg) => {
    const d = TRACK_PAGES[t]
    const name = TOPIC_NAMES[t]
    const cls = `gmini${lg ? ' gmini-lg' : ''}`
    return (
      <div className={`${cls} gmini-mkd`}>
        {/* decorative margin notes + arrow + comment bubble (mirror TrackMarkedDoc) */}
        <span className="gmini-mkd-note gmini-mkd-note-1">&lt;- start here</span>
        <span className="gmini-mkd-note gmini-mkd-note-2">love this!!</span>
        <HandArrow className="gmini-mkd-arrow gmini-mkd-arrow-1" />
        <HandArrow className="gmini-mkd-arrow gmini-mkd-arrow-2" />
        <div className="gmini-mkd-comment">
          <span className="gmini-mkd-comment-av">AR</span>
          <div className="gmini-mkd-comment-body"><b>Aria</b><span>punchier?</span></div>
        </div>

        <div className="gmini-mkd-h1 gmini-mkd-circle">{name}</div>

        <div className="gmini-mkd-sub">The Goal</div>
        <p className="gmini-mkd-p"><span className="gmini-mkd-hl gmini-mkd-hl-y"><RT>{d.goal}</RT></span></p>

        <div className="gmini-mkd-sub">How It's Won</div>
        {d.howWon.slice(0, 2).map((l, i) => (
          <p className="gmini-mkd-p" key={i}>{i === 0 ? <span className="gmini-mkd-hl gmini-mkd-hl-g"><RT>{l}</RT></span> : <RT>{l}</RT>}</p>
        ))}

        <div className="gmini-mkd-sub">What This Track Rewards</div>
        {d.rewards.slice(0, 2).map((l, i) => (
          <p className="gmini-mkd-p" key={i}>{i === 1 ? <><span className="gmini-mkd-strike"><RT>{l}</RT></span> <span className="gmini-mkd-edit">tighten</span></> : <RT>{l}</RT>}</p>
        ))}

        <div className="gmini-mkd-sub">What Judges Look For</div>
        <ul className="gmini-mkd-list">
          {d.judges.slice(0, 3).map((l, i) => (
            <li key={i}><span className="gmini-mkd-mark gmini-mkd-mark-tri">▸</span><span>{i === 0 ? <span className="gmini-mkd-underline"><RT>{l}</RT></span> : <RT>{l}</RT>}</span></li>
          ))}
        </ul>

        <div className="gmini-mkd-sub">Strong Entries</div>
        <ul className="gmini-mkd-list">
          {d.strong.slice(0, 2).map((l, i) => (
            <li key={i}><span className="gmini-mkd-mark gmini-mkd-mark-dot">•</span><span><RT>{l}</RT></span></li>
          ))}
        </ul>

        <div className="gmini-mkd-sub">Common Mistakes</div>
        <ul className="gmini-mkd-list">
          {d.mistakes.slice(0, 2).map((l, i) => (
            <li key={i}><span className="gmini-mkd-mark gmini-mkd-mark-dot">•</span><span><RT>{l}</RT></span></li>
          ))}
        </ul>

        <div className="gmini-mkd-sub">Scoring</div>
        <table className="gmini-mkd-table">
          <tbody>
            {d.scoring.slice(0, 2).map((s, i) => (
              <tr key={i}><td>{s.label}</td><td className="gmini-mkd-table-pts">{s.pts}</td></tr>
            ))}
          </tbody>
        </table>

        <div className="gmini-mkd-sub">Prize</div>
        <p className="gmini-mkd-p"><strong className="gmini-mkd-hl gmini-mkd-hl-y">$500</strong> for the winning entry.</p>
      </div>
    )
  }
  return (
    <div className="view-panel gdocs-home">
      {/* Template gallery band */}
      <div className="gdocs-band">
        <div className="gdocs-band-inner">
          <div className="gdocs-band-head">
            <span className="gdocs-band-title">Start a new document</span>
            <div className="gdocs-band-right">
              <span className="gdocs-gallery">Template gallery <I.M name="unfold_more" size={18} /></span>
              <span className="gdocs-sep" />
              <span className="gdocs-kebab"><I.M name="more_vert" size={20} /></span>
            </div>
          </div>
          <div className="gdocs-templates">
            <div className="gdocs-tpl" onClick={onEnter}>
              <div className="gdocs-tpl-thumb gdocs-tpl-blank">
                <svg width="46" height="46" viewBox="0 0 24 24"><path fill="#4285F4" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>
              </div>
              <div className="gdocs-tpl-name">Blank document</div>
            </div>
            {topics.map(t => (
              <div className="gdocs-tpl" key={t} onClick={() => goto('track-' + t)}>
                <div className="gdocs-tpl-thumb">{mini(t, false)}</div>
                <div className="gdocs-tpl-name">{TOPIC_NAMES[t]}</div>
                <div className="gdocs-tpl-sub">Track</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent documents */}
      <div className="gdocs-recent">
        <div className="gdocs-recent-head">
          <span className="gdocs-recent-title">Recent documents</span>
          <div className="gdocs-recent-right">
            <span className="gdocs-owner">Owned by anyone <I.M name="arrow_drop_down" size={18} /></span>
            <span className="gdocs-ric" title="List view"><I.M name="list" size={20} /></span>
            <span className="gdocs-ric" title="Sort"><I.M name="sort_by_alpha" size={20} /></span>
            <span className="gdocs-ric" title="Folder"><I.M name="folder_open" size={20} /></span>
          </div>
        </div>
        <div className="gdocs-grid">
          {topics.map((t, i) => (
            <div className="gdocs-card" key={t} onClick={() => goto('track-' + t)}>
              <div className="gdocs-card-thumb">{mini(t, true)}</div>
              <div className="gdocs-card-foot">
                <span className="gdocs-card-ico">{DOCS_ICON}</span>
                <div className="gdocs-card-meta">
                  <div className="gdocs-card-name">{TOPIC_NAMES[t]}</div>
                  <div className="gdocs-card-date">{dates[i]}</div>
                </div>
                <span className="gdocs-card-kebab" onClick={e => e.stopPropagation()}><I.M name="more_vert" size={18} /></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------- VIEW: THE RULE ----------------
function ViewRule({ onEnter }) {
  const R = RULES_PAGE
  const [copied, setCopied] = useState(false)
  const copyBcc = (e) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(R.bccEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  // Each note: id, color, title, and a render() reused in both the card and the expanded modal.
  const NOTES = [
    { id: 'rule', color: 'yellow', title: 'The Rule', render: () => (<>
      <p className="keep-lead">A cold email counts only if someone who doesn’t already know you genuinely wrote back.</p>
      <p className="keep-text">Every competition email must be sent during the event and BCC our official competition inbox for verification.</p>
      {checklist('rulechips', R.chips)}
      <p className="keep-support">Break any of these and your entry is disqualified.</p>
    </>) },
    { id: 'counts', color: 'green', title: 'What counts?', render: () => (<>
      <p className="keep-text">Your entry qualifies only if all of the following are true.</p>
      <ul className="rule-check keep-list">{R.whatCounts.map(c => <li key={c}><span className="gdoc-mark gdoc-mark-dot">•</span>{c}</li>)}</ul>
      <p className="keep-support">A reply can be short. A reply can be negative. A reply can simply be “No.” What matters is that a real person responded.</p>
    </>) },
    { id: 'doesnt', color: 'coral', title: 'What doesn’t count?', render: () => (<>
      <p className="keep-text">Not every response qualifies. These do not count as valid replies.</p>
      <ul className="rule-x keep-list">{R.doesntCount.map(c => <li key={c}><span className="gdoc-mark gdoc-mark-dash">–</span>{c}</li>)}</ul>
      <p className="keep-support">If a human didn’t personally respond, it doesn’t count.</p>
    </>) },
    { id: 'bcc', color: 'blue', title: 'Every competition email must BCC us.', render: () => (<>
      <div className="keep-bcc">
        <span className="keep-bcc-email">{R.bccEmail}</span>
        <button className="rule-bcc-copy" onClick={copyBcc}>
          <I.M name={copied ? 'check' : 'content_copy'} size={16} /> {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="keep-mini-head">Why we require it</div>
      <ul className="rule-bullets keep-bullets">{R.bccWhy.map(b => <li key={b}>{b}</li>)}</ul>
      <p className="keep-support">Failure to BCC may make an entry ineligible.</p>
    </>) },
    { id: 'sending', color: 'teal', title: 'Sending rules', render: () => (<>
      <div className="keep-mini-head keep-yes">Allowed</div>
      <ul className="rule-check keep-list">{R.allowed.map(a => <li key={a}><span className="gdoc-mark gdoc-mark-dot">•</span>{a}</li>)}</ul>
      <div className="keep-mini-head keep-no">Not allowed</div>
      <ul className="rule-x keep-list">{R.notAllowed.map(a => <li key={a}><span className="gdoc-mark gdoc-mark-dash">–</span>{a}</li>)}</ul>
      <p className="keep-support">The competition judges outcomes, not workflows. The only thing that matters is that the outreach is genuine, honest, and earns a real reply.</p>
    </>) },
    { id: 'proof', color: 'orange', title: 'Proof', render: () => (<>
      <p className="keep-text">To submit an entry you’ll need evidence.</p>
      <ul className="keep-proof">{R.proof.map(p => <li key={p.label}><I.M name={p.icon} size={18} /> {p.label}</li>)}</ul>
      <p className="keep-support">Judges may request additional verification if needed. Failure to provide proof may result in disqualification.</p>
    </>) },
    { id: 'fairplay', color: 'purple', title: 'Fair play', render: () => (<>
      <p className="keep-text">The goal is to earn trust from someone who doesn’t know you, not leverage an existing relationship.</p>
      {group('fairplay', 'Recipients cannot be', R.fairPlayNot)}
      <p className="keep-support">If the recipient would reasonably recognize you, it doesn’t count.</p>
    </>) },
    { id: 'privacy', color: 'gray', title: 'Privacy', render: () => (<>
      <p className="keep-text">We understand that cold emails often contain sensitive information. Participants may blur:</p>
      <ul className="rule-tags keep-tags">{R.privacyBlur.map(p => <li key={p}>{p}</li>)}</ul>
      <p className="keep-support">Judges may request original versions privately for verification. Any verification materials will be handled confidentially.</p>
    </>) },
    { id: 'spirit', color: 'dark', title: 'Win by writing.', render: () => (<>
      <p className="keep-text">The rules cannot cover every loophole. If an entry technically follows the rules but clearly violates the spirit of fair competition, organizers may disqualify it. The purpose of this competition is simple: earn a genuine response from someone who had no reason to give you one.</p>
      <p className="keep-quote">“Write a remarkable cold email. Don’t game the system.”</p>
    </>) },
    { id: 'final', color: 'pink', title: 'Write something worth replying to.', render: () => (<>
      <p className="keep-text">Not the funniest. Not the longest. Not the craziest.</p>
      <p className="keep-text">Just the kind of email that makes someone who has never heard of you stop what they’re doing and hit Reply.</p>
    </>) },
  ]

  const [order, setOrder] = useState(NOTES.map(n => n.id))
  const [pinned, setPinned] = useState(() => new Set())  // pinned note ids
  const [expanded, setExpanded] = useState(null)   // note id or null
  // Pin → jump the note to the front of `order` (top of the board). Pinning again unpins.
  const togglePin = (id) => {
    const wasPinned = pinned.has(id)
    setPinned(prev => { const n = new Set(prev); wasPinned ? n.delete(id) : n.add(id); return n })
    if (!wasPinned) setOrder(prev => [id, ...prev.filter(x => x !== id)])
  }
  const dragId = useRef(null)
  const noteRefs = useRef(new Map())
  const boardRef = useRef(null)
  const animOn = useRef(false)
  const [checked, setChecked] = useState(() => new Set([   // pre-checked by default
    ...RULES_PAGE.fairPlayNot.map(t => `fairplay|${t}`),
    ...RULES_PAGE.chips.filter(t => !/bcc/i.test(t)).map(t => `rulechips|${t}`),
  ]))
  const [collapsed, setCollapsed] = useState(() => new Set())  // collapsed groups
  const toggleCheck = k => setChecked(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })
  const toggleCollapse = k => setCollapsed(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })

  // Keep-style checklist: each item is a checkbox that strikes through its text when checked.
  const checkItem = (k, text) => {
    const done = checked.has(k)
    return (
      <li key={text} className={`keep-ci${done ? ' done' : ''}`} onClick={e => { e.stopPropagation(); toggleCheck(k) }}>
        <I.M name={done ? 'check_box' : 'check_box_outline_blank'} size={18} />
        <span className="keep-ci-text">{text}</span>
      </li>
    )
  }
  const checklist = (id, items) => <ul className="keep-checklist">{items.map(t => checkItem(`${id}|${t}`, t))}</ul>
  // Collapsible group header (chevron + label), like Keep's completed-items group.
  const group = (id, label, items) => {
    const open = !collapsed.has(id)
    return (
      <div className="keep-group">
        <div className="keep-group-head" onClick={e => { e.stopPropagation(); toggleCollapse(id) }}>
          <I.M name={open ? 'expand_more' : 'chevron_right'} size={18} /><span>{label}</span>
        </div>
        {open && checklist(id, items)}
      </div>
    )
  }

  // Absolute masonry: every note is translate()'d to its slot. A reorder only changes
  // `order`, which re-runs this and updates each transform → the CSS transition slides
  // notes to their new positions (instead of the abrupt CSS-columns reflow).
  useLayoutEffect(() => {
    const layout = () => {
      const board = boardRef.current
      if (!board) return
      const GAP = 16, MINCOL = 240
      const W = board.clientWidth
      const cols = Math.max(1, Math.min(4, Math.floor((W + GAP) / (MINCOL + GAP))))
      const colW = (W - GAP * (cols - 1)) / cols
      const colH = new Array(cols).fill(0)
      order.forEach(id => {
        const el = noteRefs.current.get(id)
        if (!el) return
        if (!animOn.current) el.style.transition = 'none'
        el.style.width = colW + 'px'
        const h = el.offsetHeight
        let c = 0
        for (let i = 1; i < cols; i++) if (colH[i] < colH[c]) c = i
        el.style.transform = `translate(${Math.round(c * (colW + GAP))}px, ${Math.round(colH[c])}px)`
        colH[c] += h + GAP
      })
      board.style.height = (Math.max(...colH) - GAP) + 'px'
      if (!animOn.current) {
        requestAnimationFrame(() => {
          noteRefs.current.forEach(el => { el.style.transition = 'transform 260ms cubic-bezier(.2,0,0,1), box-shadow .15s' })
          animOn.current = true
        })
      }
    }
    layout()
    window.addEventListener('resize', layout)
    return () => window.removeEventListener('resize', layout)
  }, [order, collapsed])

  // Live reorder: as the dragged note enters another, shift the others around it.
  const moveOver = (targetId) => {
    const from = dragId.current
    if (!from || from === targetId) return
    setOrder(prev => {
      if (prev.indexOf(from) === -1) return prev
      const next = prev.filter(id => id !== from)
      next.splice(next.indexOf(targetId), 0, from)
      return next
    })
  }

  const byId = id => NOTES.find(n => n.id === id)
  const expandedNote = expanded ? byId(expanded) : null

  return (
    <div className="view-panel view-panel-keep">
      {/* Keep "Take a note…" composer — opens the entry modal */}
      <div className="keep-composer" onClick={onEnter}>
        <span className="keep-composer-ph">Take a note…</span>
        <div className="keep-composer-icons">
          <I.M name="check_box" size={22} />
          <I.M name="brush" size={22} />
          <I.M name="image" size={22} />
        </div>
      </div>

      {/* Masonry of notes — draggable to reorder, click to expand */}
      <div className="keep-board" ref={boardRef}>
        {order.map(id => {
          const n = byId(id)
          return (
            <div
              key={n.id}
              ref={el => { if (el) noteRefs.current.set(n.id, el); else noteRefs.current.delete(n.id) }}
              className={`keep-note keep-c-${n.color}`}
              draggable
              onDragStart={e => { dragId.current = n.id; e.currentTarget.classList.add('keep-dragging') }}
              onDragEnter={() => moveOver(n.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); dragId.current = null }}
              onDragEnd={e => { dragId.current = null; e.currentTarget.classList.remove('keep-dragging') }}
              onClick={() => setExpanded(n.id)}
            >
              <span className={`keep-note-pin${pinned.has(n.id) ? ' keep-pinned' : ''}`} onClick={e => { e.stopPropagation(); togglePin(n.id) }} title={pinned.has(n.id) ? 'Unpin note' : 'Pin note'}><I.M name="keep" size={20} /></span>
              <div className="keep-note-title">{n.title}</div>
              {n.render()}
              <div className="keep-note-tools" onClick={e => e.stopPropagation()}>
                <I.M name="palette" size={18} />
                <I.M name="add_alert" size={18} />
                <I.M name="person_add" size={18} />
                <I.M name="image" size={18} />
                <I.M name="archive" size={18} />
                <I.M name="more_vert" size={18} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Expanded note modal (Keep-style) */}
      {expandedNote && (
        <div className="keep-overlay" onClick={() => setExpanded(null)}>
          <div className={`keep-modal keep-c-${expandedNote.color}`} onClick={e => e.stopPropagation()}>
            <div className="keep-modal-head">
              <div className="keep-note-title">{expandedNote.title}</div>
              <span className={`keep-modal-pin${pinned.has(expandedNote.id) ? ' keep-pinned' : ''}`} onClick={e => { e.stopPropagation(); togglePin(expandedNote.id) }} title={pinned.has(expandedNote.id) ? 'Unpin note' : 'Pin note'}><I.M name="keep" size={20} /></span>
            </div>
            <div className="keep-modal-body">{expandedNote.render()}</div>
            <div className="keep-modal-toolbar">
              <div className="keep-modal-tools">
                <I.M name="format_color_text" size={18} />
                <I.M name="palette" size={18} />
                <I.M name="add_alert" size={18} />
                <I.M name="person_add" size={18} />
                <I.M name="image" size={18} />
                <I.M name="archive" size={18} />
                <I.M name="more_vert" size={18} />
              </div>
              <button className="keep-modal-close" onClick={() => setExpanded(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------- VIEW: PRIZES (Google Sheets) ----------------
// ---------------- VIEW: PRIZES (Google Pay) ----------------
function ViewPrizes({ onEnter, goto }) {
  const passes = [
    { name: 'The Best Cold Email', sub: 'Grand prize · best overall', amount: '$1,000', grand: true,
      c1: '#202124', c2: '#3c4043' },
    { name: 'The Unreachable',  sub: 'Track 1', amount: '$500', topic: 'unreachable', c1: '#1e8e3e', c2: '#34a853' },
    { name: 'Best Subject Line', sub: 'Track 2', amount: '$500', topic: 'subject',  c1: '#f9ab00', c2: '#fbbc04' },
    { name: 'The Two-Liner',    sub: 'Track 3', amount: '$500', topic: 'twoliner', c1: '#d93025', c2: '#ea4335' },
    { name: 'The Ask',          sub: 'Track 4', amount: '$500', topic: 'ask',      c1: '#1a73e8', c2: '#4285f4' },
  ]
  // drag-to-scroll the card row with the mouse (grab + drag, like a real Wallet carousel)
  const rowRef = useRef(null)
  const drag = useRef({ down: false, startX: 0, scroll: 0 })
  const onDown = (e) => {
    const el = rowRef.current; if (!el) return
    drag.current = { down: true, startX: e.pageX, scroll: el.scrollLeft }
    el.classList.add('dragging')
  }
  const onMove = (e) => {
    const el = rowRef.current; if (!el || !drag.current.down) return
    e.preventDefault()
    el.scrollLeft = drag.current.scroll - (e.pageX - drag.current.startX)
  }
  const endDrag = () => {
    const el = rowRef.current; if (!el) return
    drag.current.down = false
    el.classList.remove('dragging')
  }
  return (
    <div className="view-panel gpay-canvas">
      {/* Balance hero */}
      <div className="gpay-balance">
        <div className="gpay-balance-label">Prize pool</div>
        <div className="gpay-balance-amt">$3,000</div>
        <div className="gpay-balance-sub">Win up to $1,000 for one great cold email</div>
        <div className="gpay-actions">
          <button className="gpay-act" onClick={onEnter}><span className="gpay-act-ic"><I.M name="bolt" size={22} /></span>Submit</button>
          <button className="gpay-act" onClick={() => goto && goto('tracks-home')}><span className="gpay-act-ic"><I.M name="emoji_events" size={22} /></span>Tracks</button>
          <button className="gpay-act" onClick={() => goto && goto('rule')}><span className="gpay-act-ic"><I.M name="receipt_long" size={22} /></span>Rules</button>
        </div>
      </div>

      {/* Prize cards — horizontal scroll row; drag to scroll with the mouse */}
      <div className="gpay-cards" ref={rowRef}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={endDrag} onMouseLeave={endDrag}>
        {passes.map((p, i) => (
          <div className={`gpay-card${p.grand ? ' gpay-card-grand' : ''}`} key={i}
            style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }}>
            <div className="gpay-card-top">
              <span className="gpay-card-name">{p.name}</span>
              <span className={`gpay-card-ico${p.grand ? ' fill' : ''}`}>{p.grand ? <I.M name="star" size={26} /> : TRACK_ICONS[p.topic]}</span>
            </div>
            <div className="gpay-card-amt">{p.amount}</div>
            <div className="gpay-card-sub">{p.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ================================================================
// TRACK ROUTE — resolves /tracks/:slug -> internal topic
// ================================================================
function TrackRoute() {
  const { slug } = useParams()
  const topic = SLUG_TO_TOPIC[slug]
  if (!topic) return <Navigate to="/tracks" replace />
  return <ViewTrack topic={topic} />
}

// ---------------- APP ----------------
export default function App() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [jeminiOpen, setJeminiOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 768)
  const [toast, setToast] = useState('')
  const toastTimer = useRef()
  // Gmail-style "Message sent" snackbar shown after a successful submission.
  const [sentSnack, setSentSnack] = useState(false)
  const snackTimer = useRef()

  // Auto-collapse the sidebar on mobile, auto-expand back on desktop
  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth > 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const showToast = (m) => {
    setToast(m)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }

  const showSentSnack = () => {
    setSentSnack(true)
    clearTimeout(snackTimer.current)
    snackTimer.current = setTimeout(() => setSentSnack(false), 6000)
  }

  const submitEntry = async ({ email, targetName, targetEmail, files, ...rest }) => {
    if (!email || !EMAIL_RE.test(email.trim())) { showToast('Enter a valid email for yourself first.'); return }
    if (!targetName || !targetName.trim()) { showToast('Add the name of the person you emailed.'); return }
    if (targetEmail && !EMAIL_RE.test(targetEmail.trim())) { showToast('That target email doesn’t look valid.'); return }
    if (!files || !files.length) { showToast('Attach a screenshot/PDF of the thread (paperclip).'); return }
    // Authoritative background gate: you can only submit if you're registered.
    // null = couldn't reach the DB → fall back to the local registration flag.
    const reg = await isEmailRegistered(email)
    const ok = reg === null ? isRegisteredLocal() : reg
    if (!ok) {
      showToast('Register first — taking you to registration.')
      navigate('/the-procedure')
      return
    }
    // Persist the entry to Supabase (`submissions` table). Unlimited entries
    // per person, but each must target a DIFFERENT person — a unique index on
    // (lower(email), lower(target_name)) rejects a repeat target with 23505.
    const { error } = await insertSubmission({ email, targetName, targetEmail, ...rest, files })
    if (error) {
      if (error.code === '23505') { showToast('You already submitted for that target — pick a different person.'); return }
      showToast('Couldn’t save your entry. Try again in a moment.'); return
    }
    navigate('/')
    showSentSnack()
  }

  // Navigate by internal view key — preserves every existing goto()/setView() call site.
  // On mobile, also collapse the sidebar drawer so the chosen page is visible.
  const goto = (view) => {
    navigate(viewToPath(view))
    if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false)
  }
  const goHome = () => navigate('/')
  // Every "Enter" CTA: registered on this device → submission page; else → register.
  const onEnter = () => navigate(isRegisteredLocal() ? '/submit' : '/the-procedure')
  // Called by the registration chat when a user finishes (or is already registered).
  const onRegistered = (info) => { setRegistration(info); navigate('/submit') }

  return (
    <div onClick={() => jeminiOpen && setJeminiOpen(false)}>
      <TopBar
        onMenu={() => setSidebarOpen(s => !s)}
        onLogo={goHome}
        onJemini={() => setJeminiOpen(o => !o)}
        navigate={navigate}
      />
      <div className="app">
        <Sidebar
          onCompose={onEnter}
          goto={goto}
          pathname={pathname}
          open={sidebarOpen}
        />
        <div className="main">
          <Routes>
            <Route path="/"               element={<ViewOverview onEnter={onEnter} goto={goto} />} />
            <Route path="/home"           element={<ViewOverview onEnter={onEnter} goto={goto} />} />
            <Route path="/the-procedure"  element={<ViewEnter onEnter={onEnter} onRegistered={onRegistered} />} />
            <Route path="/submit"         element={
              <RequireRegistration>
                <div className="submit-page">
                  <ComposeWindow onClose={() => navigate('/')} onSend={submitEntry} page />
                </div>
              </RequireRegistration>
            } />
            <Route path="/tracks"         element={<ViewTracksHome goto={goto} onEnter={onEnter} />} />
            <Route path="/tracks/:slug"   element={<TrackRoute />} />
            <Route path="/prize-pool"     element={<ViewPrizes onEnter={onEnter} goto={goto} />} />
            <Route path="/calendar"       element={<ViewCalendar />} />
            <Route path="/rules"          element={<ViewRule onEnter={onEnter} />} />
            <Route path="/best-emails"    element={<ViewBest />} />
            <Route path="/winners"        element={<ViewWinners />} />
            <Route path="/about"          element={<ViewAbout />} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>

      <JeminiPanel open={jeminiOpen} onClose={() => setJeminiOpen(false)} />

      {toast && <div className="toast">{toast}</div>}
      {sentSnack && (
        <div className="sent-snack">
          <span className="sent-snack-msg">Submission sent</span>
          <button className="sent-snack-act" onClick={() => { setSentSnack(false); navigate('/') }}>View message</button>
          <button className="sent-snack-x" aria-label="Dismiss" onClick={() => setSentSnack(false)}>
            <I.M name="close" size={20} />
          </button>
        </div>
      )}
    </div>
  )
}
