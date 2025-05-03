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
      className={`bg-[#121212] border border-gray-800 rounded-md p-5 relative group cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-[#3ECF8E]" : "hover:border-gray-700"
      }`}
      onClick={handleCardClick}
    >
      {/* Status Indicator and Logo */}
      <div className="absolute top-5 right-5 flex items-center">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ECF8E] opacity-50"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3ECF8E]"></span>
        </span>
      </div>

      {/* Project Info */}
      <div className="mb-4">
        <h3 className="text-white font-medium mb-1.5">{app.name}</h3>
        <div className="text-gray-500 text-sm truncate">
          {domain}
        </div>
      </div>

      {/* Last Deploy/Update */}
      <div className="flex items-center text-xs text-gray-500 mt-4">
        <span className="rounded-full h-2 w-2 bg-[#3ECF8E] mr-1.5"></span>
        <span className="truncate">
          {stats.activeTests > 0 ? `${stats.activeTests} active test${stats.activeTests > 1 ? 's' : ''}` : 'Ready'}
        </span>
      </div>

      {/* Actions menu - visible on hover */}
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity mr-2 mt-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(true);
          }}
          className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-800" 
          aria-label="Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#121212] border border-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 text-white">Confirm Deletion</h3>
            <p className="text-sm mb-6 text-gray-300">
              Are you sure you want to delete the project &quot;{app.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
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