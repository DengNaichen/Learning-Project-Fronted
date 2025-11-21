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

// 从编辑器状态获取的 Block 信息
export interface EditorBlock {
  id: string;
  title: string;
  textContent: string;
  indent: number;
  isLeaf: boolean;
}

// 无效引用信息
export interface InvalidReference {
  blockId: string; // 包含引用的 block ID
  refId: string; // 被引用的节点 ID
  refTitle: string; // 被引用的节点标题
  position: number; // 引用在文档中的位置
}

// 获取所有叶子节点的 ID 集合
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

// 检测所有无效的引用（引用了非叶子节点）
export function findInvalidReferences(editor: Editor): InvalidReference[] {
  const leafIds = getLeafNodeIds(editor);
  const invalidRefs: InvalidReference[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'editable_block') {
      const blockId = node.attrs.id;

      // 遍历 block 内部查找引用
      node.descendants((child, childPos) => {
        if (child.type.name === 'nodeReference') {
          const refId = child.attrs.refId;
          const refTitle = child.attrs.refTitle;

          // 如果引用的节点不是叶子节点，则为无效引用
          if (refId && !leafIds.has(refId)) {
            invalidRefs.push({
              blockId,
              refId,
              refTitle: refTitle || '未知',
              position: pos + childPos + 1, // 计算在文档中的绝对位置
            });
          }
        }
      });
    }
  });

  return invalidRefs;
}

// 删除所有无效的引用
export function removeInvalidReferences(editor: Editor): number {
  const invalidRefs = findInvalidReferences(editor);

  if (invalidRefs.length === 0) {
    return 0;
  }

  // 按位置从后往前删除，避免位置偏移问题
  const sortedRefs = [...invalidRefs].sort((a, b) => b.position - a.position);

  editor.chain().focus();

  for (const ref of sortedRefs) {
    // 找到引用节点并删除
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'nodeReference' && node.attrs.refId === ref.refId) {
        // 检查位置是否匹配（允许一定误差）
        if (Math.abs(pos - ref.position) < 10) {
          editor.chain().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
          return false; // 停止遍历
        }
      }
    });
  }

  console.log(`🗑️ Removed ${invalidRefs.length} invalid references:`, invalidRefs);
  return invalidRefs.length;
}

// 获取当前 block 中已经引用的节点 ID 列表
function getExistingReferencesInBlock(editor: Editor, blockId: string): string[] {
  const references: string[] = [];

  editor.state.doc.descendants((node) => {
    if (node.type.name === 'editable_block' && node.attrs.id === blockId) {
      // 遍历这个 block 内部的所有节点
      node.descendants((child) => {
        if (child.type.name === 'nodeReference') {
          const refId = child.attrs.refId;
          if (refId) {
            references.push(refId);
          }
        }
      });
      return false; // 找到目标 block 后停止遍历
    }
  });

  return references;
}

// 从编辑器状态获取所有叶子节点（排除指定的 block 和已引用的节点）
export function getLeafBlocksFromEditor(editor: Editor, excludeId: string): EditorBlock[] {
  const blocks: Array<{ id: string; title: string; textContent: string; indent: number; position: number }> = [];

  // 获取当前 block 已经引用的节点 ID
  const existingRefs = getExistingReferencesInBlock(editor, excludeId);

  // 遍历文档获取所有 editable_block
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'editable_block') {
      const id = node.attrs.id;
      const indent = node.attrs.indent || 0;

      // 获取标题 (第一个 heading)
      let title = '';
      const firstChild = node.firstChild;
      if (firstChild && firstChild.type.name === 'heading') {
        title = firstChild.textContent || '';
      }

      // 获取纯文本内容
      const textContent = node.textContent || '';

      blocks.push({ id, title, textContent, indent, position: pos });
    }
  });

  // 判断每个 block 是否是叶子节点
  const result: EditorBlock[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];

    // 排除当前正在编辑的 block
    if (current.id === excludeId) continue;

    // 排除已经被引用的节点
    if (existingRefs.includes(current.id)) continue;

    // 检查下一个 block 是否是当前 block 的子节点
    const nextBlock = blocks[i + 1];
    const isLeaf = !nextBlock || nextBlock.indent <= current.indent;

    if (isLeaf) {
      result.push({
        id: current.id,
        title: current.title || '无标题',
        textContent: current.textContent,
        indent: current.indent,
        isLeaf: true,
      });
    }
  }

  return result;
}

// ============================================
// NodeReference 节点组件
// ============================================
function NodeReferenceComponent({ node }: NodeViewProps) {
  const { refId, refTitle } = node.attrs;

  return (
    <NodeViewWrapper as="span" className="node-reference-wrapper">
      <span
        className="node-reference"
        data-ref-id={refId}
        title={`引用: ${refTitle}`}
        contentEditable={false}
      >
        <Link2 className="w-3 h-3 inline mr-1" />
        {refTitle || '未知引用'}
      </span>
    </NodeViewWrapper>
  );
}

// ============================================
// NodeReference TipTap 扩展
// ============================================
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
    // 保存 options 的引用
    const options = this.options;
    const editor = this.editor;

    console.log('🔌 NodeReference: addProseMirrorPlugins called', {
      hasEditor: !!editor,
      suggestionOptions: Object.keys(options.suggestion || {}),
    });

    // 从 editor 状态获取当前 block ID 的辅助函数
    const getBlockIdFromEditor = (): string | null => {
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
        console.log('🔍 NodeReference items called!', { query });

        // 直接使用 editor 获取当前 block ID
        const blockId = getBlockIdFromEditor();

        console.log('🔍 Block check:', { blockId });

        if (!blockId) {
          console.log('❌ Not inside a block');
          return [];
        }

        // 允许在任何 block 中使用 @ 引用，不再限制只能在叶子节点中
        return [{ id: '__trigger__', query }];
      },
      render: options.suggestion?.render,
      command: options.suggestion?.command,
    });

    console.log('🔌 Suggestion plugin created:', !!suggestionPlugin);

    return [suggestionPlugin];
  },
});

// ============================================
// Suggestion 列表组件
// ============================================
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

    // 过滤后的项目
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
            {query ? `没有找到 "${query}" 相关的节点` : '没有可引用的叶子节点'}
          </div>
        </div>
      );
    }

    return (
      <div className="node-reference-dropdown">
        <div className="node-reference-header">
          <Link2 className="w-4 h-4" />
          <span>选择要引用的节点</span>
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
              <span className="node-reference-item-title">{item.title || '无标题'}</span>
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

// 从 editor 获取当前 block ID 的辅助函数
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

// ============================================
// Suggestion 渲染器工厂
// ============================================
export function createSuggestionRenderer() {
  let component: { ref: SuggestionListRef | null; items: EditorBlock[]; root: Root | null } | null = null;
  let popup: Instance[] | null = null;

  return {
    onStart: (props: SuggestionProps) => {
      console.log('🚀 Suggestion onStart called!', { query: props.query });

      const editor = props.editor;
      const currentBlockId = getBlockIdFromEditor(editor);
      console.log('📍 Current block ID:', currentBlockId, 'Editor:', !!editor);

      let items: EditorBlock[] = [];

      if (currentBlockId) {
        items = getLeafBlocksFromEditor(editor, currentBlockId);
        console.log('📋 Available leaf blocks from editor:', items);
      }

      // 创建容器元素
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

      console.log('🎯 Tippy popup created:', popup);

      // 渲染 React 组件
      root.render(
        <SuggestionList
          items={component.items}
          command={props.command}
          query={props.query}
          ref={(ref) => {
            if (component) component.ref = ref;
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

      // 重新渲染
      component.root.render(
        <SuggestionList
          items={component.items}
          command={props.command}
          query={props.query}
          ref={(ref) => {
            if (component) component.ref = ref;
          }}
        />
      );

      popup[0]?.setProps({
        getReferenceClientRect: props.clientRect as () => DOMRect,
      });
    },

    onKeyDown: (props: { event: KeyboardEvent }) => {
      console.log('⌨️ onKeyDown called:', props.event.key, 'ref:', !!component?.ref);

      if (props.event.key === 'Escape') {
        popup?.[0]?.hide();
        return true;
      }

      const result = component?.ref?.onKeyDown(props.event) ?? false;
      console.log('⌨️ onKeyDown result:', result);
      return result;
    },

    onExit: () => {
      component?.root?.unmount();
      popup?.[0]?.destroy();
      popup = null;
      component = null;
    },
  };
}

// ============================================
// 样式 (导出供 TiptapEditor 使用)
// ============================================
export const nodeReferenceStyles = `
  /* Node Reference 内联样式 */
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

  /* Dropdown 样式 */
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

  /* Tippy 样式覆盖 */
  .tippy-box {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  .tippy-content {
    padding: 0 !important;
  }
`;
