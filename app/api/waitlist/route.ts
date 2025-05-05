import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient();
    
    // Store email in waitlist table
    const { data, error } = await supabase
      .from("waitlist")
      .upsert(
        { 
          email,
          created_at: new Date().toISOString() 
        },
        { onConflict: "email" }
      )
      .select();
    
    if (error) {
      console.error("Waitlist submission error:", error);
      
      // Create more specific error messages based on error code
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email is already on our waitlist" },
          { status: 409 }
        );
      }
      
      if (error.code === "42501") {
        return NextResponse.json(
          { error: "Permission error. Please try again later." },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to join waitlist", details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: "Successfully joined waitlist" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Waitlist submission error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error.message || "Unknown error" },
      { status: 500 }
    );
  }
} 