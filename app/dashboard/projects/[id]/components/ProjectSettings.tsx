"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";

type ProjectSettingsProps = {
  project: {
    id: string;
    name: string;
    description?: string;
    // Add other project properties as needed
  };
};

export default function ProjectSettings({ project }: ProjectSettingsProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('projects')
        .update({
          name,
          description: description.trim() || null,
        })
        .eq('id', project.id);
        
      if (error) throw error;
      
      toast.success("Project updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    setName(project.name);
    setDescription(project.description || "");
    setIsEditing(false);
  };
  
  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border shadow-sm">
      <h2 className="text-xl font-bold mb-6">Project Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Project Details</h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Project Name</span>
                  </div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input input-bordered w-full" 
                    placeholder="My Awesome App"
                  />
                </label>
              </div>
              
              <div>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Description (Optional)</span>
                  </div>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="textarea textarea-bordered w-full" 
                    placeholder="A short description of your project"
                    rows={3}
                  />
                </label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={handleCancel}
                  className="btn btn-ghost"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Project Name</div>
                <div className="text-lg">{project.name}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Description</div>
                <div>{project.description || "No description provided"}</div>
              </div>
              
              <button 
                onClick={() => setIsEditing(true)}
                className="btn btn-outline btn-sm"
              >
                Edit Details
              </button>
            </div>
          )}
        </div>
        
        <div className="divider"></div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">JavaScript Snippet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add this snippet to your website to start tracking and running A/B tests.
          </p>
          
          <div className="bg-base-300 p-4 rounded-lg">
            <pre className="text-xs overflow-x-auto">
              {`<script>
  (function(w,d,s,l,i){
    w[l]=w[l]||[];w[l].push({'projectId':'${project.id}'});
    var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
    j.async=true;j.src='https://cdn.abfast.io/tracking.js'+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','abfast','${project.id}');
</script>`}
            </pre>
          </div>
          
          <button className="btn btn-sm mt-4">
            Copy Code
          </button>
        </div>
        
        <div className="divider"></div>
        
        <div>
          <h3 className="text-lg font-medium mb-4 text-error">Danger Zone</h3>
          <button className="btn btn-error btn-outline">
            Delete Project
          </button>
        </div>
      </div>
    </section>
  );
} 