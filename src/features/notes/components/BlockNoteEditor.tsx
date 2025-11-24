/**
 * BlockNote Editor - A Notion-style block editor
 * Replaces the old TipTap editor with a more modern UI
 *
 * Block Rules:
 * 1. First sibling block must be a heading, subsequent siblings cannot be headings
 * 2. Each nested group follows the same rule independently
 * 3. Only leaf blocks (blocks without children) can be referenced via @
 * 4. Invalid references (to non-leaf blocks) are automatically cleaned up
 */

import { useCallback, useEffect, useState, useRef } from "react";
import {
  SuggestionMenuController,
  useCreateBlockNote,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { DefaultReactSuggestionItem } from "@blocknote/react";
import { filterSuggestionItems, insertOrUpdateBlock } from "@blocknote/core";
import type { Block, PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { MantineProvider } from "@mantine/core";
import { FileDown, FileUp, FileText, AlertCircle, Sigma } from "lucide-react";
import { customSchema } from "../lib/customBlocks.js";
import type { BlockTree, BlockNode, BlockReference, EditorBlock } from "../types/note";
import { getLeafBlocksExcluding } from "../db/indexedDB";

// Custom block type alias for readability
type CustomBlock = Block<
  typeof customSchema.blockSchema,
  typeof customSchema.inlineContentSchema,
  typeof customSchema.styleSchema
>;

// Generate unique block ID
function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Collect all leaf block IDs (blocks without children)
 */
function collectLeafIds(blocks: CustomBlock[]): Set<string> {
  const leafIds = new Set<string>();

  function processBlock(block: CustomBlock) {
    const hasChildren = block.children && block.children.length > 0;
    if (!hasChildren) {
      leafIds.add(block.id);
    }
    if (block.children) {
      for (const child of block.children) {
        processBlock(child);
      }
    }
  }

  for (const block of blocks) {
    processBlock(block);
  }

  return leafIds;
}

/**
 * Find invalid references (references to non-leaf blocks)
 */
function findInvalidReferences(
  blocks: CustomBlock[],
  leafIds: Set<string>
): { blockId: string; refId: string; refTitle: string }[] {
  const invalidRefs: { blockId: string; refId: string; refTitle: string }[] = [];

  function processBlock(block: CustomBlock) {
    if (block.content && Array.isArray(block.content)) {
      for (const item of block.content) {
        if (item.type === "nodeReference") {
          const props = item.props as { refId?: string; refTitle?: string };
          const refId = props?.refId;
          if (refId && !leafIds.has(refId)) {
            invalidRefs.push({
              blockId: block.id,
              refId,
              refTitle: props?.refTitle || "Unknown",
            });
          }
        }
      }
    }
    if (block.children) {
      for (const child of block.children) {
        processBlock(child);
      }
    }
  }

  for (const block of blocks) {
    processBlock(block);
  }

  return invalidRefs;
}

interface BlockNoteEditorProps {
  initialContent?: CustomBlock[];
  onChange?: (blocks: CustomBlock[]) => void;
  onTreeChange?: (tree: BlockTree) => void;
  noteId?: string;
  onExportYAML?: () => void;
  onImportYAML?: () => void;
  onExportMarkdown?: () => void;
}

interface InvalidRef {
  blockId: string;
  refId: string;
  refTitle: string;
}

/**
 * Build BlockTree from BlockNote blocks
 */
function buildBlockTree(
  blocks: CustomBlock[],
  parentId: string | null = null
): { nodes: Map<string, BlockNode>; rootIds: string[]; references: BlockReference[] } {
  const nodes = new Map<string, BlockNode>();
  const rootIds: string[] = [];
  const references: BlockReference[] = [];

  function processBlock(block: CustomBlock, parent: string | null) {
    const id = block.id;
    const childIds: string[] = [];
    const blockRefs: string[] = [];

    // Extract references from inline content
    if (block.content && Array.isArray(block.content)) {
      for (const item of block.content) {
        if (item.type === "nodeReference") {
          const refId = (item.props as { refId?: string })?.refId;
          if (refId) {
            blockRefs.push(refId);
            references.push({ fromId: id, toId: refId });
          }
        }
      }
    }

    // Process children recursively
    if (block.children && block.children.length > 0) {
      for (const child of block.children) {
        childIds.push(child.id);
        processBlock(child, id);
      }
    }

    // Get title from first heading or paragraph
    let title = "";
    if (block.type === "heading" && block.content) {
      title = block.content.map((c) => ("text" in c ? c.text : "")).join("");
    } else if (block.content && Array.isArray(block.content)) {
      title = block.content
        .map((c) => ("text" in c ? c.text : ""))
        .join("")
        .slice(0, 50);
    }

    const isLeaf = childIds.length === 0;

    nodes.set(id, {
      id,
      parentId: parent,
      title,
      children: childIds,
      references: blockRefs,
      isLeaf,
    });

    if (parent === null) {
      rootIds.push(id);
    }
  }

  for (const block of blocks) {
    processBlock(block, parentId);
  }

  return { nodes, rootIds, references };
}

/**
 * Get all leaf blocks for @ mention suggestions
 * Only leaf blocks (blocks without children) can be referenced
 */
function getLeafBlocks(blocks: CustomBlock[], excludeId?: string): EditorBlock[] {
  const leafBlocks: EditorBlock[] = [];

  function processBlock(block: CustomBlock) {
    const hasChildren = block.children && block.children.length > 0;

    if (!hasChildren && block.id !== excludeId) {
      let title = "";
      let textContent = "";

      if (block.content && Array.isArray(block.content)) {
        textContent = block.content
          .map((c) => ("text" in c ? c.text : ""))
          .join("");
        title = textContent.slice(0, 50) || "Untitled";
      }

      leafBlocks.push({
        id: block.id,
        title,
        textContent,
        isLeaf: true,
      });
    }

    if (block.children) {
      for (const child of block.children) {
        processBlock(child);
      }
    }
  }

  for (const block of blocks) {
    processBlock(block);
  }

  return leafBlocks;
}

export function BlockNoteEditor({
  initialContent,
  onChange,
  onTreeChange,
  noteId: _noteId,
  onExportYAML,
  onImportYAML,
  onExportMarkdown,
}: BlockNoteEditorProps) {
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [_leafBlocks, setLeafBlocks] = useState<EditorBlock[]>([]);
  const [invalidRefs, setInvalidRefs] = useState<InvalidRef[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Listen for system dark mode changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Create editor instance with custom schema
  const editor = useCreateBlockNote({
    schema: customSchema,
    initialContent: initialContent || [
      {
        id: generateId(),
        type: "heading",
        props: { level: 2 },
        content: [],
        children: [],
      } as PartialBlock<typeof customSchema.blockSchema, typeof customSchema.inlineContentSchema, typeof customSchema.styleSchema>,
    ],
  });

  // Update leaf blocks when content changes
  const updateLeafBlocks = useCallback(() => {
    const blocks = editor.document;
    const leaves = getLeafBlocks(blocks, currentBlockId || undefined);
    setLeafBlocks(leaves);
  }, [editor, currentBlockId]);

  // Handle editor changes with validation
  const handleChange = useCallback(() => {
    const blocks = editor.document;
    onChange?.(blocks);

    // Build and notify tree structure
    const tree = buildBlockTree(blocks);
    onTreeChange?.({
      nodes: tree.nodes,
      rootIds: tree.rootIds,
      references: tree.references,
    });


    // Validate references - only leaf blocks can be referenced
    const leafIds = collectLeafIds(blocks);
    const invalid = findInvalidReferences(blocks, leafIds);

    if (invalid.length > 0) {
      setInvalidRefs(invalid);
      setShowWarning(true);

      // Auto-hide warning after 5 seconds
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(false);
      }, 5000);
    } else {
      setInvalidRefs([]);
      setShowWarning(false);
    }

    updateLeafBlocks();
  }, [editor, onChange, onTreeChange, updateLeafBlocks]);

  // Get mention items for @ suggestions
  const getMentionItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      // Get leaf blocks from current document
      const blocks = editor.document;
      const currentLeaves = getLeafBlocks(blocks, currentBlockId || undefined);

      // Also get completed leaf blocks from IndexedDB
      let completedLeaves: EditorBlock[] = [];
      try {
        const completed = await getLeafBlocksExcluding(currentBlockId || "");
        completedLeaves = completed.map((b) => ({
          id: b.id,
          title: b.title,
          textContent: b.textContent,
          isLeaf: true,
        }));
      } catch (e) {
        console.error("Failed to get completed blocks:", e);
      }

      // Merge and deduplicate
      const allLeaves = [...currentLeaves];
      for (const completed of completedLeaves) {
        if (!allLeaves.find((l) => l.id === completed.id)) {
          allLeaves.push(completed);
        }
      }

      const items: DefaultReactSuggestionItem[] = allLeaves.map((block) => ({
        title: block.title,
        onItemClick: () => {
          editor.insertInlineContent([
            {
              type: "nodeReference",
              props: {
                refId: block.id,
                refTitle: block.title,
              },
            },
            " ",
          ]);
        },
        aliases: [block.id],
        group: "References",
      }));

      return filterSuggestionItems(items, query);
    },
    [editor, currentBlockId]
  );

  // Get slash menu items with custom math block
  const getSlashMenuItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      const defaultItems = getDefaultReactSlashMenuItems(editor);

      // Add math block item
      const mathItem: DefaultReactSuggestionItem = {
        title: "Math Formula",
        onItemClick: () => {
          insertOrUpdateBlock(editor, {
            type: "math",
          });
        },
        aliases: ["math", "latex", "formula", "equation", "katex"],
        group: "Advanced",
        icon: <Sigma size={18} />,
        subtext: "Insert a LaTeX math formula block",
      };

      return filterSuggestionItems([...defaultItems, mathItem], query);
    },
    [editor]
  );

  // Get inline math items (triggered by $)
  const getInlineMathItems = useCallback(
    async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      // If the query ends with $, it's a complete formula
      if (query.endsWith("$") && query.length > 1) {
        const formula = query.slice(0, -1);
        return [
          {
            title: formula,
            onItemClick: () => {
              editor.insertInlineContent([
                {
                  type: "inlineMath",
                  props: { formula },
                },
                " ",
              ]);
            },
            group: "Math",
            icon: <Sigma size={18} />,
            subtext: "Insert inline math formula",
          },
        ];
      }

      // Show preview of current formula
      if (query.length > 0) {
        return [
          {
            title: `${query}$ (type $ to insert)`,
            onItemClick: () => {
              editor.insertInlineContent([
                {
                  type: "inlineMath",
                  props: { formula: query },
                },
                " ",
              ]);
            },
            group: "Math",
            icon: <Sigma size={18} />,
            subtext: "Type closing $ to insert formula",
          },
        ];
      }

      return [];
    },
    [editor]
  );

  // Track current block
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = editor.getSelection();
      if (selection && selection.blocks.length > 0) {
        setCurrentBlockId(selection.blocks[0].id);
      }
    };

    // Initial update
    updateLeafBlocks();

    // Listen for selection changes
    const interval = setInterval(handleSelectionChange, 500);
    return () => clearInterval(interval);
  }, [editor, updateLeafBlocks]);

  return (
    <MantineProvider>
      <div className="blocknote-editor w-full h-full flex flex-col bg-bg dark:bg-bg-dark">
        {/* Warning Banner for Invalid References */}
        {showWarning && invalidRefs.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
            <AlertCircle size={16} className="shrink-0" />
            <div className="text-sm">
              <strong>Invalid references detected:</strong>{" "}
              {invalidRefs.map((ref, i) => (
                <span key={ref.refId}>
                  {i > 0 && ", "}
                  <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded text-xs">
                    @{ref.refTitle}
                  </code>
                </span>
              ))}
              <span className="ml-1">
                (Only leaf blocks without children can be referenced)
              </span>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="ml-auto text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
            >
              ×
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-2 border-b border-border dark:border-border-dark bg-bg-muted dark:bg-bg-elevated-dark">
          <button
            onClick={onExportYAML}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-bg-elevated dark:hover:bg-bg-muted-dark transition-colors text-text-secondary dark:text-text-secondary-dark"
            title="Export as YAML"
          >
            <FileDown size={16} />
            <span>YAML</span>
          </button>

          <button
            onClick={onImportYAML}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-bg-elevated dark:hover:bg-bg-muted-dark transition-colors text-text-secondary dark:text-text-secondary-dark"
            title="Import YAML"
          >
            <FileUp size={16} />
            <span>Import</span>
          </button>

          <button
            onClick={onExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-bg-elevated dark:hover:bg-bg-muted-dark transition-colors text-text-secondary dark:text-text-secondary-dark"
            title="Export as Markdown"
          >
            <FileText size={16} />
            <span>Markdown</span>
          </button>

          <div className="ml-auto text-xs text-text-tertiary dark:text-text-tertiary-dark">
            <kbd className="px-1 py-0.5 bg-bg-elevated dark:bg-bg-muted-dark rounded text-xs">/</kbd> commands{" "}
            <kbd className="px-1 py-0.5 bg-bg-elevated dark:bg-bg-muted-dark rounded text-xs">@</kbd> references{" "}
            <kbd className="px-1 py-0.5 bg-bg-elevated dark:bg-bg-muted-dark rounded text-xs">$</kbd> math{" "}
            <kbd className="px-1 py-0.5 bg-bg-elevated dark:bg-bg-muted-dark rounded text-xs">Tab</kbd> indent
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto">
          <BlockNoteView
            editor={editor}
            onChange={handleChange}
            theme={isDarkMode ? "dark" : "light"}
            data-theming-css-variables-demo
            slashMenu={false}
          >
            {/* Slash Menu with Math Block */}
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={getSlashMenuItems}
            />
            {/* $ Inline Math Menu */}
            <SuggestionMenuController
              triggerCharacter="$"
              getItems={getInlineMathItems}
            />
            {/* @ Mention Suggestion Menu */}
            <SuggestionMenuController
              triggerCharacter="@"
              getItems={getMentionItems}
            />
          </BlockNoteView>
        </div>

        <style>{`
          /* BlockNote Editor Custom Styles */
          .blocknote-editor {
            --bn-colors-editor-background: var(--color-bg, #ffffff);
            --bn-colors-editor-text: var(--color-text-primary, #111827);
            --bn-colors-menu-background: var(--color-bg-elevated, #ffffff);
            --bn-colors-menu-text: var(--color-text-primary, #111827);
            --bn-colors-tooltip-background: var(--color-bg-elevated-dark, #1e293b);
            --bn-colors-tooltip-text: var(--color-text-primary-dark, #f9fafb);
            --bn-colors-hovered-background: var(--color-bg-muted, #f3f4f6);
            --bn-colors-selected-background: rgba(37, 99, 235, 0.1);
            --bn-colors-disabled-background: var(--color-bg-muted, #f3f4f6);
            --bn-colors-disabled-text: var(--color-text-tertiary, #9ca3af);
            --bn-colors-side-menu: var(--color-text-tertiary, #9ca3af);
            --bn-border-radius: 8px;
            --bn-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .dark .blocknote-editor {
            --bn-colors-editor-background: var(--color-bg-dark, #0f172a);
            --bn-colors-editor-text: var(--color-text-primary-dark, #f9fafb);
            --bn-colors-menu-background: var(--color-bg-elevated-dark, #1e293b);
            --bn-colors-menu-text: var(--color-text-primary-dark, #f9fafb);
            --bn-colors-hovered-background: var(--color-bg-muted-dark, #334155);
            --bn-colors-selected-background: rgba(59, 130, 246, 0.2);
            --bn-colors-disabled-background: var(--color-bg-muted-dark, #334155);
            --bn-colors-disabled-text: var(--color-text-tertiary-dark, #64748b);
            --bn-colors-side-menu: var(--color-text-tertiary-dark, #64748b);
          }

          /* Block highlight animation for reference navigation */
          .highlight-block {
            animation: block-highlight 2s ease-out;
          }

          @keyframes block-highlight {
            0% {
              background-color: rgba(132, 0, 255, 0.3);
            }
            100% {
              background-color: transparent;
            }
          }

          /* Keyboard shortcut style */
          kbd {
            display: inline-block;
            padding: 2px 6px;
            font-size: 11px;
            line-height: 1.4;
            color: var(--color-text-primary, #111827);
            vertical-align: middle;
            background-color: var(--color-bg-muted, #f3f4f6);
            border: solid 1px var(--color-border, #e5e7eb);
            border-bottom-color: var(--color-border-strong, #d1d5db);
            border-radius: 3px;
            box-shadow: inset 0 -1px 0 var(--color-border-strong, #d1d5db);
          }

          .dark kbd {
            color: var(--color-text-primary-dark, #f9fafb);
            background-color: var(--color-bg-muted-dark, #334155);
            border-color: var(--color-border-dark, #334155);
          }

          /* Ensure editor takes full height */
          .blocknote-editor .bn-editor {
            height: 100%;
            min-height: 0;
          }

          .blocknote-editor [data-theming-css-variables-demo] {
            height: 100%;
          }

          /* Visual grouping for heading blocks with children */
          .blocknote-editor [data-content-type="heading"] {
            margin-top: 1.5em;
          }

          .blocknote-editor [data-content-type="heading"]:first-child {
            margin-top: 0;
          }

          /* Style nested blocks - create visual card effect */
          .blocknote-editor .bn-block-group {
            position: relative;
          }

          /* Add left border for nested content */
          .blocknote-editor .bn-block-group .bn-block-group {
            margin-left: 8px;
            padding-left: 16px;
            border-left: 2px solid var(--color-border, #e5e7eb);
          }

          .dark .blocknote-editor .bn-block-group .bn-block-group {
            border-left-color: var(--color-border-dark, #334155);
          }

          /* Heading block card style when it has children */
          .blocknote-editor [data-content-type="heading"] + .bn-block-group {
            background: var(--color-bg-muted, #f9fafb);
            border-radius: 0 0 8px 8px;
            padding: 8px;
            margin-bottom: 16px;
          }

          .dark .blocknote-editor [data-content-type="heading"] + .bn-block-group {
            background: var(--color-bg-muted-dark, #1e293b);
          }

          /* Heading with children gets a top border */
          .blocknote-editor [data-content-type="heading"]:has(+ .bn-block-group) {
            background: var(--color-bg-elevated, #ffffff);
            border: 1px solid var(--color-border, #e5e7eb);
            border-bottom: none;
            border-radius: 8px 8px 0 0;
            padding: 12px 16px;
            margin-bottom: 0;
          }

          .dark .blocknote-editor [data-content-type="heading"]:has(+ .bn-block-group) {
            background: var(--color-bg-elevated-dark, #1e293b);
            border-color: var(--color-border-dark, #334155);
          }

          /* Block spacing improvements */
          .blocknote-editor .bn-block-outer {
            margin: 4px 0;
          }

          /* Leaf block hover highlight */
          .blocknote-editor .bn-block-outer:not(:has(.bn-block-group)) {
            transition: background-color 0.15s ease;
          }

          .blocknote-editor .bn-block-outer:not(:has(.bn-block-group)):hover {
            background-color: rgba(132, 0, 255, 0.05);
            border-radius: 4px;
          }
        `}</style>
      </div>
    </MantineProvider>
  );
}

export type { BlockNoteEditorProps };
