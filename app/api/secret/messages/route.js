import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { jwtVerify } from "jose";
import Pusher from "pusher";
import { validateBoxSession } from "@/lib/session-protection";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

async function getUserFromToken(request) {
  const token = request.cookies.get("secret_auth")?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const sessionToken = request.cookies.get("box-session")?.value;
  if (!validateBoxSession(sessionToken)) {
    return NextResponse.json(
      { error: "Access denied. Please visit the proper entry point." },
      { status: 403 }
    );
  }

  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  // Get total count
  const { count } = await supabase
    .from("Message")
    .select("*", { count: "exact", head: true });

  // Get messages for this page
  const { data: messages, error } = await supabase
    .from("Message")
    .select(
      `
      id,
      content,
      createdAt,
      user:SecretUser!userId (
        email,
        username
      )
    `
    )
    .order("createdAt", { ascending: false }) // Latest first for pagination
    .range(offset, offset + limit - 1);

  if (error) {
    // console.error("Error fetching messages:", error);
    return NextResponse.json({ messages: [] });
  }

  return NextResponse.json({
    messages: messages.reverse(), // Reverse to show chronological order
    hasMore: messages.length === limit,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    total: count || 0,
  });
}

export async function POST(request) {
  const sessionToken = request.cookies.get("box-session")?.value;
  if (!validateBoxSession(sessionToken)) {
    return NextResponse.json(
      { error: "Access denied. Please visit the proper entry point." },
      { status: 403 }
    );
  }

  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await request.json();

  const { data: message, error } = await supabase
    .from("Message")
    .insert({
      content,
      userId: user.userId,
    })
    .select(
      `
    id,
    content,
    createdAt,
    user:SecretUser!userId (
      email,
      username
    )
  `
    )
    .single();

  if (error) {
    // console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }

  // Trigger real-time update via Pusher
  await pusher.trigger("secret-chat", "new-message", {
    id: message.id,
    content: message.content,
    user: {
      email: message.user.email,
      username: message.user.username,
    },
    createdAt: message.createdAt,
  });

  return NextResponse.json({ message });
}
