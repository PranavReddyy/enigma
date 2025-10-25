import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import { validateBoxSession } from "@/lib/session-protection";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const sessionToken = request.cookies.get("box-session")?.value;
    if (!validateBoxSession(sessionToken)) {
      return NextResponse.json(
        { error: "Access denied. Please visit the proper entry point." },
        { status: 403 }
      );
    }
    const { username, email, password } = await request.json();

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Username must be between 3-20 characters" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if username exists
    const { data: existingUsername } = await supabase
      .from("SecretUser")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    // Check if email exists
    const { data: existingEmail } = await supabase
      .from("SecretUser")
      .select("id")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { error: insertError } = await supabase.from("SecretUser").insert({
      username,
      email,
      password: hashedPassword,
      verificationCode,
      verificationCodeCreatedAt: new Date().toISOString(),
      isVerified: false,
    });

    if (insertError) {
      // console.error("Insert error:", insertError);
      throw insertError;
    }

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "Verify Your Email - Enigma's The Box",
      html: `
        <div style="font-family: 'MS Sans Serif', monospace; background: #c0c0c0; padding: 20px;">
          <div style="background: #0000ff; color: white; padding: 10px; font-weight: bold;">
            Enigma - Welcome to The Box
          </div>
          <div style="background: white; border: 2px solid #808080; padding: 20px; margin-top: 10px;">
            <h2 style="margin: 0 0 10px 0;">Welcome, ${username}!</h2>
            <p>Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0000ff; text-align: center; padding: 20px; background: #c0c0c0; border: 2px inset #808080;">
              ${verificationCode}
            </div>
            <p style="margin-top: 20px; color: #666;">Enter this code to verify your email and access The Box.</p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      // console.error("Resend email error:", emailError);
      return NextResponse.json({
        success: true,
        warning:
          "Account created but email failed to send. Please contact support.",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
