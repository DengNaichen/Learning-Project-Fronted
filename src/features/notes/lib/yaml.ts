/**
 * YAML serialization and deserialization for BlockNote blocks
 */

import yaml from "js-yaml";
import type { Block } from "@blocknote/core";
import type { YAMLBlock, YAMLNote } from "../types/note";
import type { CustomSchema } from "./customBlocks.js";

type CustomBlock = Block<
  CustomSchema["blockSchema"],
  CustomSchema["inlineContentSchema"],
  CustomSchema["styleSchema"]
>;

/**
 * Extract text content from BlockNote inline content
 */
function extractTextContent(
  content: CustomBlock["content"]
): string {
  if (!content || !Array.isArray(content)) return "";

  return content
    .map((item) => {
      if ("text" in item) {
        return item.text;
      }
      if (item.type === "nodeReference") {
        // Convert reference to [[title]] format
        const refTitle = (item.props as { refTitle?: string })?.refTitle || "";
        return `[[${refTitle}]]`;
      }
      if (item.type === "link" && "content" in item) {
        const linkText = item.content
          ?.map((c: { text?: string }) => c.text || "")
          .join("");
        return `[${linkText}](${(item as { href?: string }).href || ""})`;
      }
      return "";
    })
    .join("");
}

/**
 * Extract references from BlockNote inline content
 */
function extractRefs(content: CustomBlock["content"]): string[] {
  if (!content || !Array.isArray(content)) return [];

  const refs: string[] = [];
  for (const item of content) {
    if (item.type === "nodeReference") {
      const refId = (item.props as { refId?: string })?.refId;
      if (refId) refs.push(refId);
    }
  }
  return refs;
}

/**
 * Convert BlockNote block to YAML block
 */
function blockToYAML(block: CustomBlock): YAMLBlock {
  const title = extractTextContent(block.content).slice(0, 100);
  const content = extractTextContent(block.content);
  const refs = extractRefs(block.content);

  const yamlBlock: YAMLBlock = {
    id: block.id,
    title: title || "Untitled",
    content: content,
  };

  if (refs.length > 0) {
    yamlBlock.refs = refs;
  }

  if (block.children && block.children.length > 0) {
    yamlBlock.children = block.children.map((child) => blockToYAML(child));
  }

  return yamlBlock;
}

/**
 * Convert BlockNote blocks array to YAML string
 */
export function toYAML(
  blocks: CustomBlock[],
  noteId: string = "note-" + Date.now(),
  noteTitle: string = "Untitled Note"
): string {
  const yamlNote: YAMLNote = {
    id: noteId,
    title: noteTitle,
    blocks: blocks.map((block) => blockToYAML(block)),
  };

  return yaml.dump(yamlNote, {
    indent: 2,
    lineWidth: -1, // No line wrapping
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
}

// Define inline content item type
interface InlineContentItem {
  type: string;
  text?: string;
  styles?: Record<string, unknown>;
  props?: Record<string, unknown>;
}

/**
 * Parse YAML content to BlockNote blocks
 */
function yamlBlockToBlockNote(yamlBlock: YAMLBlock): CustomBlock {
  // Convert content back to inline content format
  const content: InlineContentItem[] = [];

  if (yamlBlock.content) {
    // Parse [[ref]] patterns
    const refPattern = /\[\[([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = refPattern.exec(yamlBlock.content)) !== null) {
      // Add text before the reference
      if (match.index > lastIndex) {
        content.push({
          type: "text",
          text: yamlBlock.content.slice(lastIndex, match.index),
          styles: {},
        });
      }

      // Find the ref ID for this title
      const refTitle = match[1];
      const refId = yamlBlock.refs?.find(() => true) || refTitle; // Fallback to title as ID

      content.push({
        type: "nodeReference",
        props: {
          refId,
          refTitle,
        },
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < yamlBlock.content.length) {
      content.push({
        type: "text",
        text: yamlBlock.content.slice(lastIndex),
        styles: {},
      });
    }

    // If no refs found, just add plain text
    if (content.length === 0 && yamlBlock.content) {
      content.push({
        type: "text",
        text: yamlBlock.content,
        styles: {},
      });
    }
  }

  const block = {
    id: yamlBlock.id,
    type: "paragraph" as const,
    props: {
      textColor: "default" as const,
      backgroundColor: "default" as const,
      textAlignment: "left" as const,
    },
    content: content.length > 0 ? content : [],
    children: yamlBlock.children
      ? yamlBlock.children.map((child) => yamlBlockToBlockNote(child))
      : [],
  };

  return block as unknown as CustomBlock;
}

/**
 * Parse YAML string to BlockNote blocks
 */
export function fromYAML(yamlString: string): {
  blocks: CustomBlock[];
  noteId: string;
  noteTitle: string;
} {
  try {
    const parsed = yaml.load(yamlString) as YAMLNote;

    if (!parsed || !parsed.blocks) {
      throw new Error("Invalid YAML format: missing blocks");
    }

    const blocks = parsed.blocks.map((block) => yamlBlockToBlockNote(block));

    return {
      blocks,
      noteId: parsed.id || "note-" + Date.now(),
      noteTitle: parsed.title || "Imported Note",
    };
  } catch (error) {
    console.error("Failed to parse YAML:", error);
    throw new Error(`YAML parsing error: ${(error as Error).message}`);
  }
}

/**
 * Validate YAML note structure
 */
export function validateYAML(yamlString: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const parsed = yaml.load(yamlString) as YAMLNote;

    if (!parsed) {
      errors.push("Empty or invalid YAML");
      return { valid: false, errors };
    }

    if (!parsed.id) {
      errors.push("Missing note ID");
    }

    if (!parsed.title) {
      errors.push("Missing note title");
    }

    if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
      errors.push("Missing or invalid blocks array");
      return { valid: false, errors };
    }

    // Collect all block IDs for ref validation
    const allIds = new Set<string>();
    const leafIds = new Set<string>();

    function collectIds(blocks: YAMLBlock[]) {
      for (const block of blocks) {
        if (block.id) {
          allIds.add(block.id);
          if (!block.children || block.children.length === 0) {
            leafIds.add(block.id);
          }
        }
        if (block.children) {
          collectIds(block.children);
        }
      }
    }

    collectIds(parsed.blocks);

    // Validate refs point to existing leaf blocks
    function validateRefs(blocks: YAMLBlock[]) {
      for (const block of blocks) {
        if (block.refs) {
          for (const ref of block.refs) {
            if (!allIds.has(ref)) {
              errors.push(`Block "${block.id}" references non-existent block "${ref}"`);
            } else if (!leafIds.has(ref)) {
              errors.push(`Block "${block.id}" references non-leaf block "${ref}"`);
            }
          }
        }
        if (block.children) {
          validateRefs(block.children);
        }
      }
    }

    validateRefs(parsed.blocks);

    // Check for duplicate IDs
    const idCounts = new Map<string, number>();
    function countIds(blocks: YAMLBlock[]) {
      for (const block of blocks) {
        if (block.id) {
          idCounts.set(block.id, (idCounts.get(block.id) || 0) + 1);
        }
        if (block.children) {
          countIds(block.children);
        }
      }
    }
    countIds(parsed.blocks);

    for (const [id, count] of idCounts) {
      if (count > 1) {
        errors.push(`Duplicate block ID: "${id}"`);
      }
    }

    return { valid: errors.length === 0, errors };
  } catch (error) {
    errors.push(`YAML syntax error: ${(error as Error).message}`);
    return { valid: false, errors };
  }
}
