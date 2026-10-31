import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { HeroScene } from "@/components/art/HeroScene";
import { CountUp, Reveal } from "@/components/art/motion";
import { Approach, AssessmentShowcase, CohortFlow, CurriculumShowcase, MindMapSection, ProgressShowcase, StudioShowcase, VisualiserBento } from "@/components/home/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CForge — Learn the logic. Forge the skill." },
      { name: "description", content: "A structured C programming academy for engineering students: five units, visual explanations, practice and assessments." },
      { property: "og:title", content: "CForge — C Programming Academy" },
      { property: "og:description", content: "Learn C through concepts, interactive visualisers, hands-on practice and assessments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <PublicLayout>
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="eyebrow cf-rise mb-4 inline-flex items-center gap-2 rounded-full glass-panel px-3 py-1"><span className="size-1.5 rounded-full bg-forest cf-pulse" />C programming academy · engineering cohort</p>
            <h1 className="cf-rise font-display text-5xl font-semibold leading-[1.02] md:text-7xl" style={{ animationDelay: "120ms" }}>
              Learn the logic.<br /><em className="bg-gradient-to-r from-copper to-ember bg-clip-text text-transparent">Forge</em> the skill.
            </h1>
            <p className="cf-rise mt-6 max-w-xl text-lg text-muted-foreground" style={{ animationDelay: "240ms" }}>
              CForge is a structured C programming academy built to help engineering students understand programming through concepts, visual explanations, hands-on practice and assessments.
            </p>
            <div className="cf-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "360ms" }}>
              <Button asChild variant="hero" size="lg" className="press rounded-full"><Link to="/login" data-testid="hero-student-login">Student Login <ArrowRight /></Link></Button>
              <Button asChild variant="quiet" size="lg" className="press rounded-full glass-panel"><a href="#approach" data-testid="hero-explore">Explore the Learning Experience</a></Button>
            </div>
            <dl className="cf-rise mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-foreground/10 pt-6" style={{ animationDelay: "480ms" }}>
              {([[5, "official units"], [31, "teaching packages"], [8, "visualisers"]] as const).map(([n, l]) => (
                <div key={l}><dt className="font-display text-4xl text-copper"><CountUp to={n} /></dt><dd className="text-xs text-muted-foreground">{l}</dd></div>
              ))}
            </dl>
          </div>
          <HeroScene />
        </div>
      </section>

      <Approach />
      <CurriculumShowcase />
      <MindMapSection />
      <VisualiserBento />
      <StudioShowcase />
      <AssessmentShowcase />
      <ProgressShowcase />
      <CohortFlow />

      <section className="px-4 pb-24 md:px-6">
        <Reveal className="surface-ink relative mx-auto max-w-6xl overflow-hidden rounded-[2rem]">
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-ember/30 blur-3xl cf-drift" aria-hidden />
          <div className="absolute -bottom-24 left-10 size-72 rounded-full bg-copper/40 blur-3xl cf-drift" style={{ animationDelay: "-8s" }} aria-hidden />
          <div className="relative flex flex-col items-start justify-between gap-6 px-8 py-16 md:flex-row md:items-center md:px-12">
            <div>
              <p className="font-mono text-xs text-ember">$ gcc forge.c -o skill && ./skill</p>
              <h2 className="mt-2 font-display text-4xl md:text-5xl">Ready to forge your logic?</h2>
            </div>
            <Button asChild variant="hero" size="lg" className="press rounded-full"><Link to="/login" data-testid="cta-student-login">Student Login <ArrowRight /></Link></Button>
          </div>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
