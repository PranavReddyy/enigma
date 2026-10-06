import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import crypto from "node:crypto";

async function loadRoute(path, { token, secret, rest, graphql, trigger, publicRest } = {}) {
  const context = vm.createContext({
    process: { env: { GITHUB_TOKEN: token, GITHUB_WEBHOOK_SECRET: secret } },
    console: { log() {}, warn() {}, error() {} }, Date, Map, Set,
  });
  const config = new vm.SourceTextModule(await readFile(new URL("../lib/hacktober-repositories.js", import.meta.url), "utf8"), { context });
  await config.link(() => { throw new Error("Unexpected config import"); });
  await config.evaluate();
  const json = (body, options) => ({ body, status: options?.status ?? 200, json: async () => body });
  const deps = {
    "next/server": { NextResponse: { json } },
    "@octokit/rest": { Octokit: class { constructor(options) { this.rest = { pulls: { list: options?.auth ? rest : (publicRest ?? rest) } }; this.graphql = graphql; } } },
    "crypto": { default: crypto },
    "@/lib/pusher": { pusher: { trigger } },
  };
  const route = new vm.SourceTextModule(await readFile(new URL(path, import.meta.url), "utf8"), { context });
  await route.link(async (name) => {
    if (name === "@/lib/hacktober-repositories") return config;
    const values = deps[name];
    assert.ok(values, `Unexpected import: ${name}`);
    const mod = new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
    return mod;
  });
  await route.evaluate();
  return { route: route.namespace, config: config.namespace };
}

const merged = (login, number) => ({ number, title: `PR ${number}`, merged_at: "2026-10-03T12:00:00Z", user: { login, avatar_url: "https://example.com/avatar.png" } });

test("REST pagination counts merged PRs and unique contributors across all five tracks", async () => {
  const requests = [];
  const { route, config } = await loadRoute("../app/api/hacktober-stats/route.js", {
    rest: async (input) => {
      requests.push(input);
      if (input.repo.endsWith("AIML-Challenges")) {
        return { data: input.page === 1
          ? Array.from({ length: 100 }, (_, i) => i === 0 ? merged("shared", 1) : { merged_at: null })
          : [merged("alice", 101)] };
      }
      if (input.repo.endsWith("Theoretical-Mathematics-Challenges")) return { data: [merged("shared", 2), merged("math-user", 3)] };
      return { data: [] };
    },
  });
  const { body, status } = await route.GET();
  assert.equal(status, 200);
  assert.equal(body.partial, false);
  assert.equal(body.committees.length, 5);
  assert.equal(body.stats.totalPRs, 4);
  assert.equal(body.stats.totalUniqueContributors, 3);
  assert.equal(body.leaderboard.find((user) => user.username === "shared").mergedPRs, 2);
  assert.equal(body.committees.find((item) => item.name === "Theoretical & Math").totalContributors, 2);
  assert.deepEqual(new Set(requests.map((r) => r.repo)), new Set(config.HACKTOBER_COMMITTEES.map((r) => r.repoName)));
  assert.ok(requests.every((r) => r.owner === "MU-Enigma" && r.state === "closed"));
  assert.equal(requests.filter((r) => r.repo.endsWith("AIML-Challenges")).length, 2);
});

test("failed repositories are reported as unavailable while successful tracks still count", async () => {
  const { route } = await loadRoute("../app/api/hacktober-stats/route.js", {
    rest: async ({ repo }) => {
      if (repo.endsWith("Theoretical-Mathematics-Challenges")) throw new Error("Not Found");
      return { data: [merged("alice", 1)] };
    },
  });
  const { body } = await route.GET();
  assert.equal(body.partial, true);
  assert.equal(body.unavailableRepositories.length, 1);
  assert.equal(body.stats.totalPRs, 4);
  assert.equal(body.committees.find((r) => r.name === "Theoretical & Math").available, false);
  assert.equal(body.committees.find((r) => r.name === "AI/ML").available, true);
});

test("authenticated GraphQL pagination includes Theoretical & Math", async () => {
  const { route } = await loadRoute("../app/api/hacktober-stats/route.js", {
    token: "test-token",
    graphql: async (_query, { repo, cursor }) => ({ repository: { pullRequests: {
      nodes: [{ title: "Contribution", author: { login: "alice", avatarUrl: "https://example.com/avatar.png" }, mergedAt: "2026-10-03T12:00:00Z" }],
      pageInfo: { hasNextPage: repo.endsWith("Theoretical-Mathematics-Challenges") && !cursor, endCursor: "page-2" },
    } } }),
  });
  const { body } = await route.GET();
  assert.equal(body.stats.totalPRs, 6);
  assert.equal(body.committees.find((r) => r.name === "Theoretical & Math").mergedPRs, 2);
});

test("signed mathematics merge webhook updates the right track and ignores other owners", async () => {
  const events = [];
  const secret = "test-secret";
  const { route } = await loadRoute("../app/api/webhook/github/route.js", { secret, trigger: async (...args) => events.push(args) });
  async function request(owner, valid = true) {
    const body = JSON.stringify({ action: "closed", repository: { owner: { login: owner }, name: "Hacktoberfest26-Theoretical-Mathematics-Challenges" }, pull_request: { merged: true, title: "Math solution", user: { login: "alice", avatar_url: "avatar" }, merged_at: "2026-10-03T12:00:00Z" } });
    const signature = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
    return route.POST({ text: async () => body, headers: new Map([["x-hub-signature-256", valid ? signature : "invalid"], ["x-github-event", "pull_request"]]) });
  }
  assert.equal((await request("MU-Enigma")).status, 200);
  assert.equal(events.length, 2);
  assert.equal(events[0][2].committee, "Theoretical & Math");
  await request("unrelated-owner");
  assert.equal(events.length, 2);
  assert.equal((await request("MU-Enigma", false)).status, 401);
});


test("GraphQL failure falls back to REST and concurrent polls share one refresh", async () => {
  let calls = 0;
  const { route } = await loadRoute("../app/api/hacktober-stats/route.js", {
    token: "test-token",
    graphql: async () => { throw new Error("GraphQL access denied"); },
    rest: async () => { calls++; return { data: [merged("real-contributor", 1), { merged_at: null }] }; },
  });
  const results = await Promise.all([route.GET(), route.GET(), route.GET()]);
  assert.equal(calls, 5);
  assert.ok(results.every(({ body }) => !body.partial && body.stats.totalPRs === 5));
  await route.GET();
  assert.equal(calls, 5);
});

test("invalid deployment token can still read public repositories", async () => {
  const { route } = await loadRoute("../app/api/hacktober-stats/route.js", {
    token: "expired-token",
    graphql: async () => { throw Object.assign(new Error("Bad credentials"), { status: 401 }); },
    rest: async () => { throw Object.assign(new Error("Bad credentials"), { status: 401 }); },
    publicRest: async ({ repo }) => ({ data: repo.includes("Systems-and-Security") ? [merged("sapph-h", 1), merged("sapph-h", 2), merged("sapph-h", 4), merged("architmishra-15", 3)] : [] }),
  });
  const { body } = await route.GET();
  assert.equal(body.partial, false);
  assert.equal(body.stats.totalPRs, 4);
  assert.equal(body.stats.totalUniqueContributors, 2);
});
