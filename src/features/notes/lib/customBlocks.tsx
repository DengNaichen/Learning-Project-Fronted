/**
 * Custom BlockNote blocks and inline content
 */

import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
} from "@blocknote/core";
import { createReactInlineContentSpec, createReactBlockSpec } from "@blocknote/react";
import { Link } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * NodeReference - Custom inline content for referencing other blocks
 * Renders as a purple pill with link icon, similar to Notion's @ mentions
 */
export const NodeReference = createReactInlineContentSpec(
  {
    type: "nodeReference",
    propSchema: {
      refId: {
        default: "",
      },
      refTitle: {
        default: "Unknown",
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { refId, refTitle } = props.inlineContent.props;

      const handleClick = () => {
        // Scroll to referenced block
        const element = document.querySelector(`[data-id="${refId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("highlight-block");
          setTimeout(() => {
            element.classList.remove("highlight-block");
          }, 2000);
        }
      };

      return (
        <span
          onClick={handleClick}
          style={{
            backgroundColor: "rgba(132, 0, 255, 0.15)",
            color: "#8b5cf6",
            padding: "2px 6px",
            borderRadius: "4px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.9em",
            fontWeight: 500,
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(132, 0, 255, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(132, 0, 255, 0.15)";
          }}
        >
          <Link size={12} />
          {refTitle}
        </span>
      );
    },
  }
);

/**
 * InlineMath - Inline math formula using KaTeX
 * Use $formula$ syntax to create inline math
 */
export const InlineMath = createReactInlineContentSpec(
  {
    type: "inlineMath",
    propSchema: {
      formula: {
        default: "",
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { formula } = props.inlineContent.props;
      let html = "";
      let error = false;

      try {
        html = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: false,
        });
      } catch (e) {
        error = true;
        html = formula;
      }

      if (error) {
        return (
          <span style={{ color: "red", fontFamily: "monospace" }}>
            {formula}
          </span>
        );
      }

      return (
        <span
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ display: "inline-block" }}
        />
      );
    },
  }
);

/**
 * MathBlock - Block-level math formula using KaTeX
 * Use /math command to insert a math block
 */
export const MathBlock = createReactBlockSpec(
  {
    type: "math",
    propSchema: {
      formula: {
        default: "",
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { formula } = props.block.props;
      let html = "";
      let error = false;

      try {
        html = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: true,
        });
      } catch (e) {
        error = true;
      }

      const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        props.editor.updateBlock(props.block, {
          props: { formula: e.target.value },
        });
      };

      return (
        <div
          style={{
            padding: "16px",
            backgroundColor: "rgba(0, 0, 0, 0.03)",
            borderRadius: "8px",
            margin: "8px 0",
          }}
        >
          {props.editor.isEditable ? (
            <div>
              <textarea
                value={formula}
                onChange={handleChange}
                placeholder="Enter LaTeX formula..."
                style={{
                  width: "100%",
                  minHeight: "60px",
                  padding: "8px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  marginBottom: "8px",
                  backgroundColor: "transparent",
                  resize: "vertical",
                }}
              />
              {formula && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "8px",
                    overflow: "auto",
                  }}
                >
                  {error ? (
                    <span style={{ color: "red" }}>Invalid formula</span>
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: html }} />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "8px",
                overflow: "auto",
              }}
            >
              {error || !formula ? (
                <span style={{ color: "#9ca3af" }}>Empty formula</span>
              ) : (
                <span dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
          )}
        </div>
      );
    },
  }
)();

/**
 * Custom schema with NodeReference inline content
 *
 * Block Structure:
 * - Use heading blocks as section titles (parent blocks)
 * - Use Tab to indent content under headings (create children)
 * - Only leaf blocks (no children) can be referenced
 */
export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    math: MathBlock,
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    nodeReference: NodeReference,
    inlineMath: InlineMath,
  },
});

export type CustomSchema = typeof customSchema;
