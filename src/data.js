// thecold.email — the event, presented as an inbox.
// Content sourced from event-structure.md / event-brief.md / summary.md.
const HOST = 'thecold.email'
const HOST_EMAIL = 'team@thecold.email'
const YOU = 'you'

export const EMAILS = [
  {
    id: 0, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: 'Enter the competition →', tag: 'Enter', stars: 2026, views: 9120, starred: true, read: false,
    date: 'Jun 24', isEntryCta: true,
    preview: 'Click to submit your entry — pick a track, paste the reply you got, and you’re in.',
    body: '', replies: [],
  },
  {
    id: 1, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: 'Get the reply.', tag: 'Start here', stars: 999, views: 4821, starred: true, read: false,
    date: 'Jun 24',
    preview: 'A cold email competition to find the best cold emails on the planet — proven by who actually replied.',
    body: `Welcome to thecold.email.

A cold email competition to find the best cold emails on the planet — proven by who actually replied.

This isn't about clever copy in a vacuum. It's about results. The only thing that counts is a real stranger writing back.

One email can change a life. Let's go get the reply.

— thecold.email`,
    replies: [],
  },
  {
    id: 2, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: 'rule',
    subject: 'The one rule: real replies only', tag: 'Read this', stars: 870, views: 3960, starred: true, read: false,
    date: 'Jun 24',
    preview: 'A cold email counts only if a real stranger actually wrote back. Break any rule below and you are disqualified.',
    body: `THE ONE RULE — real replies only.

A cold email counts only if a real stranger actually wrote back.

You are DISQUALIFIED for any of:
• Impersonation
• Lying
• A pre-existing relationship with the recipient
• Mass-blasting

That's it. Un-fakeable proof is the whole point.

(How we verify, for now: a screenshot of the reply — "verified by us." Raw-email / header proof is parked for later.)`,
    replies: [],
  },
  {
    id: 3, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: '★ The Best Cold Email — the grand prize', tag: 'Grand prize', stars: 1240, views: 5102, starred: true, read: false,
    date: 'Jun 24',
    preview: 'The single best cold email of the entire event. Every entry, in any track, is in the running for it.',
    body: `★ THE BEST COLD EMAIL — the grand prize.

The single best cold email of the entire event.

Every entry — no matter which track it's in — is automatically in the running for this. The four tracks are the specialized categories; this is the overall crown.

The panel's grand pick: the email that best combines a hard-won reply, a real result, and craft.

Prize: $1,000.`,
    replies: [],
  },
  {
    id: 4, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: 'unreachable',
    subject: 'Track 1 — The Unreachable', tag: 'Track', stars: 612, views: 2840, starred: false, read: false,
    date: 'Jun 24',
    preview: 'A reply from someone who almost never replies (Elon, Obama, Paul Graham). Hardest target wins.',
    body: `TRACK 1 — THE UNREACHABLE

The goal: a reply from someone who almost never replies — think Elon, Obama, Paul Graham.

How it's won: the hardest target to reach wins.

Scoring (out of 100):
• Difficulty of the target — how unreachable they are (50)
• Depth of the reply — real engagement, not a brush-off (30)
• Craft of the email (20)

Prize: $500.`,
    replies: [],
  },
  {
    id: 5, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: 'subject',
    subject: 'Track 2 — Best Subject Line', tag: 'Track', stars: 548, views: 2510, starred: false, read: false,
    date: 'Jun 24',
    preview: 'A reply earned by the subject line. Strongest subject line wins — and it has to be honest.',
    body: `TRACK 2 — BEST SUBJECT LINE

The goal: a reply earned by the subject line.

How it's won: the strongest subject-line craft (the reply proves the open).

Scoring (out of 100):
• Subject-line hook & craft (60)
• That it earned a genuine reply (25)
• Honesty — no clickbait lie (15)

Prize: $500.`,
    replies: [],
  },
  {
    id: 6, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: 'twoliner',
    subject: 'Track 3 — The Two-Liner', tag: 'Track', stars: 503, views: 2330, starred: false, read: false,
    date: 'Jun 24',
    preview: 'A reply from an email of two sentences or less. The most result from the fewest words.',
    body: `TRACK 3 — THE TWO-LINER

The goal: a reply from an email of two sentences or less.

How it's won: the most result from the fewest words.

Scoring (out of 100):
• Result earned vs. how few words used (50)
• Craft & clarity (30)
• Brevity — one sentence beats two (20)

Prize: $500.`,
    replies: [],
  },
  {
    id: 7, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: 'ask',
    subject: 'Track 4 — The Ask', tag: 'Track', stars: 690, views: 3140, starred: false, read: false,
    date: 'Jun 24',
    preview: 'A major "yes" from a stranger — a job, an intro, money, a favor. Biggest yes wins.',
    body: `TRACK 4 — THE ASK

The goal: a major "yes" from a stranger — a job, an intro, money, a favor.

How it's won: the biggest yes wins.

Scoring (out of 100):
• Size of the "yes" — how big, valuable, or unlikely (60)
• Proof the yes was real (20)
• Craft of the email (20)

Prize: $500.`,
    replies: [],
  },
  {
    id: 8, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: 'How to enter', tag: 'How to enter', stars: 410, views: 1980, starred: false, read: false,
    date: 'Jun 24',
    preview: 'Submit the form with a screenshot of the reply before the July 7 deadline. That’s it.',
    body: `HOW TO ENTER

1. Send your cold email (real stranger, real ask).
2. Get a real reply.
3. Submit the form with a screenshot of that reply — before the July 7 deadline.

That's it. Verified by us.

Pick the track that fits your win; every entry is also automatically in the running for The Best Cold Email.`,
    replies: [],
  },
  {
    id: 9, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: 'Key dates — the timeline', tag: 'Timeline', stars: 388, views: 1760, starred: false, read: false,
    date: 'Jun 24',
    preview: 'Launch Jun 24 → registrations close Jun 30 → submit by Jul 7 → winners Jul 10.',
    body: `THE TIMELINE

• Jun 24 — Launch. Registrations open.
• Jun 30 — Registrations close.
• Jun 24 → Jul 7 — Send window. Send your cold emails.
• Jul 7 — Submission deadline (form + screenshot of the reply).
• Jul 10 — Winners announced.

One event. One shot. Get the reply.`,
    replies: [],
  },
  {
    id: 10, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: 'The prize pool — $3,000', tag: 'Prizes', stars: 1510, views: 6240, starred: true, read: false,
    date: 'Jun 24',
    preview: '$3,000 total. $1,000 grand prize + $500 for each of the four tracks.',
    body: `THE PRIZE POOL — $3,000 total.

★ The Best Cold Email (grand prize) ...... $1,000
1. The Unreachable ....................... $500
2. Best Subject Line ..................... $500
3. The Two-Liner ......................... $500
4. The Ask ............................... $500

A cash prize for each track, plus a bigger grand prize for the best cold email overall.`,
    replies: [],
  },
  {
    id: 11, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: 'How judging works', tag: 'Judging', stars: 297, views: 1430, starred: false, read: false,
    date: 'Jun 24',
    preview: 'Step 1 — the Gate (pass/fail). Step 2 — a 100-point rubric per track, scored by the panel.',
    body: `HOW JUDGING WORKS

Step 1 — THE GATE (pass/fail). Every entry must clear this before it's scored:
• A real reply from a real stranger
• No impersonation, no lying, no pre-existing relationship, no mass-blasting
Fail any → disqualified.

Step 2 — SCORING (out of 100). A panel of organizers + guest judges scores each qualifying entry. Criteria are weighted per track (see each track's email).

Highest score per track wins that track. The strongest entry overall takes The Best Cold Email.`,
    replies: [],
  },
  {
    id: 12, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'promotions', topic: '',
    subject: 'Watch the launch video', tag: 'Launch', stars: 0, views: 0, starred: false, read: false,
    date: 'Jun 24',
    preview: 'It starts with one video. Share it, then go send the email you’ve been putting off.',
    body: `It starts with one video.

The whole thing kicks off Jun 24. Watch it, share it, then go send the cold email you've been putting off.

Get the reply. → thecold.email`,
    replies: [],
  },
]

// Profile-pic meme pool — a random one shows in the avatar ring each refresh.
// Click the avatar → Gmail-style contact card: joke email + "Hi, [hi]!" + a usable cold-email takeaway.
// Images live in public/memes/ (from PFP_IMGS.zip). Emails are deliberately fake/punny, not real.
export const MEMES = [
  { name: 'Elon Musk',        hi: 'Elon',    email: 'dogefather@x.com',           img: '/memes/IMG-20260619-WA0024.jpg', tip: 'Send at 3am and tweet through it — the unhinged-but-bold email gets the reply the polished one never will.' },
  { name: 'Jeff Bezos',       hi: 'Jeff',    email: '1click@amazon.com',          img: '/memes/IMG-20260619-WA0023.jpg', tip: 'Make replying a one-click decision. Every extra step you ask for is another reason they bounce.' },
  { name: 'Barack Obama',     hi: 'Barack',  email: 'yeswecan@whitehouse.gov',    img: '/memes/IMG-20260619-WA0012.jpg', tip: 'Write to one person, not a rally. "You" wins more votes than "everyone."' },
  { name: 'Donald Trump',     hi: 'Donald',  email: 'covfefe@truth.social',       img: '/memes/IMG-20260619-WA0020.jpg', tip: 'Your subject line is the whole campaign — tremendous open rates, the best, or nothing happens. Believe me.' },
  { name: 'Kanye West',       hi: 'Ye',      email: 'immaletyoufinish@yeezy.com', img: '/memes/Kanye.jpeg',              tip: "Interrupt the inbox like it's the VMAs. Confidence opens what politeness leaves on read." },
  { name: 'Drake',            hi: 'Drake',   email: 'started@thebottom.com',      img: '/memes/IMG-20260619-WA0015.jpg', tip: 'Started from "no reply," now we here. The follow-up is where the deal actually lives.' },
  { name: 'Justin Bieber',    hi: 'Justin',  email: 'sorry@beliebers.com',        img: '/memes/IMG-20260619-WA0008.jpg', tip: 'Is it too late now to say sorry? Never — a good follow-up beats a perfect first email every time.' },
  { name: 'Sabrina Carpenter',hi: 'Sabrina', email: 'espresso@sabrina.com',       img: '/memes/IMG-20260619-WA0018.jpg', tip: 'Be the email that keeps them up like espresso. Memorable beats polished.' },
  { name: 'Max Verstappen',   hi: 'Max',     email: 'boxbox@redbull.com',         img: '/memes/IMG-20260619-WA0011.jpg', tip: 'Lights out and away you go. Speed wins — the faster you send, the more shots on goal.' },
  { name: 'Charlie Kirk',     hi: 'Charlie', email: 'provemewrong@tpusa.com',     img: '/memes/IMG-20260619-WA0019.jpg', tip: "Set up a table they can't walk past. A sharp question is harder to ignore than a statement." },
  { name: 'Mark Zuckerberg',  hi: 'Mark',    email: 'definitelyhuman@meta.com',   img: '/memes/IMG-20260619-WA0022.jpg', tip: "Don't email like an avatar in an empty metaverse. One human detail beats a thousand merge tags." },
  { name: 'Anthony Mackie',   hi: 'Anthony', email: 'onyourleft@marvel.com',      img: '/memes/IMG-20260619-WA0014.jpg', tip: 'Show up on their left when they least expect it, and ask like you already caught the shield.' },
  { name: 'Brooklyn 99',      hi: 'Jake',    email: 'coolcoolcool@nine9.com',     img: '/memes/IMG-20260619-WA0009.jpg', tip: 'Cool cool cool, no doubt no doubt — keep it short. Ten-second reads are the ones that get read.' },
  { name: 'Phil Dunphy',      hi: 'Phil',    email: 'philosophy@dunphy.com',      img: '/memes/IMG-20260619-WA0013.jpg', tip: "WTF — Why The Face? Be the warm one. People reply to the guy they'd grab a coffee with." },
  { name: 'The Kiss-Cam Couple', hi: 'you two', email: 'wrongperson@coldplay.com', img: '/memes/IMG-20260619-WA0016.jpg', tip: 'Check the "To" field twice. The wrong recipient turns a cold email into a viral one.' },
  { name: 'Caught Mid-Sentence', hi: 'there', email: 'waitwhat@oops.com',         img: '/memes/IMG-20260619-WA0010.jpg', tip: 'Open mid-thought and they lean in. A weird first line beats "Dear Sir or Madam."' },
  { name: 'Corporate Era',    hi: 'champ',   email: 'circleback@synergy.com',     img: '/memes/IMG-20260619-WA0021.jpg', tip: "Let's circle back — but actually. Respect their calendar: get to the ask before sentence two." },
]

export const TOPIC_NAMES = {
  rule: 'The Rule',
  unreachable: 'The Unreachable',
  subject: 'Best Subject Line',
  twoliner: 'The Two-Liner',
  ask: 'The Ask',
}

// Calendar deadlines — single source of truth for the CalendarDeadlines component
export const DEADLINES = [
  { date: '2026-06-24', label: 'Launch · reg opens', color: 'blue' },
  { date: '2026-06-30', label: 'Reg closes', color: 'amber' },
  { date: '2026-07-07', label: 'Submit deadline', color: 'red' },
  { date: '2026-07-10', label: 'Winners', color: 'green' },
]

// Send window rendered as a faint band on the calendar
export const SEND_WINDOW = { start: '2026-06-24', end: '2026-07-07' }

// -------------------------------------------------------
// EVENTS — single source of truth for the week-view calendar
// date: 'YYYY-MM-DD'  |  allDay: true → all-day row
// start/end: 'HH:MM' 24-h (only for timed events)
// color: key into GCal palette
// -------------------------------------------------------
export const EVENTS = [
  // ---- All-day / banner events ----
  { date: '2026-06-24', title: 'Launch · registrations open', color: 'blue',  allDay: true },
  { date: '2026-06-30', title: 'Registrations close',          color: 'amber', allDay: true },
  { date: '2026-07-07', title: 'Submissions close',            color: 'red',   allDay: true },
  { date: '2026-07-10', title: 'Winners announced',            color: 'green', allDay: true },

  // ---- Timed — launch week ----
  { date: '2026-06-24', start: '09:00', end: '09:30', title: 'Launch video drops',            color: 'red' },
  { date: '2026-06-24', start: '10:00', end: '11:00', title: 'Registrations open',            color: 'blue' },
  { date: '2026-06-24', start: '14:00', end: '15:00', title: 'Send your first cold email',    color: 'amber' },
  { date: '2026-06-25', start: '11:00', end: '12:00', title: 'Subject-line teardown (live)',  color: 'purple' },
  { date: '2026-06-26', start: '13:00', end: '14:00', title: 'Office hours w/ the judges',   color: 'green' },
  { date: '2026-06-27', start: '10:00', end: '10:30', title: 'Follow up: nudge non-repliers', color: 'teal' },

  // ---- Timed — deadline week ----
  { date: '2026-06-30', start: '17:00', end: '17:30', title: 'Registrations close',  color: 'amber' },
  { date: '2026-07-01', start: '12:00', end: '13:00', title: 'Mid-event Q&A',        color: 'purple' },
  { date: '2026-07-03', start: '10:00', end: '11:00', title: 'Send your boldest ask', color: 'amber' },

  // ---- Timed — final week ----
  { date: '2026-07-08', start: '11:00', end: '12:00', title: 'Judging begins',               color: 'green' },
  { date: '2026-07-10', start: '17:00', end: '18:00', title: 'Winners announced (live)',      color: 'green' },
]

// Best Email Ever — PLACEHOLDER examples (Akul will replace with real entries)
export const BEST_EMAILS = [
  {
    from: 'Alex Chen',
    fromEmail: 'alex@example.com',
    stars: 612, views: 2840, tag: 'The Unreachable', date: 'Jul 7, 2026',
    subject: '[PLACEHOLDER] Re: Quick question about your research',
    body: `Hi Professor Williams,

I read your 2019 paper on attention mechanisms and noticed a gap in the ablation study — specifically around positional encoding at longer context lengths.

I've run some experiments that might fill that gap. Would you be open to a 15-minute call?

— Alex`,
    reply: `Alex,

Good catch. I've been meaning to revisit that section. Yes, let's talk — does Thursday at 2pm ET work?

— Prof. Williams`,
  },
  {
    from: 'Jordan Rivera',
    fromEmail: 'jordan@example.com',
    stars: 548, views: 2510, tag: 'The Ask', date: 'Jul 6, 2026',
    subject: '[PLACEHOLDER] Re: The talk you gave at SaaStr',
    body: `Hi Sarah,

Your SaaStr talk on pricing strategy changed how I think about freemium. I'm the founder of a B2B tool with 4,000 free users and 12 paying — your 1% rule made me realize I've been optimizing the wrong thing.

I redesigned our onboarding based on your framework. Would love to share what happened (it's interesting). Worth a coffee?

Jordan`,
    reply: `Jordan — I love this. Yes, send me what you found. And yes to coffee, I'm in SF next month.

Sarah`,
  },
  {
    from: 'Morgan Liu',
    fromEmail: 'morgan@example.com',
    stars: 503, tag: 'The Two-Liner', date: 'Jul 5, 2026',
    subject: '[PLACEHOLDER] Two sentences',
    body: `Hi Marcus,

I built a thing that cuts your video export time by ~60% — tested on your public YouTube exports. Want me to send it over?`,
    reply: `Yes. Send it.

M`,
  },
]
