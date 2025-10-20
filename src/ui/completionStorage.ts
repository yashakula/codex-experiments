import { LayoutMetrics } from "../gameplay/puzzle";

export interface ScenarioCompletion {
  scenarioId: string;
  victoryConditionsMet: string[];
  metrics: LayoutMetrics;
  completedAt: number;
}

const STORAGE_KEY = "builderCompletionStats";

interface CompletionStorageShape {
  [scenarioId: string]: ScenarioCompletion[];
}

function getStorage(): Storage | undefined {
  if (typeof window === "undefined" || !window.localStorage) {
    return undefined;
  }
  return window.localStorage;
}

function readStorage(): CompletionStorageShape {
  const storage = getStorage();
  if (!storage) {
    return {};
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as CompletionStorageShape;
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function writeStorage(data: CompletionStorageShape): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadCompletionStats(scenarioId: string): ScenarioCompletion[] {
  const data = readStorage();
  return data[scenarioId] ?? [];
}

export function recordCompletion(
  scenarioId: string,
  completion: ScenarioCompletion
): void {
  const data = readStorage();
  const existing = data[scenarioId] ?? [];
  data[scenarioId] = [...existing, completion];
  writeStorage(data);
}
