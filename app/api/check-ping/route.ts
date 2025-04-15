import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("last_ping_at")
      .eq("id", projectId)
      .single();

    if (error || !data) {
      // Handle project not found or other errors
      return NextResponse.json({ verified: false, error: "Project not found or error fetching status" }, { status: 404 });
    }

    // Check if the last ping was within the last 5 minutes
    const lastPing = data.last_ping_at ? new Date(data.last_ping_at) : null;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const isVerified = lastPing !== null && lastPing > fiveMinutesAgo;

    return NextResponse.json({ verified: isVerified }, { status: 200 });

  } catch (error) {
    console.error("Error checking ping status:", error);
    return NextResponse.json({ error: "Failed to check ping status" }, { status: 500 });
  }
} 