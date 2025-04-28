"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";

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

type Variant = {
  id: string;
  name: string;
  test_id: string;
  created_at: string;
  variant_a_code?: string;
  variant_b_code?: string;
  revenue?: number;
  total_views?: number;
  total_conversions?: number;
};

type TestDetailsProps = {
  testId: string;
  onBack: () => void;
};

export default function TestDetails({ testId, onBack }: TestDetailsProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [viewsCount, setViewsCount] = useState<number>(0);
  const [conversionsCount, setConversionsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Fetch variants
        const { data: variantsData, error: variantsError } = await supabase
          .from("variants")
          .select("*")
          .eq("test_id", testId);
          
        if (variantsError) throw variantsError;
        setVariants(variantsData || []);
        
        // Fetch views count
        const { count: views, error: viewsError } = await supabase
          .from("views")
          .select("id", { count: "exact" })
          .eq("test_id", testId);
          
        if (viewsError) throw viewsError;
        setViewsCount(views || 0);
        
        // Fetch conversions count
        const { count: conversions, error: conversionsError } = await supabase
          .from("conversions")
          .select("id", { count: "exact" })
          .eq("test_id", testId);
          
        if (conversionsError) throw conversionsError;
        setConversionsCount(conversions || 0);
        
      } catch (err) {
        console.error("Error fetching test details:", err);
        setError("Failed to load test details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTestDetails();
  }, [testId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-full"></div>
        <div className="skeleton h-40 w-full"></div>
        <div className="skeleton h-40 w-full"></div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="alert alert-error">
        <span>{error || "Test not found"}</span>
        <button onClick={onBack} className="btn btn-ghost btn-sm">Back</button>
      </div>
    );
  }

  const conversionRate = viewsCount > 0 
    ? (conversionsCount / viewsCount) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{test.name}</h3>
          <p className="text-sm text-gray-500">ID: {test.id}</p>
        </div>
        <button onClick={onBack} className="btn btn-ghost btn-sm">
          Back to Tests
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-200 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Test Details</h4>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className={`badge ${test.active ? 'badge-success' : 'badge-ghost'}`}>
                {test.active ? 'Active' : 'Inactive'}
              </span>
            </p>
            <p>
              <span className="font-medium">Selector:</span>{" "}
              <code className="bg-base-300 p-1 rounded text-xs">{test.selector}</code>
            </p>
            {test.file_path && (
              <p><span className="font-medium">File Path:</span> {test.file_path}</p>
            )}
            {test.goal && (
              <p><span className="font-medium">Goal:</span> {test.goal}</p>
            )}
            {test.branch_name && (
              <p><span className="font-medium">Branch:</span> {test.branch_name}</p>
            )}
            <p><span className="font-medium">Created:</span> {new Date(test.created_at).toLocaleDateString()}</p>
            <p><span className="font-medium">Split Percentage:</span> {test.split}%</p>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button className="btn btn-sm btn-primary">
              Edit Test
            </button>
            <button className={`btn btn-sm ${test.active ? 'btn-error' : 'btn-success'}`}>
              {test.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
        
        <div className="card bg-base-200 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Test Performance</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="stat bg-base-300 rounded-lg p-2">
              <div className="stat-title text-xs">Views</div>
              <div className="stat-value text-lg">{viewsCount.toLocaleString()}</div>
            </div>
            
            <div className="stat bg-base-300 rounded-lg p-2">
              <div className="stat-title text-xs">Conversions</div>
              <div className="stat-value text-lg">{conversionsCount.toLocaleString()}</div>
            </div>
            
            <div className="stat bg-base-300 rounded-lg p-2">
              <div className="stat-title text-xs">Rate</div>
              <div className="stat-value text-lg">{conversionRate.toFixed(2)}%</div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 text-center">
            Performance visualization will be shown here
          </div>
        </div>
      </div>
      
      <div className="card bg-base-200 p-4 rounded-lg">
        <h4 className="font-medium mb-4">Variants</h4>
        
        {variants.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No variants found for this test.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map(variant => (
              <div key={variant.id} className="card bg-base-300 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium">{variant.name}</h5>
                  <span className="badge badge-sm">{new Date(variant.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {variant.variant_a_code && (
                    <div>
                      <h6 className="text-xs font-medium mb-1">Variant A Code</h6>
                      <div className="bg-base-100 p-2 rounded overflow-x-auto">
                        <pre className="text-xs">{variant.variant_a_code}</pre>
                      </div>
                    </div>
                  )}
                  
                  {variant.variant_b_code && (
                    <div>
                      <h6 className="text-xs font-medium mb-1">Variant B Code</h6>
                      <div className="bg-base-100 p-2 rounded overflow-x-auto">
                        <pre className="text-xs">{variant.variant_b_code}</pre>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-3 text-xs text-gray-500">
                  <span>Views: {variant.total_views || '-'}</span>
                  <span>•</span>
                  <span>Conversions: {variant.total_conversions || '-'}</span>
                  <span>•</span>
                  <span>
                    Rate: {
                      variant.total_views && variant.total_views > 0 && variant.total_conversions
                        ? ((variant.total_conversions / variant.total_views) * 100).toFixed(2)
                        : '-'
                    }%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 