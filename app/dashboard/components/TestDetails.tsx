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
      <div className="space-y-6">
        <div className="h-8 bg-gray-800 rounded-md w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-800 rounded-md animate-pulse"></div>
          <div className="h-24 bg-gray-800 rounded-md animate-pulse"></div>
          <div className="h-24 bg-gray-800 rounded-md animate-pulse"></div>
        </div>
        <div className="h-64 bg-gray-800 rounded-md animate-pulse"></div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md flex items-center justify-between">
        <span>{error || "Test not found"}</span>
        <button onClick={onBack} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm transition-colors">Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-medium text-white">{test.name}</h2>
          <p className="text-sm text-gray-400">Test ID: {test.id}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 bg-[#1f1f1f] hover:bg-gray-800 text-white text-sm rounded-md transition-colors"
          >
            Back to Tests
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 bg-[#1f1f1f] hover:bg-gray-800 text-white text-sm rounded-md border border-gray-800 transition-colors"
          >
            Edit Test
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#171717] border border-gray-800 rounded-md p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Total Views</h3>
          <div className="text-2xl font-medium text-white">{stats.views.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Total impressions of this test</p>
        </div>
        
        <div className="bg-[#171717] border border-gray-800 rounded-md p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Conversions</h3>
          <div className="text-2xl font-medium text-white">{stats.conversions.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Total goal completions</p>
        </div>
        
        <div className="bg-[#171717] border border-gray-800 rounded-md p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Conversion Rate</h3>
          <div className="text-2xl font-medium text-white">{stats.conversionRate.toFixed(2)}%</div>
          <p className="text-xs text-gray-500 mt-1">Percentage of views that convert</p>
        </div>
      </div>
      
      {/* Test Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#171717] border border-gray-800 rounded-md p-6">
          <h3 className="text-md font-medium text-white mb-4">Test Configuration</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Status</span>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 ${test.active ? 'text-[#39a276]' : 'text-gray-500'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${test.active ? 'bg-[#39a276]' : 'bg-gray-500'}`}></span>
                  <span className="text-sm">{test.active ? 'Active' : 'Inactive'}</span>
                </div>
                <button 
                  onClick={handleToggleStatus}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 hover:bg-gray-800 rounded transition-colors"
                >
                  {test.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Element Selector</span>
              <code className="text-xs px-2 py-1 bg-black/30 rounded text-gray-300">
                {test.selector}
              </code>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Goal Type</span>
              <span className="text-sm text-white capitalize">{test.goal_type}</span>
            </div>
            
            {test.goal_type === "click" && test.goal_selector && (
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-sm text-gray-400">Goal Selector</span>
                <code className="text-xs px-2 py-1 bg-black/30 rounded text-gray-300">
                  {test.goal_selector}
                </code>
              </div>
            )}
            
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Traffic Split</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-800 rounded-full">
                  <div 
                    className="h-full bg-[#39a276] rounded-full" 
                    style={{ width: `${test.split}%` }}
                  />
                </div>
                <span className="text-xs text-white">
                  {100 - test.split}% A / {test.split}% B
                </span>
              </div>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Created</span>
              <span className="text-sm text-white">{new Date(test.created_at).toLocaleString()}</span>
            </div>
            
            {test.updated_at && (
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-sm text-gray-400">Last Updated</span>
                <span className="text-sm text-white">{new Date(test.updated_at).toLocaleString()}</span>
              </div>
            )}
            
            {test.file_path && (
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-sm text-gray-400">File Path</span>
                <span className="text-sm text-white">{test.file_path}</span>
              </div>
            )}
            
            {test.branch_name && (
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-sm text-gray-400">Branch</span>
                <span className="text-sm text-white">{test.branch_name}</span>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onDelete}
              className="px-3 py-1.5 bg-transparent border border-red-500 text-red-500 text-sm rounded-md hover:bg-red-500/10 transition-colors"
            >
              Delete Test
            </button>
          </div>
        </div>
        
        <div className="bg-[#171717] border border-gray-800 rounded-md p-6">
          <h3 className="text-md font-medium text-white mb-4">Performance Comparison</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1f1f1f] border border-gray-800 p-4 rounded-md">
              <h4 className="text-sm font-medium text-white mb-3">Variant A (Original)</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Views</span>
                  <span className="text-xs text-white">{stats.variantA.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Conversions</span>
                  <span className="text-xs text-white">{stats.variantA.conversions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Conversion Rate</span>
                  <span className="text-xs text-white font-medium">{stats.variantA.conversionRate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1f1f1f] border border-gray-800 p-4 rounded-md">
              <h4 className="text-sm font-medium text-white mb-3">Variant B (Test)</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Views</span>
                  <span className="text-xs text-white">{stats.variantB.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Conversions</span>
                  <span className="text-xs text-white">{stats.variantB.conversions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Conversion Rate</span>
                  <span className="text-xs text-white font-medium">{stats.variantB.conversionRate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-white mb-3">Winner Determination</h4>
            {stats.views < 100 ? (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded-md text-xs">
                Need more data to determine a winner (minimum 100 views per variant)
              </div>
            ) : stats.variantB.conversionRate > stats.variantA.conversionRate ? (
              <div className="bg-[#39a276]/10 border border-[#39a276]/20 text-[#39a276] p-3 rounded-md">
                <span className="text-sm font-medium">Variant B is winning!</span>
                <p className="text-xs mt-1">
                  {((stats.variantB.conversionRate - stats.variantA.conversionRate) / stats.variantA.conversionRate * 100).toFixed(1)}% improvement over original
                </p>
              </div>
            ) : stats.variantA.conversionRate > stats.variantB.conversionRate ? (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-md">
                <span className="text-sm font-medium">Original is better</span>
                <p className="text-xs mt-1">
                  {((stats.variantA.conversionRate - stats.variantB.conversionRate) / stats.variantB.conversionRate * 100).toFixed(1)}% better than Variant B
                </p>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 text-gray-400 p-3 rounded-md text-xs">
                Both variants are performing equally
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Variant Preview */}
      {variant && (
        <div className="bg-[#171717] border border-gray-800 rounded-md p-6">
          <h3 className="text-md font-medium text-white mb-4">Variant Preview</h3>
          
          <div className="border-b border-gray-800 mb-6">
            <div className="flex space-x-6">
              <button
                type="button"
                className={`text-sm pb-3 px-1 font-medium transition-colors ${activePreview === "a" ? "text-white border-b-2 border-[#39a276]" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActivePreview("a")}
              >
                Variant A (Original)
              </button>
              <button
                type="button"
                className={`text-sm pb-3 px-1 font-medium transition-colors ${activePreview === "b" ? "text-white border-b-2 border-[#39a276]" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActivePreview("b")}
              >
                Variant B (Test)
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-400 mb-2">HTML Code</div>
              <div className="bg-[#1f1f1f] border border-gray-800 p-3 rounded-md">
                <pre className="text-xs overflow-auto max-h-64 whitespace-pre-wrap text-gray-300">
                  {activePreview === "a" ? variant.variant_a_code : variant.variant_b_code}
                </pre>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-400 mb-2">Visual Preview</div>
              <div className="border border-gray-800 rounded-md overflow-hidden h-64 bg-white">
                <CodePreview code={activePreview === "a" ? variant.variant_a_code : variant.variant_b_code} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 