import React from "react";
import { COMPONENT_DRAG_MIME } from "./dragTypes";
import { useBuilderStore, selectAvailableComponents } from "./state/builderStore";

export function ComponentPalette(): JSX.Element {
  const components = useBuilderStore(selectAvailableComponents);

  const handleDragStart = (componentId: string) => (event: React.DragEvent) => {
    event.dataTransfer.setData(COMPONENT_DRAG_MIME, componentId);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      style={{
        width: 280,
        padding: "1rem",
        borderRight: "1px solid #e5e7eb",
        overflowY: "auto",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Component Palette</h2>
      <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
        Drag components onto the canvas to add them to your architecture.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {components.map((component) => (
          <li
            key={component.id}
            draggable
            onDragStart={handleDragStart(component.id)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "0.75rem",
              marginBottom: "0.75rem",
              cursor: "grab",
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ fontWeight: 600 }}>{component.name}</div>
            <div style={{ color: "#4b5563", fontSize: "0.875rem" }}>
              {component.description}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default ComponentPalette;
