"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";
import TestManager from "./TestManager";

type Project = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  site_url?: string;
  repo_url?: string;
  last_ping_at?: string;
  user_id?: string;
};

type ProjectViewerProps = {
  projectId: string;
  onClose: () => void;
};

export default function ProjectViewer({ projectId, onClose }: ProjectViewerProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "tests" | "settings">("details");

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (err) {
        console.error("Error fetching project details:", err);
        setError("Failed to load project details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="bg-[#121212] rounded-md border border-gray-800 p-6">
        <div className="flex flex-col space-y-4">
          <div className="h-8 bg-gray-800 rounded-md w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-800 rounded-md w-full animate-pulse"></div>
          <div className="h-4 bg-gray-800 rounded-md w-full animate-pulse"></div>
          <div className="h-32 bg-gray-800 rounded-md w-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-[#121212] rounded-md border border-gray-800 p-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md flex items-center justify-between">
          <span>{error || "Project not found"}</span>
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm transition-colors">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] rounded-md border border-gray-800">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-medium text-white">{project.name}</h2>
            <p className="text-sm text-gray-400">ID: {project.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-800 mb-6">
          <div className="flex space-x-6">
            <button 
              className={`text-sm pb-3 px-1 font-medium transition-colors ${activeTab === "details" ? "text-white border-b-2 border-[#3ECF8E]" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button 
              className={`text-sm pb-3 px-1 font-medium transition-colors ${activeTab === "tests" ? "text-white border-b-2 border-[#3ECF8E]" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("tests")}
            >
              A/B Tests
            </button>
            <button 
              className={`text-sm pb-3 px-1 font-medium transition-colors ${activeTab === "settings" ? "text-white border-b-2 border-[#3ECF8E]" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "details" && (
            <div className="space-y-6">
              {project.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                  <p className="text-white">{project.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-md p-4 border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Created</h3>
                  <p className="text-white">{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
                
                {project.last_ping_at && (
                  <div className="bg-gray-900 rounded-md p-4 border border-gray-800">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Last Activity</h3>
                    <p className="text-white">{new Date(project.last_ping_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {project.site_url && (
                  <div className="bg-gray-900 rounded-md p-4 border border-gray-800">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Website</h3>
                    <a 
                      href={project.site_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#3ECF8E] hover:underline truncate block"
                    >
                      {project.site_url}
                    </a>
                  </div>
                )}
                
                {project.repo_url && (
                  <div className="bg-gray-900 rounded-md p-4 border border-gray-800">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Repository</h3>
                    <a 
                      href={project.repo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#3ECF8E] hover:underline truncate flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                      </svg>
                      {project.repo_url}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6 justify-end">
                <button 
                  onClick={() => setActiveTab("tests")}
                  className="px-4 py-2 bg-[#3ECF8E] text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors"
                >
                  Manage A/B Tests
                </button>
              </div>
            </div>
          )}

          {activeTab === "tests" && (
            <TestManager projectId={projectId} />
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Project Settings</h3>
              
              <div className="space-y-4 w-full max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Project Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]" 
                    defaultValue={project.name} 
                    placeholder="Enter project name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea 
                    className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white h-24 focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]" 
                    defaultValue={project.description || ""}
                    placeholder="Brief description of your project"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Website URL
                  </label>
                  <input 
                    type="url" 
                    className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]" 
                    defaultValue={project.site_url || ""}
                    placeholder="https://example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Repository URL
                  </label>
                  <input 
                    type="url" 
                    className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]" 
                    defaultValue={project.repo_url || ""}
                    placeholder="https://github.com/username/repo"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button className="px-4 py-2 bg-[#3ECF8E] text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors">
                  Save Changes
                </button>
                <button className="px-4 py-2 bg-transparent border border-red-500 text-red-500 text-sm font-medium rounded-md hover:bg-red-500/10 transition-colors">
                  Delete Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
