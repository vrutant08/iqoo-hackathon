"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  Copy,
  Check,
  Download,
  Search,
  ChevronRight,
  ChevronDown,
  Archive,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectFile } from "@/lib/api-client";

interface FileTreeExplorerProps {
  files: ProjectFile[];
  projectName?: string;
  onDownloadZip?: () => void;
  className?: string;
}

interface TreeNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  file?: ProjectFile;
  children: Record<string, TreeNode>;
}

function getFileIcon(path: string) {
  if (path.endsWith(".tsx") || path.endsWith(".jsx") || path.endsWith(".ts") || path.endsWith(".js")) {
    return <FileCode className="size-3.5 text-sky-400 shrink-0" />;
  }
  if (path.endsWith(".py")) {
    return <FileCode className="size-3.5 text-amber-400 shrink-0" />;
  }
  if (path.endsWith(".json") || path.endsWith(".lock")) {
    return <FileJson className="size-3.5 text-yellow-300 shrink-0" />;
  }
  if (path.endsWith(".html") || path.endsWith(".css")) {
    return <FileCode className="size-3.5 text-rose-400 shrink-0" />;
  }
  if (path.endsWith(".md") || path.endsWith(".txt") || path.startsWith(".")) {
    return <FileText className="size-3.5 text-emerald-400 shrink-0" />;
  }
  return <FileCode className="size-3.5 text-slate-400 shrink-0" />;
}

export function FileTreeExplorer({
  files,
  projectName = "protopatch-app",
  onDownloadZip,
  className,
}: FileTreeExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string>(
    () => files.find((f) => f.isEntrypoint)?.path || files[0]?.path || ""
  );

  // Sync selectedPath when files change (e.g. on new generation or refine)
  useEffect(() => {
    if (files.length > 0 && (!selectedPath || !files.some((f) => f.path === selectedPath))) {
      const entry = files.find((f) => f.isEntrypoint)?.path || files[0]?.path || "";
      setSelectedPath(entry);
    }
  }, [files, selectedPath]);

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    frontend: true,
    "frontend/src": true,
    "frontend/src/components": true,
    backend: true,
    "backend/app": true,
    "backend/app/routes": true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Active file object
  const activeFile = useMemo(() => {
    return files.find((f) => f.path === selectedPath) || files[0] || null;
  }, [files, selectedPath]);

  // Build hierarchical tree
  const rootNode = useMemo(() => {
    const root: TreeNode = {
      name: projectName,
      fullPath: "",
      isFolder: true,
      children: {},
    };

    files.forEach((file) => {
      const parts = file.path.split("/");
      let current = root;
      let accumulated = "";

      parts.forEach((part, index) => {
        accumulated = accumulated ? `${accumulated}/${part}` : part;
        const isLast = index === parts.length - 1;

        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            fullPath: accumulated,
            isFolder: !isLast,
            file: isLast ? file : undefined,
            children: {},
          };
        }
        current = current.children[part];
      });
    });

    return root;
  }, [files, projectName]);

  const toggleFolder = (folderPath: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const copyCode = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const downloadActiveFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.path.split("/").pop() || "code.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render tree node recursively
  const renderTree = (node: TreeNode, depth = 0) => {
    const childrenKeys = Object.keys(node.children).sort((a, b) => {
      const aIsFolder = node.children[a].isFolder;
      const bIsFolder = node.children[b].isFolder;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.localeCompare(b);
    });

    return (
      <div key={node.fullPath || "root"} className="space-y-0.5">
        {childrenKeys.map((key) => {
          const child = node.children[key];
          const isFolder = child.isFolder;
          const isOpen = openFolders[child.fullPath] ?? true;
          const isSelected = selectedPath === child.fullPath;

          // Filter by search query if present
          if (
            searchQuery &&
            !isFolder &&
            !child.name.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return null;
          }

          return (
            <div key={child.fullPath}>
              {isFolder ? (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleFolder(child.fullPath)}
                    style={{ paddingLeft: `${depth * 14 + 8}px` }}
                    className="flex w-full items-center gap-1.5 py-1 text-left font-mono text-[11px] text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    {isOpen ? (
                      <ChevronDown className="size-3 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="size-3 text-slate-500 shrink-0" />
                    )}
                    {isOpen ? (
                      <FolderOpen className="size-3.5 text-amber-400/90 shrink-0" />
                    ) : (
                      <Folder className="size-3.5 text-amber-400/70 shrink-0" />
                    )}
                    <span className="truncate">{child.name}</span>
                  </button>
                  {isOpen && renderTree(child, depth + 1)}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedPath(child.fullPath)}
                  style={{ paddingLeft: `${depth * 14 + 20}px` }}
                  className={cn(
                    "flex w-full items-center gap-2 py-1 text-left font-mono text-[11px] transition-colors",
                    isSelected
                      ? "bg-accent/20 text-white font-medium border-l-2 border-accent"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  )}
                >
                  {getFileIcon(child.name)}
                  <span className="truncate">{child.name}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row overflow-hidden border border-ink/20 bg-code text-code-fg shadow-lg",
        className
      )}
    >
      {/* Sidebar: File Tree Explorer */}
      <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-slate-950/60 flex flex-col">
        {/* Header & Search */}
        <div className="p-3 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-label uppercase tracking-label text-accent font-bold flex items-center gap-1.5">
              <Terminal className="size-3.5" /> Project Files
            </span>
            <span className="font-mono text-[10px] text-white/40">
              {files.length} files
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-white/30" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-none py-1 pl-7 pr-2 font-mono text-[10px] text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Tree List */}
        <div className="flex-1 overflow-y-auto py-2 max-h-64 md:max-h-[30rem] scrollbar-thin">
          {renderTree(rootNode)}
        </div>

        {/* Export Zip Button */}
        {onDownloadZip && (
          <div className="p-2.5 border-t border-white/10 bg-white/5">
            <motion.button
              type="button"
              onClick={onDownloadZip}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-accent text-white font-mono text-xs uppercase tracking-wider font-bold hover:bg-accent/90 transition-all shadow"
            >
              <Archive className="size-3.5" /> Download .ZIP Project
            </motion.button>
          </div>
        )}
      </div>

      {/* Main Panel: Active File Viewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-code">
        {/* File Toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 bg-slate-900/40">
          <div className="flex items-center gap-2 min-w-0">
            {activeFile && getFileIcon(activeFile.path)}
            <span className="font-mono text-xs font-semibold text-white/90 truncate">
              {activeFile?.path || "No file selected"}
            </span>
            {activeFile?.language && (
              <span className="hidden sm:inline-block font-mono text-[9px] uppercase px-1.5 py-0.5 bg-white/10 text-white/60 rounded">
                {activeFile.language}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <motion.button
              type="button"
              onClick={copyCode}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              title="Copy file contents"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-ok" />
                  <span className="text-ok">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy</span>
                </>
              )}
            </motion.button>

            <motion.button
              type="button"
              onClick={downloadActiveFile}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              title="Download this file"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Save</span>
            </motion.button>
          </div>
        </div>

        {/* Code View with Line Numbers */}
        <div className="flex-1 overflow-auto max-h-[30rem] font-mono text-[12px] leading-relaxed p-4 text-slate-100">
          {activeFile ? (
            <pre className="overflow-x-auto whitespace-pre">
              <code>{activeFile.content}</code>
            </pre>
          ) : (
            <div className="flex h-48 items-center justify-center text-white/30 font-mono text-sm">
              Select a file from the explorer to view code.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
