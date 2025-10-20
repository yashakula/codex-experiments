import { LayoutMetrics, MetricType, Requirement } from "../gameplay/puzzle";

export function formatMetricValue(metric: MetricType, value: number): string {
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

export function formatMetricLabel(metric: string): string {
  switch (metric) {
    case "tps":
      return "Total Throughput";
    case "latency":
      return "Average Latency";
    case "errorRate":
      return "Error Rate";
    case "bandwidth":
      return "Bandwidth";
    default:
      return metric.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
  }
}

export function getRequirementMetricValue(
  requirement: Requirement,
  metrics: LayoutMetrics
): number {
  switch (requirement.metric) {
    case "tps":
      return metrics.totalThroughput;
    case "latency":
      return metrics.averageLatency;
    default:
      return metrics.modifiers[requirement.metric] ?? 0;
  }
}
