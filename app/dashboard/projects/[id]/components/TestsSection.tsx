import { createClient } from "@/libs/supabase/server";
import Link from "next/link";
import TestCard from "./TestCard";

type TestsSectionProps = {
  projectId: string;
};

export default async function TestsSection({ projectId }: TestsSectionProps) {
  const supabase = createClient();
  
  // Fetch tests for this project
  const { data: tests, error } = await supabase
    .from('tests')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching tests:", error);
    return <div className="text-red-500">Failed to load tests</div>;
  }
  
  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border shadow-sm">
      <h2 className="text-xl font-bold mb-6">A/B Tests</h2>
      
      {!tests || tests.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-lg">
          <h3 className="text-lg font-medium mb-2">No tests yet</h3>
          <p className="text-gray-500 mb-4">Create your first A/B test to start optimizing</p>
          <Link 
            href={`/dashboard/projects/${projectId}/tests/new`}
            className="btn btn-primary"
          >
            Create Test
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      )}
    </section>
  );
} 