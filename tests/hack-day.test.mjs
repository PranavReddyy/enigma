import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import crypto from "node:crypto";

const projects = JSON.parse(await readFile(new URL("../lib/hack-day-projects.json", import.meta.url), "utf8"));

async function setup({ configured = true, user = { email: "voter@example.com", email_confirmed_at: "2026-10-21" }, insertError = null, enabled = true, vote = null, queryError = null } = {}) {
  const writes = [];
  const db = {
    auth: { getUser: async (token) => ({ data: { user: token === "valid" ? user : null }, error: null }) },
    from(table) {
      return {
        select() { return this; }, eq() { return this; },
        async maybeSingle() { return { data: table === "HackDayEvent" ? { enabled, opens_at: "2026-10-01T00:00:00Z", closes_at: null } : vote ? { project_id: vote } : null, error: queryError }; },
        then(resolve) { return Promise.resolve({ data: [{ project_id: projects[0].id }], error: queryError }).then(resolve); },
        async insert(value) { writes.push(value); return { error: insertError }; },
      };
    },
  };
  const context = vm.createContext({ process: { env: configured ? { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "server-only" } : {} }, Date, Set, URL });
  const dependencies = {
    "next/server": { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    "@supabase/supabase-js": { createClient: () => db },
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
  return { route: routeModule.namespace, writes };
}

const request = (body = { projectId: projects[0].id }, token = "valid", origin = "https://www.mu-enigma.org") => ({
  url: "https://www.mu-enigma.org/api/hack-day", headers: new Headers({ origin, authorization: `Bearer ${token}` }), json: async () => body,
});

test("discovered source links are unique, from the five tracked repositories, and contain no starter-only entries", () => {
  assert.equal(new Set(projects.map((project) => project.id)).size, projects.length);
  assert.equal(new Set(projects.map((project) => project.domain)).size, 5);
  for (const project of projects) {
    assert.match(project.url, /^https:\/\/github\.com\/MU-Enigma\/Hacktoberfest(?:26|2026)-/);
    assert.ok(project.author && project.name && project.description);
    assert.ok(!/lunch-lab|datasets|artifacts/.test(project.url));
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
