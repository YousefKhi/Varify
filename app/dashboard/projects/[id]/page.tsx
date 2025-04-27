import { notFound } from "next/navigation";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic"; // <-- ADD THIS!!

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, created_at, site_url')
    .eq('id', params.id)
    .single();

  console.log('params.id', params.id);
  console.log('project', project);
  console.log('error', error);

  if (!project || error) {
    notFound();
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">{project.name}</h1>
      <p className="mt-4 text-gray-500">Created: {new Date(project.created_at).toLocaleDateString()}</p>
      <a href={project.site_url} target="_blank" className="text-blue-500 underline mt-2 block">
        Visit Website
      </a>
    </main>
  );
}
