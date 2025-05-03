"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import CodePreview from "./CodePreview";
import React from "react";
// Import GitHub components
import FileBrowser from "../github-test-creator/components/FileBrowser";

type TestCreatorProps = {
  projectId: string;
  testId?: string; // Optional - if provided, we're editing an existing test
  onCancel: () => void;
};

type TestData = {
  name: string;
  selector: string;
  goal_type: "click" | "view" | "custom";
  goal_selector?: string;
  split: number;
  variant_a_code: string;
  variant_b_code: string;
  active: boolean;
  file_path?: string;
  branch_name?: string;
};

type Project = {
  id: string;
  name: string;
  repo_url?: string;
};

type Repo = {
  full_name: string;
  default_branch: string;
  private: boolean;
  html_url: string;
  description: string | null;
};

const INITIAL_TEST_DATA: TestData = {
  name: "",
  selector: "",
  goal_type: "click",
  goal_selector: "",
  split: 50,
  variant_a_code: "<div>Original content</div>",
  variant_b_code: "<div>Variation content</div>",
  active: true,
};

export default function TestCreator({ projectId, testId, onCancel }: TestCreatorProps) {
  const [testData, setTestData] = useState<TestData>(INITIAL_TEST_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPreview, setCurrentPreview] = useState<"a" | "b">("a");
  const [existingTest, setExistingTest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!!testId);
  const [project, setProject] = useState<Project | null>(null);
  
  // GitHub integration states
  const [creationMethod, setCreationMethod] = useState<"manual" | "github">("manual");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [githubStep, setGithubStep] = useState<"repo" | "file" | "section" | "variant" | "details">("repo");
  
  const router = useRouter();

  // Fetch project details to check if repo_url exists
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const supabase = createClient();
  
        // Step 1: Get the project from Supabase
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id, name, repo_url")
          .eq("id", projectId)
          .single();
  
        if (projectError || !projectData?.repo_url) throw new Error("Project or repo URL not found");
  
        setProject(projectData);
  
        // Step 2: Only do this if we're creating a new test
        if (!testId && projectData.repo_url) {
          setCreationMethod("github");
  
          // Parse repo URL
          const match = projectData.repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)(\.git)?/);
          if (!match) throw new Error("Invalid GitHub repo URL");
          console.log(match);
  
          const owner = match[1];
          const repo = match[2];
          const full_name = `${owner}/${repo}`;
          
  
          // Step 3: Get GitHub access token
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.provider_token;
          if (!token) throw new Error("GitHub token not found");
  
          // Step 4: Fetch repo info from GitHub
          const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
              Authorization: `token ${token}`,
              Accept: "application/vnd.github.v3+json",
            },
          });
  
          if (!response.ok) throw new Error("Failed to fetch GitHub repo info");
  
          const repoData = await response.json();
          console.log(repoData);
  
          // Step 5: Set selected repo
          const repoObject: Repo = {
            full_name: full_name,
            default_branch: repoData.default_branch,
            private: repoData.private,
            html_url: repoData.html_url,
            description: repoData.description,
          };
          setSelectedRepo(repoObject);
          
          // Skip to file selection step immediately
          setGithubStep("file");
        }
        console.log(selectedRepo);
      } catch (error: any) {
        console.error("Error fetching project or repo:", error);
      }
    };
  
    fetchProject();
  }, [projectId, testId]);
  

  // If testId is provided, fetch the existing test data
  useEffect(() => {
    if (testId) {
      const fetchTestData = async () => {
        try {
          const supabase = createClient();
          
          // Fetch test details
          const { data, error } = await supabase
            .from("tests")
            .select("*")
            .eq("id", testId)
            .single();
            
          if (error) throw error;
          
          // Fetch variants
          const { data: variants, error: variantError } = await supabase
            .from("variants")
            .select("*")
            .eq("test_id", testId)
            .single();
            
          if (variantError && variantError.code !== "PGRST116") {
            // PGRST116 is "no rows returned" which is acceptable
            throw variantError;
          }
          
          setExistingTest(data);
          
          setTestData({
            name: data.name || "",
            selector: data.selector || "",
            goal_type: data.goal_type || "click",
            goal_selector: data.goal_selector || "",
            split: data.split || 50,
            variant_a_code: variants?.variant_a_code || "<div>Original content</div>",
            variant_b_code: variants?.variant_b_code || "<div>Variation content</div>",
            active: !!data.active,
            file_path: data.file_path || "",
            branch_name: data.branch_name || "",
          });
          
          // If file_path exists, we assume it was created from GitHub
          if (data.file_path) {
            setCreationMethod("github");
            setSelectedFile(data.file_path);
          }
        } catch (error) {
          console.error("Error fetching test:", error);
          toast.error("Failed to load test data");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTestData();
    }
  }, [testId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setTestData(prev => ({
      ...prev,
      [name]: type === "checkbox" 
        ? (e.target as HTMLInputElement).checked 
        : name === "split" 
          ? Math.min(100, Math.max(0, parseInt(value) || 0))
          : value
    }));
  };
  
  const openGitHubRepo = () => {
    if (project?.repo_url) {
      window.open(project.repo_url, '_blank');
      toast.success("Select a file in the repository to test");
    }
  };
  
  const handleFileSelection = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please enter a file path");
      return;
    }
    
    // Update the test data with the file path
    setTestData(prev => ({
      ...prev, 
      file_path: selectedFile
    }));
    
    toast.success("File selected! Now highlight the section you want to test");
  };
  
  const handleSectionSelection = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSection) {
      toast.error("Please enter the code section to test");
      return;
    }
    
    // Update the variant code with the selected section
    setTestData(prev => ({
      ...prev,
      variant_a_code: selectedSection,
      variant_b_code: selectedSection
    }));
    
    toast.success("Section selected! Now customize variant B with your changes");
  };

  const handleFileSelect = async (path: string) => {
    setSelectedFile(path);
    setTestData(prev => ({
      ...prev,
      file_path: path
    }));
    setIsLoadingFile(true);
    
    try {
      // Fetch file contents using GitHub API
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      
      if (!token) {
        throw new Error("GitHub token not found");
      }
      
      if (!selectedRepo) {
        throw new Error("Repository not selected");
      }
      
      const [owner, repoName] = selectedRepo.full_name.split('/');
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3.raw",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch file content");
      }
      
      const content = await response.text();
      setFileContent(content);
      setGithubStep("section");
      
      // Auto-generate name based on file name
      if (!testData.name) {
        const fileName = path.split('/').pop() || "";
        setTestData(prev => ({
          ...prev,
          name: `Test for ${fileName}`
        }));
      }
      
    } catch (err: any) {
      console.error("Error fetching file:", err);
      toast.error(err.message || "Failed to fetch file content");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleSelectCodeSection = (section: string) => {
    setSelectedSection(section);
    setTestData(prev => ({
      ...prev,
      variant_a_code: section,
      variant_b_code: section
    }));
    setGithubStep("details");
    toast.success("Section selected! Now customize variant B with your changes");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // Validation
      if (!testData.name.trim()) throw new Error("Test name is required");
      if (!testData.selector.trim()) throw new Error("Element selector is required");
      if (testData.goal_type === "click" && !testData.goal_selector?.trim()) {
        throw new Error("Goal selector is required for click goals");
      }
      
      // Create or update test
      let testResult;
      
      if (testId) {
        // Update existing test
        const { data, error } = await supabase
          .from("tests")
          .update({
            name: testData.name,
            selector: testData.selector,
            goal_type: testData.goal_type,
            goal_selector: testData.goal_selector,
            split: testData.split,
            active: testData.active,
            file_path: testData.file_path,
            branch_name: testData.branch_name,
            updated_at: new Date().toISOString(),
          })
          .eq("id", testId)
          .select()
          .single();
          
        if (error) throw error;
        testResult = data;
        
        // Update variants
        const { error: variantError } = await supabase
          .from("variants")
          .upsert({
            test_id: testId,
            name: "Main Variant",
            variant_a_code: testData.variant_a_code,
            variant_b_code: testData.variant_b_code,
            updated_at: new Date().toISOString(),
          });
          
        if (variantError) throw variantError;
      } else {
        // Create new test
        const { data, error } = await supabase
          .from("tests")
          .insert({
            project_id: projectId,
            name: testData.name,
            selector: testData.selector,
            goal_type: testData.goal_type,
            goal_selector: testData.goal_selector,
            split: testData.split,
            active: testData.active,
            file_path: testData.file_path,
            branch_name: testData.branch_name,
          })
          .select()
          .single();
          
        if (error) throw error;
        testResult = data;
        
        // Create variants
        const { error: variantError } = await supabase
          .from("variants")
          .insert({
            test_id: testResult.id,
            name: "Main Variant",
            variant_a_code: testData.variant_a_code,
            variant_b_code: testData.variant_b_code,
          });
          
        if (variantError) throw variantError;
      }
      
      toast.success(`Test ${testId ? "updated" : "created"} successfully!`);
      onCancel(); // Go back to project view
    } catch (error: any) {
      console.error("Error saving test:", error);
      toast.error(error.message || "Failed to save test");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 bg-[#121212] rounded-md border border-gray-800 p-6">
        <div className="h-8 bg-gray-800 rounded-md w-1/3 animate-pulse"></div>
        <div className="h-6 bg-gray-800 rounded-md w-full animate-pulse"></div>
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="h-64 bg-gray-800 rounded-md animate-pulse"></div>
          <div className="h-64 bg-gray-800 rounded-md animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  // GitHub-based test creation flow
  if (creationMethod === "github" && project?.repo_url) {
    return (
      <>
        {/* Global styles for animations */}
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}</style>
        
        <div className="bg-[#121212] border border-gray-800 rounded-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-white">{testId ? "Edit Test" : "Create New Test"}</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setCreationMethod("manual")}
                className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-md border border-gray-800 transition-colors"
              >
                Switch to Manual Mode
              </button>
              <button 
                onClick={onCancel}
                className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          
          <div className="flex gap-6">
            {/* Left side - Vertical Stepper */}
            <div className="w-60 shrink-0">
              <div className="bg-gray-900 border border-gray-800 rounded-md p-4">
                <h3 className="text-white font-medium mb-4">Easy A/B Test Steps</h3>
                
                <div className="flex flex-col space-y-6">
                  {/* Step 1: Pick File */}
                  <div className="flex">
                    <div className="mr-3 flex flex-col items-center">
                      <div 
                        className={`rounded-full w-8 h-8 flex items-center justify-center text-sm cursor-pointer transition-all duration-300 ${
                          githubStep === "file" 
                            ? "bg-[#3ECF8E] text-white" 
                            : (githubStep === "section" || githubStep === "variant" || githubStep === "details") 
                              ? "bg-gray-800 text-[#3ECF8E] border border-[#3ECF8E]" 
                              : "bg-gray-800 text-gray-400"
                        }`}
                        onClick={() => {
                          if (githubStep === "section" || githubStep === "variant" || githubStep === "details") {
                            setGithubStep("file");
                          }
                        }}
                      >
                        1
                      </div>
                      {(githubStep === "section" || githubStep === "variant" || githubStep === "details") && (
                        <div className="w-0.5 h-full bg-[#3ECF8E] my-1"></div>
                      )}
                    </div>
                    <div 
                      className={`cursor-pointer ${(githubStep === "section" || githubStep === "variant" || githubStep === "details") ? "cursor-pointer" : ""}`}
                      onClick={() => {
                        if (githubStep === "section" || githubStep === "variant" || githubStep === "details") {
                          setGithubStep("file");
                        }
                      }}
                    >
                      <h4 className={`font-medium ${githubStep === "file" ? "text-white" : "text-gray-400"}`}>Select File</h4>
                      <p className="text-xs text-gray-500 mt-1">Choose the file you want to test</p>
                    </div>
                  </div>
                  
                  {/* Step 2: Select Section (Variant A) - Only show when file is selected */}
                  {(githubStep === "section" || githubStep === "variant" || githubStep === "details") && (
                    <div className="flex opacity-100 transform translate-y-0 transition-all duration-500" 
                         style={{animationDelay: "0.2s"}}>
                      <div className="mr-3 flex flex-col items-center">
                        <div 
                          className={`rounded-full w-8 h-8 flex items-center justify-center text-sm cursor-pointer transition-all duration-300 ${
                            githubStep === "section" 
                              ? "bg-[#3ECF8E] text-white" 
                              : (githubStep === "variant" || githubStep === "details") 
                                ? "bg-gray-800 text-[#3ECF8E] border border-[#3ECF8E]" 
                                : "bg-gray-800 text-gray-400"
                          }`}
                          onClick={() => {
                            if (githubStep === "variant" || githubStep === "details") {
                              setGithubStep("section");
                            }
                          }}
                        >
                          2
                        </div>
                        {(githubStep === "variant" || githubStep === "details") && (
                          <div className="w-0.5 h-full bg-[#3ECF8E] my-1"></div>
                        )}
                      </div>
                      <div 
                        className={`${(githubStep === "variant" || githubStep === "details") ? "cursor-pointer" : ""}`}
                        onClick={() => {
                          if (githubStep === "variant" || githubStep === "details") {
                            setGithubStep("section");
                          }
                        }}
                      >
                        <h4 className={`font-medium ${githubStep === "section" ? "text-white" : "text-gray-400"}`}>Original Content</h4>
                        <p className="text-xs text-gray-500 mt-1">Select the content you want to test</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 3: Create Variant B - Only show when section is selected */}
                  {(githubStep === "variant" || githubStep === "details") && (
                    <div className="flex opacity-100 transform translate-y-0 transition-all duration-500" 
                         style={{animationDelay: "0.3s"}}>
                      <div className="mr-3 flex flex-col items-center">
                        <div 
                          className={`rounded-full w-8 h-8 flex items-center justify-center text-sm cursor-pointer transition-all duration-300 ${
                            githubStep === "variant" 
                              ? "bg-[#3ECF8E] text-white" 
                              : githubStep === "details" 
                                ? "bg-gray-800 text-[#3ECF8E] border border-[#3ECF8E]" 
                                : "bg-gray-800 text-gray-400"
                          }`}
                          onClick={() => {
                            if (githubStep === "details") {
                              setGithubStep("variant");
                            }
                          }}
                        >
                          3
                        </div>
                        {githubStep === "details" && (
                          <div className="w-0.5 h-full bg-[#3ECF8E] my-1"></div>
                        )}
                      </div>
                      <div 
                        className={`${githubStep === "details" ? "cursor-pointer" : ""}`}
                        onClick={() => {
                          if (githubStep === "details") {
                            setGithubStep("variant");
                          }
                        }}
                      >
                        <h4 className={`font-medium ${githubStep === "variant" ? "text-white" : "text-gray-400"}`}>Create Variation</h4>
                        <p className="text-xs text-gray-500 mt-1">Design your alternative version</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 4: Finalize Test - Only show when on final step */}
                  {githubStep === "details" && (
                    <div className="flex opacity-100 transform translate-y-0 transition-all duration-500" 
                         style={{animationDelay: "0.4s"}}>
                      <div className="mr-3">
                        <div className={`rounded-full w-8 h-8 flex items-center justify-center text-sm transition-all duration-300 ${githubStep === "details" ? "bg-[#3ECF8E] text-white" : "bg-gray-800 text-gray-400"}`}>
                          4
                        </div>
                      </div>
                      <div>
                        <h4 className={`font-medium ${githubStep === "details" ? "text-white" : "text-gray-400"}`}>Launch Test</h4>
                        <p className="text-xs text-gray-500 mt-1">Finalize your test settings</p>
                      </div>
                    </div>
                  )}
                </div>
                
                
              </div>
            </div>
            
            {/* Right side - Content */}
            <div className="flex-1">
              {/* Step 1 - File Selection */}
              {githubStep === "file" && selectedRepo && (
                <div className="bg-gray-900 border border-gray-800 rounded-md p-6 animate-fadeIn">
                  <h3 className="text-white font-medium text-lg mb-2">Step 1: Select a File</h3>
                  <p className="text-gray-400 text-sm mb-4">Browse and select the file containing the content you want to test.</p>
                  
                  <FileBrowser repo={selectedRepo} onSelectFile={handleFileSelect} />
                  
                  <div className="mt-4 text-gray-400 text-xs">
                    <p>Tip: Look for files with HTML or JSX content that contain user interface elements.</p>
                  </div>
                </div>
              )}
              
              {/* Step 2 - Select Original Content */}
              {githubStep === "section" && fileContent && (
                <div className="bg-gray-900 border border-gray-800 rounded-md p-6 animate-fadeIn">
                  <h3 className="text-white font-medium text-lg mb-2">Step 2: Select Original Content</h3>
                  <p className="text-gray-400 text-sm mb-4">Copy or select the HTML content you want to test from {selectedFile}</p>
                  
                  <div className="mb-6">
                    <div className="bg-[#121212] p-4 rounded-md border border-gray-800 overflow-auto max-h-[300px]">
                      <pre className="text-sm font-mono whitespace-pre-wrap text-gray-300">{fileContent}</pre>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Copy the HTML section you want to test from the file above</p>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Paste the original HTML content here:
                    </label>
                    <textarea
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      placeholder="<div>Paste the original HTML/content here...</div>"
                      className="w-full bg-[#121212] border border-gray-800 rounded-md px-3 py-2 text-white font-mono text-sm h-40 focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      onClick={() => setGithubStep("file")}
                      className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-md border border-gray-800 transition-colors"
                    >
                      Back to File Selection
                    </button>
                    <button 
                      onClick={() => {
                        handleSelectCodeSection(selectedSection);
                        setGithubStep("variant");
                      }}
                      className="px-4 py-2 bg-[#3ECF8E] text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      disabled={!selectedSection}
                    >
                      Continue to Create Variation
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 3 - Create Variant B and Set Split */}
              {githubStep === "variant" && selectedSection && (
                <div className="bg-gray-900 border border-gray-800 rounded-md p-6 animate-fadeIn">
                  <h3 className="text-white font-medium text-lg mb-2">Step 3: Create Your Variation</h3>
                  <p className="text-gray-400 text-sm mb-4">Edit the content below to create your test variant.</p>
                  
                  <div className="mb-6">
                    <div className="flex mb-2">
                      <div className="w-1/2 pr-2">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Original Version (A)</h4>
                        <div className="bg-[#121212] p-3 rounded-md border border-gray-800 h-48 overflow-auto">
                          <pre className="text-xs font-mono whitespace-pre-wrap text-gray-300">{testData.variant_a_code}</pre>
                        </div>
                      </div>
                      <div className="w-1/2 pl-2">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Your Variation (B)</h4>
                        <textarea
                          name="variant_b_code"
                          value={testData.variant_b_code}
                          onChange={handleChange}
                          placeholder="Edit this version to create your test variation"
                          className="w-full bg-[#121212] border border-gray-800 rounded-md px-3 py-2 text-gray-300 font-mono text-xs h-48 focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Tip: Make small, focused changes for more meaningful test results</p>
                  </div>
                  
                  <div className="mb-6 bg-[#121212] rounded-md p-4 border border-gray-800">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Preview Your Variations</h4>
                    
                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <div className="text-xs text-center font-medium text-white mb-2">Version A (Original)</div>
                        <div className="bg-white rounded-md border border-gray-700 p-2 h-32 overflow-auto">
                          <CodePreview html={testData.variant_a_code} />
                        </div>
                      </div>
                      <div className="w-1/2">
                        <div className="text-xs text-center font-medium text-white mb-2">Version B (Variation)</div>
                        <div className="bg-white rounded-md border border-gray-700 p-2 h-32 overflow-auto">
                          <CodePreview html={testData.variant_b_code} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Traffic Split
                      <span className="text-xs ml-2 text-gray-500">{testData.split}% will see version B</span>
                    </label>
                    <input
                      type="range"
                      name="split"
                      min="0"
                      max="100"
                      value={testData.split}
                      onChange={handleChange}
                      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#3ECF8E]"
                    />
                    <div className="flex justify-between px-2 text-xs text-gray-500 mt-1">
                      <span>0% see variant B</span>
                      <span>50/50 split</span>
                      <span>100% see variant B</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      onClick={() => setGithubStep("section")}
                      className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-md border border-gray-800 transition-colors"
                    >
                      Back to Original Content
                    </button>
                    <button 
                      onClick={() => {
                        // Auto-generate a CSS selector based on the content
                        let autoSelector = "";
                        
                        // Simple algorithm to find a likely ID or class in the HTML
                        const html = testData.variant_a_code;
                        const idMatch = html.match(/id=["']([^"']+)["']/i);
                        const classMatch = html.match(/class=["']([^"']+)["']/i);
                        
                        if (idMatch && idMatch[1]) {
                          autoSelector = `#${idMatch[1].split(/\s+/)[0]}`; // Take first ID if multiple
                        } else if (classMatch && classMatch[1]) {
                          autoSelector = `.${classMatch[1].split(/\s+/)[0]}`; // Take first class if multiple
                        } else {
                          // Fallback to element type
                          const elementMatch = html.match(/<([a-z0-9]+)[\s>]/i);
                          if (elementMatch && elementMatch[1]) {
                            autoSelector = elementMatch[1].toLowerCase();
                          } else {
                            autoSelector = "div"; // Default fallback
                          }
                        }
                        
                        // Update selector in test data
                        setTestData({
                          ...testData,
                          selector: autoSelector,
                          name: `Test for ${selectedFile.split('/').pop()}` // Auto-generate name
                        });
                        
                        setGithubStep("details");
                      }}
                      className="px-4 py-2 bg-[#3ECF8E] text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors"
                    >
                      Continue to Launch
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 4 - Launch Test */}
              {githubStep === "details" && selectedSection && (
                <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-md p-6 animate-fadeIn">
                  <h3 className="text-white font-medium text-lg mb-2">Step 4: Launch Your A/B Test</h3>
                  <p className="text-gray-400 text-sm mb-4">Review your test settings and launch when ready.</p>
                  
                  {/* Replace blue background box with inline styled content */}
                  <div className="flex items-start mb-5 bg-gray-900 border-l-2 border-[#3ECF8E] pl-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 mr-2 mt-0.5 text-[#3ECF8E] flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor"></path>
                    </svg>
                    <div>
                      <span className="text-sm font-medium text-white">Test configured successfully</span>
                      <p className="text-xs text-gray-400">Review the settings below and launch your test when ready.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Test Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={testData.name}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Element Selector <span className="text-xs text-gray-500">(Auto-generated)</span>
                      </label>
                      <input
                        type="text"
                        name="selector"
                        value={testData.selector}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This identifies the element to be tested - we've automatically detected this for you.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-400">
                          Goal Type
                        </label>
                        <span className="text-xs text-gray-500">What counts as a conversion?</span>
                      </div>
                      <select
                        name="goal_type"
                        value={testData.goal_type}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
                      >
                        <option value="click">Button/Link Click</option>
                        <option value="view">Page View</option>
                        <option value="custom">Custom Event</option>
                      </select>
                    </div>
                    
                    <div className="pt-2 relative">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="active"
                          checked={testData.active}
                          onChange={(e) => setTestData({...testData, active: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3ECF8E]"></div>
                        <span className="ms-3 text-sm font-medium text-white">Activate test immediately</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-12">
                        When active, this test will run for visitors to your site.
                      </p>
                    </div>
                  </div>
                  
                  {testData.goal_type === "click" && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Goal Selector
                        <span className="text-xs ml-1 text-gray-500">Element to track clicks on</span>
                      </label>
                      <input
                        type="text"
                        name="goal_selector"
                        value={testData.goal_selector || ""}
                        onChange={handleChange}
                        placeholder="e.g. #signup-button, .purchase-btn, or button"
                        className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is the element users will click on to count as a conversion.
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-[#121212] rounded-md p-4 border border-gray-800 mb-6">
                    <h4 className="text-sm font-medium text-white mb-3">Installation Instructions</h4>
                    <p className="text-sm text-gray-400 mb-3">
                      After launching your test, add this small script to your website:
                    </p>
                    <div className="bg-gray-900 p-3 rounded-md border border-gray-700">
                      <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap overflow-x-auto">
{`<script>
  (function(w,d,s,p,i) {
    var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s);
    j.async=true;
    j.src='https://varify.yourdomain.com/api/loader.js';
    j.setAttribute('data-project-id', '${projectId}');
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','${projectId}');
</script>`}
                      </pre>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Add this script to your website &lt;head&gt; tag. No coding skills required!
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      type="button"
                      onClick={() => setGithubStep("variant")}
                      className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-md border border-gray-800 transition-colors"
                      disabled={isSubmitting}
                    >
                      Back to Variation
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#3ECF8E] text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Launching Test...
                        </span>
                      ) : (
                        testId ? "Update Test" : "Launch A/B Test"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      
    </>
  );
}

// Default manual test creation flow
return (
  <>
    {/* Global styles for animations */}
    <style jsx global>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out forwards;
      }
    `}</style>
    
    <div className="bg-[#121212] border border-gray-800 rounded-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-white">{testId ? "Edit Test" : "Create New Test"}</h2>
        <div className="flex gap-2">
          {project?.repo_url && (
            <button 
              onClick={() => setCreationMethod("github")}
              className="flex items-center px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-md border border-gray-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-2">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Use GitHub File
            </button>
          )}
          <button 
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column - Basic info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Test Name
              </label>
              <input
                type="text"
                name="name"
                value={testData.name}
                onChange={handleChange}
                placeholder="e.g. Homepage Hero Button Test"
                className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Element Selector
                <span className="text-xs ml-1 text-gray-500">CSS or ID selector to target</span>
              </label>
              <input
                type="text"
                name="selector"
                value={testData.selector}
                onChange={handleChange}
                placeholder="e.g. #hero-cta or .product-card"
                className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Goal Type
              </label>
              <select
                name="goal_type"
                value={testData.goal_type}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
              >
                <option value="click">Button/Element Click</option>
                <option value="view">Page View</option>
                <option value="custom">Custom Event</option>
              </select>
            </div>
            
            {testData.goal_type === "click" && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Goal Selector
                  <span className="text-xs ml-1 text-gray-500">Element to track clicks on</span>
                </label>
                <input
                  type="text"
                  name="goal_selector"
                  value={testData.goal_selector || ""}
                  onChange={handleChange}
                  placeholder="e.g. #signup-button or .purchase-btn"
                  className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Traffic Split
                <span className="text-xs ml-2 text-gray-500">{testData.split}% for B</span>
              </label>
              <input
                type="range"
                name="split"
                min="0"
                max="100"
                value={testData.split}
                onChange={handleChange}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#3ECF8E]"
              />
              <div className="flex justify-between px-2 text-xs text-gray-500 mt-1">
                <span>0% B</span>
                <span>50/50</span>
                <span>100% B</span>
              </div>
            </div>
            
            <div className="pt-2 relative">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={testData.active}
                  onChange={(e) => setTestData({...testData, active: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3ECF8E]"></div>
                <span className="ms-3 text-sm font-medium text-white">Active</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-12">
                When active, this test will run for visitors to your site.
              </p>
            </div>
          </div>
          
          {/* Right column - Variant code */}
          <div className="space-y-4">
            <div className="border-b border-gray-800 mb-2">
              <div className="flex space-x-6">
                <button
                  type="button"
                  className={`text-sm pb-3 px-1 font-medium transition-colors ${currentPreview === "a" ? "text-white border-b-2 border-[#3ECF8E]" : "text-gray-400 hover:text-white"}`}
                  onClick={() => setCurrentPreview("a")}
                >
                  Variant A (Original)
                </button>
                <button
                  type="button"
                  className={`text-sm pb-3 px-1 font-medium transition-colors ${currentPreview === "b" ? "text-white border-b-2 border-[#3ECF8E]" : "text-gray-400 hover:text-white"}`}
                  onClick={() => setCurrentPreview("b")}
                >
                  Variant B (Test)
                </button>
              </div>
            </div>
            
            {currentPreview === "a" ? (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Original Content (A)
                </label>
                <textarea
                  name="variant_a_code"
                  value={testData.variant_a_code}
                  onChange={handleChange}
                  placeholder="<div>Your original HTML here</div>"
                  className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-gray-300 font-mono text-sm h-40 focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Variation Content (B)
                </label>
                <textarea
                  name="variant_b_code"
                  value={testData.variant_b_code}
                  onChange={handleChange}
                  placeholder="<div>Your variation HTML here</div>"
                  className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-gray-300 font-mono text-sm h-40 focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
                  required
                />
              </div>
            )}
            
            <div className="bg-gray-900 rounded-md p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Preview</h3>
              <div className="bg-white p-3 rounded-md border border-gray-700">
                <CodePreview html={currentPreview === "a" ? testData.variant_a_code : testData.variant_b_code} />
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Additional Settings (Optional)
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="file_path"
              value={testData.file_path || ""}
              onChange={handleChange}
              placeholder="File path (e.g. /pages/index.js)"
              className="bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
            />
            <input
              type="text"
              name="branch_name"
              value={testData.branch_name || ""}
              onChange={handleChange}
              placeholder="Git branch name"
              className="bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E]"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-md transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#3ECF8E] text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              testId ? "Update Test" : "Create Test"
            )}
          </button>
        </div>
      </form>
    </div>
  </>
);
} 