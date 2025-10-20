import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import {
  PlayerLayout,
  PuzzleScenario,
  ValidationResult,
} from "../gameplay/puzzle";
import { validateLayout } from "../gameplay/validator";
import {
  loadCompletionStats,
  recordCompletion,
  ScenarioCompletion,
} from "./completionStorage";

type BuilderAction =
  | { type: "selectScenario"; scenario: PuzzleScenario }
  | { type: "updateLayout"; layout: PlayerLayout }
  | { type: "validate" };

export interface BuilderState {
  scenario: PuzzleScenario | null;
  layout: PlayerLayout;
  validation: ValidationResult | null;
  completions: ScenarioCompletion[];
}

interface BuilderContextValue extends BuilderState {
  dispatch: React.Dispatch<BuilderAction>;
}

const BuilderContext = createContext<BuilderContextValue | undefined>(undefined);

interface BuilderProviderProps {
  children: React.ReactNode;
}

type BuilderReducerState = BuilderState;

const initialState: BuilderReducerState = {
  scenario: null,
  layout: { components: [] },
  validation: null,
  completions: [],
};

function builderReducer(
  state: BuilderReducerState,
  action: BuilderAction
): BuilderReducerState {
  switch (action.type) {
    case "selectScenario": {
      const completions = loadCompletionStats(action.scenario.id);
      return {
        scenario: action.scenario,
        layout: { components: [] },
        validation: null,
        completions,
      };
    }
    case "updateLayout":
      return {
        ...state,
        layout: action.layout,
      };
    case "validate": {
      if (!state.scenario) {
        return state;
      }
      const validation = validateLayout(state.layout, state.scenario);
      let completions = state.completions;
      if (
        validation.unmetRequirements.length === 0 &&
        validation.constraintViolations.length === 0 &&
        validation.unknownComponents.length === 0 &&
        validation.victoryConditionsMet.length > 0
      ) {
        recordCompletion(state.scenario.id, {
          scenarioId: state.scenario.id,
          victoryConditionsMet: validation.victoryConditionsMet,
          metrics: validation.metrics,
          completedAt: Date.now(),
        });
        completions = loadCompletionStats(state.scenario.id);
      }
      return {
        ...state,
        validation,
        completions,
      };
    }
    default:
      return state;
  }
}

export function BuilderProvider({ children }: BuilderProviderProps) {
  const [state, dispatch] = useReducer(builderReducer, initialState);

  const value = useMemo<BuilderContextValue>(() => ({ ...state, dispatch }), [state]);

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilderState(): BuilderContextValue {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilderState must be used within a BuilderProvider");
  }
  return context;
}

export function useScenarioSelection(): {
  scenario: PuzzleScenario | null;
  selectScenario: (scenario: PuzzleScenario) => void;
} {
  const { dispatch, scenario } = useBuilderState();
  const selectScenario = useCallback(
    (nextScenario: PuzzleScenario) =>
      dispatch({ type: "selectScenario", scenario: nextScenario }),
    [dispatch]
  );
  return {
    scenario,
    selectScenario,
  };
}

export function useLayoutControls(): {
  layout: PlayerLayout;
  updateLayout: (layout: PlayerLayout) => void;
  validate: () => void;
  validation: ValidationResult | null;
} {
  const { dispatch, layout, validation } = useBuilderState();
  const updateLayout = useCallback(
    (nextLayout: PlayerLayout) =>
      dispatch({ type: "updateLayout", layout: nextLayout }),
    [dispatch]
  );
  const validate = useCallback(() => dispatch({ type: "validate" }), [dispatch]);
  return {
    layout,
    validation,
    updateLayout,
    validate,
  };
}
