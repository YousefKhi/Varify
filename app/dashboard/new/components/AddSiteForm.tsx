"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StepsIndicator from "@/app/dashboard/new/components/StepsIndicator";

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
    window.location.href = '/signin';
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

      // Create project directly with Supabase
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: repo.name,
          repo_url: repo.html_url,
          user_id: user.id,
          site_url: null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }
      
      toast.success("Project created successfully!");
      
      // Return to dashboard with the newly created project
      router.push(`/dashboard`);
      
    } catch (error: any) {
      console.error("Error creating project from GitHub:", error);
      toast.error(`Failed to create project: ${error.message || "Unknown error"}`);
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
      router.push(`/dashboard`);
    }
  };

  
  
  // Mode toggle handler
  const handleModeChange = (value: string) => {
    setMode(value as CreateMode);
  };
  
  return (
    <div className="bg-[#171717] border border-[#444444] rounded-md">
      {/* Mode Selector Tabs */}
      <div className="p-4 border-b border-[#444444]">
        <Tabs 
          defaultValue="manual" 
          value={mode} 
          onValueChange={handleModeChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-[#1f1f1f] p-1">
            <TabsTrigger value="manual" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">Manual Mode</TabsTrigger>
            <TabsTrigger value="github" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">From GitHub Repo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {mode === "manual" && (
        <>
          {/* Use the updated StepsIndicator component that already has correct styling */}
          <div className="p-4 border-b border-[#444444]">
            <StepsIndicator currentStep={currentStep} />
          </div>

          {/* Step 1: Add Site Form */}
          {currentStep === 1 && (
            <form onSubmit={handleSubmit} className="p-8">
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2 text-gray-300">Domain</label>
                <div className="flex">
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    className="bg-[#1f1f1f] border border-[#444444] rounded-l-md px-3 py-2 text-white w-[120px] focus:outline-none focus:ring-1 focus:ring-[#39a276]"
                  >
                    <option value="https://">https://</option>
                    <option value="http://">http://</option>
                  </select>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="mywebsite.com"
                    className="bg-[#1f1f1f] border border-[#444444] border-l-0 rounded-r-md px-3 py-2 text-white w-full focus:outline-none focus:ring-1 focus:ring-[#39a276]"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-[#39a276] hover:bg-opacity-90 text-white px-4 py-2 rounded-md transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
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
                <p className="text-sm mb-3 text-gray-300">
                  Add this script to your website&apos;s <code className="bg-[#1f1f1f] p-1 rounded text-xs">&lt;head&gt;</code> tag:
                </p>
                
                <div className="bg-[#1f1f1f] border border-[#444444] rounded-md p-4 relative">
                  <pre className="text-sm overflow-x-auto text-gray-300">{scriptCode}</pre>
                  
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-3 right-3 p-1.5 bg-[#2a2a2a] hover:bg-[#333333] rounded-md transition-colors"
                    aria-label="Copy code"
                  >
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#39a276]">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-300">
                        <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                        <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="border-t border-[#444444] p-6">
                <h3 className="font-medium mb-2 text-white">How it works</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
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
                    className="bg-transparent border border-[#444444] hover:bg-[#1f1f1f] text-white px-4 py-2 rounded-md transition-colors"
                    disabled={verificationStatus === "loading"}
                  >
                    {verificationStatus === "loading" ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    ) : null}
                    Verify Installation
                  </button>
                  
                  {verificationStatus === "success" && (
                    <div className="bg-[#39a276]/10 border border-[#39a276]/20 text-[#39a276] p-3 rounded-md flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Script detected! Your website is ready for A/B testing.</span>
                    </div>
                  )}
                  
                  {verificationStatus === "error" && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-md flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <span className="font-medium">Script not detected.</span>
                        <p className="text-xs mt-1">Make sure you&apos;ve added the script to your site and wait a few minutes before checking again.</p>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={goToProject}
                    className="bg-[#39a276] hover:bg-opacity-90 text-white px-4 py-2 rounded-md transition-colors"
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
              <span className="inline-block w-8 h-8 border-4 border-[#39a276] border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : !isGithubAuthenticated ? (
            <div className="text-center py-12 space-y-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.16 22 16.419 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <h3 className="text-lg font-medium text-white">Connect to GitHub</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Connect your GitHub account to import repositories and create projects automatically.
              </p>
              <div className="mt-4">
                <button 
                  onClick={connectGithub}
                  className="bg-[#39a276] hover:bg-opacity-90 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center mx-auto"
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
              <span className="inline-block w-8 h-8 border-4 border-[#39a276] border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : githubRepos.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="font-medium text-white">No repositories found</h3>
              <p className="text-gray-400 mt-2">
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
                className="mt-4 bg-transparent border border-[#444444] hover:bg-[#1f1f1f] text-white px-4 py-2 rounded-md transition-colors"
              >
                Refresh Repositories
              </button>
            </div>
          ) : (
            <div>
              <h3 className="font-medium mb-4 text-white">Select a repository to import</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {githubRepos.map(repo => (
                  <div 
                    key={repo.id} 
                    className="relative bg-gradient-to-br from-[#1f1f1f] to-[#1a1a1a] border border-[#444444] rounded-lg overflow-hidden group hover:border-[#39a276]/50 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#39a276]/5"
                  >
                    {/* Accent line at top */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#39a276]/0 via-[#39a276] to-[#39a276]/0"></div>
                    
                    <div className="p-5">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5 text-gray-400 group-hover:text-[#39a276] transition-colors">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-lg truncate">{repo.name}</h4>
                          {repo.description ? (
                            <p className="text-sm text-gray-400 line-clamp-2 mt-1 min-h-[40px]">{repo.description}</p>
                          ) : (
                            <p className="text-sm text-gray-500 italic mt-1 min-h-[40px]">No description available</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-[#333333] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            repo.visibility === 'public' 
                              ? 'bg-[#39a276]/10 text-[#39a276] border border-[#39a276]/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {repo.visibility}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mr-1">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                            </svg>
                            {new Date(repo.updated_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <button
                          className="bg-[#39a276] hover:bg-[#2c8660] text-white px-4 py-1.5 text-sm rounded-md transition-colors inline-flex items-center font-medium"
                          onClick={() => createFromGithub(repo)}
                          disabled={isSubmitting && selectedRepo?.id === repo.id}
                        >
                          {isSubmitting && selectedRepo?.id === repo.id ? (
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                              </svg>
                              Import
                            </>
                          )}
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