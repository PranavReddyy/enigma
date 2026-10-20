import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import projects from "@/lib/hack-day-projects.json";

export const dynamic = "force-dynamic";
const EVENT = "hack-day-2026";
const headers = { "Cache-Control": "private, no-store" };
const json = (body, status = 200) => NextResponse.json(body, { status, headers });

function database() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function voter(db, request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  const user = data?.user;
  if (error || !user?.email_confirmed_at || !user.email || user.is_anonymous) return null;
  return createHash("sha256").update(user.email.trim().toLowerCase()).digest("hex");
}

export async function GET(request) {
  const db = database();
  const unavailable = () => json({ projects, ready: false, open: false, vote: null,
    message: "Browse the submissions. Voting is awaiting organiser setup and ballot approval." });
  if (!db) return unavailable();
  try {
    const { data: event, error } = await db.from("HackDayEvent").select("enabled,opens_at,closes_at").eq("id", EVENT).maybeSingle();
    if (error || !event) return unavailable();
    const { data: ballot, error: ballotError } = await db.from("HackDayProject").select("project_id").eq("event_id", EVENT).eq("published", true);
    if (ballotError) return unavailable();
    const ids = new Set(ballot.map((row) => row.project_id));
    let vote = null;
    const key = await voter(db, request);
    if (key) {
      const { data, error: voteError } = await db.from("HackDayVote").select("project_id").eq("event_id", EVENT).eq("voter_key", key).maybeSingle();
      if (voteError) return unavailable();
      vote = data?.project_id ?? null;
    }
    const now = Date.now();
    const open = event.enabled && now >= Date.parse(event.opens_at) && (!event.closes_at || now < Date.parse(event.closes_at));
    return json({ projects: projects.filter((project) => ids.has(project.id)), ready: true, open,
      opensAt: event.opens_at, closesAt: event.closes_at, vote });
  } catch {
    return unavailable();
  }
}

export async function POST(request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Please vote from the Enigma website." }, 403);
  const db = database();
  if (!db) return json({ error: "Voting is not configured yet. Please try again later." }, 503);
  try {
    const key = await voter(db, request);
    if (!key) return json({ error: "Verify your email before voting." }, 401);
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid vote." }, 400); }
    if (!projects.some((project) => project.id === body?.projectId)) return json({ error: "Unknown project." }, 400);
    const { error } = await db.from("HackDayVote").insert({ event_id: EVENT, voter_key: key, project_id: body.projectId });
    if (error?.code === "23505") return json({ error: "You have already voted. Each verified email gets one vote." }, 409);
    if (error?.code === "23514") return json({ error: "Voting is closed or this project is not on the approved ballot." }, 403);
    if (error) return json({ error: "Your vote could not be saved. Please try again." }, 503);
    return json({ voted: true, projectId: body.projectId });
  } catch {
    return json({ error: "Voting is temporarily unavailable. Please try again." }, 503);
  }
}
