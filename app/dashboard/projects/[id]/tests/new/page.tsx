import { notFound } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewTestPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  try {
    // Get the project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .single();
      
    if (error) {
      console.error("Error fetching project:", error);
      throw error;
    }
    
    if (!project) {
      return notFound();
    }
    
    return (
      <main className="min-h-screen p-8 pb-24">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Link 
              href={`/dashboard/projects/${params.id}`} 
              className="btn btn-ghost btn-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Project
            </Link>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold">Create A/B Test</h1>
            <p className="text-gray-500 mt-1">
              Define a test to run on {project.name}
            </p>
          </div>
          
          <div className="bg-base-100 border rounded-lg p-8">
            <form className="space-y-8">
              <div>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-medium">Test Name</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="e.g., Button Color Test" 
                    className="input input-bordered w-full" 
                    required
                  />
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text font-medium">Control (Original)</span>
                    </div>
                    <textarea 
                      placeholder="Enter your control HTML/CSS" 
                      className="textarea textarea-bordered h-32 font-mono text-sm" 
                      required
                    ></textarea>
                  </label>
                </div>
                
                <div>
                  <label className="form-control w-full">
                    <div className="label">
                      <span className="label-text font-medium">Variant (Test)</span>
                    </div>
                    <textarea 
                      placeholder="Enter your variant HTML/CSS" 
                      className="textarea textarea-bordered h-32 font-mono text-sm" 
                      required
                    ></textarea>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-medium">Selector</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="e.g., #main-button, .hero-section" 
                    className="input input-bordered w-full" 
                    required
                  />
                  <div className="label">
                    <span className="label-text-alt text-gray-500">CSS selector to target the element you want to replace</span>
                  </div>
                </label>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Link href={`/dashboard/projects/${params.id}`} className="btn mr-2">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary">
                  Create Test
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error in new test page:", error);
    return (
      <main className="min-h-screen p-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <Link 
            href={`/dashboard/projects/${params.id}`} 
            className="btn btn-ghost btn-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 mr-1"
            >
              <path
                fillRule="evenodd"
                d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
                clipRule="evenodd"
              />
            </svg>
            Back to Project
          </Link>
          
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold text-error">Error Loading Page</h1>
            <p className="mt-4">There was an error loading the page. Please try again later.</p>
          </div>
        </div>
      </main>
    );
  }
} 