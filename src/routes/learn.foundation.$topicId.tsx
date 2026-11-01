import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/bits";
import { classificationLabel } from "@/lib/foundation";
import { services } from "@/services";

export const Route = createFileRoute("/learn/foundation/$topicId")({
  loader: async ({ params }) => ({
    topic: await services.foundation.topic(params.topicId),
    id: params.topicId,
  }),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.topic?.title ?? "Foundation label"} — CForge` }],
  }),
  component: FoundationTopicPage,
});

function FoundationTopicPage() {
  const { topic, id } = Route.useLoaderData();
  if (!topic) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Foundation"
          title="Unknown label"
          lede={`“${id}” is not one of the readable foundation labels.`}
          crumbs={[
            { label: "Learn", to: "/learn" },
            { label: "Foundation", to: "/learn/foundation" },
            { label: id },
          ]}
        />
        <p className="glass-panel rounded-3xl p-6 text-sm text-muted-foreground" data-testid="foundation-unknown">
          No lesson or description is invented for an unknown identifier.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Foundation label"
        title={topic.title}
        lede="This is a catalog label. Opening it is not mastery and not a completed lesson."
        crumbs={[
          { label: "Learn", to: "/learn" },
          { label: "Foundation", to: "/learn/foundation" },
          { label: topic.title },
        ]}
      />
      <section className="glass-panel rounded-[1.75rem] p-6" data-testid="foundation-topic-detail">
        <p className="font-mono text-xs text-muted-foreground">{topic.id} · {classificationLabel(topic.classification)}</p>
        {topic.sourceLabels.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Source: {topic.sourceLabels.join(" ")}</p>
        )}
        {topic.accuracyNotes.map((note) => (
          <p key={note} className="mt-2 text-sm text-muted-foreground">{note}</p>
        ))}
        {topic.hasLessonBody ? (
          <p className="mt-4 text-sm">The catalog lists a lesson identifier for this label. Opening it is not a completed official unit.</p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No lesson body exists for this label. A lesson screen is not fabricated.</p>
        )}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link to="/learn/foundation" className="text-copper hover:underline">Back to foundation</Link>
          <Link to="/learn/units" className="text-copper hover:underline">Official units</Link>
        </div>
      </section>
    </div>
  );
}
