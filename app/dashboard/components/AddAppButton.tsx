"use client";

import Link from "next/link";

export default function AddAppButton() {
  return (
    <Link 
      href="/dashboard/new"
      className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-[#3ECF8E] text-white font-medium hover:bg-opacity-90 transition-all"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 20 20" 
        fill="currentColor" 
        className="w-4 h-4 mr-1.5"
      >
        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
      </svg>
      New Project
    </Link>
  );
} 