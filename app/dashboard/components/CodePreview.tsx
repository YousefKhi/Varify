"use client";

import { LiveProvider, LiveEditor, LiveError, LivePreview } from "react-live";
import React, { useState } from "react";

type CodePreviewProps = {
  code: string;
  title?: string;
};

const scope = {
  React,
};

export default function CodePreview({ code, title = "Code Preview" }: CodePreviewProps) {
  const [editorCode, setEditorCode] = useState(code);

  return (
    <LiveProvider code={editorCode} scope={scope}>
      <div className="space-y-4">
        {/* Title */}
        <h3 className="text-white text-lg font-medium">{title}</h3>
        
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Code Editor */}
          <div className="bg-[#121212] border border-[#444444] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#1f1f1f] border-b border-[#444444]">
              <span className="text-sm text-gray-400">Edit Code</span>
              <button 
                onClick={() => setEditorCode(code)} 
                className="text-xs px-2 py-1 bg-[#2a2a2a] text-gray-300 rounded hover:bg-[#39a276] hover:text-white transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="p-1">
              <LiveEditor 
                onChange={setEditorCode}
                className="text-sm font-mono p-3 bg-[#1a1a1a] text-white h-[250px] overflow-auto rounded w-full" 
              />
            </div>
            <LiveError className="bg-red-500/10 text-red-400 text-xs p-4 border-t border-red-500/20" />
          </div>

          {/* Live Visual Preview */}
          <div className="flex flex-col">
            <div className="text-sm text-gray-400 mb-2 px-4">Preview Result</div>
            <div className="p-6 border border-[#444444] rounded-lg bg-white dark:bg-[#1f1f1f] flex-1 flex items-center justify-center">
              <div className="w-full max-w-md mx-auto">
                <LivePreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </LiveProvider>
  );
}
