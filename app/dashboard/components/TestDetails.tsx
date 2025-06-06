"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";
import CodePreview from "./CodePreview";
import dynamic from "next/dynamic";

// Dynamically import Recharts components to avoid SSR issues
const LineChart = dynamic<any>(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const BarChart = dynamic<any>(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic<any>(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const Line = dynamic<any>(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic<any>(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic<any>(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic<any>(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic<any>(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const Legend = dynamic<any>(() => import("recharts").then((mod) => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic<any>(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });

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

type VariantData = {
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
};

type DailyMetric = {
  day: string;
  variantA: VariantData;
  variantB: VariantData;
};

type Stats = {
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  dailyData: DailyMetric[];
  variantA: VariantData;
  variantB: VariantData;
};

export default function TestDetails({ testId, onBack, onEdit, onDelete }: TestDetailsProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [stats, setStats] = useState<Stats>({
    views: 0,
    conversions: 0,
    conversionRate: 0,
    revenue: 0,
    dailyData: [],
    variantA: { 
      views: 0, 
      conversions: 0, 
      conversionRate: 0,
      revenue: 0 
    },
    variantB: { 
      views: 0, 
      conversions: 0, 
      conversionRate: 0,
      revenue: 0 
    },
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
        
        // Set variant from test data
        setVariant({
          id: testId,
          name: testData.name,
          test_id: testId,
          variant_a_code: testData.variant_a_code || "<div>Original content</div>",
          variant_b_code: testData.variant_b_code || "<div>Variant content</div>",
          created_at: testData.created_at
        });
        
        // Fetch metrics from variant_metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from("variant_metrics")
          .select("*")
          .eq("test_id", testId);
          
        if (metricsError) throw metricsError;
        
        // Process metrics data
        const variantA: VariantData = {
          views: 0,
          conversions: 0,
          conversionRate: 0,
          revenue: 0
        };
        
        const variantB: VariantData = {
          views: 0,
          conversions: 0,
          conversionRate: 0,
          revenue: 0
        };
        
        const dailyData: DailyMetric[] = [];
        
        if (metricsData && metricsData.length > 0) {
          // Group by day
          const metricsByDay = metricsData.reduce((acc, metric) => {
            const day = new Date(metric.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (!acc[day]) {
              acc[day] = {
                day,
                variantA: { views: 0, conversions: 0, conversionRate: 0, revenue: 0 },
                variantB: { views: 0, conversions: 0, conversionRate: 0, revenue: 0 }
              };
            }
            
            const variant = metric.variant === 'A' ? 'variantA' : 'variantB';
            acc[day][variant].views = (acc[day][variant].views || 0) + (metric.views_count || 0);
            acc[day][variant].conversions = (acc[day][variant].conversions || 0) + (metric.conv_count || 0);
            acc[day][variant].revenue = (acc[day][variant].revenue || 0) + (metric.revenue || 0);
            
            return acc;
          }, {});
          
          // Calculate conversion rates and add to dailyData
          Object.values(metricsByDay).forEach((dayData: any) => {
            dayData.variantA.conversionRate = dayData.variantA.views > 0 
              ? (dayData.variantA.conversions / dayData.variantA.views) * 100 
              : 0;
              
            dayData.variantB.conversionRate = dayData.variantB.views > 0 
              ? (dayData.variantB.conversions / dayData.variantB.views) * 100 
              : 0;
              
            dailyData.push(dayData);
          });
          
          // Calculate totals
          metricsData.forEach(metric => {
            if (metric.variant === 'A') {
              variantA.views += metric.views_count || 0;
              variantA.conversions += metric.conv_count || 0;
              variantA.revenue += metric.revenue || 0;
            } else {
              variantB.views += metric.views_count || 0;
              variantB.conversions += metric.conv_count || 0;
              variantB.revenue += metric.revenue || 0;
            }
          });
          
          variantA.conversionRate = variantA.views > 0 
            ? (variantA.conversions / variantA.views) * 100 
            : 0;
            
          variantB.conversionRate = variantB.views > 0 
            ? (variantB.conversions / variantB.views) * 100 
            : 0;
        }
        
        // Sort by date
        dailyData.sort((a, b) => {
          const dateA = new Date(a.day).getTime();
          const dateB = new Date(b.day).getTime();
          return dateA - dateB;
        });
        
        setStats({
          views: variantA.views + variantB.views,
          conversions: variantA.conversions + variantB.conversions,
          conversionRate: (variantA.views + variantB.views) > 0 
            ? ((variantA.conversions + variantB.conversions) / (variantA.views + variantB.views)) * 100 
            : 0,
          revenue: variantA.revenue + variantB.revenue,
          dailyData,
          variantA,
          variantB
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <div className="bg-[#171717] border border-gray-800 rounded-md p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Total Revenue</h3>
          <div className="text-2xl font-medium text-white">${stats.revenue.toFixed(2)}</div>
          <p className="text-xs text-gray-500 mt-1">Estimated revenue from conversions</p>
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
      
      {/* Data Visualization Section */}
      <div className="bg-[#171717] border border-gray-800 rounded-md p-6">
        <h3 className="text-md font-medium text-white mb-4">Performance Analytics</h3>
        
        <div className="space-y-6">
          {/* Metric selector tabs */}
          <div className="flex space-x-2 border-b border-gray-800">
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-[#1f1f1f] rounded-t-md border border-gray-800 border-b-0"
            >
              All Metrics
            </button>
          </div>
          
          {/* Views Chart */}
          <div className="bg-[#1f1f1f] p-4 rounded-md border border-gray-800">
            <h4 className="text-sm font-medium text-white mb-3">Views Comparison</h4>
            {stats.dailyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.dailyData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="day" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #444' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="variantA.views"
                      name="Variant A"
                      stroke="#3b82f6" // Blue
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="variantB.views"
                      name="Variant B"
                      stroke="#39a276" // Green
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-900/20 rounded">
                <p className="text-gray-500 text-sm">No data available yet</p>
              </div>
            )}
          </div>
          
          {/* Conversion Rate Chart */}
          <div className="bg-[#1f1f1f] p-4 rounded-md border border-gray-800">
            <h4 className="text-sm font-medium text-white mb-3">Conversion Rate Comparison (%)</h4>
            {stats.dailyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.dailyData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="day" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #444' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: any) => [`${parseFloat(value).toFixed(2)}%`, '']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="variantA.conversionRate"
                      name="Variant A"
                      stroke="#3b82f6" // Blue
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="variantB.conversionRate"
                      name="Variant B"
                      stroke="#39a276" // Green
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-900/20 rounded">
                <p className="text-gray-500 text-sm">No data available yet</p>
              </div>
            )}
          </div>
          
          {/* Revenue Chart */}
          <div className="bg-[#1f1f1f] p-4 rounded-md border border-gray-800">
            <h4 className="text-sm font-medium text-white mb-3">Revenue Comparison ($)</h4>
            {stats.dailyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.dailyData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="day" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #444' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, '']}
                    />
                    <Legend />
                    <Bar
                      dataKey="variantA.revenue"
                      name="Variant A"
                      fill="#3b82f6" // Blue
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="variantB.revenue"
                      name="Variant B"
                      fill="#39a276" // Green
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-900/20 rounded">
                <p className="text-gray-500 text-sm">No data available yet</p>
              </div>
            )}
          </div>
          
          {/* Metrics Summary */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#1f1f1f] border border-gray-800 p-4 rounded-md">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h4 className="text-sm font-medium text-white">Variant A Performance</h4>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Total Views:</span>
                <span className="text-white font-medium">{stats.variantA.views.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Conversion Rate:</span>
                <span className="text-white font-medium">{stats.variantA.conversionRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Total Revenue:</span>
                <span className="text-white font-medium">${stats.variantA.revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Avg. Revenue Per User:</span>
                <span className="text-white font-medium">
                  ${stats.variantA.views > 0 ? (stats.variantA.revenue / stats.variantA.views).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
            
            <div className="bg-[#1f1f1f] border border-gray-800 p-4 rounded-md">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-[#39a276] rounded-full"></div>
                <h4 className="text-sm font-medium text-white">Variant B Performance</h4>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Total Views:</span>
                <span className="text-white font-medium">{stats.variantB.views.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Conversion Rate:</span>
                <span className="text-white font-medium">{stats.variantB.conversionRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Total Revenue:</span>
                <span className="text-white font-medium">${stats.variantB.revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Avg. Revenue Per User:</span>
                <span className="text-white font-medium">
                  ${stats.variantB.views > 0 ? (stats.variantB.revenue / stats.variantB.views).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Variant Preview */}
      
     
    </div>
  );
} 