import React, { useEffect } from "react";
import { puzzleScenarios } from "../gameplay/puzzle-fixtures";
import { useScenarioSelection } from "./BuilderState";
import { loadCompletionStats } from "./completionStorage";

interface ScenarioCardProps {
  name: string;
  description: string;
  bottleneck: string;
  selected: boolean;
  completions: number;
  onSelect: () => void;
}

function ScenarioCard({
  name,
  description,
  bottleneck,
  selected,
  completions,
  onSelect,
}: ScenarioCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`scenario-card${selected ? " scenario-card--selected" : ""}`}
      aria-pressed={selected}
    >
      <div className="scenario-card__header">
        <h3>{name}</h3>
        <span className="scenario-card__tag">{bottleneck.toUpperCase()}</span>
      </div>
      <p className="scenario-card__description">{description}</p>
      <p className="scenario-card__footnote">
        {completions > 0
          ? `${completions} completion${completions === 1 ? "" : "s"}`
          : "No clears yet"}
      </p>
    </button>
  );
}

export function ScenarioSelect() {
  const { scenario, selectScenario } = useScenarioSelection();

  useEffect(() => {
    if (!scenario && puzzleScenarios.length > 0) {
      selectScenario(puzzleScenarios[0]);
    }
  }, [scenario, selectScenario]);

  return (
    <section className="scenario-select">
      <header className="scenario-select__intro">
        <h2>Select a Scenario</h2>
        <p>
          Choose an infrastructure puzzle to begin planning. Each scenario highlights a
          different bottleneck and provides unique components to experiment with.
        </p>
      </header>
      <div className="scenario-select__grid">
        {puzzleScenarios.map((candidate) => (
          <ScenarioCard
            key={candidate.id}
            name={candidate.name}
            description={candidate.description}
            bottleneck={candidate.bottleneck}
            selected={scenario?.id === candidate.id}
            completions={loadCompletionStats(candidate.id).length}
            onSelect={() => selectScenario(candidate)}
          />
        ))}
      </div>
    </section>
  );
}

export default ScenarioSelect;
