import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("counter")
      .select("count")
      .eq("id", 1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    const count = data ? data.count : 0;
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching counter:", error);
    return NextResponse.json({ count: 0 });
  }
}

export async function POST() {
  try {
    const { data, error } = await supabase
      .from("counter")
      .select("count")
      .eq("id", 1)
      .single();

    let newCount = 1;
    if (data) {
      newCount = data.count + 1;
      const { error: updateError } = await supabase
        .from("counter")
        .update({ count: newCount })
        .eq("id", 1);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("counter")
        .insert([{ id: 1, count: newCount }]);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ count: newCount });
  } catch (error) {
    console.error("Error updating counter:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
