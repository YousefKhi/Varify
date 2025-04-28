import { notFound } from "next/navigation";
import { createClient } from "@/libs/supabase/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    console.error('No project ID provided');
    return notFound();
  }

  const supabase = createClient();

  try {
    console.log('Fetching project with ID:', params.id);
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, name, created_at, site_url')
      .eq('id', params.id)
      .single();

    console.log('Query result:', { project, error });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (!project) {
      console.error('Project not found for ID:', params.id);
      return notFound();
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
  } catch (error) {
    console.error('Error in ProjectPage:', error);
    throw error;
  }
}
