import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Check if user exists
    const { data: user, error } = await supabase
      .from("SecretUser")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // Generate new 6-digit code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Update user with new code
    const { error: updateError } = await supabase
      .from("SecretUser")
      .update({
        verificationCode,
        verificationCodeCreatedAt: new Date().toISOString(),
      })
      .eq("email", email);

    if (updateError) {
      //   console.error("Update error:", updateError);
      throw updateError;
    }

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Enigma <onboarding@resend.dev>",
      to: email,
      subject: "Verify Your Email - Enigma's The Box",
      html: `
        <div style="font-family: 'MS Sans Serif', monospace; background: #c0c0c0; padding: 20px;">
          <div style="background: #0000ff; color: white; padding: 10px; font-weight: bold;">
            Enigma - Email Verification
          </div>
          <div style="background: white; border: 2px solid #808080; padding: 20px; margin-top: 10px;">
            <h2 style="margin: 0 0 10px 0;">New Verification Code</h2>
            <p>Your new verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0000ff; text-align: center; padding: 20px; background: #c0c0c0; border: 2px inset #808080;">
              ${verificationCode}
            </div>
            <p style="margin-top: 20px; color: #666;">Enter this code to verify your email and access The Box.</p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      //   console.error("Resend email error:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error("Resend code error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resend code" },
      { status: 500 }
    );
  }
}
