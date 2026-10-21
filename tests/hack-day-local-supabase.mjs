// Test-only Supabase HTTP contract fixture. Never deploy or use for real voting.
import { createServer } from "node:http";
import { createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const sessions = new Map();
const requestedEmails = new Set();
const serviceKey = "enigma-local-service-test-key";
const otp = "123456";
await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
await db.exec(await readFile(new URL("../db/hack-day-voting.sql", import.meta.url), "utf8"));
await db.exec(await readFile(new URL("../db/hack-day-projects-review.sql", import.meta.url), "utf8"));
await db.exec(`update public."HackDayEvent" set enabled = true, opens_at = now() - interval '1 hour', closes_at = now() + interval '1 hour'; update public."HackDayProject" set published = true;`);
assert.equal((await db.query('select count(*)::int as n from public."HackDayProject"')).rows[0].n, 50);

function sessionFor(email, id = randomUUID()) {
  const now = Math.floor(Date.now() / 1000);
  const user = { id, aud: "authenticated", role: "authenticated", email, email_confirmed_at: new Date().toISOString(), app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, is_anonymous: false, created_at: new Date().toISOString() };
  const head = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: id, email, aud: "authenticated", role: "authenticated", iat: now, exp: now + 3600 })).toString("base64url");
  const signature = createHmac("sha256", serviceKey).update(`${head}.${payload}`).digest("base64url");
  const value = { access_token: `${head}.${payload}.${signature}`, refresh_token: randomUUID(), token_type: "bearer", expires_in: 3600, expires_at: now + 3600, user };
  sessions.set(value.access_token, value);
  return value;
}

function reply(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:3004", "Access-Control-Allow-Headers": "authorization,apikey,x-client-info,content-type,x-supabase-api-version", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

const columns = { HackDayEvent: ["id", "enabled", "opens_at", "closes_at"], HackDayProject: ["event_id", "project_id", "published"], HackDayVote: ["event_id", "voter_key", "project_id", "created_at"] };
const server = createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") return reply(response, 200, {});
    const url = new URL(request.url, "http://127.0.0.1:54401");
    const token = request.headers.authorization?.replace(/^Bearer /, "");
    let body = {};
    if (request.method === "POST") {
      let raw = "";
      for await (const chunk of request) { raw += chunk; if (raw.length > 16384) return reply(response, 413, { message: "Test request too large" }); }
      body = JSON.parse(raw || "{}");
    }
    if (url.pathname === "/auth/v1/otp") {
      if (!/^[^@\s]+@example\.test$/.test(body.email || "")) return reply(response, 400, { msg: "Use only @example.test addresses in this fixture." });
      requestedEmails.add(body.email);
      return reply(response, 200, {});
    }
    if (url.pathname === "/auth/v1/verify") {
      if (!requestedEmails.has(body.email) || body.token !== otp || body.type !== "email") return reply(response, 403, { msg: "Invalid or expired test code", error_code: "otp_expired" });
      requestedEmails.delete(body.email);
      return reply(response, 200, sessionFor(body.email));
    }
    if (url.pathname === "/auth/v1/token") {
      const previous = [...sessions.values()].find((item) => item.refresh_token === body.refresh_token);
      return previous ? reply(response, 200, sessionFor(previous.user.email, previous.user.id)) : reply(response, 401, { msg: "Invalid refresh token" });
    }
    if (url.pathname === "/auth/v1/user") return sessions.has(token) ? reply(response, 200, sessions.get(token).user) : reply(response, 401, { msg: "Invalid test token" });
    if (url.pathname === "/auth/v1/logout") { sessions.delete(token); return reply(response, 200, {}); }
    if (request.method === "GET" && ["/rest/v1/Command", "/rest/v1/Message"].includes(url.pathname)) return reply(response, 200, []);
    if (request.headers.apikey !== serviceKey) return reply(response, 403, { message: "Private tables" });
    if (url.pathname === "/__test__/state") return reply(response, 200, { votes: (await db.query('select project_id from public."HackDayVote"')).rows });
    const table = url.pathname.replace("/rest/v1/", "");
    if (!columns[table]) return reply(response, 404, { message: "Unknown test endpoint" });
    if (request.method === "POST" && table === "HackDayVote") {
      await db.query('insert into public."HackDayVote" (event_id,voter_key,project_id) values ($1,$2,$3)', [body.event_id, body.voter_key, body.project_id]);
      return reply(response, 201, null);
    }
    if (request.method !== "GET") return reply(response, 405, {});
    const selected = (url.searchParams.get("select") || "*").split(",");
    if (selected.some((column) => column !== "*" && !columns[table].includes(column))) return reply(response, 400, { message: "Unknown projection" });
    const args = [], predicates = [];
    for (const [column, filter] of url.searchParams) {
      if (column === "select") continue;
      if (!columns[table].includes(column) || !filter.startsWith("eq.")) return reply(response, 400, { message: "Unsupported test filter" });
      args.push(filter.slice(3)); predicates.push(`"${column}" = $${args.length}`);
    }
    const projection = selected.map((column) => column === "*" ? "*" : `"${column}"`).join(",");
    const result = await db.query(`select ${projection} from public."${table}"${predicates.length ? ` where ${predicates.join(" and ")}` : ""}`, args);
    if (request.headers.accept?.includes("vnd.pgrst.object")) return result.rows.length === 1 ? reply(response, 200, result.rows[0]) : reply(response, 406, { code: "PGRST116", message: "Expected one row", details: "The result contains 0 rows" });
    return reply(response, 200, result.rows);
  } catch (error) { reply(response, error.code === "23505" ? 409 : 400, { code: error.code || "TEST_ERROR", message: error.message }); }
});

server.listen(54401, "127.0.0.1", () => console.log("Local test fixture on http://127.0.0.1:54401; only @example.test voters; test OTP 123456. No emails are sent."));
async function stop() { server.close(); await db.close(); process.exit(0); }
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
