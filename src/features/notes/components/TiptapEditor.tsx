import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useEditor, EditorContent, NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import type { EditorState } from 'prosemirror-state';
import { Undo, Redo, CheckCircle2, Circle } from 'lucide-react';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Mathematics from '@tiptap/extension-mathematics';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import { saveCompletedBlock, isBlockCompleted, deleteCompletedBlock, type CompletedBlock } from '../db/indexedDB';
import { NodeReference, createSuggestionRenderer, nodeReferenceStyles, removeInvalidReferences } from './NodeReferenceSuggestion';

/**
 * Generate a unique block ID
 */
function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Import syntax highlighting for common languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';

// Create lowlight instance and register languages
const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);
lowlight.register('java', java);
lowlight.register('cpp', cpp);
lowlight.register('css', css);
lowlight.register('html', html);
lowlight.register('json', json);
lowlight.register('bash', bash);
lowlight.register('sql', sql);

interface BlockInfo {
  indent: number;
  position: number;
}

/** Tree node information */
export interface BlockNode {
  id: string;
  parentId: string | null;
  indent: number;
  position: number;
  children: string[];
  references: string[]; // IDs of nodes this node references
}

/** Reference relationship */
export interface BlockReference {
  fromId: string; // Source node of the reference
  toId: string;   // Target node being referenced
}

/** Tree structure */
export interface BlockTree {
  nodes: Map<string, BlockNode>;
  rootIds: string[];
  references: BlockReference[]; // All reference relationships
}

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onBlockCreated?: (blockInfo: BlockInfo) => void;
  onTreeChange?: (tree: BlockTree) => void;
  noteId?: string; // Note ID for IndexedDB association
}

/**
 * EditableBlock NodeView Component
 */
function EditableBlockComponent(props: NodeViewProps) {
  const { node, editor } = props;
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const blockId = node.attrs.id;
  const indent = node.attrs.indent || 0;
  const parentId = node.attrs.parentId;

  // Check if block is completed
  useEffect(() => {
    const checkCompleted = async () => {
      if (blockId) {
        const completed = await isBlockCompleted(blockId);
        setIsCompleted(completed);
      }
    };
    checkCompleted();
  }, [blockId]);

  /**
   * Extract block text content and metadata
   */
  const extractBlockData = () => {
    // Get title (first h3)
    let title = '';
    const firstChild = node.firstChild;
    if (firstChild && firstChild.type.name === 'heading') {
      title = firstChild.textContent;
    }

    // Get full HTML content
    const fragment = node.content;
    let htmlContent = '';

    // Simple HTML serialization
    fragment.forEach((child) => {
      if (child.type.name === 'heading') {
        htmlContent += `<h3>${child.textContent}</h3>`;
      } else if (child.type.name === 'paragraph') {
        htmlContent += `<p>${child.textContent}</p>`;
      } else if (child.type.name === 'codeBlock') {
        htmlContent += `<pre><code>${child.textContent}</code></pre>`;
      } else {
        htmlContent += child.textContent;
      }
    });

    // Get plain text content
    const textContent = node.textContent;

    // Detect code blocks and math formulas
    let hasCode = false;
    const hasMath = false;
    node.descendants((n) => {
      if (n.type.name === 'codeBlock') hasCode = true;
    });

    // Character count (works for both English and CJK characters)
    const wordCount = textContent.replace(/\s+/g, '').length;

    return {
      title,
      content: htmlContent,
      textContent,
      metadata: {
        hasCode,
        hasMath,
        wordCount,
      },
    };
  };

  /**
   * Toggle completion status
   */
  const toggleComplete = async () => {
    setIsLoading(true);

    try {
      if (isCompleted) {
        // Uncomplete: delete from IndexedDB
        await deleteCompletedBlock(blockId);
        setIsCompleted(false);
      } else {
        // Mark as complete: save to IndexedDB
        const blockData = extractBlockData();

        // Get block position in document
        let position = 0;
        editor.state.doc.descendants((n, pos) => {
          if (n.attrs.id === blockId) {
            position = pos;
            return false;
          }
        });

        // Get noteId from editor props
        const attributes = editor.options.editorProps?.attributes;
        const noteId = typeof attributes === 'function'
          ? undefined
          : (attributes?.['data-note-id'] as string | undefined);

        // Check if this is a leaf node (has no children)
        let isLeaf = true;
        editor.state.doc.descendants((n) => {
          if (n.type.name === 'editable_block' && n.attrs.parentId === blockId) {
            isLeaf = false;
            return false; // Stop traversal after finding a child
          }
        });

        const completedBlock: CompletedBlock = {
          id: blockId,
          noteId,
          title: blockData.title,
          content: blockData.content,
          textContent: blockData.textContent,
          indent,
          parentId,
          position,
          completedAt: Date.now(),
          isLeaf,
          metadata: blockData.metadata,
        };

        await saveCompletedBlock(completedBlock);
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Failed to toggle block completion:', error);
      alert('Operation failed, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const style = {
    marginLeft: `${indent * 24}px`,
  };

  return (
    <NodeViewWrapper
      className={`editable-block ${isCompleted ? 'completed' : ''}`}
      style={style}
      data-editable-block="true"
    >
      <div className="editable-block-wrapper">
        <div className="editable-block-content">
          <NodeViewContent className="content" />
        </div>
        <button
          onClick={toggleComplete}
          disabled={isLoading}
          className="complete-button"
          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          contentEditable={false}
        >
          {isLoading ? (
            <div className="spinner" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
    </NodeViewWrapper>
  );
}

// Custom Document node - only allows blank_space and editable_block
const CustomDocument = Document.extend({
  content: '(blank_space | editable_block)+',
});

/**
 * Custom node: blank_space (empty placeholder area)
 */
const BlankSpace = Node.create({
  name: 'blank_space',
  group: 'block',
  content: '', // No content allowed
  defining: true,
  isolating: true,
  atom: true, // Atomic node - not editable

  addAttributes() {
    return {
      indent: { default: 0 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-blank]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const indent = HTMLAttributes.indent || 0;
    const style = `margin-left: ${indent * 24}px;`;
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-blank': 'true', style, class: 'blank-space' }),
    ];
  },
});

/**
 * Custom node: editable_block
 * First line must be h3 heading, other lines can be any content (except headings)
 */
const EditableBlock = Node.create({
  name: 'editable_block',
  group: 'block',
  content: 'heading block*', // First node must be heading, followed by any blocks
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      indent: { default: 0 },
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-block-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return { 'data-block-id': attributes.id };
        },
      },
      parentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-parent-id'),
        renderHTML: attributes => {
          if (!attributes.parentId) {
            return {};
          }
          return { 'data-parent-id': attributes.parentId };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-editable-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const indent = HTMLAttributes.indent || 0;
    const style = `margin-left: ${indent * 24}px;`;
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-editable-block': 'true', style, class: 'editable-block' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EditableBlockComponent);
  },
});

/**
 * Check if cursor is inside an editable_block
 */
const isInsideEditableBlock = (state: EditorState) => {
  const { $from } = state.selection;
  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d);
    if (node && node.type.name === 'editable_block') return true;
  }
  return false;
};

/**
 * Build tree structure from editor state
 */
function buildBlockTree(state: EditorState): BlockTree {
  const nodes = new Map<string, BlockNode>();
  const rootIds: string[] = [];
  const references: BlockReference[] = [];
  const blocksByPosition: Array<{ id: string; indent: number; position: number }> = [];

  // First pass: collect all block info and references
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'editable_block') {
      const id = node.attrs.id || generateId();
      const indent = node.attrs.indent || 0;
      const nodeReferences: string[] = [];

      // Traverse block internals to find nodeReference nodes
      node.descendants((child) => {
        if (child.type.name === 'nodeReference') {
          const refId = child.attrs.refId;
          if (refId) {
            nodeReferences.push(refId);
            references.push({ fromId: id, toId: refId });
          }
        }
      });

      blocksByPosition.push({ id, indent, position: pos });

      nodes.set(id, {
        id,
        parentId: null,
        indent,
        position: pos,
        children: [],
        references: nodeReferences,
      });
    }
  });

  // Second pass: determine parent-child relationships
  for (let i = 0; i < blocksByPosition.length; i++) {
    const current = blocksByPosition[i];
    const currentNode = nodes.get(current.id)!;

    if (current.indent === 0) {
      // Indent 0 means root node
      rootIds.push(current.id);
    } else {
      // Look up to find first node with smaller indent as parent
      let parentId: string | null = null;
      for (let j = i - 1; j >= 0; j--) {
        const candidate = blocksByPosition[j];
        if (candidate.indent < current.indent) {
          parentId = candidate.id;
          break;
        }
      }

      if (parentId) {
        currentNode.parentId = parentId;
        const parentNode = nodes.get(parentId);
        if (parentNode) {
          parentNode.children.push(current.id);
        }
      } else {
        // If no parent found, treat as root node
        rootIds.push(current.id);
      }
    }
  }

  return { nodes, rootIds, references };
}


/**
 * Find parent block ID based on position and indent
 */
function findParentBlockId(state: EditorState, currentPos: number, currentIndent: number): string | null {
  let parentId: string | null = null;

  state.doc.descendants((node, pos) => {
    if (node.type.name === 'editable_block' && pos < currentPos) {
      const nodeIndent = node.attrs.indent || 0;
      if (nodeIndent < currentIndent) {
        parentId = node.attrs.id || null;
      }
    }
  });

  return parentId;
}

/**
 * ProseMirror plugin for blank mode handling
 */
const blankModePlugin = (
  onBlockCreated?: (blockInfo: BlockInfo) => void,
  onTreeChange?: (tree: BlockTree) => void
) =>
  new Plugin({
    key: new PluginKey('blankMode'),

    // Clean up invalid content in the document
    appendTransaction(_transactions, _oldState, newState) {
      const tr = newState.tr;
      let modified = false;

      // Check direct children of document
      newState.doc.descendants((node, pos, parent) => {
        // Only check direct children of document
        if (parent !== newState.doc) return;

        // Delete if not blank_space or editable_block
        if (node.type.name !== 'blank_space' && node.type.name !== 'editable_block') {
          tr.delete(pos, pos + node.nodeSize);
          modified = true;
        }
      });

      // Check each editable_block
      newState.doc.descendants((node, pos) => {
        if (node.type.name === 'editable_block') {
          // Ensure first child is h3 heading
          const firstChild = node.firstChild;
          if (!firstChild || firstChild.type.name !== 'heading' || firstChild.attrs.level !== 3) {
            // If first node is not h3, create one
            const h3 = newState.schema.nodes.heading.create({ level: 3 });
            tr.insert(pos + 1, h3);
            modified = true;
          }

          // Ensure other children are not headings
          let childPos = pos + 1;
          node.forEach((child, _offset, index) => {
            if (index > 0 && child.type.name === 'heading') {
              // Convert heading to paragraph
              const paragraph = newState.schema.nodes.paragraph.create(
                null,
                child.content
              );
              tr.replaceWith(childPos, childPos + child.nodeSize, paragraph);
              modified = true;
            }
            childPos += child.nodeSize;
          });
        }
      });

      // Ensure document has at least one node
      if (tr.doc.childCount === 0) {
        const blank = newState.schema.nodes.blank_space.create();
        tr.insert(0, blank);
        modified = true;
      }

      return modified ? tr : null;
    },

    props: {
      handleTextInput(view) {
        const { state } = view;

        // Check if in allowed editing position
        if (!isInsideEditableBlock(state)) {
          return true; // Block input
        }

        return false;
      },

      handleDOMEvents: {
        // Intercept all input events
        beforeinput: (view, event) => {
          const { state } = view;

          if (!isInsideEditableBlock(state)) {
            event.preventDefault();
            return true;
          }
          return false;
        },

        // Intercept paste events
        paste: (view, event) => {
          const { state } = view;

          if (!isInsideEditableBlock(state)) {
            event.preventDefault();
            return true;
          }
          return false;
        },

        // Intercept IME composition events
        compositionstart: (view, event) => {
          const { state } = view;

          if (!isInsideEditableBlock(state)) {
            event.preventDefault();
            return true;
          }
          return false;
        },
      },

      handleKeyDown(view, event) {
        const { state, dispatch } = view;
        const { selection } = state;
        const { $from } = selection;

        // Check nodes before and after cursor
        const nodeBefore = $from.nodeBefore;
        const nodeAfter = $from.nodeAfter;
        const isBlankBefore = nodeBefore && nodeBefore.type.name === 'blank_space';
        const isBlankAfter = nodeAfter && nodeAfter.type.name === 'blank_space';

        // If cursor is next to blank_space, handle special keys
        if (isBlankBefore || isBlankAfter) {
          // Press '/' key: convert blank_space to editable_block
          if (event.key === '/') {
            event.preventDefault();

            let blankNode = null;
            let blankPos = -1;

            if (isBlankAfter) {
              blankNode = nodeAfter;
              blankPos = $from.pos;
            } else if (isBlankBefore) {
              blankNode = nodeBefore;
              blankPos = $from.pos - nodeBefore.nodeSize;
            }

            if (blankNode && blankPos >= 0) {
              const { schema } = state;
              const indent = blankNode.attrs.indent || 0;

              // Generate new block ID
              const newBlockId = generateId();
              const parentId = indent > 0 ? findParentBlockId(state, blankPos, indent) : null;

              // Create new editable_block with h3 heading
              const heading = schema.nodes.heading.create({ level: 3 });
              const editable = schema.nodes.editable_block.create(
                { indent, id: newBlockId, parentId },
                heading
              );

              // Replace blank_space with editable_block
              const tr = state.tr.replaceWith(blankPos, blankPos + blankNode.nodeSize, editable);

              // Move cursor into the new block's heading
              dispatch(tr.setSelection(TextSelection.create(tr.doc, blankPos + 2)));

              // Call callback
              onBlockCreated?.({ indent, position: blankPos });

              // Build and notify tree structure
              setTimeout(() => {
                const tree = buildBlockTree(view.state);
                onTreeChange?.(tree);
              }, 0);

              return true;
            }
          }

          // Press Tab key: convert blank_space to indented editable_block
          if (event.key === 'Tab') {
            event.preventDefault();

            let blankNode = null;
            let blankPos = -1;

            if (isBlankAfter) {
              blankNode = nodeAfter;
              blankPos = $from.pos;
            } else if (isBlankBefore) {
              blankNode = nodeBefore;
              blankPos = $from.pos - nodeBefore.nodeSize;
            }

            if (blankNode && blankPos >= 0) {
              const { schema } = state;
              const currentIndent = blankNode.attrs.indent || 0;
              const indent = currentIndent + 1;

              // Generate new block ID
              const newBlockId = generateId();
              const parentId = findParentBlockId(state, blankPos, indent);

              // Create indented editable_block with h3 heading
              const heading = schema.nodes.heading.create({ level: 3 });
              const editable = schema.nodes.editable_block.create(
                { indent, id: newBlockId, parentId },
                heading
              );

              // Replace blank_space with indented editable_block
              const tr = state.tr.replaceWith(blankPos, blankPos + blankNode.nodeSize, editable);

              // Move cursor into the new block's heading
              dispatch(tr.setSelection(TextSelection.create(tr.doc, blankPos + 2)));

              // Call callback
              onBlockCreated?.({ indent, position: blankPos });

              // Build and notify tree structure
              setTimeout(() => {
                const tree = buildBlockTree(view.state);
                onTreeChange?.(tree);
              }, 0);

              return true;
            }
          }
        }

        // Key handling inside editable_block
        if (isInsideEditableBlock(state)) {
          // Tab: increase indent
          if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();

            // Find editable_block containing cursor
            let editableDepth = -1;
            for (let d = $from.depth; d >= 0; d--) {
              const node = $from.node(d);
              if (node && node.type.name === 'editable_block') {
                editableDepth = d;
                break;
              }
            }

            if (editableDepth >= 0) {
              const editablePos = $from.before(editableDepth);
              const editableNode = $from.node(editableDepth);
              const currentIndent = editableNode.attrs.indent || 0;
              const newIndent = currentIndent + 1;

              const tr = state.tr.setNodeMarkup(editablePos, undefined, {
                ...editableNode.attrs,
                indent: newIndent,
              });
              dispatch(tr);
              return true;
            }
          }

          // Shift+Tab: decrease indent
          if (event.key === 'Tab' && event.shiftKey) {
            event.preventDefault();

            // Find editable_block containing cursor
            let editableDepth = -1;
            for (let d = $from.depth; d >= 0; d--) {
              const node = $from.node(d);
              if (node && node.type.name === 'editable_block') {
                editableDepth = d;
                break;
              }
            }

            if (editableDepth >= 0) {
              const editablePos = $from.before(editableDepth);
              const editableNode = $from.node(editableDepth);
              const currentIndent = editableNode.attrs.indent || 0;
              const newIndent = Math.max(0, currentIndent - 1);

              const tr = state.tr.setNodeMarkup(editablePos, undefined, {
                ...editableNode.attrs,
                indent: newIndent,
              });
              dispatch(tr);
              return true;
            }
          }

          // Shift+Enter: exit block to new blank_space
          if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault();

            // Find editable_block containing cursor
            let editableDepth = -1;
            for (let d = $from.depth; d >= 0; d--) {
              const node = $from.node(d);
              if (node && node.type.name === 'editable_block') {
                editableDepth = d;
                break;
              }
            }

            if (editableDepth >= 0) {
              const editablePos = $from.before(editableDepth);
              const editableNode = $from.node(editableDepth);
              const insertPos = editablePos + editableNode.nodeSize;

              // Insert new blank_space after editable_block
              const blank = state.schema.nodes.blank_space.create();
              const tr = state.tr.insert(insertPos, blank);

              // Move cursor to new blank_space
              dispatch(tr.setSelection(TextSelection.create(tr.doc, insertPos + 1)));
              return true;
            }
          }
        }

        return false;
      },
    },
  });

export function TiptapEditor({ content = '', onChange, onBlockCreated, onTreeChange, noteId }: TiptapEditorProps) {
  const treeChangeRef = useRef(onTreeChange);
  const editorRef = useRef<Editor | null>(null);

  // Debounce timer for invalid reference detection
  const invalidRefCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemovingInvalidRefs = useRef(false);

  // Keep ref up to date
  useEffect(() => {
    treeChangeRef.current = onTreeChange;
  }, [onTreeChange]);

  /**
   * Get current block ID at cursor position
   */
  const getCurrentBlockId = useCallback((): string | null => {
    if (!editorRef.current) return null;
    const { state } = editorRef.current;
    const { $from } = state.selection;

    for (let d = $from.depth; d >= 0; d--) {
      const node = $from.node(d);
      if (node && node.type.name === 'editable_block') {
        return node.attrs.id || null;
      }
    }
    return null;
  }, []);

  /**
   * Check if current block is a leaf node (has no children)
   * Leaf node definition: no other block has this block as parent (based on indent level)
   */
  const isCurrentBlockLeaf = useCallback((): boolean => {
    if (!editorRef.current) return false;
    const currentBlockId = getCurrentBlockId();
    if (!currentBlockId) return false;

    const { state } = editorRef.current;

    // Collect all block info
    const blocks: Array<{ id: string; indent: number; position: number }> = [];
    let currentBlockIndex = -1;
    let currentBlockIndent = 0;

    state.doc.descendants((node, pos) => {
      if (node.type.name === 'editable_block') {
        const id = node.attrs.id;
        const indent = node.attrs.indent || 0;

        if (id === currentBlockId) {
          currentBlockIndex = blocks.length;
          currentBlockIndent = indent;
        }

        blocks.push({ id, indent, position: pos });
      }
    });

    if (currentBlockIndex === -1) return false;

    // Check if next block is a child of current block
    // If next block's indent > current block's indent, current block is not a leaf
    const nextBlock = blocks[currentBlockIndex + 1];
    const isLeaf = !nextBlock || nextBlock.indent <= currentBlockIndent;

    return isLeaf;
  }, [getCurrentBlockId]);

  // Create suggestion renderer
  const suggestionRenderer = useMemo(
    () => createSuggestionRenderer(),
    []
  );

  const editor = useEditor({
    extensions: [
      CustomDocument,
      StarterKit.configure({
        // Disable default hard break, document, heading and code block (we use custom ones)
        hardBreak: false,
        document: false,
        heading: false,
        codeBlock: false,
      }),
      Heading.configure({
        levels: [3], // Only allow h3 headings
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },
      }),
      BlankSpace,
      EditableBlock,
      // NodeReference extension - type @ to trigger reference selection
      NodeReference.configure({
        getCurrentBlockId,
        isCurrentBlockLeaf,
        suggestion: {
          char: '@',
          allowSpaces: false,
          render: () => suggestionRenderer,
          command: ({ editor, range, props }) => {
            // Delete trigger character and insert nodeReference node
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent({
                type: 'nodeReference',
                attrs: {
                  refId: props.id,
                  refTitle: props.title,
                },
              })
              .run();

            // Update tree structure
            setTimeout(() => {
              const tree = buildBlockTree(editor.state);
              treeChangeRef.current?.(tree);
            }, 0);
          },
        },
      }),
    ],
    content: content || '<div data-blank></div>',
    onCreate: ({ editor }) => {
      editorRef.current = editor;
      editor.registerPlugin(blankModePlugin(onBlockCreated, (tree) => treeChangeRef.current?.(tree)));
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());

      // Detect and remove invalid references (references to non-leaf nodes)
      // Use debounce to avoid frequent detection
      if (invalidRefCheckTimer.current) {
        clearTimeout(invalidRefCheckTimer.current);
      }
      invalidRefCheckTimer.current = setTimeout(() => {
        if (!isRemovingInvalidRefs.current) {
          isRemovingInvalidRefs.current = true;
          const removedCount = removeInvalidReferences(editor);
          if (removedCount > 0) {
            // After removing references, rebuild tree and notify update
            const tree = buildBlockTree(editor.state);
            treeChangeRef.current?.(tree);
          }
          // Delay resetting flag to prevent delete operation triggering another detection
          setTimeout(() => {
            isRemovingInvalidRefs.current = false;
          }, 50);
        }
      }, 300);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[400px] p-4',
        'data-note-id': noteId || '',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const doc = editor.state.doc;
    if (doc.childCount === 0) {
      editor.commands.insertContent({ type: 'blank_space' });
    }
  }, [editor]);

  const insertBlock = useCallback(() => {
    if (!editor) return;
    const { state } = editor;
    let found = false;

    state.doc.descendants((n, pos) => {
      if (!found && n.type.name === 'blank_space') {
        const heading = state.schema.nodes.heading.create({ level: 3 });
        const indent = n.attrs.indent || 0;
        const newBlockId = generateId();
        const parentId = indent > 0 ? findParentBlockId(state, pos, indent) : null;
        const editable = state.schema.nodes.editable_block.create(
          { indent, id: newBlockId, parentId },
          heading
        );
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.replaceWith(pos, pos + n.nodeSize, editable);
            tr.setSelection(TextSelection.create(tr.doc, pos + 2));
            editor.view.dispatch(tr);
            return true;
          })
          .run();

        // Call callback
        onBlockCreated?.({ indent, position: pos });

        // Build and notify tree structure
        setTimeout(() => {
          const tree = buildBlockTree(editor.state);
          treeChangeRef.current?.(tree);
        }, 0);

        found = true;
      }
    });

    if (!found) {
      const currentPos = state.doc.content.size;
      const newBlockId = generateId();
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'editable_block',
          attrs: { indent: 0, id: newBlockId, parentId: null },
          content: [{ type: 'heading', attrs: { level: 3 } }],
        })
        .run();

      // Call callback
      onBlockCreated?.({ indent: 0, position: currentPos });

      // Build and notify tree structure
      setTimeout(() => {
        const tree = buildBlockTree(editor.state);
        treeChangeRef.current?.(tree);
      }, 0);
    }
  }, [editor, onBlockCreated]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    children,
    title,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="p-2 rounded hover:bg-bg-muted dark:hover:bg-bg-muted-dark transition-colors text-text-secondary dark:text-text-secondary-dark"
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full h-full bg-transparent overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-border dark:border-border-dark bg-bg-muted dark:bg-bg-elevated-dark">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="w-5 h-5" />
        </ToolbarButton>

        <ToolbarButton onClick={insertBlock} title="Insert Block">
          <span className="text-sm font-semibold">Insert Block</span>
        </ToolbarButton>

        <div className="ml-auto self-center text-xs text-text-tertiary dark:text-text-tertiary-dark">
          Tip: Press <kbd className="px-1 py-0.5 bg-bg-elevated dark:bg-bg-muted-dark rounded text-xs">/</kbd> to create block,
          <kbd className="px-1 py-0.5 bg-bg-elevated dark:bg-bg-muted-dark rounded text-xs ml-1">Tab</kbd> for indent |
          In block: <kbd className="px-1 py-0.5 bg-bg-elevated dark:bg-bg-muted-dark rounded text-xs ml-1">Tab</kbd> indent,
          <kbd className="px-1 py-0.5 bg-bg-elevated dark:bg-bg-muted-dark rounded text-xs ml-1">Shift+Tab</kbd> outdent,
          <kbd className="px-1 py-0.5 bg-bg-elevated dark:bg-bg-muted-dark rounded text-xs ml-1">Shift+Enter</kbd> exit
        </div>
      </div>

      {/* Editor Content */}
      <div className="tiptap-editor-content h-full">
        <EditorContent editor={editor} />
      </div>

      <style>{`
        /* ========================================
         * TipTap Editor - Dark Mode Ready Styles
         * ======================================== */

        /* Base editor styles */
        .tiptap-editor-content .ProseMirror {
          min-height: 400px;
          padding: 1rem;
          outline: none;
          color: var(--color-text-primary, #111827);
        }

        @media (prefers-color-scheme: dark) {
          .tiptap-editor-content .ProseMirror {
            color: var(--color-text-primary-dark, #f9fafb);
          }
        }

        .dark .tiptap-editor-content .ProseMirror {
          color: var(--color-text-primary-dark, #f9fafb);
        }

        /* Blank space placeholder */
        .blank-space {
          color: var(--color-text-tertiary, #9ca3af);
          min-height: 32px;
          display: block;
          cursor: text;
          border-radius: 4px;
          transition: background-color 0.2s;
          padding: 4px 8px;
        }

        .blank-space:hover {
          background-color: rgba(37, 99, 235, 0.1);
        }

        .dark .blank-space:hover {
          background-color: rgba(59, 130, 246, 0.15);
        }

        .blank-space:empty::before {
          content: '— Blank — (Press / to create block, Tab for indent)';
          opacity: 0.5;
          font-style: italic;
          font-size: 0.9em;
          pointer-events: none;
        }

        /* Editable block */
        .editable-block {
          position: relative;
          padding: 8px 12px;
          border-radius: 6px;
          margin: 6px 0;
          background: var(--color-bg-muted, #f3f4f6);
          border-left: 3px solid var(--color-primary, #2563eb);
          transition: all 0.2s;
          color: var(--color-text-primary, #111827);
        }

        @media (prefers-color-scheme: dark) {
          .editable-block {
            background: var(--color-bg-muted-dark, #334155);
            color: var(--color-text-primary-dark, #f9fafb);
          }
        }

        .dark .editable-block {
          background: var(--color-bg-muted-dark, #334155);
          color: var(--color-text-primary-dark, #f9fafb);
        }

        .editable-block:hover {
          background: rgba(37, 99, 235, 0.1);
          border-left-color: var(--color-primary-hover, #1d4ed8);
        }

        .dark .editable-block:hover {
          background: rgba(59, 130, 246, 0.15);
          border-left-color: var(--color-primary-light, #3b82f6);
        }

        .editable-block.completed {
          background: rgba(34, 197, 94, 0.1);
          border-left-color: var(--color-success, #22c55e);
        }

        .dark .editable-block.completed {
          background: rgba(34, 197, 94, 0.15);
        }

        /* Block wrapper layout */
        .editable-block-wrapper {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .editable-block-content {
          flex: 1;
          min-width: 0;
        }

        /* Complete button */
        .complete-button {
          position: sticky;
          top: 8px;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          opacity: 0.6;
        }

        .complete-button:hover {
          opacity: 1;
          background: rgba(0, 0, 0, 0.05);
        }

        .dark .complete-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .complete-button:disabled {
          cursor: not-allowed;
          opacity: 0.4;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--color-border, #e5e7eb);
          border-top-color: var(--color-warning, #f59e0b);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Typography in editor */
        .tiptap-editor-content .ProseMirror h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.5em 0;
          color: var(--color-text-primary, #111827);
        }

        @media (prefers-color-scheme: dark) {
          .tiptap-editor-content .ProseMirror h3 {
            color: var(--color-text-primary-dark, #f9fafb);
          }
        }

        .dark .tiptap-editor-content .ProseMirror h3 {
          color: var(--color-text-primary-dark, #f9fafb);
        }

        .tiptap-editor-content .ProseMirror ul,
        .tiptap-editor-content .ProseMirror ol {
          padding-left: 2rem;
          margin: 1rem 0;
        }

        .tiptap-editor-content .ProseMirror ul {
          list-style-type: disc;
        }

        .tiptap-editor-content .ProseMirror ol {
          list-style-type: decimal;
        }

        .tiptap-editor-content .ProseMirror li {
          margin: 0.25rem 0;
        }

        .tiptap-editor-content .ProseMirror p {
          margin: 0.5rem 0;
        }

        .tiptap-editor-content .ProseMirror strong {
          font-weight: bold;
        }

        .tiptap-editor-content .ProseMirror em {
          font-style: italic;
        }

        /* Inline code */
        .tiptap-editor-content .ProseMirror code {
          background-color: var(--color-bg-muted, #f3f4f6);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9em;
          color: #d63384;
        }

        .dark .tiptap-editor-content .ProseMirror code {
          background-color: var(--color-bg-muted-dark, #334155);
          color: #f472b6;
        }

        /* Code block */
        .tiptap-editor-content .ProseMirror pre {
          background: #0d1117;
          color: #c9d1d9;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', Courier, monospace;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
          line-height: 1.5;
          font-size: 0.9em;
        }

        .tiptap-editor-content .ProseMirror pre code {
          background: none;
          color: inherit;
          padding: 0;
          border-radius: 0;
          font-size: inherit;
        }

        /* Syntax highlighting */
        .tiptap-editor-content .ProseMirror pre .hljs-comment,
        .tiptap-editor-content .ProseMirror pre .hljs-quote {
          color: #8b949e;
          font-style: italic;
        }

        .tiptap-editor-content .ProseMirror pre .hljs-keyword,
        .tiptap-editor-content .ProseMirror pre .hljs-selector-tag {
          color: #ff7b72;
        }

        .tiptap-editor-content .ProseMirror pre .hljs-string {
          color: #a5d6ff;
        }

        .tiptap-editor-content .ProseMirror pre .hljs-number {
          color: #79c0ff;
        }

        .tiptap-editor-content .ProseMirror pre .hljs-function {
          color: #d2a8ff;
        }

        /* Math formulas */
        .tiptap-editor-content .ProseMirror .math-inline,
        .tiptap-editor-content .ProseMirror .math-display {
          font-size: 1em;
        }

        .tiptap-editor-content .ProseMirror .math-display {
          display: block;
          margin: 1rem 0;
          text-align: center;
          overflow-x: auto;
        }

        .tiptap-editor-content .ProseMirror .katex {
          font-size: 1.1em;
        }

        .tiptap-editor-content .ProseMirror .katex-display {
          margin: 1rem 0;
        }

        /* Keyboard shortcuts display */
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
          border-bottom-color: var(--color-border-strong-dark, #475569);
          box-shadow: inset 0 -1px 0 var(--color-border-strong-dark, #475569);
        }

        ${nodeReferenceStyles}
      `}</style>
    </div>
  );
}
