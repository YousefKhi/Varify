"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";

type NewTestFormProps = {
  projectId: string;
};

export default function NewTestForm({ projectId }: NewTestFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selector, setSelector] = useState("");
  const [variantA, setVariantA] = useState("");
  const [variantB, setVariantB] = useState("");
  const [split, setSplit] = useState(50);
  const [goal, setGoal] = useState("cta-click");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name.trim()) {
      toast.error("Test name is required");
      return;
    }
    
    if (!selector.trim()) {
      toast.error("CSS selector is required");
      return;
    }
    
    if (!variantA.trim() || !variantB.trim()) {
      toast.error("Both variants are required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // Insert new test
      const { data, error } = await supabase
        .from("tests")
        .insert({
          name: name.trim(),
          project_id: projectId,
          selector: selector.trim(),
          variant_a: variantA.trim(),
          variant_b: variantB.trim(),
          split: split,
          goal: goal,
          status: "active", // or "draft" if you want to review before activating
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success("Test created successfully!");
      
      // Redirect back to project page
      router.push(`/dashboard/projects/${projectId}`);
      
    } catch (error) {
      console.error("Error creating test:", error);
      toast.error("Failed to create test");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Test Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input input-bordered w-full"
                placeholder="e.g. Homepage CTA Button"
                required
              />
            </div>
            
            <div>
              <label htmlFor="selector" className="block text-sm font-medium mb-1">
                CSS Selector *
              </label>
              <input
                id="selector"
                type="text"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                className="input input-bordered w-full"
                placeholder="e.g. #hero-cta"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This should identify the element you want to modify
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Traffic Split
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="99"
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  className="range range-primary"
                />
                <span className="text-sm w-16 text-center">
                  {split}% / {100 - split}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>A</span>
                <span>B</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Conversion Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="cta-click">Click on element</option>
                <option value="page-view">Page view</option>
                <option value="form-submit">Form submission</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="variantA" className="block text-sm font-medium mb-1">
                Variant A (Original) *
              </label>
              <textarea
                id="variantA"
                value={variantA}
                onChange={(e) => setVariantA(e.target.value)}
                className="textarea textarea-bordered w-full"
                placeholder="Original content"
                rows={3}
                required
              />
            </div>
            
            <div>
              <label htmlFor="variantB" className="block text-sm font-medium mb-1">
                Variant B (Test) *
              </label>
              <textarea
                id="variantB"
                value={variantB}
                onChange={(e) => setVariantB(e.target.value)}
                className="textarea textarea-bordered w-full"
                placeholder="New content to test"
                rows={3}
                required
              />
            </div>
            
            <div className="bg-base-200 p-4 rounded-lg">
              <h3 className="font-medium text-sm mb-2">Preview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white border rounded">
                  <div className="text-xs text-gray-500 mb-1">Variant A</div>
                  <div>{variantA || "Original content"}</div>
                </div>
                <div className="p-3 bg-white border rounded">
                  <div className="text-xs text-gray-500 mb-1">Variant B</div>
                  <div>{variantB || "Test content"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              "Create Test"
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 