"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";

export default function AnalyticsOverview() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  
  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Overall Performance</h2>
        
        <div className="join">
          <button 
            className={`join-item btn btn-sm ${timeRange === '7d' ? 'btn-active' : ''}`}
            onClick={() => setTimeRange('7d')}
          >
            7D
          </button>
          <button 
            className={`join-item btn btn-sm ${timeRange === '30d' ? 'btn-active' : ''}`}
            onClick={() => setTimeRange('30d')}
          >
            30D
          </button>
          <button 
            className={`join-item btn btn-sm ${timeRange === '90d' ? 'btn-active' : ''}`}
            onClick={() => setTimeRange('90d')}
          >
            90D
          </button>
        </div>
      </div>
      
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Total Visitors</div>
          <div className="stat-value">12.6K</div>
          <div className="stat-desc text-success">↗︎ 22% from last period</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Active Projects</div>
          <div className="stat-value">5</div>
          <div className="stat-desc">Projects with running tests</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Running Tests</div>
          <div className="stat-value">8</div>
          <div className="stat-desc text-success">↗︎ 3 more than last period</div>
        </div>
        
        <div className="stat">
          <div className="stat-title">Avg. Conversion</div>
          <div className="stat-value">15.4%</div>
          <div className="stat-desc text-error">↘︎ 2.3% from last period</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Visitors Trend</h3>
          
          {/* Placeholder for chart */}
          <div className="w-full h-64 bg-base-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="font-medium">Graph Visualization</p>
              <p className="text-sm text-gray-500">Visitors over time</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border shadow-sm">
          <h3 className="text-lg font-medium mb-4">Top Performing Tests</h3>
          
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Project</th>
                  <th>Conversion</th>
                  <th>Improvement</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Homepage CTA</td>
                  <td>Main Website</td>
                  <td>18.3%</td>
                  <td className="text-success">+4.2%</td>
                </tr>
                <tr>
                  <td>Checkout Flow</td>
                  <td>E-commerce</td>
                  <td>12.7%</td>
                  <td className="text-success">+2.8%</td>
                </tr>
                <tr>
                  <td>Pricing Page</td>
                  <td>SaaS Dashboard</td>
                  <td>9.5%</td>
                  <td className="text-success">+1.3%</td>
                </tr>
                <tr>
                  <td>Mobile Navigation</td>
                  <td>Main Website</td>
                  <td>7.2%</td>
                  <td className="text-error">-0.5%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
} 