# TipTap 编辑器重构计划

## 目标

将现有的 TipTap 块编辑器重构为 YAML 驱动的架构，实现：
- 编辑器体验不变（所见即所得）
- 底层数据格式统一为 YAML
- 支持 YAML ↔ 编辑器双向同步
- 方便导出 Markdown

## 数据流架构

```
YAML 文件
    ↓ fromYAML()
BlockTree (内存)
    ↓
TipTap 编辑器渲染
    ↓ 用户编辑
BlockTree 更新
    ↓ toYAML()
YAML 文件
```

## YAML 结构设计

```yaml
id: note-xxx
title: 数据结构笔记
blocks:
  - id: block-1
    title: 树
    content: |
      树是一种非线性数据结构...
    children:
      - id: block-1-1
        title: 二叉树定义
        content: |
          每个节点最多有两个子节点...
        refs: []
      - id: block-1-2
        title: 遍历方式
        content: |
          前序、中序、后序...
        refs:
          - block-1-1
```

## 重构步骤

### Phase 1: 定义核心类型

- [ ] 定义 YAML 数据的 TypeScript 类型
- [ ] 定义 BlockTree 与 YAML 的映射关系

```typescript
interface YAMLBlock {
  id: string;
  title: string;
  content: string;
  refs?: string[];
  children?: YAMLBlock[];
}

interface YAMLNote {
  id: string;
  title: string;
  blocks: YAMLBlock[];
}
```

### Phase 2: 实现序列化函数

- [ ] `toYAML(tree: BlockTree): string` - BlockTree 导出为 YAML
- [ ] `fromYAML(yaml: string): BlockTree` - YAML 解析为 BlockTree
- [ ] 添加 `js-yaml` 依赖

### Phase 3: 实现编辑器适配

- [ ] `blockTreeToHTML(tree: BlockTree): string` - BlockTree 转 TipTap HTML
- [ ] `htmlToBlockTree(html: string): BlockTree` - TipTap HTML 转 BlockTree
- [ ] 修改 TiptapEditor 组件，接受 BlockTree 作为输入

### Phase 4: 存储层改造

- [ ] IndexedDB 存储格式改为 YAML 字符串
- [ ] 或保持 JSON 存储，导入导出时转 YAML

### Phase 5: 导入导出功能

- [ ] 添加"导出为 YAML"按钮
- [ ] 添加"导入 YAML"按钮
- [ ] 添加"导出为 Markdown"功能

### Phase 6: Markdown 导出

- [ ] `toMarkdown(tree: BlockTree): string`
- [ ] 缩进层级 → 标题层级 (h1-h6)
- [ ] refs 转换为 `[[wikilink]]` 或 `[title](#anchor)` 格式

导出示例：

```markdown
# 树

树是一种非线性数据结构...

## 二叉树定义

每个节点最多有两个子节点...

## 遍历方式

前序、中序、后序...

参见：[[二叉树定义]]
```

## 文件结构建议

```
src/features/notes/
├── components/
│   └── TiptapEditor.tsx      # 保持不变
├── lib/
│   ├── yaml.ts               # YAML 序列化/反序列化
│   ├── markdown.ts           # Markdown 导出
│   └── blockTree.ts          # BlockTree 工具函数
├── types/
│   └── yaml.ts               # YAML 相关类型定义
└── db/
    └── indexedDB.ts          # 存储层（可选改造）
```

## 依赖

```bash
npm install js-yaml
npm install -D @types/js-yaml
```

## 注意事项

1. **保持编辑器规则不变**
   - 只有叶子节点能被引用
   - 第一行必须是 h3 标题
   - Tab/Shift+Tab 缩进逻辑

2. **ID 稳定性**
   - YAML 导入导出时保持 block ID 不变
   - 避免重复 ID

3. **内容格式**
   - YAML content 字段存储纯文本或简化 Markdown
   - 代码块、数学公式需要考虑转义

4. **引用验证**
   - fromYAML 时验证 refs 指向的 ID 是否存在且为叶子节点
   - 无效引用给出警告或自动移除
