import { WORK_ZONES } from "./FurnitureBuilder";

const SPRITE_SCALE = 1.5;
const ZONE_HALF = 100; // home zone is ±100px from desk center

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

interface CharRef {
  sprite: Phaser.GameObjects.Sprite;
  nameText: Phaser.GameObjects.Text;
  data: CharacterData;
  spriteName: string;
  walkSpeed: number;
  currentTween: Phaser.Tweens.Tween | null;
  walkTimer: Phaser.Time.TimerEvent | null;
}

const SPRITE_MAP: Record<string, string> = {
  "seo-analyst": "Adam",
  "creative-director": "Alex",
  "senior-copywriter": "Jenny",
  "ua-strategist": "Bob",
};

// Spritesheet layout: 4 cols × 4 rows (32×48 per frame)
// Row 0 = down, Row 1 = left, Row 2 = right, Row 3 = up
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
    }
  });
}

export function placeCharacters(
  scene: Phaser.Scene,
  characters: CharacterData[],
  onClick: (c: CharacterData) => void,
  onBio?: (c: CharacterData) => void
) {
  const charRefs = new Map<string, CharRef>();
  let selectedId: string | null = null;
  let menuContainer: Phaser.GameObjects.Container | null = null;
  let glowGfx: Phaser.GameObjects.Graphics | null = null;
  let justClickedUI = false;

  // --- Menu management ---
  function clearMenu() {
    menuContainer?.destroy();
    menuContainer = null;
    glowGfx?.destroy();
    glowGfx = null;
  }

  function deselectAll() {
    if (selectedId) {
      const ref = charRefs.get(selectedId);
      if (ref) startWalking(ref);
      selectedId = null;
    }
    clearMenu();
  }

  function showMenu(ref: CharRef) {
    clearMenu();
    const sx = ref.sprite.x;
    const sy = ref.sprite.y;

    // Gold glow outline
    glowGfx = scene.add.graphics();
    glowGfx.lineStyle(2, 0xf0c040, 0.8);
    const hw = 16 * SPRITE_SCALE;
    const hh = 24 * SPRITE_SCALE;
    glowGfx.strokeRect(sx - hw, sy - hh, hw * 2, hh * 2);
    glowGfx.setDepth(5);

    // Menu container above character
    menuContainer = scene.add.container(sx, sy - 56);
    menuContainer.setDepth(10);

    const bg = scene.add.rectangle(0, 0, 130, 36, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(2, 0xc8a84e);
    bg.setInteractive();
    bg.on("pointerdown", () => {
      justClickedUI = true;
    });

    const bioBtn = scene.add
      .text(-32, 0, "📋 Bio", {
        fontSize: "12px",
        color: "#e0d5c1",
        fontFamily: '"Pixelify Sans", sans-serif',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const chatBtn = scene.add
      .text(32, 0, "💬 Chat", {
        fontSize: "12px",
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
      const data = ref.data;
      clearMenu();
      selectedId = null;
      if (onBio) onBio(data);
    });

    chatBtn.on("pointerdown", () => {
      justClickedUI = true;
      const data = ref.data;
      clearMenu();
      selectedId = null;
      onClick(data);
    });

    menuContainer.add([bg, bioBtn, chatBtn]);
  }

  // --- Walking AI ---
  function stopWalking(ref: CharRef) {
    ref.currentTween?.stop();
    ref.currentTween = null;
    ref.walkTimer?.remove();
    ref.walkTimer = null;
    ref.sprite.stop();
    ref.sprite.setFrame(0); // face down
    ref.nameText.setPosition(ref.sprite.x, ref.sprite.y - 44);
  }

  function startWalking(ref: CharRef) {
    const zone = WORK_ZONES[ref.data.id];
    if (!zone) return;

    function walk() {
      if (selectedId === ref.data.id) return;

      const tx = zone.cx + (Math.random() - 0.5) * ZONE_HALF * 2;
      const ty = zone.cy + 20 + (Math.random() - 0.5) * ZONE_HALF * 2;
      const targetX = Math.max(48, Math.min(912, tx));
      const targetY = Math.max(48, Math.min(624, ty));

      const dx = targetX - ref.sprite.x;
      const dy = targetY - ref.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 8) {
        ref.walkTimer = scene.time.delayedCall(
          2000 + Math.random() * 4000,
          walk
        );
        return;
      }

      const dir = getDirection(dx, dy);
      const duration = (dist / ref.walkSpeed) * 1000;
      ref.sprite.play(`${ref.spriteName}-walk-${dir}`);

      ref.currentTween = scene.tweens.add({
        targets: ref.sprite,
        x: targetX,
        y: targetY,
        duration,
        ease: "Linear",
        onUpdate: () => {
          ref.nameText.setPosition(ref.sprite.x, ref.sprite.y - 44);
        },
        onComplete: () => {
          ref.currentTween = null;
          ref.sprite.stop();
          ref.sprite.setFrame(DIR_FRAMES[dir].start);
          ref.walkTimer = scene.time.delayedCall(
            2000 + Math.random() * 2000,
            walk
          );
        },
      });
    }

    ref.walkTimer = scene.time.delayedCall(
      1000 + Math.random() * 3000,
      walk
    );
  }

  // --- Background click to deselect ---
  scene.input.on("pointerdown", () => {
    if (!justClickedUI && selectedId) {
      deselectAll();
    }
    justClickedUI = false;
  });

  // --- Place each character ---
  characters.forEach((c) => {
    const spriteName = SPRITE_MAP[c.id];
    if (!spriteName) return;

    const zone = WORK_ZONES[c.id];
    if (!zone) return;

    // Start near chair (below desk center)
    const startX = zone.cx;
    const startY = zone.cy + 36;

    const sprite = scene.add.sprite(startX, startY, spriteName);
    sprite.setScale(SPRITE_SCALE);
    sprite.setFrame(0);
    sprite.setInteractive({ useHandCursor: true });
    sprite.setDepth(2);

    const nameText = scene.add
      .text(startX, startY - 44, c.name_ru, {
        fontSize: "11px",
        color: "#e0d5c1",
        fontFamily: '"Pixelify Sans", sans-serif',
        stroke: "#0f0f23",
        strokeThickness: 3,
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(3);

    const ref: CharRef = {
      sprite,
      nameText,
      data: c,
      spriteName,
      walkSpeed: 30 + Math.random() * 30,
      currentTween: null,
      walkTimer: null,
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
}
