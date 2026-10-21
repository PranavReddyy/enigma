// Explicit local integration test; never sends email or votes to production.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const app = "http://localhost:3004";
const auth = "http://127.0.0.1:54401";
assert.equal((await fetch(auth + "/rest/v1/Command")).status, 200);
const email = `http-${randomUUID()}@example.test`;
const send = (url, body, headers = {}) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

assert.equal((await send(`${auth}/auth/v1/otp`, { email: "not-a-real-recipient@example.com" })).status, 400);
assert.equal((await fetch(`${auth}/rest/v1/HackDayVote`, { headers: { apikey: "enigma-local-anon-test-key" } })).status, 403);
assert.equal((await send(`${auth}/auth/v1/otp`, { email })).status, 200);
const verified = await send(`${auth}/auth/v1/verify`, { email, token: "123456", type: "email" });
assert.equal(verified.status, 200);
const session = await verified.json();
const headers = { Authorization: `Bearer ${session.access_token}`, Origin: app };
const ballotResponse = await fetch(`${app}/api/hack-day`, { headers });
assert.match(ballotResponse.headers.get("cache-control"), /private.*no-store/);
const ballot = await ballotResponse.json();
assert.equal(ballot.ready, true);
assert.equal(ballot.open, true);
assert.ok(ballot.projects.length >= 2);

const [first, second] = ballot.projects;
assert.equal((await send(`${app}/api/hack-day`, { projectId: first.id }, { ...headers, Origin: "https://evil.example" })).status, 403);
assert.equal((await send(`${app}/api/hack-day`, { projectId: first.id }, { ...headers, Authorization: "Bearer forged" })).status, 401);
assert.equal((await send(`${app}/api/hack-day`, { projectId: "unknown" }, headers)).status, 400);
const concurrent = await Promise.all([first, second].map((project) => send(`${app}/api/hack-day`, { projectId: project.id }, headers)));
assert.deepEqual(concurrent.map((response) => response.status).sort(), [200, 409]);
const success = await concurrent.find((response) => response.status === 200).json();
const own = await (await fetch(`${app}/api/hack-day`, { headers })).json();
assert.equal(own.vote, success.projectId);
assert.equal((await send(`${app}/api/hack-day`, { projectId: first.id }, headers)).status, 409);

const publicBallot = await (await fetch(`${app}/api/hack-day`)).json();
assert.equal(publicBallot.vote, null);
assert.ok(!/voter_key|voteCount|totalVotes|"votes"/.test(JSON.stringify(publicBallot)));
console.log("Local HTTP integration PASS: verification contract, private ballot, forged/cross-origin rejection, concurrent one-vote enforcement, persistence and duplicate rejection. Real SMTP is not tested.");
