import { NextResponse } from "next/server";
import { createBoxSession } from "@/lib/session-protection";
import { jwtVerify } from "jose";

export async function POST(request) {
  try {
    const { counter } = await request.json();

    // Check if user is authenticated (alternative access method)
    const authToken = request.cookies.get("secret_auth")?.value;
    let isAuthenticated = false;

    if (authToken) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(authToken, secret);
        isAuthenticated = true;
      } catch (error) {
        // Token invalid, proceed with counter check
      }
    }

    // Verify they either reached 649 OR are authenticated
    if (counter !== 649 && !isAuthenticated) {
      return NextResponse.json({ error: "Invalid access" }, { status: 403 });
    }

    // Create cryptographically signed session token
    const signedSessionToken = createBoxSession();

    const response = NextResponse.json({
      success: true,
      message: "Box access granted",
      method: isAuthenticated ? "authenticated" : "counter",
    });

    // Set session cookie with signed token
    response.cookies.set("box-session", signedSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
}
