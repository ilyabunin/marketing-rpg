"use client";

import { useState } from "react";
import RPGPanel from "./ui/RPGPanel";
import RPGButton from "./ui/RPGButton";
import RPGInput from "./ui/RPGInput";
import TaskSelector from "./TaskSelector";
import ChatMessage from "./ChatMessage";
import CharacterAvatar from "./CharacterAvatar";

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

  async function handleSend() {
    if (!input.trim() || !selectedTask || isGuest) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setLastResponse(null);

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
      const content = data.error
        ? `Error: ${data.error}`
        : data.response;
      setMessages((prev) => [...prev, { role: "assistant", content }]);
      if (!data.error) setLastResponse(content);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error" },
      ]);
    }
    setLoading(false);
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
    <RPGPanel className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b-2 border-rpg-border-inner flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <CharacterAvatar characterId={character.id} size={64} />
          <div>
            <h2 className="font-pixel text-sm text-rpg-gold">
              {character.name_ru}
            </h2>
            <p className="font-body text-base text-rpg-text mt-1">
              {character.role}
            </p>
          </div>
        </div>
        <RPGButton onClick={onClose} variant="secondary" className="text-xs">
          ✕
        </RPGButton>
      </div>

      {/* Task selector */}
      <div className="p-3 border-b-2 border-rpg-border-inner">
        <TaskSelector
          tasks={character.tasks}
          selectedTaskId={selectedTask}
          onSelect={setSelectedTask}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <ChatMessage
          role="assistant"
          content={character.greeting}
          isLatest={messages.length === 0}
          characterId={character.id}
        />
        {isGuest && (
          <div className="font-pixel text-[10px] text-rpg-gold bg-rpg-gold/10 p-3">
            Sign in to use AI features
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            isLatest={
              msg.role === "assistant" && i === messages.length - 1
            }
            characterId={character.id}
          />
        ))}
        {loading && (
          <div className="font-pixel text-[10px] text-rpg-border-inner animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t-2 border-rpg-border-inner flex gap-2">
        <RPGInput
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
        />
        <RPGButton
          onClick={handleSend}
          disabled={!canSend || !input.trim() || loading}
        >
          →
        </RPGButton>
      </div>

      {/* Webhook button */}
      {lastResponse && (
        <div className="p-3 border-t-2 border-rpg-border-inner">
          <RPGButton
            onClick={handleWebhook}
            variant="secondary"
            className="w-full"
          >
            📤 Send to Make.com
          </RPGButton>
        </div>
      )}
    </RPGPanel>
  );
}
