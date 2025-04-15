"use client";

import { useState } from "react";

type ProjectStatsProps = {
  projectId: string;
  lastPingAt: string | null;
};

export default function ProjectStats({ projectId, lastPingAt }: ProjectStatsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  
  // Check if script is initialized (ping within last 5 minutes)
  const isScriptInitialized = () => {
    if (!lastPingAt) return false;
    const lastPing = new Date(lastPingAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastPing > fiveMinutesAgo;
  };

  const scriptActive = isScriptInitialized();

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg p-6 border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Performance</h2>
        
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="stat bg-base-100 border rounded-lg">
          <div className="stat-title">Visitors</div>
          <div className="stat-value">-</div>
          <div className="stat-desc text-gray-500">Past {timeRange}</div>
        </div>
        
        <div className="stat bg-base-100 border rounded-lg">
          <div className="stat-title">Active Tests</div>
          <div className="stat-value">-</div>
          <div className="stat-desc">Currently running</div>
        </div>
        
        <div className="stat bg-base-100 border rounded-lg">
          <div className="stat-title">Avg. Conversion</div>
          <div className="stat-value">-</div>
          <div className="stat-desc text-gray-500">Past {timeRange}</div>
        </div>
      </div>
      
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Visitors Over Time</h3>
        
        {scriptActive ? (
          <div className="w-full h-64 bg-base-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="font-medium">Graph Visualization</p>
              <p className="text-sm text-gray-500">Visitors trend for the last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-64 bg-base-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              </svg>
              <p className="font-medium">Script not initialized</p>
              <p className="text-sm">Waiting for data from your website.</p>
              <p className="text-xs mt-1">Ensure the script is installed correctly.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
} 