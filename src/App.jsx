import { useState, useRef } from 'react'
import { EMAILS, TOPIC_NAMES, DEADLINES, SEND_WINDOW, BEST_EMAILS, EVENTS, MEMES, RULES_PAGE } from './data.js'
import * as I from './icons.jsx'

const GMAIL_LOGO = '/logo.png'
// Track content pulled from the single source of truth (data.js)
const TRACKS = ['unreachable', 'subject', 'twoliner', 'ask'].map(t => EMAILS.find(e => e.topic === t))

// ---------------- TOP BAR ----------------
function TopBar({ onMenu, onLogo, onJemini }) {
  const [q, setQ] = useState('')
  const [meme] = useState(() => MEMES[Math.floor(Math.random() * MEMES.length)])
  const [pfpOpen, setPfpOpen] = useState(false)
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
        <div className="icon-btn" title="Feedback"><I.Feedback /></div>
        <div className="status-pill"><span className="status-dot" /> Active <I.CaretDown /></div>
        <div className="avatar-ring" title={`${meme.name} — click for the takeaway`} onClick={() => setPfpOpen(true)}>
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

function Sidebar({ onCompose, view, setView, open }) {
  return (
    <div className={`sidebar${open ? '' : ' sidebar-collapsed'}`}>
      <div className="compose" onClick={onCompose}><I.Pencil /> Enter</div>

      <NavItem icon={<I.M name="inbox" />}         label="Home"           count="7,493" active={view === 'overview'} onClick={() => setView('overview')} />
      <NavItem icon={<I.M name="star" />}          label="How to Enter"                       active={view === 'enter'}    onClick={() => setView('enter')} />
      <NavItem icon={<I.M name="calendar_month" />} label="Event Calendar"                    active={view === 'calendar'} onClick={() => setView('calendar')} />
      <NavItem icon={<I.M name="auto_awesome" />}  label="Best Emails"                    active={view === 'best'}     onClick={() => setView('best')} />

      <div className="section-head"><I.CaretDown /> TRACKS</div>
      <NavItem icon={<I.Plane size={20} />}  label="The Unreachable"    active={view === 'track-unreachable'} onClick={() => setView('track-unreachable')} />
      <NavItem icon={<I.SparkPen size={20} />} label="Best Subject Line"  active={view === 'track-subject'}     onClick={() => setView('track-subject')} />
      <NavItem icon={<I.M name="short_text" />} label="The Two-Liner"      active={view === 'track-twoliner'}    onClick={() => setView('track-twoliner')} />
      <NavItem icon={<I.M name="help" />} label="The Ask"            active={view === 'track-ask'}         onClick={() => setView('track-ask')} />

      <div className="section-head"><I.CaretDown /> THE EVENT</div>
      <NavItem icon={<I.M name="rule" />}        label="The Rule"   active={view === 'rule'}    onClick={() => setView('rule')} />
      <NavItem icon={<I.M name="emoji_events" />} label="Prizes"     active={view === 'prizes'}  onClick={() => setView('prizes')} />
      <NavItem icon={<I.M name="balance" />}      label="Judging"    active={view === 'judging'} onClick={() => setView('judging')} />
    </div>
  )
}

// ---------------- ENTRY FORM (Compose) ----------------
const TRACK_OPTIONS = ['The Best Cold Email (overall)', 'The Unreachable', 'Best Subject Line', 'The Two-Liner', 'The Ask']
function ComposeWindow({ onClose, onSend }) {
  const [track, setTrack] = useState(TRACK_OPTIONS[0])
  const [email, setEmail] = useState('')
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

      <div className="cw-field">
        <span className="cw-label">From</span>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your email" />
      </div>
      <div className="cw-field">
        <span className="cw-label">To</span>
        <input value="judges@thecold.email" readOnly tabIndex={-1} style={{ color: '#5e5e5e' }} />
        <span className="cw-ccbcc">Cc&nbsp;&nbsp;Bcc</span>
      </div>
      <div className="cw-field">
        <span className="cw-label">Track</span>
        <select value={track} onChange={e => setTrack(e.target.value)} className="cw-select">
          {TRACK_OPTIONS.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="cw-field cw-field-plain">
        <input className="cw-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
      </div>
      <div className="cw-body">
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Paste the cold email you sent (and the reply, if you like)..." />
      </div>

      {files.length > 0 && (
        <div className="cw-attachments">
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

      {/* Formatting toolbar (decorative — matches Gmail) */}
      <div className="cw-toolbar">
        <span className="cw-tb-font">Sans Serif <I.M name="arrow_drop_down" size={18} /></span>
        <span className="cw-tb-div" />
        <span className="cw-tb-ic"><I.M name="format_size" size={18} /></span>
        <span className="cw-tb-div" />
        <span className="cw-tb-ic"><I.M name="format_bold" size={18} /></span>
        <span className="cw-tb-ic"><I.M name="format_italic" size={18} /></span>
        <span className="cw-tb-ic"><I.M name="format_underlined" size={18} /></span>
        <span className="cw-tb-ic"><I.M name="format_color_text" size={18} /></span>
        <span className="cw-tb-div" />
        <span className="cw-tb-ic"><I.M name="format_align_left" size={18} /></span>
        <span className="cw-tb-ic"><I.M name="format_list_numbered" size={18} /></span>
        <span className="cw-tb-ic"><I.M name="format_list_bulleted" size={18} /></span>
        <span className="cw-tb-ic"><I.M name="format_indent_decrease" size={18} /></span>
        <span className="cw-tb-ic"><I.M name="format_indent_increase" size={18} /></span>
        <span className="cw-tb-ic"><I.M name="format_quote" size={18} /></span>
        <span className="cw-tb-ic"><I.M name="more_vert" size={18} /></span>
      </div>

      {/* Send row */}
      <div className="cw-actions">
        <button className="cw-send" onClick={() => onSend({ track, email, subject, body, files })}>
          Send<span className="cw-send-caret"><I.M name="arrow_drop_down" size={20} /></span>
        </button>
        <div className="cw-act-icons">
          <span className="cw-act-ic"><I.M name="format_color_text" size={20} /></span>
          <span className="cw-act-ic" title="Attach files" onClick={() => fileRef.current && fileRef.current.click()}><I.M name="attach_file" size={20} /></span>
          <span className="cw-act-ic"><I.M name="link" size={20} /></span>
          <span className="cw-act-ic"><I.M name="mood" size={20} /></span>
          <span className="cw-act-ic"><I.M name="add_to_drive" size={20} /></span>
          <span className="cw-act-ic"><I.M name="image" size={20} /></span>
          <span className="cw-act-ic"><I.M name="schedule_send" size={20} /></span>
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
  if (has('unreachable')) return "The Unreachable: get a reply from someone who never replies — a founder, a celeb, an investor. Scored on how unreachable they are + the reply. $500."
  if (has('subject')) return "Best Subject Line: the reply was earned by the subject line alone. Scored on the line itself + that it landed a reply. $500."
  if (has('two-liner', 'two liner', 'twoliner', '2 line', 'short')) return "The Two-Liner: land a reply in 2 sentences or fewer. Scored on brevity + the reply. $500."
  if (has('the ask', 'big ask', 'huge', 'land')) return "The Ask: land a huge yes — money, a meeting, a job, a partnership. Scored on the size of the yes. $500."
  if (has('track')) return "4 tracks, $500 each:\n• The Unreachable\n• Best Subject Line\n• The Two-Liner\n• The Ask\nEvery entry also competes for The Best Cold Email — the $1,000 grand prize."
  if (has('prize', 'money', 'win', 'cash', '$', 'pay')) return "$3,000 total:\n• The Best Cold Email (grand) — $1,000\n• Each of the 4 tracks — $500"
  if (has('grand', 'best cold email', 'overall')) return "The Best Cold Email is the $1,000 grand prize — the single best email of the event. Every entry, any track, is in the running."
  if (has('rule', 'cheat', 'allowed', 'disqualif', 'fake')) return "One rule: real replies only. A real stranger has to write back. No impersonation, no lying, no pre-existing relationship, no mass-blasting. Break any → disqualified."
  if (has('judg', 'score', 'rubric', 'how do you decide')) return "Two steps: (1) a pass/fail gate — real reply, no rule broken; (2) a 100-point rubric per track. Highest per track wins; strongest overall takes the grand prize."
  if (has('enter', 'how do i', 'submit', 'join', 'sign up', 'apply')) return "Send a cold email → get a real reply → submit the form with a screenshot of the reply before Jul 7. Hit Enter (top-left) to start."
  if (has('deadline', 'date', 'when', 'timeline', 'launch', 'close', 'over')) return "Timeline:\n• Jun 24 — launch\n• Jun 30 — registration closes\n• Jul 7 — submissions close\n• Jul 10 — winners announced"
  if (has('what', 'about', 'this', 'explain')) return "thecold.email is a competition to find the best cold emails on the planet — proven by who actually replied. Get the reply."
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

function ViewOverview({ onEnter, goto }) {
  return (
    <div className="view-panel">
      <div className="home">

        {/* 1 — HERO */}
        <section className="home-hero">
          <div className="home-hero-main">
            <h1 className="home-tagline">The world replies to those who know how to write.</h1>
            <p className="home-sub">A cold email competition to find the best cold emails on the planet — proven by who actually replied.</p>
            <button className="lp-cta" onClick={onEnter}>Enter the competition</button>
          </div>
        </section>

        {/* Launch video — big & special placeholder */}
        <section className="home-video">
          <div className="home-video-frame">
            <div className="home-video-play"><I.M name="play_arrow" size={40} /></div>
            <div className="home-video-text">
              <div className="home-video-title">Launch film</div>
              <div className="home-video-sub">Drops June 24</div>
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

        {/* 4 — TRACK TEASER (icons → track pages, no descriptions) */}
        <section className="home-tracks">
          <div className="home-section-kicker">Four ways to win</div>
          <div className="home-track-grid">
            {TRACK_TEASERS.map(topic => (
              <button className="home-track" key={topic} onClick={() => goto(`track-${topic}`)}>
                <span className="home-track-icon">{TRACK_ICONS[topic]}</span>
                <span className="home-track-name">{TOPIC_NAMES[topic]}</span>
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

        {/* 6 — MANIFESTO (placeholder copy — DK supplies the real line) */}
        <section className="home-manifesto">
          <blockquote className="home-manifesto-quote">
            “The cold email is the last open door. Anyone can knock. Almost no one does it well.”
          </blockquote>
          <div className="home-manifesto-note">— manifesto placeholder, real copy TBD</div>
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
          <div className="home-footer-sponsors">Sponsors — your logo here</div>
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
function ViewEnter({ onEnter }) {
  return (
    <div className="view-panel">
      <div className="view-body">
        <div className="lp-steps">
          <div className="lp-step">Send your cold email — real stranger, real ask.</div>
          <div className="lp-step">Get a real reply.</div>
          <div className="lp-step">Submit the form with a screenshot of the reply before July 7.</div>
        </div>
        <button className="lp-cta" style={{ marginTop: 8 }} onClick={onEnter}>Enter the competition</button>
      </div>
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

// Default week: Mon Jun 22 2026
const DEFAULT_WEEK = new Date(2026, 5, 22)
const TODAY_YMD = '2026-06-18'

function ViewCalendar() {
  const [monDate, setMonDate] = useState(weekStart(DEFAULT_WEEK))

  // The 7 days Mon→Sun
  const days = Array.from({ length: 7 }, (_, i) => addDays(monDate, i))
  const dayYMDs = days.map(fmtYMD)

  // Title: month name + year, e.g. "June 2026" (or "Jun – Jul 2026" if the week spans two months)
  const sunDate = days[6]
  const weekTitle = monDate.getMonth() === sunDate.getMonth()
    ? `${monDate.toLocaleString('en-US', { month: 'long' })} ${sunDate.getFullYear()}`
    : `${MONTH_ABBR[monDate.getMonth()]} – ${MONTH_ABBR[sunDate.getMonth()]} ${sunDate.getFullYear()}`

  // Nav
  const goPrev  = () => setMonDate(d => addDays(d, -7))
  const goNext  = () => setMonDate(d => addDays(d,  7))
  const goToday = () => setMonDate(weekStart(new Date(2026, 5, 18)))

  // Partition events into all-day and timed, filtered to visible week
  const monTs  = monDate.getTime()
  const sunTs  = addDays(monDate, 7).getTime() - 1

  const allDayEvents = []
  const timedByDay   = {}  // ymd → [event, ...]
  dayYMDs.forEach(ymd => { timedByDay[ymd] = [] })

  EVENTS.forEach(ev => {
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
          <span className="gcalw-view-pill">Week ▾</span>
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
                    }}
                    title={ev.title}
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
                        }}
                        title={`${ev.start}–${ev.end} ${ev.title}`}
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
      <div className="view-panel">
        <div className="view-header bx-thread-head">
          <span className="bx-back" title="Back to inbox" onClick={() => setOpen(null)}><I.M name="arrow_back" size={20} /></span>
          <h2 className="view-title">{em.subject}</h2>
        </div>
        <div className="view-body">
          <div className="best-thread">
            <div className="msg best-msg">
              <div className="msg-avatar" style={{ background: color }}>{initials}</div>
              <div className="msg-main">
                <div className="msg-head">
                  <span className="msg-from">{em.from}</span>
                  <span className="msg-email">&lt;{em.fromEmail}&gt;</span>
                  <span className="msg-date">Example entry</span>
                </div>
                <div className="msg-to">To: judges@thecold.email</div>
                <div className="msg-body">{em.body}</div>
              </div>
            </div>
            <div className="msg best-msg best-reply">
              <div className="msg-avatar" style={{ background: '#5f6368' }}>R</div>
              <div className="msg-main">
                <div className="msg-head">
                  <span className="msg-from">Recipient</span>
                  <span className="msg-date best-reply-tag">✓ Real reply</span>
                </div>
                <div className="msg-body">{em.reply}</div>
              </div>
            </div>
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
              These are example cold emails — the best of thecold.email, proven by who actually replied. Akul will replace them with the real winning entries.
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
  const email = EMAILS.find(e => e.topic === topic)
  if (!email) return <div className="view-panel"><div className="view-body"><p>Track not found.</p></div></div>

  // Parse the body into sections
  // Body structure: TITLE\n\nGoal line\n\nHow it's won\n\nScoring\n\nPrize
  const lines = email.body.split('\n')
  const title = lines[0]
  const rest  = lines.slice(2).join('\n') // skip blank line after title

  // Split on "Scoring" header
  const scoringIdx = rest.indexOf('Scoring')
  const prizeIdx   = rest.lastIndexOf('Prize:')

  const goalBlock    = scoringIdx > -1 ? rest.slice(0, scoringIdx).trim() : rest
  const scoringBlock = scoringIdx > -1 ? rest.slice(scoringIdx, prizeIdx > -1 ? prizeIdx : undefined).trim() : ''
  const prizeBlock   = prizeIdx  > -1 ? rest.slice(prizeIdx).trim() : ''

  // Parse scoring bullets
  const scoringLines = scoringBlock.split('\n').filter(l => l.trim())
  const scoringTitle = scoringLines[0] || ''
  const scoringBullets = scoringLines.slice(1).filter(l => l.startsWith('•'))

  // Parse goal/how paragraphs
  const goalLines = goalBlock.split('\n').filter(l => l.trim())

  return (
    <div className="view-panel">
      <div className="view-header">
        <span className="view-header-icon">{TRACK_ICONS[topic]}</span>
        <h2 className="view-title">{TOPIC_NAMES[topic] || title}</h2>
        <span className="track-prize-badge">$500</span>
      </div>
      <div className="view-body">
        {/* Goal + How it's won */}
        {goalLines.map((line, i) => (
          <p key={i} className="track-para">{line}</p>
        ))}

        {/* Scoring rubric */}
        {scoringBullets.length > 0 && (
          <div className="track-rubric">
            <div className="track-rubric-title">{scoringTitle}</div>
            {scoringBullets.map((b, i) => {
              // Parse "• Label (pts)" style
              const match = b.match(/^•\s*(.+?)\s*\((\d+)\)$/)
              const label = match ? match[1] : b.replace(/^•\s*/, '')
              const pts   = match ? parseInt(match[2]) : null
              return (
                <div className="track-rubric-row" key={i}>
                  <span className="track-rubric-label">{label}</span>
                  {pts != null && (
                    <span className="track-rubric-bar-wrap">
                      <span className="track-rubric-bar" style={{ width: `${pts}%` }} />
                      <span className="track-rubric-pts">{pts} pts</span>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Prize line */}
        {prizeBlock && (
          <div className="track-prize-line">{prizeBlock.replace('Prize:', 'Prize:')}</div>
        )}

        {/* Grand prize note */}
        <div className="track-grand-note">
          Every entry is also automatically in the running for the <strong>★ Best Cold Email ($1,000 grand prize)</strong>.
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
      <p className="keep-lead">A cold email counts only if a real stranger genuinely wrote back.</p>
      <p className="keep-text">Every competition email must be sent during the event and BCC our official competition inbox for verification.</p>
      <ul className="rule-tags keep-tags">{R.chips.map(c => <li key={c}>{c}</li>)}</ul>
      <p className="keep-support">Break any of these and your entry is disqualified.</p>
    </>) },
    { id: 'counts', color: 'green', title: 'What counts?', render: () => (<>
      <p className="keep-text">Your entry qualifies only if all of the following are true.</p>
      <ul className="rule-check keep-list">{R.whatCounts.map(c => <li key={c}><I.M name="check_circle" size={18} /> {c}</li>)}</ul>
      <p className="keep-support">A reply can be short. A reply can be negative. A reply can simply be “No.” What matters is that a real person responded.</p>
    </>) },
    { id: 'doesnt', color: 'coral', title: 'What doesn’t count?', render: () => (<>
      <p className="keep-text">Not every response qualifies. These do not count as valid replies.</p>
      <ul className="rule-x keep-list">{R.doesntCount.map(c => <li key={c}><I.M name="cancel" size={18} /> {c}</li>)}</ul>
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
      <ul className="rule-check keep-list">{R.allowed.map(a => <li key={a}><I.M name="check_circle" size={18} /> {a}</li>)}</ul>
      <div className="keep-mini-head keep-no">Not allowed</div>
      <ul className="rule-x keep-list">{R.notAllowed.map(a => <li key={a}><I.M name="cancel" size={18} /> {a}</li>)}</ul>
      <p className="keep-support">The competition judges outcomes, not workflows. The only thing that matters is that the outreach is genuine, honest, and earns a real reply.</p>
    </>) },
    { id: 'proof', color: 'orange', title: 'Proof', render: () => (<>
      <p className="keep-text">To submit an entry you’ll need evidence.</p>
      <ul className="keep-proof">{R.proof.map(p => <li key={p.label}><I.M name={p.icon} size={18} /> {p.label}</li>)}</ul>
      <p className="keep-support">Judges may request additional verification if needed. Failure to provide proof may result in disqualification.</p>
    </>) },
    { id: 'fairplay', color: 'purple', title: 'Fair play', render: () => (<>
      <p className="keep-text">The goal is to earn trust from a stranger — not leverage an existing relationship.</p>
      <div className="keep-mini-head">Recipients cannot be</div>
      <ul className="rule-tags keep-tags">{R.fairPlayNot.map(f => <li key={f}>{f}</li>)}</ul>
      <p className="keep-support">If the recipient would reasonably recognize you, they are not a stranger.</p>
    </>) },
    { id: 'privacy', color: 'gray', title: 'Privacy', render: () => (<>
      <p className="keep-text">We understand that cold emails often contain sensitive information. Participants may blur:</p>
      <ul className="rule-tags keep-tags">{R.privacyBlur.map(p => <li key={p}>{p}</li>)}</ul>
      <p className="keep-support">Judges may request original versions privately for verification. Any verification materials will be handled confidentially.</p>
    </>) },
    { id: 'spirit', color: 'dark', title: 'Win by writing.', render: () => (<>
      <p className="keep-text">The rules cannot cover every loophole. If an entry technically follows the rules but clearly violates the spirit of fair competition, organizers may disqualify it. The purpose of this competition is simple: earn a genuine response from a genuine stranger.</p>
      <p className="keep-quote">“Write a remarkable cold email. Don’t game the system.”</p>
    </>) },
    { id: 'final', color: 'pink', title: 'Write something worth replying to.', render: () => (<>
      <p className="keep-text">Not the funniest. Not the longest. Not the craziest.</p>
      <p className="keep-text">Just the kind of email that makes a stranger stop what they’re doing and hit Reply.</p>
    </>) },
  ]

  const [order, setOrder] = useState(NOTES.map(n => n.id))
  const [expanded, setExpanded] = useState(null)   // note id or null
  const dragId = useRef(null)

  const onDrop = (targetId) => {
    const from = dragId.current
    if (!from || from === targetId) return
    setOrder(prev => {
      const next = prev.filter(id => id !== from)
      next.splice(next.indexOf(targetId), 0, from)
      return next
    })
    dragId.current = null
  }

  const byId = id => NOTES.find(n => n.id === id)
  const expandedNote = expanded ? byId(expanded) : null

  return (
    <div className="view-panel view-panel-keep">
      {/* Keep "Take a note…" composer — opens the entry modal */}
      <div className="keep-composer" onClick={onEnter}>
        <span className="keep-composer-ph">Take a note…</span>
        <div className="keep-composer-icons">
          <I.M name="check_box" size={20} />
          <I.M name="brush" size={20} />
          <I.M name="image" size={20} />
        </div>
      </div>

      {/* Masonry of notes — draggable to reorder, click to expand */}
      <div className="keep-board">
        {order.map(id => {
          const n = byId(id)
          return (
            <div
              key={n.id}
              className={`keep-note keep-c-${n.color}`}
              draggable
              onDragStart={e => { dragId.current = n.id; e.currentTarget.classList.add('keep-dragging') }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(n.id)}
              onDragEnd={e => { dragId.current = null; e.currentTarget.classList.remove('keep-dragging') }}
              onClick={() => setExpanded(n.id)}
            >
              <span className="keep-note-select" onClick={e => e.stopPropagation()} title="Select note"><I.M name="check_circle" size={24} /></span>
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

// ---------------- VIEW: PRIZES ----------------
function ViewPrizes() {
  const rows = [
    { label: '★ The Best Cold Email', note: 'grand prize', amount: '$1,000', grand: true },
    { label: 'The Unreachable',       note: 'Track 1',     amount: '$500' },
    { label: 'Best Subject Line',     note: 'Track 2',     amount: '$500' },
    { label: 'The Two-Liner',         note: 'Track 3',     amount: '$500' },
    { label: 'The Ask',               note: 'Track 4',     amount: '$500' },
  ]
  return (
    <div className="view-panel">
      <div className="view-header">
        <h2 className="view-title">$3,000 in prizes</h2>
      </div>
      <div className="view-body">
        <div className="lp-rows">
          {rows.map((r, i) => (
            <div key={i} className={`lp-row${r.grand ? ' lp-row-grand' : ''}`}>
              <span>{r.label} <em>{r.note}</em></span>
              <span className="amt">{r.amount}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: '#5f6368', lineHeight: 1.6 }}>
          A cash prize for each track, plus a bigger grand prize for the best cold email overall.
          Every entry — regardless of track — is automatically in the running for the grand prize.
        </p>
      </div>
    </div>
  )
}

// ---------------- VIEW: JUDGING ----------------
function ViewJudging() {
  return (
    <div className="view-panel">
      <div className="view-header">
        <h2 className="view-title">Judging</h2>
      </div>
      <div className="view-body">
        <div className="judging-step">
          <div className="judging-step-num">1</div>
          <div className="judging-step-body">
            <div className="judging-step-title">The Gate <span className="judging-badge judging-passfail">Pass / Fail</span></div>
            <p className="judging-step-desc">Every entry must clear this before it's scored:</p>
            <ul className="judging-list">
              <li>A real reply from a real stranger</li>
              <li>No impersonation</li>
              <li>No lying</li>
              <li>No pre-existing relationship</li>
              <li>No mass-blasting</li>
            </ul>
            <p className="judging-step-fine">Fail any → disqualified.</p>
          </div>
        </div>
        <div className="judging-step">
          <div className="judging-step-num">2</div>
          <div className="judging-step-body">
            <div className="judging-step-title">Scoring <span className="judging-badge judging-score">out of 100</span></div>
            <p className="judging-step-desc">
              A panel of organizers + guest judges scores each qualifying entry on a rubric weighted per track.
              Highest score per track wins that track. The strongest entry overall takes <strong>The Best Cold Email</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ================================================================
// MAIN PANEL — renders the active view
// ================================================================
function MainPanel({ view, onEnter, goto }) {
  switch (view) {
    case 'overview':          return <ViewOverview onEnter={onEnter} goto={goto} />
    case 'winners':           return <ViewWinners />
    case 'spam':              return <ViewSpam />
    case 'enter':             return <ViewEnter onEnter={onEnter} />
    case 'calendar':          return <ViewCalendar />
    case 'best':              return <ViewBest />
    case 'track-unreachable': return <ViewTrack topic="unreachable" />
    case 'track-subject':     return <ViewTrack topic="subject" />
    case 'track-twoliner':    return <ViewTrack topic="twoliner" />
    case 'track-ask':         return <ViewTrack topic="ask" />
    case 'rule':              return <ViewRule onEnter={onEnter} />
    case 'prizes':            return <ViewPrizes />
    case 'judging':           return <ViewJudging />
    default:                  return <ViewOverview onEnter={onEnter} goto={goto} />
  }
}

// ---------------- APP ----------------
export default function App() {
  const [view, setView] = useState('overview')
  const [composeOpen, setComposeOpen] = useState(false)
  const [jeminiOpen, setJeminiOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [toast, setToast] = useState('')
  const toastTimer = useRef()

  const showToast = (m) => {
    setToast(m)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }

  const submitEntry = ({ email, files }) => {
    if (!email) { showToast('Add your email first.'); return }
    if (!files || !files.length) { showToast('Attach a screenshot of the reply (paperclip).'); return }
    setComposeOpen(false)
    showToast('Entry submitted. Good luck — go get the reply.')
  }

  const goHome = () => setView('overview')

  return (
    <div onClick={() => jeminiOpen && setJeminiOpen(false)}>
      <TopBar
        onMenu={() => setSidebarOpen(s => !s)}
        onLogo={goHome}
        onJemini={() => setJeminiOpen(o => !o)}
      />
      <div className="app">
        <Sidebar
          onCompose={() => setComposeOpen(true)}
          view={view}
          setView={setView}
          open={sidebarOpen}
        />
        <div className="main">
          <MainPanel view={view} onEnter={() => setComposeOpen(true)} goto={setView} />
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
