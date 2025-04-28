"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  site_url?: string;
  repo_url?: string;
  last_ping_at?: string;
};

type ProjectsListProps = {
  onSelectProject: (projectId: string) => void;
  selectedProjectId: string | null;
};

export default function ProjectsList({ onSelectProject, selectedProjectId }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-sm p-6">
        <div className="flex flex-col space-y-4">
          <div className="skeleton h-10 w-3/4"></div>
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-32 w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-100 shadow-sm p-6">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">Your Projects</h2>
          <Link href="/dashboard/projects/new" className="btn btn-primary btn-sm">
            New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No projects found.</p>
            <p className="text-sm mt-2">Create your first project to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`card bg-base-200 cursor-pointer transition-all hover:bg-base-300 ${
                  selectedProjectId === project.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => onSelectProject(project.id)}
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{project.name}</h3>
                    <span className="badge badge-sm">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 