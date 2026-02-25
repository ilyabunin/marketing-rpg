"use client";

import { ReactNode } from "react";

interface RPGPanelProps {
  children: ReactNode;
  className?: string;
  borderColor?: string;
}

export default function RPGPanel({
  children,
  className = "",
  borderColor = "#e0d5c1",
}: RPGPanelProps) {
  return (
    <div
      className={`rpg-panel ${className}`}
      style={{
        background: "rgba(26, 26, 46, 0.95)",
        border: `4px solid ${borderColor}`,
        outline: "2px solid #4a4a6a",
        outlineOffset: "-6px",
        padding: "8px",
        imageRendering: "pixelated",
      }}
    >
      {children}
    </div>
  );
}
