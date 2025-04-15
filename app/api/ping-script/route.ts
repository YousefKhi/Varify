import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;
    
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    
    const supabase = createClient();
    
    // Update the last_ping_at timestamp for the project
    const { error } = await supabase
      .from("projects")
      .update({ last_ping_at: new Date().toISOString() })
      .eq("id", projectId);
      
    if (error) {
      // Don't throw error if project not found, just log it
      if (error.code !== 'PGRST116') { // PGRST116: Row not found
        console.error("Error updating project ping timestamp:", error);
        // Still return success to the client, as ping failure is not critical
      }
    }
    
    // Respond with success regardless of update outcome to avoid breaking client script
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Error processing ping:", error);
    // Ensure a success response even on general errors
    return NextResponse.json({ success: true }, { status: 200 });
  }
} 