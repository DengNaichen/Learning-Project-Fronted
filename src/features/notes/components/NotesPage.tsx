import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TiptapEditor, type BlockTree } from './TiptapEditor';
import { BlockTreeGraph, type BlockTitles } from './BlockTreeGraph';
import { Search, Home, Compass, Users, Plus, Upload } from 'lucide-react';

export function NotesPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [blockTree, setBlockTree] = useState<BlockTree | null>(null);
  const [blockTitles, setBlockTitles] = useState<BlockTitles>({});

  // 为每个笔记生成唯一 ID
  const noteId = useMemo(() => `note-${Date.now()}`, []);

  // 从 HTML 内容中提取 block 标题
  const extractBlockTitles = useCallback((htmlContent: string): BlockTitles => {
    const titles: BlockTitles = {};

    // 使用 DOMParser 解析 HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 查找所有 editable-block
    const blocks = doc.querySelectorAll('[data-editable-block="true"], [data-block-id]');

    blocks.forEach((block) => {
      const blockId = block.getAttribute('data-block-id');
      if (blockId) {
        // 获取第一个 h3 的文本内容作为标题
        const h3 = block.querySelector('h3');
        const title = h3?.textContent?.trim() || '无标题';
        titles[blockId] = title;
      }
    });

    return titles;
  }, []);

  const handleBlockCreated = (blockInfo: { indent: number; position: number }) => {
    console.log('Block created:', blockInfo);
  };

  const handleTreeChange = (tree: BlockTree) => {
    setBlockTree(tree);
    console.log('Tree updated:', tree);
  };

  // 当内容变化时，更新 block 标题
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    const titles = extractBlockTitles(newContent);
    setBlockTitles(titles);
  }, [extractBlockTitles]);

  const handleSave = () => {
    setIsSaving(true);

    // 保存到 localStorage
    const savedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
    const newNote = {
      id: Date.now(),
      title: title || 'Untitled Note',
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    savedNotes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(savedNotes));

    setTimeout(() => {
      setIsSaving(false);
      alert('Note saved successfully!');
    }, 500);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-bg dark:bg-bg-dark">
      {/* TopNavBar */}
      <header className="nav-header shrink-0 z-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-text-primary dark:text-text-primary-dark">
            <div className="size-6 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
                <path clipRule="evenodd" d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648C43.104 15.1371 43.1038 15.1374 43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z" fill="currentColor" fillRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">KnowledgeGraph</h2>
          </div>
          <label className="flex flex-col min-w-40 !h-10 max-w-64">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
              <div className="text-text-tertiary dark:text-text-tertiary-dark flex border-none bg-bg-muted dark:bg-bg-muted-dark items-center justify-center pl-4 rounded-l-lg border-r-0">
                <Search className="w-5 h-5" />
              </div>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-primary dark:text-text-primary-dark focus:outline-0 focus:ring-0 border-none bg-bg-muted dark:bg-bg-muted-dark focus:border-none h-full placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                placeholder="Search concepts, notes..."
              />
            </div>
          </label>
        </div>
        <div className="flex flex-1 justify-end gap-4 items-center">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/')} className="nav-link flex items-center gap-2">
              <Home className="w-4 h-4" />
              Dashboard
            </button>
            <button onClick={() => navigate('/graphs')} className="nav-link flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Explore
            </button>
            <button className="nav-link flex items-center gap-2">
              <Users className="w-4 h-4" />
              Community
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary btn-md"
            >
              <Upload className="w-4 h-4 mr-2" />
              <span className="truncate">{isSaving ? 'Publishing...' : 'Publish'}</span>
            </button>
            <button className="btn-secondary btn-md">
              <Plus className="w-4 h-4 mr-2" />
              <span className="truncate">New Note</span>
            </button>
          </div>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 cursor-pointer" style={{backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')"}}></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Pane: Editor */}
        <div className="flex-1 flex flex-col p-6 min-w-[400px]">
          <div className="flex-grow flex flex-col card overflow-hidden">
            <div className="p-4 border-b border-border dark:border-border-dark">
              {/* Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-2xl font-bold text-text-primary dark:text-text-primary-dark focus:outline-0 focus:ring-0 border-none bg-transparent focus:border-none h-14 placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark p-2"
                placeholder="Note Title"
              />
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-auto">
              <TiptapEditor
                content={content}
                onChange={handleContentChange}
                onBlockCreated={handleBlockCreated}
                onTreeChange={handleTreeChange}
                noteId={noteId}
              />
            </div>

            {/* Editor Status Bar */}
            <div className="flex border-t border-border dark:border-border-dark items-center px-4 py-2">
              <p className="text-text-tertiary dark:text-text-tertiary-dark text-sm font-normal leading-normal">
                Status: {isSaving ? 'Saving...' : 'Saved'}
              </p>
              {blockTree && (
                <p className="ml-4 text-text-tertiary dark:text-text-tertiary-dark text-sm font-normal leading-normal">
                  Blocks: {blockTree.nodes.size} | Root nodes: {blockTree.rootIds.length}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane: Graph Viewer */}
        <div className="flex-1 flex flex-col relative bg-bg-muted dark:bg-bg-dark border-l border-border dark:border-border-dark">
          {/* Block Tree Graph */}
          <BlockTreeGraph tree={blockTree} titles={blockTitles} />
        </div>
      </main>
    </div>
  );
}
