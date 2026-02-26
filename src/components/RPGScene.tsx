"use client";

import { useEffect, useRef } from "react";

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
  onSelectCharacter: (character: CharacterData) => void;
  onBioCharacter?: (character: CharacterData) => void;
}

// Map-defined canvas: 30 × 20 tiles × 32px
const CANVAS_W = 960;
const CANVAS_H = 640;

export default function RPGScene({ characters, onSelectCharacter, onBioCharacter }: Props) {
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

      const {
        preloadCharacters,
        createCharacterAnimations,
        placeCharacters,
        WP_MAP,
      } = await import("./game/CharacterSprites");
      const {
        initPathfinding,
        getDeskPosition,
      } = await import("./game/Pathfinding");
      const {
        preloadSpeechBubbles,
        initSocialSystem,
      } = await import("./game/SocialSystem");

      if (destroyed || !container) return;

      // Store pathfinding ref for update()
      let pfAPI: ReturnType<typeof initPathfinding> | null = null;

      class OfficeScene extends Phaser.Scene {
        constructor() {
          super("office");
        }

        preload() {
          // Tiled map + compact tileset (512×512, 254 tiles)
          this.load.tilemapTiledJSON("office-map", "/maps/marketing_office.tmj");
          this.load.image("tileset_compact", "/maps/tileset_compact.png");

          // Character sprites
          preloadCharacters(this);

          // Speech bubbles
          preloadSpeechBubbles(this);
        }

        create() {
          this.cameras.main.setBackgroundColor("#0f0f23");

          // ── Tiled map ──
          const map = this.make.tilemap({ key: "office-map" });
          const tileset = map.addTilesetImage("tileset_compact", "tileset_compact");

          if (!tileset) {
            console.error("Failed to load tileset");
            return;
          }

          // Render visual layers (bottom to top)
          const visualLayers = [
            "Floor", "Floor decor", "Objects", "Objects2",
            "Wall", "wall2", "Main office",
          ];
          visualLayers.forEach((name, i) => {
            const layer = map.createLayer(name, tileset, 0, 0);
            if (layer) {
              // Floor/decor: 0-1, Objects: 2-3, Wall+: 6-8
              const depths = [0, 1, 2, 3, 6, 7, 8];
              layer.setDepth(depths[i] ?? i);
            }
          });

          // wp layers: create but hide (data only)
          for (let i = 1; i <= 5; i++) {
            const layer = map.createLayer(`wp${i}`, tileset, 0, 0);
            if (layer) layer.setVisible(false);
          }

          // ── Pathfinding ──
          pfAPI = initPathfinding(map);

          // ── Desk positions from wp layers ──
          const deskPositions: Record<string, { x: number; y: number }> = {};
          Object.entries(WP_MAP).forEach(([wpName, charId]) => {
            deskPositions[charId] = getDeskPosition(map, wpName);
          });

          // ── Characters ──
          createCharacterAnimations(this);
          const charSystem = placeCharacters(
            this, characters, onSelectCharacter, onBioCharacter,
            pfAPI, deskPositions
          );

          // ── Social system ──
          initSocialSystem(this, charSystem);
        }

        update() {
          // EasyStar needs calculate() called every frame
          if (pfAPI) pfAPI.calculate();
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
  }, [characters, onSelectCharacter, onBioCharacter]);

  return <div ref={containerRef} className="w-full h-full" />;
}
