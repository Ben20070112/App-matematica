export type TopicStatus = "red" | "yellow" | "green";

export interface StudyTask {
  id: string;
  title: string;
  completed: boolean;
  date: string;
}

export interface StudyTopic {
  id: string;
  name: string;
  description: string;
  status: TopicStatus;
}

export interface ExerciseLog {
  id: string;
  topic: string;
  total: number;
  correct: number;
  wrong: number;
  date: string;
}

export interface ErrorNote {
  id: string;
  topic: string;
  description: string;
  correctRule: string;
  reviewDate: string;
  createdAt: string;
}

export interface MockExam {
  id: string;
  name: string;
  score: number;
  date: string;
}

export interface StudySession {
  id: string;
  seconds: number;
  date: string;
}

export interface StudyData {
  examDate: string;
  tasks: StudyTask[];
  topics: StudyTopic[];
  exerciseLogs: ExerciseLog[];
  errorNotes: ErrorNote[];
  mockExams: MockExam[];
  studySessions: StudySession[];
}
