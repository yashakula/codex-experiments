import React, { useMemo } from "react";
import {
  PuzzleScenario,
  Requirement,
  ValidationResult,
} from "../gameplay/puzzle";

type ResultsModalProps = {
  scenario: PuzzleScenario;
  validation: ValidationResult;
  onClose: () => void;
};

interface RequirementSummary {
  requirement: Requirement;
  achieved: number;
}

function getMetricValue(requirement: Requirement, validation: ValidationResult): number {
  switch (requirement.metric) {
    case "tps":
      return validation.metrics.totalThroughput;
    case "latency":
      return validation.metrics.averageLatency;
    default:
      return validation.metrics.modifiers[requirement.metric] ?? 0;
  }
}

function formatMetricValue(metric: Requirement["metric"], value: number): string {
  switch (metric) {
    case "latency":
      return `${value.toFixed(0)} ms`;
    case "tps":
      return `${value.toFixed(0)} TPS`;
    case "bandwidth":
      return `${value.toFixed(0)} Mbps`;
    case "errorRate":
      return `${(value * 100).toFixed(2)}%`;
    default:
      return value.toFixed(2);
  }
}

function summarizeRequirements(
  scenario: PuzzleScenario,
  validation: ValidationResult
): RequirementSummary[] {
  const summaries: RequirementSummary[] = [];
  const addRequirement = (requirement: Requirement) => {
    summaries.push({
      requirement,
      achieved: getMetricValue(requirement, validation),
    });
  };
  (scenario.globalRequirements ?? []).forEach(addRequirement);
  const metVictoryIds = new Set(validation.victoryConditionsMet);
  scenario.victoryConditions
    .filter((victory) => metVictoryIds.has(victory.id))
    .forEach((victory) => victory.requirements.forEach(addRequirement));
  return summaries;
}

function describeRequirement(requirement: Requirement): string {
  const target = formatMetricValue(requirement.metric, requirement.value);
  return `${requirement.description} (${requirement.comparator} ${target})`;
}

function buildImprovementTips(summaries: RequirementSummary[]): string[] {
  const tips: string[] = [];
  for (const { requirement, achieved } of summaries) {
    const target = requirement.value;
    const comparator = requirement.comparator;
    const epsilon = Math.abs(target) * 0.05 + 1;
    if (comparator === ">=" && achieved - target < epsilon) {
      tips.push(
        `Consider investing further in ${requirement.metric} to build buffer above the requirement.`
      );
    }
    if (comparator === "<=" && target - achieved < epsilon) {
      tips.push(
        `Explore optimizations that reduce ${requirement.metric} for additional safety margin.`
      );
    }
  }
  return tips;
}

export function ResultsModal({ scenario, validation, onClose }: ResultsModalProps) {
  const requirementSummaries = useMemo(
    () => summarizeRequirements(scenario, validation),
    [scenario, validation]
  );
  const improvementTips = useMemo(
    () => buildImprovementTips(requirementSummaries),
    [requirementSummaries]
  );

  return (
    <div className="results-modal" role="dialog" aria-modal="true">
      <div className="results-modal__content">
        <header>
          <h2>Victory Achieved!</h2>
          <p>
            You cleared <strong>{scenario.name}</strong> by meeting the goals of the
            following victory condition(s):
          </p>
          <ul>
            {validation.victoryConditionsMet.map((victoryId) => {
              const victory = scenario.victoryConditions.find((v) => v.id === victoryId);
              return <li key={victoryId}>{victory ? victory.description : victoryId}</li>;
            })}
          </ul>
        </header>

        <section className="results-modal__metrics">
          <h3>Performance Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Target</th>
                <th>Achieved</th>
              </tr>
            </thead>
            <tbody>
              {requirementSummaries.map(({ requirement, achieved }) => (
                <tr key={requirement.id}>
                  <td>{describeRequirement(requirement)}</td>
                  <td>{formatMetricValue(requirement.metric, requirement.value)}</td>
                  <td>{formatMetricValue(requirement.metric, achieved)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {improvementTips.length > 0 && (
          <section className="results-modal__tips">
            <h3>Keep Pushing</h3>
            <ul>
              {improvementTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </section>
        )}

        <footer className="results-modal__actions">
          <button type="button" onClick={onClose}>
            Back to Builder
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ResultsModal;
