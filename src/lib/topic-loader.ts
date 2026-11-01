import { notFound } from "@tanstack/react-router";
import { services } from "@/services";

export async function requireTopicMaterial<T>(value: T | null | undefined): Promise<T> {
  if (value == null) throw notFound();
  return value;
}

export async function loadTopic(topicId: string) {
  const topic = await services.curriculum.topic(topicId);
  if (!topic) throw notFound();
  const unit = topic.unitId === "supplementary" ? null : await services.curriculum.unit(topic.unitId);
  const { prev, next } = await services.curriculum.neighbours(topicId);
  const teaching = await services.teaching.forTopic(topicId).catch(() => null);
  return { topic, unit, prev, next, teaching };
}

export function topicHead(title: string, desc: string) {
  return {
    meta: [
      { title: `${title} — CForge` },
      { name: "description", content: desc },
      { property: "og:title", content: `${title} — CForge` },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
