import { createClient } from "@/libs/supabase/server";

export default async function ProjectStats({ projectId }: { projectId: string }) {
  const supabase = createClient();
  
  // Get test IDs for this project to use in our queries
  const { data: tests } = await supabase
    .from("tests")
    .select("id")
    .eq("project_id", projectId);
  
  const testIds = tests?.map(test => test.id) || [];
  
  // Initialize stats with default values
  let totalViews = 0;
  let totalConversions = 0;
  let conversionRate = 0;
  
  // Only run these queries if we have tests
  if (testIds.length > 0) {
    // Count views
    const { count: viewsCount, error: viewsError } = await supabase
      .from("views")
      .select("id", { count: "exact" })
      .in("test_id", testIds);
    
    if (!viewsError && viewsCount !== null) {
      totalViews = viewsCount;
    }
    
    // Count conversions
    const { count: conversionsCount, error: conversionsError } = await supabase
      .from("conversions")
      .select("id", { count: "exact" })
      .in("test_id", testIds);
    
    if (!conversionsError && conversionsCount !== null) {
      totalConversions = conversionsCount;
    }
    
    // Calculate conversion rate
    if (totalViews > 0) {
      conversionRate = (totalConversions / totalViews) * 100;
    }
  }
  
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Project Statistics</h2>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Total Views</div>
            <div className="stat-value">{totalViews.toLocaleString()}</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Conversions</div>
            <div className="stat-value">{totalConversions.toLocaleString()}</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Conversion Rate</div>
            <div className="stat-value">{conversionRate.toFixed(2)}%</div>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="font-medium mb-2">Test Performance</h3>
          {testIds.length > 0 ? (
            <div className="text-sm text-gray-500">
              Data visualization will be shown here
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Create tests to see performance data
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 