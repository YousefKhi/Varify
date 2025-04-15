import { createClient } from "@/libs/supabase/server";
import AppCard from "./AppCard";
export default async function AppList() {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user's apps from database
  const { data: apps, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching apps:", error);
    return <div className="text-red-500">Failed to load apps</div>;
  }
  
  if (!apps || apps.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-lg">
        <h3 className="text-lg font-medium mb-2">No apps yet</h3>
        <p className="text-gray-500 mb-4">Create your first app to get started with A/B testing</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
} 