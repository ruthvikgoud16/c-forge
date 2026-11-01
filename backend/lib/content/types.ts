import type { LessonDocument } from "@/lib/curriculum/lesson-schema";
import type { PlacementMethod } from "@/lib/learning/types";
import type { ResourceAvailability } from "@/lib/learning/resources";

export type ResourceTypeId =
  | "deep_lesson"
  | "complete_notes"
  | "one_shot"
  | "mind_map"
  | "quick_notes"
  | "concept_library"
  | "flashcards"
  | "worked_examples"
  | "code_tracing"
  | "output_prediction"
  | "syntax_reference"
  | "visualisation"
  | "guided_practice"
  | "independent_practice"
  | "topic_assessment"
  | "revision"
  | "laboratory"
  | "related";

export type AssessmentFamily =
  | "concept"
  | "syntax"
  | "trace"
  | "predict"
  | "debug"
  | "algorithm"
  | "short_answer"
  | "coding";

export type AssessmentItem = {
  id: string;
  family: AssessmentFamily;
  method: PlacementMethod;
  prompt: string;
  choices?: string[];
  answer: string;
  marks: number;
  topicId: string;
  explanation: string;
};

export type Flashcard = { id: string; front: string; back: string; topicId: string };
export type ConceptEntry = { id: string; prompt: string; explanation: string; formal?: string; example?: string; topicId: string };
export type WorkedExample = { title: string; problem: string; steps: string[]; code?: string; output?: string };

export type TopicPackage = {
  topicId: string;
  unitId: string;
  version: string;
  provenance: "cforge_authored" | "existing_lesson" | "supplementary";
  officialLab: boolean;
  lesson: LessonDocument;
  notes: {
    introduction: string;
    definitions: Array<{ term: string; meaning: string }>;
    explanation: string;
    syntax: string;
    distinctions: string[];
    mistakes: string[];
    examShort: string[];
    examLong: string;
    revision: string[];
  };
  oneShot: {
    overview: string;
    sequence: string[];
    definitions: string[];
    rules: string[];
    walkthrough: string;
    takeaways: string[];
    endCheck: { prompt: string; answer: string };
  };
  quickNotes: string[];
  flashcards: Flashcard[];
  concepts: ConceptEntry[];
  examples: WorkedExample[];
  syntaxRows: Array<{ token: string; meaning: string }>;
  visualizerIds: string[];
  relatedTopicIds: string[];
  assessment: AssessmentItem[];
  practice?: { guided?: string; independent?: string; exerciseId?: string };
};

export type HubCard = {
  type: ResourceTypeId;
  title: string;
  availability: ResourceAvailability;
  href: string | null;
  note?: string;
};
