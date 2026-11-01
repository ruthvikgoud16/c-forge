import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DemoBadge, PageHeader } from "@/components/common/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reveal } from "@/components/art/motion";
import { MEMORY_NOTE, type PaperQuestionInput } from "@/lib/resources";
import { IS_DEMO, services } from "@/services";
import { rethrowIfRedirect } from "@/services/cforge-api";

export const Route = createFileRoute("/faculty/papers")({
  head: () => ({ meta: [{ title: "Faculty Papers — CForge" }] }),
  component: FacultyPapersPage,
});

const emptyQuestion = (): PaperQuestionInput => ({ text: "", topicId: "", marks: "", pageRef: "" });

function FacultyPapersPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error: loadError } = useQuery({ queryKey: ["faculty-papers"], queryFn: () => services.facultyResources.papers(), retry: false });
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [examType, setExamType] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [questions, setQuestions] = useState<PaperQuestionInput[]>([emptyQuestion()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await services.facultyResources.addPaper({ academicYear, semester, examType, sourceRef, questions });
      setOk(result.demo
        ? "Stored in this demo session only. Not sent to the CForge backend. Trends are not invented."
        : `Stored. Trends are not invented. ${MEMORY_NOTE}`);
      setAcademicYear("");
      setSemester("");
      setExamType("");
      setSourceRef("");
      setQuestions([emptyQuestion()]);
      await qc.invalidateQueries({ queryKey: ["faculty-papers"] });
    } catch (cause) {
      rethrowIfRedirect(cause);
      setError(cause instanceof Error ? cause.message : "Could not store the paper.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Faculty · papers"
        title={<>Ingest a <em className="text-copper">paper</em></>}
        lede="This sends JSON to the existing faculty papers endpoint. There is no PDF upload, OCR, edit, or delete."
        actions={IS_DEMO ? <DemoBadge>Demo — not the CForge backend</DemoBadge> : undefined}
      />
      <p className="text-sm text-muted-foreground">{IS_DEMO ? "Demo papers stay in this browser session." : MEMORY_NOTE}</p>

      <section className="glass-panel rounded-[1.75rem] p-6">
        <h2 className="font-display text-2xl">Required fields</h2>
        <p className="mt-1 text-sm text-muted-foreground">academicYear, sourceRef, and at least one question text are required. semester and examType are optional.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="paper-year">Academic year</Label>
            <Input id="paper-year" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025-26" />
          </div>
          <div>
            <Label htmlFor="paper-sem">Semester (optional)</Label>
            <Input id="paper-sem" value={semester} onChange={(e) => setSemester(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="paper-exam">Exam type (optional)</Label>
            <Input id="paper-exam" value={examType} onChange={(e) => setExamType(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="paper-source">Source reference</Label>
            <Input id="paper-source" value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} />
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="rounded-3xl bg-white/40 p-4">
              <Label htmlFor={`q-${i}`}>Question {i + 1} text</Label>
              <Textarea id={`q-${i}`} value={q.text} rows={3} onChange={(e) => setQuestions((rows) => rows.map((row, idx) => idx === i ? { ...row, text: e.target.value } : row))} />
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <Input placeholder="topic id (optional)" value={q.topicId ?? ""} onChange={(e) => setQuestions((rows) => rows.map((row, idx) => idx === i ? { ...row, topicId: e.target.value } : row))} />
                <Input placeholder="marks (optional)" value={q.marks ?? ""} onChange={(e) => setQuestions((rows) => rows.map((row, idx) => idx === i ? { ...row, marks: e.target.value } : row))} />
                <Input placeholder="page ref (optional)" value={q.pageRef ?? ""} onChange={(e) => setQuestions((rows) => rows.map((row, idx) => idx === i ? { ...row, pageRef: e.target.value } : row))} />
              </div>
            </div>
          ))}
          <Button variant="quiet" type="button" onClick={() => setQuestions((rows) => [...rows, emptyQuestion()])}>Add another question</Button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        {ok && <p className="mt-3 text-sm text-muted-foreground" data-testid="paper-stored">{ok}</p>}
        <Button variant="hero" className="mt-4" disabled={busy} onClick={submit} data-testid="paper-submit">
          {busy ? "Storing…" : "Store paper JSON"}
        </Button>
      </section>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading stored papers…</p> : isError ? (
        <p className="glass-panel rounded-3xl p-5 text-sm text-muted-foreground">{loadError instanceof Error ? loadError.message : "The faculty papers API did not return a list."}</p>
      ) : (
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Stored papers</h2>
          {(data?.papers.length ?? 0) === 0 ? (
            <p className="glass-panel rounded-3xl p-5 text-sm text-muted-foreground" data-testid="faculty-papers-empty">No papers are in process memory yet.</p>
          ) : data?.papers.map((paper, i) => (
            <Reveal key={paper.id} delay={i * 40} className="glass-panel rounded-3xl p-5">
              <p className="eyebrow">{paper.academicYear}{paper.semester ? ` · ${paper.semester}` : ""}{paper.examType ? ` · ${paper.examType}` : ""}</p>
              <h3 className="font-display text-xl">{paper.sourceRef}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{paper.questions.length} recorded question{paper.questions.length === 1 ? "" : "s"}</p>
              <ol className="mt-3 space-y-2 text-sm">
                {paper.questions.map((q) => (
                  <li key={q.id || q.text} className="rounded-2xl bg-white/40 px-3 py-2">
                    <p>{q.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{q.kind.replaceAll("_", " ")}{q.topicId ? ` · ${q.topicId}` : ""}{q.marks != null ? ` · ${q.marks} marks` : ""}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-muted-foreground">No PDF upload, edit, or delete is offered.</p>
            </Reveal>
          ))}
        </section>
      )}
    </div>
  );
}
