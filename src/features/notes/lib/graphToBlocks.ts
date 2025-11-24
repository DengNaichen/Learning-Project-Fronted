/**
 * Convert GraphContentResponse to BlockNote blocks
 *
 * This module transforms backend graph data into a hierarchical
 * block structure compatible with BlockNoteEditor.
 *
 * Mapping:
 * - subtopics → block children (nesting)
 * - prerequisites → nodeReference inline content
 * - node.node_name → paragraph text
 * - node.description → appended to text content
 */

import type { GraphContentResponse, GraphContentNode } from "../../graphs/types/graph";

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
 * Build a map of parent -> children from subtopics
 */
function buildChildrenMap(
  subtopics: GraphContentResponse["subtopics"]
): Map<string, string[]> {
  const childrenMap = new Map<string, string[]>();

  for (const subtopic of subtopics) {
    const parentId = subtopic.parent_node_id;
    const childId = subtopic.child_node_id;

    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(childId);
  }

  return childrenMap;
}

/**
 * Build a map of nodeId -> prerequisite target node IDs
 * In prerequisites, from_node_id has prerequisites on to_node_id
 * So from_node_id should reference to_node_id
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
 * Find root nodes (nodes that are not children of any other node)
 */
function findRootNodes(
  nodes: GraphContentNode[],
  subtopics: GraphContentResponse["subtopics"]
): string[] {
  const allChildIds = new Set(subtopics.map(s => s.child_node_id));

  // Root nodes are nodes that are never a child
  const rootIds = nodes
    .filter(node => !allChildIds.has(node.id))
    .map(node => node.id);

  return rootIds;
}

/**
 * Create inline content for a node, including prerequisites as references
 * Parses $...$ and $$...$$ math formulas in the description
 */
function createNodeContent(
  node: GraphContentNode,
  prerequisiteTargets: string[],
  nodesMap: Map<string, GraphContentNode>,
  leafNodeIds: Set<string>
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
    // Parse the description for math formulas
    const parsedContent = parseTextWithMath(node.description);
    content.push(...parsedContent);
  }

  // Add prerequisite references (only if target is a leaf node)
  if (prerequisiteTargets.length > 0) {
    content.push({
      type: "text",
      text: " ",
    });

    for (const targetId of prerequisiteTargets) {
      // Only reference leaf nodes
      if (leafNodeIds.has(targetId)) {
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
  }

  return content;
}

/**
 * Recursively build blocks from a node and its children
 */
function buildBlockFromNode(
  nodeId: string,
  nodesMap: Map<string, GraphContentNode>,
  childrenMap: Map<string, string[]>,
  prerequisitesMap: Map<string, string[]>,
  leafNodeIds: Set<string>
): GeneratedBlock | null {
  const node = nodesMap.get(nodeId);
  if (!node) return null;

  const directChildIds = childrenMap.get(nodeId) || [];
  const prerequisiteTargets = prerequisitesMap.get(nodeId) || [];

  // Build children blocks recursively
  const childBlocks: GeneratedBlock[] = [];
  for (const childId of directChildIds) {
    const childBlock = buildBlockFromNode(
      childId,
      nodesMap,
      childrenMap,
      prerequisitesMap,
      leafNodeIds
    );
    if (childBlock) {
      childBlocks.push(childBlock);
    }
  }

  // Create the block
  const block: GeneratedBlock = {
    id: nodeId,
    type: "paragraph",
    props: {},
    content: createNodeContent(node, prerequisiteTargets, nodesMap, leafNodeIds),
    children: childBlocks,
  };

  return block;
}

/**
 * Identify all leaf node IDs (nodes with no children)
 */
function findLeafNodeIds(
  nodes: GraphContentNode[],
  childrenMap: Map<string, string[]>
): Set<string> {
  const leafIds = new Set<string>();

  for (const node of nodes) {
    const children = childrenMap.get(node.id) || [];
    if (children.length === 0) {
      leafIds.add(node.id);
    }
  }

  return leafIds;
}

/**
 * Main conversion function: GraphContentResponse → BlockNote blocks
 */
export function graphContentToBlocks(
  data: GraphContentResponse
): GeneratedBlock[] {
  const { nodes, prerequisites, subtopics } = data;

  // Build lookup maps
  const nodesMap = new Map(nodes.map(n => [n.id, n]));
  const childrenMap = buildChildrenMap(subtopics);
  const prerequisitesMap = buildPrerequisitesMap(prerequisites);
  const leafNodeIds = findLeafNodeIds(nodes, childrenMap);

  // Find root nodes
  const rootIds = findRootNodes(nodes, subtopics);

  // Build blocks starting from roots
  const blocks: GeneratedBlock[] = [];
  for (const rootId of rootIds) {
    const block = buildBlockFromNode(
      rootId,
      nodesMap,
      childrenMap,
      prerequisitesMap,
      leafNodeIds
    );
    if (block) {
      blocks.push(block);
    }
  }

  return blocks;
}

/**
 * Get graph title from response
 */
export function getGraphTitle(data: GraphContentResponse): string {
  return data.graph.name;
}
