/**
 * Unified type definitions for the Notes feature
 */

// ============================================
// YAML Format Types (for export/import)
// ============================================

export interface YAMLBlock {
  id: string;
  title: string;
  content: string;
  refs?: string[];
  children?: YAMLBlock[];
}

export interface YAMLNote {
  id: string;
  title: string;
  blocks: YAMLBlock[];
}

// ============================================
// BlockTree Types (for graph visualization)
// ============================================

export interface BlockNode {
  id: string;
  parentId: string | null;
  title: string;
  children: string[];
  references: string[];
  isLeaf: boolean;
}

export interface BlockReference {
  fromId: string;
  toId: string;
}

export interface BlockTree {
  nodes: Map<string, BlockNode>;
  rootIds: string[];
  references: BlockReference[];
}

// ============================================
// Note Storage Types (for IndexedDB)
// ============================================

export interface StoredNote {
  id: string;
  title: string;
  blocks: string; // JSON stringified BlockNote blocks
  createdAt: number;
  updatedAt: number;
}

export interface CompletedBlock {
  id: string;
  noteId?: string;
  title: string;
  content: string;
  textContent: string;
  parentId: string | null;
  completedAt: number;
  isLeaf: boolean;
  metadata?: {
    hasCode?: boolean;
    hasMath?: boolean;
    wordCount?: number;
    [key: string]: unknown;
  };
}

// ============================================
// Editor Types
// ============================================

export interface EditorBlock {
  id: string;
  title: string;
  textContent: string;
  isLeaf: boolean;
}

export interface InvalidReference {
  blockId: string;
  refId: string;
  refTitle: string;
}
