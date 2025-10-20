export type MetricType = "tps" | "latency" | "bandwidth" | "errorRate";

export type RequirementComparator = ">=" | "<=" | "=";

export interface Requirement {
  /**
   * Unique identifier to make it easier to cross reference requirements
   * when producing validation reports.
   */
  id: string;
  /**
   * Human readable summary of what the requirement represents.
   */
  description: string;
  /**
   * Metric that this requirement is targeting. Metrics map directly to
   * aggregates computed by the validator.
   */
  metric: MetricType;
  /**
   * Comparator that should be used when determining whether the player has
   * satisfied the requirement.
   */
  comparator: RequirementComparator;
  /**
   * Target value for the metric, expressed in the units appropriate for the
   * metric type. For example TPS, milliseconds, Mbps, etc.
   */
  value: number;
}

export type ComponentConstraintType = "maxQuantity" | "requiresComponent";

export interface ComponentConstraint {
  type: ComponentConstraintType;
  /**
   * Optional identifier of another component that must be present in the
   * player's layout. Used when type is `requiresComponent`.
   */
  componentId?: string;
  /**
   * Numeric limit associated with the constraint. For example the maximum
   * quantity allowed for a component.
   */
  limit?: number;
}

export interface ComponentDefinition {
  /**
   * Unique identifier of the component.
   */
  id: string;
  /**
   * Human readable name shown to the player.
   */
  name: string;
  /**
   * Brief description that can be surfaced in UI tooltips or documentation.
   */
  description: string;
  /**
   * Throughput contribution expressed in transactions per second. The validator
   * aggregates throughput by multiplying this value by the quantity of the
   * component present in the player's layout.
   */
  throughput: number;
  /**
   * Latency impact in milliseconds. Negative values represent latency
   * reductions, while positive values increase latency.
   */
  latencyImpact: number;
  /**
   * Additional metrics the component can affect (e.g., bandwidth usage,
   * error-rate reductions). Values are additive just like throughput.
   */
  modifiers?: Partial<Record<MetricType, number>>;
  /**
   * Optional set of constraints that should be validated against the player's
   * layout (e.g., max quantity, dependency on other components).
   */
  constraints?: ComponentConstraint[];
}

export interface VictoryCondition {
  id: string;
  /**
   * Summary of what the player needs to accomplish. This typically references
   * the underlying requirements.
   */
  description: string;
  /**
   * List of requirements that must be satisfied simultaneously for the victory
   * condition to be considered achieved.
   */
  requirements: Requirement[];
}

export interface PuzzleScenario {
  id: string;
  name: string;
  /**
   * Short description explaining the narrative or bottleneck for the scenario.
   */
  description: string;
  /**
   * Helpful tag to describe the dominant constraint (e.g. CPU, latency, IO).
   */
  bottleneck: string;
  /**
   * Baseline throughput provided before any player components are added.
   */
  baselineThroughput: number;
  /**
   * Baseline latency before modifications are applied.
   */
  baselineLatency: number;
  /**
   * Baseline values for optional metrics, like bandwidth or error rate.
   */
  baselineModifiers?: Partial<Record<MetricType, number>>;
  /**
   * Components the player can choose from when designing their layout.
   */
  availableComponents: ComponentDefinition[];
  /**
   * Optional global constraints that apply to the entire scenario.
   */
  globalRequirements?: Requirement[];
  /**
   * One or more victory conditions the player may attempt to satisfy.
   */
  victoryConditions: VictoryCondition[];
}

export interface LayoutComponent {
  componentId: string;
  /**
   * Quantity of the component included in the player's layout. Defaults to 1
   * when omitted but is always normalized by the validator.
   */
  quantity?: number;
}

export interface PlayerLayout {
  components: LayoutComponent[];
}

export interface LayoutMetrics {
  totalThroughput: number;
  averageLatency: number;
  modifiers: Partial<Record<MetricType, number>>;
}

export interface ValidationResult {
  metrics: LayoutMetrics;
  unmetRequirements: Requirement[];
  unknownComponents: string[];
  constraintViolations: string[];
  victoryConditionsMet: string[];
}
