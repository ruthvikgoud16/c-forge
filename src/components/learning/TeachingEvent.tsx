import { useEffect } from "react";
import { services } from "@/services";
import type { ContentSource } from "@/domain/types";
import type { TeachingProgressKind } from "@/lib/progress-events";

export function TeachingEvent({ topicId, kind, source }: { topicId: string; kind: TeachingProgressKind; source: ContentSource }) {
  useEffect(() => {
    if (source !== "original") return;
    void services.progress.recordTeachingEvent(topicId, kind);
  }, [topicId, kind, source]);
  return null;
}
