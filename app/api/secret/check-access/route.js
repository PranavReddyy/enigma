import { NextResponse } from "next/server";
import { validateBoxSession } from "@/lib/session-protection";

export async function GET(request) {
  try {
    const sessionToken = request.cookies.get("box-session")?.value;

    if (validateBoxSession(sessionToken)) {
      return NextResponse.json({
        hasAccess: true,
        message: "Box access valid",
      });
    } else {
      return NextResponse.json(
        {
          hasAccess: false,
          message: "No box access",
        },
        { status: 403 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        hasAccess: false,
        message: "Access check failed",
      },
      { status: 500 }
    );
  }
}
