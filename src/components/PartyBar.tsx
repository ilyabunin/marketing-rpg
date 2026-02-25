"use client";

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

interface Props {
  characters: CharacterData[];
  selectedId: string | null;
  onSelect: (c: CharacterData) => void;
}

export default function PartyBar({ characters, selectedId, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t-2 border-rpg-border bg-rpg-panel/80">
      <span className="font-pixel text-[10px] text-rpg-border-inner mr-2">
        PARTY:
      </span>
      {characters.map((c) => {
        const isActive = c.id === selectedId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={`relative p-1 border-2 transition-all ${
              isActive
                ? "border-rpg-gold bg-rpg-gold/20"
                : "border-rpg-border-inner hover:border-rpg-gold/50"
            }`}
            style={{ borderRadius: 0 }}
            title={c.name_ru}
          >
            <CharacterAvatar characterId={c.id} size={32} />
            {isActive && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-rpg-gold" />
            )}
          </button>
        );
      })}
    </div>
  );
}
