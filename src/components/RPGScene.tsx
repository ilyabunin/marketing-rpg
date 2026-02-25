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

      class OfficeScene extends Phaser.Scene {
        constructor() {
          super("office");
        }

        create() {
          this.cameras.main.setBackgroundColor("#0f0f23");
          this.cameras.main.setZoom(SCALE);
          drawFloor(this);
          drawWalls(this);
          drawFurniture(this);
          drawCharacterPlaceholders(this, characters, onSelectCharacter);
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

/** Placeholder characters — replaced with sprites in Step 4 */
function drawCharacterPlaceholders(
  scene: Phaser.Scene,
  characters: CharacterData[],
  onClick: (c: CharacterData) => void
) {
  const POS: Record<string, { x: number; y: number }> = {
    "seo-analyst": { x: 4, y: 5 },
    "creative-director": { x: 15, y: 5 },
    "senior-copywriter": { x: 15, y: 9 },
    "ua-strategist": { x: 4, y: 9 },
  };

  const CLR: Record<string, number> = {
    "seo-analyst": 0x4fc3f7,
    "creative-director": 0xffb74d,
    "senior-copywriter": 0x81c784,
    "ua-strategist": 0xce93d8,
  };

  characters.forEach((c) => {
    const pos = POS[c.id] || c.position;
    const color = CLR[c.id] || 0xffffff;
    const cx = pos.x * TILE + TILE / 2;
    const cy = pos.y * TILE + TILE / 2;

    const body = scene.add.rectangle(cx, cy, 12, 14, color);
    body.setInteractive({ useHandCursor: true });
    body.on("pointerdown", () => onClick(c));

    const nameText = scene.add
      .text(cx, cy - 12, c.name_ru, {
        fontSize: "5px",
        color: "#f0c040",
        fontFamily: '"Press Start 2P"',
      })
      .setOrigin(0.5)
      .setVisible(false);

    body.on("pointerover", () => {
      body.setScale(1.2);
      nameText.setVisible(true);
    });
    body.on("pointerout", () => {
      body.setScale(1);
      nameText.setVisible(false);
    });
  });
}
