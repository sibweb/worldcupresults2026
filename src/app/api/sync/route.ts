import { NextResponse } from "next/server";

import { syncAndPersistLiveSnapshot } from "@/lib/world-cup-data";

export async function POST() {
  const result = await syncAndPersistLiveSnapshot();

  return NextResponse.json(result, {
    status: result.ok ? 200 : 500,
  });
}

export async function GET() {
  return NextResponse.json({
    message:
      "POST to this route to trigger live provider sync and persist the normalized tournament snapshot.",
  });
}