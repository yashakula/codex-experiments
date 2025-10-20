import React, { useCallback } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Connection,
  Controls,
  EdgeChange,
  MiniMap,
  NodeChange,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { COMPONENT_DRAG_MIME } from "./dragTypes";
import {
  selectEdges,
  selectNodes,
  useBuilderStore,
} from "./state/builderStore";

function BuilderCanvasInner(): JSX.Element {
  const nodes = useBuilderStore(selectNodes);
  const edges = useBuilderStore(selectEdges);
  const setNodes = useBuilderStore((state) => state.setNodes);
  const setEdges = useBuilderStore((state) => state.setEdges);
  const addComponent = useBuilderStore((state) => state.addComponent);

  const { project } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const componentId = event.dataTransfer.getData(COMPONENT_DRAG_MIME);
      if (!componentId) {
        return;
      }
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      addComponent(componentId, position);
    },
    [addComponent, project]
  );

  return (
    <div style={{ width: "100%", height: "100%" }} onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background gap={24} size={1} />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export function BuilderCanvas(): JSX.Element {
  return (
    <div style={{ flex: 1, height: "100%" }}>
      <ReactFlowProvider>
        <BuilderCanvasInner />
      </ReactFlowProvider>
    </div>
  );
}

export default BuilderCanvas;
