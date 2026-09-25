# בורסת תינוקות (baby-stocks)

A single-file, real-time "baby stock exchange" party game for a gender-reveal event.
Guests bet play-money coins on outcomes (gender, name, weight, eye color, etc.); markets
get revealed live during the party with a full-screen animated banner and confetti.

## Stack

- `index.html` — the entire app: markup, CSS, and JS in one file. No build step, no
  dependencies beyond the Supabase JS client (loaded from a CDN) and a Google Font.
- `supabase-schema.sql` — full schema (tables, AMM betting function, leaderboard view,
  RLS policies, realtime publication, seed data) for a fresh Supabase project.
- `seed-fixes.sql` — standalone, idempotent data fixes (real names + the gender market)
  to run against an **already-seeded** live project without re-running the full schema.

## Hosting it for the event

1. Create a Supabase project, run `supabase-schema.sql` in the SQL editor.
2. Drop in `SUPABASE_URL` / `SUPABASE_ANON_KEY` in `index.html` (search for the constants
   near the top of the `<script>` block).
3. Set your own admin password: run `node tools/generate-admin-payload.mjs`, follow the
   prompt, and paste the printed object over the `ADMIN_AUTH_PAYLOAD` placeholder near the
   top of the `<script>` block. The script never writes the password anywhere — only the
   encrypted payload is printed, and that's what gets committed.
4. Host `index.html` anywhere static (GitHub Pages, Netlify, Vercel, or just open the file
   locally on the host's laptop and share a tunnel URL). No server-side code required.
5. Only share the URL with your actual guests — see the security note below.

## Security note (intentional, party-scale trust model)

This app is built for a one-off party, not a public product, and a few things are
deliberately **not** locked down:

- The admin panel is gated by a password you set with `tools/generate-admin-payload.mjs`.
  The password itself is never stored in the repo; `index.html` only holds an AES-GCM
  encrypted payload (see the `AdminAuth` module near the top of the `<script>` block) that
  a correct password can decrypt. This stops casual source/DevTools inspection from
  handing someone the password or a `APP.isAdmin = true`-style bypass — but it's still a
  client-side check running in the guest's own browser. It is a UI gate, not real
  server-side authentication, and can't be made into one without a backend.
- Row-Level Security on `markets` and `predictions` allows the anon key to update markets
  (reveal/reset) and delete predictions directly. Any client holding the anon key could,
  in principle, reveal markets early or wipe bets — regardless of whether they ever see
  the admin panel or know the admin password.

This is a conscious trade-off for a same-room, few-hours event, not an oversight. If you
reuse this for anything beyond a single trusted-audience party:

- Don't publish the Supabase URL/anon key anywhere public beyond the guests you invite.
- Rotate or pause the Supabase project once the event is over.
- If you want it locked down further, move admin actions behind a real authenticated
  role and tighten the RLS policies on `markets`/`predictions`.
