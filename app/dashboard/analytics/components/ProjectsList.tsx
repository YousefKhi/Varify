import { createClient } from "@/libs/supabase/server";
import Link from "next/link";

export default async function ProjectsList() {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user's projects
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching projects:", error);
    return <div className="text-red-500">Failed to load projects</div>;
  }
  
  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-lg">
        <h3 className="text-lg font-medium mb-2">No projects yet</h3>
        <p className="text-gray-500 mb-4">Create your first project to start A/B testing</p>
        <Link href="/dashboard" className="btn btn-primary">
          Go to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold">Projects Overview</h2>
      
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Status</th>
              <th>Active Tests</th>
              <th>Total Visitors</th>
              <th>Avg. Conversion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>
                  <Link 
                    href={`/dashboard/projects/${project.id}`} 
                    className="font-medium hover:underline"
                  >
                    {project.name}
                  </Link>
                </td>
                <td>
                  <span className="badge badge-success">Active</span>
                </td>
                <td>3</td>
                <td>1,245</td>
                <td>8.7%</td>
                <td>
                  <div className="flex gap-2">
                    <Link 
                      href={`/dashboard/projects/${project.id}`}
                      className="btn btn-xs"
                    >
                      View
                    </Link>
                    <button className="btn btn-xs btn-outline">
                      Report
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
} 