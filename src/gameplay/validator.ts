import {
  ComponentDefinition,
  LayoutMetrics,
  PlayerLayout,
  PuzzleScenario,
  Requirement,
  ValidationResult,
} from "./puzzle";

const DEFAULT_QUANTITY = 1;

function getQuantity(quantity?: number): number {
  if (typeof quantity !== "number" || Number.isNaN(quantity)) {
    return DEFAULT_QUANTITY;
  }
  return Math.max(0, quantity);
}

function evaluateRequirement(requirement: Requirement, metrics: LayoutMetrics): boolean {
  const observed = getMetricValue(requirement.metric, metrics);
  switch (requirement.comparator) {
    case ">=":
      return observed >= requirement.value;
    case "<=":
      return observed <= requirement.value;
    case "=":
      return observed === requirement.value;
    default:
      return false;
  }
}

function getMetricValue(metric: Requirement["metric"], metrics: LayoutMetrics): number {
  switch (metric) {
    case "tps":
      return metrics.totalThroughput;
    case "latency":
      return metrics.averageLatency;
    default:
      return metrics.modifiers[metric] ?? 0;
  }
}

function aggregateModifiers(
  accumulator: LayoutMetrics["modifiers"],
  component: ComponentDefinition,
  quantity: number,
  metrics: LayoutMetrics
) {
  if (!component.modifiers) {
    return;
  }
  for (const [metricKey, delta] of Object.entries(component.modifiers)) {
    const metric = metricKey as Requirement["metric"];
    if (metric === "tps") {
      metrics.totalThroughput += delta * quantity;
    } else if (metric === "latency") {
      metrics.averageLatency += delta * quantity;
    } else {
      accumulator[metric] = (accumulator[metric] ?? 0) + delta * quantity;
    }
  }
}

function cloneBaselineModifiers(
  scenario: PuzzleScenario
): LayoutMetrics["modifiers"] {
  return { ...(scenario.baselineModifiers ?? {}) };
}

function summarizeComponentConstraints(
  component: ComponentDefinition,
  quantity: number,
  layoutCounts: Map<string, number>
): string[] {
  if (!component.constraints || component.constraints.length === 0) {
    return [];
  }
  const violations: string[] = [];
  for (const constraint of component.constraints) {
    if (constraint.type === "maxQuantity" && constraint.limit !== undefined) {
      if (quantity > constraint.limit) {
        violations.push(
          `${component.name}: limited to ${constraint.limit} but received ${quantity}`
        );
      }
    }
    if (constraint.type === "requiresComponent" && constraint.componentId) {
      const requiredQuantity = layoutCounts.get(constraint.componentId) ?? 0;
      if (requiredQuantity <= 0) {
        violations.push(
          `${component.name}: requires component '${constraint.componentId}'`
        );
      }
    }
  }
  return violations;
}

function buildLayoutCounts(layout: PlayerLayout): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of layout.components) {
    const quantity = getQuantity(entry.quantity);
    counts.set(entry.componentId, (counts.get(entry.componentId) ?? 0) + quantity);
  }
  return counts;
}

export function computeLayoutMetrics(
  layout: PlayerLayout,
  scenario: PuzzleScenario
): LayoutMetrics {
  const modifiers = cloneBaselineModifiers(scenario);
  const metrics: LayoutMetrics = {
    totalThroughput: scenario.baselineThroughput,
    averageLatency: scenario.baselineLatency,
    modifiers,
  };

  const componentLookup = new Map(
    scenario.availableComponents.map((component) => [component.id, component])
  );

  for (const entry of layout.components) {
    const component = componentLookup.get(entry.componentId);
    if (!component) {
      continue;
    }
    const quantity = getQuantity(entry.quantity);
    metrics.totalThroughput += component.throughput * quantity;
    metrics.averageLatency += component.latencyImpact * quantity;
    aggregateModifiers(modifiers, component, quantity, metrics);
  }

  return metrics;
}

export function validateLayout(
  layout: PlayerLayout,
  scenario: PuzzleScenario
): ValidationResult {
  const componentLookup = new Map(
    scenario.availableComponents.map((component) => [component.id, component])
  );

  const unknownComponents: string[] = [];
  const constraintViolations: string[] = [];

  const layoutCounts = buildLayoutCounts(layout);

  for (const [componentId, quantity] of layoutCounts.entries()) {
    const component = componentLookup.get(componentId);
    if (!component) {
      unknownComponents.push(componentId);
      continue;
    }
    constraintViolations.push(
      ...summarizeComponentConstraints(component, quantity, layoutCounts)
    );
  }

  const metrics = computeLayoutMetrics(layout, scenario);
  const unmetRequirements: Requirement[] = [];
  const victoryConditionsMet: string[] = [];

  const seenRequirementIds = new Set<string>();

  const trackUnmetRequirement = (requirement: Requirement) => {
    if (seenRequirementIds.has(requirement.id)) {
      return;
    }
    unmetRequirements.push(requirement);
    seenRequirementIds.add(requirement.id);
  };

  const requirementsToCheck = scenario.globalRequirements ?? [];
  for (const requirement of requirementsToCheck) {
    if (!evaluateRequirement(requirement, metrics)) {
      trackUnmetRequirement(requirement);
    }
  }

  for (const victory of scenario.victoryConditions) {
    const unmetForVictory: Requirement[] = [];
    for (const requirement of victory.requirements) {
      if (!evaluateRequirement(requirement, metrics)) {
        unmetForVictory.push(requirement);
      }
    }
    if (unmetForVictory.length === 0) {
      victoryConditionsMet.push(victory.id);
    } else {
      unmetForVictory.forEach(trackUnmetRequirement);
    }
  }

  return {
    metrics,
    unmetRequirements,
    unknownComponents,
    constraintViolations,
    victoryConditionsMet,
  };
}
