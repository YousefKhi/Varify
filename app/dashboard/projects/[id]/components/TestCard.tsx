"use client";

import { useState } from "react";
import Link from "next/link";

type TestCardProps = {
  test: {
    id: string;
    name: string;
    status: string;
    created_at: string;
    start_date?: string;
    end_date?: string;
    variant_a: string;
    variant_b: string;
    project_id: string;
    // Add other test properties as needed
  };
};

export default function TestCard({ test }: TestCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Active</span>;
      case 'completed':
        return <span className="badge badge-info">Completed</span>;
      case 'paused':
        return <span className="badge badge-warning">Paused</span>;
      case 'draft':
        return <span className="badge badge-ghost">Draft</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">{test.name}</h3>
            {getStatusBadge(test.status)}
          </div>
          
          <p className="text-sm text-gray-500 mt-1">
            Created {new Date(test.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <button 
          onClick={() => setExpanded(!expanded)}
          className="btn btn-ghost btn-sm"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
      
      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <div className="font-medium mb-1">Variant A</div>
              <p className="text-sm">{test.variant_a}</p>
            </div>
            <div className="border rounded p-3">
              <div className="font-medium mb-1">Variant B</div>
              <p className="text-sm">{test.variant_b}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center border-t pt-4">
            <div className="stats stats-sm bg-base-200 shadow">
              <div className="stat">
                <div className="stat-title text-xs">Visitors</div>
                <div className="stat-value text-base">-</div>
              </div>
              <div className="stat">
                <div className="stat-title text-xs">Conversion</div>
                <div className="stat-value text-base">-</div>
              </div>
            </div>
            
            <Link 
              href={`/dashboard/projects/${test.project_id}/tests/${test.id}`}
              className="btn btn-sm"
            >
              View Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 