import { notFound } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import Link from "next/link";
import NewTestForm from "./components/NewTestForm";

export const dynamic = "force-dynamic";

export default async function NewTestPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  // Get the project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single();
    
  if (error || !project) {
    notFound();
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
        
        <NewTestForm projectId={params.id} />
      </div>
    </main>
  );
} 