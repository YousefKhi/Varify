import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;
    
    console.log(`Received ping for projectId: ${projectId}`);

    if (!projectId) {
      console.error("Ping request missing projectId");
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    
    const supabase = createClient();
    
    console.log(`Attempting to update last_ping_at for projectId: ${projectId}`);

    // Update the last_ping_at timestamp for the project
    const { error } = await supabase
      .from("projects")
      .update({ last_ping_at: new Date().toISOString() })
      .eq("id", projectId);
      
    if (error) {
      // Log any error during update
      console.error(`Supabase update error for projectId ${projectId}:`, error); 
      // if (error.code !== 'PGRST116') { 
      //   console.error("Error updating project ping timestamp:", error);
      // }
    } else {
      console.log(`Successfully updated last_ping_at for projectId: ${projectId}`);
    }
    
    // Respond with success regardless of update outcome to avoid breaking client script
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Error processing ping request:", error);
    // Ensure a success response even on general errors
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

export async function OPTIONS(request: NextRequest) {
  // Return a simple 200 OK response
  // The CORS headers will be added by next.config.js
  return new NextResponse(null, { status: 200 });
} 