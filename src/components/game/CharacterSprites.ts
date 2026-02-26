import { WORK_ZONES } from "./FurnitureBuilder";

const SPRITE_SCALE = 1.2;
const ZONE_HALF = 125; // home zone ±125px from desk center (larger room)

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

interface CharRef {
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

  function clearMenu() {
    menuContainer?.destroy();
    menuContainer = null;
    glowGfx?.destroy();
    glowGfx = null;
  }

  function deselectAll() {
    if (selectedId) {
      const ref = charRefs.get(selectedId);
      if (ref && ref.status !== "working") startWalking(ref);
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

  // --- Walking AI ---
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

  function startWalking(ref: CharRef) {
    if (ref.status === "working") return;
    const zone = WORK_ZONES[ref.data.id];
    if (!zone) return;

    function walk() {
      if (selectedId === ref.data.id || ref.status === "working") return;

      const tx = zone.cx + (Math.random() - 0.5) * ZONE_HALF * 2;
      const ty = zone.cy + 20 + (Math.random() - 0.5) * ZONE_HALF * 2;
      const targetX = Math.max(48, Math.min(1200, tx));
      const targetY = Math.max(48, Math.min(816, ty));

      const dx = targetX - ref.sprite.x;
      const dy = targetY - ref.sprite.y;
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
        x: targetX,
        y: targetY,
        duration,
        ease: "Linear",
        onUpdate: () => { updateLabelPos(ref); },
        onComplete: () => {
          ref.currentTween = null;
          ref.sprite.stop();
          ref.sprite.setFrame(DIR_FRAMES[dir].start);
          ref.walkTimer = scene.time.delayedCall(2000 + Math.random() * 2000, walk);
        },
      });
    }

    ref.walkTimer = scene.time.delayedCall(1000 + Math.random() * 3000, walk);
  }

  // --- Background click to deselect ---
  scene.input.on("pointerdown", () => {
    if (!justClickedUI && selectedId) deselectAll();
    justClickedUI = false;
  });

  // --- Place each character ---
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

  // --- Status system via CustomEvents ---
  function setCharStatus(charId: string, status: CharStatus) {
    const ref = charRefs.get(charId);
    if (!ref) return;

    ref.status = status;
    const zone = WORK_ZONES[charId];

    if (status === "working") {
      stopWalking(ref);
      if (zone) {
        ref.sprite.setPosition(zone.cx, zone.cy + 20);
        ref.sprite.setFrame(DIR_FRAMES["up"].start);
        updateLabelPos(ref);
      }
      ref.statusText.setText("Working...");
      ref.statusText.setColor("#f0c040");
    } else if (status === "done") {
      ref.statusText.setText("Done");
      ref.statusText.setColor("#4ecb4e");
      scene.time.delayedCall(3000, () => {
        if (ref.status === "done") setCharStatus(charId, "idle");
      });
    } else {
      ref.statusText.setText("");
      if (selectedId !== charId) startWalking(ref);
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
}
