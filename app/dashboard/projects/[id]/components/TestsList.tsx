import { createClient } from "@/libs/supabase/server";
import Link from "next/link";

export default async function TestsList({ projectId }: { projectId: string }) {
  const supabase = createClient();
  
  // Fetch tests for this project
  const { data: tests, error } = await supabase
    .from("tests")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching tests:", error);
    return <div className="text-error">Failed to load tests</div>;
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">A/B Tests</h2>
          <Link
            href={`/dashboard/projects/${projectId}/new-test`}
            className="btn btn-primary btn-sm"
          >
            Create New Test
          </Link>
        </div>
        
        {tests && tests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Selector</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.name}</td>
                    <td>
                      <code className="bg-base-200 p-1 rounded text-xs">
                        {test.selector}
                      </code>
                    </td>
                    <td>
                      <span className={`badge ${test.active ? 'badge-success' : 'badge-ghost'}`}>
                        {test.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(test.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link 
                        href={`/dashboard/projects/${projectId}/tests/${test.id}`}
                        className="btn btn-ghost btn-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No tests created yet.</p>
            <p className="text-sm mt-2">Create your first A/B test to start optimizing your app!</p>
          </div>
        )}
      </div>
    </div>
  );
} 