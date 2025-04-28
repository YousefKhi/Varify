"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";
import TestDetails from "./TestDetails";

type Test = {
  id: string;
  name: string;
  selector: string;
  active: boolean;
  created_at: string;
  project_id: string;
  file_path?: string;
  goal?: string;
  branch_name?: string;
  split: number;
  variant_a_split?: number;
};

type TestsTabProps = {
  projectId: string;
};

export default function TestsTab({ projectId }: TestsTabProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

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
        setError("Failed to load tests. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-full"></div>
        <div className="skeleton h-20 w-full"></div>
        <div className="skeleton h-20 w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (selectedTestId) {
    return (
      <TestDetails 
        testId={selectedTestId} 
        onBack={() => setSelectedTestId(null)} 
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">A/B Tests</h3>
        <button className="btn btn-primary btn-sm">
          Create New Test
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-8 bg-base-200 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500">No tests created yet</p>
          <p className="text-sm mt-2">Create your first A/B test to start optimizing your app!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Selector</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id}>
                  <td>{test.name}</td>
                  <td>
                    <code className="bg-base-200 p-1 rounded text-xs">
                      {test.selector}
                    </code>
                  </td>
                  <td>
                    <span className={`badge ${test.active ? 'badge-success' : 'badge-ghost'}`}>
                      {test.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(test.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => setSelectedTestId(test.id)}
                      className="btn btn-ghost btn-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 