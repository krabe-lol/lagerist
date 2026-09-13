import { NextRequest, NextResponse } from "next/server";
import { searchAndHydrate } from "@/lib/search-results";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "30");

  const results = await searchAndHydrate(q, limit);
  return NextResponse.json(results);
}
