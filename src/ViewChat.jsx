import './chat.css'
import { M } from './icons'

// Faithful 1:1 clone of a Google Chat 1:1 DM view (matches the reference screenshot):
// centered profile intro, "history on" notice, Today divider, left/right message
// bubbles, smart-reply chips, and the Google Chat composer bar.
export default function ViewChat() {
  return (
    <div className="view-panel gchat-dm">
      {/* ---- conversation header ---- */}
      <div className="gchat-hd">
        <div className="gchat-hd-l">
          <button className="gchat-ic" title="Back"><M name="arrow_back" size={20} /></button>
          <span className="gchat-hd-av">MQ</span>
          <button className="gchat-hd-name">Mara Quinn <M name="expand_more" size={20} /></button>
          <button className="gchat-ic" title="Search"><M name="search" size={20} /></button>
          <button className="gchat-ic" title="Open in new window"><M name="open_in_new" size={20} /></button>
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
          <span className="gchat-intro-av">MQ</span>
          <div className="gchat-intro-name">Mara Quinn</div>
          <div className="gchat-intro-email">mara@thecold.email</div>
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
          <span className="gchat-row-av">MQ</span>
          <div className="gchat-row-body">
            <div className="gchat-meta"><b>Mara Quinn</b> Now</div>
            <div className="gchat-bubble gchat-bubble-in">Welcome to thecold.email 👋</div>
            <div className="gchat-bubble gchat-bubble-in">It's a competition to find the best cold emails on the planet — proven by who actually replied. The whole tagline: <b>Get the reply.</b></div>
          </div>
        </div>

        {/* incoming — how it works */}
        <div className="gchat-row gchat-row-in">
          <span className="gchat-row-av">MQ</span>
          <div className="gchat-row-body">
            <div className="gchat-meta"><b>Mara Quinn</b> Now</div>
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
          <span className="gchat-row-av">MQ</span>
          <div className="gchat-row-body">
            <div className="gchat-meta"><b>Mara Quinn</b> Now</div>
            <div className="gchat-bubble gchat-bubble-in">Procedure is just: Register → Send cold emails → Submit the ones that reply.</div>
            <div className="gchat-bubble gchat-bubble-in">Register Jun 24–30 (closes Jul 6). Submissions Jul 1–7 — get your reply in by Jul 7.</div>
          </div>
        </div>

        {/* incoming — tracks + prizes */}
        <div className="gchat-row gchat-row-in">
          <span className="gchat-row-av">MQ</span>
          <div className="gchat-row-body">
            <div className="gchat-meta"><b>Mara Quinn</b> Now</div>
            <div className="gchat-bubble gchat-bubble-in">Four tracks: The Unreachable, Best Subject Line, The Two-Liner, and The Ask. Pick one and go.</div>
            <div className="gchat-bubble gchat-bubble-in">Prizes: $500 per track winner, plus a $1,000 grand prize for the best cold email overall. Every qualifying entry is in the running.</div>
          </div>
        </div>

        {/* smart-reply chips */}
        <div className="gchat-chips">
          <button className="gchat-chip">How do I register?</button>
          <button className="gchat-chip">Show me the tracks</button>
          <button className="gchat-chip">Got it!</button>
        </div>
      </div>

      {/* ---- composer ---- */}
      <div className="gchat-composer">
        <button className="gchat-plus"><M name="add" size={22} /></button>
        <div className="gchat-input">
          <span className="gchat-input-ph">History is on</span>
          <div className="gchat-input-tools">
            <button className="gchat-tool gchat-tool-a">A</button>
            <button className="gchat-tool"><M name="mood" size={20} /></button>
            <button className="gchat-tool"><M name="gif_box" size={20} /></button>
            <button className="gchat-tool"><M name="upload" size={20} /></button>
            <button className="gchat-tool"><M name="mic" size={20} /></button>
          </div>
        </div>
        <button className="gchat-send-caret"><M name="expand_more" size={18} /></button>
        <button className="gchat-send" disabled><M name="send" size={18} /></button>
      </div>
    </div>
  )
}
