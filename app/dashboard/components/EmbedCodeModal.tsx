"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";

type EmbedCodeModalProps = {
  projectId: string;
  onClose: () => void;
};

export default function EmbedCodeModal({ projectId, onClose }: EmbedCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);
  
  // Generate embed code snippet for the project
  const embedCode = `<!-- Varify A/B Testing Script -->
<script>
  (function(w,d,s,p,i) {
    var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s);
    j.async=true;
    j.src='https://varify.yourdomain.com/api/loader.js';
    j.setAttribute('data-project-id', '${projectId}');
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','${projectId}');
</script>
<!-- End Varify Script -->`;

  const handleCopy = () => {
    if (codeRef.current) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(codeRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand('copy');
      selection?.removeAllRanges();
      
      setCopied(true);
      toast.success("Embed code copied to clipboard");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Embed Code</h3>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            Add this script to your website's <code>&lt;head&gt;</code> tag to enable A/B testing for this project.
          </p>
          
          <div className="bg-base-200 p-4 rounded-lg relative">
            <pre 
              ref={codeRef}
              className="text-xs md:text-sm whitespace-pre-wrap overflow-auto max-h-64 font-mono"
            >{embedCode}</pre>
            
            <button 
              onClick={handleCopy}
              className="absolute top-2 right-2 btn btn-ghost btn-xs"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5m10 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium">Installation Instructions</h4>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Copy the code snippet above.</li>
            <li>Paste it into your website's HTML, right before the closing <code>&lt;/head&gt;</code> tag.</li>
            <li>The script will automatically load and apply your active tests.</li>
            <li>Make sure to deploy your website with the updated code.</li>
          </ol>
          
          <div className="alert alert-info text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>The script is lightweight (less than 10KB) and won't impact page load performance.</span>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 