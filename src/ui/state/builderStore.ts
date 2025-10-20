import create from "zustand";
import { Edge, Node } from "reactflow";
import { puzzleScenarios } from "../../gameplay/puzzle-fixtures";
import {
  ComponentDefinition,
  PlayerLayout,
  PuzzleScenario,
  ValidationResult,
} from "../../gameplay/puzzle";
import { validateLayout } from "../../gameplay/validator";

export interface BuilderNodeData {
  componentId: string;
  label: string;
}

export type BuilderNode = Node<BuilderNodeData>;
export type BuilderEdge = Edge;

type NodesUpdater = BuilderNode[] | ((nodes: BuilderNode[]) => BuilderNode[]);
type EdgesUpdater = BuilderEdge[] | ((edges: BuilderEdge[]) => BuilderEdge[]);

type BuilderStore = {
  scenario: PuzzleScenario;
  availableComponents: ComponentDefinition[];
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  layout: PlayerLayout;
  validation: ValidationResult;
  addComponent: (componentId: string, position: { x: number; y: number }) => void;
  setNodes: (updater: NodesUpdater) => void;
  setEdges: (updater: EdgesUpdater) => void;
  reset: () => void;
};

const DEFAULT_SCENARIO: PuzzleScenario = puzzleScenarios[0];

function deriveLayout(nodes: BuilderNode[]): PlayerLayout {
  const counts = new Map<string, number>();
  for (const node of nodes) {
    const componentId = node.data?.componentId;
    if (!componentId) {
      continue;
    }
    counts.set(componentId, (counts.get(componentId) ?? 0) + 1);
  }

  const components = Array.from(counts.entries()).map(([componentId, quantity]) => ({
    componentId,
    quantity,
  }));

  return { components };
}

function runValidation(
  nodes: BuilderNode[],
  scenario: PuzzleScenario
): ValidationResult {
  const layout = deriveLayout(nodes);
  return validateLayout(layout, scenario);
}

let nextNodeId = 1;

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  scenario: DEFAULT_SCENARIO,
  availableComponents: DEFAULT_SCENARIO.availableComponents,
  nodes: [],
  edges: [],
  layout: { components: [] },
  validation: validateLayout({ components: [] }, DEFAULT_SCENARIO),
  addComponent: (componentId, position) => {
    const { scenario } = get();
    const component = scenario.availableComponents.find(
      (item) => item.id === componentId
    );
    if (!component) {
      return;
    }

    const nodeId = `component-${nextNodeId++}`;
    const newNode: BuilderNode = {
      id: nodeId,
      type: "default",
      position,
      data: {
        componentId,
        label: component.name,
      },
    };

    set((state) => {
      const nodes = [...state.nodes, newNode];
      return {
        nodes,
        layout: deriveLayout(nodes),
        validation: runValidation(nodes, state.scenario),
      };
    });
  },
  setNodes: (updater) => {
    set((state) => {
      const nextNodes =
        typeof updater === "function"
          ? (updater as (nodes: BuilderNode[]) => BuilderNode[])(state.nodes)
          : updater;
      return {
        nodes: nextNodes,
        layout: deriveLayout(nextNodes),
        validation: runValidation(nextNodes, state.scenario),
      };
    });
  },
  setEdges: (updater) => {
    set((state) => {
      const nextEdges =
        typeof updater === "function"
          ? (updater as (edges: BuilderEdge[]) => BuilderEdge[])(state.edges)
          : updater;
      return { edges: nextEdges };
    });
  },
  reset: () => {
    nextNodeId = 1;
    set((state) => ({
      nodes: [],
      edges: [],
      layout: { components: [] },
      validation: validateLayout({ components: [] }, state.scenario),
    }));
  },
}));

export function selectValidation(state: BuilderStore): ValidationResult {
  return state.validation;
}

export function selectNodes(state: BuilderStore): BuilderNode[] {
  return state.nodes;
}

export function selectEdges(state: BuilderStore): BuilderEdge[] {
  return state.edges;
}

export function selectAvailableComponents(
  state: BuilderStore
): ComponentDefinition[] {
  return state.availableComponents;
}
