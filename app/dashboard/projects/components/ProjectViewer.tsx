"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";
import TestsTab from "./TestsTab";
import { StatsTab } from "./StatsTab";

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
  const [activeTab, setActiveTab] = useState<"details" | "tests" | "stats">("details");

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
      <div className="card bg-base-100 shadow-sm p-6">
        <div className="flex flex-col space-y-4">
          <div className="skeleton h-10 w-1/2"></div>
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-32 w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="card bg-base-100 shadow-sm p-6">
        <div className="alert alert-error">
          <span>{error || "Project not found"}</span>
          <button onClick={onClose} className="btn btn-sm">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="card-title text-xl">{project.name}</h2>
            <p className="text-sm text-gray-500">ID: {project.id}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs tabs-boxed mb-4">
          <button 
            className={`tab ${activeTab === "details" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button 
            className={`tab ${activeTab === "tests" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("tests")}
          >
            A/B Tests
          </button>
          <button 
            className={`tab ${activeTab === "stats" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            Statistics
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "details" && (
            <div className="space-y-3">
              {project.description && (
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="text-gray-600 mt-1">{project.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <h3 className="font-medium">Created</h3>
                  <p className="text-gray-600">{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
                
                {project.last_ping_at && (
                  <div>
                    <h3 className="font-medium">Last Activity</h3>
                    <p className="text-gray-600">{new Date(project.last_ping_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {project.site_url && (
                  <div>
                    <h3 className="font-medium">Website</h3>
                    <a 
                      href={project.site_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      {project.site_url}
                    </a>
                  </div>
                )}
                
                {project.repo_url && (
                  <div>
                    <h3 className="font-medium">Repository</h3>
                    <a 
                      href={project.repo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      {project.repo_url}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button className="btn btn-primary">
                  Edit Project
                </button>
                <button className="btn btn-error btn-outline">
                  Delete
                </button>
              </div>
            </div>
          )}

          {activeTab === "tests" && (
            <TestsTab projectId={projectId} />
          )}

          {activeTab === "stats" && (
            <StatsTab projectId={projectId} />
          )}
        </div>
      </div>
    </div>
  );
} 