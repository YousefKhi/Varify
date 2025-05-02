"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type VerificationStatus = "idle" | "loading" | "success" | "error";
type CreateMode = "manual" | "github";
type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  visibility: string;
  updated_at: string;
};

export default function AddSiteForm() {
  const router = useRouter();
  const [mode, setMode] = useState<CreateMode>("manual");
  const [protocol, setProtocol] = useState("https://");
  const [domain, setDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<{ id: string; name: string; site_url: string } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("idle");
  const [copied, setCopied] = useState(false);
  
  // GitHub integration states
  const [isGithubAuthenticated, setIsGithubAuthenticated] = useState<boolean | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  
  // Check if user is authenticated with GitHub
  useEffect(() => {
    const checkGithubAuth = async () => {
      try {
        const supabase = createClient();
        
        // Get current session with provider token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        // Check if user has GitHub token in session
        const ghToken = session.provider_token;
        
        setIsGithubAuthenticated(!!ghToken);
        
        // If authenticated, fetch repos
        if (ghToken) {
          fetchGithubRepos(ghToken);
        }
      } catch (error) {
        console.error("Error checking GitHub auth:", error);
        setIsGithubAuthenticated(false);
      }
    };
    
    if (mode === "github") {
      checkGithubAuth();
    }
  }, [mode]);
  
  // Fetch GitHub repos
  const fetchGithubRepos = async (token?: string) => {
    setLoadingRepos(true);
    try {
      // Pass the token in the request headers if available
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json' 
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/github/repos', { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch repos');
      }
      
      const data = await response.json();
      setGithubRepos(data);
    } catch (error) {
      console.error("Error fetching GitHub repos:", error);
      toast.error("Failed to load GitHub repositories");
    } finally {
      setLoadingRepos(false);
    }
  };

  // Connect to GitHub
  const connectGithub = () => {
    window.location.href = '/api/auth/github';
  };
  
  // Create project from GitHub repo
  const createFromGithub = async (repo: GitHubRepo) => {
    setIsSubmitting(true);
    setSelectedRepo(repo);
    
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create project from GitHub repo
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubRepo: repo.full_name,
          name: repo.name,
          description: repo.description || `Project imported from ${repo.full_name}`,
          repo_url: repo.html_url,
          user_id: user.id
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }
      
      const data = await response.json();
      
      toast.success("Project created successfully!");
      router.push(`/dashboard/projects/${data.id}`);
      
    } catch (error) {
      console.error("Error creating project from GitHub:", error);
      toast.error("Failed to create project from GitHub repository");
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
  
  // Mode toggle handler
  const handleModeChange = (value: string) => {
    setMode(value as CreateMode);
  };
  
  return (
    <div className="border rounded-lg">
      {/* Mode Selector Tabs */}
      <div className="p-4 border-b">
        <Tabs 
          defaultValue="manual" 
          value={mode} 
          onValueChange={handleModeChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Mode</TabsTrigger>
            <TabsTrigger value="github">From GitHub Repo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {mode === "manual" && (
        <>
          {/* Step Indicator for Manual Mode */}
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
                    Once installed, you can create and manage tests from your dashboard
                  </li>
                </ul>
                
                <div className="mt-6 flex flex-col space-y-3">
                  <button
                    onClick={checkVerification}
                    className="btn btn-outline"
                    disabled={verificationStatus === "loading"}
                  >
                    {verificationStatus === "loading" ? (
                      <span className="loading loading-spinner loading-xs mr-2"></span>
                    ) : null}
                    Verify Installation
                  </button>
                  
                  {verificationStatus === "success" && (
                    <div className="alert alert-success shadow-sm text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>Script detected! Your website is ready for A/B testing.</span>
                    </div>
                  )}
                  
                  {verificationStatus === "error" && (
                    <div className="alert alert-warning shadow-sm text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <div>
                        <span className="font-semibold">Script not detected.</span>
                        <p className="text-xs mt-1">Make sure you&apos;ve added the script to your site and wait a few minutes before checking again.</p>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={goToProject}
                    className="btn btn-primary"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {mode === "github" && (
        <div className="p-6">
          {isGithubAuthenticated === null ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : !isGithubAuthenticated ? (
            <div className="text-center py-12 space-y-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto opacity-70" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.16 22 16.419 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <h3 className="text-lg font-medium">Connect to GitHub</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Connect your GitHub account to import repositories and create projects automatically.
              </p>
              <div className="mt-4">
                <button 
                  onClick={connectGithub}
                  className="btn btn-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.16 22 16.419 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  Connect GitHub Account
                </button>
              </div>
            </div>
          ) : loadingRepos ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : githubRepos.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="font-medium">No repositories found</h3>
              <p className="text-gray-500 mt-2">
                We couldn&apos;t find any repositories in your GitHub account.
              </p>
              <button
                onClick={() => {
                  const checkSessionAndRefresh = async () => {
                    const supabase = createClient();
                    const { data: { session } } = await supabase.auth.getSession();
                    fetchGithubRepos(session?.provider_token);
                  };
                  checkSessionAndRefresh();
                }}
                className="btn btn-outline mt-4"
              >
                Refresh Repositories
              </button>
            </div>
          ) : (
            <div>
              <h3 className="font-medium mb-4">Select a repository to import</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {githubRepos.map(repo => (
                  <div key={repo.id} className="card bg-base-200 hover:bg-base-300 transition-colors">
                    <div className="card-body p-4">
                      <h4 className="card-title text-base">{repo.name}</h4>
                      {repo.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{repo.description}</p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span className={`badge ${repo.visibility === 'public' ? 'badge-success' : 'badge-warning'} badge-sm mr-2`}>
                          {repo.visibility}
                        </span>
                        <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                      </div>
                      <div className="card-actions justify-end mt-3">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => createFromGithub(repo)}
                          disabled={isSubmitting && selectedRepo?.id === repo.id}
                        >
                          {isSubmitting && selectedRepo?.id === repo.id ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : "Select"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 