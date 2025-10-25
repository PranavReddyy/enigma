import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET - Fetch all commands (including inactive)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    if (password !== process.env.SECRET_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const { data: commands, error } = await supabaseAdmin
      .from("Command")
      .select("*")
      .order("command", { ascending: true });

    if (error) {
      console.error("Supabase GET error:", error);
      return NextResponse.json(
        { error: "Failed to fetch commands", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ commands });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new command
export async function POST(request) {
  try {
    const body = await request.json();
    const { password, command, output, type, isArray } = body;

    console.log("POST request body:", {
      command,
      type,
      isArray,
      outputLength: output?.length,
    });

    if (password !== process.env.SECRET_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    if (!command || !output) {
      return NextResponse.json(
        { error: "Command and output are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("Command")
      .insert([
        {
          command: command.trim(),
          output: output,
          type: type || "output",
          isArray: isArray || false,
          isActive: true,
        },
      ])
      .select();

    if (error) {
      console.error("Supabase POST error:", error);
      return NextResponse.json(
        { error: "Failed to create command", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, command: data[0] });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update command
export async function PUT(request) {
  try {
    const { password, id, command, output, type, isArray, isActive } =
      await request.json();

    if (password !== process.env.SECRET_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    if (!id || !command || output === undefined) {
      return NextResponse.json(
        { error: "ID, command, and output are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("Command")
      .update({
        command: command.trim(),
        output: output,
        type: type || "output",
        isArray: isArray || false,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase PUT error:", error);
      return NextResponse.json(
        { error: "Failed to update command", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, command: data[0] });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete command
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");
    const id = searchParams.get("id");

    if (password !== process.env.SECRET_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Command ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("Command").delete().eq("id", id);

    if (error) {
      console.error("Supabase DELETE error:", error);
      return NextResponse.json(
        { error: "Failed to delete command", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
