"use client";

import { useState } from "react";

interface TaskOption {
  id: string;
  name: string;
  description: string;
}

interface CharacterData {
  id: string;
  name: string;
  name_ru: string;
  role: string;
  bio: string;
  portraitFile: string;
  color: string;
  skills: string[];
  default_model?: string;
  tasks: TaskOption[];
}

interface Props {
  character: CharacterData;
  onClose: () => void;
  onStartChat: (taskId?: string) => void;
}

export default function BioCard({ character, onClose, onStartChat }: Props) {
  const [portraitError, setPortraitError] = useState(false);
  const portraitPath = `/portraits/${character.portraitFile}`;

  const modelLabel =
    character.default_model === "claude-sonnet"
      ? "Claude Sonnet"
      : character.default_model === "perplexity"
        ? "Perplexity"
        : character.default_model || "AI";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Card */}
      <div
        className="relative w-[450px] max-h-[550px] overflow-y-auto"
        style={{
          backgroundColor: "rgba(26, 26, 46, 0.97)",
          border: "2px solid #c8a84e",
          animation: "bioCardIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 font-pixel text-sm text-rpg-text hover:text-rpg-gold z-10"
        >
          X
        </button>

        <div className="p-6">
          {/* Header: portrait + name/role */}
          <div className="flex gap-5 mb-5">
            {/* Portrait */}
            {!portraitError && character.portraitFile ? (
              <img
                src={portraitPath}
                alt={character.name_ru}
                onError={() => setPortraitError(true)}
                className="flex-shrink-0"
                style={{
                  width: 200,
                  height: 200,
                  objectFit: "cover",
                  border: "2px solid #c8a84e",
                }}
              />
            ) : (
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: 200,
                  height: 200,
                  backgroundColor: character.color || "#4a4a6a",
                  border: "2px solid #c8a84e",
                }}
              >
                <span className="font-pixel text-white" style={{ fontSize: 48 }}>
                  {character.name_ru
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="font-pixel text-rpg-gold" style={{ fontSize: 20 }}>
                {character.name_ru}
              </h2>
              <p className="font-body text-rpg-text mt-1" style={{ fontSize: 14 }}>
                {character.role}
              </p>
              <p
                className="font-body mt-1"
                style={{ fontSize: 12, color: "#6a6a8a" }}
              >
                AI: {modelLabel}
              </p>
            </div>
          </div>

          {/* Bio section */}
          <div className="mb-4">
            <div
              className="flex items-center gap-2 mb-2"
              style={{ color: "#6a6a8a", fontSize: 12 }}
            >
              <span className="font-pixel">О персонаже</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#3a3a5a" }} />
            </div>
            <p className="font-body text-rpg-text" style={{ fontSize: 14, lineHeight: 1.6 }}>
              {character.bio}
            </p>
          </div>

          {/* Skills section */}
          {character.skills && character.skills.length > 0 && (
            <div className="mb-4">
              <div
                className="flex items-center gap-2 mb-2"
                style={{ color: "#6a6a8a", fontSize: 12 }}
              >
                <span className="font-pixel">Навыки</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "#3a3a5a" }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {character.skills.map((skill) => (
                  <span
                    key={skill}
                    className="font-pixel"
                    style={{
                      fontSize: 12,
                      backgroundColor: "#2a2a4e",
                      border: "1px solid #c8a84e",
                      padding: "4px 10px",
                      color: "#e0d5c1",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quests section */}
          {character.tasks && character.tasks.length > 0 && (
            <div className="mb-5">
              <div
                className="flex items-center gap-2 mb-2"
                style={{ color: "#6a6a8a", fontSize: 12 }}
              >
                <span className="font-pixel">Доступные квесты</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "#3a3a5a" }} />
              </div>
              <div className="space-y-1">
                {character.tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onStartChat(task.id)}
                    className="w-full text-left px-3 py-2 font-body text-rpg-text hover:text-rpg-gold transition-colors"
                    style={{
                      fontSize: 14,
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <span className="mr-2">🔍</span>
                    {task.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start Chat button */}
          <button
            onClick={() => onStartChat()}
            className="w-full py-3 font-pixel text-sm text-center transition-colors"
            style={{
              backgroundColor: "#c8a84e",
              color: "#1a1a2e",
              border: "none",
              cursor: "pointer",
            }}
          >
            💬 Начать чат
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bioCardIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
