import { createFileRoute } from "@tanstack/react-router";
import { TopicShell } from "@/components/learning/TopicShell";
import { MindMapView } from "@/components/learning/MindMapView";
import { loadTopic, topicHead } from "@/lib/topic-loader";
import { services } from "@/services";

export const Route = createFileRoute("/learn/topics/$topicId/mind-map")({
  loader: async ({ params }) => ({ ...(await loadTopic(params.topicId)), map: (await services.curriculum.topicMindMap(params.topicId))! }),
  head: ({ loaderData }) => topicHead(`Mind map: ${loaderData?.topic.title ?? "Topic"}`, `Concept map for ${loaderData?.topic.title ?? "this topic"}.`),
  component: Page,
});

function Page() {
  const { topic, unit, map } = Route.useLoaderData();
  return <TopicShell topic={topic} unit={unit} title={`Mind map — ${topic.title}`}><MindMapView key={map.id} map={map} /></TopicShell>;
}
