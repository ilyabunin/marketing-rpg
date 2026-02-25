"use client";

import { useState, useCallback } from "react";
import RPGPanel from "./ui/RPGPanel";
import TypewriterText from "./TypewriterText";

interface Props {
  role: "user" | "assistant";
  content: string;
  isLatest: boolean;
}

export default function ChatMessage({ role, content, isLatest }: Props) {
  const [typewriterDone, setTypewriterDone] = useState(false);
  const onComplete = useCallback(() => setTypewriterDone(true), []);

  if (role === "user") {
    return (
      <RPGPanel borderColor="#4080c0" className="ml-6">
        <div className="font-vt323 text-lg leading-relaxed text-rpg-text whitespace-pre-wrap">
          {content}
        </div>
      </RPGPanel>
    );
  }

  return (
    <RPGPanel className="mr-4">
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-rpg-border-inner flex-shrink-0 flex items-center justify-center">
          <span className="font-pixel text-[8px] text-rpg-gold">NPC</span>
        </div>
        <div className="font-vt323 text-lg leading-relaxed text-rpg-text whitespace-pre-wrap flex-1">
          {isLatest && !typewriterDone ? (
            <TypewriterText text={content} speed={15} onComplete={onComplete} />
          ) : (
            content
          )}
        </div>
      </div>
    </RPGPanel>
  );
}
