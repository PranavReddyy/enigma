import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import crypto from "node:crypto";

const projects = JSON.parse(await readFile(new URL("../lib/hack-day-projects.json", import.meta.url), "utf8"));

async function setup({ environment = null, configured = true, user = { email: "voter@example.com", email_confirmed_at: "2026-10-21" }, insertError = null, enabled = true, vote = null, queryError = null, clientError = false, ballot = [{ project_id: projects[0].id }], opensAt = "2026-10-01T00:00:00Z", closesAt = null, now = Date.now() } = {}) {
  const writes = [], connections = [];
  const db = {
    auth: { getUser: async (token) => ({ data: { user: token === "valid" ? user : null }, error: null }) },
    from(table) {
      return {
        select() { return this; }, eq() { return this; },
        async maybeSingle() { return { data: table === "HackDayEvent" ? { enabled, opens_at: opensAt, closes_at: closesAt } : vote ? { project_id: vote } : null, error: queryError }; },
        then(resolve) { return Promise.resolve({ data: ballot, error: queryError }).then(resolve); },
        async insert(value) { writes.push(value); return { error: insertError }; },
      };
    },
  };
  const context = vm.createContext({ process: { env: environment ?? (configured ? { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "server-only" } : {}) }, Date: class extends Date { static now() { return now; } }, Set, URL });
  const dependencies = {
    "next/server": { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    "@supabase/supabase-js": { createClient: (...args) => { connections.push(args); if (clientError) throw new Error("Invalid supabaseUrl"); return db; } },
    "node:crypto": { createHash: crypto.createHash },
    "@/lib/hack-day-projects.json": { default: projects },
  };
  const routeModule = new vm.SourceTextModule(await readFile(new URL("../app/api/hack-day/route.js", import.meta.url), "utf8"), { context });
  await routeModule.link((name) => {
    const values = dependencies[name];
    assert.ok(values, `Unexpected import: ${name}`);
    return new vm.SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  });
  await routeModule.evaluate();
  return { route: routeModule.namespace, writes, connections };
}

const request = (body = { projectId: projects[0].id }, token = "valid", origin = "https://www.mu-enigma.org") => ({
  url: "https://www.mu-enigma.org/api/hack-day", headers: new Headers({ origin, authorization: `Bearer ${token}` }), json: async () => body,
});

test("ballot contains only the ten distinct Hack Day submissions, with matching SQL candidates", async () => {
  assert.equal(projects.length, 10);
  assert.equal(new Set(projects.map((project) => project.id)).size, 10);
  assert.equal(new Set(projects.map((project) => project.url)).size, 10);
  assert.deepEqual(projects.map((project) => Number(project.url.split("/").at(-1))).sort((a,b) => a-b), [1,2,4,5,6,7,8,9,10,11]);
  const sql = await readFile(new URL("../db/hack-day-projects-review.sql", import.meta.url), "utf8");
  const seeded = [...sql.matchAll(/\('hack-day-2026', '([^']+)', false\)/g)].map((match) => match[1]);
  assert.deepEqual(seeded.sort(), projects.map((project) => project.id).sort());
  for (const project of projects) {
    assert.match(project.url, /^https:\/\/github\.com\/MU-Enigma\/Hacktoberfest26-HackDay-Submissions\/pull\/\d+$/);
    assert.ok(project.author && project.name && project.description && project.domain);
    assert.ok(!/Challenges|webdev-signal|level-/.test(project.url + project.id));
  }
});

test("missing database fails closed while the real submission gallery remains browsable", async () => {
  const { route } = await setup({ configured: false });
  const { body } = await route.GET(request());
  assert.equal(body.open, false);
  assert.equal(body.ready, false);
  assert.equal(body.projects.length, projects.length);
  assert.equal((await route.POST(request())).status, 503);
});

test("public ballot exposes approved projects and no tallies or voter identities", async () => {
  const { route } = await setup();
  const result = await route.GET(request(undefined, "anonymous"));
  assert.equal(result.body.projects.length, 1);
  assert.equal(result.body.open, true);
  assert.equal(result.body.vote, null);
  assert.ok(!/voter_key|totalVotes|voteCount|voter@example/.test(JSON.stringify(result.body)));
  assert.equal(result.headers["Cache-Control"], "private, no-store");
});

test("the voter can read only their own choice and a disabled event remains closed", async () => {
  const { route } = await setup({ enabled: false, vote: projects[0].id });
  const { body } = await route.GET(request());
  assert.equal(body.vote, projects[0].id);
  assert.equal(body.open, false);
});

test("database read failures cannot expose a writable ballot", async () => {
  const { route } = await setup({ queryError: { code: "42P01" } });
  assert.equal((await route.GET(request())).body.open, false);
});

test("cross-origin, unsigned, anonymous and unverified voters cannot submit", async () => {
  const { route, writes } = await setup();
  assert.equal((await route.POST(request(undefined, "valid", "https://evil.example"))).status, 403);
  assert.equal((await route.POST(request(undefined, "forged"))).status, 401);
  assert.equal(writes.length, 0);
  for (const user of [{ email: "a@b.com" }, { email: "a@b.com", email_confirmed_at: "now", is_anonymous: true }]) {
    const { route } = await setup({ user });
    assert.equal((await route.POST(request())).status, 401);
  }
});

test("malformed and unknown project IDs never reach storage", async () => {
  const { route, writes } = await setup();
  for (const body of [null, {}, { projectId: "unknown" }, { projectId: [projects[0].id] }]) assert.equal((await route.POST(request(body))).status, 400);
  const broken = request(); broken.json = async () => { throw new Error("invalid JSON"); };
  assert.equal((await route.POST(broken)).status, 400);
  assert.equal(writes.length, 0);
});

test("identity comes from verified server auth, never the submitted body", async () => {
  const { route, writes } = await setup({ user: { email: "  Voter@Example.COM ", email_confirmed_at: "now" } });
  const result = await route.POST(request({ projectId: projects[0].id, voter_key: "forged" }));
  assert.equal(result.status, 200);
  assert.equal(writes[0].voter_key, crypto.createHash("sha256").update("voter@example.com").digest("hex"));
  assert.equal(result.body.projectId, projects[0].id);
});

test("duplicate votes, closed ballot and storage failures have explicit responses", async () => {
  for (const [code, status] of [["23505", 409], ["23514", 403], ["08006", 503]]) {
    const { route } = await setup({ insertError: { code } });
    assert.equal((await route.POST(request())).status, status);
  }
});

test("malformed database configuration fails closed without an unhandled route error", async () => {
  const { route } = await setup({ clientError: true });
  assert.equal((await route.GET(request())).body.open, false);
  assert.equal((await route.POST(request())).status, 503);
});

test("an enabled event with no approved known projects is not open", async () => {
  for (const ballot of [[], [{ project_id: "unknown-project" }]]) {
    const { route } = await setup({ ballot });
    const { body } = await route.GET(request());
    assert.equal(body.open, false);
    assert.equal(body.projects.length, 0);
  }
});

test("ballot opens at its opening instant and closes at its closing instant", async () => {
  const opensAt = "2026-10-22T00:00:00+05:30";
  const closesAt = "2026-10-23T00:00:00+05:30";
  for (const [now, open] of [[Date.parse(opensAt) - 1, false], [Date.parse(opensAt), true], [Date.parse(closesAt) - 1, true], [Date.parse(closesAt), false]]) {
    const { route } = await setup({ opensAt, closesAt, now });
    assert.equal((await route.GET(request())).body.open, open);
  }
});

test("dedicated voting database uses its own credentials and never mixes projects", async () => {
  const environment = { NEXT_PUBLIC_SUPABASE_URL: "https://legacy.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "legacy-secret", NEXT_PUBLIC_HACK_DAY_SUPABASE_URL: "https://voting.supabase.co", HACK_DAY_SUPABASE_SERVICE_ROLE_KEY: "voting-secret" };
  const dedicated = await setup({ environment });
  assert.equal((await dedicated.route.GET(request())).body.ready, true);
  assert.equal(dedicated.connections[0][0], environment.NEXT_PUBLIC_HACK_DAY_SUPABASE_URL);
  assert.equal(dedicated.connections[0][1], "voting-secret");
  for (const partial of [
    { NEXT_PUBLIC_HACK_DAY_SUPABASE_URL: "https://voting.supabase.co" },
    { NEXT_PUBLIC_HACK_DAY_SUPABASE_ANON_KEY: "voting-public" },
    { HACK_DAY_SUPABASE_SERVICE_ROLE_KEY: "voting-secret" },
  ]) {
    const incomplete = await setup({ environment: { NEXT_PUBLIC_SUPABASE_URL: "https://legacy.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "legacy-secret", ...partial } });
    assert.equal((await incomplete.route.GET(request())).body.ready, false);
    assert.equal((await incomplete.route.POST(request())).status, 503);
    assert.equal(incomplete.connections.length, 0);
  }
  const legacy = await setup();
  await legacy.route.GET(request());
  assert.equal(legacy.connections[0][0], "https://example.supabase.co");
  assert.equal(legacy.connections[0][1], "server-only");
});
