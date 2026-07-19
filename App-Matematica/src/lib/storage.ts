import type { StudyData, StudyTask, StudyTopic } from "./types";

const STORAGE_KEY = "plano-a-study-data-v1";

export interface StudyStorage {
  load(): StudyData | null;
  save(data: StudyData): void;
}

const topicSeed: Omit<StudyTopic, "status">[] = [
  { id: "functions", name: "Funções", description: "Polinomiais, exponenciais e logarítmicas" },
  { id: "trigonometry", name: "Trigonometria", description: "Círculo trigonométrico e equações" },
  { id: "geometry", name: "Geometria", description: "Geometria analítica no plano e no espaço" },
  { id: "calculus", name: "Cálculo diferencial", description: "Limites, continuidade e derivadas" },
  { id: "probability", name: "Probabilidades", description: "Combinatória e cálculo de probabilidades" },
  { id: "statistics", name: "Estatística", description: "Amostras, distribuições e regressão" },
  { id: "complex", name: "Números complexos", description: "Forma algébrica e trigonométrica" },
];

export const todayKey = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getDefaultExamDate = () => {
  const now = new Date();
  const thisYear = now.getFullYear();
  const juneExam = new Date(thisYear, 5, 24);
  const year = now > juneExam ? thisYear + 1 : thisYear;
  return `${year}-06-24`;
};

const dailyTaskSeed = [
  "Rever a matéria planeada",
  "Resolver exercícios de exame",
  "Registar e rever os erros",
];

export const createDailyTasks = (date = todayKey()): StudyTask[] =>
  dailyTaskSeed.map((title) => ({ id: createId(), title, completed: false, date }));

export const createInitialData = (): StudyData => ({
  examDate: getDefaultExamDate(),
  tasks: createDailyTasks(),
  topics: topicSeed.map((topic, index) => ({
    ...topic,
    status: index < 2 ? "yellow" : "red",
  })),
  exerciseLogs: [],
  errorNotes: [],
  mockExams: [],
  studySessions: [],
});

const hasValidShape = (value: unknown): value is StudyData => {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<StudyData>;
  return (
    typeof data.examDate === "string" &&
    Array.isArray(data.tasks) &&
    Array.isArray(data.topics) &&
    Array.isArray(data.exerciseLogs) &&
    Array.isArray(data.errorNotes) &&
    Array.isArray(data.mockExams) &&
    Array.isArray(data.studySessions)
  );
};

export const localStudyStorage: StudyStorage = {
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return hasValidShape(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  save(data) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
};

// The UI only depends on StudyStorage. A future Supabase adapter can implement
// the same interface without changing any of the screens or data models.
export const loadStudyData = (): StudyData => {
  const stored = localStudyStorage.load();
  const data = stored ?? createInitialData();
  const today = todayKey();

  if (!data.tasks.some((task) => task.date === today)) {
    return { ...data, tasks: [...data.tasks, ...createDailyTasks(today)] };
  }

  return data;
};

export const saveStudyData = (data: StudyData) => localStudyStorage.save(data);

export const clearStudyData = () => window.localStorage.removeItem(STORAGE_KEY);
