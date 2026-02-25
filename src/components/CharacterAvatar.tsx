"use client";

import { useEffect, useState } from "react";

const SPRITE_MAP: Record<string, string> = {
  "seo-analyst": "/sprites/Adam.png",
  "creative-director": "/sprites/Alex.png",
  "senior-copywriter": "/sprites/Jenny.png",
  "ua-strategist": "/sprites/Bob.png",
};

interface Props {
  characterId: string;
  size?: number;
  className?: string;
}

export default function CharacterAvatar({
  characterId,
  size = 64,
  className = "",
}: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const spritePath = SPRITE_MAP[characterId];
    if (!spritePath) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Frame 0: top-left, 32x48
      canvas.width = 32;
      canvas.height = 48;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 32, 48, 0, 0, 32, 48);
      setSrc(canvas.toDataURL());
    };
    img.src = spritePath;
  }, [characterId]);

  if (!src) {
    return (
      <div
        className={`bg-rpg-border-inner flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="font-pixel text-[8px] text-rpg-gold">?</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="avatar"
      className={`pixel-art ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        imageRendering: "pixelated",
      }}
    />
  );
}
