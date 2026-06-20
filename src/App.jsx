import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { EMAILS, TOPIC_NAMES, DEADLINES, SEND_WINDOW, BEST_EMAILS, EVENTS, MEMES, RULES_PAGE, TRACK_PAGES, TRACK_REMEMBER, ENTER_FORM } from './data.js'
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
      <NavItem icon={<I.M name="star" />}          label="The Procedure"                      active={view === 'enter'}    onClick={() => setView('enter')} />
      <NavItem icon={<I.M name="calendar_month" />} label="Event Calendar"                    active={view === 'calendar'} onClick={() => setView('calendar')} />
      <NavItem icon={<I.M name="auto_awesome" />}  label="Best Emails"                    active={view === 'best'}     onClick={() => setView('best')} />

      <div className={`section-head section-head-btn${view === 'tracks-home' ? ' active' : ''}`} onClick={() => setView('tracks-home')}><I.CaretDown /> TRACKS</div>
      <NavItem icon={<I.Plane size={20} />}  label="The Unreachable"    active={view === 'track-unreachable'} onClick={() => setView('track-unreachable')} />
      <NavItem icon={<I.SparkPen size={20} />} label="Best Subject Line"  active={view === 'track-subject'}     onClick={() => setView('track-subject')} />
      <NavItem icon={<I.M name="short_text" />} label="The Two-Liner"      active={view === 'track-twoliner'}    onClick={() => setView('track-twoliner')} />
      <NavItem icon={<I.M name="help" />} label="The Ask"            active={view === 'track-ask'}         onClick={() => setView('track-ask')} />

      <div className="section-head"><I.CaretDown /> THE EVENT</div>
      <NavItem icon={<I.M name="rule" />}        label="The Rule"   active={view === 'rule'}    onClick={() => setView('rule')} />
      <NavItem icon={<I.M name="emoji_events" />} label="Prizes"     active={view === 'prizes'}  onClick={() => setView('prizes')} />
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
          <p className="walhero-sub">Win up to <strong>$3,000</strong> for one great cold email — proven by who actually replied.</p>
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
          <p className="walhero-sub">Win up to <strong>$3,000</strong> for one great cold email — proven by who actually replied.</p>
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

function ViewOverview({ onEnter, goto }) {
  return (
    <div className="view-panel">
      <div className="home">

        {/* 1 — HERO (wallet.google-style pinned scroll sequence) */}
        <WalletHero onEnter={onEnter} goto={goto} />

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
// Google Forms icon (purple)
const FORMS_ICON = (
  <svg width="22" height="28" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M29 0H6C2.69 0 0 2.69 0 6v52c0 3.31 2.69 6 6 6h36c3.31 0 6-2.69 6-6V19L29 0z" fill="#7248B9"/>
    <path d="M29 0v13c0 3.31 2.69 6 6 6h13L29 0z" fill="#C5A1EA"/>
    <path d="M22.4 32.3h12.8v3H22.4v-3zm0 6.4h12.8v3H22.4v-3zm0 6.4h12.8v3H22.4v-3z" fill="#fff"/>
    <circle cx="16" cy="33.8" r="1.8" fill="#fff"/><circle cx="16" cy="40.2" r="1.8" fill="#fff"/><circle cx="16" cy="46.6" r="1.8" fill="#fff"/>
  </svg>
)

// Shared "how to enter" steps — reused by all three variants
const ENTER_STEPS = [
  { n: 1, icon: 'how_to_reg',       title: 'Register',                 text: 'Fill the form below. We save your details and email you a confirmation.' },
  { n: 2, icon: 'send',             title: 'Send one real cold email', text: 'Pick a track. Write to a real stranger. No templates, no spray.' },
  { n: 3, icon: 'mark_email_read',  title: 'Get a reply & submit',     text: 'When they reply, attach a screenshot/PDF of the thread and submit your entry.' },
]

function ViewEnter({ onEnter }) {
  const [variant, setVariant] = useState('sites')   // sites | slides | classroom
  const [slide, setSlide] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const renderInput = (qq) => {
    switch (qq.type) {
      case 'email':     return <input type="email" className="enter-input" placeholder="Your answer" />
      case 'url':       return <input type="url"   className="enter-input" placeholder="https://" />
      case 'paragraph': return <textarea className="enter-textarea" rows={3} placeholder="Your answer" />
      case 'dropdown':  return (
        <select className="enter-select" defaultValue="">
          <option value="" disabled>Choose</option>
          {qq.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
      case 'radio':     return (
        <div className="enter-choices">
          {qq.options.map(o => (
            <label className="enter-choice" key={o}><span className="enter-radio" /> {o}</label>
          ))}
        </div>
      )
      case 'checkbox':  return (
        <div className="enter-choices">
          {qq.options.map(o => (
            <label className="enter-choice" key={o}><span className="enter-checkbox" /> {o}</label>
          ))}
        </div>
      )
      default:          return <input type="text" className="enter-input" placeholder="Your answer" />
    }
  }

  const FieldList = () => (
    <div className="enter-fields">
      {ENTER_FORM.questions.map((qq, i) => (
        <label className="enter-field" key={i}>
          <span className="enter-field-q">{qq.q}{qq.required && <span className="enter-req"> *</span>}</span>
          {renderInput(qq)}
        </label>
      ))}
    </div>
  )

  const Done = ({ cls }) => (
    <div className={'enter-done ' + cls}>
      <I.M name="check_circle" size={40} />
      <h3>You’re registered.</h3>
      <p>We’ve emailed you a confirmation. Now go send one real cold email — then come back and submit the reply.</p>
      <span className="enter-link" onClick={() => setSubmitted(false)}>Register someone else</span>
    </div>
  )

  const switcher = (
    <div className="enter-switch">
      {[['sites', 'Sites'], ['slides', 'Slides'], ['classroom', 'Classroom']].map(([k, l]) => (
        <button key={k} className={'enter-switch-btn' + (variant === k ? ' on' : '')} onClick={() => setVariant(k)}>{l}</button>
      ))}
    </div>
  )

  // ---------------- VARIANT 1: GOOGLE SITES ----------------
  if (variant === 'sites') {
    return (
      <div className="view-panel enter-canvas gsite">
        {switcher}
        <div className="gsite-topbar">
          <span className="gsite-logo"><I.M name="public" size={20} /></span>
          <span className="gsite-name">thecold.email</span>
          <nav className="gsite-nav"><a className="on">How to Enter</a><a>Tracks</a><a>Prizes</a></nav>
          <button className="gsite-publish">Publish</button>
        </div>

        <header className="gsite-hero">
          <div className="gsite-hero-in">
            <p className="gsite-kicker">THE PROCEDURE</p>
            <h1 className="gsite-h1">How to Enter</h1>
            <p className="gsite-sub">{ENTER_FORM.desc}</p>
            <button className="gsite-cta" onClick={onEnter}>Enter the competition</button>
          </div>
        </header>

        <section className="gsite-sec">
          <h2 className="gsite-h2">Three steps</h2>
          <div className="gsite-steps">
            {ENTER_STEPS.map(s => (
              <div className="gsite-step" key={s.n}>
                <span className="gsite-step-ico"><I.M name={s.icon} size={28} /></span>
                <span className="gsite-step-n">Step {s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="gsite-sec gsite-form-sec">
          <h2 className="gsite-h2">Funnel 1 — Register</h2>
          {submitted ? <Done cls="enter-done-light" /> : (
            <>
              <FieldList />
              <button className="gsite-cta" onClick={() => setSubmitted(true)}>Submit registration</button>
            </>
          )}
        </section>

        <section className="gsite-sec gsite-f2">
          <h2 className="gsite-h2">Funnel 2 — Submit your entry</h2>
          <p className="gsite-lead">Once a real stranger replies, attach a screenshot or PDF of the full email thread, pick your track, and submit. Opens the submission compose.</p>
          <button className="gsite-cta gsite-cta-alt" onClick={onEnter}>Open submission</button>
        </section>

        <footer className="gsite-foot">thecold.email · Made with Sites</footer>
      </div>
    )
  }

  // ---------------- VARIANT 2: GOOGLE SLIDES ----------------
  if (variant === 'slides') {
    const SLIDES = [
      { kind: 'title' },
      ...ENTER_STEPS.map(s => ({ kind: 'step', s })),
      { kind: 'form' },
      { kind: 'f2' },
    ]
    const slideLabel = (sl) => sl.kind === 'title' ? 'How to Enter'
      : sl.kind === 'step' ? `Step ${sl.s.n}`
      : sl.kind === 'form' ? 'Register' : 'Submit'

    const renderSlide = (sl) => {
      if (sl.kind === 'title') return (
        <div className="gslide-title">
          <p className="gslide-kicker">THE PROCEDURE</p>
          <h1>How to Enter</h1>
          <p className="gslide-sub">{ENTER_FORM.desc}</p>
        </div>
      )
      if (sl.kind === 'step') return (
        <div className="gslide-step">
          <span className="gslide-step-ico"><I.M name={sl.s.icon} size={44} /></span>
          <p className="gslide-step-n">Step {sl.s.n}</p>
          <h1>{sl.s.title}</h1>
          <p className="gslide-sub">{sl.s.text}</p>
        </div>
      )
      if (sl.kind === 'form') return (
        <div className="gslide-form">
          <h1>Funnel 1 — Register</h1>
          {submitted ? <Done cls="enter-done-light" /> : (
            <>
              <FieldList />
              <button className="gsite-cta" onClick={() => setSubmitted(true)}>Submit registration</button>
            </>
          )}
        </div>
      )
      return (
        <div className="gslide-title">
          <p className="gslide-kicker">FUNNEL 2</p>
          <h1>Submit your entry</h1>
          <p className="gslide-sub">Got a real reply? Attach a screenshot/PDF of the thread, pick your track, submit.</p>
          <button className="gsite-cta gsite-cta-alt" onClick={onEnter}>Open submission</button>
        </div>
      )
    }

    return (
      <div className="view-panel enter-canvas gslide">
        {switcher}
        <div className="gslide-top">
          <span className="gslide-logo"><I.M name="slideshow" size={20} /></span>
          <span className="gslide-name">The Procedure</span>
          <span className="gslide-present"><I.M name="play_arrow" size={18} /> Present</span>
        </div>
        <div className="gslide-work">
          <div className="gslide-rail">
            {SLIDES.map((sl, i) => (
              <div className={'gslide-thumb' + (i === slide ? ' on' : '')} key={i} onClick={() => setSlide(i)}>
                <span className="gslide-thumb-n">{i + 1}</span>
                <div className="gslide-thumb-canvas"><span>{slideLabel(sl)}</span></div>
              </div>
            ))}
          </div>
          <div className="gslide-stage">
            <div className="gslide-deck">{renderSlide(SLIDES[slide])}</div>
            <div className="gslide-bar">
              <button onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0}><I.M name="chevron_left" size={22} /></button>
              <span>{slide + 1} / {SLIDES.length}</span>
              <button onClick={() => setSlide(Math.min(SLIDES.length - 1, slide + 1))} disabled={slide === SLIDES.length - 1}><I.M name="chevron_right" size={22} /></button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------------- VARIANT 3: GOOGLE CLASSROOM ----------------
  return (
    <div className="view-panel enter-canvas gclass">
      {switcher}
      <div className="gclass-banner">
        <div className="gclass-banner-in">
          <p className="gclass-section">thecold.email</p>
          <h1 className="gclass-title">The Procedure</h1>
          <p className="gclass-sub">How to enter · Funnel 1 → Funnel 2</p>
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

          <div className="gclass-card">
            <h3 className="gclass-h3">Funnel 1 — Registration</h3>
            {submitted ? <Done cls="enter-done-light" /> : (
              <>
                <FieldList />
                <button className="gclass-btn" onClick={() => setSubmitted(true)}>Hand in registration</button>
              </>
            )}
          </div>

          <div className="gclass-card gclass-attach">
            <h3 className="gclass-h3">Funnel 2 — Your submission</h3>
            <p>When a real stranger replies, attach a screenshot/PDF of the thread and submit your entry.</p>
            <button className="gclass-attach-btn" onClick={onEnter}><I.M name="attach_file" size={18} /> Open submission</button>
          </div>
        </main>
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

// "09:00" → "9:00 AM"
function fmt12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`
}
// Date/time line for the event popup
function eventWhen(ev) {
  const base = parseDate(ev.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  if (ev.allDay) {
    if (ev.dateEnd) return `${base} – ${parseDate(ev.dateEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
    return base
  }
  return `${base} · ${fmt12(ev.start)} – ${fmt12(ev.end)}`
}

function ViewCalendar() {
  const [monDate, setMonDate] = useState(weekStart(DEFAULT_WEEK))
  const [sel, setSel] = useState(null)  // selected event → detail popup

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
                  <div className="gcev-when">{eventWhen(sel.ev)}</div>
                </div>
              </div>
              <div className="gcev-row">
                <span className="gcev-row-ic"><I.M name="segment" size={20} /></span>
                <div className="gcev-row-text">
                  <div>{sel.ev.allDay ? 'All-day event' : 'thecold.email event'}</div>
                  <div className="gcev-row-sub">Get the reply — one cold email can change everything.</div>
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
  const data = TRACK_PAGES[topic]
  if (!data) return <div className="view-panel"><div className="view-body"><p>Track not found.</p></div></div>

  // All 4 tracks render as a faithful Google Docs document.
  return <ViewTrackDoc data={data} title={TOPIC_NAMES[topic]} />
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
          Scores are illustrative. Every qualifying entry is also considered for the ★ Best Cold Email ($1,000 grand prize).
        </div>

      </div>
    </div>
  )
}

// ---------------- VIEW: THE UNREACHABLE (Google Docs) ----------------
// Renders the unreachable track styled as a faithful Google Docs document.
function ViewTrackDoc({ data, title }) {
  const menus = ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Extensions', 'Help']
  return (
    <div className="view-panel gdoc-canvas">
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
        <div className="gdoc-page">
          <h1 className="gdoc-h1">{title}</h1>

          <h2 className="gdoc-h2">The Goal</h2>
          <p className="gdoc-p">{data.goal}</p>
          {data.goalExtra && <p className="gdoc-p">{data.goalExtra}</p>}

          <h2 className="gdoc-h2">How It's Won</h2>
          {data.howWon.map((l, i) => <p className="gdoc-p" key={i}>{l}</p>)}

          <h2 className="gdoc-h2">What This Track Rewards</h2>
          {data.rewards.map((l, i) => <p className="gdoc-p" key={i}>{l}</p>)}

          <h2 className="gdoc-h2">What Judges Look For</h2>
          <ul className="gdoc-list gdoc-list-check">
            {data.judges.map((l, i) => <li key={i}><span className="gdoc-mark gdoc-mark-yes">✓</span><span>{l}</span></li>)}
          </ul>

          <h2 className="gdoc-h2">Strong Entries</h2>
          <ul className="gdoc-list gdoc-list-dot">
            {data.strong.map((l, i) => <li key={i}><span className="gdoc-mark gdoc-mark-dot">•</span><span>{l}</span></li>)}
          </ul>

          <h2 className="gdoc-h2">Common Mistakes</h2>
          <ul className="gdoc-list gdoc-list-cross">
            {data.mistakes.map((l, i) => <li key={i}><span className="gdoc-mark gdoc-mark-no">✕</span><span>{l}</span></li>)}
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
          <p className="gdoc-p"><strong>$500</strong> for the winning entry. Every qualifying entry is also automatically considered for the ★ Best Cold Email ($1,000 grand prize).</p>

          {/* Remember callout */}
          <div className="gdoc-callout">
            <div className="gdoc-callout-title">Remember</div>
            <p className="gdoc-callout-lead">{TRACK_REMEMBER.lead}</p>
            <p className="gdoc-callout-bold">{TRACK_REMEMBER.bold}</p>
            <p className="gdoc-callout-body">{TRACK_REMEMBER.body}</p>
            <p className="gdoc-callout-tag">{TRACK_REMEMBER.tag}</p>
          </div>
        </div>
      </div>
    </div>
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
  const mini = (t, lg) => (
    <div className={`gdocs-mini${lg ? ' gdocs-mini-lg' : ''}`}>
      <div className="gdocs-mini-h1">{TOPIC_NAMES[t]}</div>
      <div className="gdocs-mini-sub">The Goal</div>
      <div className="gdocs-mini-line" /><div className="gdocs-mini-line" /><div className="gdocs-mini-line short" />
      {lg && <>
        <div className="gdocs-mini-sub">How It's Won</div>
        <div className="gdocs-mini-line" /><div className="gdocs-mini-line short" />
      </>}
    </div>
  )
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
      <p className="keep-lead">A cold email counts only if a real stranger genuinely wrote back.</p>
      <p className="keep-text">Every competition email must be sent during the event and BCC our official competition inbox for verification.</p>
      {checklist('rulechips', R.chips)}
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
      {group('fairplay', 'Recipients cannot be', R.fairPlayNot)}
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
    case 'tracks-home':       return <ViewTracksHome goto={goto} onEnter={onEnter} />
    case 'track-unreachable': return <ViewTrack topic="unreachable" />
    case 'track-subject':     return <ViewTrack topic="subject" />
    case 'track-twoliner':    return <ViewTrack topic="twoliner" />
    case 'track-ask':         return <ViewTrack topic="ask" />
    case 'rule':              return <ViewRule onEnter={onEnter} />
    case 'prizes':            return <ViewPrizes onEnter={onEnter} goto={goto} />
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
