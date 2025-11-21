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

// UUID 生成函数
function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// 导入常用语言的语法支持
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

// 创建 lowlight 实例并注册语言
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

// 树节点信息
export interface BlockNode {
  id: string;
  parentId: string | null;
  indent: number;
  position: number;
  children: string[];
  references: string[]; // 该节点引用的其他节点 ID
}

// Reference 关系
export interface BlockReference {
  fromId: string; // 引用来源节点
  toId: string;   // 被引用节点
}

// 树状结构
export interface BlockTree {
  nodes: Map<string, BlockNode>;
  rootIds: string[];
  references: BlockReference[]; // 所有引用关系
}

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onBlockCreated?: (blockInfo: BlockInfo) => void;
  onTreeChange?: (tree: BlockTree) => void;
  noteId?: string; // 笔记 ID，用于关联到 IndexedDB
}

// EditableBlock NodeView 组件
function EditableBlockComponent(props: NodeViewProps) {
  const { node, editor } = props;
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const blockId = node.attrs.id;
  const indent = node.attrs.indent || 0;
  const parentId = node.attrs.parentId;

  // 检查 block 是否已完成
  useEffect(() => {
    const checkCompleted = async () => {
      if (blockId) {
        const completed = await isBlockCompleted(blockId);
        setIsCompleted(completed);
      }
    };
    checkCompleted();
  }, [blockId]);

  // 提取 block 的文本内容和元数据
  const extractBlockData = () => {
    // 获取标题 (第一个 h3)
    let title = '';
    const firstChild = node.firstChild;
    if (firstChild && firstChild.type.name === 'heading') {
      title = firstChild.textContent;
    }

    // 获取完整的 HTML 内容
    const fragment = node.content;
    let htmlContent = '';

    // 简单的 HTML 序列化
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

    // 获取纯文本内容
    const textContent = node.textContent;

    // 检测是否包含代码块和数学公式
    let hasCode = false;
    const hasMath = false;
    node.descendants((n) => {
      if (n.type.name === 'codeBlock') hasCode = true;
      // 如果有数学扩展，可以检测 math 节点
    });

    const wordCount = textContent.replace(/\s+/g, '').length; // 中文字数

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

  // 切换完成状态
  const toggleComplete = async () => {
    setIsLoading(true);

    try {
      if (isCompleted) {
        // 取消完成：从 IndexedDB 删除
        await deleteCompletedBlock(blockId);
        setIsCompleted(false);
      } else {
        // 标记为完成：保存到 IndexedDB
        const blockData = extractBlockData();

        // 获取 block 在文档中的位置
        let position = 0;
        editor.state.doc.descendants((n, pos) => {
          if (n.attrs.id === blockId) {
            position = pos;
            return false;
          }
        });

        // 从 editor props 中获取 noteId
        const attributes = editor.options.editorProps?.attributes;
        const noteId = typeof attributes === 'function'
          ? undefined
          : (attributes?.['data-note-id'] as string | undefined);

        // 计算是否是叶子节点 (没有子节点)
        let isLeaf = true;
        editor.state.doc.descendants((n) => {
          if (n.type.name === 'editable_block' && n.attrs.parentId === blockId) {
            isLeaf = false;
            return false; // 找到子节点后停止遍历
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
      alert('操作失败，请重试');
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
          title={isCompleted ? '标记为未完成' : '标记为完成'}
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

// 自定义 Document 节点，只允许 blank_space 和 editable_block
const CustomDocument = Document.extend({
  content: '(blank_space | editable_block)+',
});

// 自定义节点：blank_space（空白区域）
const BlankSpace = Node.create({
  name: 'blank_space',
  group: 'block',
  content: '', // 不允许任何内容
  defining: true,
  isolating: true,
  atom: true, // 使其成为原子节点，不可编辑

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

// 自定义节点：editable_block（可编辑块）
// 第一行必须是 h3 标题，其他行可以是任意内容（除了标题）
const EditableBlock = Node.create({
  name: 'editable_block',
  group: 'block',
  content: 'heading block*', // 第一个节点必须是 heading，后面可以有任意 block
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

// 检查光标是否在 editable_block 内
const isInsideEditableBlock = (state: EditorState) => {
  const { $from } = state.selection;
  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d);
    if (node && node.type.name === 'editable_block') return true;
  }
  return false;
};

// 构建树状结构
function buildBlockTree(state: EditorState): BlockTree {
  const nodes = new Map<string, BlockNode>();
  const rootIds: string[] = [];
  const references: BlockReference[] = [];
  const blocksByPosition: Array<{ id: string; indent: number; position: number }> = [];

  // 第一遍：收集所有块的信息和 references
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'editable_block') {
      const id = node.attrs.id || generateId();
      const indent = node.attrs.indent || 0;
      const nodeReferences: string[] = [];

      // 遍历 block 内部查找 nodeReference 节点
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

  // 第二遍：确定父子关系
  for (let i = 0; i < blocksByPosition.length; i++) {
    const current = blocksByPosition[i];
    const currentNode = nodes.get(current.id)!;

    if (current.indent === 0) {
      // indent 为 0 的是根节点
      rootIds.push(current.id);
    } else {
      // 向上查找第一个 indent 比当前小的节点作为父节点
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
        // 如果没有找到父节点，也算作根节点
        rootIds.push(current.id);
      }
    }
  }

  return { nodes, rootIds, references };
}


// 查找父块 ID
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

// ProseMirror 插件
const blankModePlugin = (
  onBlockCreated?: (blockInfo: BlockInfo) => void,
  onTreeChange?: (tree: BlockTree) => void
) =>
  new Plugin({
    key: new PluginKey('blankMode'),

    // 清理文档中的非法内容
    appendTransaction(_transactions, _oldState, newState) {
      const tr = newState.tr;
      let modified = false;

      // 检查文档的直接子节点
      newState.doc.descendants((node, pos, parent) => {
        // 只检查文档的直接子节点
        if (parent !== newState.doc) return;

        // 如果不是 blank_space 或 editable_block，删除它
        if (node.type.name !== 'blank_space' && node.type.name !== 'editable_block') {
          tr.delete(pos, pos + node.nodeSize);
          modified = true;
        }
      });

      // 检查每个 editable_block
      newState.doc.descendants((node, pos) => {
        if (node.type.name === 'editable_block') {
          // 确保第一个子节点是 h3 标题
          const firstChild = node.firstChild;
          if (!firstChild || firstChild.type.name !== 'heading' || firstChild.attrs.level !== 3) {
            // 如果第一个节点不是 h3，创建一个
            const h3 = newState.schema.nodes.heading.create({ level: 3 });
            tr.insert(pos + 1, h3);
            modified = true;
          }

          // 确保其他子节点不是标题
          let childPos = pos + 1;
          node.forEach((child, _offset, index) => {
            if (index > 0 && child.type.name === 'heading') {
              // 将标题转换为段落
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

      // 确保文档至少有一个节点
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

        // 检查是否在允许的编辑位置
        if (!isInsideEditableBlock(state)) {
          return true; // 阻止输入
        }

        return false;
      },

      handleDOMEvents: {
        // 拦截所有输入事件
        beforeinput: (view, event) => {
          const { state } = view;

          if (!isInsideEditableBlock(state)) {
            event.preventDefault();
            return true;
          }
          return false;
        },

        // 拦截粘贴事件
        paste: (view, event) => {
          const { state } = view;

          if (!isInsideEditableBlock(state)) {
            event.preventDefault();
            return true;
          }
          return false;
        },

        // 拦截输入法事件
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

        // 检查光标前后的节点
        const nodeBefore = $from.nodeBefore;
        const nodeAfter = $from.nodeAfter;
        const isBlankBefore = nodeBefore && nodeBefore.type.name === 'blank_space';
        const isBlankAfter = nodeAfter && nodeAfter.type.name === 'blank_space';

        // 如果光标旁边有 blank_space，处理特殊按键
        if (isBlankBefore || isBlankAfter) {
          // 按 '/' 键：将 blank_space 转换为 editable_block
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

              // 生成新块的 ID
              const newBlockId = generateId();
              const parentId = indent > 0 ? findParentBlockId(state, blankPos, indent) : null;

              // 创建新的 editable_block，包含一个 h3 标题
              const heading = schema.nodes.heading.create({ level: 3 });
              const editable = schema.nodes.editable_block.create(
                { indent, id: newBlockId, parentId },
                heading
              );

              // 替换 blank_space 为 editable_block
              const tr = state.tr.replaceWith(blankPos, blankPos + blankNode.nodeSize, editable);

              // 将光标移到新块内的标题中
              dispatch(tr.setSelection(TextSelection.create(tr.doc, blankPos + 2)));

              // 调用回调函数
              onBlockCreated?.({ indent, position: blankPos });

              // 构建并通知树状结构
              setTimeout(() => {
                const tree = buildBlockTree(view.state);
                console.log('🌳 Tree Structure Updated (/ key):', {
                  rootIds: tree.rootIds,
                  nodes: Array.from(tree.nodes.values()),
                });
                onTreeChange?.(tree);
              }, 0);

              return true;
            }
          }

          // 按 Tab 键：将 blank_space 转换为有缩进的 editable_block
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

              // 生成新块的 ID
              const newBlockId = generateId();
              const parentId = findParentBlockId(state, blankPos, indent);

              // 创建一个有缩进的 editable_block，包含一个 h3 标题
              const heading = schema.nodes.heading.create({ level: 3 });
              const editable = schema.nodes.editable_block.create(
                { indent, id: newBlockId, parentId },
                heading
              );

              // 替换 blank_space 为有缩进的 editable_block
              const tr = state.tr.replaceWith(blankPos, blankPos + blankNode.nodeSize, editable);

              // 将光标移到新块内的标题中
              dispatch(tr.setSelection(TextSelection.create(tr.doc, blankPos + 2)));

              // 调用回调函数
              onBlockCreated?.({ indent, position: blankPos });

              // 构建并通知树状结构
              setTimeout(() => {
                const tree = buildBlockTree(view.state);
                console.log('🌳 Tree Structure Updated (Tab key):', {
                  rootIds: tree.rootIds,
                  nodes: Array.from(tree.nodes.values()),
                });
                onTreeChange?.(tree);
              }, 0);

              return true;
            }
          }
        }

        // 在 editable_block 内的按键处理
        if (isInsideEditableBlock(state)) {
          // Tab：增加缩进
          if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();

            // 找到包含光标的 editable_block
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

          // Shift+Tab：减少缩进
          if (event.key === 'Tab' && event.shiftKey) {
            event.preventDefault();

            // 找到包含光标的 editable_block
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

          // Shift+Enter：退出块到新的 blank_space
          if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault();

            // 找到包含光标的 editable_block
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

              // 在 editable_block 后插入新的 blank_space
              const blank = state.schema.nodes.blank_space.create();
              const tr = state.tr.insert(insertPos, blank);

              // 将光标移到新的 blank_space 内
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

  // 用于防抖检测无效引用
  const invalidRefCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemovingInvalidRefs = useRef(false);

  // 保持 ref 最新
  useEffect(() => {
    treeChangeRef.current = onTreeChange;
  }, [onTreeChange]);

  // 获取当前光标所在的 block ID
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

  // 检查当前 block 是否是 leaf node (没有子节点)
  // Leaf node 的定义：没有其他 block 是它的子节点（基于 indent 层级判断）
  const isCurrentBlockLeaf = useCallback((): boolean => {
    if (!editorRef.current) return false;
    const currentBlockId = getCurrentBlockId();
    if (!currentBlockId) return false;

    const { state } = editorRef.current;

    // 收集所有 block 的信息
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

    // 检查下一个 block 是否是当前 block 的子节点
    // 如果下一个 block 的 indent > 当前 block 的 indent，则当前 block 不是 leaf
    const nextBlock = blocks[currentBlockIndex + 1];
    const isLeaf = !nextBlock || nextBlock.indent <= currentBlockIndent;

    console.log('🌿 isCurrentBlockLeaf check:', {
      currentBlockId,
      currentBlockIndent,
      currentBlockIndex,
      nextBlock,
      isLeaf,
      allBlocks: blocks,
    });

    return isLeaf;
  }, [getCurrentBlockId]);

  // 创建 suggestion 渲染器
  const suggestionRenderer = useMemo(
    () => createSuggestionRenderer(),
    []
  );

  const editor = useEditor({
    extensions: [
      CustomDocument,
      StarterKit.configure({
        // 禁用默认的硬换行、文档、标题和代码块，因为我们用自定义的
        hardBreak: false,
        document: false,
        heading: false,
        codeBlock: false,
      }),
      Heading.configure({
        levels: [3], // 只允许 h3 标题
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
      // NodeReference 扩展 - 输入 @ 触发引用选择（仅在 leaf node 中）
      NodeReference.configure({
        getCurrentBlockId,
        isCurrentBlockLeaf,
        suggestion: {
          char: '@',
          allowSpaces: false,
          render: () => suggestionRenderer,
          command: ({ editor, range, props }) => {
            // 删除 >> 触发字符并插入 nodeReference 节点
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

            // 更新树状结构
            setTimeout(() => {
              const tree = buildBlockTree(editor.state);
              console.log('🔗 Reference Added:', {
                references: tree.references,
              });
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

      // 检测并删除无效引用（引用了非叶子节点的）
      // 使用防抖避免频繁检测
      if (invalidRefCheckTimer.current) {
        clearTimeout(invalidRefCheckTimer.current);
      }
      invalidRefCheckTimer.current = setTimeout(() => {
        if (!isRemovingInvalidRefs.current) {
          isRemovingInvalidRefs.current = true;
          const removedCount = removeInvalidReferences(editor);
          if (removedCount > 0) {
            console.log(`🧹 Auto-removed ${removedCount} invalid reference(s)`);
            // 删除引用后，重新构建树并通知更新
            const tree = buildBlockTree(editor.state);
            treeChangeRef.current?.(tree);
          }
          // 延迟重置标志，避免删除操作触发的 onUpdate 再次执行检测
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

        // 调用回调函数
        onBlockCreated?.({ indent, position: pos });

        // 构建并通知树状结构
        setTimeout(() => {
          const tree = buildBlockTree(editor.state);
          console.log('🌳 Tree Structure Updated (Insert Block - existing blank):', {
            rootIds: tree.rootIds,
            nodes: Array.from(tree.nodes.values()),
          });
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

      // 调用回调函数
      onBlockCreated?.({ indent: 0, position: currentPos });

      // 构建并通知树状结构
      setTimeout(() => {
        const tree = buildBlockTree(editor.state);
        console.log('🌳 Tree Structure Updated (Insert Block - new):', {
          rootIds: tree.rootIds,
          nodes: Array.from(tree.nodes.values()),
        });
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
