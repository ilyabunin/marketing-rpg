"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ChatPanel from "@/components/ChatPanel";
import BioCard from "@/components/BioCard";
import Header from "@/components/Header";
import PartyBar from "@/components/PartyBar";
import { supabase } from "@/lib/supabase-browser";

const RPGScene = dynamic(() => import("@/components/RPGScene"), { ssr: false });

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

export default function Home() {
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selected, setSelected] = useState<CharacterData | null>(null);
  const [bioCharacter, setBioCharacter] = useState<CharacterData | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [isGuest, setIsGuest] = useState(false);
  const [ready, setReady] = useState(false);
  const [chatWidth, setChatWidth] = useState(420);
  const isDragging = useRef(false);

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

  // Drag handle for resizable chat
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      e.preventDefault();
      const newWidth = window.innerWidth - e.clientX;
      setChatWidth(Math.max(380, Math.min(newWidth, window.innerWidth * 0.8)));
    }
    function handleMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    function handleTouchMove(e: TouchEvent) {
      if (!isDragging.current) return;
      const touch = e.touches[0];
      const newWidth = window.innerWidth - touch.clientX;
      setChatWidth(Math.max(380, Math.min(newWidth, window.innerWidth * 0.8)));
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleChat = useCallback((c: CharacterData) => {
    setBioCharacter(null);
    setSelected(c);
  }, []);

  const handleBio = useCallback((c: CharacterData) => {
    setBioCharacter(c);
  }, []);

  const handleBioStartChat = useCallback(() => {
    if (bioCharacter) {
      setBioCharacter(null);
      setSelected(bioCharacter);
    }
  }, [bioCharacter]);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-rpg-bg">
        <div className="font-pixel text-sm text-rpg-gold animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-rpg-bg">
      <Header isGuest={isGuest} />

      {/* Main area — relative so chat can overlay */}
      <div className="flex-1 relative min-h-0">
        {/* RPG Scene — always full width */}
        <div className="w-full h-full">
          {characters.length > 0 && (
            <RPGScene
              characters={characters}
              onSelectCharacter={handleChat}
              onBioCharacter={handleBio}
            />
          )}
        </div>

        {/* Chat overlay — positioned absolute, covers right side over canvas */}
        {selected && (
          <div
            className="absolute top-0 right-0 bottom-0 hidden md:flex"
            style={{ width: chatWidth, zIndex: 20 }}
          >
            {/* Drag handle */}
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 6,
                cursor: "col-resize",
                backgroundColor: "#444",
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = "#c8a84e"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = "#444"; }}
            >
              <div style={{ width: 2, height: 40, backgroundColor: "#888", borderRadius: 1 }} />
            </div>

            {/* Chat panel */}
            <div className="flex-1 h-full">
              <ChatPanel
                character={selected}
                userId={userId}
                isGuest={isGuest}
                onClose={() => setSelected(null)}
              />
            </div>
          </div>
        )}

        {/* Mobile: full-screen chat */}
        {selected && (
          <div className="absolute inset-0 md:hidden" style={{ zIndex: 20 }}>
            <ChatPanel
              character={selected}
              userId={userId}
              isGuest={isGuest}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      {/* Party bar — always visible below */}
      {characters.length > 0 && (
        <PartyBar
          characters={characters}
          selectedId={selected?.id ?? null}
          onSelect={handleChat}
        />
      )}

      {/* Bio Card modal */}
      {bioCharacter && (
        <BioCard
          character={bioCharacter}
          onClose={() => setBioCharacter(null)}
          onStartChat={handleBioStartChat}
        />
      )}
    </div>
  );
}
