import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validateBoxSession } from "@/lib/session-protection";

export async function POST(request) {
  try {
    const sessionToken = request.cookies.get("box-session")?.value;
    if (!validateBoxSession(sessionToken)) {
      return NextResponse.json(
        { error: "Access denied. Please visit the proper entry point." },
        { status: 403 }
      );
    }

    const { username } = await request.json();

    const { data, error } = await supabase
      .from("SecretUser")
      .select("id")
      .eq("username", username)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({ available: !data });
  } catch (error) {
    // console.error("Username check error:", error);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
