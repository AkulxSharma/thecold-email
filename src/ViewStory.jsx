import './story.css'
import { M } from './icons'

const STEPS = [
  {
    title: 'Send a cold email.',
    text: 'Write to someone you have no right to expect a reply from. A founder, an editor, a stranger whose work you admire.',
  },
  {
    title: 'Get a real reply.',
    text: 'No reply, no entry. Only emails that earn a genuine, human response from the person you wrote to count here.',
  },
  {
    title: 'Prove it & compete.',
    text: 'Submit a screenshot or PDF of the thread. The proof is the point — we judge what actually moved a person to write back.',
  },
]

const TRACKS = [
  {
    icon: 'flight',
    name: 'The Unreachable',
    desc: 'Write to people who have every reason to ignore you — founders, execs, the heroes whose inboxes are walls. Get in anyway.',
  },
  {
    icon: 'subject',
    name: 'Best Subject Line',
    desc: 'The line that earns the open without clickbait. A few words that a busy person decides, against the odds, to click.',
  },
  {
    icon: 'short_text',
    name: 'The Two-Liner',
    desc: 'Say it in two sentences. No throat-clearing, no preamble — restraint wins. The shortest path to a yes.',
  },
  {
    icon: 'front_hand',
    name: 'The Ask',
    desc: 'Make the boldest ask that still lands a real yes. Aim high enough to feel the nerve, precise enough to be answerable.',
  },
]

export default function ViewStory() {
  return (
    <div className="view-panel">
      <div className="story-wrap">
        <article className="story-measure">

          <header className="story-masthead">
            <p className="story-eyebrow">
              <M name="article" size={16} />
              The Story
            </p>
            <h1 className="story-wordmark">
              the<span className="story-accent">cold</span>.email
            </h1>
            <p className="story-tagline">Get the reply.</p>
          </header>

          <section className="story-section">
            <p className="story-kicker">What it is</p>
            <h2 className="story-h2">A competition to find the best cold emails on the planet.</h2>
            <p className="story-p story-lead">
              Not the cleverest in theory. The best in practice — <span className="story-em">proven by who actually replied.</span>
            </p>
            <p className="story-p">
              Anyone can write an email. Almost no one writes one that a stranger feels compelled to answer.
              thecold.email is built around that single, unforgiving test: did a real person, with no obligation to you,
              write back? That is the only scoreboard that matters.
            </p>
          </section>

          <section className="story-manifesto">
            <p className="story-quote">
              Every closed door has an inbox. The cold email is the one knock that still works, and almost no one dares to use it.
            </p>
            <p className="story-quote">
              The world is far more reachable than it looks. It opens for anyone willing to write to a stranger and ask.
            </p>
            <p className="story-quote">
              One email, sent to the right person at the right moment, can change the shape of a life.
            </p>
          </section>

          <section className="story-section">
            <p className="story-kicker">How it works</p>
            <h2 className="story-h2">Three moves. No shortcuts.</h2>
            <ol className="story-steps">
              {STEPS.map((s) => (
                <li className="story-step" key={s.title}>
                  <span className="story-step-num" />
                  <div className="story-step-body">
                    <p className="story-step-title">{s.title}</p>
                    <p className="story-step-text">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="story-section">
            <p className="story-kicker">The procedure</p>
            <h2 className="story-h2">From idea to entry.</h2>
            <ol className="story-steps">
              <li className="story-step">
                <span className="story-step-num" />
                <div className="story-step-body">
                  <p className="story-step-title">Register.</p>
                  <p className="story-step-text">Claim your place in the competition before the window closes.</p>
                </div>
              </li>
              <li className="story-step">
                <span className="story-step-num" />
                <div className="story-step-body">
                  <p className="story-step-title">Send cold emails.</p>
                  <p className="story-step-text">Write to the people you would never normally dare to email. Then send them.</p>
                </div>
              </li>
              <li className="story-step">
                <span className="story-step-num" />
                <div className="story-step-body">
                  <p className="story-step-title">Submit the ones that reply.</p>
                  <p className="story-step-text">Bring back the threads that earned a genuine answer. Those are your entries.</p>
                </div>
              </li>
            </ol>
          </section>

          <section className="story-section">
            <p className="story-kicker">Timeline</p>
            <h2 className="story-h2">Two weeks. One window.</h2>
            <div className="story-timeline">
              <div className="story-timeline-card">
                <p className="story-timeline-label">
                  <M name="how_to_reg" size={15} />
                  Registration
                </p>
                <p className="story-timeline-dates">Jun 24 – 30</p>
                <p className="story-timeline-note">Sign up and start sending. Registration closes July 6.</p>
              </div>
              <div className="story-timeline-card">
                <p className="story-timeline-label">
                  <M name="send" size={15} />
                  Submissions
                </p>
                <p className="story-timeline-dates">Jul 1 – 7</p>
                <p className="story-timeline-note">Submit the threads that replied. Final reply due by July 7.</p>
              </div>
            </div>
          </section>

          <section className="story-section">
            <p className="story-kicker">The four tracks</p>
            <h2 className="story-h2">Four ways to be the best.</h2>
            <div className="story-tracks">
              {TRACKS.map((t) => (
                <div className="story-track" key={t.name}>
                  <div className="story-track-icon">
                    <M name={t.icon} size={24} />
                  </div>
                  <div className="story-track-body">
                    <p className="story-track-name">{t.name}</p>
                    <p className="story-track-desc">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="story-section">
            <p className="story-kicker">Prizes</p>
            <h2 className="story-h2">The stakes.</h2>
            <div className="story-prizes">
              <div className="story-prize">
                <p className="story-prize-amount">$500</p>
                <p className="story-prize-label">to each of the four track winners — for the email that best owns its category.</p>
              </div>
              <div className="story-prize story-prize-grand">
                <p className="story-prize-amount">$1,000</p>
                <p className="story-prize-label">Best Cold Email. Every qualifying entry is in the running for the grand prize.</p>
              </div>
            </div>
          </section>

          <section className="story-close">
            <p className="story-quote story-quote-final">The world replies to those who dare to write.</p>
            <p className="story-signoff">thecold.email — Get the reply.</p>
          </section>

        </article>
      </div>
    </div>
  )
}
