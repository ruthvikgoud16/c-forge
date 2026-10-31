import type { ToolId } from "@/domain/types";

export const TOOL_IDS: ToolId[] = ["syntax", "binary", "algorithm", "flowchart", "control-flow", "array-string", "recursion", "search-sort"];

export const TOOL_META: Record<ToolId, { name: string; blurb: string; glyph: string }> = {
  syntax: { name: "Syntax Explorer", blurb: "Identify the parts of a C program by hovering and selecting.", glyph: "{ }" },
  binary: { name: "Binary Lab", blurb: "Convert numbers and flip individual bits.", glyph: "01" },
  algorithm: { name: "Algorithm Stepper", blurb: "Step through an algorithm and watch its variables change.", glyph: "→" },
  flowchart: { name: "Flowchart Tracer", blurb: "Trace an execution path through flowchart symbols.", glyph: "◇" },
  "control-flow": { name: "Control-flow Explorer", blurb: "Run if/else and loops line by line.", glyph: "↻" },
  "array-string": { name: "Array & String Inspector", blurb: "See indexes, values and string operations.", glyph: "[ ]" },
  recursion: { name: "Recursion Stack", blurb: "Watch calls push and returns pop on the call stack.", glyph: "≡" },
  "search-sort": { name: "Search & Sort Lab", blurb: "Step through searches and five sorting algorithms.", glyph: "⇅" },
};
