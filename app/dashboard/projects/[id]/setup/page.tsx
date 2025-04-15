import { notFound } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import Link from "next/link";
import StepsIndicator from "../../../new/components/StepsIndicator";
import ScriptInstallation from "./components/ScriptInstallation";
import VerificationChecker from "./components/VerificationChecker";

export const dynamic = "force-dynamic";

export default async function SetupPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  // Get the project
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, site_url')
    .eq('id', params.id)
    .single();
    
  if (error || !project) {
    notFound();
  }
  
  return (
    <main className="min-h-screen flex flex-col">
      <div className="bg-base-200 p-4">
        <div className="max-w-5xl mx-auto">
          <Link 
            href="/dashboard" 
            className="btn btn-sm btn-ghost gap-1"
          >
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
            Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full py-8 px-4 flex-1">
        <StepsIndicator currentStep={2} />
        
        <div className="mt-8 max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Install tracking script</h1>
            <p className="text-gray-500 mt-2">
              Add this code to your website to start collecting data
            </p>
          </div>
          
          <ScriptInstallation projectId={project.id} />
          
          <VerificationChecker 
            projectId={project.id} 
            projectName={project.name} 
            siteUrl={project.site_url} 
          />
        </div>
      </div>
      
      <div className="bg-base-200 p-4 text-center text-sm text-gray-500">
        Need help? Email <a href="mailto:support@abfast.io" className="text-primary hover:underline">support@abfast.io</a>
      </div>
    </main>
  );
} 