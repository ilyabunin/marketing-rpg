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

const TILE = 16;
const SCALE = 3;
const COLS = 20;
const ROWS = 15;

export default function RPGScene({ characters, onSelectCharacter }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    import("phaser").then(async (Phaser) => {
      const { drawFloor, drawWalls } = await import("./game/RoomBuilder");
      const { drawFurniture } = await import("./game/FurnitureBuilder");
      const {
        preloadCharacters,
        createCharacterAnimations,
        placeCharacters,
      } = await import("./game/CharacterSprites");

      class OfficeScene extends Phaser.Scene {
        constructor() {
          super("office");
        }

        preload() {
          preloadCharacters(this);
        }

        create() {
          this.cameras.main.setBackgroundColor("#0f0f23");
          this.cameras.main.setZoom(SCALE);
          drawFloor(this);
          drawWalls(this);
          drawFurniture(this);
          createCharacterAnimations(this);
          placeCharacters(this, characters, onSelectCharacter);
        }
      }

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current!,
        width: COLS * TILE * SCALE,
        height: ROWS * TILE * SCALE,
        backgroundColor: "#0f0f23",
        scene: OfficeScene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        pixelArt: true,
      });
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [characters, onSelectCharacter]);

  return <div ref={containerRef} className="w-full h-full" />;
}

