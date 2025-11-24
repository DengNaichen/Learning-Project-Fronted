/**
 * Markdown export for BlockNote blocks
 */

import type { Block } from "@blocknote/core";
import type { CustomSchema } from "./customBlocks.js";

type CustomBlock = Block<
  CustomSchema["blockSchema"],
  CustomSchema["inlineContentSchema"],
  CustomSchema["styleSchema"]
>;

/**
 * Convert inline content to Markdown text
 */
function inlineContentToMarkdown(content: CustomBlock["content"]): string {
  if (!content || !Array.isArray(content)) return "";

  return content
    .map((item) => {
      if ("text" in item) {
        let text = item.text;

        // Apply styles
        const styles = item.styles || {};
        if (styles.bold) text = `**${text}**`;
        if (styles.italic) text = `*${text}*`;
        if (styles.code) text = `\`${text}\``;
        if (styles.strike) text = `~~${text}~~`;

        return text;
      }

      if (item.type === "nodeReference") {
        const refTitle = (item.props as { refTitle?: string })?.refTitle || "";
        return `[[${refTitle}]]`;
      }

      if (item.type === "inlineMath") {
        const formula = (item.props as { formula?: string })?.formula || "";
        return `$${formula}$`;
      }

      if (item.type === "link") {
        const linkContent = (item as { content?: Array<{ text?: string }> }).content;
        const linkText = linkContent?.map((c) => c.text || "").join("") || "";
        const href = (item as { href?: string }).href || "";
        return `[${linkText}](${href})`;
      }

      return "";
    })
    .join("");
}

/**
 * Convert a single block to Markdown
 */
function blockToMarkdown(block: CustomBlock, depth: number = 0): string {
  const lines: string[] = [];
  const indent = "  ".repeat(depth);
  const content = inlineContentToMarkdown(block.content);

  switch (block.type) {
    case "heading": {
      const level = (block.props as { level?: number })?.level || 1;
      const headerPrefix = "#".repeat(Math.min(level + depth, 6));
      lines.push(`${headerPrefix} ${content}`);
      break;
    }

    case "paragraph":
      if (content.trim()) {
        lines.push(`${indent}${content}`);
      } else {
        lines.push("");
      }
      break;

    case "bulletListItem":
      lines.push(`${indent}- ${content}`);
      break;

    case "numberedListItem":
      lines.push(`${indent}1. ${content}`);
      break;

    case "checkListItem": {
      const checked = (block.props as { checked?: boolean })?.checked;
      lines.push(`${indent}- [${checked ? "x" : " "}] ${content}`);
      break;
    }

    case "codeBlock": {
      const language = (block.props as { language?: string })?.language || "";
      lines.push(`${indent}\`\`\`${language}`);
      lines.push(`${indent}${content}`);
      lines.push(`${indent}\`\`\``);
      break;
    }

    case "table": {
      // Simple table handling - just output as text for now
      lines.push(`${indent}[Table]`);
      break;
    }

    case "image": {
      const url = (block.props as { url?: string })?.url || "";
      const caption = (block.props as { caption?: string })?.caption || "";
      lines.push(`${indent}![${caption}](${url})`);
      break;
    }

    case "video": {
      const url = (block.props as { url?: string })?.url || "";
      lines.push(`${indent}[Video: ${url}]`);
      break;
    }

    case "audio": {
      const url = (block.props as { url?: string })?.url || "";
      lines.push(`${indent}[Audio: ${url}]`);
      break;
    }

    case "file": {
      const url = (block.props as { url?: string })?.url || "";
      const name = (block.props as { name?: string })?.name || "file";
      lines.push(`${indent}[File: ${name}](${url})`);
      break;
    }

    case "math": {
      const formula = (block.props as { formula?: string })?.formula || "";
      lines.push(`${indent}$$`);
      lines.push(`${indent}${formula}`);
      lines.push(`${indent}$$`);
      break;
    }

    default:
      if (content.trim()) {
        lines.push(`${indent}${content}`);
      }
  }

  // Process children with increased depth
  if (block.children && block.children.length > 0) {
    for (const child of block.children) {
      lines.push(blockToMarkdown(child, depth + 1));
    }
  }

  return lines.join("\n");
}

/**
 * Convert BlockNote blocks to Markdown string
 */
export function toMarkdown(
  blocks: CustomBlock[],
  noteTitle?: string
): string {
  const lines: string[] = [];

  // Add title if provided
  if (noteTitle) {
    lines.push(`# ${noteTitle}`);
    lines.push("");
  }

  // Convert each block
  for (const block of blocks) {
    const blockMd = blockToMarkdown(block, 0);
    lines.push(blockMd);
    lines.push(""); // Add blank line between top-level blocks
  }

  return lines.join("\n").trim() + "\n";
}

/**
 * Convert BlockNote blocks to Markdown with hierarchical headings
 * Uses indent depth to determine heading level (h1 for depth 0, h2 for depth 1, etc.)
 */
export function toMarkdownWithHeadings(
  blocks: CustomBlock[],
  noteTitle?: string
): string {
  const lines: string[] = [];

  // Add title if provided
  if (noteTitle) {
    lines.push(`# ${noteTitle}`);
    lines.push("");
  }

  function processBlock(block: CustomBlock, depth: number) {
    const content = inlineContentToMarkdown(block.content);

    // Use heading level based on depth (max h6)
    const headingLevel = Math.min(depth + 2, 6);
    const headerPrefix = "#".repeat(headingLevel);

    if (content.trim()) {
      lines.push(`${headerPrefix} ${content}`);
      lines.push("");
    }

    // Process children
    if (block.children && block.children.length > 0) {
      for (const child of block.children) {
        processBlock(child, depth + 1);
      }
    }
  }

  for (const block of blocks) {
    processBlock(block, 0);
  }

  return lines.join("\n").trim() + "\n";
}

/**
 * Export options
 */
export interface MarkdownExportOptions {
  includeTitle?: boolean;
  useHierarchicalHeadings?: boolean;
  noteTitle?: string;
}

/**
 * Export blocks to Markdown with options
 */
export function exportToMarkdown(
  blocks: CustomBlock[],
  options: MarkdownExportOptions = {}
): string {
  const {
    includeTitle = true,
    useHierarchicalHeadings = true,
    noteTitle,
  } = options;

  const title = includeTitle ? noteTitle : undefined;

  if (useHierarchicalHeadings) {
    return toMarkdownWithHeadings(blocks, title);
  }

  return toMarkdown(blocks, title);
}
