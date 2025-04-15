import { notFound } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import BackToDashboard from "@/app/dashboard/components/BackToDashboard";
import ProjectHeader from "@/app/dashboard/projects/[id]/components/ProjectHeader";
import TestsSection from "@/app/dashboard/projects/[id]/components/TestsSection";
import ProjectStats from "@/app/dashboard/projects/[id]/components/ProjectStats";
import ProjectSettings from "@/app/dashboard/projects/[id]/components/ProjectSettings";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  // Get the project, including last_ping_at
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, description, created_at, site_url, last_ping_at')
    .eq('id', params.id)
    .single();
    
  if (error || !project) {
    notFound();
  }
  
  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <BackToDashboard />
        
        <ProjectHeader project={project} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ProjectStats projectId={project.id} lastPingAt={project.last_ping_at} />
            <TestsSection projectId={project.id} />
          </div>
          
          <div className="space-y-8">
            <ProjectSettings project={project} />
          </div>
        </div>
      </div>
    </main>
  );
} 