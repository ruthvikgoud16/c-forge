import { notFound, redirect } from "next/navigation";
import { loadLesson } from "@/lib/curriculum/catalog";
import { toPublicLesson } from "@/lib/curriculum/public-lesson";
import { topicState } from "@/lib/curriculum/progress";
import { readSession } from "@/lib/academy/session";
import { LessonPlayer } from "@/components/lesson-player";
import { StudyLinks } from "@/components/learn/study-links";
import { recordProgress } from "@/lib/curriculum/progress";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const lesson = loadLesson(id);
  if (!lesson) notFound();
  recordProgress({
    studentId: session.studentId,
    topicId: lesson.topicId,
    lessonId: lesson.id,
    kind: "lesson_opened",
    dimension: "concept",
    assisted: false,
  });
  return (
    <>
      <StudyLinks topicId={lesson.topicId} current="lesson" />
      <LessonPlayer
      lesson={toPublicLesson(lesson) as never}
      initialState={topicState(session.studentId, lesson.topicId)}
    />
    </>
  );
}
