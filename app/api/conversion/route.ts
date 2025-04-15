import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, variant, event, timestamp } = body;
    
    // Validate required fields
    if (!testId || !variant || !event) {
      return NextResponse.json(
        { error: "testId, variant, and event are required" },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Insert conversion into database
    const { error } = await supabase
      .from("conversions")
      .insert({
        test_id: testId,
        variant,
        event_name: event,
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      });
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error tracking conversion:", error);
    return NextResponse.json(
      { error: "Failed to track conversion" },
      { status: 500 }
    );
  }
} 