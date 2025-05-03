"use client";

import { useState, useEffect } from "react";
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
  
  useEffect(() => {
    async function fetchRepoTree() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.provider_token;
        
        if (!token) {
          throw new Error("GitHub token not found");
        }
        
        const [owner, repoName] = repo.full_name.split('/');
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/trees/${repo.default_branch}?recursive=1`,
          {
            headers: {
              Authorization: `token ${token}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch repository files");
        }
        
        const data = await response.json();
        const treeItems = data.tree.filter((item: TreeItem) => 
          // Filter out non-code files like binary files
          !(item.path.startsWith('.git/') || 
            item.path.endsWith('.png') || 
            item.path.endsWith('.jpg') || 
            item.path.endsWith('.jpeg') || 
            item.path.endsWith('.gif') || 
            item.path.endsWith('.svg') ||
            item.path.endsWith('.ico'))
        );
        
        const rootNode: TreeNode = {
          path: "",
          name: "",
          type: "tree",
          children: [],
        };
        
        // Build tree structure from flat list
        treeItems.forEach((item: TreeItem) => {
          const pathParts = item.path.split('/');
          let currentNode = rootNode;
          
          for (let i = 0; i < pathParts.length; i++) {
            const isFile = i === pathParts.length - 1 && item.type === "blob";
            const partName = pathParts[i];
            
            if (isFile) {
              // Add file to current folder
              currentNode.children.push({
                path: item.path,
                name: partName,
                type: "blob",
                children: [],
              });
            } else {
              // Navigate to subfolder, create if doesn't exist
              let found = false;
              for (const child of currentNode.children) {
                if (child.name === partName && child.type === "tree") {
                  currentNode = child;
                  found = true;
                  break;
                }
              }
              
              if (!found) {
                const newFolder: TreeNode = {
                  path: pathParts.slice(0, i + 1).join('/'),
                  name: partName,
                  type: "tree",
                  children: [],
                };
                currentNode.children.push(newFolder);
                currentNode = newFolder;
              }
            }
          }
        });
        
        // Sort folders first, then files, alphabetically
        const sortTreeNodes = (node: TreeNode) => {
          node.children.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === "tree" ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
          
          for (const child of node.children) {
            if (child.type === "tree") {
              sortTreeNodes(child);
            }
          }
        };
        
        sortTreeNodes(rootNode);
        setTree(rootNode);
      } catch (err: any) {
        setError(err.message || "Failed to fetch repository files");
      } finally {
        setLoading(false);
      }
    }
    
    fetchRepoTree();
  }, [repo]);
  
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
  
  const renderTree = (node: TreeNode, level = 0): React.ReactElement => {
    const isExpanded = expandedFolders.has(node.path);
    
    if (node.type === "blob") {
      // Render file node
      return (
        <div
          key={node.path}
          className="pl-4 py-1 hover:bg-gray-900 cursor-pointer flex items-center text-sm transition-colors"
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
    } else {
      // Render folder node
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
                className="h-4 w-4 mr-2 text-[#3ECF8E]"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-white">{node.name}</span>
            </div>
          )}
          
          {isExpanded && node.children.map(child => renderTree(child, level + 1))}
        </div>
      );
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-2 border-[#3ECF8E] border-t-transparent rounded-full animate-spin"></div>
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
    <div className="bg-[#121212] border border-gray-800 rounded-md h-[400px] overflow-y-auto">
      <div className="font-mono text-sm">
        {tree.children.map(child => renderTree(child, 0))}
      </div>
    </div>
  );
} 