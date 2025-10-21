import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SignJWT } from "jose";
import { createBoxSession } from "@/lib/session-protection";

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    const { data: user, error } = await supabase
      .from("SecretUser")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      // console.error("User not found error:", error);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // Check if code matches
    const submittedCode = String(code).trim();
    const storedCode = String(user.verificationCode).trim();

    if (submittedCode === storedCode) {
      const { error: verifyError } = await supabase
        .from("SecretUser")
        .update({
          isVerified: true,
          verificationCode: null,
        })
        .eq("email", email);

      if (verifyError) throw verifyError;

      // Create JWT token for auto-login
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({
        userId: user.id,
        email: user.email,
        username: user.username,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .sign(secret);

      // Create new box session
      const newBoxSession = createBoxSession();

      const response = NextResponse.json({ success: true });

      // Set both cookies
      response.cookies.set("secret_auth", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400,
      });

      response.cookies.set("box-session", newBoxSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600,
      });

      return response;
    } else {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }
  } catch (error) {
    // console.error("Verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
