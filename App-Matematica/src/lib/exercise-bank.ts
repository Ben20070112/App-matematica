export interface ExamExercise {
  id: string;
  topicId: string;
  topicName: string;
  exerciseNumber: string;
  source: string;
  pdfUrl: string;
  page: number;
  estimatedMinutes: number;
}

export interface ExerciseTopic {
  id: string;
  name: string;
  description: string;
}

export const exerciseTopics: ExerciseTopic[] = [
  { id: "first-derivative", name: "Primeira derivada", description: "Derivadas, tangentes, monotonia e extremos." },
  { id: "second-derivative", name: "Segunda derivada", description: "Concavidade, pontos de inflexão e aplicações." },
  { id: "limits", name: "Limites e continuidade", description: "Limites, assíntotas e continuidade de funções." },
  { id: "exp-log", name: "Exponenciais e logaritmos", description: "Funções exponenciais, logarítmicas e equações." },
  { id: "trigonometry", name: "Trigonometria", description: "Funções trigonométricas e aplicações." },
  { id: "probability", name: "Probabilidades", description: "Probabilidade condicionada e acontecimentos." },
  { id: "complex", name: "Números complexos", description: "Operações, formas algébrica e trigonométrica." },
];

const pdf = {
  firstDerivative: "https://mat.absolutamente.net/compilacoes/mat-a/12/funcoes/1derivada.pdf",
  secondDerivative: "https://mat.absolutamente.net/compilacoes/mat-a/12/funcoes/2derivada.pdf",
  limits: "https://mat.absolutamente.net/compilacoes/mat-a/12/funcoes/limites_continuidade.pdf",
  expLog: "https://mat.absolutamente.net/compilacoes/mat-a/12/funcoes/exponenciais_logaritmos.pdf",
  trigonometry: "https://mat.absolutamente.net/compilacoes/mat-a/12/funcoes/func_trigonometricas.pdf",
  probability: "https://mat.absolutamente.net/compilacoes/mat-a/12/probabilidades/probabilidade.pdf",
  complex: "https://mat.absolutamente.net/compilacoes/mat-a/12/complexos/operac_simplific.pdf",
} as const;

const makeExercise = (
  topicId: string,
  topicName: string,
  exerciseNumber: string,
  source: string,
  pdfUrl: string,
  page: number,
  estimatedMinutes = 7,
): ExamExercise => ({
  id: `${topicId}-${exerciseNumber}`,
  topicId,
  topicName,
  exerciseNumber,
  source,
  pdfUrl,
  page,
  estimatedMinutes,
});

export const exerciseBank: ExamExercise[] = [
  makeExercise("first-derivative", "Primeira derivada", "1", "Exame 2026 · 1.ª Fase", pdf.firstDerivative, 1),
  makeExercise("first-derivative", "Primeira derivada", "2", "Exame 2025 · Época especial", pdf.firstDerivative, 1),
  makeExercise("first-derivative", "Primeira derivada", "3", "Exame 2025 · 2.ª Fase", pdf.firstDerivative, 2),
  makeExercise("first-derivative", "Primeira derivada", "4", "Exame 2024 · 1.ª Fase", pdf.firstDerivative, 2),
  makeExercise("first-derivative", "Primeira derivada", "5", "Exame 2024 · 2.ª Fase (adaptado)", pdf.firstDerivative, 2),
  makeExercise("first-derivative", "Primeira derivada", "6", "Exame 2024 · 1.ª Fase", pdf.firstDerivative, 3),
  makeExercise("first-derivative", "Primeira derivada", "7", "Exame 2024 · 1.ª Fase", pdf.firstDerivative, 3),
  makeExercise("first-derivative", "Primeira derivada", "8", "Exame 2023 · Época especial", pdf.firstDerivative, 3),
  makeExercise("first-derivative", "Primeira derivada", "9", "Exame 2023 · 2.ª Fase", pdf.firstDerivative, 3),
  makeExercise("first-derivative", "Primeira derivada", "10", "Exame 2013 · 2.ª Fase", pdf.firstDerivative, 3),
  makeExercise("first-derivative", "Primeira derivada", "11", "Exame 2023 · 2.ª Fase", pdf.firstDerivative, 4),
  makeExercise("first-derivative", "Primeira derivada", "12", "Exame 2023 · 1.ª Fase", pdf.firstDerivative, 4),
  makeExercise("first-derivative", "Primeira derivada", "13", "Exame 2022 · Época especial", pdf.firstDerivative, 4),
  makeExercise("first-derivative", "Primeira derivada", "14", "Exame 2022 · Época especial", pdf.firstDerivative, 4),
  makeExercise("first-derivative", "Primeira derivada", "15", "Exame 2022 · 2.ª Fase", pdf.firstDerivative, 5),
  makeExercise("first-derivative", "Primeira derivada", "16", "Exame 2022 · 2.ª Fase", pdf.firstDerivative, 5),
  makeExercise("first-derivative", "Primeira derivada", "17", "Exame 2022 · 1.ª Fase", pdf.firstDerivative, 5),
  makeExercise("first-derivative", "Primeira derivada", "18", "Exame 2022 · 1.ª Fase", pdf.firstDerivative, 5),
  makeExercise("first-derivative", "Primeira derivada", "19", "Exame 2021 · Época especial", pdf.firstDerivative, 6),
  makeExercise("first-derivative", "Primeira derivada", "20", "Exame 2021 · Época especial", pdf.firstDerivative, 6),
  makeExercise("first-derivative", "Primeira derivada", "21", "Exame 2021 · 2.ª Fase", pdf.firstDerivative, 6),
  makeExercise("first-derivative", "Primeira derivada", "22", "Exame 2021 · 1.ª Fase", pdf.firstDerivative, 7),
  makeExercise("first-derivative", "Primeira derivada", "23", "Exame 2020 · 2.ª Fase", pdf.firstDerivative, 7),
  makeExercise("first-derivative", "Primeira derivada", "24", "Exame 2020 · 1.ª Fase", pdf.firstDerivative, 7),
  makeExercise("first-derivative", "Primeira derivada", "25", "Exame 2019 · Época especial", pdf.firstDerivative, 7),
  makeExercise("first-derivative", "Primeira derivada", "26", "Exame 2019 · 1.ª Fase", pdf.firstDerivative, 8),
  makeExercise("first-derivative", "Primeira derivada", "27", "Exame 2019 · 1.ª Fase", pdf.firstDerivative, 8),
  makeExercise("first-derivative", "Primeira derivada", "28", "Exame 2017 · Época especial", pdf.firstDerivative, 8),
  makeExercise("first-derivative", "Primeira derivada", "29", "Exame 2017 · 2.ª Fase", pdf.firstDerivative, 8),
  makeExercise("first-derivative", "Primeira derivada", "30", "Exame 2017 · 1.ª Fase", pdf.firstDerivative, 9),
  makeExercise("first-derivative", "Primeira derivada", "31", "Exame 2017 · 1.ª Fase", pdf.firstDerivative, 9),

  makeExercise("second-derivative", "Segunda derivada", "1", "Exame 2025 · Época especial", pdf.secondDerivative, 1),
  makeExercise("second-derivative", "Segunda derivada", "2", "Exame 2025 · Época especial", pdf.secondDerivative, 1),
  makeExercise("second-derivative", "Segunda derivada", "3", "Exame 2024 · 2.ª Fase (adaptado)", pdf.secondDerivative, 2),
  makeExercise("second-derivative", "Segunda derivada", "4", "Exame 2023 · 1.ª Fase", pdf.secondDerivative, 2),
  makeExercise("second-derivative", "Segunda derivada", "5", "Exame 2022 · Época especial", pdf.secondDerivative, 2),
  makeExercise("second-derivative", "Segunda derivada", "6", "Exame 2020 · Época especial", pdf.secondDerivative, 3),
  makeExercise("second-derivative", "Segunda derivada", "7", "Exame 2020 · 2.ª Fase", pdf.secondDerivative, 3),
  makeExercise("second-derivative", "Segunda derivada", "8", "Exame 2018 · Época especial", pdf.secondDerivative, 3),

  makeExercise("limits", "Limites e continuidade", "1", "Exame 2026 · 1.ª Fase", pdf.limits, 1),
  makeExercise("limits", "Limites e continuidade", "2", "Exame 2025 · 2.ª Fase", pdf.limits, 1),
  makeExercise("limits", "Limites e continuidade", "3", "Exame 2025 · 1.ª Fase", pdf.limits, 1),
  makeExercise("limits", "Limites e continuidade", "4", "Exame 2024 · Época especial", pdf.limits, 2),
  makeExercise("limits", "Limites e continuidade", "5", "Exame 2024 · 2.ª Fase", pdf.limits, 2),
  makeExercise("limits", "Limites e continuidade", "6", "Exame 2023 · Época especial (adaptado)", pdf.limits, 2),
  makeExercise("limits", "Limites e continuidade", "7", "Exame 2023 · 2.ª Fase", pdf.limits, 2),
  makeExercise("limits", "Limites e continuidade", "8", "Exame 2023 · 1.ª Fase", pdf.limits, 2),
  makeExercise("limits", "Limites e continuidade", "9", "Exame 2022 · Época especial", pdf.limits, 3),
  makeExercise("limits", "Limites e continuidade", "10", "Exame 2022 · 2.ª Fase", pdf.limits, 3),
  makeExercise("limits", "Limites e continuidade", "11", "Exame 2022 · 1.ª Fase", pdf.limits, 3),

  makeExercise("exp-log", "Exponenciais e logaritmos", "1", "Exame 2025 · 2.ª Fase", pdf.expLog, 1),
  makeExercise("exp-log", "Exponenciais e logaritmos", "2", "Exame 2025 · 1.ª Fase", pdf.expLog, 1),
  makeExercise("exp-log", "Exponenciais e logaritmos", "3", "Exame 2024 · Época especial", pdf.expLog, 1),
  makeExercise("exp-log", "Exponenciais e logaritmos", "4", "Exame 2024 · 2.ª Fase", pdf.expLog, 2),
  makeExercise("exp-log", "Exponenciais e logaritmos", "5", "Exame 2023 · Época especial", pdf.expLog, 2),
  makeExercise("exp-log", "Exponenciais e logaritmos", "6", "Exame 2023 · Época especial", pdf.expLog, 2),
  makeExercise("exp-log", "Exponenciais e logaritmos", "7", "Exame 2023 · 2.ª Fase", pdf.expLog, 2),
  makeExercise("exp-log", "Exponenciais e logaritmos", "8", "Exame 2023 · 1.ª Fase", pdf.expLog, 2),
  makeExercise("exp-log", "Exponenciais e logaritmos", "9", "Exame 2022 · Época especial", pdf.expLog, 2),

  makeExercise("trigonometry", "Trigonometria", "1", "Exame 2025 · Época especial", pdf.trigonometry, 1),
  makeExercise("trigonometry", "Trigonometria", "2", "Exame 2025 · 2.ª Fase", pdf.trigonometry, 1, 10),
  makeExercise("trigonometry", "Trigonometria", "3", "Exame 2025 · 1.ª Fase", pdf.trigonometry, 2),
  makeExercise("trigonometry", "Trigonometria", "4", "Exame 2024 · Época especial", pdf.trigonometry, 2),

  makeExercise("probability", "Probabilidades", "1", "Exame 2024 · 2.ª Fase", pdf.probability, 1),
  makeExercise("probability", "Probabilidades", "2", "Exame 2021 · Época especial", pdf.probability, 1),
  makeExercise("probability", "Probabilidades", "3", "Exame 2016 · Época especial", pdf.probability, 1),
  makeExercise("probability", "Probabilidades", "4", "Exame 2012 · Época especial", pdf.probability, 2),
  makeExercise("probability", "Probabilidades", "5", "Exame 2010 · 2.ª Fase", pdf.probability, 2),

  makeExercise("complex", "Números complexos", "1", "Exame 2025 · Época especial", pdf.complex, 1),
  makeExercise("complex", "Números complexos", "2", "Exame 2025 · 2.ª Fase", pdf.complex, 1),
  makeExercise("complex", "Números complexos", "3", "Exame 2024 · Época especial", pdf.complex, 2),
  makeExercise("complex", "Números complexos", "4", "Exame 2024 · 2.ª Fase", pdf.complex, 2),
  makeExercise("complex", "Números complexos", "5", "Exame 2023 · Época especial", pdf.complex, 2),
  makeExercise("complex", "Números complexos", "6", "Exame 2023 · 1.ª Fase", pdf.complex, 2),
  makeExercise("complex", "Números complexos", "7", "Exame 2022 · Época especial", pdf.complex, 3),
  makeExercise("complex", "Números complexos", "8", "Exame 2022 · 1.ª Fase", pdf.complex, 3),
  makeExercise("complex", "Números complexos", "9", "Exame 2021 · Época especial", pdf.complex, 4),
  makeExercise("complex", "Números complexos", "10", "Exame 2021 · 2.ª Fase", pdf.complex, 4),
  makeExercise("complex", "Números complexos", "11", "Exame 2021 · 1.ª Fase", pdf.complex, 4),
  makeExercise("complex", "Números complexos", "12", "Exame 2019 · Época especial", pdf.complex, 4),
];

export const getExercisesForTopic = (topicId: string) =>
  exerciseBank.filter((exercise) => exercise.topicId === topicId);

export const shuffleExercises = <T,>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
};

export const buildMixedExam = (count = 12): ExamExercise[] => {
  const topicOrder = shuffleExercises(exerciseTopics.map((topic) => topic.id));
  const topicQueues = new Map(
    topicOrder.map((topicId) => [topicId, shuffleExercises(getExercisesForTopic(topicId))]),
  );
  const selected: ExamExercise[] = [];
  const usedSources = new Set<string>();

  while (selected.length < count) {
    let added = false;

    for (const topicId of topicOrder) {
      const queue = topicQueues.get(topicId) ?? [];
      const uniqueSourceIndex = queue.findIndex((exercise) => !usedSources.has(exercise.source));
      const chosenIndex = uniqueSourceIndex >= 0 ? uniqueSourceIndex : 0;
      const [exercise] = queue.splice(chosenIndex, 1);

      if (!exercise) continue;
      selected.push(exercise);
      usedSources.add(exercise.source);
      added = true;
      if (selected.length === count) break;
    }

    if (!added) break;
  }

  return selected;
};

