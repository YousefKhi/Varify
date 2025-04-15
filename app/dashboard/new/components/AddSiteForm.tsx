"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";

export default function AddSiteForm() {
  const router = useRouter();
  const [protocol, setProtocol] = useState("https://");
  const [domain, setDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedDomain = domain.trim();
    if (!trimmedDomain) {
      toast.error("Website domain is required");
      return;
    }
    
    const siteUrl = `${protocol}${trimmedDomain}`;
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check for existing project with the same URL for the current user
      const { data: existingProject, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .eq('site_url', siteUrl)
        .eq('user_id', user.id) // Ensure it checks only for the current user
        .maybeSingle(); // Use maybeSingle to handle 0 or 1 result

      if (checkError) {
        throw checkError;
      }

      if (existingProject) {
        toast.error(`A project with the URL ${siteUrl} already exists.`);
        setIsSubmitting(false);
        return;
      }
      
      // Insert new site if no duplicate found
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: trimmedDomain,
          site_url: siteUrl,
          user_id: user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success("Website added successfully!");
      
      // Redirect to next step
      router.push(`/dashboard/projects/${data.id}/setup`);
      
    } catch (error) {
      console.error("Error adding website:", error);
      toast.error("Failed to add website");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="border rounded-lg">
      <form onSubmit={handleSubmit} className="p-8">
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Domain</label>
          <div className="flex">
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="select select-bordered rounded-r-none w-[120px]"
            >
              <option value="https://">https://</option>
              <option value="http://">http://</option>
            </select>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="unicorn.com"
              className="input input-bordered flex-1 rounded-l-none"
              required
            />
          </div>
        </div>
                
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            "Add website"
          )}
        </button>
      </form>
    </div>
  );
} 