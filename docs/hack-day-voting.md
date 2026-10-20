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

`npm run build` compiles successfully, but page-data collection is blocked locally by missing existing Supabase environment variables in the old admin/chat routes. No credentials were fabricated to bypass that failure.

`npm test` includes route regression checks; database constraint tests exercise the SQL separately. Local route tests cannot establish production email delivery or live credentials.

For deployment diagnostics, installing the official CLI with `npm i -g vercel` enables `vercel env pull`, `vercel deploy` and `vercel logs`; it still requires the owner's project access. Do not commit pulled secrets.

## Existing dependency findings

The October 21 npm audit reports existing vulnerabilities, including a critical advisory affecting Next.js 15.5.9 and a critical transitive tar advisory. The new PGlite package is development-only and is not one of the reported vulnerable packages. Resolve the framework/dependency advisories before public launch; this feature does not claim the existing application is security-audited.

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
