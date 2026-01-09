/**
 * Convert GraphContentResponse to BlockNote blocks
 *
 * This module transforms backend graph data into a simple
 * block structure compatible with BlockNoteEditor.
 */

import type { GraphContentResponse, GraphContentNode } from "../../../domain/graph";

// BlockNote block types (simplified for generation)
interface InlineContent {
  type: string;
  text?: string;
  props?: {
    refId?: string;
    refTitle?: string;
    formula?: string;
  };
}

/**
 * Parse text containing $...$ inline math and $$...$$ block math
 * Returns an array of InlineContent items
 */
function parseTextWithMath(text: string): InlineContent[] {
  const content: InlineContent[] = [];

  // Match both inline ($...$) and display ($$...$$) math
  // Process display math first to avoid conflicts
  const mathPattern = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;

  let lastIndex = 0;
  let match;

  while ((match = mathPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore) {
        content.push({
          type: "text",
          text: textBefore,
        });
      }
    }

    // match[1] is display math ($$...$$), match[2] is inline math ($...$)
    const formula = match[1] || match[2];
    if (formula) {
      content.push({
        type: "inlineMath",
        props: {
          formula: formula.trim(),
        },
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) {
      content.push({
        type: "text",
        text: remaining,
      });
    }
  }

  // If no math found, return original text
  if (content.length === 0 && text) {
    content.push({
      type: "text",
      text: text,
    });
  }

  return content;
}

interface GeneratedBlock {
  id: string;
  type: "paragraph";
  props: Record<string, unknown>;
  content: InlineContent[];
  children: GeneratedBlock[];
}

/**
 * Build a map of nodeId -> prerequisite target node IDs
 * In prerequisites, from_node_id has prerequisites on to_node_id
 */
function buildPrerequisitesMap(
  prerequisites: GraphContentResponse["prerequisites"]
): Map<string, string[]> {
  const prereqMap = new Map<string, string[]>();

  for (const prereq of prerequisites) {
    const fromId = prereq.from_node_id;
    const toId = prereq.to_node_id;

    if (!prereqMap.has(fromId)) {
      prereqMap.set(fromId, []);
    }
    prereqMap.get(fromId)!.push(toId);
  }

  return prereqMap;
}

/**
 * Create inline content for a node, including prerequisites as references.
 */
function createNodeContent(
  node: GraphContentNode,
  prerequisiteTargets: string[],
  nodesMap: Map<string, GraphContentNode>
): InlineContent[] {
  const content: InlineContent[] = [];

  // Add node name
  content.push({
    type: "text",
    text: node.node_name,
  });

  // Add description if exists, parsing math formulas
  if (node.description && node.description.trim()) {
    content.push({
      type: "text",
      text: ": ",
    });
    const parsedContent = parseTextWithMath(node.description);
    content.push(...parsedContent);
  }

  // Add prerequisite references
  if (prerequisiteTargets.length > 0) {
    content.push({
      type: "text",
      text: " ",
    });

    for (const targetId of prerequisiteTargets) {
      const targetNode = nodesMap.get(targetId);
      if (targetNode) {
        content.push({
          type: "nodeReference",
          props: {
            refId: targetId,
            refTitle: targetNode.node_name,
          },
        });
        content.push({
          type: "text",
          text: " ",
        });
      }
    }
  }

  return content;
}

/**
 * Main conversion function: GraphContentResponse → BlockNote blocks
 */
export function graphContentToBlocks(
  data: GraphContentResponse
): GeneratedBlock[] {
  const { nodes, prerequisites } = data;

  const nodesMap = new Map(nodes.map((node) => [node.id, node]));
  const prerequisitesMap = buildPrerequisitesMap(prerequisites);

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.node_name.localeCompare(b.node_name);
  });

  return sortedNodes.map((node) => ({
    id: node.id,
    type: "paragraph",
    props: {},
    content: createNodeContent(
      node,
      prerequisitesMap.get(node.id) ?? [],
      nodesMap
    ),
    children: [],
  }));
}

/**
 * Get graph title from response
 */
export function getGraphTitle(data: GraphContentResponse): string {
  return data.graph.name;
}
