"use client";

import Editor from "@monaco-editor/react";

export default function CEditorInner({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Editor
      height="360px"
      language="c"
      theme="vs-dark"
      value={value}
      onChange={(next) => onChange(next ?? "")}
      options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
    />
  );
}
