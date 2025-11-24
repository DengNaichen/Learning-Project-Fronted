// IndexedDB configuration and utility functions

const DB_NAME = 'NotesDB';
const DB_VERSION = 2; // Upgraded version for new notes store
const COMPLETED_BLOCKS_STORE = 'completedBlocks';
const NOTES_STORE = 'notes';

export interface CompletedBlock {
  id: string; // block ID
  noteId?: string; // Note ID (optional, used to associate with a specific note)
  title: string; // Block title (h3 content)
  content: string; // Full block content (HTML or JSON)
  textContent: string; // Plain text content
  indent?: number; // Indentation level (legacy, optional)
  parentId: string | null; // Parent block ID
  position?: number; // Position in the document (legacy, optional)
  completedAt: number; // Completion timestamp
  isLeaf: boolean; // Whether this is a leaf node (no children)
  metadata?: {
    hasCode?: boolean; // Whether it contains code blocks
    hasMath?: boolean; // Whether it contains math formulas
    wordCount?: number; // Word/character count
    [key: string]: unknown; // Other custom metadata
  };
}

/**
 * Stored note structure (JSON format)
 */
export interface StoredNote {
  id: string;
  title: string;
  blocks: string; // JSON stringified BlockNote blocks
  createdAt: number;
  updatedAt: number;
}

/**
 * Initialize the IndexedDB database
 */
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

      // Create completedBlocks store
      if (!db.objectStoreNames.contains(COMPLETED_BLOCKS_STORE)) {
        const objectStore = db.createObjectStore(COMPLETED_BLOCKS_STORE, { keyPath: 'id' });
        objectStore.createIndex('noteId', 'noteId', { unique: false });
        objectStore.createIndex('completedAt', 'completedAt', { unique: false });
        objectStore.createIndex('parentId', 'parentId', { unique: false });
      }

      // Create notes store (new in version 2)
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        const notesStore = db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
        notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        notesStore.createIndex('title', 'title', { unique: false });
      }
    };
  });
}

/**
 * Save a completed block to the database
 */
export async function saveCompletedBlock(block: CompletedBlock): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COMPLETED_BLOCKS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(COMPLETED_BLOCKS_STORE);
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

/**
 * Get all completed blocks from the database
 */
export async function getAllCompletedBlocks(): Promise<CompletedBlock[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COMPLETED_BLOCKS_STORE], 'readonly');
    const objectStore = transaction.objectStore(COMPLETED_BLOCKS_STORE);
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

/**
 * Get a completed block by its ID
 */
export async function getCompletedBlockById(id: string): Promise<CompletedBlock | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COMPLETED_BLOCKS_STORE], 'readonly');
    const objectStore = transaction.objectStore(COMPLETED_BLOCKS_STORE);
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

/**
 * Get all completed blocks for a specific note
 */
export async function getCompletedBlocksByNoteId(noteId: string): Promise<CompletedBlock[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COMPLETED_BLOCKS_STORE], 'readonly');
    const objectStore = transaction.objectStore(COMPLETED_BLOCKS_STORE);
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

/**
 * Delete a completed block by its ID
 */
export async function deleteCompletedBlock(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COMPLETED_BLOCKS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(COMPLETED_BLOCKS_STORE);
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

/**
 * Check if a block has been completed
 */
export async function isBlockCompleted(id: string): Promise<boolean> {
  const block = await getCompletedBlockById(id);
  return block !== null;
}

/**
 * Clear all completed blocks from the database
 */
export async function clearAllCompletedBlocks(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COMPLETED_BLOCKS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(COMPLETED_BLOCKS_STORE);
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

/**
 * Get all leaf blocks (blocks with isLeaf: true)
 */
export async function getLeafBlocks(): Promise<CompletedBlock[]> {
  const allBlocks = await getAllCompletedBlocks();
  return allBlocks.filter(block => block.isLeaf === true);
}

/**
 * Get all leaf blocks, excluding a specific block ID
 */
export async function getLeafBlocksExcluding(excludeId: string): Promise<CompletedBlock[]> {
  const leafBlocks = await getLeafBlocks();
  return leafBlocks.filter(block => block.id !== excludeId);
}

/**
 * Export all completed blocks as JSON (for backup)
 */
export async function exportCompletedBlocks(): Promise<string> {
  const blocks = await getAllCompletedBlocks();
  return JSON.stringify(blocks, null, 2);
}

/**
 * Import completed blocks from JSON (for restore)
 */
export async function importCompletedBlocks(jsonData: string): Promise<void> {
  const blocks: CompletedBlock[] = JSON.parse(jsonData);

  for (const block of blocks) {
    await saveCompletedBlock(block);
  }
}

// ============================================
// Notes Storage Functions
// ============================================

/**
 * Save a note to the database
 */
export async function saveNote(note: StoredNote): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTES_STORE], 'readwrite');
    const objectStore = transaction.objectStore(NOTES_STORE);
    const request = objectStore.put({
      ...note,
      updatedAt: Date.now(),
    });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to save note'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get all notes from the database
 */
export async function getAllNotes(): Promise<StoredNote[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTES_STORE], 'readonly');
    const objectStore = transaction.objectStore(NOTES_STORE);
    const request = objectStore.getAll();

    request.onsuccess = () => {
      // Sort by updatedAt descending
      const notes = request.result.sort((a: StoredNote, b: StoredNote) => b.updatedAt - a.updatedAt);
      resolve(notes);
    };

    request.onerror = () => {
      reject(new Error('Failed to get notes'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get a note by its ID
 */
export async function getNoteById(id: string): Promise<StoredNote | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTES_STORE], 'readonly');
    const objectStore = transaction.objectStore(NOTES_STORE);
    const request = objectStore.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error('Failed to get note'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Delete a note by its ID
 */
export async function deleteNote(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTES_STORE], 'readwrite');
    const objectStore = transaction.objectStore(NOTES_STORE);
    const request = objectStore.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete note'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Create a new note with default content
 */
export async function createNote(title: string = 'Untitled Note'): Promise<StoredNote> {
  const now = Date.now();
  const note: StoredNote = {
    id: `note-${now}-${Math.random().toString(36).substring(2, 11)}`,
    title,
    blocks: JSON.stringify([]),
    createdAt: now,
    updatedAt: now,
  };

  await saveNote(note);
  return note;
}
