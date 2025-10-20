import React, { useEffect, useMemo, useState } from "react";
import { LayoutMetrics, Requirement, ValidationResult } from "../gameplay/puzzle";
import { computeLayoutMetrics } from "../gameplay/validator";
import { BuilderProvider, useBuilderState, useLayoutControls } from "./BuilderState";
import ScenarioSelect from "./ScenarioSelect";
import ResultsModal from "./ResultsModal";
import {
  formatMetricLabel,
  formatMetricValue,
  getRequirementMetricValue,
} from "./metricFormatting";

function isValidationSuccessful(validation: ValidationResult | null): boolean {
  if (!validation) {
    return false;
  }
  return (
    validation.unmetRequirements.length === 0 &&
    validation.constraintViolations.length === 0 &&
    validation.unknownComponents.length === 0 &&
    validation.victoryConditionsMet.length > 0
  );
}

interface RequirementStatus {
  requirement: Requirement;
  met: boolean;
  observed: number;
}

interface VictoryStatus {
  id: string;
  description: string;
  met: boolean;
  requirements: RequirementStatus[];
}

function evaluateRequirement(requirement: Requirement, metrics: LayoutMetrics): boolean {
  const observed = getRequirementMetricValue(requirement, metrics);
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

function describeRequirementDelta(status: RequirementStatus): string | null {
  const { requirement, observed, met } = status;
  const target = requirement.value;
  const difference = observed - target;
  if (requirement.comparator === ">=") {
    if (met) {
      return difference > 0
        ? `${formatMetricValue(requirement.metric, difference)} above target`
        : null;
    }
    return `Need ${formatMetricValue(requirement.metric, target - observed)} more`;
  }
  if (requirement.comparator === "<=") {
    if (met) {
      return target - observed > 0
        ? `${formatMetricValue(requirement.metric, target - observed)} below limit`
        : null;
    }
    return `Reduce by ${formatMetricValue(requirement.metric, observed - target)}`;
  }
  if (requirement.comparator === "=") {
    if (met) {
      return null;
    }
    const formatted = formatMetricValue(requirement.metric, Math.abs(difference));
    return `${difference > 0 ? "+" : "-"}${formatted} from target`;
  }
  return null;
}

function LayoutBuilder() {
  const { scenario, validation, completions } = useBuilderState();
  const { layout, updateLayout, validate } = useLayoutControls();
  const [showResults, setShowResults] = useState(false);

  const success = useMemo(() => isValidationSuccessful(validation), [validation]);

  const metrics = useMemo(
    () => (scenario ? computeLayoutMetrics(layout, scenario) : null),
    [layout, scenario]
  );

  const requirementProgress = useMemo(() => {
    if (!scenario || !metrics) {
      return null;
    }
    const statuses = new Map<string, RequirementStatus>();
    const getStatus = (requirement: Requirement) => {
      const existing = statuses.get(requirement.id);
      if (existing) {
        return existing;
      }
      const observed = getRequirementMetricValue(requirement, metrics);
      const status: RequirementStatus = {
        requirement,
        observed,
        met: evaluateRequirement(requirement, metrics),
      };
      statuses.set(requirement.id, status);
      return status;
    };

    const global = (scenario.globalRequirements ?? []).map((requirement) =>
      getStatus(requirement)
    );
    const victories: VictoryStatus[] = scenario.victoryConditions.map((victory) => {
      const requirements = victory.requirements.map((requirement) => getStatus(requirement));
      return {
        id: victory.id,
        description: victory.description,
        requirements,
        met: requirements.every((status) => status.met),
      };
    });

    return { global, victories };
  }, [scenario, metrics]);

  useEffect(() => {
    if (success) {
      setShowResults(true);
    }
  }, [success]);

  useEffect(() => {
    setShowResults(false);
  }, [scenario?.id]);

  if (!scenario) {
    return <p className="builder-empty">Select a scenario to begin designing your layout.</p>;
  }

  const handleQuantityChange = (componentId: string, quantity: number) => {
    const sanitized = Number.isFinite(quantity) ? Math.max(0, Math.round(quantity)) : 0;
    const remaining = layout.components.filter((entry) => entry.componentId !== componentId);
    const nextComponents =
      sanitized > 0 ? [...remaining, { componentId, quantity: sanitized }] : remaining;
    updateLayout({ components: nextComponents });
  };

  const sortedCompletions = useMemo(
    () =>
      [...completions].sort((left, right) => right.completedAt - left.completedAt),
    [completions]
  );

  return (
    <div className="builder-workspace">
      <header className="builder-workspace__header">
        <h2>{scenario.name}</h2>
        <p>{scenario.description}</p>
      </header>
      <section className="builder-workspace__components">
        <h3>Available Components</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Throughput</th>
              <th>Latency</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {scenario.availableComponents.map((component) => {
              const current = layout.components.find(
                (entry) => entry.componentId === component.id
              );
              return (
                <tr key={component.id}>
                  <td>{component.name}</td>
                  <td>{component.description}</td>
                  <td>{component.throughput}</td>
                  <td>{component.latencyImpact}</td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={current?.quantity ?? 0}
                      onChange={(event) =>
                        handleQuantityChange(component.id, Number(event.target.value))
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="builder-workspace__actions">
        <button type="button" onClick={validate}>
          Validate Layout
        </button>
      </section>

      {metrics && (
        <section className="builder-workspace__metrics">
          <h3>Current Metrics</h3>
          <table>
            <tbody>
              <tr>
                <th scope="row">{formatMetricLabel("tps")}</th>
                <td>{formatMetricValue("tps", metrics.totalThroughput)}</td>
              </tr>
              <tr>
                <th scope="row">{formatMetricLabel("latency")}</th>
                <td>{formatMetricValue("latency", metrics.averageLatency)}</td>
              </tr>
              {Object.entries(metrics.modifiers)
                .filter(([, value]) => typeof value === "number" && !Number.isNaN(value))
                .map(([metric, value]) => (
                  <tr key={metric}>
                    <th scope="row">{formatMetricLabel(metric)}</th>
                    <td>{formatMetricValue(metric as Requirement["metric"], value ?? 0)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}

      {requirementProgress && (
        <section className="builder-workspace__progress">
          <h3>Victory Progress</h3>
          {requirementProgress.global.length > 0 && (
            <div className="builder-workspace__progress-group">
              <h4>Global Requirements</h4>
              <ul>
                {requirementProgress.global.map((status) => {
                  const delta = describeRequirementDelta(status);
                  return (
                    <li key={status.requirement.id}>
                      <div>
                        <strong>{status.met ? "✅" : "⚠️"}</strong> {status.requirement.description}
                      </div>
                      <div>
                        Target: {formatMetricValue(status.requirement.metric, status.requirement.value)} · Current:{" "}
                        {formatMetricValue(status.requirement.metric, status.observed)}
                      </div>
                      {delta && <div>{delta}</div>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="builder-workspace__progress-group">
            <h4>Victory Conditions</h4>
            <ul>
              {requirementProgress.victories.map((victory) => (
                <li key={victory.id}>
                  <div>
                    <strong>{victory.met ? "🏆" : "⏳"}</strong> {victory.description}
                  </div>
                  <ul>
                    {victory.requirements.map((status) => {
                      const delta = describeRequirementDelta(status);
                      return (
                        <li key={`${victory.id}-${status.requirement.id}`}>
                          <div>
                            <strong>{status.met ? "✅" : "⚠️"}</strong> {status.requirement.description}
                          </div>
                          <div>
                            Target: {formatMetricValue(status.requirement.metric, status.requirement.value)} · Current:{" "}
                            {formatMetricValue(status.requirement.metric, status.observed)}
                          </div>
                          {delta && <div>{delta}</div>}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {validation && !success && (
        <section className="builder-workspace__feedback">
          <h3>Validation Feedback</h3>
          {validation.unmetRequirements.length > 0 && (
            <div>
              <h4>Unmet Requirements</h4>
              <ul>
                {validation.unmetRequirements.map((req) => (
                  <li key={req.id}>{req.description}</li>
                ))}
              </ul>
            </div>
          )}
          {validation.constraintViolations.length > 0 && (
            <div>
              <h4>Constraint Violations</h4>
              <ul>
                {validation.constraintViolations.map((violation, index) => (
                  <li key={index}>{violation}</li>
                ))}
              </ul>
            </div>
          )}
          {validation.unknownComponents.length > 0 && (
            <div>
              <h4>Unknown Components</h4>
              <ul>
                {validation.unknownComponents.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="builder-workspace__history">
        <h3>Completion History</h3>
        {sortedCompletions.length === 0 ? (
          <p>No recorded completions yet.</p>
        ) : (
          <ul>
            {sortedCompletions.map((completion) => (
              <li key={completion.completedAt}>
                {new Date(completion.completedAt).toLocaleString()} – Cleared with {" "}
                {completion.victoryConditionsMet.length} goal
                {completion.victoryConditionsMet.length === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        )}
      </section>

      {success && validation && showResults && (
        <ResultsModal
          scenario={scenario}
          validation={validation}
          onClose={() => setShowResults(false)}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <BuilderProvider>
      <main className="app">
        <ScenarioSelect />
        <LayoutBuilder />
      </main>
    </BuilderProvider>
  );
}

export default App;
