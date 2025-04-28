"use client"; // Make it a client component

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/libs/supabase/client";

// Define the props, including the project ID and selection handler
type AppCardProps = {
  app: {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    // Add other app properties as needed
  };
  onSelect: (id: string) => void;
  isSelected: boolean;
};

export default function AppCard({ app, onSelect, isSelected }: AppCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formattedDate, setFormattedDate] = useState<string | null>(null); // State for client-side formatted date
  const [stats, setStats] = useState({ activeTests: 0, totalViews: 0 });

  // Format date only on the client after mount
  useEffect(() => {
    setFormattedDate(new Date(app.created_at).toLocaleDateString());
  }, [app.created_at]); // Re-run if created_at changes (though unlikely)

  // Fetch basic stats for this project
  useEffect(() => {
    const fetchProjectStats = async () => {
      try {
        const supabase = createClient();
        
        // Get active tests count
        const { data: testsData, error: testsError } = await supabase
          .from("tests")
          .select("id")
          .eq("project_id", app.id)
          .eq("active", true);
          
        if (!testsError) {
          const activeTests = testsData?.length || 0;
          
          // Get all test IDs for this project
          const { data: allTests } = await supabase
            .from("tests")
            .select("id")
            .eq("project_id", app.id);
            
          const testIds = allTests?.map(test => test.id) || [];
          
          if (testIds.length > 0) {
            // Get total views
            const { count: viewsCount } = await supabase
              .from("views")
              .select("id", { count: "exact" })
              .in("test_id", testIds);
              
            setStats({ 
              activeTests, 
              totalViews: viewsCount || 0
            });
          } else {
            setStats({ activeTests, totalViews: 0 });
          }
        }
      } catch (err) {
        console.error("Error fetching project stats:", err);
      }
    };
    
    fetchProjectStats();
  }, [app.id]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click when clicking on delete button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onSelect(app.id);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", app.id);
        
      if (error) throw error;

      toast.success(`Project "${app.name}" deleted successfully.`);
      setShowConfirm(false);
      
      // Force page refresh to update the list
      window.location.reload();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(`Failed to delete project "${app.name}".`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className={`border rounded-lg p-6 relative group hover:shadow-md transition-all cursor-pointer ${
        isSelected ? "ring-2 ring-primary border-primary" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Delete Button - Top Right */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setShowConfirm(true);
        }}
        className="absolute top-2 right-2 btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity" 
        aria-label="Delete Project"
        disabled={isDeleting}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold pr-8">{app.name}</h3>
          <span className="badge badge-primary">Active</span>
        </div>
        
        {app.description && (
          <p className="text-gray-600 mb-4 line-clamp-2">{app.description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-2 bg-base-200 rounded">
            <p className="text-sm text-gray-500">Active Tests</p>
            <p className="font-bold">{stats.activeTests}</p>
          </div>
          <div className="text-center p-2 bg-base-200 rounded">
            <p className="text-sm text-gray-500">Total Views</p>
            <p className="font-bold">{stats.totalViews.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-400">
          Created {formattedDate ? formattedDate : '...'}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
            <p className="text-sm mb-6">
              Are you sure you want to delete the project &quot;{app.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowConfirm(false)}
                className="btn btn-ghost"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="btn btn-error"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 