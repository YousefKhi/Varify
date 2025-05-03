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
        try {
          // Reset the iframe content
          doc.open();
          
          // Create a proper HTML document structure that renders the HTML content
          // with viewport settings to ensure proper scaling
          const rawHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                <style>
                  html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    overflow: auto;
                  }
                  body {
                    padding: 8px;
                    box-sizing: border-box;
                  }
                </style>
              </head>
              <body>${html}</body>
            </html>
          `;
          
          doc.write(rawHtml);
          doc.close();
          
          // Set iframe dimensions to accommodate content
          const updateIframeSize = () => {
            if (iframe && doc.body) {
              // Calculate dimensions based on content
              const width = doc.body.scrollWidth;
              const height = doc.body.scrollHeight;
              
              // Set iframe size with some padding
              iframe.style.width = '100%';
              iframe.style.height = `${Math.min(400, height + 16)}px`;
            }
          };
          
          // Initial size update
          updateIframeSize();
          
          // Set up observer to handle dynamic content changes
          const resizeObserver = new ResizeObserver(updateIframeSize);
          resizeObserver.observe(doc.body);
          
          // Set up window resize handler
          const handleResize = () => updateIframeSize();
          window.addEventListener('resize', handleResize);
          
          return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleResize);
          };
        } catch (error) {
          console.error("Error rendering preview:", error);
          doc.write(`<p style="color: red">Error rendering preview: ${error}</p>`);
          doc.close();
        }
      }
    }
  }, [html]);

  return (
    <div className="w-full bg-white rounded-md overflow-hidden border border-gray-200">
      <iframe
        ref={iframeRef}
        title="Code Preview"
        className="w-full border-0"
        style={{ 
          minHeight: '100px',
          maxHeight: '400px',
          display: 'block'
        }}
        sandbox="allow-same-origin"
      />
    </div>
  );
} 