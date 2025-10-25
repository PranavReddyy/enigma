import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const command = searchParams.get("command");

    if (!command) {
      return NextResponse.json(
        { error: "Command parameter required" },
        { status: 400 }
      );
    }

    // Fetch specific exclusive command
    const { data: commands, error } = await supabase
      .from("Command")
      .select("command, output, type, isArray")
      .eq("command", command)
      .eq("isActive", true)
      .eq("isExclusive", true)
      .single();

    if (error || !commands) {
      return NextResponse.json({ error: "Command not found" }, { status: 404 });
    }

    let output = commands.output;
    if (commands.isArray) {
      try {
        output = JSON.parse(output);
      } catch {
        output = [output];
      }
    }

    return NextResponse.json({
      command: commands.command,
      output: output,
      type: commands.type,
      isArray: commands.isArray,
    });
  } catch (error) {
    console.error("Error fetching exclusive command:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
