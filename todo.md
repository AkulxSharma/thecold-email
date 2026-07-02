# thecold.email — codebase audit findings (2026-07-03)

3-agent audit: correctness, security/backend, dead-code/launch. `main` clean at time of audit.

## 🔴 Launch blockers

- [ ] **Make webhook exposed** — URL hardcoded in client bundle, no auth. Anyone can POST arbitrary payloads → send thecold.email-branded phishing emails + burn Make quota. Proxy server-side (Vercel fn / Supabase Edge). `src/ViewChat.jsx:34`
- [ ] **Supabase inserts unvalidated** — RLS is `with check(true)`, no column constraints, no CAPTCHA. Anon key is public → direct curl mass-spam/garbage into `registrations` + `submissions`. Add DB `CHECK` constraints (email regex, age 13–100, text length caps) + Turnstile/hCaptcha on both write paths. `supabase/schema.sql:38-43`
- [ ] **BEST_EMAILS is fake** — 1 real email duplicated ×10. Revert to real winners. `src/data.js:641`
- [ ] **Fake reviewer names live** — fabricated names (Priya Raman, Marcus Bell, etc.) render on track pages. Real names/links. `src/App.jsx:2607-2614`, placeholder link `src/App.jsx:2623`
- [ ] **Footer LinkedIn dead** — `href="#"`. Fill or remove. `src/App.jsx:875`
- [ ] **Sponsors placeholder** — "Sponsors: your logo here". Fill or hide. `src/App.jsx:878`
- [ ] **Live date bug** — bot says registration "closes Jul 6", truth is Jun 30 (`eventPhase`/`DEADLINES`); also self-contradicts "Jun 24–30" in same sentence. `src/ViewChat.jsx:433`

## 🟠 Real bugs

- [ ] **Resize listener leak** — WalletHero effect adds an anonymous `resize` handler never removed in cleanup. Every Home revisit stacks a listener firing setState on unmounted refs. (Other 4 resize listeners clean.) `src/App.jsx:568`
- [ ] **send() race** — async email-dedupe with no send-lock; double-Enter runs twice with stale `flow` → duplicated bot question / corrupted `answers`. `src/ViewChat.jsx:307-339`
- [ ] **pumpBot timer leak** — setTimeout calls setMsgs with no unmount guard → setState-after-unmount if user navigates during reveal delay. `src/ViewChat.jsx:176-190`
- [ ] **Calendar column width (latent)** — uses day-global column count, not per-overlap cluster; non-overlapping events get narrowed once any day has a 3-way overlap or a timezone-shifted event. No misrender with current data. `src/App.jsx:1759-1776`

## 🟡 Dead code (delete)

- [ ] **517-line dead ViewEnter block** — Maps/Classroom after early-return. Plus `ViewStory.jsx` (whole file), `story.css`, and the import. NOTE: the ViewStory "Jul 6" date bug lives here — dead, won't render. `src/App.jsx:958-1474`, `src/App.jsx:5`
- [ ] **Orphan fairPlayNot** — seeds `fairplay|*` keys that match nothing after the Fair play checklist was removed. `src/App.jsx:3421` + `src/data.js:304-307`
- [ ] **Unused imports** — `MEMES`, `SEND_WINDOW` imported, never used. `src/App.jsx:3` (exports `data.js:225,331`)
- [ ] **Dead constants** — `REGISTRATION_FORM_URL`, `SUBMISSION_FORM_URL` empty strings, comment-only. `src/App.jsx:19-20`
- [ ] **Stale comments** — "renders TrackMarkedDoc" (now TrackDocEssay) `src/App.jsx:2597`; "paste the webhook URL" (now live) `src/ViewChat.jsx:33`
- [ ] **COUNTRIES over-exported** — exported but only used internally; drop `export`. `src/data.js:561`

## 🟡 Lower-priority security

- [ ] Email-enumeration oracle via `is_email_registered` RPC — reveals participation status per email. Rate-limit if it matters. `supabase/schema.sql:59-68`
- [ ] No CSP / security headers in `vercel.json` — add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, CSP.
- [ ] esbuild ≤0.24.2 dev-only advisory (via Vite) — not in prod bundle. `npm audit fix` when convenient.

## 🟢 Verified clean

eventPhase boundaries (no off-by-one), IP-geolocation timezone conversion (has `alive` guard), usePullToRefresh, EmojiPicker, localStorage in bestState/registration, no dangerouslySetInnerHTML/XSS, `.env` gitignored + never committed, RLS read-blocked (insert-only anon), unique constraints prevent dup registration.

## Not-code, still open (from prior sessions)
- [ ] Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` on Vercel + redeploy (else registrations only hit localStorage).
- [ ] Run `alter table public.registrations rename column age_band to age;` in Supabase.
- [ ] Delete 2 curl test rows from the DB.
