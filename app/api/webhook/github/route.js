import { NextResponse } from "next/server";
import crypto from "crypto";
import { pusher } from "@/lib/pusher";

import { REPO_COMMITTEE_MAP, HACKTOBER_ORG } from "@/lib/hacktober-repositories";

const TRACKED_REPOS = Object.keys(REPO_COMMITTEE_MAP);

export async function POST(request) {
  try {
    if (!process.env.GITHUB_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
    }
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    const expectedSignature = `sha256=${crypto
      .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
      .update(body)
      .digest("hex")}`;

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);

    if (payload.repository?.owner?.login === HACKTOBER_ORG && TRACKED_REPOS.includes(payload.repository.name)) {
      if (request.headers.get("x-github-event") === "pull_request" && payload.action === "closed" && payload.pull_request?.merged) {
        const prData = {
          repo: payload.repository.name,
          committee: REPO_COMMITTEE_MAP[payload.repository.name],
          user: payload.pull_request.user.login,
          title: payload.pull_request.title,
          avatar: payload.pull_request.user.avatar_url,
          merged_at: payload.pull_request.merged_at,
          organization: payload.organization?.login,
        };

        console.log("PR merged in tracked repo:", prData);

        await pusher.trigger("hacktober-stats", "pr-merged", prData);

        await pusher.trigger("hacktober-stats", "stats-update", {
          timestamp: new Date().toISOString(),
          repo: payload.repository.name,
          committee: REPO_COMMITTEE_MAP[payload.repository.name],
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
