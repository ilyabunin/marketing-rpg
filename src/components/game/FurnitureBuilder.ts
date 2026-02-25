const TILE = 16;

interface FurnitureItem {
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  label?: string;
}

const FURNITURE: FurnitureItem[] = [
  // Desks with computers (2x1 tiles each)
  { type: "desk", x: 3, y: 4, w: 2, h: 1, color: 0x5d4e37, label: "SEO" },
  { type: "desk", x: 3, y: 8, w: 2, h: 1, color: 0x5d4e37, label: "UA" },
  { type: "desk", x: 14, y: 4, w: 2, h: 1, color: 0x5d4e37, label: "CREO" },
  { type: "desk", x: 14, y: 8, w: 2, h: 1, color: 0x5d4e37, label: "TEXT" },

  // Chairs (1x1)
  { type: "chair", x: 4, y: 5, w: 1, h: 1, color: 0x8b4513 },
  { type: "chair", x: 4, y: 9, w: 1, h: 1, color: 0x8b4513 },
  { type: "chair", x: 15, y: 5, w: 1, h: 1, color: 0x8b4513 },
  { type: "chair", x: 15, y: 9, w: 1, h: 1, color: 0x8b4513 },

  // PC monitors on desks (1x1, on top of desk)
  { type: "pc", x: 3, y: 3, w: 1, h: 1, color: 0x2196f3, label: "🖥" },
  { type: "pc", x: 3, y: 7, w: 1, h: 1, color: 0x2196f3, label: "🖥" },
  { type: "pc", x: 14, y: 3, w: 1, h: 1, color: 0x2196f3, label: "🖥" },
  { type: "pc", x: 14, y: 7, w: 1, h: 1, color: 0x2196f3, label: "🖥" },

  // Plants in corners
  { type: "plant", x: 1, y: 2, w: 1, h: 1, color: 0x2e7d32 },
  { type: "plant", x: 18, y: 2, w: 1, h: 1, color: 0x2e7d32 },
  { type: "plant", x: 1, y: 13, w: 1, h: 1, color: 0x2e7d32 },
  { type: "plant", x: 18, y: 13, w: 1, h: 1, color: 0x2e7d32 },

  // Whiteboard center top
  { type: "board", x: 8, y: 0, w: 4, h: 2, color: 0xcfd8dc, label: "BOARD" },

  // Coffee machine bottom left
  { type: "coffee", x: 2, y: 12, w: 1, h: 1, color: 0x795548, label: "☕" },
];

export function drawFurniture(scene: Phaser.Scene) {
  FURNITURE.forEach((f) => {
    const px = f.x * TILE;
    const py = f.y * TILE;
    const pw = f.w * TILE;
    const ph = f.h * TILE;

    const rect = scene.add.rectangle(
      px + pw / 2,
      py + ph / 2,
      pw - 2,
      ph - 2,
      f.color,
      0.8
    );
    rect.setStrokeStyle(1, 0xe0d5c1, 0.6);

    if (f.label) {
      scene.add
        .text(px + pw / 2, py + ph / 2, f.label, {
          fontSize: "7px",
          color: "#e0d5c1",
          fontFamily: '"Press Start 2P"',
        })
        .setOrigin(0.5);
    }
  });
}
