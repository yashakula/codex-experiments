import React, { useEffect, useMemo, useState } from "react";
import { ValidationResult } from "../gameplay/puzzle";
import { BuilderProvider, useBuilderState, useLayoutControls } from "./BuilderState";
import ScenarioSelect from "./ScenarioSelect";
import ResultsModal from "./ResultsModal";

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

function LayoutBuilder() {
  const { scenario, validation, completions } = useBuilderState();
  const { layout, updateLayout, validate } = useLayoutControls();
  const [showResults, setShowResults] = useState(false);

  const success = useMemo(() => isValidationSuccessful(validation), [validation]);

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
        {completions.length === 0 ? (
          <p>No recorded completions yet.</p>
        ) : (
          <ul>
            {completions.map((completion) => (
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
