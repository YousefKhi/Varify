import { Suspense } from "react";
import Link from "next/link";
import AddSiteForm from "@/app/dashboard/new/components/AddSiteForm";
import StepsIndicator from "@/app/dashboard/new/components/StepsIndicator";

export const dynamic = "force-dynamic";

export default function AddSitePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#121212] text-white">
      <div className="bg-[#1f1f1f] border-b border-[#444444] p-4">
        <div className="max-w-5xl mx-auto">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
                clipRule="evenodd"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full py-8 px-4 flex-1">
        <h1 className="text-2xl font-medium mb-8 text-center text-white">Create New Project</h1>
        
        <Suspense fallback={
          <div className="mt-8 max-w-3xl mx-auto p-6 bg-[#171717] border border-[#444444] rounded-md">
            <div className="h-8 bg-[#1f1f1f] rounded-md w-1/3 animate-pulse"></div>
            <div className="h-24 bg-[#1f1f1f] rounded-md w-full mt-4 animate-pulse"></div>
            <div className="h-12 bg-[#1f1f1f] rounded-md w-1/2 mt-4 animate-pulse"></div>
          </div>
        }>
          <div className="mt-8 max-w-3xl mx-auto">
            <AddSiteForm />
          </div>
        </Suspense>
      </div>
      
      <div className="bg-[#1f1f1f] border-t border-[#444444] p-4 text-center text-sm text-gray-400">
        Need help? Email <a href="mailto:support@varify.com" className="text-[#39a276] hover:underline">support@varify.com</a>
      </div>
    </main>
  );
} 