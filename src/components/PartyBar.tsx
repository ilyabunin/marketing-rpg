"use client";

import { useState, useEffect } from "react";
import CharacterAvatar from "./CharacterAvatar";

interface CharacterData {
  id: string;
  name: string;
  name_ru: string;
  role: string;
  greeting: string;
  bio: string;
  portraitFile: string;
  color: string;
  skills: string[];
  default_model?: string;
  position: { x: number; y: number };
  tasks: { id: string; name: string; description: string }[];
}

type CharStatus = "idle" | "working" | "done";

interface Props {
  characters: CharacterData[];
  selectedId: string | null;
  onSelect: (c: CharacterData) => void;
}

export default function PartyBar({ characters, selectedId, onSelect }: Props) {
  const [statuses, setStatuses] = useState<Record<string, CharStatus>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Listen for character-status-update events from Phaser scene
  useEffect(() => {
    function handleStatusUpdate(e: Event) {
      const { id, status } = (e as CustomEvent).detail;
      setStatuses((prev) => ({ ...prev, [id]: status }));
    }
    window.addEventListener("character-status-update", handleStatusUpdate);
    return () => {
      window.removeEventListener("character-status-update", handleStatusUpdate);
    };
  }, []);

  return (
    <div
      className="flex items-center gap-3 px-4 py-2"
      style={{
        backgroundColor: "#1a1a2e",
        borderTop: "2px solid #c8a84e",
      }}
    >
      <span
        className="font-pixel mr-1"
        style={{ fontSize: 10, color: "#6a6a8a" }}
      >
        PARTY:
      </span>
      {characters.map((c) => {
        const isActive = c.id === selectedId;
        const status = statuses[c.id] || "idle";
        const isWorking = status === "working";
        const isDone = status === "done";
        const isHovered = hoveredId === c.id;

        return (
          <div key={c.id} className="relative">
            <button
              onClick={() => onSelect(c)}
              onMouseEnter={() => setHoveredId(c.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative block transition-transform hover:scale-110"
              style={{
                padding: 2,
                border: `2px solid ${
                  isActive
                    ? "#c8a84e"
                    : isWorking
                      ? "#f0a030"
                      : isDone
                        ? "#4ad98a"
                        : "#3a3a5a"
                }`,
                backgroundColor: isActive
                  ? "rgba(200, 168, 78, 0.15)"
                  : "transparent",
                cursor: "pointer",
                animation: isWorking ? "partyPulse 1.5s ease-in-out infinite" : "none",
              }}
            >
              <CharacterAvatar characterId={c.id} size={44} />

              {/* Status dot */}
              {(isWorking || isDone) && (
                <div
                  className="absolute -top-1 -right-1 w-3 h-3"
                  style={{
                    backgroundColor: isWorking ? "#f0a030" : "#4ad98a",
                    border: "1px solid #1a1a2e",
                  }}
                />
              )}

              {/* Active gold corner */}
              {isActive && (
                <div
                  className="absolute -top-1 -left-1 w-2 h-2"
                  style={{ backgroundColor: "#c8a84e" }}
                />
              )}
            </button>

            {/* Tooltip */}
            {isHovered && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap z-50"
                style={{
                  padding: "4px 8px",
                  backgroundColor: "rgba(26, 26, 46, 0.95)",
                  border: "1px solid #c8a84e",
                }}
              >
                <div className="font-pixel" style={{ fontSize: 11, color: "#c8a84e" }}>
                  {c.name_ru}
                </div>
                <div className="font-body" style={{ fontSize: 10, color: "#6a6a8a" }}>
                  {c.role}
                </div>
                {isWorking && (
                  <div className="font-pixel" style={{ fontSize: 9, color: "#f0a030" }}>
                    Working...
                  </div>
                )}
                {isDone && (
                  <div className="font-pixel" style={{ fontSize: 9, color: "#4ad98a" }}>
                    Done!
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <style jsx>{`
        @keyframes partyPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(240, 160, 48, 0.4);
          }
          50% {
            box-shadow: 0 0 8px 2px rgba(240, 160, 48, 0.6);
          }
        }
      `}</style>
    </div>
  );
}
