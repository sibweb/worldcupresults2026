import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { syncAndPersistLiveSnapshot } from "@/lib/world-cup-data";

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return true;
  }

  const bearer = request.headers.get("authorization") ?? "";
  const bearerToken = bearer.replace(/^Bearer\s+/i, "").trim();
  const headerToken = (request.headers.get("x-cron-secret") ?? "").trim();
  const token = bearerToken || headerToken;

  if (!token) {
    return false;
  }

  return safeEqual(token, secret);
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