"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import CodePreview from "./CodePreview";

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
  
  const router = useRouter();

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
      <div className="space-y-4 p-4">
        <div className="skeleton h-10 w-1/3"></div>
        <div className="skeleton h-32 w-full"></div>
        <div className="skeleton h-32 w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{testId ? "Edit Test" : "Create New Test"}</h2>
        <button 
          onClick={onCancel}
          className="btn btn-ghost btn-sm"
        >
          Cancel
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column - Basic info */}
          <div className="space-y-4">
            <div className="form-control">
              <label className="label font-medium">
                <span className="label-text">Test Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={testData.name}
                onChange={handleChange}
                placeholder="e.g. Homepage Hero Button Test"
                className="input input-bordered w-full"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label font-medium">
                <span className="label-text">Element Selector</span>
                <span className="label-text-alt">CSS or ID selector to target</span>
              </label>
              <input
                type="text"
                name="selector"
                value={testData.selector}
                onChange={handleChange}
                placeholder="e.g. #hero-cta or .product-card"
                className="input input-bordered w-full"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label font-medium">
                <span className="label-text">Goal Type</span>
              </label>
              <select
                name="goal_type"
                value={testData.goal_type}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="click">Button/Element Click</option>
                <option value="view">Page View</option>
                <option value="custom">Custom Event</option>
              </select>
            </div>
            
            {testData.goal_type === "click" && (
              <div className="form-control">
                <label className="label font-medium">
                  <span className="label-text">Goal Selector</span>
                  <span className="label-text-alt">Element to track clicks on</span>
                </label>
                <input
                  type="text"
                  name="goal_selector"
                  value={testData.goal_selector || ""}
                  onChange={handleChange}
                  placeholder="e.g. #signup-button or .purchase-btn"
                  className="input input-bordered w-full"
                  required
                />
              </div>
            )}
            
            <div className="form-control">
              <label className="label font-medium">
                <span className="label-text">Traffic Split</span>
                <span className="label-text-alt">{testData.split}% for B</span>
              </label>
              <input
                type="range"
                name="split"
                min="0"
                max="100"
                value={testData.split}
                onChange={handleChange}
                className="range range-primary"
              />
              <div className="flex justify-between px-2 text-xs">
                <span>0% B</span>
                <span>50/50</span>
                <span>100% B</span>
              </div>
            </div>
            
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text font-medium">Active</span>
                <input
                  type="checkbox"
                  name="active"
                  checked={testData.active}
                  onChange={(e) => setTestData({...testData, active: e.target.checked})}
                  className="toggle toggle-primary"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                When active, this test will run for visitors to your site.
              </p>
            </div>
          </div>
          
          {/* Right column - Variant code */}
          <div className="space-y-4">
            <div className="tabs tabs-boxed">
              <button
                type="button"
                className={`tab ${currentPreview === "a" ? "tab-active" : ""}`}
                onClick={() => setCurrentPreview("a")}
              >
                Variant A (Original)
              </button>
              <button
                type="button"
                className={`tab ${currentPreview === "b" ? "tab-active" : ""}`}
                onClick={() => setCurrentPreview("b")}
              >
                Variant B (Test)
              </button>
            </div>
            
            {currentPreview === "a" ? (
              <div className="form-control">
                <label className="label font-medium">
                  <span className="label-text">Original Content (A)</span>
                </label>
                <textarea
                  name="variant_a_code"
                  value={testData.variant_a_code}
                  onChange={handleChange}
                  placeholder="<div>Your original HTML here</div>"
                  className="textarea textarea-bordered font-mono text-sm h-40"
                  required
                />
              </div>
            ) : (
              <div className="form-control">
                <label className="label font-medium">
                  <span className="label-text">Variation Content (B)</span>
                </label>
                <textarea
                  name="variant_b_code"
                  value={testData.variant_b_code}
                  onChange={handleChange}
                  placeholder="<div>Your variation HTML here</div>"
                  className="textarea textarea-bordered font-mono text-sm h-40"
                  required
                />
              </div>
            )}
            
            <div className="bg-base-200 rounded-lg p-4">
              <h3 className="font-medium mb-2">Preview</h3>
              <div className="bg-white p-3 rounded border">
                <CodePreview html={currentPreview === "a" ? testData.variant_a_code : testData.variant_b_code} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-control">
          <label className="label font-medium">
            <span className="label-text">Additional Settings (Optional)</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="file_path"
              value={testData.file_path || ""}
              onChange={handleChange}
              placeholder="File path (e.g. /pages/index.js)"
              className="input input-bordered"
            />
            <input
              type="text"
              name="branch_name"
              value={testData.branch_name || ""}
              onChange={handleChange}
              placeholder="Git branch name"
              className="input input-bordered"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-xs mr-2"></span>
                Saving...
              </>
            ) : (
              testId ? "Update Test" : "Create Test"
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 