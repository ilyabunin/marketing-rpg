/**
 * CharacterSprites.ts — Character placement, walking AI, status system
 *
 * Characters use EasyStar pathfinding to navigate the Tiled map,
 * walking tile-by-tile along computed paths.
 */

import type { PathfindingAPI, PathPoint } from "./Pathfinding";

const SPRITE_SCALE = 1.2;
const TILE = 32;

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

type CharStatus = "idle" | "working" | "done";

export interface CharRef {
  sprite: Phaser.GameObjects.Sprite;
  labelContainer: Phaser.GameObjects.Container;
  roleText: Phaser.GameObjects.Text;
  nameTextObj: Phaser.GameObjects.Text;
  statusText: Phaser.GameObjects.Text;
  data: CharacterData;
  spriteName: string;
  walkSpeed: number;
  currentTween: Phaser.Tweens.Tween | null;
  walkTimer: Phaser.Time.TimerEvent | null;
  status: CharStatus;
  isTalking: boolean;
  interrupted: boolean;
  deskPos: PathPoint;
}

export interface CharacterSystemAPI {
  charRefs: Map<string, CharRef>;
  stopWalking: (ref: CharRef) => void;
  startWalking: (ref: CharRef) => void;
  updateLabelPos: (ref: CharRef) => void;
  pathfinding: PathfindingAPI;
  walkToPoint: (ref: CharRef, target: PathPoint, speed?: number, run?: boolean) => Promise<void>;
}

const SPRITE_MAP: Record<string, string> = {
  "seo-analyst": "Adam",
  "creative-director": "Alex",
  "senior-copywriter": "Jenny",
  "ua-strategist": "Bob",
  "project-manager": "Molly",
};

const DISPLAY_INFO: Record<string, { name: string; role: string }> = {
  "seo-analyst": { name: "Adam", role: "SEO Analyst" },
  "creative-director": { name: "Alex", role: "Creative Director" },
  "senior-copywriter": { name: "Jenny", role: "Senior Copywriter" },
  "ua-strategist": { name: "Bob", role: "UA Strategist" },
  "project-manager": { name: "Molly", role: "Project Manager" },
};

// wp layer → character id
const WP_MAP: Record<string, string> = {
  wp1: "seo-analyst",
  wp2: "senior-copywriter",
  wp3: "ua-strategist",
  wp4: "creative-director",
  wp5: "project-manager",
};

const DIR_FRAMES: Record<string, { start: number; end: number }> = {
  down: { start: 0, end: 3 },
  left: { start: 4, end: 7 },
  right: { start: 8, end: 11 },
  up: { start: 12, end: 15 },
};

type Direction = "down" | "left" | "right" | "up";

function getDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export function preloadCharacters(scene: Phaser.Scene) {
  Object.values(SPRITE_MAP).forEach((name) => {
    scene.load.spritesheet(name, `/sprites/${name}.png`, {
      frameWidth: 32,
      frameHeight: 48,
    });
  });
}

export function createCharacterAnimations(scene: Phaser.Scene) {
  Object.values(SPRITE_MAP).forEach((name) => {
    for (const [dir, frames] of Object.entries(DIR_FRAMES)) {
      scene.anims.create({
        key: `${name}-walk-${dir}`,
        frames: scene.anims.generateFrameNumbers(name, frames),
        frameRate: 6,
        repeat: -1,
      });
      scene.anims.create({
        key: `${name}-run-${dir}`,
        frames: scene.anims.generateFrameNumbers(name, frames),
        frameRate: 12,
        repeat: -1,
      });
    }
  });
}

export function placeCharacters(
  scene: Phaser.Scene,
  characters: CharacterData[],
  onClick: (c: CharacterData) => void,
  onBio: ((c: CharacterData) => void) | undefined,
  pathfinding: PathfindingAPI,
  deskPositions: Record<string, PathPoint>
): CharacterSystemAPI {
  const charRefs = new Map<string, CharRef>();
  let selectedId: string | null = null;
  let menuContainer: Phaser.GameObjects.Container | null = null;
  let glowGfx: Phaser.GameObjects.Graphics | null = null;
  let justClickedUI = false;

  function clearMenu() {
    menuContainer?.destroy();
    menuContainer = null;
    glowGfx?.destroy();
    glowGfx = null;
  }

  function deselectAll() {
    if (selectedId) {
      const ref = charRefs.get(selectedId);
      if (ref && ref.status === "idle" && !ref.isTalking) startWalking(ref);
      selectedId = null;
    }
    clearMenu();
  }

  function showMenu(ref: CharRef) {
    clearMenu();
    const sx = ref.sprite.x;
    const sy = ref.sprite.y;

    glowGfx = scene.add.graphics();
    glowGfx.lineStyle(2, 0xf0c040, 0.8);
    const hw = 16 * SPRITE_SCALE;
    const hh = 24 * SPRITE_SCALE;
    glowGfx.strokeRect(sx - hw, sy - hh, hw * 2, hh * 2);
    glowGfx.setDepth(15);

    menuContainer = scene.add.container(sx, sy - 60);
    menuContainer.setDepth(15);

    const bg = scene.add.rectangle(0, 0, 130, 36, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(2, 0xc8a84e);
    bg.setInteractive();
    bg.on("pointerdown", () => { justClickedUI = true; });

    const bioBtn = scene.add
      .text(-32, 0, "Bio", {
        fontSize: "15px", color: "#e0d5c1",
        fontFamily: '"Pixelify Sans", sans-serif',
      })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    const chatBtn = scene.add
      .text(32, 0, "Chat", {
        fontSize: "15px", color: "#e0d5c1",
        fontFamily: '"Pixelify Sans", sans-serif',
      })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    bioBtn.on("pointerover", () => bioBtn.setColor("#f0c040"));
    bioBtn.on("pointerout", () => bioBtn.setColor("#e0d5c1"));
    chatBtn.on("pointerover", () => chatBtn.setColor("#f0c040"));
    chatBtn.on("pointerout", () => chatBtn.setColor("#e0d5c1"));

    bioBtn.on("pointerdown", () => {
      justClickedUI = true; clearMenu(); selectedId = null;
      if (onBio) onBio(ref.data);
    });
    chatBtn.on("pointerdown", () => {
      justClickedUI = true; clearMenu(); selectedId = null;
      onClick(ref.data);
    });
    menuContainer.add([bg, bioBtn, chatBtn]);
  }

  // ─── Core movement ───────────────────────────────────────────

  function fullStop(ref: CharRef) {
    ref.interrupted = true;
    ref.currentTween?.stop();
    ref.currentTween = null;
    ref.walkTimer?.remove();
    ref.walkTimer = null;
    ref.sprite.stop();
  }

  function stopWalking(ref: CharRef) {
    fullStop(ref);
    ref.sprite.setFrame(0);
    updateLabelPos(ref);
  }

  function updateLabelPos(ref: CharRef) {
    ref.labelContainer.setPosition(ref.sprite.x, ref.sprite.y - 52);
  }

  /**
   * Walk along a pathfinding route tile-by-tile.
   * Resolves when arrived or interrupted.
   */
  async function walkToPoint(
    ref: CharRef,
    target: PathPoint,
    speed = 60,
    run = false
  ): Promise<void> {
    ref.interrupted = false;

    const path = await pathfinding.findPath(
      ref.sprite.x, ref.sprite.y, target.x, target.y
    );

    if (!path || path.length === 0) return;

    for (let i = 0; i < path.length; i++) {
      if (ref.interrupted) break;

      const pt = path[i];
      const dx = pt.x - ref.sprite.x;
      const dy = pt.y - ref.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2) continue;

      const dir = getDirection(dx, dy);
      const animKey = run
        ? `${ref.spriteName}-run-${dir}`
        : `${ref.spriteName}-walk-${dir}`;
      ref.sprite.play(animKey, true);

      const duration = (dist / speed) * 1000;

      await new Promise<void>((resolve) => {
        ref.currentTween = scene.tweens.add({
          targets: ref.sprite,
          x: pt.x,
          y: pt.y,
          duration,
          ease: "Linear",
          onUpdate: () => updateLabelPos(ref),
          onComplete: () => {
            ref.currentTween = null;
            resolve();
          },
        });
      });
    }

    ref.sprite.stop();
    ref.sprite.setFrame(0);
    updateLabelPos(ref);
  }

  // ─── Idle walking AI ─────────────────────────────────────────

  function startWalking(ref: CharRef) {
    if (ref.status !== "idle" || ref.isTalking) return;

    async function walk() {
      if (selectedId === ref.data.id || ref.status !== "idle" || ref.isTalking) return;

      const deskTX = Math.floor(ref.deskPos.x / TILE);
      const deskTY = Math.floor(ref.deskPos.y / TILE);
      const target = pathfinding.getRandomWalkable(deskTX, deskTY);

      await walkToPoint(ref, target, ref.walkSpeed);

      // Schedule next walk if still idle
      if (ref.status === "idle" && !ref.isTalking && selectedId !== ref.data.id) {
        ref.walkTimer = scene.time.delayedCall(2000 + Math.random() * 3000, walk);
      }
    }

    ref.interrupted = false;
    ref.walkTimer = scene.time.delayedCall(1000 + Math.random() * 3000, walk);
  }

  // ─── Run to desk ─────────────────────────────────────────────

  function seatAtDesk(ref: CharRef) {
    ref.sprite.setPosition(ref.deskPos.x, ref.deskPos.y);
    ref.sprite.stop();
    ref.sprite.setFrame(DIR_FRAMES["up"].start);
    updateLabelPos(ref);
  }

  async function runToDesk(ref: CharRef) {
    fullStop(ref);
    ref.isTalking = false;
    ref.interrupted = false;

    ref.statusText.setText("Working...");
    ref.statusText.setColor("#f0c040");

    const dx = ref.deskPos.x - ref.sprite.x;
    const dy = ref.deskPos.y - ref.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 16) {
      seatAtDesk(ref);
      return;
    }

    await walkToPoint(ref, ref.deskPos, 180, true);

    if (ref.status === "working") {
      seatAtDesk(ref);
    }
  }

  // ─── Background click ────────────────────────────────────────

  scene.input.on("pointerdown", () => {
    if (!justClickedUI && selectedId) deselectAll();
    justClickedUI = false;
  });

  // ─── Place characters ────────────────────────────────────────

  characters.forEach((c) => {
    const spriteName = SPRITE_MAP[c.id];
    if (!spriteName) return;
    const deskPos = deskPositions[c.id] || { x: 480, y: 320 };

    const startX = deskPos.x;
    const startY = deskPos.y;

    const sprite = scene.add.sprite(startX, startY, spriteName);
    sprite.setScale(SPRITE_SCALE);
    sprite.setFrame(0);
    sprite.setInteractive({ useHandCursor: true });
    sprite.setDepth(5); // above furniture, below walls

    const info = DISPLAY_INFO[c.id] || { name: c.name, role: c.role };

    const roleText = scene.add.text(0, -8, info.role, {
      fontSize: "18px", fontStyle: "bold", color: "#ffffff",
      fontFamily: '"Pixelify Sans", sans-serif',
      stroke: "#000000", strokeThickness: 3,
    }).setOrigin(0.5);

    const nameTextObj = scene.add.text(0, 10, info.name, {
      fontSize: "15px", color: "#aaaaaa",
      fontFamily: '"Pixelify Sans", sans-serif',
      stroke: "#000000", strokeThickness: 3,
    }).setOrigin(0.5);

    const statusText = scene.add.text(0, 26, "", {
      fontSize: "14px", fontStyle: "bold", color: "#f0c040",
      fontFamily: '"Pixelify Sans", sans-serif',
      stroke: "#000000", strokeThickness: 2,
    }).setOrigin(0.5);

    const plateW = Math.max(roleText.width, nameTextObj.width) + 20;
    const plateBg = scene.add.rectangle(0, 2, plateW, 48, 0x000000, 0.6);

    const labelContainer = scene.add.container(startX, startY - 52, [
      plateBg, roleText, nameTextObj, statusText,
    ]).setDepth(11);

    const ref: CharRef = {
      sprite, labelContainer, roleText, nameTextObj, statusText,
      data: c, spriteName,
      walkSpeed: 40 + Math.random() * 30,
      currentTween: null, walkTimer: null,
      status: "idle", isTalking: false, interrupted: false,
      deskPos,
    };
    charRefs.set(c.id, ref);

    sprite.on("pointerdown", () => {
      justClickedUI = true;
      if (selectedId === c.id) return;
      deselectAll();
      selectedId = c.id;
      stopWalking(ref);
      showMenu(ref);
    });

    startWalking(ref);
  });

  // ─── Status system ───────────────────────────────────────────

  function setCharStatus(charId: string, status: CharStatus) {
    const ref = charRefs.get(charId);
    if (!ref) return;
    ref.status = status;

    if (status === "working") {
      runToDesk(ref);
    } else if (status === "done") {
      fullStop(ref);
      ref.interrupted = false;
      seatAtDesk(ref);
      ref.statusText.setText("Done \u2713");
      ref.statusText.setColor("#4ecb4e");
      scene.time.delayedCall(3000, () => {
        if (ref.status === "done") setCharStatus(charId, "idle");
      });
    } else {
      ref.statusText.setText("");
      if (selectedId !== charId && !ref.isTalking) startWalking(ref);
    }

    window.dispatchEvent(
      new CustomEvent("character-status-update", {
        detail: { id: charId, status },
      })
    );
  }

  function handleStatusEvent(e: Event) {
    const { id, status } = (e as CustomEvent).detail;
    setCharStatus(id, status);
  }

  window.addEventListener("character-status", handleStatusEvent);
  scene.events.on("shutdown", () => window.removeEventListener("character-status", handleStatusEvent));
  scene.events.on("destroy", () => window.removeEventListener("character-status", handleStatusEvent));

  return { charRefs, stopWalking, startWalking, updateLabelPos, pathfinding, walkToPoint };
}

export { WP_MAP };
