import { createFileRoute } from "@tanstack/react-router";
import { TopicShell } from "@/components/learning/TopicShell";
import { SourceNotice } from "@/components/common/bits";
import { Flashcards } from "@/components/learning/Flashcards";
import { loadTopic, topicHead } from "@/lib/topic-loader";
import { services } from "@/services";

export const Route = createFileRoute("/learn/topics/$topicId/flashcards")({
  loader: async ({ params }) => ({ ...(await loadTopic(params.topicId)), cards: await services.flashcards.deck(params.topicId) }),
  head: ({ loaderData }) => topicHead(`Flashcards: ${loaderData?.topic.title ?? "Topic"}`, `Flashcard deck for ${loaderData?.topic.title ?? "this topic"}.`),
  component: Page,
});

function Page() {
  const { topic, unit, cards } = Route.useLoaderData();
  return (
    <TopicShell topic={topic} unit={unit} title={`Flashcards — ${topic.title}`}>
      <div className="mb-6"><SourceNotice what="This deck" /></div>
      <Flashcards key={topic.id} cards={cards} />
    </TopicShell>
  );
}
