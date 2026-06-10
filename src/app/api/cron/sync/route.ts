import { NextRequest, NextResponse } from "next/server";

import { syncAndPersistLiveSnapshot } from "@/lib/world-cup-data";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  const bearer = request.headers.get("authorization");
  const token = bearer?.replace(/^Bearer\s+/i, "");

  return token === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const result = await syncAndPersistLiveSnapshot();

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function GET(request: NextRequest) {
  return POST(request);
}