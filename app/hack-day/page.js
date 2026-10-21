"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ArrowUpRight, Check, FolderCode, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import inventory from "@/lib/hack-day-projects.json";
import styles from "./voting.module.css";

const domains = ["All projects", "AI/ML", "SysCom", "GameDev", "WebDev", "Theoretical & Math"];
let authClient;
function emailAuth() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  authClient ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { storageKey: "enigma-hack-day-auth", detectSessionInUrl: false },
  });
  return authClient;
}

export default function HackDayPage() {
  const [ballot, setBallot] = useState({ projects: inventory, ready: false, open: false, vote: null });
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [domain, setDomain] = useState("All projects");
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const confirmation = useRef(null);
  const ballotHeading = useRef(null);
  const codeInput = useRef(null);
  const choiceButton = useRef(null);
  const requestVersion = useRef(0);
  const activeSession = useRef(null);
  const [now, setNow] = useState(() => Date.now());
  const [resendAt, setResendAt] = useState(0);

  const load = useCallback(async (token) => {
    const version = ++requestVersion.current;
    try {
      const response = await fetch("/api/hack-day", { cache: "no-store", signal: AbortSignal.timeout(15000), headers: token ? { Authorization: "Bearer " + token } : {} });
      if (!response.ok) throw new Error("The ballot could not be loaded. Please refresh the ballot.");
      const next = await response.json();
      if (version === requestVersion.current) { setBallot(next); setNow(Date.now()); }
    } catch (failure) {
      if (version === requestVersion.current) setError(failure.name === "TimeoutError" ? "The ballot request timed out. Please refresh the ballot." : failure.message);
    } finally { if (version === requestVersion.current) setLoading(false); }
  }, []);

  useEffect(() => {
    let subscription;
    try {
      const client = emailAuth();
      if (!client) { load(); return; }
      ({ data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
        if (activeSession.current?.user.id !== next?.user.id) {
          setSelected(null);
          setBallot((previous) => ({ ...previous, vote: null, open: false }));
          setLoading(true);
        }
        activeSession.current = next;
        setSession(next);
        load(next?.access_token);
      }));
    } catch {
      setError("Email verification is unavailable. Please contact the organiser.");
      load();
    }
    return () => subscription?.unsubscribe();
  }, [load]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") load(activeSession.current?.access_token); };
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [load]);

  useEffect(() => {
    if (!codeSent && !ballot.closesAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [codeSent, ballot.closesAt]);

  useEffect(() => { if (selected) confirmation.current?.focus(); }, [selected]);
  useEffect(() => { if (codeSent) codeInput.current?.focus(); }, [codeSent]);
  useEffect(() => { if (ballot.vote) ballotHeading.current?.focus(); }, [ballot.vote]);

  async function authenticate(event, resend = false) {
    event.preventDefault();
    if (busy || (resend && Date.now() < resendAt)) return;
    setBusy(true); setError("");
    try {
      const client = emailAuth();
      if (!client) throw new Error("Email verification is awaiting organiser setup.");
      const address = email.trim().toLowerCase();
      const verifying = codeSent && !resend;
      const result = verifying
        ? await client.auth.verifyOtp({ email: address, token: code.trim(), type: "email" })
        : await client.auth.signInWithOtp({ email: address });
      if (result.error) throw result.error;
      if (!verifying) { setCodeSent(true); setResendAt(Date.now() + 60000); setNow(Date.now()); }
      else { setCode(""); setCodeSent(false); }
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true); setError("");
    try {
      const result = await emailAuth().auth.signOut();
      if (result.error) throw result.error;
      setSelected(null);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function castVote() {
    if (busy || !selected) return;
    setBusy(true); setError("");
    requestVersion.current++;
    const identity = activeSession.current?.user.id;
    try {
      const { data, error: sessionError } = await emailAuth().auth.getSession();
      if (sessionError || !data?.session) {
        await emailAuth().auth.signOut({ scope: "local" });
        throw new Error("Your session expired. Please verify your email again.");
      }
      const response = await fetch("/api/hack-day", {
        method: "POST", signal: AbortSignal.timeout(15000), headers: { "Content-Type": "application/json", Authorization: "Bearer " + data.session.access_token },
        body: JSON.stringify({ projectId: selected.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) await emailAuth().auth.signOut({ scope: "local" });
        throw new Error(result.error || "Your vote could not be saved. Refresh the ballot before retrying.");
      }
      requestVersion.current++;
      if (identity === activeSession.current?.user.id) setBallot((previous) => ({ ...previous, vote: result.projectId }));
      setSelected(null);
    } catch (failure) {
      await load(activeSession.current?.access_token);
      setError(failure.name === "TimeoutError" || failure.name === "TypeError" ? "The connection was interrupted. The ballot has been refreshed; check whether your vote was recorded before retrying." : failure.message);
    } finally { setBusy(false); }
  }

  const votingOpen = ballot.ready && ballot.open && (!ballot.opensAt || now >= Date.parse(ballot.opensAt)) && (!ballot.closesAt || now < Date.parse(ballot.closesAt));
  const resendWait = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const visible = ballot.projects.filter((project) => (domain === "All projects" || domain === project.domain)
    && `${project.name} ${project.author} ${project.description}`.toLowerCase().includes(query.toLowerCase()));
  const chosen = ballot.projects.find((project) => project.id === ballot.vote);

  return (
    <main className={styles.desktop}>
      <a href="#projects" className={styles.skip}>Skip to projects</a>
      <div className={styles.wallpaper} aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <span key={i}>{"01000101 01001110 01001001 01000111 01001101 01000001  ".repeat(5)}</span>)}</div>
      <div className={styles.topline}><Link href="/">ENIGMA / MU</Link><span>HACK DAY · OCTOBER 2026</span></div>
      <section className={styles.window} aria-label="Hack Day voting portal">
        <header className={styles.titlebar}><span><FolderCode size={17} /> Enigma — Hack Day Voting</span><span aria-hidden="true">_ &nbsp; □ &nbsp; ×</span></header>
        <nav className={styles.menubar} aria-label="Event navigation"><Link href="/">Enigma home</Link><Link href="/hacktober">Hacktober</Link><a href="#projects">Browse projects</a><a href="#your-ballot">Your ballot</a></nav>
        <div className={styles.workspace}>
          <aside className={styles.sidebar}>
            <div className={styles.brand}><FolderCode size={30} /><div><strong>HACK DAY</strong><small>THE COMMUNITY BALLOT</small></div></div>
            <fieldset className={styles.group}><legend>Project directory</legend><nav aria-label="Filter by domain">{domains.map((item) => <button key={item} type="button" aria-pressed={domain === item} className={domain === item ? styles.active : ""} onClick={() => setDomain(item)}><FolderCode size={16} />{item}</button>)}</nav></fieldset>
            <fieldset className={styles.group}><legend>Voting rules</legend><p><ShieldCheck size={17} /> One verified email, one vote.</p><p><LockKeyhole size={17} /> Vote totals stay private.</p><p>Your vote is final. Explore the source before choosing.</p></fieldset>
            <a className={styles.source} href="https://github.com/MU-Enigma" target="_blank" rel="noopener noreferrer">MU-Enigma on GitHub <ArrowUpRight size={15} /></a>
          </aside>
          <div className={styles.content}>
            <div className={styles.address}><span>Address</span><code>C:\ENIGMA\HACK_DAY\VOTE</code></div>
            <div className={styles.body}>
              <section className={styles.hero}>
                <div><p className={styles.eyebrow}>BUILT BY STUDENTS. CHOSEN BY YOU.</p><h1>GOOD CODE.<br />GREAT IDEAS.<br /><span>YOUR CALL.</span></h1><p>Explore what students built. Open the repositories, meet the projects, and give your favourite one your vote.</p><a href="#projects" className={styles.primary}>Explore the projects <ArrowUpRight size={16} /></a></div>
                <div className={styles.ballotArt} aria-hidden="true"><div className={styles.paper}><span>ENIGMA</span><i /><i /><i /><b>✓</b></div><div className={styles.box}>YOUR VOICE<br /><strong>COUNTS.</strong></div></div>
              </section>

              <section id="your-ballot" className={styles.account} aria-labelledby="ballot-title">
                <div><p className={styles.eyebrow}>YOUR BALLOT</p><h2 ref={ballotHeading} tabIndex={-1} id="ballot-title">{ballot.vote ? "Vote recorded. Thank you!" : session ? "You're verified. Make it count." : "One email. One vote."}</h2><p>{ballot.vote ? `Your choice: ${chosen?.name || "your selected project"}. Counts stay private.` : "Verify your email with a code. No new password to remember."}</p></div>
                {session ? <div className={styles.signedIn}><span><Check size={16} /> {session.user.email}</span><button className={styles.button} disabled={busy} onClick={signOut}>Sign out</button></div>
                  : <form className={styles.login} onSubmit={authenticate}>
                    <label htmlFor="voter-email">Email address</label><input id="voter-email" type="email" autoComplete="email" required maxLength={254} value={email} readOnly={codeSent} onChange={(event) => setEmail(event.target.value)} />
                    {codeSent && <><label htmlFor="voter-code">Code from your email</label><input ref={codeInput} id="voter-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value)} /><p role="status">Check your inbox for the six-digit code.</p></>}
                    <div className={styles.actions}><button className={styles.button} disabled={busy || (!codeSent && !votingOpen)} type="submit">{busy ? "Please wait…" : codeSent ? "Verify email" : "Send verification code"}</button>{codeSent && <><button className={styles.button} type="button" disabled={busy || resendWait > 0 || !votingOpen} onClick={(event) => authenticate(event, true)}>{resendWait > 0 ? "Resend in " + resendWait + "s" : "Resend code"}</button><button className={styles.button} type="button" disabled={busy} onClick={() => { setCodeSent(false); setCode(""); setError(""); }}>Change email</button></>}</div>
                  </form>}
              </section>

              {!loading && !votingOpen && <div className={styles.notice} role="status"><LockKeyhole size={19} /><p>{!ballot.ready ? "Gallery preview. The organiser is reviewing the ballot; voting is not open yet." : ballot.closesAt && Date.parse(ballot.closesAt) <= now ? "Voting has closed. Thank you for supporting the projects." : "Voting is not open yet. You can explore the approved projects below."}</p></div>}
              {error && <div className={styles.error} role="alert">{error} <button className={styles.button} onClick={() => { setError(""); load(session?.access_token); }}>Refresh ballot</button></div>}

              {selected && !ballot.vote && <section ref={confirmation} tabIndex={-1} className={styles.confirm} aria-label="Confirm your vote"><p className={styles.eyebrow}>FINAL CHECK</p><h2>Vote for {selected.name}?</h2><p>You get one vote across all projects. This choice cannot be changed.</p><div className={styles.actions}><button className={styles.primary} disabled={busy || !votingOpen} onClick={castVote}>{busy ? "Saving your vote…" : "Confirm my vote"}</button><button className={styles.button} disabled={busy} onClick={() => { setSelected(null); choiceButton.current?.focus(); }}>Keep exploring</button></div></section>}

              <section id="projects" className={styles.projects} aria-labelledby="project-title">
                <div className={styles.directoryHeader}><div><p className={styles.eyebrow}>{ballot.ready ? "THE BALLOT" : "SUBMISSION GALLERY"}</p><h2 id="project-title">Find your favourite.</h2></div><span>{visible.length} {visible.length === 1 ? "project" : "projects"}{!ballot.ready && " · awaiting ballot review"}</span></div>
                <label className={styles.search}><Search size={18} /><span className={styles.srOnly}>Search projects</span><input type="search" placeholder="Search projects or contributors…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
                {loading && <p role="status">Loading the ballot…</p>}
                <div className={styles.grid}>{visible.map((project, index) => <article className={styles.card} key={project.id}>
                  <div className={styles.cardbar}><span>PROJECT_{String(index + 1).padStart(2, "0")}</span><span>{project.domain}</span></div>
                  <div className={styles.cardbody}><div className={styles.projectIcon}><FolderCode size={29} /></div><h3>{project.name}</h3><p className={styles.author}>By {project.author}</p><p className={styles.description}>{project.description}</p><div className={styles.cardactions}><a href={project.url} target="_blank" rel="noopener noreferrer" className={styles.button}>View source <ArrowUpRight size={15} /></a><button className={ballot.vote === project.id ? styles.primary : styles.button} disabled={loading || !votingOpen || !session || !!ballot.vote || busy} onClick={(event) => { choiceButton.current = event.currentTarget; setSelected(project); setError(""); }}>{ballot.vote === project.id ? <><Check size={16} /> Your vote</> : "Choose project"}</button></div></div>
                </article>)}</div>
                {!visible.length && <p className={styles.empty}>{ballot.ready && !ballot.projects.length ? "The organiser has not published the project shortlist yet." : "No projects match. Try another search or domain."}</p>}
              </section>
            </div>
          </div>
        </div>
        <footer className={styles.statusbar}><span>{loading ? "Loading ballot" : ballot.vote ? "Vote saved" : votingOpen ? "Voting open" : "Browse mode"}</span><span>{ballot.projects.length} projects</span><span>Vote counts private</span></footer>
      </section>
      <footer className={styles.desktopFooter}><Link href="/">ENIGMA</Link><p>Mahindra University · Built by students. Chosen by you.</p><a href="https://github.com/MU-Enigma/Hacktoberfest26-WebDev-Challenges" target="_blank" rel="noopener noreferrer">UI inspired by SIGNAL ↗</a></footer>
    </main>
  );
}
