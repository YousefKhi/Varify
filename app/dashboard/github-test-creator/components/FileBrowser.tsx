"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/libs/supabase/client";
import React from "react";

type TreeItem = {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
};

type TreeNode = {
  path: string;
  name: string;
  type: "blob" | "tree";
  children: TreeNode[];
};

type FileBrowserProps = {
  repo: { full_name: string; default_branch: string };
  onSelectFile: (path: string) => void;
};

export default function FileBrowser({ repo, onSelectFile }: FileBrowserProps) {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };
  
  // Fetch repository data only once when component mounts or repo changes
  const repoFullName = repo?.full_name;
  const repoBranch = repo?.default_branch;
  
  useEffect(() => {
    if (!repoFullName || !repoBranch) return;
    
    let isMounted = true;
    setLoading(true);
    
    async function fetchRepoTree() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.provider_token;
        
        if (!token) {
          throw new Error("GitHub token not found");
        }
        
        const [owner, repoName] = repoFullName.split('/');
        const url = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${repoBranch}?recursive=1`;
        
        const response = await fetch(url, {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch repository files");
        }
        
        const data = await response.json();
        
        if (!isMounted) return;
        
        // Process tree data
        const treeItems = data.tree.filter((item: TreeItem) => 
          !(item.path.startsWith('.git/') || 
            /\.(png|jpe?g|gif|svg|ico)$/i.test(item.path))
        );
        
        // Build the tree structure
        const rootNode = buildTreeStructure(treeItems);
        
        if (isMounted) {
          setTree(rootNode);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error fetching repo:", err);
          setError(err.message || "Failed to fetch repository files");
          setLoading(false);
        }
      }
    }
    
    fetchRepoTree();
    
    return () => {
      isMounted = false;
    };
  }, [repoFullName, repoBranch]);
  
  // Helper function to build tree structure - moved outside of useEffect
  function buildTreeStructure(treeItems: TreeItem[]): TreeNode {
    const rootNode: TreeNode = {
      path: "",
      name: "",
      type: "tree",
      children: [],
    };
    
    // First pass: create a map of all paths for faster lookups
    const nodeMap = new Map<string, TreeNode>();
    nodeMap.set("", rootNode);
    
    // Pre-sort items to ensure parent folders are processed before children
    treeItems.sort((a, b) => {
      // Sort by path depth (number of slashes)
      const depthA = (a.path.match(/\//g) || []).length;
      const depthB = (b.path.match(/\//g) || []).length;
      if (depthA !== depthB) return depthA - depthB;
      
      // If same depth, sort by path
      return a.path.localeCompare(b.path);
    });
    
    // Process items in sorted order
    for (const item of treeItems) {
      const pathParts = item.path.split('/');
      const fileName = pathParts.pop() || "";
      const parentPath = pathParts.join('/');
      
      // Get or create parent folder
      let parentNode = nodeMap.get(parentPath) || rootNode;
      
      // Create the node
      const newNode: TreeNode = {
        path: item.path,
        name: fileName,
        type: item.type,
        children: [],
      };
      
      // Add to map and parent
      nodeMap.set(item.path, newNode);
      parentNode.children.push(newNode);
    }
    
    // Sort each level's children (folders first, then alphabetical)
    const sortChildren = (node: TreeNode) => {
      node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      
      for (const child of node.children) {
        if (child.type === "tree") {
          sortChildren(child);
        }
      }
    };
    
    sortChildren(rootNode);
    return rootNode;
  }
  
  // Render file node - extracted for clarity
  const renderFileNode = (node: TreeNode, level: number) => (
    <div
      key={node.path}
      className="pl-4 py-1 hover:bg-[#1f1f1f] cursor-pointer flex items-center text-sm transition-colors"
      style={{ paddingLeft: `${(level * 0.75) + 0.75}rem` }}
      onClick={() => onSelectFile(node.path)}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 mr-2 text-gray-500"
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="text-white">{node.name}</span>
    </div>
  );
  
  // Render folder node - extracted for clarity
  const renderFolderNode = (node: TreeNode, level: number) => {
    const isExpanded = expandedFolders.has(node.path);
    
    return (
      <div key={node.path || "root"}>
        {node.name && (
          <div
            className="pl-4 py-1 hover:bg-gray-900 cursor-pointer flex items-center text-sm transition-colors"
            style={{ paddingLeft: `${(level * 0.75) + 0.25}rem` }}
            onClick={() => toggleFolder(node.path)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 mr-2 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-2 text-[#39a276]"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-white">{node.name}</span>
          </div>
        )}
        
        {isExpanded && (
          <div>
            {node.children.map(child => 
              child.type === "blob" 
                ? renderFileNode(child, level + 1)
                : renderFolderNode(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Render tree content conditionally based on state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-2 border-[#39a276] border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md">
          <span>{error}</span>
        </div>
      );
    }
    
    if (!tree) {
      return (
        <div className="text-center py-8 text-gray-500">
          No files found in repository
        </div>
      );
    }
    
    return (
      <div className="font-mono text-sm">
        {tree.children.map(child => 
          child.type === "blob" 
            ? renderFileNode(child, 0) 
            : renderFolderNode(child, 0)
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-[#121212] border border-gray-800 rounded-md h-[400px] overflow-y-auto">
      {renderContent()}
    </div>
  );
} 