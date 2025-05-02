import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

export async function GET(request: Request) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no token in header, try to get it from the session
    if (!token) {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.provider_token;
    }
    
    // If still no token, return unauthorized
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Fetch repositories from GitHub API
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch GitHub repositories');
    }
    
    const repositories = await response.json();
    
    // Transform and filter the repositories
    const transformedRepos = repositories
      .filter((repo: any) => !repo.archived && !repo.disabled)
      .map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description,
        visibility: repo.visibility,
        updated_at: repo.updated_at
      }));
    
    return NextResponse.json(transformedRepos);
  } catch (error: any) {
    console.error('Error fetching GitHub repositories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
} 