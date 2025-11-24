import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Node, mergeAttributes } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import { PluginKey } from 'prosemirror-state';
import tippy from 'tippy.js';
import type { Instance } from 'tippy.js';
import { Link2 } from 'lucide-react';

// ===========================================
// Types
// ===========================================

/** Block information retrieved from editor state */
export interface EditorBlock {
  id: string;
  title: string;
  textContent: string;
  indent: number;
  isLeaf: boolean;
}

/** Invalid reference information */
export interface InvalidReference {
  blockId: string; // Block ID containing the reference
  refId: string; // Referenced node ID
  refTitle: string; // Referenced node title
  position: number; // Position in the document
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Get all leaf node IDs from the editor
 */
function getLeafNodeIds(editor: Editor): Set<string> {
  const blocks: Array<{ id: string; indent: number }> = [];

  editor.state.doc.descendants((node) => {
    if (node.type.name === 'editable_block') {
      blocks.push({
        id: node.attrs.id,
        indent: node.attrs.indent || 0,
      });
    }
  });

  const leafIds = new Set<string>();

  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];
    const nextBlock = blocks[i + 1];
    const isLeaf = !nextBlock || nextBlock.indent <= current.indent;

    if (isLeaf) {
      leafIds.add(current.id);
    }
  }

  return leafIds;
}

/**
 * Find all invalid references (references to non-leaf nodes)
 */
export function findInvalidReferences(editor: Editor): InvalidReference[] {
  const leafIds = getLeafNodeIds(editor);
  const invalidRefs: InvalidReference[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'editable_block') {
      const blockId = node.attrs.id;

      // Traverse block internals to find references
      node.descendants((child, childPos) => {
        if (child.type.name === 'nodeReference') {
          const refId = child.attrs.refId;
          const refTitle = child.attrs.refTitle;

          // If referenced node is not a leaf, it's an invalid reference
          if (refId && !leafIds.has(refId)) {
            invalidRefs.push({
              blockId,
              refId,
              refTitle: refTitle || 'Unknown',
              position: pos + childPos + 1,
            });
          }
        }
      });
    }
  });

  return invalidRefs;
}

/**
 * Remove all invalid references from the editor
 */
export function removeInvalidReferences(editor: Editor): number {
  const invalidRefs = findInvalidReferences(editor);

  if (invalidRefs.length === 0) {
    return 0;
  }

  // Delete from back to front to avoid position offset issues
  const sortedRefs = [...invalidRefs].sort((a, b) => b.position - a.position);

  editor.chain().focus();

  for (const ref of sortedRefs) {
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'nodeReference' && node.attrs.refId === ref.refId) {
        if (Math.abs(pos - ref.position) < 10) {
          editor.chain().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
          return false;
        }
      }
    });
  }

  return invalidRefs.length;
}

/**
 * Get existing reference IDs in a specific block
 */
function getExistingReferencesInBlock(editor: Editor, blockId: string): string[] {
  const references: string[] = [];

  editor.state.doc.descendants((node) => {
    if (node.type.name === 'editable_block' && node.attrs.id === blockId) {
      node.descendants((child) => {
        if (child.type.name === 'nodeReference') {
          const refId = child.attrs.refId;
          if (refId) {
            references.push(refId);
          }
        }
      });
      return false;
    }
  });

  return references;
}

/**
 * Get all leaf blocks from editor (excluding specified block and already referenced nodes)
 */
export function getLeafBlocksFromEditor(editor: Editor, excludeId: string): EditorBlock[] {
  const blocks: Array<{ id: string; title: string; textContent: string; indent: number; position: number }> = [];

  // Get existing references in current block
  const existingRefs = getExistingReferencesInBlock(editor, excludeId);

  // Traverse document to get all editable_blocks
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'editable_block') {
      const id = node.attrs.id;
      const indent = node.attrs.indent || 0;

      // Get title (first heading)
      let title = '';
      const firstChild = node.firstChild;
      if (firstChild && firstChild.type.name === 'heading') {
        title = firstChild.textContent || '';
      }

      const textContent = node.textContent || '';

      blocks.push({ id, title, textContent, indent, position: pos });
    }
  });

  // Determine which blocks are leaf nodes
  const result: EditorBlock[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];

    // Exclude current editing block
    if (current.id === excludeId) continue;

    // Exclude already referenced nodes
    if (existingRefs.includes(current.id)) continue;

    // Check if next block is a child of current block
    const nextBlock = blocks[i + 1];
    const isLeaf = !nextBlock || nextBlock.indent <= current.indent;

    if (isLeaf) {
      result.push({
        id: current.id,
        title: current.title || 'Untitled',
        textContent: current.textContent,
        indent: current.indent,
        isLeaf: true,
      });
    }
  }

  return result;
}

/**
 * Get current block ID from editor selection
 */
function getBlockIdFromEditor(editor: Editor): string | null {
  const { state } = editor;
  const { $from } = state.selection;

  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d);
    if (node && node.type.name === 'editable_block') {
      return node.attrs.id || null;
    }
  }
  return null;
}

// ===========================================
// NodeReference Component
// ===========================================

function NodeReferenceComponent({ node }: NodeViewProps) {
  const { refId, refTitle } = node.attrs;

  return (
    <NodeViewWrapper as="span" className="node-reference-wrapper">
      <span
        className="node-reference"
        data-ref-id={refId}
        title={`Reference: ${refTitle}`}
        contentEditable={false}
      >
        <Link2 className="w-3 h-3 inline mr-1" />
        {refTitle || 'Unknown Reference'}
      </span>
    </NodeViewWrapper>
  );
}

// ===========================================
// NodeReference TipTap Extension
// ===========================================

export interface NodeReferenceOptions {
  suggestion: Partial<SuggestionOptions>;
  getCurrentBlockId: () => string | null;
  isCurrentBlockLeaf: () => boolean;
}

export const NodeReference = Node.create<NodeReferenceOptions>({
  name: 'nodeReference',

  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addOptions() {
    return {
      suggestion: {
        char: '@',
        allowSpaces: false,
        startOfLine: false,
      },
      getCurrentBlockId: () => null,
      isCurrentBlockLeaf: () => false,
    };
  },

  addAttributes() {
    return {
      refId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-ref-id'),
        renderHTML: (attributes) => {
          if (!attributes.refId) return {};
          return { 'data-ref-id': attributes.refId };
        },
      },
      refTitle: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-ref-title'),
        renderHTML: (attributes) => {
          if (!attributes.refTitle) return {};
          return { 'data-ref-title': attributes.refTitle };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-node-reference]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-node-reference': 'true',
        class: 'node-reference',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NodeReferenceComponent);
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const editor = this.editor;

    const getBlockIdFromEditorInternal = (): string | null => {
      if (!editor) return null;
      const { state } = editor;
      const { $from } = state.selection;

      for (let d = $from.depth; d >= 0; d--) {
        const node = $from.node(d);
        if (node && node.type.name === 'editable_block') {
          return node.attrs.id || null;
        }
      }
      return null;
    };

    const suggestionPlugin = Suggestion({
      editor: editor,
      char: '@',
      allowSpaces: false,
      startOfLine: false,
      pluginKey: new PluginKey('nodeReferenceSuggestion'),
      items: ({ query }) => {
        const blockId = getBlockIdFromEditorInternal();

        if (!blockId) {
          return [];
        }

        // Allow @ reference in any block
        return [{ id: '__trigger__', query }];
      },
      render: options.suggestion?.render,
      command: options.suggestion?.command,
    });

    return [suggestionPlugin];
  },
});

// ===========================================
// Suggestion List Component
// ===========================================

export interface SuggestionListProps {
  items: EditorBlock[];
  command: (item: EditorBlock) => void;
  query: string;
}

export interface SuggestionListRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export const SuggestionList = forwardRef<SuggestionListRef, SuggestionListProps>(
  ({ items, command, query }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredItems = items.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
      setSelectedIndex(0);
    }, [items, query]);

    const selectItem = useCallback(
      (index: number) => {
        const item = filteredItems[index];
        if (item) {
          command(item);
        }
      },
      [filteredItems, command]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
          return true;
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
          return true;
        }

        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }

        if (event.key === 'Escape') {
          return true;
        }

        return false;
      },
    }), [filteredItems.length, selectItem, selectedIndex]);

    if (filteredItems.length === 0) {
      return (
        <div className="node-reference-dropdown">
          <div className="node-reference-empty">
            {query ? `No nodes found for "${query}"` : 'No leaf nodes available to reference'}
          </div>
        </div>
      );
    }

    return (
      <div className="node-reference-dropdown">
        <div className="node-reference-header">
          <Link2 className="w-4 h-4" />
          <span>Select node to reference</span>
        </div>
        <div className="node-reference-list">
          {filteredItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`node-reference-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="node-reference-item-title">{item.title || 'Untitled'}</span>
              <span className="node-reference-item-preview">
                {item.textContent?.slice(0, 50)}...
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
);

SuggestionList.displayName = 'SuggestionList';

// ===========================================
// Suggestion Renderer Factory
// ===========================================

export function createSuggestionRenderer() {
  let component: { ref: SuggestionListRef | null; items: EditorBlock[]; root: Root | null } | null = null;
  let popup: Instance[] | null = null;

  return {
    onStart: (props: SuggestionProps) => {
      const editor = props.editor;
      const currentBlockId = getBlockIdFromEditor(editor);

      let items: EditorBlock[] = [];

      if (currentBlockId) {
        items = getLeafBlocksFromEditor(editor, currentBlockId);
      }

      const element = document.createElement('div');
      element.className = 'node-reference-popup-container';

      const root = createRoot(element);

      component = {
        ref: null,
        items,
        root,
      };

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect as () => DOMRect,
        appendTo: () => document.body,
        content: element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        arrow: false,
        offset: [0, 8],
      });

      root.render(
        <SuggestionList
          items={component.items}
          command={props.command}
          query={props.query}
          ref={(r) => {
            if (component) component.ref = r;
          }}
        />
      );
    },

    onUpdate: (props: SuggestionProps) => {
      if (!component || !popup || !component.root) return;

      const editor = props.editor;
      const currentBlockId = getBlockIdFromEditor(editor);
      if (currentBlockId) {
        component.items = getLeafBlocksFromEditor(editor, currentBlockId);
      }

      component.root.render(
        <SuggestionList
          items={component.items}
          command={props.command}
          query={props.query}
          ref={(r) => {
            if (component) component.ref = r;
          }}
        />
      );

      popup[0]?.setProps({
        getReferenceClientRect: props.clientRect as () => DOMRect,
      });
    },

    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === 'Escape') {
        popup?.[0]?.hide();
        return true;
      }

      return component?.ref?.onKeyDown(props.event) ?? false;
    },

    onExit: () => {
      component?.root?.unmount();
      popup?.[0]?.destroy();
      popup = null;
      component = null;
    },
  };
}

// ===========================================
// Styles
// ===========================================

export const nodeReferenceStyles = `
  /* Node Reference inline styles */
  .node-reference-wrapper {
    display: inline;
  }

  .node-reference {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    margin: 0 2px;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    color: white;
    border-radius: 4px;
    font-size: 0.85em;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    vertical-align: baseline;
  }

  .node-reference:hover {
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
  }

  .dark .node-reference {
    background: linear-gradient(135deg, #a78bfa 0%, #818cf8 100%);
    color: #1e1b4b;
  }

  .dark .node-reference:hover {
    background: linear-gradient(135deg, #c4b5fd 0%, #a5b4fc 100%);
  }

  /* Dropdown styles */
  .node-reference-popup-container {
    width: 300px;
    max-height: 300px;
    overflow: hidden;
  }

  .node-reference-dropdown {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  .dark .node-reference-dropdown {
    background: #1e293b;
    border-color: #334155;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }

  .node-reference-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.8em;
    font-weight: 600;
    color: #6b7280;
  }

  .dark .node-reference-header {
    background: #0f172a;
    border-color: #334155;
    color: #9ca3af;
  }

  .node-reference-list {
    max-height: 240px;
    overflow-y: auto;
  }

  .node-reference-item {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 10px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
  }

  .node-reference-item:hover,
  .node-reference-item.selected {
    background: #f3f4f6;
  }

  .dark .node-reference-item:hover,
  .dark .node-reference-item.selected {
    background: #334155;
  }

  .node-reference-item-title {
    font-size: 0.9em;
    font-weight: 600;
    color: #111827;
  }

  .dark .node-reference-item-title {
    color: #f9fafb;
  }

  .node-reference-item-preview {
    font-size: 0.75em;
    color: #6b7280;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  .dark .node-reference-item-preview {
    color: #9ca3af;
  }

  .node-reference-empty {
    padding: 20px;
    text-align: center;
    font-size: 0.85em;
    color: #6b7280;
  }

  .dark .node-reference-empty {
    color: #9ca3af;
  }

  /* Tippy style overrides */
  .tippy-box {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  .tippy-content {
    padding: 0 !important;
  }
`;
