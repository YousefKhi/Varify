"use client";

import { useState } from "react";
import toast from "react-hot-toast";

type ScriptInstallationProps = {
  projectId: string;
};

export default function ScriptInstallation({ projectId }: ScriptInstallationProps) {
  const [copied, setCopied] = useState(false);
  
  const scriptCode = `<script src="https://varify-sepia.vercel.app/embed.js" data-project="${projectId}" async></script>`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy code");
    }
  };
  
  return (
    <div className="border rounded-lg">
      <div className="p-6">
        <p className="text-sm mb-3">
          Add this script to your website&apos;s <code className="bg-base-200 p-1 rounded text-xs">&lt;head&gt;</code> tag:
        </p>
        
        <div className="bg-base-200 rounded-lg p-4 relative">
          <pre className="text-sm overflow-x-auto">{scriptCode}</pre>
          
          <button
            onClick={copyToClipboard}
            className="absolute top-3 right-3 btn btn-sm btn-ghost"
            aria-label="Copy code"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-success">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="border-t p-6">
        <h3 className="font-medium mb-2">How it works</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>
            This script automatically loads and runs A/B tests on your website
          </li>
          <li>
            It&apos;s lightweight (less than 5KB) and won&apos;t slow down your site
          </li>
          <li>
            All tracking is handled automatically in the background
          </li>
          <li>
            Create tests in your dashboard once the script is installed
          </li>
        </ul>
      </div>
      
      <div className="border-t p-6 bg-base-200">
        <div className="flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <span>
            The script is deployed to <code className="bg-base-300 p-1 rounded text-xs">https://abfast.dev</code> with global CDN distribution
          </span>
        </div>
      </div>
    </div>
  );
} 