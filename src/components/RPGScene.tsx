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

const TILE = 64;
const COLORS: Record<string, number> = {
  "seo-analyst": 0x4fc3f7,
  "creative-director": 0xffb74d,
  "senior-copywriter": 0x81c784,
  "ua-strategist": 0xce93d8,
};

const FURNITURE_COLORS: Record<string, number> = {
  desk: 0x5d4e37,
  plant: 0x2e7d32,
  whiteboard: 0xcfd8dc,
  coffee_machine: 0x795548,
};

export default function RPGScene({ characters, onSelectCharacter }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    import("phaser").then((Phaser) => {
      const roomWidth = 10 * TILE;
      const roomHeight = 8 * TILE;

      class OfficeScene extends Phaser.Scene {
        constructor() {
          super("office");
        }

        create() {
          this.cameras.main.setBackgroundColor("#2a1f3d");
          drawGrid(this);
          drawFurniture(this);
          drawCharacters(this, characters, onSelectCharacter);
        }
      }

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current!,
        width: roomWidth,
        height: roomHeight,
        backgroundColor: "#2a1f3d",
        scene: OfficeScene,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      });
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [characters, onSelectCharacter]);

  return <div ref={containerRef} className="w-full h-full" />;
}

function drawGrid(scene: Phaser.Scene) {
  const gfx = scene.add.graphics();
  gfx.lineStyle(1, 0x3d2e5c, 0.3);
  for (let x = 0; x <= 10; x++) {
    gfx.moveTo(x * TILE, 0);
    gfx.lineTo(x * TILE, 8 * TILE);
  }
  for (let y = 0; y <= 8; y++) {
    gfx.moveTo(0, y * TILE);
    gfx.lineTo(10 * TILE, y * TILE);
  }
  gfx.strokePath();
}

function drawFurniture(scene: Phaser.Scene) {
  const furniture = [
    { type: "desk", x: 2, y: 2, label: "SEO" },
    { type: "desk", x: 5, y: 1, label: "CREO" },
    { type: "desk", x: 7, y: 3, label: "TEXT" },
    { type: "desk", x: 4, y: 4, label: "UA" },
    { type: "plant", x: 0, y: 0 },
    { type: "whiteboard", x: 9, y: 1 },
    { type: "coffee_machine", x: 0, y: 7 },
  ];

  furniture.forEach((f) => {
    const color = FURNITURE_COLORS[f.type] || 0x555555;
    const rect = scene.add.rectangle(
      f.x * TILE + TILE / 2,
      f.y * TILE + TILE / 2,
      TILE - 8,
      TILE - 8,
      color,
      0.5
    );
    rect.setStrokeStyle(1, color, 0.8);
    if (f.label) {
      scene.add.text(f.x * TILE + TILE / 2, f.y * TILE + TILE / 2, f.label, {
        fontSize: "9px",
        color: "#aaa",
      }).setOrigin(0.5);
    }
  });
}

function drawCharacters(
  scene: Phaser.Scene,
  characters: CharacterData[],
  onClick: (c: CharacterData) => void
) {
  characters.forEach((c) => {
    const color = COLORS[c.id] || 0xffffff;
    const cx = c.position.x * TILE + TILE / 2;
    const cy = c.position.y * TILE + TILE / 2;

    const body = scene.add.rectangle(cx, cy, 32, 40, color);
    body.setInteractive({ useHandCursor: true });
    body.on("pointerdown", () => onClick(c));
    body.on("pointerover", () => body.setScale(1.15));
    body.on("pointerout", () => body.setScale(1));

    scene.add
      .text(cx, cy - 30, c.name_ru, {
        fontSize: "10px",
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  });
}
