import { PuzzleScenario } from "./puzzle";

export const puzzleScenarios: PuzzleScenario[] = [
  {
    id: "cpu-burst",
    name: "CPU Burst Balancing",
    description:
      "Handle an unexpected marketing campaign by scaling compute without blowing the latency budget.",
    bottleneck: "cpu",
    baselineThroughput: 1200,
    baselineLatency: 320,
    baselineModifiers: { bandwidth: 180 },
    availableComponents: [
      {
        id: "edge-cache",
        name: "Edge Cache",
        description: "Caches responses at the edge to offload origin CPU work.",
        throughput: 180,
        latencyImpact: -25,
        modifiers: { bandwidth: -20 },
        constraints: [
          {
            type: "maxQuantity",
            limit: 4,
          },
        ],
      },
      {
        id: "app-server",
        name: "Application Server",
        description: "General purpose server that increases throughput but adds latency.",
        throughput: 320,
        latencyImpact: 12,
      },
      {
        id: "async-worker",
        name: "Async Worker Pool",
        description: "Moves non-critical work to async jobs reducing request latency.",
        throughput: 90,
        latencyImpact: -40,
        constraints: [
          {
            type: "requiresComponent",
            componentId: "message-queue",
          },
        ],
      },
      {
        id: "message-queue",
        name: "Message Queue",
        description: "Buffers async jobs but increases backend bandwidth consumption.",
        throughput: 60,
        latencyImpact: 18,
        modifiers: { bandwidth: 35 },
      },
    ],
    globalRequirements: [
      {
        id: "latency-budget",
        description: "Keep the end-to-end latency under 250ms",
        metric: "latency",
        comparator: "<=",
        value: 250,
      },
    ],
    victoryConditions: [
      {
        id: "campaign-success",
        description: "Support 2k TPS while keeping latency manageable",
        requirements: [
          {
            id: "tps-target",
            description: "Achieve 2000 TPS",
            metric: "tps",
            comparator: ">=",
            value: 2000,
          },
          {
            id: "latency-target",
            description: "Stay below 250ms latency",
            metric: "latency",
            comparator: "<=",
            value: 250,
          },
          {
            id: "bandwidth-budget",
            description: "Keep bandwidth usage under 220 Mbps",
            metric: "bandwidth",
            comparator: "<=",
            value: 220,
          },
        ],
      },
    ],
  },
  {
    id: "latency-sensitive",
    name: "Latency Sensitive Trading",
    description:
      "An exchange needs extremely low latency while maintaining moderate throughput.",
    bottleneck: "latency",
    baselineThroughput: 900,
    baselineLatency: 140,
    baselineModifiers: { errorRate: 0.015 },
    availableComponents: [
      {
        id: "fpga-accelerator",
        name: "FPGA Accelerator",
        description: "Ultra-low latency compute with modest throughput gains.",
        throughput: 150,
        latencyImpact: -55,
        constraints: [
          {
            type: "maxQuantity",
            limit: 2,
          },
        ],
      },
      {
        id: "in-memory-db",
        name: "In-memory Order Book",
        description: "Stores state in-memory reducing latency and error rate.",
        throughput: 80,
        latencyImpact: -20,
        modifiers: { errorRate: -0.01 },
      },
      {
        id: "risk-engine",
        name: "Risk Engine",
        description: "Validates orders, decreasing error rate but adding latency.",
        throughput: 40,
        latencyImpact: 30,
        modifiers: { errorRate: -0.008 },
      },
    ],
    globalRequirements: [
      {
        id: "error-budget",
        description: "Keep error rate below 1%",
        metric: "errorRate",
        comparator: "<=",
        value: 0.01,
      },
    ],
    victoryConditions: [
      {
        id: "latency-champion",
        description: "Deliver <100ms latency while sustaining 1200 TPS",
        requirements: [
          {
            id: "latency-under-100",
            description: "Reach 100ms latency or better",
            metric: "latency",
            comparator: "<=",
            value: 100,
          },
          {
            id: "throughput-1200",
            description: "Reach 1200 TPS",
            metric: "tps",
            comparator: ">=",
            value: 1200,
          },
        ],
      },
    ],
  },
  {
    id: "bandwidth-crunch",
    name: "Bandwidth Crunch",
    description:
      "Content delivery network struggles with cross-region bandwidth costs.",
    bottleneck: "bandwidth",
    baselineThroughput: 1500,
    baselineLatency: 280,
    baselineModifiers: { bandwidth: 260 },
    availableComponents: [
      {
        id: "regional-cache",
        name: "Regional Cache",
        description: "Keeps data close to users, reducing bandwidth usage.",
        throughput: 120,
        latencyImpact: -30,
        modifiers: { bandwidth: -45 },
      },
      {
        id: "image-optimizer",
        name: "Image Optimizer",
        description: "Compresses images to reduce bandwidth and latency.",
        throughput: 60,
        latencyImpact: -10,
        modifiers: { bandwidth: -30 },
      },
      {
        id: "edge-compute",
        name: "Edge Compute",
        description: "Executes user logic at the edge improving latency but using more bandwidth.",
        throughput: 200,
        latencyImpact: -50,
        modifiers: { bandwidth: 25 },
      },
    ],
    victoryConditions: [
      {
        id: "cost-saver",
        description: "Keep bandwidth under 200 Mbps while scaling to 2200 TPS",
        requirements: [
          {
            id: "tps-2200",
            description: "Reach 2200 TPS",
            metric: "tps",
            comparator: ">=",
            value: 2200,
          },
          {
            id: "bandwidth-under-200",
            description: "Stay below 200 Mbps bandwidth",
            metric: "bandwidth",
            comparator: "<=",
            value: 200,
          },
          {
            id: "latency-under-230",
            description: "Keep latency under 230 ms",
            metric: "latency",
            comparator: "<=",
            value: 230,
          },
        ],
      },
    ],
  },
];
