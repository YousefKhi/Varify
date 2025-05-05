"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Resizable } from 're-resizable';

// Types
interface VisualEditorProps {
  projectId: string;
  onSelectElement: (html: string) => void;
  onCancel: () => void;
}

export default function VisualEditor({ projectId, onSelectElement, onCancel }: VisualEditorProps) {
  const [url, setUrl] = useState<string>('');
  const [proxiedUrl, setProxiedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [variantA, setVariantA] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setProxiedUrl('');
    setVariantA('');
  }, [url]);

  const handleLoadUrl = () => {
    if (!url) return;
    setIsLoading(true);
    setProxiedUrl(`/api/proxy?url=${encodeURIComponent(url)}`);
  };

  const injectionScript = `
  (function() {
    const originalStyles = new Map();
    document.addEventListener('mouseover', function(e) {
      const t = e.target;
      if (!t || t === document.body) return;
      if (!originalStyles.has(t)) {
        originalStyles.set(t, t.getAttribute('style') || '');
      }
      t.style.outline = '2px solid #3ECF8E';
      t.style.outlineOffset = '2px';
      t.style.cursor = 'pointer';
    }, true);

    document.addEventListener('mouseout', function(e) {
      const t = e.target;
      if (!t || t === document.body) return;
      const original = originalStyles.get(t);
      if (original !== undefined) {
        t.setAttribute('style', original);
      } else {
        t.removeAttribute('style');
      }
    }, true);

    document.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const t = e.target;
      if (t && t !== document.body) {
        window.parent.postMessage({
          type: 'ELEMENT_SELECTED',
          html: t.outerHTML
        }, '*');
      }
    }, true);
  })();
`;


  const handleIframeLoad = () => {
    setIsLoading(false);
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const script = doc.createElement('script');
      script.textContent = injectionScript;
      doc.body.appendChild(script);
    } catch (err) {
      console.error('Injection error:', err);
    }
  };

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.data?.type === 'ELEMENT_SELECTED') {
        setVariantA(e.data.html);
        // Removed the automatic redirection timeout
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onSelectElement]);

  const handleNext = () => {
    if (variantA) {
      onSelectElement(variantA);
    }
  };

  return (
    <div className="bg-[#171717] border border-[#444444] rounded-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-white">Visual A/B Test Editor</h2>
        <button onClick={onCancel} className="px-3 py-1.5 bg-[#1f1f1f] text-white rounded-md">Cancel</button>
      </div>
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Website URL</label>
        <div className="flex">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-[#1f1f1f] border border-[#444444] rounded-l-md px-3 py-2 text-white"
          />
          <button
            onClick={handleLoadUrl}
            disabled={!url || isLoading}
            className="px-4 py-2 bg-[#39a276] text-white rounded-r-md"
          >
            {isLoading ? 'Loading...' : 'Load'}
          </button>
        </div>
      </div>
      <div className="mb-6 bg-[#1f1f1f] border-l-2 border-[#39a276] pl-3 py-2">
        <p className="text-sm text-gray-400">
          Click on any element in the preview below to select it for testing.
        </p>
      </div>
      <div className="mb-6">
        <Resizable defaultSize={{ width: '100%', height: 500 }} minHeight={300} enable={{ bottom: true }}>
          <div className="w-full h-full bg-[#1f1f1f] border border-[#444444] rounded-md overflow-hidden">
            {proxiedUrl ? (
              <iframe
                ref={iframeRef}
                src={proxiedUrl}
                onLoad={handleIframeLoad}
                className="w-full h-full"
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Enter a URL and click Load to start
              </div>
            )}
          </div>
        </Resizable>
      </div>
      {variantA && (
        <div className="mt-6">
          <h3 className="text-sm text-white mb-2">Selected Element</h3>
          <div className="bg-[#1f1f1f] border border-[#444444] rounded-md p-4">
            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
              {variantA}
            </pre>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-[#39a276] text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors"
              >
                Continue to Next Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
