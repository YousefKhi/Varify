"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import AppCard from "./AppCard";
import ProjectViewer from "../projects/components/ProjectViewer";
import { useEffect } from "react";

export default function AppList() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        // Fetch user's apps from database
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setApps(data || []);
      } catch (err) {
        console.error("Error fetching apps:", err);
        setError("Failed to load apps");
      } finally {
        setLoading(false);
      }
    };
    
    fetchApps();
  }, [router]);

  const handleSelectApp = (appId: string) => {
    setSelectedAppId(appId);
  };

  const handleCloseViewer = () => {
    setSelectedAppId(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  if (!apps || apps.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-lg">
        <h3 className="text-lg font-medium mb-2">No apps yet</h3>
        <p className="text-gray-500 mb-4">Create your first app to get started with A/B testing</p>
      </div>
    );
  }

  if (selectedAppId) {
    return (
      <div className="space-y-4">
        <button 
          onClick={handleCloseViewer}
          className="btn btn-ghost"
        >
          ← Back to Apps
        </button>
        <ProjectViewer 
          projectId={selectedAppId} 
          onClose={handleCloseViewer}
        />
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {apps.map((app) => (
        <AppCard 
          key={app.id} 
          app={app} 
          onSelect={handleSelectApp} 
          isSelected={app.id === selectedAppId}
        />
      ))}
    </div>
  );
} 