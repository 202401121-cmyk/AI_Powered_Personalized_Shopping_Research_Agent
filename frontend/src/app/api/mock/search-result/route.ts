import { NextResponse } from "next/server";
import { mockSearchResult } from "@/lib/api/mockData";

export async function GET() {
  return NextResponse.json(mockSearchResult);
}
