// Components
export { NotesPage } from './components/NotesPage';
export { BlockNoteEditor } from './components/BlockNoteEditor';
export { CompletedBlocksViewer } from './components/CompletedBlocksViewer';
export { BlockTreeGraph } from './components/BlockTreeGraph';

// Types
export type { BlockTree, BlockNode, BlockReference, YAMLBlock, YAMLNote, StoredNote, EditorBlock } from './types/note';
export type { BlockTitles } from './components/BlockTreeGraph';

// Lib utilities
export { toYAML, fromYAML, validateYAML } from './lib/yaml';
export { toMarkdown, exportToMarkdown } from './lib/markdown';
export { customSchema, NodeReference } from './lib/customBlocks.js';

// Database utilities
export * from './db/indexedDB';
