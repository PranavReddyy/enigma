import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "5");

  try {
    const { data: messages, error } = await supabase
      .from("Message")
      .select(
        `
        id,
        content,
        createdAt,
        user:SecretUser!userId (
          username
        )
      `
      )
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) {
      // console.error("Error fetching public messages:", error);
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({
      messages: messages.reverse(), // Show in chronological order
    });
  } catch (error) {
    // console.error("Error in public messages:", error);
    return NextResponse.json({ messages: [] });
  }
}
