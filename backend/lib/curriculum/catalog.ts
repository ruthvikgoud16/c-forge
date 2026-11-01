import { readFileSync } from "node:fs";
import { join } from "node:path";
import { packageForLesson, packageForTopic } from "@/lib/content/registry";

export type Classification = "OFFICIAL" | "SUPPORTING" | "EXTENSION" | "LEGACY_UNVERIFIED";

export type CatalogTopic = {
  id: string;
  ordinal?: number;
  sourceLabel?: string;
  sourceLabels?: string[];
  title: string;
  classification: Classification;
  lessonId?: string;
  needsHumanVerification?: boolean;
  accuracyNotes?: string[];
};

export type CatalogUnit = {
  id: string;
  slug: string;
  ordinal?: number;
  kind: "official" | "foundation";
  classification: Classification;
  sourceLabel: string;
  title: string;
  overview?: {
    teaches: string;
    why: string;
    prerequisites: string[];
    outcomes: string[];
    connectsTo: string;
    accuracyNotes?: string[];
  };
  topics: CatalogTopic[];
  notAnOfficialUnit?: boolean;
  sourceNote?: string;
  missingEntryCount?: number;
};

export type Catalog = {
  version: string;
  status: string;
  source: { type: string; pdfReceived: boolean; pdfPageReferences: string };
  units: CatalogUnit[];
  foundation: CatalogUnit;
};

let cached: Catalog | null = null;

export function loadCatalog(): Catalog {
  if (cached) return cached;
  const raw = readFileSync(join(process.cwd(), "content/curriculum/catalog.json"), "utf8");
  cached = JSON.parse(raw) as Catalog;
  return cached;
}

export function officialUnits() {
  return loadCatalog().units.filter((u) => u.kind === "official");
}

export function officialTopics() {
  return officialUnits().flatMap((u) => u.topics);
}

export function getUnit(slug: string) {
  const catalog = loadCatalog();
  if (slug === "foundation" || slug === catalog.foundation.slug) return catalog.foundation;
  return catalog.units.find((u) => u.slug === slug || u.id === slug);
}

export function getTopic(id: string) {
  const catalog = loadCatalog();
  for (const unit of [...catalog.units, catalog.foundation]) {
    const topic = unit.topics.find((t) => t.id === id);
    if (topic) {
      const pkg = packageForTopic(id);
      const withLesson = pkg && !topic.lessonId ? { ...topic, lessonId: pkg.lesson.id } : topic;
      return { unit, topic: withLesson };
    }
  }
  return null;
}

export function mindMapForUnit(unit: CatalogUnit) {
  return {
    title: unit.title,
    children: unit.topics.map((t) => ({
      id: t.id,
      title: t.title,
      classification: t.classification,
      href: packageForTopic(t.id)?.lesson.id
        ? `/learn/lessons/${packageForTopic(t.id)!.lesson.id}`
        : `/learn/topics/${t.id}`,
    })),
  };
}

export function loadLesson(id: string) {
  const fromPkg = packageForLesson(id);
  if (fromPkg) return fromPkg.lesson as Record<string, unknown> & { id: string; topicId: string };
  const path = join(process.cwd(), "content/curriculum/lessons", `${id}.json`);
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown> & { id: string; topicId: string };
  } catch {
    return null;
  }
}
