import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, variant, timestamp, userAgent } = body;
    
    // Validate required fields
    if (!testId || !variant) {
      return NextResponse.json(
        { error: "testId and variant are required" },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Insert view into database
    const { error } = await supabase
      .from("views")
      .insert({
        test_id: testId,
        variant,
        user_agent: userAgent,
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      });
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
} 