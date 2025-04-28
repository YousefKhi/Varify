import { createClient } from "@/libs/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import TestsList from "./components/TestsList";
import ProjectStats from "./components/ProjectStats";
import { useParams, useSearchParams } from "next/navigation";

// 🔥 Tell Next.js to always render dynamically (not static build)
export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
    params: { id: string };
}) {
    
  const supabase = createClient();

  // Fetch the project details
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", "92f7868b-df04-4d72-8036-2f8012486a57")
    .single();

  if (error || !project) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Link href="/dashboard/projects" className="btn btn-ghost">
          Back to Projects
        </Link>
      </div>

      {/* Project Details & Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body space-y-2">
            <h2 className="card-title">Project Details</h2>
            <p><span className="font-medium">ID:</span> {project.id}</p>
            <p><span className="font-medium">Name:</span> {project.name}</p>
            {project.repo_url && (
              <p>
                <span className="font-medium">Repository:</span>{" "}
                <a
                  href={project.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  {project.repo_url}
                </a>
              </p>
            )}
            {project.site_url && (
              <p>
                <span className="font-medium">Website:</span>{" "}
                <a
                  href={project.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  {project.site_url}
                </a>
              </p>
            )}
            <p><span className="font-medium">Created:</span> {new Date(project.created_at).toLocaleDateString()}</p>
            {project.last_ping_at && (
              <p><span className="font-medium">Last Activity:</span> {new Date(project.last_ping_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <ProjectStats projectId={project.id} />
      </div>

      {/* Tests List */}
      <TestsList projectId={project.id} />
    </div>
  );
}
