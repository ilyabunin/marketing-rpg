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
      const newWidth = window.innerWidth - e.clientX;
      setChatWidth(Math.max(380, Math.min(newWidth, window.innerWidth * 0.8)));
    }
    function handleMouseUp() {
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

  const handleDragStart = useCallback(() => {
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

      <div className="flex-1 flex min-h-0">
        {/* RPG Scene */}
        <div
          className={`relative ${
            selected ? "hidden md:block md:flex-1" : "w-full"
          }`}
        >
          {characters.length > 0 && (
            <RPGScene
              characters={characters}
              onSelectCharacter={handleChat}
              onBioCharacter={handleBio}
            />
          )}
        </div>

        {/* Drag handle + Chat Panel */}
        {selected && (
          <>
            {/* Drag handle */}
            <div
              className="hidden md:flex items-center justify-center flex-shrink-0"
              style={{
                width: 6,
                cursor: "col-resize",
                backgroundColor: "#333",
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <div
                style={{
                  width: 2,
                  height: 32,
                  backgroundColor: "#666",
                  borderRadius: 1,
                }}
              />
            </div>

            {/* Chat Panel */}
            <div
              className="w-full md:w-auto h-full flex-shrink-0"
              style={{ width: undefined }}
            >
              <div className="h-full hidden md:block" style={{ width: chatWidth }}>
                <ChatPanel
                  character={selected}
                  userId={userId}
                  isGuest={isGuest}
                  onClose={() => setSelected(null)}
                />
              </div>
              <div className="h-full md:hidden">
                <ChatPanel
                  character={selected}
                  userId={userId}
                  isGuest={isGuest}
                  onClose={() => setSelected(null)}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Party bar */}
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
