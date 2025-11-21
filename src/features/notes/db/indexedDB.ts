// IndexedDB 配置和工具函数

const DB_NAME = 'NotesDB';
const DB_VERSION = 1;
const STORE_NAME = 'completedBlocks';

export interface CompletedBlock {
  id: string; // block ID
  noteId?: string; // 笔记 ID (可选，用于关联到具体笔记)
  title: string; // block 标题 (h3 内容)
  content: string; // block 完整内容 (HTML)
  textContent: string; // 纯文本内容
  indent: number; // 缩进级别
  parentId: string | null; // 父 block ID
  position: number; // 在文档中的位置
  completedAt: number; // 完成时间戳
  isLeaf: boolean; // 是否是叶子节点 (没有子节点)
  metadata?: {
    hasCode?: boolean; // 是否包含代码块
    hasMath?: boolean; // 是否包含数学公式
    wordCount?: number; // 字数
    [key: string]: any; // 其他自定义元数据
  };
}

// 初始化数据库
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建对象存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

        // 创建索引
        objectStore.createIndex('noteId', 'noteId', { unique: false });
        objectStore.createIndex('completedAt', 'completedAt', { unique: false });
        objectStore.createIndex('parentId', 'parentId', { unique: false });
        objectStore.createIndex('indent', 'indent', { unique: false });
      }
    };
  });
}

// 保存完成的 block
export async function saveCompletedBlock(block: CompletedBlock): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.put(block);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to save completed block'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// 获取所有完成的 blocks
export async function getAllCompletedBlocks(): Promise<CompletedBlock[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get completed blocks'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// 根据 ID 获取完成的 block
export async function getCompletedBlockById(id: string): Promise<CompletedBlock | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error('Failed to get completed block'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// 根据 noteId 获取所有完成的 blocks
export async function getCompletedBlocksByNoteId(noteId: string): Promise<CompletedBlock[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const index = objectStore.index('noteId');
    const request = index.getAll(noteId);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Failed to get completed blocks by note ID'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// 删除完成的 block
export async function deleteCompletedBlock(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete completed block'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// 检查 block 是否已完成
export async function isBlockCompleted(id: string): Promise<boolean> {
  const block = await getCompletedBlockById(id);
  return block !== null;
}

// 清空所有完成的 blocks
export async function clearAllCompletedBlocks(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to clear completed blocks'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// 获取所有叶子节点 (isLeaf: true)
export async function getLeafBlocks(): Promise<CompletedBlock[]> {
  const allBlocks = await getAllCompletedBlocks();
  return allBlocks.filter(block => block.isLeaf === true);
}

// 获取所有叶子节点，排除指定的 block ID
export async function getLeafBlocksExcluding(excludeId: string): Promise<CompletedBlock[]> {
  const leafBlocks = await getLeafBlocks();
  return leafBlocks.filter(block => block.id !== excludeId);
}

// 导出数据库中的所有数据 (用于备份)
export async function exportCompletedBlocks(): Promise<string> {
  const blocks = await getAllCompletedBlocks();
  return JSON.stringify(blocks, null, 2);
}

// 导入数据到数据库 (用于恢复)
export async function importCompletedBlocks(jsonData: string): Promise<void> {
  const blocks: CompletedBlock[] = JSON.parse(jsonData);

  for (const block of blocks) {
    await saveCompletedBlock(block);
  }
}
