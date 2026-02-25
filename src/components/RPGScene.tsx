"use client";

import { useEffect, useRef } from "react";

interface CharacterData {
  id: string;
  name_ru: string;
  role: string;
  greeting: string;
  position: { x: number; y: number };
  tasks: { id: string; name: string; description: string }[];
}

interface Props {
  characters: CharacterData[];
  onSelectCharacter: (character: CharacterData) => void;
}

const CANVAS_W = 960;
const CANVAS_H = 640;

export default function RPGScene({ characters, onSelectCharacter }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    let destroyed = false;

    import("phaser").then(async (Phaser) => {
      if (destroyed) return;

      const { drawFloor, drawWalls } = await import("./game/RoomBuilder");
      const { drawFurniture } = await import("./game/FurnitureBuilder");
      const {
        preloadCharacters,
        createCharacterAnimations,
        placeCharacters,
      } = await import("./game/CharacterSprites");

      if (destroyed || !container) return;

      class OfficeScene extends Phaser.Scene {
        constructor() {
          super("office");
        }
        preload() {
          preloadCharacters(this);
        }
        create() {
          this.cameras.main.setBackgroundColor("#0f0f23");
          drawFloor(this);
          drawWalls(this);
          drawFurniture(this);
          createCharacterAnimations(this);
          placeCharacters(this, characters, onSelectCharacter);
        }
      }

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: container,
        width: CANVAS_W,
        height: CANVAS_H,
        backgroundColor: "#0f0f23",
        scene: OfficeScene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        pixelArt: true,
      });
      gameRef.current = game;
    });

    return () => {
      destroyed = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [characters, onSelectCharacter]);

  return <div ref={containerRef} className="w-full h-full" />;
}
