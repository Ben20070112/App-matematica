"use client";

import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Cloud,
  CloudOff,
  Clock3,
  Eye,
  EyeOff,
  FilePenLine,
  Gauge,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Square,
  Target,
  TimerReset,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { clearStudyData, createId, loadStudyData, saveStudyData, todayKey } from "@/lib/storage";
import { loadCloudStudyData, saveCloudStudyData, supabase } from "@/lib/supabase";
import type {
  ErrorNote,
  ExerciseLog,
  MockExam,
  StudyData,
  StudyTask,
  StudyTopic,
  TopicStatus,
} from "@/lib/types";

type Section = "dashboard" | "tasks" | "timer" | "topics" | "exercises" | "errors" | "mocks";

const navigation: { id: Section; label: string; shortLabel: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Visão geral", shortLabel: "Início", icon: LayoutDashboard },
  { id: "tasks", label: "Tarefas do dia", shortLabel: "Tarefas", icon: ListChecks },
  { id: "timer", label: "Temporizador", shortLabel: "Timer", icon: TimerReset },
  { id: "topics", label: "Temas", shortLabel: "Temas", icon: BookOpenCheck },
  { id: "exercises", label: "Exercícios", shortLabel: "Exercícios", icon: Target },
  { id: "errors", label: "Caderno de erros", shortLabel: "Erros", icon: FilePenLine },
  { id: "mocks", label: "Simulados", shortLabel: "Simulados", icon: BarChart3 },
];

const statusConfig: Record<TopicStatus, { label: string; description: string; color: string; bg: string; border: string }> = {
  red: {
    label: "Preciso de rever",
    description: "Ainda não domino este tema",
    color: "#b94b45",
    bg: "#fcebea",
    border: "#f0c9c6",
  },
  yellow: {
    label: "A consolidar",
    description: "Já consigo, mas ainda hesito",
    color: "#9b6a13",
    bg: "#fff7dc",
    border: "#ead9a5",
  },
  green: {
    label: "Dominado",
    description: "Consigo resolver com confiança",
    color: "#277454",
    bg: "#e5f4ed",
    border: "#bfdecf",
  },
};

const inputClass = "field";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#153f36] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0e332b] disabled:cursor-not-allowed disabled:opacity-45";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#d8dad4] bg-white px-4 py-2.5 text-sm font-bold text-[#26332f] transition hover:border-[#aeb7b2] hover:bg-[#fafaf7]";

const parseDate = (value: string) => new Date(`${value}T12:00:00`);

const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("pt-PT", options ?? { day: "2-digit", month: "short", year: "numeric" }).format(
    parseDate(value),
  );

const getDaysUntil = (value: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return Math.max(0, Math.ceil((parseDate(value).getTime() - today.getTime()) / 86_400_000));
};

const formatStudyTime = (seconds: number) => {
  if (seconds < 60) return seconds > 0 ? `${seconds}s` : "0 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};

const formatTimer = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
};

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#de6b48]">{eyebrow}</p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.035em] text-[#17211f] sm:text-[2.15rem]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68736f] sm:text-[0.95rem]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#eef1ec] text-[#52615c]">{icon}</div>
      <p className="font-bold text-[#26332f]">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[#7a8480]">{description}</p>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-[11px] bg-[#153f36] text-lg font-black text-white shadow-sm">A</div>
      <div>
        <p className="font-display text-lg font-semibold leading-none tracking-[-0.02em]">Plano A</p>
        <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#7d8783]">Matemática</p>
      </div>
    </div>
  );
}

function Sidebar({ active, onNavigate }: { active: Section; onNavigate: (section: Section) => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-[#dedfd8] bg-[#f0f0e9] px-4 py-6 lg:flex">
      <div className="px-2 pb-7">
        <Brand />
      </div>
      <nav className="space-y-1" aria-label="Navegação principal">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold transition ${
                isActive ? "bg-[#153f36] text-white shadow-sm" : "text-[#52615c] hover:bg-white/70 hover:text-[#17211f]"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto rounded-[12px] border border-[#dbdcd5] bg-white/65 p-4">
        <div className="flex items-start gap-2.5">
          <CircleDot className="mt-0.5 text-[#de6b48]" size={16} />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.09em] text-[#42504c]">Objetivo</p>
            <p className="mt-1 text-xs leading-5 text-[#6f7975]">Consistência primeiro. Um bloco de estudo de cada vez.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileHeader({ active, onNavigate }: { active: Section; onNavigate: (section: Section) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-[#dedfd8] bg-[#f6f5ef]/95 backdrop-blur lg:hidden">
      <div className="flex h-[68px] items-center justify-between px-4">
        <Brand />
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="flex size-11 items-center justify-center rounded-[10px] border border-[#d8dad4] bg-white text-[#26332f]"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
        <nav className="grid grid-cols-2 gap-2 border-t border-[#e1e2dc] bg-[#f6f5ef] p-3" aria-label="Navegação principal">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-[10px] px-3 py-3 text-left text-sm font-bold ${
                  isActive ? "bg-[#153f36] text-white" : "border border-[#e0e1dc] bg-white text-[#53605c]"
                }`}
              >
                <Icon size={17} />
                {item.shortLabel}
              </button>
            );
          })}
        </nav>
      )}
      <nav className="scrollbar-none flex gap-1 overflow-x-auto border-t border-[#e5e5df] px-3 py-2" aria-label="Atalhos">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
                isActive ? "bg-[#153f36] text-white" : "text-[#68736f]"
              }`}
            >
              <Icon size={15} />
              {item.shortLabel}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

function StatCard({ icon, label, value, note, accent }: { icon: ReactNode; label: string; value: string; note: string; accent: string }) {
  return (
    <div className="card rounded-[14px] p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#73807b]">{label}</p>
        <div className="flex size-9 items-center justify-center rounded-[9px]" style={{ backgroundColor: `${accent}15`, color: accent }}>
          {icon}
        </div>
      </div>
      <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#17211f]">{value}</p>
      <p className="mt-1 text-xs text-[#87908c]">{note}</p>
    </div>
  );
}

function ExamCard({ data, onDateChange }: { data: StudyData; onDateChange: (date: string) => void }) {
  const days = getDaysUntil(data.examDate);
  return (
    <div className="relative min-h-[244px] overflow-hidden rounded-[16px] bg-[#153f36] p-6 text-white shadow-[0_18px_35px_rgba(21,63,54,0.14)] sm:p-8">
      <div className="absolute -right-14 -top-20 size-56 rounded-full border border-white/10" />
      <div className="absolute -bottom-24 right-10 size-52 rounded-full border border-white/10" />
      <div className="relative flex h-full flex-col justify-between gap-8">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#bdd0ca]">
          <CalendarDays size={16} />
          Contagem decrescente
        </div>
        <div>
          <div className="flex items-end gap-3">
            <span className="font-display text-7xl font-semibold leading-none tracking-[-0.07em] sm:text-8xl">{days}</span>
            <span className="mb-2 text-lg font-semibold text-[#d7e2de] sm:mb-3">dias</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#c5d4cf]">Até ao exame nacional. Pequenos avanços diários somam-se depressa.</p>
        </div>
        <label className="flex max-w-[260px] items-center gap-3 rounded-[10px] border border-white/15 bg-white/8 px-3 py-2.5 text-sm font-semibold text-[#e6eeeb]">
          <span className="shrink-0">Data do exame</span>
          <input
            type="date"
            value={data.examDate}
            min={todayKey()}
            onChange={(event) => onDateChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-right text-xs text-white [color-scheme:dark]"
            aria-label="Data do exame"
          />
        </label>
      </div>
    </div>
  );
}

function ProgressPanel({ topics, onOpen }: { topics: StudyTopic[]; onOpen: () => void }) {
  const score = topics.reduce((sum, topic) => sum + (topic.status === "green" ? 1 : topic.status === "yellow" ? 0.5 : 0), 0);
  const progress = topics.length ? Math.round((score / topics.length) * 100) : 0;
  const mastered = topics.filter((topic) => topic.status === "green").length;
  return (
    <div className="card flex min-h-[244px] flex-col rounded-[16px] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#73807b]">Progresso geral</p>
          <p className="mt-1 text-sm text-[#87908c]">Domínio dos temas</p>
        </div>
        <Gauge size={21} className="text-[#de6b48]" />
      </div>
      <div className="my-5 flex flex-1 items-center justify-center">
        <div
          className="flex size-32 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(#de6b48 ${progress}%, #e9eae4 0)` }}
        >
          <div className="flex size-[106px] flex-col items-center justify-center rounded-full bg-[#fffefb]">
            <span className="font-display text-3xl font-semibold tracking-[-0.04em]">{progress}%</span>
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#8b9490]">concluído</span>
          </div>
        </div>
      </div>
      <button type="button" onClick={onOpen} className="flex items-center justify-between border-t border-[#e7e7e1] pt-4 text-sm font-bold text-[#354540]">
        <span>{mastered} de {topics.length} temas dominados</span>
        <ChevronRight size={17} />
      </button>
    </div>
  );
}

function TaskList({ tasks, onToggle, onDelete, compact = false }: { tasks: StudyTask[]; onToggle: (id: string) => void; onDelete: (id: string) => void; compact?: boolean }) {
  if (!tasks.length) {
    return <EmptyState icon={<ListChecks size={20} />} title="Dia livre" description="Ainda não há tarefas planeadas para hoje." />;
  }
  const visible = compact ? tasks.slice(0, 4) : tasks;
  return (
    <div className="divide-y divide-[#e8e8e2]">
      {visible.map((task) => (
        <div key={task.id} className="group flex items-center gap-3 px-4 py-3.5 sm:px-5">
          <button
            type="button"
            onClick={() => onToggle(task.id)}
            className={`flex size-6 shrink-0 items-center justify-center rounded-[7px] border transition ${
              task.completed ? "border-[#3a8465] bg-[#3a8465] text-white" : "border-[#c9cec9] bg-white text-transparent hover:border-[#799088]"
            }`}
            aria-label={task.completed ? `Marcar ${task.title} como pendente` : `Concluir ${task.title}`}
          >
            <Check size={15} strokeWidth={3} />
          </button>
          <span className={`min-w-0 flex-1 text-sm font-semibold leading-5 ${task.completed ? "text-[#9aa19e] line-through" : "text-[#34413d]"}`}>
            {task.title}
          </span>
          {!compact && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="flex size-9 items-center justify-center rounded-[8px] text-[#a0a7a3] transition hover:bg-[#f9e8e6] hover:text-[#b94b45] sm:opacity-0 sm:group-hover:opacity-100"
              aria-label={`Eliminar ${task.title}`}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function AddTaskForm({ onAdd }: { onAdd: (title: string) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const title = new FormData(form).get("title")?.toString().trim();
    if (!title) return;
    onAdd(title);
    form.reset();
  };
  return (
    <form onSubmit={submit} className="flex gap-2 border-t border-[#e8e8e2] p-4 sm:p-5">
      <input name="title" className={inputClass} placeholder="Adicionar uma tarefa…" maxLength={90} aria-label="Nova tarefa" />
      <button type="submit" className={`${primaryButton} shrink-0 px-3.5`} aria-label="Adicionar tarefa">
        <Plus size={18} />
        <span className="hidden sm:inline">Adicionar</span>
      </button>
    </form>
  );
}

function TimerPanel({ onRecord, full = false }: { onRecord: (seconds: number) => void; full?: boolean }) {
  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const totalSeconds = minutes * 60;
  const elapsed = totalSeconds - secondsLeft;
  const progress = (elapsed / totalSeconds) * 100;

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (!running || secondsLeft !== 0) return;
    const completion = window.setTimeout(() => {
      setRunning(false);
      onRecord(totalSeconds);
      setSecondsLeft(totalSeconds);
    }, 0);
    return () => window.clearTimeout(completion);
  }, [onRecord, running, secondsLeft, totalSeconds]);

  const chooseDuration = (value: number) => {
    if (running) return;
    setMinutes(value);
    setSecondsLeft(value * 60);
  };

  const finishSession = () => {
    setRunning(false);
    if (elapsed > 0) onRecord(elapsed);
    setSecondsLeft(totalSeconds);
  };

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft(totalSeconds);
  };

  return (
    <div className={`card rounded-[16px] ${full ? "p-6 sm:p-9" : "p-5 sm:p-6"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#73807b]">Temporizador</p>
          <p className="mt-1 text-sm text-[#87908c]">Tempo de foco sem distrações</p>
        </div>
        <Clock3 size={20} className="text-[#de6b48]" />
      </div>
      <div className={`flex flex-col items-center ${full ? "py-9" : "py-6"}`}>
        <div
          className={`flex items-center justify-center rounded-full ${full ? "size-56 sm:size-64" : "size-44"}`}
          style={{ background: `conic-gradient(#de6b48 ${progress}%, #eaebe5 0)` }}
        >
          <div className={`flex flex-col items-center justify-center rounded-full bg-[#fffefb] ${full ? "size-[206px] sm:size-[238px]" : "size-40"}`}>
            <span className={`font-display font-semibold tabular-nums tracking-[-0.055em] ${full ? "text-6xl sm:text-7xl" : "text-5xl"}`}>
              {formatTimer(secondsLeft)}
            </span>
            <span className="mt-2 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#8a9390]">{running ? "em foco" : elapsed > 0 ? "em pausa" : "pronto"}</span>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2 rounded-[11px] bg-[#f0f1eb] p-1.5">
          {[25, 45, 60].map((value) => (
            <button
              key={value}
              type="button"
              disabled={running}
              onClick={() => chooseDuration(value)}
              className={`rounded-[8px] px-4 py-2 text-sm font-bold transition ${
                minutes === value ? "bg-white text-[#153f36] shadow-sm" : "text-[#7a8480] hover:text-[#33413d]"
              } disabled:cursor-not-allowed`}
            >
              {value} min
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => setRunning((value) => !value)} className={`${primaryButton} min-w-32`}>
          {running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          {running ? "Pausar" : elapsed > 0 ? "Continuar" : "Iniciar"}
        </button>
        <button type="button" onClick={finishSession} disabled={elapsed === 0} className={`${secondaryButton} min-w-32 disabled:cursor-not-allowed disabled:opacity-45`}>
          <Square size={16} fill="currentColor" />
          Terminar
        </button>
        {full && elapsed > 0 && (
          <button type="button" onClick={resetTimer} className={secondaryButton} aria-label="Reiniciar sem guardar">
            <RotateCcw size={17} />
          </button>
        )}
      </div>
    </div>
  );
}

function DashboardView({ data, updateData, navigate }: { data: StudyData; updateData: (updater: (current: StudyData) => StudyData) => void; navigate: (section: Section) => void }) {
  const today = todayKey();
  const todayTasks = data.tasks.filter((task) => task.date === today);
  const completed = todayTasks.filter((task) => task.completed).length;
  const studySeconds = data.studySessions.filter((session) => session.date === today).reduce((sum, session) => sum + session.seconds, 0);
  const todayExercises = data.exerciseLogs.filter((log) => log.date === today).reduce((sum, log) => sum + log.total, 0);
  const latestMock = [...data.mockExams].sort((a, b) => b.date.localeCompare(a.date))[0];

  const toggleTask = (id: string) => updateData((current) => ({
    ...current,
    tasks: current.tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
  }));

  const recordSession = (seconds: number) => updateData((current) => ({
    ...current,
    studySessions: [...current.studySessions, { id: createId(), seconds, date: todayKey() }],
  }));

  return (
    <>
      <SectionHeading
        eyebrow="O teu plano de estudo"
        title="Bom estudo!"
        description={new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
      />
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.7fr]">
        <ExamCard data={data} onDateChange={(examDate) => updateData((current) => ({ ...current, examDate }))} />
        <ProgressPanel topics={data.topics} onOpen={() => navigate("topics")} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Clock3 size={18} />} label="Estudado hoje" value={formatStudyTime(studySeconds)} note="Sessões terminadas" accent="#3a8465" />
        <StatCard icon={<CheckCircle2 size={18} />} label="Tarefas" value={`${completed} / ${todayTasks.length}`} note="Concluídas hoje" accent="#de6b48" />
        <StatCard icon={<Target size={18} />} label="Exercícios" value={`${todayExercises}`} note={todayExercises ? "Resolvidos hoje" : "Ainda por começar"} accent="#c79531" />
      </div>
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="card overflow-hidden rounded-[16px]">
          <div className="flex items-center justify-between border-b border-[#e8e8e2] px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Tarefas de hoje</h2>
              <p className="mt-0.5 text-xs text-[#87908c]">{completed === todayTasks.length && todayTasks.length ? "Tudo concluído — excelente trabalho." : `${todayTasks.length - completed} por concluir`}</p>
            </div>
            <button type="button" onClick={() => navigate("tasks")} className="flex items-center gap-1 text-xs font-bold text-[#52615c] hover:text-[#153f36]">
              Ver todas <ChevronRight size={15} />
            </button>
          </div>
          <TaskList tasks={todayTasks} onToggle={toggleTask} onDelete={() => undefined} compact />
        </div>
        <TimerPanel onRecord={recordSession} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => navigate("errors")} className="card flex items-center gap-4 rounded-[14px] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#bdc6c1]">
          <div className="flex size-11 items-center justify-center rounded-[10px] bg-[#f9e9e7] text-[#b9574e]"><AlertTriangle size={20} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Caderno de erros</p>
            <p className="mt-1 text-xs text-[#87908c]">{data.errorNotes.length ? `${data.errorNotes.length} erros guardados para rever` : "Regista o que precisas de rever"}</p>
          </div>
          <ChevronRight size={18} className="text-[#9aa19e]" />
        </button>
        <button type="button" onClick={() => navigate("mocks")} className="card flex items-center gap-4 rounded-[14px] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#bdc6c1]">
          <div className="flex size-11 items-center justify-center rounded-[10px] bg-[#e8f1ed] text-[#32725a]"><TrendingUp size={20} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Último simulado</p>
            <p className="mt-1 text-xs text-[#87908c]">{latestMock ? `${latestMock.score.toFixed(1)} valores · ${formatDate(latestMock.date)}` : "Ainda sem notas registadas"}</p>
          </div>
          <ChevronRight size={18} className="text-[#9aa19e]" />
        </button>
      </div>
    </>
  );
}

function TasksView({ data, updateData }: { data: StudyData; updateData: (updater: (current: StudyData) => StudyData) => void }) {
  const today = todayKey();
  const tasks = data.tasks.filter((task) => task.date === today);
  const completed = tasks.filter((task) => task.completed).length;
  const percentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const toggleTask = (id: string) => updateData((current) => ({
    ...current,
    tasks: current.tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
  }));
  const deleteTask = (id: string) => updateData((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
  const addTask = (title: string) => updateData((current) => ({
    ...current,
    tasks: [...current.tasks, { id: createId(), title, completed: false, date: today }],
  }));

  return (
    <>
      <SectionHeading eyebrow="Checklist diária" title="Tarefas de hoje" description="Define um plano realista e fecha o dia com tudo registado." />
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_300px]">
        <div className="card overflow-hidden rounded-[16px]">
          <div className="border-b border-[#e8e8e2] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold">{formatDate(today, { weekday: "long", day: "numeric", month: "long" })}</h2>
                <p className="mt-1 text-xs text-[#87908c]">{completed} de {tasks.length} tarefas concluídas</p>
              </div>
              <span className="font-display text-2xl font-semibold text-[#153f36]">{percentage}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ecece6]">
              <div className="h-full rounded-full bg-[#3a8465] transition-[width] duration-300" style={{ width: `${percentage}%` }} />
            </div>
          </div>
          <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
          <AddTaskForm onAdd={addTask} />
        </div>
        <div className="rounded-[16px] border border-[#d7dfda] bg-[#eaf1ed] p-5">
          <CheckCircle2 size={22} className="text-[#36765d]" />
          <h3 className="mt-4 font-display text-lg font-semibold text-[#243a33]">Foco no essencial</h3>
          <p className="mt-2 text-sm leading-6 text-[#5f706a]">Três tarefas bem escolhidas valem mais do que uma lista impossível. Podes adicionar ou remover itens conforme o teu plano.</p>
        </div>
      </div>
    </>
  );
}

function TimerView({ data, updateData }: { data: StudyData; updateData: (updater: (current: StudyData) => StudyData) => void }) {
  const todaySeconds = data.studySessions.filter((session) => session.date === todayKey()).reduce((sum, session) => sum + session.seconds, 0);
  const recordSession = (seconds: number) => updateData((current) => ({
    ...current,
    studySessions: [...current.studySessions, { id: createId(), seconds, date: todayKey() }],
  }));
  return (
    <>
      <SectionHeading eyebrow="Sessão de estudo" title="Temporizador de foco" description="Escolhe a duração, inicia o bloco e regista apenas o tempo que estudaste." />
      <div className="mx-auto grid max-w-4xl items-start gap-5 lg:grid-cols-[1fr_240px]">
        <TimerPanel onRecord={recordSession} full />
        <div className="card rounded-[16px] p-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#73807b]">Resumo de hoje</p>
          <p className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em]">{formatStudyTime(todaySeconds)}</p>
          <p className="mt-1 text-sm text-[#87908c]">tempo estudado</p>
          <div className="mt-5 border-t border-[#e7e7e1] pt-5 text-sm leading-6 text-[#68736f]">O tempo é guardado quando o contador termina ou quando carregas em “Terminar”.</div>
        </div>
      </div>
    </>
  );
}

function TopicsView({ topics, onChange }: { topics: StudyTopic[]; onChange: (id: string, status: TopicStatus) => void }) {
  const counts = {
    red: topics.filter((topic) => topic.status === "red").length,
    yellow: topics.filter((topic) => topic.status === "yellow").length,
    green: topics.filter((topic) => topic.status === "green").length,
  };
  return (
    <>
      <SectionHeading eyebrow="Matéria" title="Temas de Matemática A" description="Assinala com honestidade o teu nível atual. O progresso geral usa estes estados." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {(["red", "yellow", "green"] as TopicStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-3 rounded-[12px] border bg-white px-4 py-3" style={{ borderColor: statusConfig[status].border }}>
            <span className="size-3 rounded-full" style={{ backgroundColor: statusConfig[status].color }} />
            <span className="flex-1 text-sm font-bold text-[#47544f]">{statusConfig[status].label}</span>
            <strong className="font-display text-xl">{counts[status]}</strong>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((topic) => (
          <article key={topic.id} className="card rounded-[15px] p-5">
            <div className="flex items-start gap-3">
              <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: statusConfig[topic.status].color }} />
              <div>
                <h2 className="font-display text-lg font-semibold">{topic.name}</h2>
                <p className="mt-1 text-sm leading-5 text-[#7b8581]">{topic.description}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2" role="radiogroup" aria-label={`Estado de ${topic.name}`}>
              {(["red", "yellow", "green"] as TopicStatus[]).map((status) => {
                const selected = topic.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChange(topic.id, status)}
                    className="min-h-10 rounded-[9px] border px-2 py-2 text-xs font-bold transition"
                    style={{
                      borderColor: selected ? statusConfig[status].color : "#e0e1dc",
                      backgroundColor: selected ? statusConfig[status].bg : "#fff",
                      color: selected ? statusConfig[status].color : "#7a8480",
                    }}
                    title={statusConfig[status].description}
                  >
                    {status === "red" ? "Rever" : status === "yellow" ? "Consolidar" : "Dominado"}
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function ExerciseForm({ topics, onAdd }: { topics: StudyTopic[]; onAdd: (log: ExerciseLog) => void }) {
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const total = Number(values.get("total"));
    const correct = Number(values.get("correct"));
    const wrong = Number(values.get("wrong"));
    if (correct + wrong !== total) {
      setError("Os exercícios certos e errados devem somar o total feito.");
      return;
    }
    setError("");
    onAdd({
      id: createId(),
      topic: values.get("topic")?.toString() ?? topics[0]?.name ?? "Outro",
      total,
      correct,
      wrong,
      date: values.get("date")?.toString() ?? todayKey(),
    });
    form.reset();
    const dateInput = form.elements.namedItem("date") as HTMLInputElement | null;
    if (dateInput) dateInput.value = todayKey();
  };
  return (
    <form onSubmit={submit} className="card rounded-[16px] p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold">Novo registo</h2>
      <p className="mt-1 text-sm text-[#87908c]">Regista o resultado de um bloco de exercícios.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label><span className="label">Tema</span><select name="topic" className={inputClass}>{topics.map((topic) => <option key={topic.id}>{topic.name}</option>)}</select></label>
        <label><span className="label">Data</span><input name="date" type="date" defaultValue={todayKey()} className={inputClass} required /></label>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <label><span className="label">Feitos</span><input name="total" type="number" min="1" max="999" className={inputClass} required /></label>
        <label><span className="label">Certos</span><input name="correct" type="number" min="0" max="999" className={inputClass} required /></label>
        <label><span className="label">Errados</span><input name="wrong" type="number" min="0" max="999" className={inputClass} required /></label>
      </div>
      {error && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#b94b45]"><AlertTriangle size={16} />{error}</p>}
      <button type="submit" className={`${primaryButton} mt-5 w-full sm:w-auto`}><Plus size={17} />Guardar registo</button>
    </form>
  );
}

function ExercisesView({ data, updateData }: { data: StudyData; updateData: (updater: (current: StudyData) => StudyData) => void }) {
  const totals = data.exerciseLogs.reduce((acc, log) => ({ total: acc.total + log.total, correct: acc.correct + log.correct, wrong: acc.wrong + log.wrong }), { total: 0, correct: 0, wrong: 0 });
  const accuracy = totals.total ? Math.round((totals.correct / totals.total) * 100) : 0;
  const logs = [...data.exerciseLogs].sort((a, b) => b.date.localeCompare(a.date));
  const addLog = (log: ExerciseLog) => updateData((current) => ({ ...current, exerciseLogs: [...current.exerciseLogs, log] }));
  const deleteLog = (id: string) => updateData((current) => ({ ...current, exerciseLogs: current.exerciseLogs.filter((log) => log.id !== id) }));
  return (
    <>
      <SectionHeading eyebrow="Prática" title="Registo de exercícios" description="Acompanha o volume de trabalho e a percentagem de respostas certas." />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Target size={18} />} label="Feitos" value={`${totals.total}`} note="No total" accent="#153f36" />
        <StatCard icon={<CheckCircle2 size={18} />} label="Certos" value={`${totals.correct}`} note="Respostas certas" accent="#3a8465" />
        <StatCard icon={<X size={18} />} label="Errados" value={`${totals.wrong}`} note="Para rever" accent="#c85850" />
        <StatCard icon={<Gauge size={18} />} label="Acerto" value={`${accuracy}%`} note="Taxa global" accent="#c79531" />
      </div>
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[380px_1fr]">
        <ExerciseForm topics={data.topics} onAdd={addLog} />
        <div className="card overflow-hidden rounded-[16px]">
          <div className="border-b border-[#e8e8e2] px-5 py-4"><h2 className="font-display text-lg font-semibold">Histórico</h2></div>
          {!logs.length ? (
            <EmptyState icon={<Target size={20} />} title="Sem exercícios registados" description="O primeiro bloco que guardares aparece aqui." />
          ) : (
            <div className="divide-y divide-[#e8e8e2]">
              {logs.map((log) => (
                <div key={log.id} className="group flex items-center gap-4 px-4 py-4 sm:px-5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#edf2ee] font-display text-lg font-semibold text-[#2f6f57]">{Math.round((log.correct / log.total) * 100)}%</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#34413d]">{log.topic}</p>
                    <p className="mt-1 text-xs text-[#87908c]">{formatDate(log.date)} · {log.total} feitos · {log.correct} certos · {log.wrong} errados</p>
                  </div>
                  <button type="button" onClick={() => deleteLog(log.id)} className="flex size-9 items-center justify-center rounded-[8px] text-[#a0a7a3] hover:bg-[#f9e8e6] hover:text-[#b94b45] sm:opacity-0 sm:group-hover:opacity-100" aria-label="Eliminar registo"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ErrorForm({ topics, onAdd }: { topics: StudyTopic[]; onAdd: (note: ErrorNote) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    onAdd({
      id: createId(),
      topic: values.get("topic")?.toString() ?? topics[0]?.name ?? "Outro",
      description: values.get("description")?.toString().trim() ?? "",
      correctRule: values.get("correctRule")?.toString().trim() ?? "",
      reviewDate: values.get("reviewDate")?.toString() ?? todayKey(),
      createdAt: todayKey(),
    });
    form.reset();
  };
  return (
    <form onSubmit={submit} className="card rounded-[16px] p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold">Registar um erro</h2>
      <p className="mt-1 text-sm text-[#87908c]">Escreve o que aconteceu e a ideia correta.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label><span className="label">Tema</span><select name="topic" className={inputClass}>{topics.map((topic) => <option key={topic.id}>{topic.name}</option>)}</select></label>
        <label><span className="label">Rever em</span><input name="reviewDate" type="date" min={todayKey()} defaultValue={todayKey()} className={inputClass} required /></label>
      </div>
      <label className="mt-4 block"><span className="label">Descrição do erro</span><textarea name="description" className={`${inputClass} min-h-24 resize-y`} placeholder="Ex.: Troquei o sinal ao passar o termo…" maxLength={500} required /></label>
      <label className="mt-4 block"><span className="label">Regra correta</span><textarea name="correctRule" className={`${inputClass} min-h-24 resize-y`} placeholder="Escreve a regra ou o raciocínio correto…" maxLength={500} required /></label>
      <button type="submit" className={`${primaryButton} mt-5 w-full sm:w-auto`}><Plus size={17} />Guardar no caderno</button>
    </form>
  );
}

function ErrorsView({ data, updateData }: { data: StudyData; updateData: (updater: (current: StudyData) => StudyData) => void }) {
  const notes = [...data.errorNotes].sort((a, b) => a.reviewDate.localeCompare(b.reviewDate));
  const addNote = (note: ErrorNote) => updateData((current) => ({ ...current, errorNotes: [...current.errorNotes, note] }));
  const deleteNote = (id: string) => updateData((current) => ({ ...current, errorNotes: current.errorNotes.filter((note) => note.id !== id) }));
  return (
    <>
      <SectionHeading eyebrow="Revisão ativa" title="Caderno de erros" description="Transforma cada engano numa regra que vais recordar no exame." />
      <div className="grid items-start gap-5 xl:grid-cols-[400px_1fr]">
        <ErrorForm topics={data.topics} onAdd={addNote} />
        <div>
          {!notes.length ? (
            <div className="card rounded-[16px]"><EmptyState icon={<FilePenLine size={20} />} title="O caderno está vazio" description="Quando registares um erro, ele fica organizado aqui por data de revisão." /></div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => {
                const overdue = note.reviewDate <= todayKey();
                return (
                  <article key={note.id} className="card rounded-[15px] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex rounded-full bg-[#eef2ee] px-2.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.06em] text-[#52615c]">{note.topic}</span>
                        <h2 className="mt-3 font-display text-lg font-semibold">{note.description}</h2>
                      </div>
                      <button type="button" onClick={() => deleteNote(note.id)} className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[#a0a7a3] hover:bg-[#f9e8e6] hover:text-[#b94b45]" aria-label="Eliminar erro"><Trash2 size={16} /></button>
                    </div>
                    <div className="mt-4 border-l-2 border-[#3a8465] bg-[#edf5f1] px-4 py-3">
                      <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#39765e]">Regra correta</p>
                      <p className="mt-1 text-sm leading-6 text-[#41554e]">{note.correctRule}</p>
                    </div>
                    <div className={`mt-4 flex items-center gap-2 text-xs font-bold ${overdue ? "text-[#b9574e]" : "text-[#7a8480]"}`}>
                      <CalendarDays size={15} />
                      {overdue ? "Rever hoje" : `Rever a ${formatDate(note.reviewDate)}`}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MockForm({ onAdd }: { onAdd: (mock: MockExam) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    onAdd({
      id: createId(),
      name: values.get("name")?.toString().trim() ?? "Simulado",
      score: Number(values.get("score")),
      date: values.get("date")?.toString() ?? todayKey(),
    });
    form.reset();
    const dateInput = form.elements.namedItem("date") as HTMLInputElement | null;
    if (dateInput) dateInput.value = todayKey();
  };
  return (
    <form onSubmit={submit} className="card rounded-[16px] p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold">Adicionar nota</h2>
      <p className="mt-1 text-sm text-[#87908c]">Regista o resultado em valores, de 0 a 20.</p>
      <label className="mt-5 block"><span className="label">Nome</span><input name="name" className={inputClass} placeholder="Ex.: Simulado de maio" maxLength={80} required /></label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label><span className="label">Data</span><input name="date" type="date" defaultValue={todayKey()} className={inputClass} required /></label>
        <label><span className="label">Nota</span><div className="relative"><input name="score" type="number" min="0" max="20" step="0.1" className={`${inputClass} pr-12`} required /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8b9490]">/ 20</span></div></label>
      </div>
      <button type="submit" className={`${primaryButton} mt-5 w-full sm:w-auto`}><Plus size={17} />Guardar nota</button>
    </form>
  );
}

function MocksView({ data, updateData }: { data: StudyData; updateData: (updater: (current: StudyData) => StudyData) => void }) {
  const mocks = [...data.mockExams].sort((a, b) => b.date.localeCompare(a.date));
  const average = mocks.length ? mocks.reduce((sum, mock) => sum + mock.score, 0) / mocks.length : 0;
  const best = mocks.length ? Math.max(...mocks.map((mock) => mock.score)) : 0;
  const addMock = (mock: MockExam) => updateData((current) => ({ ...current, mockExams: [...current.mockExams, mock] }));
  const deleteMock = (id: string) => updateData((current) => ({ ...current, mockExams: current.mockExams.filter((mock) => mock.id !== id) }));
  return (
    <>
      <SectionHeading eyebrow="Avaliação" title="Notas de simulados" description="Regista as tuas notas e acompanha a evolução até ao exame." />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<FilePenLine size={18} />} label="Simulados" value={`${mocks.length}`} note="Registos guardados" accent="#153f36" />
        <StatCard icon={<Gauge size={18} />} label="Média" value={mocks.length ? average.toFixed(1) : "—"} note="Em 20 valores" accent="#c79531" />
        <StatCard icon={<TrendingUp size={18} />} label="Melhor nota" value={mocks.length ? best.toFixed(1) : "—"} note="Em 20 valores" accent="#3a8465" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[380px_1fr]">
        <MockForm onAdd={addMock} />
        <div className="card overflow-hidden rounded-[16px]">
          <div className="border-b border-[#e8e8e2] px-5 py-4"><h2 className="font-display text-lg font-semibold">Evolução</h2></div>
          {!mocks.length ? (
            <EmptyState icon={<BarChart3 size={20} />} title="Ainda sem simulados" description="A primeira nota que guardares aparece aqui." />
          ) : (
            <div className="divide-y divide-[#e8e8e2]">
              {mocks.map((mock) => (
                <div key={mock.id} className="group p-4 sm:p-5">
                  <div className="flex items-center gap-4">
                    <div className="font-display text-2xl font-semibold text-[#153f36]">{mock.score.toFixed(1)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{mock.name}</p>
                      <p className="mt-1 text-xs text-[#87908c]">{formatDate(mock.date)}</p>
                    </div>
                    <button type="button" onClick={() => deleteMock(mock.id)} className="flex size-9 items-center justify-center rounded-[8px] text-[#a0a7a3] hover:bg-[#f9e8e6] hover:text-[#b94b45] sm:opacity-0 sm:group-hover:opacity-100" aria-label="Eliminar nota"><Trash2 size={16} /></button>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ecece6]"><div className="h-full rounded-full bg-[#3a8465]" style={{ width: `${(mock.score / 20) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const values = new FormData(event.currentTarget);
    const email = values.get("email")?.toString().trim() ?? "";
    const password = values.get("password")?.toString() ?? "";

    if (mode === "forgot") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage("Se existir uma conta com este email, receberás uma ligação para criar uma nova palavra-passe.");
        event.currentTarget.reset();
      }

      setBusy(false);
      return;
    }

    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });

    if (result.error) {
      setError(result.error.message);
    } else if (mode === "signup" && !result.data.session) {
      setMessage("Enviámos um email de confirmação. Abre-o e depois inicia sessão.");
    }

    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f5ef] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center"><Brand /></div>
        <div className="card rounded-[18px] p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#de6b48]">Sincronização</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em]">
            {mode === "login" ? "Entra na tua conta" : mode === "signup" ? "Cria a tua conta" : "Recuperar palavra-passe"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#68736f]">
            {mode === "forgot"
              ? "Indica o teu email e enviamos uma ligação segura para definires uma nova palavra-passe."
              : "Usa a mesma conta no computador e no telemóvel para manter todo o progresso sincronizado."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="label">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9490]" size={17} />
                <input name="email" type="email" autoComplete="email" className={`${inputClass} pl-10`} required />
              </div>
            </label>
            {mode !== "forgot" && (
              <label className="block">
                <span className="label">Palavra-passe</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9490]" size={17} />
                  <input name="password" type={showPassword ? "text" : "password"} minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} className={`${inputClass} pl-10 pr-11`} required />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-[8px] text-[#7b8682] hover:bg-[#eef0eb] hover:text-[#26332f]"
                    aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setMessage("");
                }}
                className="block w-full text-right text-sm font-bold text-[#356f5b] hover:text-[#153f36]"
              >
                Esqueci-me da palavra-passe
              </button>
            )}

            {error && <p className="flex items-center gap-2 text-sm font-semibold text-[#b94b45]"><AlertTriangle size={16} />{error}</p>}
            {message && <p className="rounded-[10px] bg-[#e5f4ed] px-3 py-2.5 text-sm font-semibold text-[#277454]">{message}</p>}

            <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
              {busy ? "A processar…" : mode === "login" ? "Iniciar sessão" : mode === "signup" ? "Criar conta" : "Enviar ligação"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode((current) => current === "login" ? "signup" : "login");
              setError("");
              setMessage("");
            }}
            className="mt-5 w-full text-center text-sm font-bold text-[#356f5b] hover:text-[#153f36]"
          >
            {mode === "login" ? "Ainda não tens conta? Criar conta" : mode === "signup" ? "Já tens conta? Iniciar sessão" : "Voltar ao início de sessão"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordScreen({ onComplete }: { onComplete: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    const values = new FormData(event.currentTarget);
    const password = values.get("password")?.toString() ?? "";
    const confirmation = values.get("confirmation")?.toString() ?? "";

    if (password !== confirmation) {
      setError("As duas palavras-passe não são iguais.");
      setBusy(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      clearStudyData();
      await supabase.auth.signOut();
      window.history.replaceState({}, "", window.location.pathname);
      onComplete();
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f5ef] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center"><Brand /></div>
        <div className="card rounded-[18px] p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#de6b48]">Segurança</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.035em]">Criar nova palavra-passe</h1>
          <p className="mt-2 text-sm leading-6 text-[#68736f]">Escolhe uma palavra-passe com pelo menos 6 caracteres.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="label">Nova palavra-passe</span>
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} minLength={6} autoComplete="new-password" className={`${inputClass} pr-11`} required />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-[8px] text-[#7b8682] hover:bg-[#eef0eb] hover:text-[#26332f]"
                  aria-label={showPassword ? "Ocultar palavras-passe" : "Mostrar palavras-passe"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="label">Repetir palavra-passe</span>
              <input name="confirmation" type={showPassword ? "text" : "password"} minLength={6} autoComplete="new-password" className={inputClass} required />
            </label>
            {error && <p className="flex items-center gap-2 text-sm font-semibold text-[#b94b45]"><AlertTriangle size={16} />{error}</p>}
            <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>{busy ? "A guardar…" : "Guardar nova palavra-passe"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SyncStatus({ session, synced, onSignOut }: { session: Session; synced: boolean; onSignOut: () => void }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-end gap-2 text-xs text-[#68736f]">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe3de] bg-white px-3 py-1.5 font-semibold">
        {synced ? <Cloud size={14} className="text-[#3a8465]" /> : <CloudOff size={14} className="text-[#c79531]" />}
        {synced ? "Sincronizado" : "A sincronizar…"}
      </span>
      <span className="max-w-[220px] truncate rounded-full border border-[#dfe3de] bg-white px-3 py-1.5 font-semibold">{session.user.email}</span>
      <button type="button" onClick={onSignOut} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold hover:bg-[#eceee9] hover:text-[#26332f]">
        <LogOut size={14} />Sair
      </button>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f5ef]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-12 animate-pulse items-center justify-center rounded-[12px] bg-[#153f36] font-black text-white">A</div>
        <p className="text-sm font-semibold text-[#68736f]">A preparar o teu plano…</p>
      </div>
    </div>
  );
}

export function StudyApp() {
  const [data, setData] = useState<StudyData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialising, setInitialising] = useState(true);
  const [recoveringPassword, setRecoveringPassword] = useState(false);
  const [synced, setSynced] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");

  useEffect(() => {
    let active = true;

    const hydrate = async (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);

      if (!nextSession) {
        setData(null);
        setInitialising(false);
        return;
      }

      setInitialising(true);
      const localData = loadStudyData();

      try {
        const cloudData = await loadCloudStudyData(nextSession.user.id);
        const loadedData = cloudData ?? localData;
        saveStudyData(loadedData);
        if (!cloudData) await saveCloudStudyData(nextSession.user.id, loadedData);
        if (active) {
          setData(loadedData);
          setSynced(true);
        }
      } catch {
        if (active) {
          setData(localData);
          setSynced(false);
        }
      } finally {
        if (active) setInitialising(false);
      }
    };

    void supabase.auth.getSession().then(({ data: authData }) => hydrate(authData.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setRecoveringPassword(true);
      window.setTimeout(() => void hydrate(nextSession), 0);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const refreshFromCloud = async () => {
      try {
        const cloudData = await loadCloudStudyData(session.user.id);
        if (cloudData) {
          saveStudyData(cloudData);
          setData(cloudData);
          setSynced(true);
        }
      } catch {
        setSynced(false);
      }
    };

    window.addEventListener("focus", refreshFromCloud);
    return () => window.removeEventListener("focus", refreshFromCloud);
  }, [session]);

  const updateData = useCallback(
    (updater: (current: StudyData) => StudyData) => {
      setData((current) => {
        if (!current) return current;
        const updatedData = updater(current);
        saveStudyData(updatedData);
        if (session) {
          setSynced(false);
          void saveCloudStudyData(session.user.id, updatedData)
            .then(() => setSynced(true))
            .catch(() => setSynced(false));
        }
        return updatedData;
      });
    },
    [session],
  );

  const navigate = (section: Section) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (initialising) return <LoadingScreen />;
  if (recoveringPassword) return (
    <ResetPasswordScreen
      onComplete={() => {
        setRecoveringPassword(false);
        setSession(null);
        setData(null);
      }}
    />
  );
  if (!session) return <AuthScreen />;
  if (!data) return <LoadingScreen />;

  return (
    <div className="min-h-screen">
      <Sidebar active={activeSection} onNavigate={navigate} />
      <MobileHeader active={activeSection} onNavigate={navigate} />
      <main className="lg:pl-[252px]">
        <div className="mx-auto max-w-[1320px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10 lg:py-10">
          <SyncStatus
            session={session}
            synced={synced}
            onSignOut={() => {
              clearStudyData();
              void supabase.auth.signOut();
            }}
          />
          {activeSection === "dashboard" && <DashboardView data={data} updateData={updateData} navigate={navigate} />}
          {activeSection === "tasks" && <TasksView data={data} updateData={updateData} />}
          {activeSection === "timer" && <TimerView data={data} updateData={updateData} />}
          {activeSection === "topics" && (
            <TopicsView
              topics={data.topics}
              onChange={(id, status) => updateData((current) => ({
                ...current,
                topics: current.topics.map((topic) => (topic.id === id ? { ...topic, status } : topic)),
              }))}
            />
          )}
          {activeSection === "exercises" && <ExercisesView data={data} updateData={updateData} />}
          {activeSection === "errors" && <ErrorsView data={data} updateData={updateData} />}
          {activeSection === "mocks" && <MocksView data={data} updateData={updateData} />}
        </div>
      </main>
    </div>
  );
}

