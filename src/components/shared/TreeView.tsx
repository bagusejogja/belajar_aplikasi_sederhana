'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Building2,
  Building,
  Layers,
  Search,
  Check,
  Expand,
  Minimize2,
  Tag
} from 'lucide-react';

export interface TreeNodeItem {
  id: string;
  label: string;
  code?: string;
  type?: 'faculty' | 'department' | 'unit' | 'account_group' | 'account_subgroup' | 'account_item' | 'default';
  badge?: string;
  badgeVariant?: 'blue' | 'emerald' | 'amber' | 'slate' | 'rose';
  count?: number;
  amount?: number;
  children?: TreeNodeItem[];
}

interface TreeViewProps {
  data: TreeNodeItem[];
  selectedId?: string;
  onSelect?: (node: TreeNodeItem) => void;
  defaultExpandedIds?: string[];
  searchable?: boolean;
  showExpandCollapseAll?: boolean;
  className?: string;
}

export default function TreeView({
  data,
  selectedId,
  onSelect,
  defaultExpandedIds = [],
  searchable = true,
  showExpandCollapseAll = true,
  className = '',
}: TreeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(defaultExpandedIds));

  // Kumpulkan seluruh ID untuk tombol Expand All
  const allIds = useMemo(() => {
    const ids: string[] = [];
    const traverse = (items: TreeNodeItem[]) => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          ids.push(item.id);
          traverse(item.children);
        }
      });
    };
    traverse(data);
    return ids;
  }, [data]);

  const handleToggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedIds(new Set(allIds));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  // Filter tree berdasarkan kata kunci pencarian
  const filterTree = (nodes: TreeNodeItem[], query: string): TreeNodeItem[] => {
    if (!query.trim()) return nodes;
    const lowerQuery = query.toLowerCase();

    return nodes
      .map((node) => {
        const matchesCurrent =
          node.label.toLowerCase().includes(lowerQuery) ||
          (node.code && node.code.toLowerCase().includes(lowerQuery));

        const filteredChildren = node.children ? filterTree(node.children, query) : [];

        if (matchesCurrent || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as TreeNodeItem[];
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    return filterTree(data, searchQuery);
  }, [data, searchQuery]);

  // Otomatis buka semua cabang jika sedang mencari
  const isSearching = searchQuery.trim().length > 0;

  const getNodeIcon = (node: TreeNodeItem, isExpanded: boolean) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);

    if (node.type === 'faculty') {
      return <Building2 size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />;
    }
    if (node.type === 'department') {
      return <Building size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />;
    }
    if (node.type === 'unit') {
      return <Layers size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0" />;
    }
    if (node.type === 'account_group') {
      return isExpanded ? (
        <FolderOpen size={16} className="text-amber-500 shrink-0" />
      ) : (
        <Folder size={16} className="text-amber-500 shrink-0" />
      );
    }
    if (node.type === 'account_subgroup') {
      return isExpanded ? (
        <FolderOpen size={15} className="text-emerald-500 shrink-0" />
      ) : (
        <Folder size={15} className="text-emerald-500 shrink-0" />
      );
    }
    if (node.type === 'account_item') {
      return <FileText size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />;
    }

    if (hasChildren) {
      return isExpanded ? (
        <FolderOpen size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
      ) : (
        <Folder size={16} className="text-blue-500 dark:text-blue-400 shrink-0" />
      );
    }
    return <FileText size={14} className="text-gray-400 dark:text-slate-500 shrink-0" />;
  };

  const getBadgeClass = (variant?: 'blue' | 'emerald' | 'amber' | 'slate' | 'rose') => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
      case 'amber':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
      case 'rose':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';
      case 'slate':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      case 'blue':
      default:
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60';
    }
  };

  const renderTreeNode = (node: TreeNodeItem, depth = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = isSearching || expandedIds.has(node.id);
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => onSelect && onSelect(node)}
          style={{ paddingLeft: `${depth * 1.3 + 0.5}rem` }}
          className={`group flex items-center justify-between py-1.5 pr-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
            isSelected
              ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 ring-1 ring-blue-500/40 shadow-xs'
              : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100/80 dark:hover:bg-slate-800/70'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
            {/* Toggle Arrow */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => handleToggleExpand(node.id, e)}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200/60 dark:hover:bg-slate-700 transition-colors"
                title={isExpanded ? 'Tutup cabang' : 'Buka cabang'}
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="transition-transform duration-150" />
                ) : (
                  <ChevronRight size={14} className="transition-transform duration-150" />
                )}
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center opacity-30 text-[10px]">
                •
              </span>
            )}

            {/* Node Icon */}
            {getNodeIcon(node, isExpanded)}

            {/* Code if exists */}
            {node.code && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200/80 dark:border-slate-700 shrink-0">
                {node.code}
              </span>
            )}

            {/* Label */}
            <span className={`truncate ${isSelected ? 'font-bold text-blue-900 dark:text-blue-200' : ''}`}>
              {node.label}
            </span>
          </div>

          {/* Right Info: Badge / Children Count / Amount */}
          <div className="flex items-center gap-1.5 shrink-0">
            {node.amount !== undefined && (
              <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                Rp {new Intl.NumberFormat('id-ID').format(node.amount)}
              </span>
            )}

            {node.badge && (
              <span
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${getBadgeClass(
                  node.badgeVariant
                )}`}
              >
                {node.badge}
              </span>
            )}

            {hasChildren && node.children && (
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                {node.children.length}
              </span>
            )}
          </div>
        </div>

        {/* Child Nodes */}
        {hasChildren && isExpanded && (
          <div className="relative pl-2.5 ml-3 border-l border-gray-200/70 dark:border-slate-800 space-y-0.5 mt-0.5">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-xs p-4 flex flex-col ${className}`}>
      {/* Header Toolbar: Search + Expand/Collapse */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-800">
        {searchable && (
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari struktur unit / kode akun..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 font-medium"
            />
          </div>
        )}

        {showExpandCollapseAll && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2.5 py-1 text-[11px] font-bold text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Buka seluruh cabang pohon"
            >
              <Expand size={12} />
              <span>Buka Semua</span>
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-2.5 py-1 text-[11px] font-bold text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Tutup seluruh cabang pohon"
            >
              <Minimize2 size={12} />
              <span>Tutup Semua</span>
            </button>
          </div>
        )}
      </div>

      {/* Tree Content List */}
      <div className="mt-3 overflow-y-auto max-h-[460px] pr-1 space-y-0.5">
        {filteredData.length > 0 ? (
          filteredData.map((node) => renderTreeNode(node))
        ) : (
          <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-xs">
            <Tag size={24} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold">Tidak ada struktur yang cocok dengan &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
