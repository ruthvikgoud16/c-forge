"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(() => import("./c-editor-inner"), { ssr: false });

export function CEditor(props: { value: string; onChange: (value: string) => void }) {
  return <Inner {...props} />;
}
