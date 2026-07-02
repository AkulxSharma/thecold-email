// thecold.email — the event, presented as an inbox.
// Content sourced from event-structure.md / event-brief.md / summary.md.
const HOST = 'thecold.email'
const HOST_EMAIL = 'judges@thecold.email'
const YOU = 'you'

export const EMAILS = [
  {
    id: 0, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: 'Enter the competition →', tag: 'Enter', stars: 2026, views: 9120, starred: true, read: false,
    date: 'Jun 24', isEntryCta: true,
    preview: 'Click to submit your entry: pick a track, paste the reply you got, and you’re in.',
    body: '', replies: [],
  },
  {
    id: 1, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: 'Get the reply.', tag: 'Start here', stars: 999, views: 4821, starred: true, read: false,
    date: 'Jun 24',
    preview: 'A cold email competition to find the best cold emails on the planet, proven by who actually replied.',
    body: `Welcome to thecold.email.

A cold email competition to find the best cold emails on the planet, proven by who actually replied.

This isn't about clever copy in a vacuum. It's about results. The only thing that counts is someone who had every reason to ignore you writing back anyway: a founder, an investor, someone you look up to.

One email can change a life. Let's go get the reply.

thecold.email`,
    replies: [],
  },
  {
    id: 2, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: 'rule',
    subject: 'The one rule: real replies only', tag: 'Read this', stars: 870, views: 3960, starred: true, read: false,
    date: 'Jun 24',
    preview: 'A cold email counts only if someone who doesn’t already know you actually wrote back. Break any rule below and you are disqualified.',
    body: `THE ONE RULE: real replies only.

A cold email counts only if someone who doesn’t already know you actually wrote back.

You are DISQUALIFIED for any of:
• Impersonation
• Lying
• A pre-existing relationship with the recipient
• Mass-blasting

That's it. Un-fakeable proof is the whole point.

(How we verify, for now: a screenshot of the reply, "verified by us." Raw-email / header proof is parked for later.)`,
    replies: [],
  },
  {
    id: 3, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: '★ The Best Cold Email: the grand prize', tag: 'Grand prize', stars: 1240, views: 5102, starred: true, read: false,
    date: 'Jun 24',
    preview: 'The single best cold email of the entire event. Every entry, in any track, is in the running for it.',
    body: `★ THE BEST COLD EMAIL: the grand prize.

The single best cold email of the entire event.

Every entry, no matter which track it's in, is automatically in the running for this. The four tracks are the specialized categories; this is the overall crown.

The panel's grand pick: the email that best combines a hard-won reply, a real result, and craft.

Prize: $1,000.`,
    replies: [],
  },
  {
    id: 4, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: 'unreachable',
    subject: 'Track 1: The Unreachable', tag: 'Track', stars: 612, views: 2840, starred: false, read: false,
    date: 'Jun 24',
    preview: 'A reply from someone who almost never replies (Elon, Obama, Paul Graham). Hardest target wins.',
    body: `TRACK 1: THE UNREACHABLE

The goal: a reply from someone who almost never replies. Think Elon, Obama, Paul Graham.

How it's won: the hardest target to reach wins.

Scoring (out of 100):
• Difficulty of the target: how unreachable they are (50)
• Depth of the reply: real engagement, not a brush-off (30)
• Craft of the email (20)

Prize: $500.`,
    replies: [],
  },
  {
    id: 5, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: 'subject',
    subject: 'Track 2: Best Subject Line', tag: 'Track', stars: 548, views: 2510, starred: false, read: false,
    date: 'Jun 24',
    preview: 'A reply earned by the subject line. Strongest subject line wins, and it has to be honest.',
    body: `TRACK 2: BEST SUBJECT LINE

The goal: a reply earned by the subject line.

How it's won: the strongest subject-line craft (the reply proves the open).

Scoring (out of 100):
• Subject-line hook & craft (60)
• That it earned a genuine reply (25)
• Honesty: no clickbait lie (15)

Prize: $500.`,
    replies: [],
  },
  {
    id: 6, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: 'twoliner',
    subject: 'Track 3: The Two-Liner', tag: 'Track', stars: 503, views: 2330, starred: false, read: false,
    date: 'Jun 24',
    preview: 'A reply from an email of two sentences or less. The most impact from the fewest words.',
    body: `TRACK 3: THE TWO-LINER

The goal: a reply from an email of two sentences or less.

How it's won: the most impact from the fewest words.

Scoring (out of 100):
• Result earned vs. how few words used (50)
• Craft & clarity (30)
• Brevity: one sentence beats two (20)

Prize: $500.`,
    replies: [],
  },
  {
    id: 7, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: 'ask',
    subject: 'Track 4: The Ask', tag: 'Track', stars: 690, views: 3140, starred: false, read: false,
    date: 'Jun 24',
    preview: 'A major "yes" from someone who could change things for you: a job, an intro, money, a favor. Biggest yes wins.',
    body: `TRACK 4: THE ASK

The goal: a major "yes" from someone who could change things for you: a job, an intro, money, a favor.

How it's won: the biggest yes wins.

Scoring (out of 100):
• Size of the "yes": how big, valuable, or unlikely (60)
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

1. Send your cold email (someone who doesn’t know you, real ask).
2. Get a real reply.
3. Submit the form with a screenshot of that reply, before the July 7 deadline.

That's it. Verified by us.

Pick the track that fits your win; every entry is also automatically in the running for The Best Cold Email.`,
    replies: [],
  },
  {
    id: 9, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: 'Key dates: the timeline', tag: 'Timeline', stars: 388, views: 1760, starred: false, read: false,
    date: 'Jun 24',
    preview: 'Launch Jun 24 → registrations close Jun 30 → submit by Jul 7 → winners Jul 10.',
    body: `THE TIMELINE

• Jun 24: Launch. Registrations open.
• Jun 30: Registrations close.
• Jun 24 → Jul 7: Send window. Send your cold emails.
• Jul 7: Submission deadline (form + screenshot of the reply).
• Jul 10: Winners announced.

One event. One shot. Get the reply.`,
    replies: [],
  },
  {
    id: 10, sender: HOST, email: HOST_EMAIL, to: YOU, folder: 'inbox', tab: 'primary', topic: '',
    subject: 'The prize pool: $3,000', tag: 'Prizes', stars: 1510, views: 6240, starred: true, read: false,
    date: 'Jun 24',
    preview: '$3,000 total. $1,000 grand prize + $500 for each of the four tracks.',
    body: `THE PRIZE POOL: $3,000 total.

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
    preview: 'Step 1: the Gate (pass/fail). Step 2: a 100-point rubric per track, scored by the panel.',
    body: `HOW JUDGING WORKS

Step 1: THE GATE (pass/fail). Every entry must clear this before it's scored:
• A real reply from someone who had no reason to answer
• No impersonation, no lying, no pre-existing relationship, no mass-blasting
Fail any → disqualified.

Step 2: SCORING (out of 100). A panel of organizers + guest judges scores each qualifying entry. Criteria are weighted per track (see each track's email).

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
  { name: 'Elon Musk',        hi: 'Elon',    email: 'dogefather@x.com',           img: '/memes/IMG-20260619-WA0024.jpg', tip: 'Send at 3am and tweet through it. The unhinged-but-bold email gets the reply the polished one never will.' },
  { name: 'Jeff Bezos',       hi: 'Jeff',    email: '1click@amazon.com',          img: '/memes/IMG-20260619-WA0023.jpg', tip: 'Make replying a one-click decision. Every extra step you ask for is another reason they bounce.' },
  { name: 'Barack Obama',     hi: 'Barack',  email: 'yeswecan@whitehouse.gov',    img: '/memes/IMG-20260619-WA0012.jpg', tip: 'Write to one person, not a rally. "You" wins more votes than "everyone."' },
  { name: 'Donald Trump',     hi: 'Donald',  email: 'covfefe@truth.social',       img: '/memes/IMG-20260619-WA0020.jpg', tip: 'Your subject line is the whole campaign: tremendous open rates, the best, or nothing happens. Believe me.' },
  { name: 'Kanye West',       hi: 'Ye',      email: 'immaletyoufinish@yeezy.com', img: '/memes/Kanye.jpeg',              tip: "Interrupt the inbox like it's the VMAs. Confidence opens what politeness leaves on read." },
  { name: 'Drake',            hi: 'Drake',   email: 'started@thebottom.com',      img: '/memes/IMG-20260619-WA0015.jpg', tip: 'Started from "no reply," now we here. The follow-up is where the deal actually lives.' },
  { name: 'Justin Bieber',    hi: 'Justin',  email: 'sorry@beliebers.com',        img: '/memes/IMG-20260619-WA0008.jpg', tip: 'Is it too late now to say sorry? Never. A good follow-up beats a perfect first email every time.' },
  { name: 'Sabrina Carpenter',hi: 'Sabrina', email: 'espresso@sabrina.com',       img: '/memes/IMG-20260619-WA0018.jpg', tip: 'Be the email that keeps them up like espresso. Memorable beats polished.' },
  { name: 'Max Verstappen',   hi: 'Max',     email: 'boxbox@redbull.com',         img: '/memes/IMG-20260619-WA0011.jpg', tip: 'Lights out and away you go. Speed wins: the faster you send, the more shots on goal.' },
  { name: 'Charlie Kirk',     hi: 'Charlie', email: 'provemewrong@tpusa.com',     img: '/memes/IMG-20260619-WA0019.jpg', tip: "Set up a table they can't walk past. A sharp question is harder to ignore than a statement." },
  { name: 'Mark Zuckerberg',  hi: 'Mark',    email: 'definitelyhuman@meta.com',   img: '/memes/IMG-20260619-WA0022.jpg', tip: "Don't email like an avatar in an empty metaverse. One human detail beats a thousand merge tags." },
  { name: 'Anthony Mackie',   hi: 'Anthony', email: 'onyourleft@marvel.com',      img: '/memes/IMG-20260619-WA0014.jpg', tip: 'Show up on their left when they least expect it, and ask like you already caught the shield.' },
  { name: 'Brooklyn 99',      hi: 'Jake',    email: 'coolcoolcool@nine9.com',     img: '/memes/IMG-20260619-WA0009.jpg', tip: 'Cool cool cool, no doubt no doubt. Keep it short. Ten-second reads are the ones that get read.' },
  { name: 'Phil Dunphy',      hi: 'Phil',    email: 'philosophy@dunphy.com',      img: '/memes/IMG-20260619-WA0013.jpg', tip: "WTF? Why The Face? Be the warm one. People reply to the guy they'd grab a coffee with." },
  { name: 'The Kiss-Cam Couple', hi: 'you two', email: 'wrongperson@coldplay.com', img: '/memes/IMG-20260619-WA0016.jpg', tip: 'Check the "To" field twice. The wrong recipient turns a cold email into a viral one.' },
  { name: 'Caught Mid-Sentence', hi: 'there', email: 'waitwhat@oops.com',         img: '/memes/IMG-20260619-WA0010.jpg', tip: 'Open mid-thought and they lean in. A weird first line beats "Dear Sir or Madam."' },
  { name: 'Corporate Era',    hi: 'champ',   email: 'circleback@synergy.com',     img: '/memes/IMG-20260619-WA0021.jpg', tip: "Let's circle back, but actually. Respect their calendar: get to the ask before sentence two." },
]

// Pick one meme avatar per page load and reuse it everywhere (topbar + chat
// read receipts) so the "current website pfp" is consistent across the session.
let _sessionMeme = null
export function sessionMeme() {
  if (!_sessionMeme) _sessionMeme = MEMES[Math.floor(Math.random() * MEMES.length)]
  return _sessionMeme
}

// The registration-chat persona pfp. Random, but GUARANTEED never the same as
// the user's session pfp (topbar) — picked from the remaining memes.
let _chatMeme = null
export function chatMeme() {
  if (!_chatMeme) {
    const others = MEMES.filter(m => m !== sessionMeme())
    _chatMeme = others[Math.floor(Math.random() * others.length)]
  }
  return _chatMeme
}

// The Rule page (v2.0 spec) — list content; headings/copy live inline in ViewRule.
export const RULES_PAGE = {
  chips: ['No Impersonation', 'No Lying', 'No Existing Relationship', 'No Mass-Blasting', 'BCC Required'],
  whatCounts: [
    'A real person replied',
    'The recipient didn’t already know you',
    'The email was sent during the competition',
    'You BCC’d our competition inbox',
    'You can provide proof',
    'The interaction was genuine',
  ],
  doesntCount: [
    'Out of office replies',
    'Auto-responders',
    'Newsletter confirmations',
    'Delivery notifications',
    'Bounce messages',
    'AI-generated autoresponses',
    'Existing contacts',
    'Purchased introductions',
    'Paid responses',
  ],
  bccWhy: [
    'Creates an independent timestamp',
    'Prevents fake screenshots',
    'Verifies the email was actually sent',
    'Keeps judging fair',
    'Protects the integrity of the competition',
  ],
  allowed: [
    'Personal research',
    'Custom-written emails',
    'Personalized outreach',
    'Up to two follow-ups',
    'Any writing or research workflow that follows the rules',
    'Human or software-assisted drafting',
  ],
  notAllowed: [
    'Spam',
    'Fake identities',
    'Impersonation',
    'Misleading credentials',
    'Fabricated achievements',
    'Mass-blasting substantially identical emails',
    'Fake screenshots',
    'Fake replies',
  ],
  proof: [
    { icon: 'mail',          label: 'Original email' },
    { icon: 'chat_bubble',   label: 'Reply received' },
    { icon: 'photo_camera',  label: 'Screenshot of the exchange' },
    { icon: 'verified',      label: 'Matching BCC verification' },
    { icon: 'assignment',    label: 'Submission form' },
  ],
  fairPlayNot: [
    'Family', 'Friends', 'Classmates', 'Colleagues',
    'Existing clients', 'Former clients', 'Previous contacts', 'Anyone who already knows you',
  ],
  privacyBlur: [
    'Email addresses', 'Phone numbers', 'Company information', 'Personal details', 'Private conversations',
  ],
  bccEmail: 'judges@thecold.email',
}

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

// ============================================================
// Full content for the 4 track / judging pages (rendered by ViewTrack)
// ============================================================
export const TRACK_REMEMBER = {
  lead: 'Every track requires the same thing:',
  bold: 'A real reply from someone who had no reason to reply.',
  body: 'No matter which category you enter, the foundation never changes.',
  tag: 'Get the reply.',
}

export const TRACK_PAGES = {
  unreachable: {
    goal: 'Get a **reply** from someone who **almost never replies**.',
    goalExtra: 'Think founders, CEOs, investors, politicians, public intellectuals, celebrities, or anyone whose inbox is flooded every day.',
    howWon: [
      "The hardest target to reach wins.",
      'This track rewards difficulty above all else.',
      'A genuine reply from a truly unreachable person can beat a longer reply from someone easier to contact.',
    ],
    rewards: [
      'Most people send cold emails to people they think might reply.',
      'This track is for the opposite.',
      'The people who seem impossible.',
      'The people everyone wants a response from.',
      'The people whose inboxes are buried under thousands of emails.',
      "The challenge isn't writing the email.",
      'The challenge is __earning attention__ where attention is almost **impossible** to earn.',
    ],
    judges: [
      'Difficulty of the target',
      'Genuine engagement in the reply',
      'Quality of the email',
      'Creativity of approach',
      'Evidence that the person is genuinely difficult to reach',
    ],
    strong: [
      'A reply from a world-class founder.',
      'A reply from a major investor.',
      'A reply from a public figure.',
      'A thoughtful response from someone known for rarely engaging.',
      'A response that shows real attention rather than a quick brush-off.',
    ],
    mistakes: [
      'Assuming fame automatically wins.',
      'Targeting someone who is actually easy to reach.',
      'Focusing on the recipient instead of the email.',
      'Submitting a reply with no real engagement.',
    ],
    scoring: [
      { label: 'Difficulty of the target: how unreachable they are', pts: 50 },
      { label: 'Depth of the reply: real engagement, not a brush-off', pts: 30 },
      { label: 'Craft of the email', pts: 20 },
    ],
  },
  subject: {
    goal: 'Earn a reply **because of the subject line**.',
    howWon: [
      'The strongest subject-line craft wins.',
      'The reply proves the email was opened.',
      'The subject line proves why.',
    ],
    rewards: [
      "Most cold emails fail before they're even read.",
      'The subject line is the first impression.',
      'This track rewards the subject line that creates curiosity, earns attention, and convinces someone to open an email they would normally ignore.',
    ],
    judges: ['Curiosity', 'Originality', 'Clarity', 'Memorability', 'Honest persuasion'],
    strong: [
      'Subject lines that instantly spark interest.',
      'Subject lines that feel personal.',
      'Subject lines that create curiosity without deception.',
      'Subject lines that make the recipient want to know more.',
    ],
    mistakes: [
      'Clickbait.',
      'Fake urgency.',
      'Misleading claims.',
      'Generic templates.',
      'Tricks that earn opens but not trust.',
    ],
    scoring: [
      { label: 'Subject-line hook & craft', pts: 60 },
      { label: 'That it earned a genuine reply', pts: 25 },
      { label: 'Honesty: no clickbait lie', pts: 15 },
    ],
  },
  twoliner: {
    goal: 'Get a reply using **two sentences or fewer**.',
    howWon: ['The most impact from the fewest words wins.'],
    rewards: [
      'Anyone can write a long email.',
      'Very few people can make every word count.',
      'This track rewards extreme clarity, precision, and restraint.',
      "The challenge isn't saying more.",
      "It's __saying less__.",
    ],
    judges: [
      'Brevity',
      'Clarity',
      'Strength of result',
      'Efficient communication',
      'Strong writing under constraints',
    ],
    strong: [
      'A meaningful reply from a short email.',
      'A major opportunity earned with minimal words.',
      'A direct ask that gets a direct response.',
      'An email where every sentence carries weight.',
    ],
    mistakes: [
      'Hiding multiple sentences behind commas.',
      'Formatting tricks.',
      'Sacrificing clarity for brevity.',
      'Being short without being effective.',
    ],
    scoring: [
      { label: 'Result earned vs. how few words used', pts: 50 },
      { label: 'Craft & clarity', pts: 30 },
      { label: 'Brevity: one sentence beats two', pts: 20 },
    ],
  },
  ask: {
    goal: 'Earn a **major "yes"** from someone who could open a door for you.',
    goalExtra: 'A job. An introduction. Funding. A meeting. A partnership. A favor. Something that matters.',
    howWon: ['The biggest yes wins.'],
    rewards: [
      'Cold email is ultimately about creating opportunities.',
      'This track rewards ambitious asks that successfully earn meaningful outcomes.',
      'The bigger the opportunity.',
      'The stronger the entry.',
    ],
    judges: [
      'Size of the yes',
      'Value of the outcome',
      'Difficulty of obtaining it',
      'Proof that it happened',
      'Quality of the email',
    ],
    strong: [
      'Landing an interview.',
      'Securing an introduction.',
      'Getting a meeting with a hard-to-reach person.',
      'Receiving funding or sponsorship.',
      'Earning a partnership opportunity.',
    ],
    mistakes: [
      'Small requests with small outcomes.',
      'Weak proof.',
      'Outcomes that were already likely to happen.',
      'Confusing a reply with a meaningful yes.',
    ],
    scoring: [
      { label: 'Size of the "yes": how big, valuable, or unlikely', pts: 60 },
      { label: 'Proof the yes was real', pts: 20 },
      { label: 'Craft of the email', pts: 20 },
    ],
  },
}

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
  { date: '2026-07-02', start: '09:30', end: '10:00', title: 'Daily tip: open with their world', color: 'teal' },
  { date: '2026-07-02', start: '15:00', end: '16:00', title: 'Subject-line teardown #2',         color: 'purple' },
  { date: '2026-07-03', start: '10:00', end: '11:00', title: 'Send your boldest ask', color: 'amber' },
  { date: '2026-07-04', start: '11:00', end: '12:00', title: 'Judge office hours',               color: 'green' },
  { date: '2026-07-04', start: '16:00', end: '16:30', title: '3 days left to submit',            color: 'orange' },
  { date: '2026-07-05', start: '10:00', end: '10:30', title: 'Daily tip: one clear ask only',    color: 'teal' },
  { date: '2026-07-05', start: '14:00', end: '15:00', title: 'Polish your reply thread',         color: 'blue' },
  { date: '2026-07-06', start: '09:00', end: '09:30', title: 'Final-day countdown: 1 day left',  color: 'red' },
  { date: '2026-07-06', start: '13:00', end: '14:00', title: 'Last-call office hours',           color: 'green' },

  // ---- Timed — final week ----
  { date: '2026-07-08', start: '11:00', end: '12:00', title: 'Judging begins',               color: 'green' },
  { date: '2026-07-08', start: '13:00', end: '17:00', title: 'Judging room (closed session)', color: 'graphite' },
  { date: '2026-07-09', start: '10:00', end: '16:00', title: 'Judging room (day 2)',          color: 'graphite' },
  { date: '2026-07-10', start: '17:00', end: '18:00', title: 'Winners announced (live)',      color: 'green' },
  { date: '2026-07-11', start: '11:00', end: '12:00', title: 'Winners recap: what worked',    color: 'blue' },
  { date: '2026-07-13', start: '15:00', end: '16:00', title: 'Teardown: the winning emails',  color: 'purple' },
]

// ENTER / "The Procedure" — Step 1 registration form (Google Forms surface)
// type: short | email | url | dropdown | radio | checkbox | paragraph
// Each question carries a stable `name` (used as the controlled-state key in
// ViewEnter) and a `ph` placeholder. `type` drives per-field validation:
//   email → email regex · url → URL format · required → blocks submit.
export const ENTER_FORM = {
  title: 'Enter the Competition',
  desc: 'Registration. Tell us who you are and why you’re in. Send as many cold emails as you like. You only submit the ones that get a real reply.',
  questions: [
    { name: 'full_name',     q: "What's your name?",                   type: 'short',     required: true,  ph: 'First and last name' },
    { name: 'email',         q: "What's the best email to reach you?", type: 'email',     required: true,  ph: 'you@example.com' },
    { name: 'country',       q: 'What country do you live in?',        type: 'short',     required: true,  ph: 'e.g. United States' },
    { name: 'age',           q: 'How old are you?',                    type: 'short',     required: true,  ph: 'e.g. 21' },
    { name: 'company',       q: 'Where do you work or study?',         type: 'short',     required: false, ph: 'Company, school, or “solo”' },
    { name: 'position',      q: "What's your role there?",             type: 'short',     required: false, ph: 'Your title or what you do' },
    { name: 'social',        q: 'Got a social handle or link? (X, LinkedIn, Instagram, TikTok…)', type: 'url', required: false, ph: '@you or a profile link' },
    { name: 'background',    q: "What's your background?",             type: 'checkbox',  required: false, options: ['Writing', 'Marketing', 'Sales', 'Builder'] },
    { name: 'why_joining',   q: 'Why are you joining thecold.email?',  type: 'paragraph', required: true,  ph: 'Tell us what brought you here.' },
    { name: 'what_you_want', q: 'What do you want to get out of this?', type: 'paragraph', required: true,  ph: 'What would make this worth it for you?' },
  ],
}

// Country-name validation list for the registration "country" field. Sovereign
// states (UN members + commonly-entered territories), all lowercased. Common
// short forms / aliases map onto a canonical name so "usa", "uk", "uae" etc.
// pass. isCountry() does the case-insensitive lookup (alias-aware).
export const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
  'Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czechia',
  'Democratic Republic of the Congo','Denmark','Djibouti','Dominica','Dominican Republic',
  'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
  'Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
  'Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast',
  'Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan',
  'Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
  'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
  'Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway',
  'Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
  'Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
  'Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu',
  'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
  'Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
]

// Common short forms / spellings → still accepted by isCountry().
const COUNTRY_ALIASES = {
  'usa': 'united states', 'us': 'united states', 'u.s.': 'united states', 'u.s.a.': 'united states',
  'united states of america': 'united states', 'america': 'united states',
  'uk': 'united kingdom', 'u.k.': 'united kingdom', 'britain': 'united kingdom', 'great britain': 'united kingdom', 'england': 'united kingdom', 'scotland': 'united kingdom', 'wales': 'united kingdom',
  'uae': 'united arab emirates', 'u.a.e.': 'united arab emirates',
  'south korea': 'south korea', 'korea': 'south korea', 'north korea': 'north korea',
  'russia': 'russia', 'russian federation': 'russia',
  'czech republic': 'czechia', 'holland': 'netherlands', 'the netherlands': 'netherlands',
  'ivory coast': 'ivory coast', "cote d'ivoire": 'ivory coast',
  'swaziland': 'eswatini', 'burma': 'myanmar', 'cape verde': 'cabo verde',
  'vatican': 'vatican city', 'east timor': 'timor-leste', 'macedonia': 'north macedonia',
}

const COUNTRY_SET = new Set(COUNTRIES.map(c => c.toLowerCase()))

// Case-insensitive, alias-aware country check. Returns true for a recognized
// country name or common alias.
export function isCountry(raw) {
  const t = (raw || '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (!t) return false
  if (COUNTRY_SET.has(t)) return true
  return !!COUNTRY_ALIASES[t]
}

// Best Email Ever — PLACEHOLDER examples (Akul will replace with real entries)
const BEST_EMAIL_SAMPLE =
  {
    from: 'Richard Zheng',
    fromEmail: 'richardzphotoz@gmail.com',
    avatar: '/best/richard.jpg',
    replyAvatar: '/best/cuban.jpg',
    to: 'mcuban',
    stars: 612, views: 2840, tag: 'The Unreachable', date: 'May 9, 2024',
    subject: 'MCF AI Bootcamp Alumni reaching out instead of studying',
    body: `Hey Mark,

I'm currently a high school student who uses AI a LOT and went to your bootcamp a while back.

My experience with your foundation inspired me to delve deeper into how nonprofits and philanthropy operate. That's when I started my company, UNHRD, where we catalog transactions and initiatives on-chain using Ethereum for foundations and nonprofits.

So there's

1. Reduced administrative costs and overhead
2. Enhanced trust among stakeholders
3. Tamper-proof records that are private yet verifiable
4. Accelerated global reach and collaboration

We're in beta, backed by Arbitrum, and partnered with brands like Forbes on their web3 initiatives.

I'd love to have you on our cap table and receive some of your advice!

I'll get back to studying,
Richard`,
    replyFrom: 'Mark Cuban',
    replyEmail: 'mcuban@gmail.com',
    replyDate: 'May 9, 2024',
    reply: `What is the utility of it`,
  }

// Temporary: duplicate the sample email into 10 rows to preview how a full list looks.
export const BEST_EMAILS = Array.from({ length: 10 }, () => ({ ...BEST_EMAIL_SAMPLE }))
