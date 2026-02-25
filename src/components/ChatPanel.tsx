"use client";

import { useState, useRef, useEffect } from "react";
import CharacterAvatar from "./CharacterAvatar";

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
  greeting: string;
  bio: string;
  portraitFile: string;
  color: string;
  skills: string[];
  default_model?: string;
  tasks: TaskOption[];
}

interface Props {
  character: CharacterData;
  userId: string;
  isGuest: boolean;
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPanel({
  character,
  userId,
  isGuest,
  onClose,
}: Props) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || !selectedTask || isGuest) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setLastResponse(null);

    // Tell Phaser scene: character is working
    window.dispatchEvent(
      new CustomEvent("character-status", {
        detail: { id: character.id, status: "working" },
      })
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          taskId: selectedTask,
          message: userMsg,
          userId,
        }),
      });
      const data = await res.json();
      const content = data.error ? `Error: ${data.error}` : data.response;
      setMessages((prev) => [...prev, { role: "assistant", content }]);
      if (!data.error) setLastResponse(content);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error" },
      ]);
    }
    setLoading(false);

    // Tell Phaser scene: character is done
    window.dispatchEvent(
      new CustomEvent("character-status", {
        detail: { id: character.id, status: "done" },
      })
    );
  }

  async function handleWebhook() {
    if (!lastResponse || !selectedTask) return;
    await fetch("/api/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: character.id,
        taskId: selectedTask,
        result: lastResponse,
        userId,
      }),
    });
  }

  const canSend = !isGuest && !!selectedTask;

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 380,
        maxWidth: "100%",
        backgroundColor: "#1a1a2e",
        borderLeft: "2px solid #c8a84e",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid #2a2a4e" }}
      >
        <CharacterAvatar characterId={character.id} size={40} />
        <div className="flex-1 min-w-0">
          <h2 className="font-pixel text-rpg-gold truncate" style={{ fontSize: 14 }}>
            {character.name_ru}
          </h2>
          <p className="font-body text-rpg-text truncate" style={{ fontSize: 12 }}>
            {character.role}
          </p>
        </div>
        <button
          onClick={onClose}
          className="font-pixel text-rpg-text hover:text-rpg-gold transition-colors"
          style={{ fontSize: 14, padding: "4px 8px" }}
        >
          X
        </button>
      </div>

      {/* Quest selector — compact tag buttons */}
      <div
        className="px-4 py-2"
        style={{ borderBottom: "1px solid #2a2a4e" }}
      >
        <div className="font-pixel text-rpg-gold mb-2" style={{ fontSize: 10 }}>
          SELECT QUEST:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {character.tasks.map((t) => {
            const isActive = t.id === selectedTask;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTask(t.id)}
                className="font-body transition-colors"
                style={{
                  fontSize: 12,
                  padding: "3px 8px",
                  backgroundColor: isActive ? "#c8a84e" : "#2a2a4e",
                  color: isActive ? "#1a1a2e" : "#e0d5c1",
                  border: `1px solid ${isActive ? "#c8a84e" : "#3a3a5a"}`,
                  cursor: "pointer",
                }}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Greeting */}
        <div
          className="flex gap-2"
          style={{
            padding: "8px 10px",
            backgroundColor: "#2a2a4e",
            borderLeft: "3px solid #c8a84e",
          }}
        >
          <div className="flex-shrink-0">
            <CharacterAvatar characterId={character.id} size={32} />
          </div>
          <p className="font-body text-rpg-text whitespace-pre-wrap" style={{ fontSize: 14, lineHeight: 1.5 }}>
            {character.greeting}
          </p>
        </div>

        {isGuest && (
          <div
            className="font-pixel text-rpg-gold text-center"
            style={{ fontSize: 10, padding: 8, backgroundColor: "rgba(200,168,78,0.1)" }}
          >
            Sign in to use AI features
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className="flex gap-2"
            style={{
              padding: "8px 10px",
              backgroundColor: msg.role === "assistant" ? "#2a2a4e" : "#1e3a1e",
              borderLeft: `3px solid ${msg.role === "assistant" ? "#c8a84e" : "#4a8a4a"}`,
            }}
          >
            {msg.role === "assistant" && (
              <div className="flex-shrink-0">
                <CharacterAvatar characterId={character.id} size={32} />
              </div>
            )}
            <p
              className="font-body text-rpg-text whitespace-pre-wrap flex-1"
              style={{ fontSize: 14, lineHeight: 1.5 }}
            >
              {msg.content}
            </p>
          </div>
        ))}

        {loading && (
          <div
            className="font-pixel text-rpg-gold animate-pulse"
            style={{ fontSize: 11, padding: "8px 10px" }}
          >
            Working...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 flex gap-2"
        style={{ borderTop: "1px solid #2a2a4e" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={
            isGuest
              ? "Sign in to chat"
              : selectedTask
                ? "Your request..."
                : "Select quest first"
          }
          disabled={!canSend || loading}
          className="flex-1 font-body text-rpg-text placeholder-gray-600 outline-none disabled:opacity-50"
          style={{
            fontSize: 14,
            padding: "8px 10px",
            backgroundColor: "#0f0f23",
            border: "1px solid #2a2a4e",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend || !input.trim() || loading}
          className="font-pixel text-rpg-gold disabled:opacity-30 hover:bg-rpg-gold/10 transition-colors"
          style={{
            fontSize: 14,
            padding: "8px 12px",
            backgroundColor: "#2a2a4e",
            border: "1px solid #3a3a5a",
            cursor: canSend ? "pointer" : "default",
          }}
        >
          →
        </button>
      </div>

      {/* Webhook button */}
      {lastResponse && (
        <div
          className="px-4 py-2"
          style={{ borderTop: "1px solid #2a2a4e" }}
        >
          <button
            onClick={handleWebhook}
            className="w-full font-pixel text-rpg-text hover:text-rpg-gold transition-colors"
            style={{
              fontSize: 11,
              padding: "6px",
              backgroundColor: "#2a2a4e",
              border: "1px solid #3a3a5a",
              cursor: "pointer",
            }}
          >
            📤 Send to Make.com
          </button>
        </div>
      )}
    </div>
  );
}
