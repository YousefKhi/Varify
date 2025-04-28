"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";

type StatsTabProps = {
  projectId: string;
};

const StatsTab = ({ projectId }: StatsTabProps) => {
  const [stats, setStats] = useState({
    totalViews: 0,
    totalConversions: 0,
    conversionRate: 0,
    totalTests: 0,
    activeTests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      try {
        const supabase = createClient();
        
        // Get test IDs for this project
        const { data: tests, error: testsError } = await supabase
          .from("tests")
          .select("id, active")
          .eq("project_id", projectId);
          
        if (testsError) throw testsError;
        
        const testIds = tests?.map(test => test.id) || [];
        const activeTests = tests?.filter(test => test.active).length || 0;
        
        if (testIds.length === 0) {
          setStats({
            totalViews: 0,
            totalConversions: 0,
            conversionRate: 0,
            totalTests: 0,
            activeTests: 0,
          });
          setLoading(false);
          return;
        }
        
        // Count views for all tests
        const { count: viewsCount, error: viewsError } = await supabase
          .from("views")
          .select("id", { count: "exact" })
          .in("test_id", testIds);
          
        if (viewsError) throw viewsError;
        
        // Count conversions for all tests
        const { count: conversionsCount, error: conversionsError } = await supabase
          .from("conversions")
          .select("id", { count: "exact" })
          .in("test_id", testIds);
          
        if (conversionsError) throw conversionsError;
        
        // Calculate conversion rate
        const totalViews = viewsCount || 0;
        const totalConversions = conversionsCount || 0;
        const conversionRate = totalViews > 0 
          ? (totalConversions / totalViews) * 100 
          : 0;
        
        setStats({
          totalViews,
          totalConversions,
          conversionRate,
          totalTests: testIds.length,
          activeTests,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load statistics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-32 w-full"></div>
        <div className="skeleton h-40 w-full"></div>
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

  return (
    <div>
      <h3 className="text-lg font-medium mb-6">Project Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat bg-base-200 rounded-box p-4">
          <div className="stat-title">Total Views</div>
          <div className="stat-value">{stats.totalViews.toLocaleString()}</div>
        </div>
        
        <div className="stat bg-base-200 rounded-box p-4">
          <div className="stat-title">Total Conversions</div>
          <div className="stat-value">{stats.totalConversions.toLocaleString()}</div>
        </div>
        
        <div className="stat bg-base-200 rounded-box p-4">
          <div className="stat-title">Conversion Rate</div>
          <div className="stat-value">{stats.conversionRate.toFixed(2)}%</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="stat bg-base-200 rounded-box p-4">
          <div className="stat-title">Total Tests</div>
          <div className="stat-value">{stats.totalTests}</div>
        </div>
        
        <div className="stat bg-base-200 rounded-box p-4">
          <div className="stat-title">Active Tests</div>
          <div className="stat-value">{stats.activeTests}</div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Performance Insights</h3>
        
        {stats.totalTests === 0 ? (
          <div className="bg-base-200 rounded-lg p-6 text-center">
            <p className="text-gray-500">No test data available yet.</p>
            <p className="text-sm mt-2">Create A/B tests to start collecting data!</p>
          </div>
        ) : (
          <div className="bg-base-200 rounded-lg p-6 text-center">
            <p className="text-gray-500">Data visualization will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsTab; 