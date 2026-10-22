# Hack Day voting launch

## Current implementation

- `/hack-day` adapts the WebDev repository's MIT-licensed SIGNAL desktop UI. Styles are scoped to this route.
- The gallery contains 50 discovered submission directories/shared projects from the five existing repositories, inventoried October 21, 2026. Source links are real; entries are **not an organiser-approved Hack Day shortlist**. SIGNAL is one shared project, not one entry per WebDev pull request. Starter challenge directories and AI/ML's starter lunch-lab are excluded.
- The organiser publishes approved IDs in `HackDayProject`; once configured, the public ballot shows only those IDs. Do not bulk-approve the discovery inventory without reviewing eligibility, duplicate stages, project names and teams. Multiple challenge levels from one person may describe one project.
- Exactly one final vote per normalized, verified email per event is enforced by a database primary key. Email ownership is checked server-side with Supabase Auth. Clearing cookies, a new browser, a new device or simultaneous requests cannot bypass the constraint for the same email.
- This is **not proof of one human**: someone with multiple email accounts can vote multiple times. The default audience is all verified email accounts. Use institutional SSO or an organiser-approved voter roster if strict one-person eligibility is required; that scope was not specified.
- No tallies, voter lists or results are available through the public API or Supabase's public Data API. The browser can read its own choice only. Operators can tally privately using the SQL below.
- Email-code authentication uses the already installed Supabase client, rather than reusing the website's hidden chat password login. It has a separate browser storage key and does not modify that login.

## Owner setup required before voting opens

This checkout has no Enigma Supabase environment access. No production schema, auth settings or emails were changed. The account that owns Enigma's Supabase project must complete this setup:

1. Apply `db/hack-day-voting.sql` once in the existing Enigma project, then `db/hack-day-projects-review.sql`. The latter creates unpublished review candidates only. The schema deliberately leaves the event **disabled**.
2. Review `lib/hack-day-projects.json`, correcting titles/team names and consolidating duplicate project stages before accepting the shortlist. Update the JSON and review SQL together if an entry changes. Publish approved entries individually, for example:

   ```sql
   update public."HackDayProject" set published = true
   where event_id = 'hack-day-2026' and project_id = 'webdev-signal';
   ```

3. Check production environment names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The service-role key must stay server-only. No new npm runtime dependency is required.
4. In Supabase Auth, enable email sign-in/signup. Set the **Magic Link** email template to include `{{ .Token }}` so the voter receives a code. Configure production SMTP, delivery limits and an appropriate OTP expiry. Default development email delivery is unsuitable for opening to all students. See [Supabase email OTP documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless).
5. Confirm the intended opening and closing times. The initial proposed opening is October 22, 2026 at **00:00 IST**. No closing time was provided, so it is null; the organiser must set it. Use explicit timezone offsets.
6. Deploy and perform the launch test below. Then explicitly open the event:

   ```sql
   update public."HackDayEvent"
   set enabled = true,
       opens_at = '2026-10-22 00:00:00+05:30'
       -- Set closes_at to the confirmed closing timestamp before launch.
   where id = 'hack-day-2026';
   ```

The API and database both fail closed when configuration is absent. A missing database leaves the real gallery browsable and explains that voting awaits setup. There is no pretend successful vote or local-storage voting fallback.

## Launch verification

Use a separate staging Supabase project for test votes; votes are final and no reset endpoint is provided.

1. Check desktop and mobile gallery, search, domain filters, all source links and keyboard focus.
2. Receive a real email code, verify it and confirm one vote. Reload and sign in on another device: the same choice remains, with other voting buttons disabled.
3. Send two concurrent votes from the same verified email: exactly one succeeds; the other returns 409. Test another verified email independently.
4. Confirm POST rejects forged tokens, anonymous/unverified users, unknown/unpublished IDs, cross-origin requests, disabled events, dates before opening and dates at/after closing.
5. Inspect public network responses and query the tables with anon/authenticated keys: no votes, counts or voter identities should be accessible. Normal responses must not be cached.
6. Check production SMTP delivery and quota. Monitor launch logs; never log tokens, codes or email addresses.

A build without environment configuration stops at page-data collection because the pre-existing admin/chat routes eagerly require Supabase settings. For the local launch exercise, `tests/hack-day-local-supabase.mjs` provides an isolated HTTP contract fixture backed by real PostgreSQL (PGlite). It accepts only `@example.test` voters, uses the explicit test OTP `123456`, and sends **no emails**. Run it with `node tests/hack-day-local-supabase.mjs`; it binds only to `127.0.0.1:54401`.

The local build/browser test uses process-only environment values pointing at that fixture. Those values must never be deployed, stored as production credentials, or treated as evidence that production SMTP/Supabase is working. The fixture deliberately approves its test ballot; production setup still requires the organiser shortlist and explicit event enablement.

`npm test` includes route regression checks; database constraint tests exercise the SQL separately. Local route tests cannot establish production email delivery or live credentials.

For deployment diagnostics, installing the official CLI with `npm i -g vercel` enables `vercel env pull`, `vercel deploy` and `vercel logs`; it still requires the owner's project access. Do not commit pulled secrets.

## Reproduce the isolated local launch test

This fixture is for development only. Start it in one terminal from the repository root:

```powershell
node tests/hack-day-local-supabase.mjs
```

In a second terminal, set process-only test values, then start Next.js on port 3004:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54401'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = 'enigma-local-anon-test-key'
$env:SUPABASE_SERVICE_ROLE_KEY = 'enigma-local-service-test-key'
$env:RESEND_API_KEY = 're_local_test_only'
$env:NEXT_PUBLIC_PUSHER_CLUSTER = 'mt1'
$env:PUSHER_APP_ID = '0'
$env:PUSHER_SECRET = 'local-test-only'
$env:JWT_SECRET = 'enigma-local-test-session-secret-only'
npm run dev -- -p 3004
```

Open `http://localhost:3004/hack-day`. Use an address such as `student@example.test` and the test code `123456`. The contract fixture rejects real email domains and sends no emails. Its service key is a literal test value and authorizes only the loopback fixture, not any real Supabase project. Close these terminals when finished; never copy their environment into Vercel.

With the fixture and app running, `npm run test:hack-day:http` exercises the HTTP flow. Browser checks additionally cover code entry/errors, project selection, cancelling confirmation, saving a vote and restoring it after reload. `npm test` also executes the real SQL constraint and privacy tests.

For a production-mode local test, run `npm run build` and `npm run start -- -p 3004` in the same process-only test environment instead of `npm run dev`. A successful local fixture run proves application wiring and SQL behavior; it does **not** establish production email delivery, Supabase settings or voter eligibility.

## Existing dependency findings

The October 22 launch review patches Next.js to 15.5.28 and aligns eslint-config-next to the same patch. The lockfile also refreshes tar to 7.5.22 and ws to 8.22.0 within their existing version ranges. These changes remove the two critical findings from the previous audit, including the unauthenticated image-optimization RCE fixed in the [official Next.js 15.5.28 security release](https://github.com/vercel/next.js/releases/tag/v15.5.28).

The explicit registry audit after these patches reports **zero critical, 21 high and six moderate findings**. Remaining findings include transitive PostCSS/sharp/Resend dependencies and lint/glob tooling; this is not a clean audit or a guarantee of application security. No forced framework downgrade, Next.js major migration, or untested transitive override was applied to hide those findings. PGlite remains development-only and is not among the reported vulnerable packages.

## Private tally (owner SQL console only)

```sql
select project_id, count(*) as votes
from public."HackDayVote"
where event_id = 'hack-day-2026'
group by project_id order by votes desc, project_id;
```

Do not add this query to a public endpoint. The current user request is to keep vote counts hidden.

## Files

`app/hack-day/` contains the page and scoped UI; `app/api/hack-day/route.js` validates votes; `lib/hack-day-projects.json` holds the source inventory; `db/` holds owner-run setup and review SQL; `tests/hack-day*` covers the API and database rules.

## Verified local results (October 22)

- All 31 unit, component-state and PostgreSQL tests pass.
- Lint passes with zero errors and nine existing warnings.
- The complete optimized production build succeeds with the isolated process-only test environment, including all 28 static pages.
- The optimized app passes the actual HTTP integration checks: forged/cross-origin rejection, concurrent duplicate voting, saved-choice persistence and no public tallies.
- The real browser journey passes against the local fixture: wrong-code recovery, verified sign-in, project selection, cancellation focus, vote confirmation and persistence after reload. Desktop and 390px mobile checks pass; the new homepage button opens /hack-day without horizontal overflow.
- No production Supabase changes, email deliveries, real votes, merge or deployment were performed. A push does not provision the organiser's database/auth settings.
