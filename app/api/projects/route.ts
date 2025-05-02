import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate project data
    if (body.githubRepo && !body.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }
    
    // Create project data
    const projectData = {
      name: body.name,
      description: body.description || '',
      user_id: session.user.id,
      site_url: body.site_url || null,
      repo_url: body.repo_url || null,
      github_repo: body.githubRepo || null
    };
    
    // Insert project into database
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
} 