import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { validateBoxSession, createBoxSession } from "@/lib/session-protection";

export async function POST(request) {
  try {
    const sessionToken = request.cookies.get("box-session")?.value;
    const existingAuth = request.cookies.get("secret_auth")?.value;

    // Allow access if they have a valid box session OR are re-authenticating
    const hasValidBoxSession = validateBoxSession(sessionToken);

    // For re-authentication, we should be more lenient
    if (!hasValidBoxSession && !existingAuth) {
      // Check if this is a legitimate re-login attempt by checking if user exists
      const body = await request.clone().json();
      const { email } = body;

      if (email) {
        const { data: user } = await supabase
          .from("SecretUser")
          .select("id")
          .eq("email", email)
          .single();

        // If user exists but doesn't have valid sessions, auto-grant box access
        if (user) {
          // This is a legitimate user trying to re-login, grant box access
          // console.log("Auto-granting box access for re-login attempt");
        } else {
          return NextResponse.json(
            { error: "Access denied. Please visit the proper entry point." },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Access denied. Please visit the proper entry point." },
          { status: 403 }
        );
      }
    }

    const { email, password } = await request.json();

    const { data: user, error } = await supabase
      .from("SecretUser")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // CRITICAL: Check if user is verified BEFORE password check
    if (!user.isVerified) {
      // Auto-grant box access for unverified users so they can verify
      const boxSessionToken = createBoxSession();
      const response = NextResponse.json(
        {
          error:
            "Please verify your email first. Check your inbox for the verification code.",
        },
        { status: 403 }
      );

      response.cookies.set("box-session", boxSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600, // 1 hour
      });

      return response;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Only create auth tokens for verified users
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      username: user.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret);

    // Auto-grant box access for authenticated users
    const boxSessionToken = createBoxSession();

    const response = NextResponse.json({ success: true });

    // Set both auth and box session cookies
    response.cookies.set("secret_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 24 hours
    });

    response.cookies.set("box-session", boxSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // 1 hour
    });

    return response;
  } catch (error) {
    // console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
