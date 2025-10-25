import { NextResponse } from "next/server";

// In-memory store for cache invalidation timestamp
let globalCacheInvalidation = Date.now();

export async function POST(request) {
  try {
    const { password } = await request.json();

    // Verify admin password
    if (password !== process.env.SECRET_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Update global invalidation timestamp
    globalCacheInvalidation = Date.now();

    return NextResponse.json({
      success: true,
      message: "Cache invalidated for all users",
      invalidationTime: globalCacheInvalidation,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}

// GET endpoint to check current invalidation time
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");

  if (password !== process.env.SECRET_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  return NextResponse.json({
    invalidationTime: globalCacheInvalidation,
  });
}
