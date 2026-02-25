const TILE = 16;

interface CharacterData {
  id: string;
  name_ru: string;
  role: string;
  greeting: string;
  position: { x: number; y: number };
  tasks: { id: string; name: string; description: string }[];
}

const SPRITE_MAP: Record<string, string> = {
  "seo-analyst": "Adam",
  "creative-director": "Alex",
  "senior-copywriter": "Jenny",
  "ua-strategist": "Bob",
};

const POSITIONS: Record<string, { x: number; y: number }> = {
  "seo-analyst": { x: 4, y: 5 },
  "creative-director": { x: 15, y: 5 },
  "senior-copywriter": { x: 15, y: 9 },
  "ua-strategist": { x: 4, y: 9 },
};

export function preloadCharacters(scene: Phaser.Scene) {
  Object.entries(SPRITE_MAP).forEach(([, spriteName]) => {
    scene.load.spritesheet(spriteName, `/sprites/${spriteName}.png`, {
      frameWidth: 32,
      frameHeight: 48,
    });
  });
}

export function createCharacterAnimations(scene: Phaser.Scene) {
  Object.values(SPRITE_MAP).forEach((name) => {
    // Idle: row 0 (facing down), frames 0,1,2,3
    scene.anims.create({
      key: `${name}-idle`,
      frames: scene.anims.generateFrameNumbers(name, {
        start: 0,
        end: 3,
      }),
      frameRate: 4,
      repeat: -1,
    });

    // Face down (turn to camera)
    scene.anims.create({
      key: `${name}-face-down`,
      frames: [{ key: name, frame: 0 }],
      frameRate: 1,
    });
  });
}

export function placeCharacters(
  scene: Phaser.Scene,
  characters: CharacterData[],
  onClick: (c: CharacterData) => void
) {
  characters.forEach((c) => {
    const spriteName = SPRITE_MAP[c.id];
    if (!spriteName) return;

    const pos = POSITIONS[c.id] || c.position;
    const cx = pos.x * TILE + TILE / 2;
    const cy = pos.y * TILE + TILE / 2;

    const sprite = scene.add.sprite(cx, cy, spriteName);
    sprite.play(`${spriteName}-idle`);
    sprite.setInteractive({ useHandCursor: true });

    const nameText = scene.add
      .text(cx, cy - 30, c.name_ru, {
        fontSize: "5px",
        color: "#f0c040",
        fontFamily: '"Press Start 2P"',
        stroke: "#0f0f23",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setVisible(false);

    sprite.on("pointerover", () => {
      sprite.setTint(0xffffaa);
      nameText.setVisible(true);
    });

    sprite.on("pointerout", () => {
      sprite.clearTint();
      nameText.setVisible(false);
    });

    sprite.on("pointerdown", () => {
      // Face camera (frame 0 = facing down)
      sprite.play(`${spriteName}-face-down`);
      onClick(c);
      // Resume idle after a short delay
      scene.time.delayedCall(300, () => {
        sprite.play(`${spriteName}-idle`);
      });
    });
  });
}
