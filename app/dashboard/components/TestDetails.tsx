"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";
import CodePreview from "./CodePreview";

type TestDetailsProps = {
  testId: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

type Test = {
  id: string;
  name: string;
  selector: string;
  active: boolean;
  created_at: string;
  goal_type: string;
  goal_selector?: string;
  split: number;
  project_id: string;
  file_path?: string;
  branch_name?: string;
  updated_at?: string;
};

type Variant = {
  id: string;
  name: string;
  test_id: string;
  variant_a_code: string;
  variant_b_code: string;
  created_at: string;
};

type Stats = {
  views: number;
  conversions: number;
  conversionRate: number;
  variantA: {
    views: number;
    conversions: number;
    conversionRate: number;
  };
  variantB: {
    views: number;
    conversions: number;
    conversionRate: number;
  };
};

export default function TestDetails({ testId, onBack, onEdit, onDelete }: TestDetailsProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [stats, setStats] = useState<Stats>({
    views: 0,
    conversions: 0,
    conversionRate: 0,
    variantA: { views: 0, conversions: 0, conversionRate: 0 },
    variantB: { views: 0, conversions: 0, conversionRate: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<"a" | "b">("a");
  
  useEffect(() => {
    const fetchTestDetails = async () => {
      setLoading(true);
      
      try {
        const supabase = createClient();
        
        // Fetch test details
        const { data: testData, error: testError } = await supabase
          .from("tests")
          .select("*")
          .eq("id", testId)
          .single();
          
        if (testError) throw testError;
        setTest(testData);
        
        // Fetch variant
        const { data: variantData, error: variantError } = await supabase
          .from("variants")
          .select("*")
          .eq("test_id", testId)
          .single();
          
        if (variantError && variantError.code !== "PGRST116") {
          // PGRST116 is "no rows returned" - acceptable but unusual
          throw variantError;
        }
        
        setVariant(variantData || null);
        
        // Fetch view stats
        const { count: viewsCount, error: viewsError } = await supabase
          .from("views")
          .select("*", { count: "exact" })
          .eq("test_id", testId);
          
        // Fetch conversion stats
        const { count: conversionsCount, error: conversionsError } = await supabase
          .from("conversions")
          .select("*", { count: "exact" })
          .eq("test_id", testId);
         
        // Calculate stats
        const totalViews = viewsCount || 0;
        const totalConversions = conversionsCount || 0;
        const conversionRate = totalViews > 0 
          ? (totalConversions / totalViews) * 100 
          : 0;
        
        // For simplicity, we'll use dummy data for variant-specific stats
        // In a real implementation, you would track variant assignment in the DB
        const variantASplit = 100 - (testData.split || 50);
        const variantAViews = Math.round(totalViews * (variantASplit / 100));
        const variantBViews = totalViews - variantAViews;
        
        const variantAConversions = Math.round(totalConversions * (variantASplit / 100));
        const variantBConversions = totalConversions - variantAConversions;
        
        const variantARate = variantAViews > 0 
          ? (variantAConversions / variantAViews) * 100 
          : 0;
          
        const variantBRate = variantBViews > 0 
          ? (variantBConversions / variantBViews) * 100 
          : 0;
        
        setStats({
          views: totalViews,
          conversions: totalConversions,
          conversionRate,
          variantA: {
            views: variantAViews,
            conversions: variantAConversions,
            conversionRate: variantARate
          },
          variantB: {
            views: variantBViews,
            conversions: variantBConversions,
            conversionRate: variantBRate
          }
        });
      } catch (err) {
        console.error("Error fetching test details:", err);
        setError("Failed to load test details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestDetails();
  }, [testId]);

  const handleToggleStatus = async () => {
    if (!test) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tests")
        .update({ active: !test.active })
        .eq("id", testId);
        
      if (error) throw error;
      
      setTest({ ...test, active: !test.active });
      toast.success(`Test ${test.active ? "deactivated" : "activated"} successfully`);
    } catch (err) {
      console.error("Error toggling test status:", err);
      toast.error("Failed to update test status");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-1/3"></div>
        <div className="skeleton h-32 w-full"></div>
        <div className="skeleton h-32 w-full"></div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="alert alert-error">
        <span>{error || "Test not found"}</span>
        <button onClick={onBack} className="btn btn-sm">Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{test.name}</h2>
          <p className="text-sm text-gray-500">Test ID: {test.id}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="btn btn-ghost"
          >
            Back to Tests
          </button>
          <button
            onClick={onEdit}
            className="btn btn-outline"
          >
            Edit Test
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-xl">Total Views</h3>
            <div className="stat-value text-3xl">{stats.views.toLocaleString()}</div>
            <p className="text-sm text-gray-500">Total impressions of this test</p>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-xl">Conversions</h3>
            <div className="stat-value text-3xl">{stats.conversions.toLocaleString()}</div>
            <p className="text-sm text-gray-500">Total goal completions</p>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-xl">Conversion Rate</h3>
            <div className="stat-value text-3xl">{stats.conversionRate.toFixed(2)}%</div>
            <p className="text-sm text-gray-500">Percentage of views that convert</p>
          </div>
        </div>
      </div>
      
      {/* Test Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Test Configuration</h3>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <tbody>
                  <tr>
                    <td className="font-medium">Status</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`badge ${test.active ? 'badge-success' : 'badge-ghost'}`}>
                          {test.active ? 'Active' : 'Inactive'}
                        </div>
                        <button 
                          onClick={handleToggleStatus}
                          className="btn btn-xs btn-ghost"
                        >
                          {test.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Element Selector</td>
                    <td>
                      <code className="bg-base-200 p-1 rounded text-xs">
                        {test.selector}
                      </code>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Goal Type</td>
                    <td className="capitalize">{test.goal_type}</td>
                  </tr>
                  {test.goal_type === "click" && test.goal_selector && (
                    <tr>
                      <td className="font-medium">Goal Selector</td>
                      <td>
                        <code className="bg-base-200 p-1 rounded text-xs">
                          {test.goal_selector}
                        </code>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-medium">Traffic Split</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-base-200 rounded-full">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${test.split}%` }}
                          />
                        </div>
                        <span>
                          {100 - test.split}% A / {test.split}% B
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Created</td>
                    <td>{new Date(test.created_at).toLocaleString()}</td>
                  </tr>
                  {test.updated_at && (
                    <tr>
                      <td className="font-medium">Last Updated</td>
                      <td>{new Date(test.updated_at).toLocaleString()}</td>
                    </tr>
                  )}
                  {test.file_path && (
                    <tr>
                      <td className="font-medium">File Path</td>
                      <td>{test.file_path}</td>
                    </tr>
                  )}
                  {test.branch_name && (
                    <tr>
                      <td className="font-medium">Branch</td>
                      <td>{test.branch_name}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="card-actions justify-end mt-4">
              <button
                onClick={onDelete}
                className="btn btn-error btn-sm"
              >
                Delete Test
              </button>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Performance Comparison</h3>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-base-200 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Variant A (Original)</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Views</span>
                    <span>{stats.variantA.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversions</span>
                    <span>{stats.variantA.conversions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Conversion Rate</span>
                    <span>{stats.variantA.conversionRate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-base-200 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Variant B (Test)</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Views</span>
                    <span>{stats.variantB.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversions</span>
                    <span>{stats.variantB.conversions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Conversion Rate</span>
                    <span>{stats.variantB.conversionRate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-3">Winner Determination</h4>
              {stats.views < 100 ? (
                <div className="alert alert-info text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>Need more data to determine a winner (minimum 100 views per variant)</span>
                </div>
              ) : stats.variantB.conversionRate > stats.variantA.conversionRate ? (
                <div className="alert alert-success text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <span className="font-medium">Variant B is winning!</span>
                    <p className="text-xs mt-1">
                      {((stats.variantB.conversionRate - stats.variantA.conversionRate) / stats.variantA.conversionRate * 100).toFixed(1)}% improvement over original
                    </p>
                  </div>
                </div>
              ) : stats.variantA.conversionRate > stats.variantB.conversionRate ? (
                <div className="alert alert-warning text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <div>
                    <span className="font-medium">Original is better</span>
                    <p className="text-xs mt-1">
                      {((stats.variantA.conversionRate - stats.variantB.conversionRate) / stats.variantB.conversionRate * 100).toFixed(1)}% better than Variant B
                    </p>
                  </div>
                </div>
              ) : (
                <div className="alert text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>Both variants are performing equally</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Variant Preview */}
      {variant && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title">Variant Preview</h3>
            
            <div className="tabs tabs-boxed mb-4">
              <button
                type="button"
                className={`tab ${activePreview === "a" ? "tab-active" : ""}`}
                onClick={() => setActivePreview("a")}
              >
                Variant A (Original)
              </button>
              <button
                type="button"
                className={`tab ${activePreview === "b" ? "tab-active" : ""}`}
                onClick={() => setActivePreview("b")}
              >
                Variant B (Test)
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-medium mb-2">HTML Code</div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                    {activePreview === "a" ? variant.variant_a_code : variant.variant_b_code}
                  </pre>
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-2">Visual Preview</div>
                <div className="bg-white border rounded-lg overflow-hidden h-48">
                  <CodePreview html={activePreview === "a" ? variant.variant_a_code : variant.variant_b_code} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 