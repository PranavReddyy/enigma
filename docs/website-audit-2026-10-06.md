# Website update audit — 6 October 2026

## Verified

- Homepage entry, Hacktober navigation, terminal `hacktober` command, and cross-page FAQ link.
- Real GitHub data through the local API and dashboard: SysCom four merged PRs, two contributors; sapph-h three, architmishra-15 one. All five configured repositories responded.
- Desktop leaderboard and mobile layout at 390 × 844; search, sorting, menu open/close, and scroll unlock after navigation.
- GameCon archive renders with six closed-registration labels and all local images loading.
- Live Events page renders without browser console errors; no events currently listed.
- Tracking tests cover REST/GraphQL pagination, merged-only counts, unique contributors, authentication fallback, partial failures, shared requests, cache expiry, deleted authors, and signed webhook filtering.
- Full lint includes JSX and has zero errors. Existing image optimization and hook dependency warnings remain.

## Fixed during audit

- Deleted-account merged PRs no longer disappear from overall totals.
- Terminal defaults work without the command API; stale database/cache Hacktober text cannot replace current event instructions.
- Header and footer homepage anchors work from other pages.
- Homepage animation no longer places the admin panel inside an AnimatePresence configured for one child.
- Failed external sponsor logos display their brand name.
- Historical GameCon registration prompts now clearly indicate the 2025 edition is closed.
- Updated changelog and accessible leaderboard search label.
- Added npm test and GitHub Actions lint/test checks for future pull requests.

## Limits and deployment requirements

- Production build compiles, but page-data collection fails locally because Supabase environment variables are absent. Auth, chat, admin, and database-backed Events require the real configured environment for end-to-end validation.
- Production GitHub fetch error cannot be diagnosed conclusively without server logs. Configure a valid server-only GITHUB_TOKEN with repository read access for reliable quota; anonymous fallback has lower rate limits.
- Pusher webhook delivery needs production keys and repository webhook configuration. Polling does not depend on Pusher.
- Shared cache is per server instance and expires after 45 seconds. The browser polls every minute; counts can lag a merge by a polling/cache window and GitHub visibility delay.
- PR #11 merged during the audit. Follow-up PR #12 contains the remaining audit fixes and awaits merging; its Vercel preview requires team authorization.

No assertion that the entire website is bug-free is made. Verified behavior and unverified integrations are separated above.
