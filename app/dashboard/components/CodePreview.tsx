"use client";

import { useEffect, useRef } from "react";

type CodePreviewProps = {
  html: string;
};

export default function CodePreview({ html }: CodePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        // Reset the iframe content
        doc.open();
        
        // Create a sandboxed HTML document with the provided HTML
        const safeHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: system-ui, -apple-system, sans-serif;
                  margin: 0;
                  padding: 8px;
                  font-size: 14px;
                  line-height: 1.5;
                }
                /* Base styles for preview */
                button, .button, a.button {
                  display: inline-block;
                  padding: 0.5rem 1rem;
                  background-color: #3b82f6;
                  color: white;
                  border-radius: 0.25rem;
                  font-weight: 500;
                  text-align: center;
                  cursor: pointer;
                  text-decoration: none;
                }
                h1, h2, h3, h4 {
                  margin-top: 0;
                  font-weight: 600;
                }
                .container {
                  padding: 1rem;
                }
              </style>
            </head>
            <body>${html}</body>
          </html>
        `;
        
        doc.write(safeHtml);
        doc.close();
      }
    }
  }, [html]);

  return (
    <div className="w-full h-full min-h-[150px] bg-white rounded border overflow-hidden">
      <iframe
        ref={iframeRef}
        title="Code Preview"
        className="w-full h-full min-h-[150px]"
        sandbox="allow-same-origin"
      />
    </div>
  );
} 