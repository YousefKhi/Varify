"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import AppCard from "./AppCard";
import ProjectViewer from "@/app/dashboard/components/ProjectViewer";
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
          router.push('/signin');
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-[#121212] border border-gray-800 rounded-md p-5 space-y-3">
            <div className="h-5 bg-gray-800 rounded animate-pulse w-2/3"></div>
            <div className="h-4 bg-gray-800 rounded animate-pulse w-full"></div>
            <div className="h-3 bg-gray-800 rounded animate-pulse w-1/4 mt-4"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20 rounded-md p-4">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!apps || apps.length === 0) {
    return (
      <div className="border border-dashed border-gray-700 rounded-md bg-[#121212] p-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">Create your first project to get started with A/B testing</p>
        <button
          onClick={() => router.push('/dashboard/new')}
          className="px-4 py-2 rounded-md bg-[#3ECF8E] text-white font-medium hover:bg-opacity-90 transition-colors"
        >
          New Project
        </button>
      </div>
    );
  }

  if (selectedAppId) {
    return (
      <div className="space-y-4">
        <button 
          onClick={handleCloseViewer}
          className="flex items-center text-sm px-3 py-2 rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Projects
        </button>
        <ProjectViewer 
          projectId={selectedAppId} 
          onClose={handleCloseViewer}
        />
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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