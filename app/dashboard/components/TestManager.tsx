"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";
import TestCreator from "./TestCreator";
import TestDetails from "./TestDetails";
import EmbedCodeModal from "./EmbedCodeModal";

type TestManagerProps = {
  projectId: string;
};

type Test = {
  id: string;
  name: string;
  selector: string;
  active: boolean;
  created_at: string;
  goal_type: string;
  split: number;
  project_id: string;
};

export default function TestManager({ projectId }: TestManagerProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create" | "edit" | "detail">("list");
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  // Fetch tests when component mounts or projectId changes
  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("tests")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        setTests(data || []);
      } catch (err) {
        console.error("Error fetching tests:", err);
        setError("Failed to load tests");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTests();
  }, [projectId]);

  const handleCreateTest = () => {
    setSelectedTestId(null);
    setView("create");
  };

  const handleEditTest = (testId: string) => {
    setSelectedTestId(testId);
    setView("edit");
  };

  const handleViewTest = (testId: string) => {
    setSelectedTestId(testId);
    setView("detail");
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test? This action cannot be undone.")) {
      return;
    }
    
    try {
      const supabase = createClient();
      
      // Delete variants first (foreign key constraint)
      await supabase
        .from("variants")
        .delete()
        .eq("test_id", testId);
        
      // Delete views and conversions
      await supabase
        .from("views")
        .delete()
        .eq("test_id", testId);
        
      await supabase
        .from("conversions")
        .delete()
        .eq("test_id", testId);
      
      // Delete test
      const { error } = await supabase
        .from("tests")
        .delete()
        .eq("id", testId);
        
      if (error) throw error;
      
      // Update UI
      setTests(tests.filter(t => t.id !== testId));
      toast.success("Test deleted successfully");
    } catch (err) {
      console.error("Error deleting test:", err);
      toast.error("Failed to delete test");
    }
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedTestId(null);
    
    // Refresh the tests list
    const fetchTests = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("tests")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        setTests(data || []);
      } catch (err) {
        console.error("Error fetching tests:", err);
      }
    };
    
    fetchTests();
  };

  const handleToggleActive = async (testId: string, currentActive: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tests")
        .update({ active: !currentActive })
        .eq("id", testId);
        
      if (error) throw error;
      
      // Update UI
      setTests(tests.map(t => 
        t.id === testId ? { ...t, active: !currentActive } : t
      ));
      
      toast.success(`Test ${!currentActive ? "activated" : "deactivated"}`);
    } catch (err) {
      console.error("Error toggling test status:", err);
      toast.error("Failed to update test status");
    }
  };

  // Render different views based on current state
  if (view === "create") {
    return (
      <TestCreator 
        projectId={projectId} 
        onCancel={handleBackToList} 
      />
    );
  }

  if (view === "edit" && selectedTestId) {
    return (
      <TestCreator 
        projectId={projectId} 
        testId={selectedTestId}
        onCancel={handleBackToList} 
      />
    );
  }

  if (view === "detail" && selectedTestId) {
    return (
      <TestDetails 
        testId={selectedTestId} 
        onBack={handleBackToList}
        onEdit={() => handleEditTest(selectedTestId)}
        onDelete={() => {
          handleDeleteTest(selectedTestId);
          handleBackToList();
        }}
      />
    );
  }

  // Default view - list of tests
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">A/B Tests</h2>
          <p className="text-sm text-gray-500">Manage and track your website optimizations</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowEmbedCode(true)}
            className="btn btn-outline"
          >
            Get Embed Code
          </button>
          <button 
            onClick={handleCreateTest}
            className="btn btn-primary"
          >
            Create New Test
          </button>
        </div>
      </div>
      
      {/* Tests List */}
      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-16 w-full"></div>
          <div className="skeleton h-16 w-full"></div>
          <div className="skeleton h-16 w-full"></div>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">No tests created yet</h3>
          <p className="text-gray-500 mb-4">Create your first A/B test to start optimizing your website</p>
          <button 
            onClick={handleCreateTest}
            className="btn btn-primary"
          >
            Create Your First Test
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Selector</th>
                <th>Split</th>
                <th>Goal</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(test => (
                <tr key={test.id} className="hover">
                  <td className="font-medium cursor-pointer" onClick={() => handleViewTest(test.id)}>
                    {test.name}
                  </td>
                  <td>
                    <code className="bg-base-200 p-1 rounded text-xs">
                      {test.selector}
                    </code>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-base-200 rounded-full">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${test.split}%` }}
                        />
                      </div>
                      <span className="text-xs">{test.split}% B</span>
                    </div>
                  </td>
                  <td className="capitalize">
                    {test.goal_type}
                  </td>
                  <td>
                    <div className="form-control">
                      <label className="cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="toggle toggle-primary toggle-sm" 
                          checked={test.active} 
                          onChange={() => handleToggleActive(test.id, test.active)}
                        />
                      </label>
                    </div>
                  </td>
                  <td className="text-sm">
                    {new Date(test.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleViewTest(test.id)}
                        className="btn btn-ghost btn-xs"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditTest(test.id)}
                        className="btn btn-ghost btn-xs"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteTest(test.id)}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Embed Code Modal */}
      {showEmbedCode && (
        <EmbedCodeModal 
          projectId={projectId}
          onClose={() => setShowEmbedCode(false)}
        />
      )}
    </div>
  );
} 