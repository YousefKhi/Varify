"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

type VerificationCheckerProps = {
  projectId: string;
  projectName: string;
  siteUrl: string | null; // Pass the site URL for troubleshooting
};

type VerificationStatus = "idle" | "loading" | "success" | "error";

export default function VerificationChecker({ projectId, projectName, siteUrl }: VerificationCheckerProps) {
  const [status, setStatus] = useState<VerificationStatus>("idle");

  const checkVerification = async () => {
    setStatus("loading");
    try {
      const response = await fetch(`/api/check-ping?projectId=${projectId}`);
      const data = await response.json();

      if (response.ok && data.verified) {
        setStatus("success");
        toast.success("Script successfully detected!");
      } else {
        setStatus("error");
        toast.error("Script not detected yet.");
      }
    } catch (error) {
      console.error("Verification check failed:", error);
      setStatus("error");
      toast.error("Verification check failed. Please try again.");
    }
  };

  return (
    <div className="mt-8 p-6 border rounded-lg bg-base-100">
      <h3 className="text-lg font-medium mb-4">Verify Installation</h3>
      
      {status === "idle" && (
        <p className="text-sm mb-4 text-gray-600">
          After installing the script on <code className="bg-base-200 p-1 rounded text-xs">{projectName}</code>, click below to verify.
        </p>
      )}
      
      {status === "loading" && (
        <div className="flex items-center justify-center p-4">
          <span className="loading loading-spinner loading-md mr-2"></span>
          <span>Checking for script...</span>
        </div>
      )}
      
      {status === "success" && (
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Installation verified! You can now create tests for {projectName}.</span>
          <Link href={`/dashboard/projects/${projectId}`} className="btn btn-sm btn-success-content ml-auto">
            Go to Project
          </Link>
        </div>
      )}
      
      {status === "error" && (
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div>
            <p>We couldn&apos;t detect the script yet.</p>
            <ul className="list-disc pl-5 mt-2 text-xs">
              <li>Ensure the script is in the <code className="bg-base-200 p-1 rounded text-xs">&lt;head&gt;</code> tag of {siteUrl ? <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="link link-primary">your website</a> : "your website"}.</li>
              <li>It might take a few minutes for the ping to register.</li>
              <li>Clear your browser cache for the site if needed.</li>
            </ul>
          </div>
        </div>
      )}
      
      {(status === "idle" || status === "error") && (
        <button 
          onClick={checkVerification}
          className="btn btn-secondary w-full mt-4"
        >
          Verify Installation
        </button>
      )}
    </div>
  );
} 