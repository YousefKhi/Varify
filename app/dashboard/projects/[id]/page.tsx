import { notFound } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  try {
    // Get the project, including last_ping_at
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, name,created_at, site_url')
      .eq('92f7868b-df04-4d72-8036-2f8012486a57', params.id)
      .single();
      
    if (error) {
      console.error("Error fetching project:", error);
      throw error;
    }
    
    if (!project) {
      console.log(`Project not found for ID: ${params.id}`);
      return notFound();
    }
    
    return (
      <main className="min-h-screen p-8 pb-24">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <Link href="/dashboard" className="btn btn-sm btn-ghost gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>
          
          <header className="border-b pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <div className="mt-2 text-sm text-gray-500">
                  {project.created_at ? 
                    `Created on ${new Date(project.created_at).toLocaleDateString()}` : 
                    'Creation date not available'
                  }
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center gap-2">
                <Link 
                  href={`/dashboard/projects/${project.id}/tests/new`}
                  className="btn btn-primary"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    className="w-5 h-5 mr-1"
                  >
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  New Test
                </Link>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <div className="stats bg-base-200 shadow">
                <div className="stat">
                  <div className="stat-title">Active Tests</div>
                  <div className="stat-value">0</div>
                </div>
                
                <div className="stat">
                  <div className="stat-title">Total Visitors</div>
                  <div className="stat-value">0</div>
                </div>
              </div>
            </div>
          </header>
          
          <div className="mt-8">
            <div className="bg-base-100 border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Your Tests</h2>
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tests created yet</p>
                <Link 
                  href={`/dashboard/projects/${project.id}/tests/new`}
                  className="btn btn-primary"
                >
                  Create Your First Test
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="bg-base-100 border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="font-medium block mb-1">Website URL</label>
                  <div className="input input-bordered flex items-center p-2">
                    <a href={project.site_url} target="_blank" rel="noopener noreferrer" className="text-primary">
                      {project.site_url}
                    </a>
                  </div>
                </div>
                <div>
                  <label className="font-medium block mb-1">Script Installation</label>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error: any) {
    console.error(`Error loading project page for ID: ${params.id}`);
    console.error("Error Details:", { 
      message: error.message, 
      code: error.code, 
      details: error.details 
    });
    console.error("Full Error Object:", error);
    return (
      <main className="min-h-screen p-8 pb-24">
        <div className="max-w-7xl mx-auto">
          <Link href="/dashboard" className="btn btn-sm btn-ghost gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
                clipRule="evenodd"
              />
            </svg>
            Back to Dashboard
          </Link>
          
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold text-error">Error Loading Project</h1>
            <p className="mt-4">There was an error loading the project. Please check the server logs.</p>
            <p className="text-sm text-gray-500 mt-2">(This might be due to Row Level Security policies in Supabase).</p> 
          </div>
        </div>
      </main>
    );
  }
} 