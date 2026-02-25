"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selected, setSelected] = useState<CharacterData | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [isGuest, setIsGuest] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setIsGuest(false);
        setReady(true);
      } else if (localStorage.getItem("guest_mode")) {
        setIsGuest(true);
        setReady(true);
      } else {
        router.replace("/login");
      }
    });
    fetch("/api/characters")
      .then((r) => r.json())
      .then(setCharacters)
      .catch(() => {});
  }, [router]);

  const handleSelect = useCallback((c: CharacterData) => setSelected(c), []);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1a1025] text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* RPG Scene — left */}
      <div className="flex-1 relative">
        <div className="absolute top-3 left-4 text-amber-400 font-bold text-lg z-10">
          Profee Marketing Playground
        </div>
        {isGuest && (
          <div className="absolute top-3 right-4 text-gray-500 text-xs z-10">
            Guest mode — AI disabled
          </div>
        )}
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
            isGuest={isGuest}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  );
}
