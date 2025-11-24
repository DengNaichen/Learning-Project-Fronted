import { useState, useEffect, useCallback, useRef } from "react";
import type { Block } from "@blocknote/core";
import { Plus, Trash2 } from "lucide-react";
import { Navbar } from "../../../components/Navbar";
import { BlockNoteEditor } from "./BlockNoteEditor";
import { BlockTreeGraph } from "./BlockTreeGraph";
import { customSchema } from "../lib/customBlocks.js";
import { toYAML, fromYAML } from "../lib/yaml";
import { exportToMarkdown } from "../lib/markdown";
import {
  getAllNotes,
  getNoteById,
  saveNote,
  createNote,
  deleteNote,
} from "../db/indexedDB";
import type { StoredNote } from "../db/indexedDB";
import type { BlockTree } from "../types/note";

type CustomBlock = Block<
  typeof customSchema.blockSchema,
  typeof customSchema.inlineContentSchema,
  typeof customSchema.styleSchema
>;

// Generate unique block ID
function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function NotesPage() {
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [currentNote, setCurrentNote] = useState<StoredNote | null>(null);
  const [blocks, setBlocks] = useState<CustomBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [blockTree, setBlockTree] = useState<BlockTree | null>(null);
  const [showNotesList, setShowNotesList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load notes list on mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const allNotes = await getAllNotes();
      setNotes(allNotes);

      // If there are notes and no current note, load the first one
      if (allNotes.length > 0 && !currentNote) {
        await loadNote(allNotes[0].id);
      }
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  const loadNote = async (noteId: string) => {
    try {
      const note = await getNoteById(noteId);
      if (note) {
        setCurrentNote(note);
        const parsedBlocks = JSON.parse(note.blocks || "[]");
        setBlocks(parsedBlocks);
      }
    } catch (error) {
      console.error("Failed to load note:", error);
    }
  };

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote("Untitled Note");
      setNotes((prev) => [newNote, ...prev]);
      setCurrentNote(newNote);
      setBlocks([
        {
          id: generateId(),
          type: "heading",
          props: { level: 2, textColor: "default", backgroundColor: "default", textAlignment: "left" },
          content: [{ type: "text", text: "New Note", styles: {} }],
          children: [],
        } as CustomBlock,
      ]);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));

      if (currentNote?.id === noteId) {
        const remaining = notes.filter((n) => n.id !== noteId);
        if (remaining.length > 0) {
          await loadNote(remaining[0].id);
        } else {
          setCurrentNote(null);
          setBlocks([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const handleBlocksChange = useCallback(
    (newBlocks: CustomBlock[]) => {
      setBlocks(newBlocks);

      // Auto-save with debounce
      if (currentNote) {
        setIsSaving(true);
        saveNote({
          ...currentNote,
          blocks: JSON.stringify(newBlocks),
          updatedAt: Date.now(),
        })
          .catch(console.error)
          .finally(() => setIsSaving(false));
      }
    },
    [currentNote]
  );

  const handleTreeChange = useCallback((tree: BlockTree) => {
    setBlockTree(tree);
  }, []);

  const handleTitleChange = async (newTitle: string) => {
    if (!currentNote) return;

    const updatedNote = { ...currentNote, title: newTitle };
    setCurrentNote(updatedNote);

    try {
      await saveNote(updatedNote);
      setNotes((prev) =>
        prev.map((n) => (n.id === currentNote.id ? updatedNote : n))
      );
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  };

  // Export handlers
  const handleExportYAML = () => {
    if (!currentNote || blocks.length === 0) return;

    const yamlContent = toYAML(blocks, currentNote.id, currentNote.title);
    downloadFile(yamlContent, `${currentNote.title || "note"}.yaml`, "text/yaml");
  };

  const handleExportMarkdown = () => {
    if (!currentNote || blocks.length === 0) return;

    const mdContent = exportToMarkdown(blocks, {
      noteTitle: currentNote.title,
      useHierarchicalHeadings: true,
    });
    downloadFile(mdContent, `${currentNote.title || "note"}.md`, "text/markdown");
  };

  const handleImportYAML = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const { blocks: importedBlocks, noteTitle } = fromYAML(content);

      // Create a new note with imported content
      const newNote = await createNote(noteTitle);
      await saveNote({
        ...newNote,
        blocks: JSON.stringify(importedBlocks),
      });

      setNotes((prev) => [newNote, ...prev]);
      setCurrentNote(newNote);
      setBlocks(importedBlocks);

      alert("Note imported successfully!");
    } catch (error) {
      console.error("Failed to import YAML:", error);
      alert(`Import failed: ${(error as Error).message}`);
    }

    // Reset file input
    event.target.value = "";
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to extract text from block content
  const getBlockTitle = (content: CustomBlock["content"]): string => {
    if (!content || !Array.isArray(content)) return "Untitled";
    return (
      content
        .map((c) => {
          if (typeof c === "object" && c !== null && "text" in c) {
            return (c as { text?: string }).text || "";
          }
          return "";
        })
        .join("")
        .slice(0, 50) || "Untitled"
    );
  };

  // Build block titles for graph
  const blockTitles = blocks.reduce(
    (acc, block) => {
      acc[block.id] = getBlockTitle(block.content);

      // Also add children titles
      function addChildTitles(children: CustomBlock[]) {
        for (const child of children) {
          acc[child.id] = getBlockTitle(child.content);
          if (child.children) {
            addChildTitles(child.children);
          }
        }
      }

      if (block.children) {
        addChildTitles(block.children);
      }

      return acc;
    },
    {} as Record<string, string>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-bg dark:bg-bg-dark">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".yaml,.yml"
        onChange={handleFileImport}
        className="hidden"
      />

      <Navbar />

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Notes Sidebar */}
        <div
          className={`${
            showNotesList ? "w-64" : "w-0"
          } transition-all duration-200 overflow-hidden border-r border-border dark:border-border-dark bg-bg-muted dark:bg-bg-elevated-dark`}
        >
          <div className="p-4 h-full overflow-auto">
            <h3 className="text-sm font-semibold text-text-secondary dark:text-text-secondary-dark mb-3">
              Notes
            </h3>
            <div className="space-y-1">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                    currentNote?.id === note.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-bg-elevated dark:hover:bg-bg-muted-dark text-text-primary dark:text-text-primary-dark"
                  }`}
                  onClick={() => loadNote(note.id)}
                >
                  <span className="flex-1 truncate text-sm">{note.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setShowNotesList(!showNotesList)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-bg-elevated dark:bg-bg-elevated-dark border border-border dark:border-border-dark rounded-r-lg p-1 hover:bg-bg-muted dark:hover:bg-bg-muted-dark"
          style={{ left: showNotesList ? "256px" : "0" }}
        >
          <svg
            className={`w-4 h-4 transition-transform ${showNotesList ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Left Pane: Editor */}
        <div className="flex-2 flex flex-col p-6 min-w-0 overflow-hidden">
          <div className="flex-grow flex flex-col card overflow-hidden">
            <div className="p-4 border-b border-border dark:border-border-dark">
              {/* Title Input */}
              <input
                type="text"
                value={currentNote?.title || ""}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-2xl font-bold text-text-primary dark:text-text-primary-dark focus:outline-0 focus:ring-0 border-none bg-transparent focus:border-none h-14 placeholder:text-text-tertiary dark:placeholder:text-text-tertiary-dark p-2"
                placeholder="Note Title"
              />
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden min-h-0">
              {currentNote ? (
                <BlockNoteEditor
                  key={currentNote.id}
                  initialContent={blocks.length > 0 ? blocks : undefined}
                  onChange={handleBlocksChange}
                  onTreeChange={handleTreeChange}
                  noteId={currentNote.id}
                  onExportYAML={handleExportYAML}
                  onImportYAML={handleImportYAML}
                  onExportMarkdown={handleExportMarkdown}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-text-tertiary dark:text-text-tertiary-dark">
                  <div className="text-center">
                    <p className="mb-4">No note selected</p>
                    <button onClick={handleCreateNote} className="btn-primary btn-md">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Note
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Editor Status Bar */}
            <div className="flex border-t border-border dark:border-border-dark items-center px-4 py-2">
              <p className="text-text-tertiary dark:text-text-tertiary-dark text-sm font-normal leading-normal">
                Status: {isSaving ? "Saving..." : "Saved"}
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
        <div className="flex-1 flex flex-col relative bg-bg-muted dark:bg-bg-dark border-l border-border dark:border-border-dark min-h-0 min-w-0 overflow-hidden">
          {/* Block Tree Graph */}
          <BlockTreeGraph tree={blockTree} titles={blockTitles} />
        </div>
      </main>
    </div>
  );
}
