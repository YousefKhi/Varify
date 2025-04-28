"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import ProjectsList from "./components/ProjectsList";
import ProjectViewer from "./components/ProjectViewer";

export default function ProjectsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleCloseProject = () => {
    setSelectedProjectId(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProjectsList onSelectProject={handleProjectSelect} selectedProjectId={selectedProjectId} />
        </div>
        
        <div className="lg:col-span-2">
          {selectedProjectId ? (
            <ProjectViewer 
              projectId={selectedProjectId} 
              onClose={handleCloseProject}
            />
          ) : (
            <div className="card bg-base-100 shadow-sm h-full flex items-center justify-center p-8">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
                <p className="text-gray-500 mb-4">Select a project from the list to view its details.</p>
                <button 
                  onClick={() => {
                    // You could add a "new project" functionality here
                    console.log("Create new project");
                  }}
                  className="btn btn-primary"
                >
                  Create New Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 