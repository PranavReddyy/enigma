import { NextResponse } from "next/server";
import { validateBoxSession } from "@/lib/session-protection";

export async function POST(request) {
  const sessionToken = request.cookies.get("box-session")?.value;
  if (!validateBoxSession(sessionToken)) {
    return NextResponse.json(
      { error: "Access denied. Please visit the proper entry point." },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("secret_auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
  });
  return response;
}
