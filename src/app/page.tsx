"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ChatPanel from "@/components/ChatPanel";
import { supabase } from "@/lib/supabase-browser";

const RPGScene = dynamic(() => import("@/components/RPGScene"), { ssr: false });

interface CharacterData {
  id: string;
  name_ru: string;
  role: string;
  greeting: string;
  position: { x: number; y: number };
  tasks: { id: string; name: string; description: string }[];
}

export default function Home() {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selected, setSelected] = useState<CharacterData | null>(null);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
    fetch("/api/characters")
      .then((r) => r.json())
      .then(setCharacters)
      .catch(() => {});
  }, []);

  const handleSelect = useCallback((c: CharacterData) => setSelected(c), []);

  return (
    <div className="h-screen flex">
      {/* RPG Scene — left */}
      <div className="flex-1 relative">
        <div className="absolute top-3 left-4 text-amber-400 font-bold text-lg z-10">
          Marketing RPG Team
        </div>
        {characters.length > 0 && (
          <RPGScene characters={characters} onSelectCharacter={handleSelect} />
        )}
      </div>

      {/* Chat Panel — right */}
      {selected && (
        <div className="w-[380px] h-screen">
          <ChatPanel
            character={selected}
            userId={userId}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  );
}
