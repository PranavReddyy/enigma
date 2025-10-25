import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email } = await request.json();

    const { data: user } = await supabase
      .from("SecretUser")
      .select("*")
      .eq("email", email)
      .single();

    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({ success: true });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = new Date(Date.now() + 3600000); // 1 hour

    const { error: updateError } = await supabase
      .from("SecretUser")
      .update({
        resetCode,
        resetCodeExpiry: resetCodeExpiry.toISOString(),
      })
      .eq("email", email);

    if (updateError) {
      // console.error("Update error:", updateError);
      throw updateError;
    }
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "Reset Your Password - Enigma's The Box",
      html: `
        <div style="font-family: 'MS Sans Serif', monospace; background: #c0c0c0; padding: 20px;">
          <div style="background: #0000ff; color: white; padding: 10px; font-weight: bold;">
            Enigma - Password Reset
          </div>
          <div style="background: white; border: 2px solid #808080; padding: 20px; margin-top: 10px;">
            <h2 style="margin: 0 0 10px 0;">Password Reset Request</h2>
            <p>Your password reset code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0000ff; text-align: center; padding: 20px; background: #c0c0c0; border: 2px inset #808080;">
              ${resetCode}
            </div>
            <p style="margin-top: 20px; color: #666;">Enter this code to reset your password.</p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">This code expires in 1 hour.</p>
            <p style="font-size: 12px; color: #999;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      return NextResponse.json(
        { error: "Failed to send reset email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send reset email" },
      { status: 500 }
    );
  }
}
