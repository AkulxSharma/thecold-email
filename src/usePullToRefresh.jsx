import { useEffect, useRef, useState } from 'react'

/* ---------------------------------------------------------------------------
   usePullToRefresh — mobile "swipe down at the top to refresh" gesture, the
   way Gmail does it. Attach `mainRef` to the fixed app-shell wrapper (.main)
   and render `indicator` inside it.

   How it works: on touchstart we look for the scroll container under the
   finger (.view-panel / .enter-canvas / .landing). If that container is at the
   very top, we arm. A downward drag then translates a circular spinner down
   with resistance; releasing past THRESHOLD runs onRefresh() and spins the
   indicator until it resolves (plus a short minimum so it reads as a real
   sync). Below threshold it snaps back. Touch-only — never engages with a
   mouse, so desktop is untouched.
   --------------------------------------------------------------------------- */

const THRESHOLD = 64   // px of pull needed to trigger a refresh
const MAX_PULL  = 96   // hard cap on how far the indicator can travel
const REST      = 52   // where the spinner parks while refreshing
const RESIST    = 0.5  // drag resistance (finger px -> indicator px)
const MIN_SPIN  = 550  // ms — minimum spinner time so a fast refresh still reads
const CIRC      = 2 * Math.PI * 9 // spinner arc circumference (r = 9)

export function usePullToRefresh(onRefresh) {
  const mainRef = useRef(null)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [settling, setSettling] = useState(false)
  const st = useRef({ armed: false, startY: 0, el: null, pull: 0, busy: false })

  useEffect(() => {
    const main = mainRef.current
    if (!main || typeof window === 'undefined' || !('ontouchstart' in window)) return
    const s = st.current

    const onStart = (e) => {
      if (s.busy) return
      const el = e.target.closest?.('.view-panel, .enter-canvas, .landing')
      if (!el || el.scrollTop > 0) { s.armed = false; return }
      s.armed = true
      s.startY = e.touches[0].clientY
      s.el = el
      s.pull = 0
      setSettling(false)
    }

    const onMove = (e) => {
      if (!s.armed || s.busy) return
      const dy = e.touches[0].clientY - s.startY
      if (dy <= 0) { if (s.pull) { s.pull = 0; setPull(0) } return }
      // they started scrolling the list — hand the gesture back to the browser
      if (s.el && s.el.scrollTop > 0) { s.armed = false; if (s.pull) { s.pull = 0; setPull(0) } return }
      e.preventDefault() // kill native overscroll/bounce so our pull owns it
      const p = Math.min(dy * RESIST, MAX_PULL)
      s.pull = p
      setPull(p)
    }

    const onEnd = () => {
      if (!s.armed) return
      s.armed = false
      setSettling(true)
      if (s.pull >= THRESHOLD) {
        s.busy = true
        setRefreshing(true)
        setPull(REST)
        const started = Date.now()
        Promise.resolve(onRefresh?.()).finally(() => {
          const wait = Math.max(0, MIN_SPIN - (Date.now() - started))
          setTimeout(() => {
            setRefreshing(false)
            setPull(0)
            s.pull = 0
            s.busy = false
          }, wait)
        })
      } else {
        setPull(0)
        s.pull = 0
      }
    }

    main.addEventListener('touchstart', onStart, { passive: true })
    main.addEventListener('touchmove', onMove, { passive: false })
    main.addEventListener('touchend', onEnd, { passive: true })
    main.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      main.removeEventListener('touchstart', onStart)
      main.removeEventListener('touchmove', onMove)
      main.removeEventListener('touchend', onEnd)
      main.removeEventListener('touchcancel', onEnd)
    }
  }, [onRefresh])

  const progress = Math.min(pull / THRESHOLD, 1)
  // while dragging, the arc grows with the pull (max ~3/4 circle); during the
  // refresh, CSS spins a fixed arc instead.
  const dashoffset = refreshing ? CIRC * 0.25 : CIRC * (1 - progress * 0.75)

  const indicator = (
    <div
      className={`ptr-indicator${refreshing ? ' refreshing' : ''}`}
      style={{
        transform: `translateX(-50%) translateY(${pull}px)`,
        opacity: refreshing ? 1 : progress,
        transition: settling ? 'transform .24s cubic-bezier(.2,.8,.2,1), opacity .2s ease' : 'none',
      }}
      aria-hidden={pull === 0 && !refreshing}
    >
      <div
        className="ptr-spinner"
        style={!refreshing ? { transform: `rotate(${progress * 270}deg)` } : undefined}
      >
        <svg viewBox="0 0 24 24" width="22" height="22">
          <circle className="ptr-track" cx="12" cy="12" r="9" />
          <circle
            className="ptr-arc"
            cx="12" cy="12" r="9"
            style={{ strokeDasharray: CIRC, strokeDashoffset: dashoffset }}
          />
        </svg>
      </div>
    </div>
  )

  return { mainRef, indicator, refreshing }
}
