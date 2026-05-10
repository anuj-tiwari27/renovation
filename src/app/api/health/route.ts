import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    supabase_configured: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
}
