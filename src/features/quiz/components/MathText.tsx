// Component to render text with LaTeX formulas using KaTeX
import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Process the text to find and render LaTeX formulas
      const processedHTML = processLatex(text);
      containerRef.current.innerHTML = processedHTML;
    } catch (error) {
      console.error("Error rendering LaTeX:", error);
      containerRef.current.textContent = text;
    }
  }, [text]);

  return <div ref={containerRef} className={className} />;
};

// Process text containing LaTeX formulas
function processLatex(text: string): string {
  let result = text;

  // Process display math ($$...$$) first
  result = result.replace(/\$\$(.+?)\$\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula, {
        displayMode: true,
        throwOnError: false,
      });
    } catch (e) {
      return `$$${formula}$$`;
    }
  });

  // Process inline math ($...$)
  result = result.replace(/\$(.+?)\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula, {
        displayMode: false,
        throwOnError: false,
      });
    } catch (e) {
      return `$${formula}$`;
    }
  });

  return result;
}
