import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { transform } from "next/dist/build/swc/index.js";

const source = await readFile(new URL("../app/hack-day/page.js", import.meta.url), "utf8");
const { code } = await transform(source, { filename: "page.js", jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } }, target: "es2022" }, module: { type: "es6" } });
const project = { id: "student-project", name: "Student project", author: "Student", domain: "WebDev", description: "A student-built app", url: "https://github.com/MU-Enigma/project" };
const currentSession = { access_token: "verified-token", user: { id: "student", email: "student@example.com" } };
const response = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
const ballot = (extra = {}) => ({ projects: [project], ready: true, open: true, vote: null, ...extra });
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

async function app(fetch, { authError = null, env = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "public" } } = {}) {
  let position = 0, now = Date.parse("2026-10-22T10:00:00Z"), authChanged;
  const hooks = [], effects = [], timers = new Map(), connections = [];
  const changed = (a, b) => !a || a.length !== b.length || a.some((value, index) => value !== b[index]);
  const react = {
    useState(initial) { const index = position++; hooks[index] ??= { value: typeof initial === "function" ? initial() : initial }; return [hooks[index].value, (value) => { hooks[index].value = typeof value === "function" ? value(hooks[index].value) : value; }]; },
    useRef(value) { const index = position++; hooks[index] ??= { current: value }; return hooks[index]; },
    useCallback(value, deps) { const index = position++; if (!hooks[index] || changed(hooks[index].deps, deps)) hooks[index] = { value, deps }; return hooks[index].value; },
    useEffect(callback, deps) { const index = position++; if (!hooks[index] || changed(hooks[index].deps, deps)) { hooks[index]?.cleanup?.(); hooks[index] = { deps }; effects.push(() => { hooks[index].cleanup = callback(); }); } },
  };
  const client = { auth: {
    onAuthStateChange(callback) { authChanged = callback; return { data: { subscription: { unsubscribe() {} } } }; },
    getSession: async () => ({ data: { session: currentSession } }),
    signInWithOtp: async () => ({ error: authError }), verifyOtp: async () => ({ error: authError }),
    signOut: async () => { if (!authError) authChanged("SIGNED_OUT", null); return { error: authError }; },
  } };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const listeners = new Map();
  const surface = { addEventListener(name, callback) { listeners.set(name, callback); }, removeEventListener(name) { listeners.delete(name); }, visibilityState: "visible" };
  const context = vm.createContext({ process: { env }, fetch, Date: Clock, AbortSignal, window: surface, document: surface,
    setInterval(callback, delay) { const id = timers.size + 1; timers.set(id, { callback, delay }); return id; }, clearInterval(id) { timers.delete(id); }, setTimeout(callback) { callback(); return 1; }, clearTimeout() {} });
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    react, "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" }, "next/link": { default: "a" },
    "@supabase/supabase-js": { createClient: (...args) => { connections.push(args); return client; } }, "lucide-react": Object.fromEntries(["ArrowUpRight", "Check", "FolderCode", "LockKeyhole", "Search", "ShieldCheck"].map((name) => [name, name])),
    "@/lib/hack-day-projects.json": { default: [project] }, "./voting.module.css": { default: {} },
  };
  const route = new vm.SourceTextModule(code, { context });
  await route.link((name) => { const values = dependencies[name]; assert.ok(values, `Unexpected import: ${name}`); return new vm.SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context }); });
  await route.evaluate();
  let tree;
  const render = () => { position = 0; tree = route.namespace.default(); for (const effect of effects.splice(0)) effect(); return tree; };
  const nodes = (node) => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === "object" ? [node, ...nodes(node.props?.children)] : [];
  const text = (node) => Array.isArray(node) ? node.map(text).join("") : node && typeof node === "object" ? (node.props?.["aria-hidden"] ? "" : text(node.props?.children)) : node == null || typeof node === "boolean" ? "" : String(node);
  render();
  return { render, connections, text: () => text(tree), find: (label, type = "button") => nodes(tree).find((node) => node.type === type && text(node) === label), input: (id) => nodes(tree).find((node) => node.props?.id === id),
    auth: (session) => authChanged("SIGNED_IN", session), advance(ms) { now += ms; for (const timer of [...timers.values()]) timer.callback(); }, cleanup() { for (const hook of hooks) hook?.cleanup?.(); } };
}

test("an older anonymous request cannot overwrite the signed-in voter's saved choice", async () => {
  const pending = [];
  const ui = await app(() => new Promise((resolve) => pending.push(resolve)));
  ui.auth(null); ui.render();
  ui.auth(currentSession); ui.render();
  pending[1](response(ballot({ vote: project.id }))); await settle(); ui.render();
  pending[0](response(ballot())); await settle(); ui.render();
  assert.match(ui.text(), /Vote recorded\. Thank you!/);
  ui.cleanup();
});

test("verification codes can be resent after the provider cooldown and email can be corrected", async () => {
  const ui = await app(async () => response(ballot()));
  ui.auth(null); await settle(); ui.render();
  ui.input("voter-email").props.onChange({ target: { value: "student@example.com" } }); ui.render();
  const sourceForm = (() => {
    const walk = (node) => Array.isArray(node) ? node.flatMap(walk) : node && typeof node === "object" ? [node, ...walk(node.props?.children)] : [];
    return walk(ui.render()).find((node) => node.type === "form");
  })();
  await sourceForm.props.onSubmit({ preventDefault() {} }); ui.render();
  assert.ok(ui.find("Change email"));
  assert.equal(ui.find("Resend in 60s").props.disabled, true);
  ui.advance(61000); await settle(); ui.render();
  assert.equal(ui.find("Resend code")?.props.disabled, false);
  ui.find("Change email").props.onClick(); ui.render();
  assert.ok(!ui.input("voter-email").props.readOnly);
  ui.cleanup();
});

test("an open page closes its vote controls when the deadline passes", async () => {
  const ui = await app(async () => response(ballot({ closesAt: "2026-10-22T10:00:05Z" })));
  ui.auth(currentSession); await settle(); ui.render();
  assert.equal(ui.find("Choose project").props.disabled, false);
  ui.advance(6000); await settle(); ui.render();
  assert.equal(ui.find("Choose project").props.disabled, true);
  assert.match(ui.text(), /Voting has closed/);
  ui.cleanup();
});

test("sign-out failures are shown instead of silently ignored", async () => {
  const ui = await app(async () => response(ballot()), { authError: { message: "Sign-out unavailable" } });
  ui.auth(currentSession); await settle(); ui.render();
  await ui.find("Sign out").props.onClick(); ui.render();
  assert.match(ui.text(), /Sign-out unavailable/);
  ui.cleanup();
});


test("a background request cannot erase a vote after confirmation succeeds", async () => {
  let resolveBackground;
  let requests = 0;
  const ui = await app((_url, options = {}) => {
    if (options.method === "POST") return Promise.resolve(response({ voted: true, projectId: project.id }));
    if (++requests === 1) return Promise.resolve(response(ballot()));
    return new Promise((resolve) => { resolveBackground = resolve; });
  });
  ui.auth(currentSession); await settle(); ui.render();
  ui.advance(15000); ui.render();
  ui.find("Choose project").props.onClick({ currentTarget: { focus() {} } }); ui.render();
  await ui.find("Confirm my vote").props.onClick(); ui.render();
  resolveBackground(response(ballot())); await settle(); ui.render();
  assert.match(ui.text(), /Vote recorded\. Thank you!/);
  ui.cleanup();
});

test("a lost save response reloads the actual recorded vote before offering a retry", async () => {
  let saved = false;
  const ui = await app(async (_url, options = {}) => {
    if (options.method === "POST") { saved = true; throw new TypeError("Network response lost"); }
    return response(ballot({ vote: saved ? project.id : null }));
  });
  ui.auth(currentSession); await settle(); ui.render();
  ui.find("Choose project").props.onClick({ currentTarget: { focus() {} } }); ui.render();
  await ui.find("Confirm my vote").props.onClick(); ui.render();
  assert.match(ui.text(), /Vote recorded\. Thank you!/);
  assert.ok(!ui.find("Confirm my vote"));
  ui.cleanup();
});

test("the open page automatically discovers an organiser-opened ballot", async () => {
  let open = false;
  const ui = await app(async () => response(ballot({ open })));
  ui.auth(currentSession); await settle(); ui.render();
  assert.equal(ui.find("Choose project").props.disabled, true);
  open = true;
  ui.advance(15000); await settle(); ui.render();
  assert.equal(ui.find("Choose project").props.disabled, false);
  ui.cleanup();
});

test("cancelling vote confirmation restores focus to the chosen project", async () => {
  const ui = await app(async () => response(ballot()));
  ui.auth(currentSession); await settle(); ui.render();
  let focused = false;
  ui.find("Choose project").props.onClick({ currentTarget: { focus() { focused = true; } } }); ui.render();
  ui.find("Keep exploring").props.onClick(); ui.render();
  assert.equal(focused, true);
  assert.ok(!ui.find("Confirm my vote"));
  ui.cleanup();
});


test("a revoked session reveals email verification rather than leaving a stale signed-in form", async () => {
  const ui = await app(async (_url, options = {}) => options.method === "POST"
    ? response({ error: "Verify your email before voting." }, 401) : response(ballot()));
  ui.auth(currentSession); await settle(); ui.render();
  ui.find("Choose project").props.onClick({ currentTarget: { focus() {} } }); ui.render();
  await ui.find("Confirm my vote").props.onClick(); ui.render();
  assert.ok(ui.find("Send verification code"));
  assert.ok(!ui.find("Sign out"));
  ui.cleanup();
});


test("dedicated voting credentials use their own pair rather than the Enigma site's connection", async () => {
  const ui = await app(async () => response(ballot()), { env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://legacy.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-key",
    NEXT_PUBLIC_HACK_DAY_SUPABASE_URL: "https://voting.supabase.co", NEXT_PUBLIC_HACK_DAY_SUPABASE_ANON_KEY: "voting-key",
  } });
  assert.deepEqual(ui.connections[0].slice(0, 2), ["https://voting.supabase.co", "voting-key"]);
  ui.cleanup();
});

test("existing Enigma credentials remain the fallback when no dedicated voting connection is supplied", async () => {
  const ui = await app(async () => response(ballot()));
  assert.deepEqual(ui.connections[0].slice(0, 2), ["https://example.supabase.co", "public"]);
  ui.cleanup();
});

test("partial dedicated voting credentials never borrow the legacy site's URL or key", async () => {
  for (const dedicated of [{ NEXT_PUBLIC_HACK_DAY_SUPABASE_URL: "https://voting.supabase.co" }, { NEXT_PUBLIC_HACK_DAY_SUPABASE_ANON_KEY: "voting-key" }]) {
    const ui = await app(async () => response(ballot()), { env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://legacy.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-key", ...dedicated,
    } });
    assert.equal(ui.connections.length, 0);
    ui.cleanup();
  }
});
