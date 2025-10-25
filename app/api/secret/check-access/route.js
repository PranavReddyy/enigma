import { NextResponse } from "next/server";
import { validateBoxSession } from "@/lib/session-protection";

export async function GET(request) {
  const sessionToken = request.cookies.get("box-session")?.value;

  if (!validateBoxSession(sessionToken)) {
    return NextResponse.json({ hasAccess: false }, { status: 403 });
  }

  return NextResponse.json({ hasAccess: true });
}
