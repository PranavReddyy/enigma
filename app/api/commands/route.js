import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Fetch only non-exclusive, active commands for public cache
    const { data: commands, error } = await supabase
      .from("Command")
      .select("command, output, type, isArray, updatedAt")
      .eq("isActive", true)
      .eq("isExclusive", false); // Only non-exclusive commands

    if (error) {
      console.error("Error fetching commands:", error);
      return NextResponse.json(
        { error: "Failed to fetch commands" },
        { status: 500 }
      );
    }

    // Find the most recent update timestamp
    const latestUpdate = commands.reduce((latest, cmd) => {
      const cmdTime = new Date(cmd.updatedAt).getTime();
      return cmdTime > latest ? cmdTime : latest;
    }, 0);

    // Transform to the format expected by frontend
    const commandsMap = {};
    commands.forEach((cmd) => {
      if (cmd.isArray) {
        try {
          commandsMap[cmd.command] = JSON.parse(cmd.output);
        } catch {
          commandsMap[cmd.command] = [cmd.output];
        }
      } else {
        commandsMap[cmd.command] = cmd.output;
      }
    });

    return NextResponse.json({
      commands: commandsMap,
      cacheVersion: latestUpdate,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in commands API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
