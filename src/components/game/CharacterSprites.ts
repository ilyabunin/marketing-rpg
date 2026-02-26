import { WORK_ZONES } from "./FurnitureBuilder";

const SPRITE_SCALE = 1.2;
const ZONE_HALF = 125; // home zone ±125px from desk center
const MIN_CHAR_DISTANCE = 40;
const CANVAS_W = 1248;
const CANVAS_H = 832;
const WALL = 48; // wall thickness + margin

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
}

export interface CharacterSystemAPI {
  charRefs: Map<string, CharRef>;
  stopWalking: (ref: CharRef) => void;
  startWalking: (ref: CharRef) => void;
  updateLabelPos: (ref: CharRef) => void;
}

const SPRITE_MAP: Record<string, string> = {
  "seo-analyst": "Adam",
  "creative-director": "Alex",
  "senior-copywriter": "Jenny",
  "ua-strategist": "Bob",
  "project-manager": "Molly",
};

// English display names and roles
const DISPLAY_INFO: Record<string, { name: string; role: string }> = {
  "seo-analyst": { name: "Adam", role: "SEO Analyst" },
  "creative-director": { name: "Alex", role: "Creative Director" },
  "senior-copywriter": { name: "Jenny", role: "Senior Copywriter" },
  "ua-strategist": { name: "Bob", role: "UA Strategist" },
  "project-manager": { name: "Molly", role: "Project Manager" },
};

// Common areas characters can wander to (center room, coffee, whiteboard)
const COMMON_AREAS = [
  { x: 624, y: 420 },  // Room center
  { x: 624, y: 110 },  // Near whiteboard
  { x: 100, y: 776 },  // Coffee machine area
  { x: 400, y: 400 },  // Center-left open space
  { x: 850, y: 400 },  // Center-right open space
  { x: 624, y: 600 },  // Lower center
];

// Spritesheet: 4 cols × 4 rows (32×48 per frame)
const DIR_FRAMES: Record<string, { start: number; end: number }> = {
  down: { start: 0, end: 3 },
  left: { start: 4, end: 7 },
  right: { start: 8, end: 11 },
  up: { start: 12, end: 15 },
};

type Direction = "down" | "left" | "right" | "up";

function getDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}

function clampToRoom(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(WALL, Math.min(CANVAS_W - WALL, x)),
    y: Math.max(WALL, Math.min(CANVAS_H - 16, y)),
  };
}

// Check if a point is too close to any character (except excludeId)
function isTooClose(
  x: number,
  y: number,
  excludeId: string,
  charRefs: Map<string, CharRef>,
  minDist = MIN_CHAR_DISTANCE
): boolean {
  let tooClose = false;
  charRefs.forEach((ref, id) => {
    if (tooClose || id === excludeId) return;
    const dx = ref.sprite.x - x;
    const dy = ref.sprite.y - y;
    if (Math.sqrt(dx * dx + dy * dy) < minDist) tooClose = true;
  });
  return tooClose;
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
      // Normal walk (6 fps)
      scene.anims.create({
        key: `${name}-walk-${dir}`,
        frames: scene.anims.generateFrameNumbers(name, frames),
        frameRate: 6,
        repeat: -1,
      });
      // Fast run (12 fps)
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
  onBio?: (c: CharacterData) => void
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
      if (ref && ref.status !== "working" && !ref.isTalking) startWalking(ref);
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
    glowGfx.setDepth(5);

    menuContainer = scene.add.container(sx, sy - 60);
    menuContainer.setDepth(10);

    const bg = scene.add.rectangle(0, 0, 130, 36, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(2, 0xc8a84e);
    bg.setInteractive();
    bg.on("pointerdown", () => { justClickedUI = true; });

    const bioBtn = scene.add
      .text(-32, 0, "Bio", {
        fontSize: "15px",
        color: "#e0d5c1",
        fontFamily: '"Pixelify Sans", sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const chatBtn = scene.add
      .text(32, 0, "Chat", {
        fontSize: "15px",
        color: "#e0d5c1",
        fontFamily: '"Pixelify Sans", sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    bioBtn.on("pointerover", () => bioBtn.setColor("#f0c040"));
    bioBtn.on("pointerout", () => bioBtn.setColor("#e0d5c1"));
    chatBtn.on("pointerover", () => chatBtn.setColor("#f0c040"));
    chatBtn.on("pointerout", () => chatBtn.setColor("#e0d5c1"));

    bioBtn.on("pointerdown", () => {
      justClickedUI = true;
      clearMenu();
      selectedId = null;
      if (onBio) onBio(ref.data);
    });

    chatBtn.on("pointerdown", () => {
      justClickedUI = true;
      clearMenu();
      selectedId = null;
      onClick(ref.data);
    });

    menuContainer.add([bg, bioBtn, chatBtn]);
  }

  // ─── Walking AI ──────────────────────────────────────────────

  function stopWalking(ref: CharRef) {
    ref.currentTween?.stop();
    ref.currentTween = null;
    ref.walkTimer?.remove();
    ref.walkTimer = null;
    ref.sprite.stop();
    ref.sprite.setFrame(0);
    updateLabelPos(ref);
  }

  function updateLabelPos(ref: CharRef) {
    ref.labelContainer.setPosition(ref.sprite.x, ref.sprite.y - 52);
  }

  /**
   * Pick a walk target with zone-based probabilities:
   * 50% home zone, 30% common area, 20% near another character
   */
  function pickWalkTarget(ref: CharRef): { x: number; y: number } {
    const zone = WORK_ZONES[ref.data.id];
    if (!zone) return { x: ref.sprite.x, y: ref.sprite.y };

    const roll = Math.random();
    let tx: number, ty: number;

    if (roll < 0.5) {
      // 50% — home zone (~250×250 around desk)
      tx = zone.cx + (Math.random() - 0.5) * ZONE_HALF * 2;
      ty = zone.cy + 20 + (Math.random() - 0.5) * ZONE_HALF * 2;
    } else if (roll < 0.8) {
      // 30% — common area
      const area = COMMON_AREAS[Math.floor(Math.random() * COMMON_AREAS.length)];
      tx = area.x + (Math.random() - 0.5) * 80;
      ty = area.y + (Math.random() - 0.5) * 80;
    } else {
      // 20% — near another idle character
      const others = Array.from(charRefs.values()).filter(
        (r) => r.data.id !== ref.data.id && r.status === "idle" && !r.isTalking
      );
      if (others.length > 0) {
        const other = others[Math.floor(Math.random() * others.length)];
        tx = other.sprite.x + (Math.random() - 0.5) * 80;
        ty = other.sprite.y + (Math.random() - 0.5) * 80;
      } else {
        tx = zone.cx + (Math.random() - 0.5) * ZONE_HALF * 2;
        ty = zone.cy + 20 + (Math.random() - 0.5) * ZONE_HALF * 2;
      }
    }

    // Clamp and check collisions — retry up to 3 times
    let pt = clampToRoom(tx, ty);
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!isTooClose(pt.x, pt.y, ref.data.id, charRefs)) return pt;
      pt = clampToRoom(
        pt.x + (Math.random() - 0.5) * 80,
        pt.y + (Math.random() - 0.5) * 80
      );
    }
    return pt; // best effort
  }

  function startWalking(ref: CharRef) {
    if (ref.status === "working" || ref.isTalking) return;
    if (!WORK_ZONES[ref.data.id]) return;

    function walk() {
      if (selectedId === ref.data.id || ref.status === "working" || ref.isTalking) return;

      const target = pickWalkTarget(ref);
      const dx = target.x - ref.sprite.x;
      const dy = target.y - ref.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 8) {
        ref.walkTimer = scene.time.delayedCall(2000 + Math.random() * 4000, walk);
        return;
      }

      const dir = getDirection(dx, dy);
      const duration = (dist / ref.walkSpeed) * 1000;
      ref.sprite.play(`${ref.spriteName}-walk-${dir}`);

      ref.currentTween = scene.tweens.add({
        targets: ref.sprite,
        x: target.x,
        y: target.y,
        duration,
        ease: "Linear",
        onUpdate: () => {
          updateLabelPos(ref);
          // Collision avoidance during walk
          if (isTooClose(ref.sprite.x, ref.sprite.y, ref.data.id, charRefs, 35)) {
            ref.currentTween?.stop();
            ref.currentTween = null;
            ref.sprite.stop();
            ref.sprite.setFrame(DIR_FRAMES[dir].start);
            ref.walkTimer = scene.time.delayedCall(1000 + Math.random() * 2000, walk);
          }
        },
        onComplete: () => {
          ref.currentTween = null;
          ref.sprite.stop();
          ref.sprite.setFrame(DIR_FRAMES[dir].start);
          ref.walkTimer = scene.time.delayedCall(2000 + Math.random() * 3000, walk);
        },
      });
    }

    ref.walkTimer = scene.time.delayedCall(1000 + Math.random() * 3000, walk);
  }

  // ─── Run to desk (on task assignment) ────────────────────────

  function runToDesk(ref: CharRef) {
    stopWalking(ref);
    ref.isTalking = false; // interrupt any conversation

    const zone = WORK_ZONES[ref.data.id];
    if (!zone) return;

    const deskX = zone.cx;
    const deskY = zone.cy + 20;
    const dx = deskX - ref.sprite.x;
    const dy = deskY - ref.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      // Already at desk
      ref.sprite.setPosition(deskX, deskY);
      ref.sprite.setFrame(DIR_FRAMES["up"].start);
      updateLabelPos(ref);
      ref.statusText.setText("Working...");
      ref.statusText.setColor("#f0c040");
      return;
    }

    const dir = getDirection(dx, dy);
    const speed = 180; // 3–4× normal walk speed
    const duration = (dist / speed) * 1000;

    // Play run animation (faster frameRate)
    ref.sprite.play(`${ref.spriteName}-run-${dir}`);

    ref.currentTween = scene.tweens.add({
      targets: ref.sprite,
      x: deskX,
      y: deskY,
      duration,
      ease: "Linear",
      onUpdate: () => { updateLabelPos(ref); },
      onComplete: () => {
        ref.currentTween = null;
        ref.sprite.stop();
        // Face monitor (up)
        ref.sprite.setFrame(DIR_FRAMES["up"].start);
        updateLabelPos(ref);
        ref.statusText.setText("Working...");
        ref.statusText.setColor("#f0c040");
      },
    });
  }

  // ─── Background click to deselect ────────────────────────────

  scene.input.on("pointerdown", () => {
    if (!justClickedUI && selectedId) deselectAll();
    justClickedUI = false;
  });

  // ─── Place each character ────────────────────────────────────

  characters.forEach((c) => {
    const spriteName = SPRITE_MAP[c.id];
    if (!spriteName) return;
    const zone = WORK_ZONES[c.id];
    if (!zone) return;

    const startX = zone.cx;
    const startY = zone.cy + 36;

    const sprite = scene.add.sprite(startX, startY, spriteName);
    sprite.setScale(SPRITE_SCALE);
    sprite.setFrame(0);
    sprite.setInteractive({ useHandCursor: true });
    sprite.setDepth(2);

    // --- English label plate above character ---
    const info = DISPLAY_INFO[c.id] || { name: c.name, role: c.role };

    const roleText = scene.add.text(0, -8, info.role, {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
      fontFamily: '"Pixelify Sans", sans-serif',
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    const nameTextObj = scene.add.text(0, 10, info.name, {
      fontSize: "15px",
      color: "#aaaaaa",
      fontFamily: '"Pixelify Sans", sans-serif',
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    const statusText = scene.add.text(0, 26, "", {
      fontSize: "14px",
      fontStyle: "bold",
      color: "#f0c040",
      fontFamily: '"Pixelify Sans", sans-serif',
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Background plate
    const plateW = Math.max(roleText.width, nameTextObj.width) + 20;
    const plateBg = scene.add.rectangle(0, 2, plateW, 48, 0x000000, 0.6);

    const labelContainer = scene.add.container(startX, startY - 52, [
      plateBg,
      roleText,
      nameTextObj,
      statusText,
    ]).setDepth(3);

    const ref: CharRef = {
      sprite,
      labelContainer,
      roleText,
      nameTextObj,
      statusText,
      data: c,
      spriteName,
      walkSpeed: 30 + Math.random() * 30,
      currentTween: null,
      walkTimer: null,
      status: "idle",
      isTalking: false,
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

  // ─── Status system via CustomEvents ──────────────────────────

  function setCharStatus(charId: string, status: CharStatus) {
    const ref = charRefs.get(charId);
    if (!ref) return;

    ref.status = status;

    if (status === "working") {
      runToDesk(ref);
    } else if (status === "done") {
      ref.statusText.setText("Done ✓");
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
  scene.events.on("shutdown", () => {
    window.removeEventListener("character-status", handleStatusEvent);
  });
  scene.events.on("destroy", () => {
    window.removeEventListener("character-status", handleStatusEvent);
  });

  // Return API for SocialSystem
  return { charRefs, stopWalking, startWalking, updateLabelPos };
}
