"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Flag,
  GraduationCap,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  SkipForward,
  Square,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildMixedExam,
  exerciseTopics,
  getExercisesForTopic,
  shuffleExercises,
  type ExamExercise,
} from "@/lib/exercise-bank";
import { createId, todayKey } from "@/lib/storage";
import type { StudyData } from "@/lib/types";

type UpdateData = (updater: (current: StudyData) => StudyData) => void;
type SessionPhase = "setup" | "running" | "paused" | "summary";

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#153f36] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0e332b] disabled:cursor-not-allowed disabled:opacity-45";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#d8dad4] bg-white px-4 py-2.5 text-sm font-bold text-[#26332f] transition hover:border-[#aeb7b2] hover:bg-[#fafaf7] disabled:cursor-not-allowed disabled:opacity-45";
const formatCountdown = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (hours) return `${hours}:${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
};

function ViewHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#de6b48]">{eyebrow}</p>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.035em] text-[#17211f] sm:text-[2.15rem]">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#68736f] sm:text-[0.95rem]">{description}</p>
    </div>
  );
}

function ExerciseViewer({ exercise }: { exercise: ExamExercise }) {
  const originalPageUrl = `${exercise.pdfUrl}#page=${exercise.page}&zoom=page-width`;
  const embeddedPageUrl = `/api/exercise-pdf?topic=${encodeURIComponent(exercise.topicId)}#page=${exercise.page}&zoom=page-width`;

  return (
    <div className="card overflow-hidden rounded-[16px]">
      <div className="flex flex-col gap-3 border-b border-[#e5e7e1] bg-[#fffefb] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e5f4ed] px-2.5 py-1 text-xs font-extrabold text-[#277454]">{exercise.topicName}</span>
            <span className="rounded-full bg-[#f2eee5] px-2.5 py-1 text-xs font-extrabold text-[#765f30]">Exercício {exercise.exerciseNumber}</span>
          </div>
          <p className="mt-2 text-sm font-bold text-[#26332f]">{exercise.source}</p>
          <p className="mt-1 text-xs leading-5 text-[#7b8581]">Resolve apenas o exercício indicado; a página pode conter outros enunciados.</p>
        </div>
        <a href={originalPageUrl} target="_blank" rel="noreferrer" className={`${secondaryButton} shrink-0`}>
          <ExternalLink size={16} />Abrir original
        </a>
      </div>
      <iframe
        key={exercise.id}
        src={embeddedPageUrl}
        title={`Exercício ${exercise.exerciseNumber} — ${exercise.source}`}
        className="h-[560px] w-full bg-white sm:h-[680px]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e5e7e1] bg-[#f9f8f3] px-4 py-3 text-xs text-[#737d79] sm:px-5">
        <span>Fonte: Matemática? Absolutamente!</span>
        <a
          href="https://mat.absolutamente.net/wp/compilacoes-mat-a-12/"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-[#356f5b] hover:text-[#153f36]"
        >
          Ver compilações originais
        </a>
      </div>
    </div>
  );
}

function SessionTimer({ secondsLeft, phase }: { secondsLeft: number; phase: SessionPhase }) {
  return (
    <div className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-[11px] bg-[#153f36] px-4 py-3 text-white shadow-sm">
      <Clock3 size={18} className="text-[#bdd0ca]" />
      <span className="font-display text-xl font-semibold tabular-nums tracking-[-0.03em]">{formatCountdown(secondsLeft)}</span>
      {phase === "paused" && <span className="sr-only">Em pausa</span>}
    </div>
  );
}

function SessionSummary({
  title,
  correct,
  wrong,
  skipped,
  onRestart,
}: {
  title: string;
  correct: number;
  wrong: number;
  skipped: number;
  onRestart: () => void;
}) {
  const total = correct + wrong + skipped;
  const success = correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 0;

  return (
    <div className="card rounded-[16px] p-6 text-center sm:p-9">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#e5f4ed] text-[#277454]">
        <CheckCircle2 size={27} />
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[#75807c]">O resultado já ficou guardado e sincronizado com a tua conta.</p>
      <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Vistos" value={total} color="#153f36" />
        <SummaryStat label="Certos" value={correct} color="#277454" />
        <SummaryStat label="Errados" value={wrong} color="#b94b45" />
        <SummaryStat label="Acerto" value={`${success}%`} color="#c07d2e" />
      </div>
      <button type="button" onClick={onRestart} className={`${primaryButton} mt-7`}>
        <RotateCcw size={17} />Começar outra sessão
      </button>
    </div>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-[12px] border border-[#e1e2dc] bg-[#faf9f5] p-4">
      <p className="font-display text-2xl font-semibold" style={{ color }}>{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#808986]">{label}</p>
    </div>
  );
}

export function PracticeView({ updateData }: { updateData: UpdateData }) {
  const [topicId, setTopicId] = useState(exerciseTopics[0].id);
  const [duration, setDuration] = useState(45);
  const [phase, setPhase] = useState<SessionPhase>("setup");
  const [secondsLeft, setSecondsLeft] = useState(45 * 60);
  const deadlineRef = useRef<number | null>(null);
  const [queue, setQueue] = useState<ExamExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const topic = exerciseTopics.find((item) => item.id === topicId) ?? exerciseTopics[0];
  const currentExercise = queue[currentIndex];

  const syncPracticeWithClock = useCallback(() => {
    if (deadlineRef.current === null) return;
    setSecondsLeft(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    syncPracticeWithClock();
    const interval = window.setInterval(syncPracticeWithClock, 1000);
    window.addEventListener("focus", syncPracticeWithClock);
    document.addEventListener("visibilitychange", syncPracticeWithClock);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncPracticeWithClock);
      document.removeEventListener("visibilitychange", syncPracticeWithClock);
    };
  }, [phase, syncPracticeWithClock]);

  const finishPractice = useCallback(() => {
    if (phase !== "running" && phase !== "paused") return;
    const remaining = phase === "running" && deadlineRef.current !== null
      ? Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
      : secondsLeft;
    const elapsed = duration * 60 - remaining;
    const attempted = results.correct + results.wrong;
    deadlineRef.current = null;

    if (elapsed > 0 || attempted > 0) {
      updateData((current) => ({
        ...current,
        exerciseLogs: attempted > 0
          ? [...current.exerciseLogs, {
              id: createId(),
              topic: topic.name,
              total: attempted,
              correct: results.correct,
              wrong: results.wrong,
              date: todayKey(),
            }]
          : current.exerciseLogs,
        studySessions: elapsed > 0
          ? [...current.studySessions, { id: createId(), seconds: elapsed, date: todayKey() }]
          : current.studySessions,
      }));
    }
    setPhase("summary");
  }, [duration, phase, results, secondsLeft, topic.name, updateData]);

  useEffect(() => {
    if (phase !== "running" || secondsLeft !== 0) return;
    const completion = window.setTimeout(finishPractice, 0);
    return () => window.clearTimeout(completion);
  }, [finishPractice, phase, secondsLeft]);

  const startPractice = () => {
    setQueue(shuffleExercises(getExercisesForTopic(topicId)));
    setCurrentIndex(0);
    setResults({ correct: 0, wrong: 0, skipped: 0 });
    setSecondsLeft(duration * 60);
    deadlineRef.current = Date.now() + duration * 60 * 1000;
    setPhase("running");
  };

  const togglePracticePause = () => {
    if (phase === "running") {
      const remaining = deadlineRef.current === null
        ? secondsLeft
        : Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      deadlineRef.current = null;
      setSecondsLeft(remaining);
      setPhase("paused");
      return;
    }

    deadlineRef.current = Date.now() + secondsLeft * 1000;
    setPhase("running");
  };

  const markAndContinue = (result: "correct" | "wrong" | "skipped") => {
    setResults((current) => ({ ...current, [result]: current[result] + 1 }));

    if (currentIndex >= queue.length - 1) {
      const nextBatch = shuffleExercises(getExercisesForTopic(topicId)).filter((exercise) => exercise.id !== currentExercise?.id);
      setQueue((current) => [...current, ...nextBatch]);
    }
    setCurrentIndex((current) => current + 1);
  };

  const reset = () => {
    deadlineRef.current = null;
    setPhase("setup");
    setSecondsLeft(duration * 60);
    setQueue([]);
    setCurrentIndex(0);
  };

  return (
    <>
      <ViewHeading
        eyebrow="Prática guiada"
        title="Treino por tema"
        description="Escolhe um tema e trabalha contra o relógio. Cada resposta fica registada automaticamente no teu histórico de exercícios."
      />

      {phase === "setup" && (
        <div className="grid items-start gap-5 xl:grid-cols-[1fr_360px]">
          <div className="card rounded-[16px] p-5 sm:p-7">
            <h2 className="font-display text-xl font-semibold">O que queres praticar?</h2>
            <p className="mt-1 text-sm text-[#7a8480]">O exercício é sorteado a partir das compilações de exames nacionais.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {exerciseTopics.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTopicId(item.id)}
                  className={`rounded-[12px] border p-4 text-left transition ${
                    topicId === item.id
                      ? "border-[#3d7965] bg-[#eaf3ef] shadow-[0_0_0_1px_#3d7965]"
                      : "border-[#dedfd8] bg-white hover:border-[#aeb9b3]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3 text-sm font-extrabold text-[#26332f]">
                    {item.name}
                    {topicId === item.id && <Check size={17} className="text-[#277454]" />}
                  </span>
                  <span className="mt-1.5 block text-xs leading-5 text-[#7a8480]">{item.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card rounded-[16px] p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">Duração</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[25, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setDuration(minutes)}
                  className={`rounded-[10px] border px-2 py-3 text-sm font-extrabold transition ${
                    duration === minutes ? "border-[#153f36] bg-[#153f36] text-white" : "border-[#d8dad4] bg-white text-[#52615c]"
                  }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-[12px] bg-[#f3f2ec] p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#74807b]">Sessão preparada</p>
              <p className="mt-2 font-bold text-[#26332f]">{topic.name}</p>
              <p className="mt-1 text-sm text-[#7a8480]">{getExercisesForTopic(topicId).length} exercícios disponíveis</p>
            </div>
            <button type="button" onClick={startPractice} className={`${primaryButton} mt-5 w-full`}>
              <Play size={18} />Começar treino de {duration} min
            </button>
          </div>
        </div>
      )}

      {(phase === "running" || phase === "paused") && currentExercise && (
        <div className="space-y-4">
          <div className="card flex flex-col gap-3 rounded-[14px] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#78837f]">{topic.name}</p>
              <p className="mt-1 text-sm text-[#53605c]">
                {results.correct + results.wrong + results.skipped} exercícios vistos · {results.correct} certos · {results.wrong} errados
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SessionTimer secondsLeft={secondsLeft} phase={phase} />
              <button
                type="button"
                onClick={togglePracticePause}
                className={secondaryButton}
              >
                {phase === "running" ? <Pause size={17} /> : <Play size={17} />}
                {phase === "running" ? "Pausar" : "Continuar"}
              </button>
              <button type="button" onClick={finishPractice} className={secondaryButton}>
                <Square size={16} />Terminar
              </button>
            </div>
          </div>

          {phase === "paused" ? (
            <div className="card flex min-h-[430px] flex-col items-center justify-center rounded-[16px] p-8 text-center">
              <Pause size={34} className="text-[#c07d2e]" />
              <h2 className="mt-4 font-display text-2xl font-semibold">Sessão em pausa</h2>
              <p className="mt-2 text-sm text-[#7a8480]">O enunciado fica escondido até retomares o treino.</p>
              <button type="button" onClick={togglePracticePause} className={`${primaryButton} mt-6`}><Play size={17} />Continuar</button>
            </div>
          ) : (
            <>
              <ExerciseViewer exercise={currentExercise} />
              <div className="card sticky bottom-3 z-20 grid gap-2 rounded-[14px] p-3 shadow-[0_12px_32px_rgba(23,33,31,0.16)] sm:grid-cols-3 sm:p-4">
                <button type="button" onClick={() => markAndContinue("wrong")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-[#edc8c5] bg-[#fcebea] px-4 text-sm font-extrabold text-[#a8433e] hover:bg-[#f9dfdc]">
                  <X size={18} />Errei
                </button>
                <button type="button" onClick={() => markAndContinue("skipped")} className={secondaryButton}>
                  <SkipForward size={17} />Saltar
                </button>
                <button type="button" onClick={() => markAndContinue("correct")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-[#277454] px-4 text-sm font-extrabold text-white hover:bg-[#1f6246]">
                  <Check size={19} />Acertei
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === "summary" && (
        <SessionSummary
          title="Treino terminado"
          correct={results.correct}
          wrong={results.wrong}
          skipped={results.skipped}
          onRestart={reset}
        />
      )}
    </>
  );
}

type ExamMark = "correct" | "wrong" | null;

export function MockSimulationView({ updateData }: { updateData: UpdateData }) {
  const [phase, setPhase] = useState<SessionPhase>("setup");
  const [secondsLeft, setSecondsLeft] = useState(120 * 60);
  const deadlineRef = useRef<number | null>(null);
  const [questions, setQuestions] = useState<ExamExercise[]>([]);
  const [marks, setMarks] = useState<ExamMark[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const correct = marks.filter((mark) => mark === "correct").length;
  const wrong = marks.filter((mark) => mark === "wrong").length;
  const unanswered = marks.filter((mark) => mark === null).length;
  const currentExercise = questions[currentIndex];
  const topicCount = useMemo(() => new Set(questions.map((question) => question.topicId)).size, [questions]);

  const syncExamWithClock = useCallback(() => {
    if (deadlineRef.current === null) return;
    setSecondsLeft(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    syncExamWithClock();
    const interval = window.setInterval(syncExamWithClock, 1000);
    window.addEventListener("focus", syncExamWithClock);
    document.addEventListener("visibilitychange", syncExamWithClock);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncExamWithClock);
      document.removeEventListener("visibilitychange", syncExamWithClock);
    };
  }, [phase, syncExamWithClock]);

  const finishExam = useCallback(() => {
    if (phase !== "running" && phase !== "paused") return;
    const remaining = phase === "running" && deadlineRef.current !== null
      ? Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
      : secondsLeft;
    const elapsed = 120 * 60 - remaining;
    const score = questions.length ? Number(((correct / questions.length) * 20).toFixed(1)) : 0;
    deadlineRef.current = null;

    updateData((current) => ({
      ...current,
      mockExams: questions.length
        ? [...current.mockExams, { id: createId(), name: "Simulação automática", score, date: todayKey() }]
        : current.mockExams,
      studySessions: elapsed > 0
        ? [...current.studySessions, { id: createId(), seconds: elapsed, date: todayKey() }]
        : current.studySessions,
    }));
    setPhase("summary");
  }, [correct, phase, questions.length, secondsLeft, updateData]);

  useEffect(() => {
    if (phase !== "running" || secondsLeft !== 0) return;
    const completion = window.setTimeout(finishExam, 0);
    return () => window.clearTimeout(completion);
  }, [finishExam, phase, secondsLeft]);

  const startExam = () => {
    const nextQuestions = buildMixedExam(12);
    setQuestions(nextQuestions);
    setMarks(Array.from({ length: nextQuestions.length }, () => null));
    setCurrentIndex(0);
    setSecondsLeft(120 * 60);
    deadlineRef.current = Date.now() + 120 * 60 * 1000;
    setPhase("running");
  };

  const toggleExamPause = () => {
    if (phase === "running") {
      const remaining = deadlineRef.current === null
        ? secondsLeft
        : Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      deadlineRef.current = null;
      setSecondsLeft(remaining);
      setPhase("paused");
      return;
    }

    deadlineRef.current = Date.now() + secondsLeft * 1000;
    setPhase("running");
  };

  const markQuestion = (mark: Exclude<ExamMark, null>) => {
    setMarks((current) => current.map((value, index) => index === currentIndex ? mark : value));
    if (currentIndex < questions.length - 1) setCurrentIndex((index) => index + 1);
  };

  const reset = () => {
    deadlineRef.current = null;
    setPhase("setup");
    setSecondsLeft(120 * 60);
    setQuestions([]);
    setMarks([]);
    setCurrentIndex(0);
  };

  return (
    <>
      <ViewHeading
        eyebrow="Prova completa"
        title="Simulação de exame"
        description="A aplicação cria uma prova de 120 minutos com 12 exercícios de vários temas, anos e fases. No final, a nota é guardada nos simulados."
      />

      {phase === "setup" && (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[16px] bg-[#153f36] p-6 text-white sm:p-8">
            <GraduationCap size={34} className="text-[#bdd0ca]" />
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.035em]">Simulado personalizado</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#c9d8d3]">
              Cada prova é diferente. Os exercícios são escolhidos de forma equilibrada entre os temas e, sempre que possível, sem repetir o mesmo exame.
            </p>
            <button type="button" onClick={startExam} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-white px-5 text-sm font-extrabold text-[#153f36] hover:bg-[#eff4f1]">
              <Shuffle size={18} />Gerar e começar exame
            </button>
          </div>
          <div className="card rounded-[16px] p-5 sm:p-7">
            <h2 className="font-display text-xl font-semibold">Condições da prova</h2>
            <div className="mt-5 space-y-4">
              <ExamCondition icon={<Clock3 size={19} />} title="120 minutos" text="O cronómetro começa quando geras a prova." />
              <ExamCondition icon={<FileText size={19} />} title="12 exercícios" text="Enunciados de exames nacionais anteriores." />
              <ExamCondition icon={<Shuffle size={19} />} title="Vários temas" text="Mistura equilibrada do catálogo disponível." />
              <ExamCondition icon={<Flag size={19} />} title="Nota de 0 a 20" text="Cada exercício tem o mesmo peso na nota final." />
            </div>
          </div>
        </div>
      )}

      {(phase === "running" || phase === "paused") && currentExercise && (
        <div className="space-y-4">
          <div className="card rounded-[14px] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#78837f]">Questão {currentIndex + 1} de {questions.length}</p>
                <p className="mt-1 text-sm text-[#53605c]">{correct} certas · {wrong} erradas · {unanswered} por responder · {topicCount} temas</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SessionTimer secondsLeft={secondsLeft} phase={phase} />
                <button type="button" onClick={toggleExamPause} className={secondaryButton}>
                  {phase === "running" ? <Pause size={17} /> : <Play size={17} />}
                  {phase === "running" ? "Pausar" : "Continuar"}
                </button>
                <button type="button" onClick={finishExam} className={secondaryButton}><Square size={16} />Entregar prova</button>
              </div>
            </div>
            <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto border-t border-[#e7e8e2] pt-4" aria-label="Navegação entre questões">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`flex size-9 shrink-0 items-center justify-center rounded-[9px] border text-xs font-extrabold ${
                    index === currentIndex
                      ? "border-[#153f36] bg-[#153f36] text-white"
                      : marks[index] === "correct"
                        ? "border-[#a8d2bd] bg-[#e5f4ed] text-[#277454]"
                        : marks[index] === "wrong"
                          ? "border-[#edc8c5] bg-[#fcebea] text-[#b94b45]"
                          : "border-[#d8dad4] bg-white text-[#65706c]"
                  }`}
                  aria-label={`Ir para a questão ${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {phase === "paused" ? (
            <div className="card flex min-h-[430px] flex-col items-center justify-center rounded-[16px] p-8 text-center">
              <Pause size={34} className="text-[#c07d2e]" />
              <h2 className="mt-4 font-display text-2xl font-semibold">Exame em pausa</h2>
              <p className="mt-2 text-sm text-[#7a8480]">O enunciado fica escondido enquanto o cronómetro está parado.</p>
              <button type="button" onClick={toggleExamPause} className={`${primaryButton} mt-6`}><Play size={17} />Continuar exame</button>
            </div>
          ) : (
            <>
              <ExerciseViewer exercise={currentExercise} />
              <div className="card sticky bottom-3 z-20 flex flex-col gap-3 rounded-[14px] p-3 shadow-[0_12px_32px_rgba(23,33,31,0.16)] sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex gap-2">
                  <button type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} className={secondaryButton} aria-label="Questão anterior"><ArrowLeft size={17} /><span className="hidden sm:inline">Anterior</span></button>
                  <button type="button" disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))} className={secondaryButton} aria-label="Questão seguinte"><span className="hidden sm:inline">Seguinte</span><ArrowRight size={17} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button type="button" onClick={() => markQuestion("wrong")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#edc8c5] bg-[#fcebea] px-4 text-sm font-extrabold text-[#a8433e] hover:bg-[#f9dfdc]"><X size={18} />Errei</button>
                  <button type="button" onClick={() => markQuestion("correct")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#277454] px-4 text-sm font-extrabold text-white hover:bg-[#1f6246]"><Check size={19} />Acertei</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {phase === "summary" && (
        <SessionSummary title="Exame entregue" correct={correct} wrong={wrong} skipped={unanswered} onRestart={reset} />
      )}
    </>
  );
}

function ExamCondition({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#eef2ed] text-[#356f5b]">{icon}</div>
      <div>
        <p className="text-sm font-extrabold text-[#26332f]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#7a8480]">{text}</p>
      </div>
    </div>
  );
}

