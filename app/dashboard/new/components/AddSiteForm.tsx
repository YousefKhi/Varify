"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";

type VerificationStatus = "idle" | "loading" | "success" | "error";

export default function AddSiteForm() {
  const router = useRouter();
  const [protocol, setProtocol] = useState("https://");
  const [domain, setDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<{ id: string; name: string; site_url: string } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("idle");
  const [copied, setCopied] = useState(false);
  
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
        .eq('user_id', user.id)
        .maybeSingle();

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
      setProjectData(data);
      setCurrentStep(2); // Move to the next step
      
    } catch (error) {
      console.error("Error adding website:", error);
      toast.error("Failed to add website");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scriptCode = projectData ? `<script src="https://varify-sepia.vercel.app/embed.js" data-project="${projectData.id}" async></script>` : '';
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy code");
    }
  };

  const checkVerification = async () => {
    if (!projectData) return;
    
    setVerificationStatus("loading");
    try {
      const response = await fetch(`/api/check-ping?projectId=${projectData.id}`);
      const data = await response.json();

      if (response.ok && data.verified) {
        setVerificationStatus("success");
        toast.success("Script successfully detected!");
      } else {
        setVerificationStatus("error");
        toast.error("Script not detected yet.");
      }
    } catch (error) {
      console.error("Verification check failed:", error);
      setVerificationStatus("error");
      toast.error("Verification check failed. Please try again.");
    }
  };

  const goToProject = () => {
    if (projectData) {
      router.push(`/dashboard/projects/${projectData.id}`);
    }
  };

  const getStepClass = (step: number) => {
    if (step === currentStep) return "bg-primary text-white";
    if (step < currentStep) return "bg-success text-white";
    return "bg-base-300 text-base-content opacity-60";
  };
  
  return (
    <div className="border rounded-lg">
      {/* Step Indicator */}
      <div className="flex justify-center p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${getStepClass(1)}`}>
                {currentStep > 1 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  1
                )}
              </div>
              <span className={`text-xs ${currentStep === 1 ? "text-primary font-semibold" : "text-base-content/60"}`}>
                Add site
              </span>
            </div>
            
            <div className={`h-0.5 w-16 mx-1 ${currentStep > 1 ? "bg-success" : "bg-base-300"}`} />
          </div>

          <div className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${getStepClass(2)}`}>
                2
              </div>
              <span className={`text-xs ${currentStep === 2 ? "text-primary font-semibold" : "text-base-content/60"}`}>
                Install script
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Add Site Form */}
      {currentStep === 1 && (
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
                placeholder="mywebsite.com"
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
      )}

      {/* Step 2: Script Installation */}
      {currentStep === 2 && projectData && (
        <div>
          <div className="p-6">
            <p className="text-sm mb-3">
              Add this script to your website&apos;s <code className="bg-base-200 p-1 rounded text-xs">&lt;head&gt;</code> tag:
            </p>
            
            <div className="bg-base-200 rounded-lg p-4 relative">
              <pre className="text-sm overflow-x-auto">{scriptCode}</pre>
              
              <button
                onClick={copyToClipboard}
                className="absolute top-3 right-3 btn btn-sm btn-ghost"
                aria-label="Copy code"
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-success">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="border-t p-6">
            <h3 className="font-medium mb-2">How it works</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                This script automatically loads and runs A/B tests on your website
              </li>
              <li>
                It&apos;s lightweight (less than 5KB) and won&apos;t slow down your site
              </li>
              <li>
                All tracking is handled automatically in the background
              </li>
              <li>
                Create tests in your dashboard once the script is installed
              </li>
            </ul>
          </div>

          {/* Verification Section */}
          <div className="p-6 border-t">
            <h3 className="text-lg font-medium mb-4">Verify Installation</h3>
            
            {verificationStatus === "idle" && (
              <p className="text-sm mb-4 text-gray-600">
                After installing the script on <code className="bg-base-200 p-1 rounded text-xs">{projectData.name}</code>, click below to verify.
              </p>
            )}
            
            {verificationStatus === "loading" && (
              <div className="flex items-center justify-center p-4">
                <span className="loading loading-spinner loading-md mr-2"></span>
                <span>Checking for script...</span>
              </div>
            )}
            
            {verificationStatus === "success" && (
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Installation verified! You can now create tests for {projectData.name}.</span>
                <button onClick={goToProject} className="btn btn-sm btn-success-content ml-auto">
                  Go to Project
                </button>
              </div>
            )}
            
            {verificationStatus === "error" && (
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div>
                  <p>We couldn&apos;t detect the script yet.</p>
                  <ul className="list-disc pl-5 mt-2 text-xs">
                    <li>Ensure the script is in the <code className="bg-base-200 p-1 rounded text-xs">&lt;head&gt;</code> tag of {projectData.site_url ? <a href={projectData.site_url} target="_blank" rel="noopener noreferrer" className="link link-primary">your website</a> : "your website"}.</li>
                    <li>It might take a few minutes for the ping to register.</li>
                    <li>Clear your browser cache for the site if needed.</li>
                  </ul>
                </div>
              </div>
            )}
            
            {(verificationStatus === "idle" || verificationStatus === "error") && (
              <button 
                onClick={checkVerification}
                className="btn btn-secondary w-full mt-4"
              >
                Verify Installation
              </button>
            )}
          </div>

          <div className="p-6 border-t flex justify-between">
            <button 
              onClick={goToProject} 
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 