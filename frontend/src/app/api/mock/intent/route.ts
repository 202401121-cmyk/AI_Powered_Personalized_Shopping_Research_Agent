import { NextResponse } from "next/server";
import { mockIntent, mockIntentUnclear } from "@/lib/api/mockData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unclear = searchParams.get("unclear") === "true";
  return NextResponse.json(unclear ? mockIntentUnclear : mockIntent);
}
