"use client";

import { useState } from "react";
import TaskSelector from "./TaskSelector";

interface TaskOption {
  id: string;
  name: string;
  description: string;
}

interface CharacterData {
  id: string;
  name_ru: string;
  role: string;
  greeting: string;
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

export default function ChatPanel({ character, userId, isGuest, onClose }: Props) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || !selectedTask || isGuest) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

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
      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error" },
      ]);
    }
    setLoading(false);
  }

  const canSend = !isGuest && !!selectedTask;

  return (
    <div className="flex flex-col h-full bg-[#2a1f3d] border-l border-[#4a3f5d]">
      {/* Header */}
      <div className="p-4 border-b border-[#4a3f5d] flex justify-between items-start">
        <div>
          <h2 className="text-amber-400 font-bold">{character.name_ru}</h2>
          <p className="text-gray-400 text-xs">{character.role}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          ✕
        </button>
      </div>

      {/* Task selector */}
      <div className="p-3 border-b border-[#4a3f5d]">
        <TaskSelector
          tasks={character.tasks}
          selectedTaskId={selectedTask}
          onSelect={setSelectedTask}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-gray-300 text-sm bg-[#1a1025] p-3 rounded">
          {character.greeting}
        </div>
        {isGuest && (
          <div className="text-amber-400/70 text-xs bg-amber-900/20 p-3 rounded">
            Sign in to use AI features
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm p-3 rounded whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-amber-900/30 text-amber-100 ml-8"
                : "bg-[#1a1025] text-gray-300 mr-4"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="text-gray-500 text-sm animate-pulse">Thinking...</div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#4a3f5d] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={
            isGuest
              ? "Sign in to send messages"
              : selectedTask
                ? "Enter your request..."
                : "Select a task first"
          }
          disabled={!canSend || loading}
          className="flex-1 p-2 bg-[#1a1025] border border-[#4a3f5d] rounded text-white text-sm outline-none focus:border-amber-400 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!canSend || !input.trim() || loading}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded text-sm disabled:opacity-50"
        >
          →
        </button>
      </div>
    </div>
  );
}
