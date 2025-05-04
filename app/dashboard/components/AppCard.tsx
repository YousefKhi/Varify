"use client"; // Make it a client component

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/libs/supabase/client";
import React from "react";
import Link from "next/link";

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
  const [formattedDate, setFormattedDate] = useState<string | null>(null);
  const [stats, setStats] = useState({ activeTests: 0, totalViews: 0 });

  // Format date only on the client after mount
  useEffect(() => {
    setFormattedDate(new Date(app.created_at).toLocaleDateString());
  }, [app.created_at]);

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

  // Generate a fake domain for display purposes based on the app name
  const domain = `${app.name.toLowerCase().replace(/\s+/g, "-")}.varify.app`;

  return (
    <div 
      className={`bg-[#1f1f1f] border transition-all duration-200 rounded-lg p-5 relative cursor-pointer
        ${isSelected 
          ? "ring-1 ring-[#39a276] border-[#39a276]" 
          : "border-[#444444] hover:border-[#39a276]"}`}
      onClick={handleCardClick}
    >
      {/* App Details */}
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-lg font-medium truncate">{app.name}</h3>
          {stats.activeTests > 0 && (
            <span className="inline-flex h-2 w-2 rounded-full bg-[#39a276]"></span>
          )}
        </div>
        
        {/* Domain */}
        <div className="text-gray-500 text-xs mb-4">{domain}</div>
        
        {/* Simple Stats */}
        <div className="flex justify-between text-sm mt-auto border-t border-[#444444] pt-3">
          <div>
            <span className="text-[#39a276] font-medium">{stats.activeTests}</span>
            <span className="text-gray-400 ml-1">tests</span>
          </div>
          <div>
            <span className="text-[#39a276] font-medium">{stats.totalViews.toLocaleString()}</span>
            <span className="text-gray-400 ml-1">views</span>
          </div>
          <div className="text-gray-400 text-xs">
            {formattedDate || 'Loading...'}
          </div>
        </div>
      </div>

      {/* Action Menu - Visible on hover */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(true);
          }}
          className="p-1.5 text-gray-400 hover:text-white bg-[#2a2a2a] rounded-md transition-colors"
          aria-label="Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#121212] border border-[#444444] rounded-lg p-5 w-full max-w-sm mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white">Delete Project</h3>
            </div>
            <p className="text-sm mb-5 text-gray-300">
              Are you sure you want to delete {app.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-md bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white transition-colors flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
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