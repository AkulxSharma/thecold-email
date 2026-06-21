import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { EMAILS, TOPIC_NAMES, DEADLINES, SEND_WINDOW, BEST_EMAILS, EVENTS, MEMES, RULES_PAGE, TRACK_PAGES, TRACK_REMEMBER, ENTER_FORM } from './data.js'
import * as I from './icons.jsx'

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

// ---------------- TOP BAR ----------------
function TopBar({ onMenu, onLogo, onJemini, navigate }) {
  const [q, setQ] = useState('')
  const [meme] = useState(() => MEMES[Math.floor(Math.random() * MEMES.length)])
  const [pfpOpen, setPfpOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const statusRef = useRef(null)
  // Close the status menu on any outside click (lightest pattern: document listener).
  useEffect(() => {
    if (!statusOpen) return
    const onDoc = (e) => { if (statusRef.current && !statusRef.current.contains(e.target)) setStatusOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [statusOpen])
  const statusGo = (path) => { setStatusOpen(false); navigate(path) }
  return (
    <div className="topbar">
      <div className="icon-btn" title="Main menu" onClick={onMenu}><I.Menu /></div>
      <div className="logo" onClick={onLogo}><img src={GMAIL_LOGO} alt="" /><span className="wordmark">thecold.email</span></div>
      <div className="search">
        <div className="icon-btn" style={{ width: 40, height: 40 }}><I.Search /></div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search mail" />
        {q && <div className="clear-x" onClick={() => setQ('')}><I.Close w={20} /></div>}
        <div className="search-right">
          <div className="chip"><I.PersonOutline /> From</div>
          <div className="chip"><I.People /> To <span className="kbd">⌘K</span></div>
        </div>
      </div>
      <div className="top-right">
        <div className="jemini" onClick={e => { e.stopPropagation(); onJemini() }}><I.Spark /> Jemini</div>
        <div className="icon-btn" title="Feedback" style={{ cursor: 'pointer' }} onClick={() => { window.location.href = 'mailto:judges@thecold.email?subject=Feedback%20on%20thecold.email' }}><I.Feedback /></div>
        <div className="status-wrap" ref={statusRef}>
          <div className={`status-pill${statusOpen ? ' open' : ''}`} onClick={() => setStatusOpen(o => !o)}>
            <span className="status-dot" /> Active <I.CaretDown />
          </div>
          {statusOpen && (
            <div className="status-menu">
              <div className="status-menu-note"><span className="status-dot" /> Registration opens Jun 24</div>
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
      <div className="compose" onClick={onCompose}><I.Pencil /> Enter</div>

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
function ComposeWindow({ onClose, onSend }) {
  const [track, setTrack] = useState(TRACK_OPTIONS[0])
  const [email, setEmail] = useState('')
  const [targetName, setTargetName] = useState('')
  const [targetEmail, setTargetEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState([])
  const fileRef = useRef()
  const addFiles = (list) => setFiles(f => [...f, ...Array.from(list)])
  return (
    <div className="compose-win">
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
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
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

function JeminiPanel({ onClose, open }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const scrollRef = useRef()
  const started = msgs.length > 0

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
        <span className="jp-bar-title">Jemini</span>
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
            const startOff = vh * 0.16 + i * 14
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
            <a href="#" className="home-footer-link">Instagram</a>
            <a href="#" className="home-footer-link">LinkedIn</a>
            <a href="#" className="home-footer-link">TikTok</a>
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

function ViewEnter({ onEnter }) {
  const [ui, setUi] = useState('maps') // 'maps' | 'classroom'
  const [active, setActive] = useState(0) // active route stop in the Maps UI
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
  const STOPS = [
    { x: 13, y: 15 }, // 1 · Register
    { x: 50, y: 50 }, // 2 · Send cold emails
    { x: 87, y: 86 }, // 3 · Submit (destination)
  ]
  const ROUTE_D = `M${STOPS[0].x} ${STOPS[0].y} C 22 30, 32 36, ${STOPS[1].x} ${STOPS[1].y} C 64 62, 76 70, ${STOPS[2].x} ${STOPS[2].y}`
  const ETA = ['2 min', '1 min', 'Arrive']
  const NAV_ICON = ['straight', 'turn_right', 'place']
  const lastStop = STOPS.length - 1
  const dot = STOPS[active]

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

  const Maps = () => (
    <div className="enter-canvas gmaps">
      <div className="gmaps-app">
        {/* ---- LEFT: directions panel (drag the handle to resize) ---- */}
        <div className="gmaps-panel" style={{ width: panelW }}>
          <div className="gmaps-trip">
            <div className="gmaps-trip-rail" aria-hidden="true">
              <span className="gmaps-trip-o" />
              <span className="gmaps-trip-line" />
              <span className="gmaps-trip-d"><I.M name="place" size={18} /></span>
            </div>
            <div className="gmaps-trip-fields">
              <div className="gmaps-field">Your inbox</div>
              <div className="gmaps-field gmaps-field-d">In the competition</div>
            </div>
            <button className="gmaps-swap" title="Reverse" tabIndex={-1}><I.M name="swap_vert" size={18} /></button>
          </div>

          <div className="gmaps-modes">
            <span className="gmaps-mode is-active" title="Best route"><I.M name="directions_car" size={20} /></span>
            <span className="gmaps-mode" title="Transit"><I.M name="directions_transit" size={20} /></span>
            <span className="gmaps-mode" title="Walk"><I.M name="directions_walk" size={20} /></span>
            <span className="gmaps-mode" title="Cycle"><I.M name="directions_bike" size={20} /></span>
            <span className="gmaps-mode" title="Flight"><I.M name="flight" size={20} /></span>
          </div>

          <div className="gmaps-route-card">
            <div className="gmaps-route-info">
              <div className="gmaps-route-time">~5 min <span className="gmaps-route-dist">3 stops</span></div>
              <div className="gmaps-route-best">Fastest way in</div>
            </div>
            <button className="gmaps-start" onClick={() => (active >= lastStop ? onEnter() : setActive(active + 1))}>
              <I.M name={active >= lastStop ? 'send' : 'navigation'} size={18} />
              <span className="gmaps-start-text">
                <span className="gmaps-start-eyebrow">{active >= lastStop ? "You've arrived" : "You're here"}</span>
                <span className="gmaps-start-step">{active >= lastStop ? 'Open submission' : `Stop ${active + 1}: ${ENTER_STEPS[active].title}`}</span>
              </span>
            </button>
          </div>

          <div className="gmaps-via">via The Procedure</div>
          <div className="gmaps-divider" />

          <div className="gmaps-steplist">
            {ENTER_STEPS.map((s, i) => {
              const open = active === i
              const done = i === 0 && submitted
              return (
                <div key={s.n} className={'gmaps-steprow' + (open ? ' is-open' : '') + (done ? ' is-done' : '')}>
                  <button className="gmaps-step-head" onClick={() => setActive(i)} aria-expanded={open}>
                    <span className="gmaps-step-nav"><I.M name={done ? 'check' : NAV_ICON[i]} size={20} /></span>
                    <span className="gmaps-step-main">
                      <span className="gmaps-step-title">{s.title}</span>
                      <span className="gmaps-step-sub">Stop {s.n} · {ETA[i]}</span>
                    </span>
                    <span className="gmaps-step-chev"><I.M name={open ? 'expand_less' : 'expand_more'} size={20} /></span>
                  </button>
                  {open && <div className="gmaps-step-detail">{StepDetail(i)}</div>}
                </div>
              )
            })}
          </div>

          <div className="gmaps-divider" />
          <div className="gmaps-due">
            <I.M name="schedule" size={16} /> Registration closes Jul 6 · Submit reply by Jul 7
          </div>
        </div>

        {/* drag handle to resize the panel */}
        <div className="gmaps-resizer" onMouseDown={startDrag} role="separator" aria-orientation="vertical" title="Drag to resize">
          <span className="gmaps-resizer-grip" />
        </div>

        {/* ---- RIGHT: map canvas ---- */}
        <div className="gmaps-map">
          <div className="gmaps-land" aria-hidden="true">
            <span className="gmaps-park gmaps-park-1" />
            <span className="gmaps-park gmaps-park-2" />
            <span className="gmaps-water" />
            <span className="gmaps-road gmaps-road-1" />
            <span className="gmaps-road gmaps-road-2" />
            <span className="gmaps-road gmaps-road-3" />
          </div>

          <svg className="gmaps-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d={ROUTE_D} className="gmaps-route-casing" vectorEffect="non-scaling-stroke" />
            <path d={ROUTE_D} className="gmaps-route-line" vectorEffect="non-scaling-stroke" />
          </svg>

          {STOPS.map((p, i) => {
            const isDest = i === lastStop
            return (
              <button
                key={i}
                className={'gmaps-mpin' + (active === i ? ' is-active' : '')}
                style={{ left: p.x + '%', top: p.y + '%' }}
                onClick={() => setActive(i)}
              >
                <MapPin size={isDest ? 42 : 34} fill={isDest ? '#ea4335' : '#1a73e8'} dark={isDest ? '#a50e0e' : '#0842a0'} />
                <span className="gmaps-mpin-tip">{ENTER_STEPS[i].title}</span>
              </button>
            )
          })}

          {/* user "blue dot" — glides to the active stop */}
          <span className="gmaps-bluedot" style={{ left: dot.x + '%', top: dot.y + '%' }}>
            <span className="gmaps-bluedot-halo" />
            <span className="gmaps-bluedot-core" />
          </span>

          <div className="gmaps-ctrl gmaps-zoom">
            <button className="gmaps-ctrl-btn" tabIndex={-1}><I.M name="add" size={18} /></button>
            <span className="gmaps-ctrl-sep" />
            <button className="gmaps-ctrl-btn" tabIndex={-1}><I.M name="remove" size={18} /></button>
          </div>
          <button className="gmaps-myloc" title="Your location" onClick={() => setActive(0)}>
            <I.M name="my_location" size={20} />
          </button>
          <div className="gmaps-attr">Map data ©2026 thecold.email</div>
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
      </div>
      {ui === 'maps' ? Maps() : Classroom()}
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

  // Nav — clamp to at most one week either side of the base week
  const baseWeek = weekStart(DEFAULT_WEEK)
  const minWeekTs = addDays(baseWeek, -7).getTime()
  const maxWeekTs = addDays(baseWeek,  7).getTime()
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

function ViewBest() {
  const [open, setOpen] = useState(null) // null = inbox list; index = open thread
  const [aiOpen, setAiOpen] = useState(true)

  // -------- Open thread (reading pane) --------
  if (open != null) {
    const em = BEST_EMAILS[open]
    const initials = em.from.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    const color = AVATAR_COLORS[open % AVATAR_COLORS.length]
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
              <span className="gm-label-chip">Inbox <I.M name="close" size={14} /></span>
            </div>
            <div className="gm-subject-right">
              <span className="gm-ic" title="Collapse all"><I.M name="unfold_less" size={20} /></span>
              <span className="gm-ic" title="Print all"><I.M name="print" size={20} /></span>
              <span className="gm-ic" title="In new window"><I.M name="open_in_new" size={20} /></span>
            </div>
          </div>

          {/* Messages */}
          {[
            { name: em.from, email: em.fromEmail, av: color, img: em.avatar,
              to: em.to ? `to ${em.to}` : 'to judges', date: em.replyFrom ? em.date : 'Example entry', body: em.body },
            { name: em.replyFrom || 'Recipient', email: em.replyEmail, av: '#5f6368', img: em.replyAvatar,
              to: 'to me', date: em.replyDate || '✓ Real reply', body: em.reply },
          ].map((m, i) => (
            <div className="gm-msg" key={i}>
              {m.img
                ? <img className="gm-avatar gm-avatar-img" src={m.img} alt={m.name} />
                : <div className="gm-avatar" style={{ background: m.av }}>
                    {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>}
              <div className="gm-msg-main">
                <div className="gm-msg-top">
                  <div className="gm-msg-who">
                    <div className="gm-msg-l1">
                      <span className="gm-from">{m.name}</span>
                      {m.email && <span className="gm-email">&lt;{m.email}&gt;</span>}
                    </div>
                    <div className="gm-to">{m.to} <I.M name="arrow_drop_down" size={16} /></div>
                  </div>
                  <div className="gm-msg-actions">
                    <span className="gm-date">{m.date}</span>
                    <span className="gm-ic" title="Star"><I.M name="star_border" size={18} /></span>
                    <span className="gm-ic" title="React"><I.M name="add_reaction" size={18} /></span>
                    <span className="gm-ic" title="Reply"><I.M name="reply" size={18} /></span>
                    <span className="gm-ic" title="More"><I.M name="more_vert" size={18} /></span>
                  </div>
                </div>
                <div className="gm-body">{m.body}</div>
              </div>
            </div>
          ))}

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

  // Each track renders as a DIFFERENT rough brainstorm artifact (theme by topic).
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

// ---- shared decorative SVG bits for the brainstorm themes ----
function Squiggle({ className }) {
  return (
    <svg className={className} viewBox="0 0 120 24" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 14 C 20 4, 30 22, 48 12 S 80 2, 98 14 S 116 8, 118 11"
        fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
function HandArrow({ className }) {
  return (
    <svg className={className} viewBox="0 0 90 56" aria-hidden="true">
      <path d="M4 8 C 30 4, 64 14, 78 44" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M78 44 L 64 38 M78 44 L 82 28" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

// pick a "random but stable" rotation from an index, so layouts don't jump between renders
const rot = (i, spread = 2.4) => ((((i * 47) % 100) / 100) * 2 - 1) * spread

// ===================== TRACK THEME DISPATCH =====================
function ViewTrackDoc({ data, title, topic }) {
  if (topic === 'subject')  return <TrackWhiteboard  data={data} title={title} />
  if (topic === 'twoliner') return <TrackNotebook    data={data} title={title} />
  if (topic === 'ask')      return <TrackCorkboard   data={data} title={title} />
  return <TrackMarkedDoc data={data} title={title} /> // 'unreachable' (default)
}

// ===================== SHARED GOOGLE DOCS FRAME =====================
// The Google Docs chrome (title bar + menu row + formatting toolbar, all sticky)
// plus the centered white page sheet. ALL 4 track themes render inside this so the
// top of every track page is identical Google Docs chrome; only the page content differs.
// `canvasClass` / `pageClass` let each theme add its namespace to tint/shape its sheet.
function DocFrame({ title, canvasClass = '', pageClass = '', children }) {
  const menus = ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Extensions', 'Help']
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
        <span className="gdoc-tb-font">Arial<I.M name="arrow_drop_down" size={18} /></span>
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
        <div className={`gdoc-page ${pageClass}`.trim()}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ===================== THEME 1: MARKED-UP GOOGLE DOC =====================
function TrackMarkedDoc({ data, title }) {
  return (
    <DocFrame title={title} canvasClass="mkd-canvas" pageClass="mkd-page">
          {/* margin notes + comment bubbles — generic set-dressing, not track copy */}
          <span className="mkd-note mkd-note-1">&lt;- start here</span>
          <span className="mkd-note mkd-note-2">love this!!</span>
          <span className="mkd-note mkd-note-3">revisit??</span>
          <HandArrow className="mkd-arrow mkd-arrow-1" />
          <HandArrow className="mkd-arrow mkd-arrow-2" />
          <div className="mkd-comment mkd-comment-1">
            <span className="mkd-comment-av">AR</span>
            <div className="mkd-comment-body"><b>Aria</b><span>can we make this punchier?</span></div>
          </div>
          <div className="mkd-comment mkd-comment-2">
            <span className="mkd-comment-av mkd-comment-av2">JD</span>
            <div className="mkd-comment-body"><b>Jordan</b><span>yes — keep this section</span></div>
          </div>

          <h1 className="gdoc-h1 mkd-circle">{title}</h1>

          <h2 className="gdoc-h2">The Goal</h2>
          <div className="gdoc-goal">
            <p className="gdoc-p gdoc-goal-lead"><span className="mkd-hl mkd-hl-y"><RT>{data.goal}</RT></span></p>
            {data.goalExtra && <p className="gdoc-p gdoc-goal-extra"><RT>{data.goalExtra}</RT></p>}
          </div>

          <h2 className="gdoc-h2">How It's Won</h2>
          {data.howWon.map((l, i) => (
            <p className="gdoc-p" key={i}>
              {i === 0 ? <span className="mkd-hl mkd-hl-g"><RT>{l}</RT></span> : <RT>{l}</RT>}
            </p>
          ))}

          <h2 className="gdoc-h2">What This Track Rewards</h2>
          {data.rewards.map((l, i) => (
            <p className="gdoc-p" key={i}>
              {i === 1 ? <><span className="mkd-strike"><RT>{l}</RT></span> <span className="mkd-edit">tighten this</span></> : <RT>{l}</RT>}
            </p>
          ))}

          <h2 className="gdoc-h2">What Judges Look For</h2>
          <ul className="gdoc-list">
            {data.judges.map((l, i) => <li key={i}><span className="gdoc-mark gdoc-mark-tri">▸</span><span>{i === 0 ? <span className="mkd-underline"><RT>{l}</RT></span> : <RT>{l}</RT>}</span></li>)}
          </ul>

          <h2 className="gdoc-h2">Strong Entries</h2>
          <ul className="gdoc-list">
            {data.strong.map((l, i) => <li key={i}><span className="gdoc-mark gdoc-mark-dot">•</span><span><RT>{l}</RT></span></li>)}
          </ul>

          <h2 className="gdoc-h2">Common Mistakes</h2>
          <ul className="gdoc-list">
            {data.mistakes.map((l, i) => <li key={i}><span className="gdoc-mark gdoc-mark-dash">–</span><span><RT>{l}</RT></span></li>)}
          </ul>

          <h2 className="gdoc-h2">Scoring</h2>
          <table className="gdoc-table">
            <thead>
              <tr><th>Criteria</th><th className="gdoc-table-pts">Points</th></tr>
            </thead>
            <tbody>
              {data.scoring.map((s, i) => (
                <tr key={i}><td>{s.label}</td><td className="gdoc-table-pts">{s.pts}</td></tr>
              ))}
            </tbody>
          </table>

          <h2 className="gdoc-h2">Prize</h2>
          <div className="gdoc-prize">
            <span className="gdoc-prize-icon"><I.M name="emoji_events" size={22} /></span>
            <p className="gdoc-p gdoc-prize-text"><strong className="mkd-hl mkd-hl-y">$500</strong> for the winning entry. Every qualifying entry is also automatically considered for the Best Cold Email ($1,000 grand prize).</p>
          </div>
    </DocFrame>
  )
}

// ===================== shared section walker for marker/handwriting themes =====================
// Renders the SAME data sections; the caller supplies class names per theme.
function trackSections(data) {
  return [
    { h: 'The Goal', kind: 'goal', items: data.goalExtra ? [data.goal, data.goalExtra] : [data.goal] },
    { h: "How It's Won", kind: 'para', items: data.howWon },
    { h: 'What This Track Rewards', kind: 'para', items: data.rewards },
    { h: 'What Judges Look For', kind: 'list', items: data.judges },
    { h: 'Strong Entries', kind: 'list', items: data.strong },
    { h: 'Common Mistakes', kind: 'list', items: data.mistakes },
  ]
}
const PRIZE_LINE = (Strong) => (
  <>{Strong ? <Strong>$500</Strong> : <strong>$500</strong>} for the winning entry. Every qualifying entry is also automatically considered for the Best Cold Email ($1,000 grand prize).</>
)

// ===================== THEME 2: WHITEBOARD =====================
function TrackWhiteboard({ data, title }) {
  const secs = trackSections(data)
  const penFor = (i) => ['wb-pen-blk', 'wb-pen-blu', 'wb-pen-red', 'wb-pen-grn'][i % 4]
  return (
    <DocFrame title={title} canvasClass="wb-canvas" pageClass="wb-page">
      <div className="wb-surface">
        <div className="wb-title-wrap">
          <h1 className="wb-title">{title}</h1>
          <Squiggle className="wb-title-underline" />
        </div>
        <span className="wb-sticky wb-sticky-1">brainstorm<br />v3 ✎</span>
        <span className="wb-sticky wb-sticky-2">DON'T<br />FORGET</span>
        <HandArrow className="wb-arrow wb-arrow-1" />

        <div className="wb-grid">
          {secs.map((s, si) => (
            <div className={`wb-box ${penFor(si)}`} key={s.h} style={{ transform: `rotate(${rot(si, 1.1)}deg)` }}>
              <h2 className="wb-h">{s.h}</h2>
              {s.kind === 'list' ? (
                <ul className="wb-list">
                  {s.items.map((l, i) => <li key={i}><span className="wb-bullet">▸</span><span><RT>{l}</RT></span></li>)}
                </ul>
              ) : (
                s.items.map((l, i) => <p className="wb-p" key={i}><RT>{l}</RT></p>)
              )}
            </div>
          ))}

          {/* Scoring as a hand-drawn tally box */}
          <div className="wb-box wb-pen-grn wb-score" style={{ transform: `rotate(${rot(7, 1.1)}deg)` }}>
            <h2 className="wb-h">Scoring</h2>
            <div className="wb-tally">
              {data.scoring.map((s, i) => (
                <div className="wb-tally-row" key={i}>
                  <span className="wb-tally-label"><RT>{s.label}</RT></span>
                  <span className="wb-tally-pts">{s.pts} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prize box */}
          <div className="wb-box wb-pen-red wb-prize" style={{ transform: `rotate(${rot(9, 1.1)}deg)` }}>
            <h2 className="wb-h">Prize ★</h2>
            <p className="wb-p">{PRIZE_LINE()}</p>
          </div>
        </div>
      </div>
    </DocFrame>
  )
}

// ===================== THEME 3: LINED NOTEBOOK =====================
function TrackNotebook({ data, title }) {
  const secs = trackSections(data)
  return (
    <DocFrame title={title} canvasClass="nb-canvas" pageClass="nb-page">
      <div className="nb-surface">
        <div className="nb-coffee" aria-hidden="true" />
        <div className="nb-tape" aria-hidden="true" />
        <h1 className="nb-title" style={{ transform: `rotate(${rot(1, 1.4)}deg)` }}>{title}</h1>
        <span className="nb-doodle nb-doodle-1">★</span>
        <HandArrow className="nb-arrow" />

        {secs.map((s, si) => (
          <section className="nb-sec" key={s.h}>
            <h2 className="nb-h" style={{ transform: `rotate(${rot(si + 3, 0.8)}deg)` }}>{s.h}</h2>
            {s.kind === 'list' ? (
              <ul className="nb-list">
                {s.items.map((l, i) => (
                  <li key={i} style={{ transform: `rotate(${rot(si * 5 + i, 0.5)}deg)` }}>
                    <span className="nb-bullet">→</span>
                    <span>{si === 3 && i === 0 ? <span className="nb-hl"><RT>{l}</RT></span> : <RT>{l}</RT>}</span>
                  </li>
                ))}
              </ul>
            ) : (
              s.items.map((l, i) => (
                <p className="nb-p" key={i}>{si === 0 && i === 0 ? <span className="nb-hl"><RT>{l}</RT></span> : <RT>{l}</RT>}</p>
              ))
            )}
          </section>
        ))}

        <section className="nb-sec">
          <h2 className="nb-h" style={{ transform: `rotate(${rot(20, 0.8)}deg)` }}>Scoring</h2>
          {data.scoring.map((s, i) => (
            <p className="nb-p nb-score-row" key={i}><span className="nb-score-pts">{s.pts}</span> — <RT>{s.label}</RT></p>
          ))}
        </section>

        <section className="nb-sec">
          <h2 className="nb-h" style={{ transform: `rotate(${rot(30, 0.8)}deg)` }}>Prize ★</h2>
          <p className="nb-p"><span className="nb-hl">{PRIZE_LINE()}</span></p>
        </section>
      </div>
    </DocFrame>
  )
}

// ===================== THEME 4: CORKBOARD / PINNED CARDS =====================
function TrackCorkboard({ data, title }) {
  const secs = trackSections(data)
  const cardColor = (i) => ['ck-c-white', 'ck-c-yellow', 'ck-c-blue', 'ck-c-pink', 'ck-c-green', 'ck-c-white'][i % 6]
  return (
    <DocFrame title={title} canvasClass="ck-canvas" pageClass="ck-page">
      <div className="ck-surface">
      <div className="ck-card ck-title-card" style={{ transform: `rotate(${rot(0, 1.6)}deg)` }}>
        <span className="ck-pin" />
        <h1 className="ck-title">{title}</h1>
      </div>

      <div className="ck-grid">
        {secs.map((s, si) => (
          <div className={`ck-card ${cardColor(si)}`} key={s.h} style={{ transform: `rotate(${rot(si + 1, 2)}deg)` }}>
            {si % 2 === 0 ? <span className="ck-pin" /> : <span className="ck-tape" />}
            <h2 className="ck-h">{s.h}</h2>
            {s.kind === 'list' ? (
              <ul className="ck-list">
                {s.items.map((l, i) => <li key={i}><span className="ck-bullet">✶</span><span><RT>{l}</RT></span></li>)}
              </ul>
            ) : (
              s.items.map((l, i) => <p className="ck-p" key={i}><RT>{l}</RT></p>)
            )}
          </div>
        ))}

        <div className="ck-card ck-c-green ck-score-card" style={{ transform: `rotate(${rot(8, 2)}deg)` }}>
          <span className="ck-pin" />
          <h2 className="ck-h">Scoring</h2>
          {data.scoring.map((s, i) => (
            <div className="ck-score-row" key={i}>
              <span className="ck-score-pts">{s.pts}</span>
              <span className="ck-score-label"><RT>{s.label}</RT></span>
            </div>
          ))}
        </div>

        <div className="ck-card ck-c-pink ck-prize-card" style={{ transform: `rotate(${rot(11, 2)}deg)` }}>
          <span className="ck-tape" />
          <h2 className="ck-h">Prize ★</h2>
          <p className="ck-p">{PRIZE_LINE()}</p>
        </div>
      </div>
      </div>
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
  // Theme-aware thumbnail. Each track previews its REAL themed doc
  // (whiteboard / notebook / corkboard / marked-up doc) at thumbnail scale,
  // echoing that theme's fonts, colors and signature motifs. Copy is pulled
  // from TRACK_PAGES[t]; only tiny decorative labels are hardcoded.
  const mini = (t, lg) => {
    const d = TRACK_PAGES[t]
    const name = TOPIC_NAMES[t]
    const cls = `gmini${lg ? ' gmini-lg' : ''}`

    // ---- subject -> WHITEBOARD (marker font, hand-drawn boxes, sticky notes) ----
    if (t === 'subject') {
      return (
        <div className={`${cls} gmini-wb`}>
          <div className="gmini-wb-title">{name}<Squiggle className="gmini-wb-underline" /></div>
          <span className="gmini-wb-sticky">brainstorm<br />v3 ✎</span>
          <div className="gmini-wb-grid">
            <div className="gmini-wb-box gmini-wb-blu">
              <div className="gmini-wb-h">The Goal</div>
              <p className="gmini-wb-p"><RT>{d.goal}</RT></p>
            </div>
            <div className="gmini-wb-box gmini-wb-blk">
              <div className="gmini-wb-h">How It's Won</div>
              {d.howWon.slice(0, 2).map((l, i) => <p className="gmini-wb-p" key={i}><RT>{l}</RT></p>)}
            </div>
            <div className="gmini-wb-box gmini-wb-grn">
              <div className="gmini-wb-h">Judges</div>
              <ul className="gmini-wb-list">
                {d.judges.slice(0, 3).map((l, i) => <li key={i}><span className="gmini-wb-bul">▸</span><RT>{l}</RT></li>)}
              </ul>
            </div>
            <div className="gmini-wb-box gmini-wb-red">
              <div className="gmini-wb-h">Prize ★</div>
              <p className="gmini-wb-p"><strong>$500</strong> winning entry</p>
            </div>
          </div>
        </div>
      )
    }

    // ---- twoliner -> LINED NOTEBOOK (ruled paper, handwriting, coffee ring) ----
    if (t === 'twoliner') {
      return (
        <div className={`${cls} gmini-nb`}>
          <div className="gmini-nb-coffee" aria-hidden="true" />
          <div className="gmini-nb-title">{name}</div>
          <div className="gmini-nb-sec">
            <div className="gmini-nb-h">The Goal</div>
            <p className="gmini-nb-p"><span className="gmini-nb-hl"><RT>{d.goal}</RT></span></p>
          </div>
          <div className="gmini-nb-sec">
            <div className="gmini-nb-h">How It's Won</div>
            {d.howWon.slice(0, 2).map((l, i) => <p className="gmini-nb-p" key={i}><RT>{l}</RT></p>)}
          </div>
          <div className="gmini-nb-sec">
            <div className="gmini-nb-h">Judges</div>
            <ul className="gmini-nb-list">
              {d.judges.slice(0, 3).map((l, i) => <li key={i}><span className="gmini-nb-bul">→</span><RT>{l}</RT></li>)}
            </ul>
          </div>
        </div>
      )
    }

    // ---- ask -> CORKBOARD (cork bg, pinned index cards) ----
    if (t === 'ask') {
      const colors = ['gmini-ck-white', 'gmini-ck-yellow', 'gmini-ck-blue', 'gmini-ck-pink']
      const cards = [
        { h: 'The Goal', body: <p className="gmini-ck-p"><RT>{d.goal}</RT></p> },
        { h: "How It's Won", body: d.howWon.slice(0, 2).map((l, i) => <p className="gmini-ck-p" key={i}><RT>{l}</RT></p>) },
        { h: 'Judges', body: (
          <ul className="gmini-ck-list">
            {d.judges.slice(0, 3).map((l, i) => <li key={i}><span className="gmini-ck-bul">✶</span><RT>{l}</RT></li>)}
          </ul>
        ) },
        { h: 'Prize ★', body: <p className="gmini-ck-p"><strong>$500</strong> winning entry</p> },
      ]
      return (
        <div className={`${cls} gmini-ck`}>
          <div className="gmini-ck-titlecard"><span className="gmini-ck-pin" />{name}</div>
          <div className="gmini-ck-grid">
            {cards.map((c, i) => (
              <div className={`gmini-ck-card ${colors[i]}`} key={c.h} style={{ transform: `rotate(${rot(i + 1, 2)}deg)` }}>
                {i % 2 === 0 ? <span className="gmini-ck-pin" /> : <span className="gmini-ck-tape" />}
                <div className="gmini-ck-h">{c.h}</div>
                {c.body}
              </div>
            ))}
          </div>
        </div>
      )
    }

    // ---- unreachable (default) -> MARKED-UP GOOGLE DOC (highlighter + margin notes + arrow) ----
    return (
      <div className={`${cls} gmini-mkd`}>
        <span className="gmini-mkd-note gmini-mkd-note-1">&lt;- start here</span>
        <span className="gmini-mkd-note gmini-mkd-note-2">love this!!</span>
        <HandArrow className="gmini-mkd-arrow" />
        <div className="gmini-mkd-h1">{name}</div>
        <div className="gmini-mkd-sub">The Goal</div>
        <p className="gmini-mkd-p"><span className="gmini-mkd-hl gmini-mkd-hl-y"><RT>{d.goal}</RT></span></p>
        <div className="gmini-mkd-sub">How It's Won</div>
        {d.howWon.slice(0, 2).map((l, i) => (
          <p className="gmini-mkd-p" key={i}>{i === 0 ? <span className="gmini-mkd-hl gmini-mkd-hl-g"><RT>{l}</RT></span> : <RT>{l}</RT>}</p>
        ))}
        <div className="gmini-mkd-sub">What Judges Look For</div>
        <ul className="gmini-mkd-list">
          {d.judges.slice(0, 3).map((l, i) => (
            <li key={i}><span className="gmini-mkd-mark">▸</span><span>{i === 0 ? <span className="gmini-mkd-underline"><RT>{l}</RT></span> : <RT>{l}</RT>}</span></li>
          ))}
        </ul>
        <div className="gmini-mkd-sub">Prize</div>
        <p className="gmini-mkd-p"><strong className="gmini-mkd-hl gmini-mkd-hl-y">$500</strong> winning entry.</p>
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
  const [expanded, setExpanded] = useState(null)   // note id or null
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
              <span className="keep-note-pin" onClick={e => e.stopPropagation()} title="Pin note"><I.M name="keep" size={20} /></span>
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
              <span className="keep-modal-pin" title="Pin note"><I.M name="keep" size={20} /></span>
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
          <button className="gpay-act" onClick={onEnter}><span className="gpay-act-ic"><I.M name="bolt" size={22} /></span>Enter</button>
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
  const [composeOpen, setComposeOpen] = useState(false)
  const [jeminiOpen, setJeminiOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 768)
  const [toast, setToast] = useState('')
  const toastTimer = useRef()

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

  const submitEntry = ({ email, targetName, targetEmail, files }) => {
    if (!email || !EMAIL_RE.test(email.trim())) { showToast('Enter a valid email for yourself first.'); return }
    if (!targetName || !targetName.trim()) { showToast('Add the name of the person you emailed.'); return }
    if (targetEmail && !EMAIL_RE.test(targetEmail.trim())) { showToast('That target email doesn’t look valid.'); return }
    if (!files || !files.length) { showToast('Attach a screenshot/PDF of the thread (paperclip).'); return }
    // TODO(Akul): POST these fields to SUBMISSION_FORM_URL (Google Form) or
    // redirect/embed for confirmation once the form URL is supplied.
    setComposeOpen(false)
    showToast('Entry submitted. Good luck, go get the reply.')
  }

  // Navigate by internal view key — preserves every existing goto()/setView() call site.
  const goto = (view) => navigate(viewToPath(view))
  const goHome = () => navigate('/')
  const onEnter = () => setComposeOpen(true)

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
          onCompose={() => setComposeOpen(true)}
          goto={goto}
          pathname={pathname}
          open={sidebarOpen}
        />
        <div className="main">
          <Routes>
            <Route path="/"               element={<ViewOverview onEnter={onEnter} goto={goto} />} />
            <Route path="/home"           element={<ViewOverview onEnter={onEnter} goto={goto} />} />
            <Route path="/the-procedure"  element={<ViewEnter onEnter={onEnter} />} />
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

      {composeOpen && (
        <ComposeWindow
          onClose={() => setComposeOpen(false)}
          onSend={submitEntry}
        />
      )}

      <JeminiPanel open={jeminiOpen} onClose={() => setJeminiOpen(false)} />

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
