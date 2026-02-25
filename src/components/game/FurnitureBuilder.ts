// Work zone desk centers (pixel coords)
export const WORK_ZONES: Record<string, { cx: number; cy: number }> = {
  "seo-analyst": { cx: 200, cy: 192 },
  "creative-director": { cx: 752, cy: 192 },
  "senior-copywriter": { cx: 200, cy: 464 },
  "ua-strategist": { cx: 752, cy: 464 },
};

const ZONE_LABELS: Record<string, string> = {
  "seo-analyst": "SEO",
  "creative-director": "CREO",
  "senior-copywriter": "COPY",
  "ua-strategist": "UA",
};

export function drawFurniture(scene: Phaser.Scene) {
  const gfx = scene.add.graphics();

  // --- 4 Work Zones ---
  Object.entries(WORK_ZONES).forEach(([id, zone]) => {
    const label = ZONE_LABELS[id];

    // Desk shadow
    gfx.fillStyle(0x4a3a2a, 0.4);
    gfx.fillRect(zone.cx - 30, zone.cy - 17, 64, 40);

    // Desk: 64x40, #6b5b4a
    gfx.fillStyle(0x6b5b4a, 1);
    gfx.fillRect(zone.cx - 32, zone.cy - 20, 64, 40);
    gfx.lineStyle(1, 0x8a7a6a, 0.8);
    gfx.strokeRect(zone.cx - 32, zone.cy - 20, 64, 40);
    // Surface highlight
    gfx.fillStyle(0x7b6b5a, 0.5);
    gfx.fillRect(zone.cx - 30, zone.cy - 18, 60, 2);

    // Monitor bezel: 16x12, #88ccff
    gfx.fillStyle(0x333333, 1);
    gfx.fillRect(zone.cx - 9, zone.cy - 17, 18, 14);
    gfx.fillStyle(0x88ccff, 1);
    gfx.fillRect(zone.cx - 8, zone.cy - 16, 16, 12);
    // Monitor stand
    gfx.fillStyle(0x555555, 1);
    gfx.fillRect(zone.cx - 3, zone.cy - 3, 6, 4);

    // Chair: 20x20, #5a4a3a (below desk)
    gfx.fillStyle(0x5a4a3a, 1);
    gfx.fillRect(zone.cx - 10, zone.cy + 26, 20, 20);
    gfx.lineStyle(1, 0x7a6a5a, 0.5);
    gfx.strokeRect(zone.cx - 10, zone.cy + 26, 20, 20);
    // Chair back
    gfx.fillStyle(0x4a3a2a, 1);
    gfx.fillRect(zone.cx - 8, zone.cy + 26, 16, 4);

    // Zone label
    if (label) {
      scene.add
        .text(zone.cx, zone.cy - 34, label, {
          fontSize: "10px",
          color: "#8a7a6a",
          fontFamily: '"Pixelify Sans", sans-serif',
        })
        .setOrigin(0.5);
    }
  });

  // --- Whiteboard at top wall center ---
  gfx.fillStyle(0xe0d8c8, 1);
  gfx.fillRect(420, 36, 120, 50);
  gfx.lineStyle(2, 0xc0b8a8, 0.9);
  gfx.strokeRect(420, 36, 120, 50);
  gfx.lineStyle(1, 0xa09888, 0.5);
  gfx.strokeRect(422, 38, 116, 46);
  scene.add
    .text(480, 61, "MARKETING", {
      fontSize: "12px",
      color: "#4a3a2a",
      fontFamily: '"Pixelify Sans", sans-serif',
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  // --- Coffee machine at bottom-left ---
  gfx.fillStyle(0x8b7355, 1);
  gfx.fillRect(64, 576, 24, 32);
  gfx.lineStyle(1, 0xa08a6a, 0.7);
  gfx.strokeRect(64, 576, 24, 32);
  // Machine top
  gfx.fillStyle(0x9b8365, 1);
  gfx.fillRect(66, 576, 20, 6);
  // Cup
  gfx.fillStyle(0xdddddd, 1);
  gfx.fillRect(92, 596, 10, 10);
  gfx.lineStyle(1, 0xbbbbbb, 0.6);
  gfx.strokeRect(92, 596, 10, 10);
  gfx.fillStyle(0xcccccc, 1);
  gfx.fillRect(102, 599, 3, 4);

  // --- Plants in 4 corners ---
  const plants = [
    { x: 56, y: 56, size: 28 },
    { x: 904, y: 56, size: 24 },
    { x: 56, y: 608, size: 26 },
    { x: 904, y: 608, size: 22 },
  ];
  plants.forEach((p) => {
    // Pot
    gfx.fillStyle(0x6b4e2f, 1);
    gfx.fillRect(p.x - p.size / 4, p.y + p.size / 6, p.size / 2, p.size / 3);
    // Foliage
    gfx.fillStyle(0x4a7c3f, 1);
    gfx.fillCircle(p.x, p.y, p.size / 2);
    gfx.fillStyle(0x5a8c4f, 0.7);
    gfx.fillCircle(p.x - p.size / 5, p.y - p.size / 5, p.size / 3);
    gfx.fillCircle(p.x + p.size / 5, p.y - p.size / 5, p.size / 3);
    gfx.fillStyle(0x3a6c2f, 0.5);
    gfx.fillCircle(p.x, p.y - p.size / 4, p.size / 4);
  });

  // --- Subtle center rug ---
  gfx.fillStyle(0x8b7355, 0.06);
  gfx.fillRect(380, 260, 200, 120);
}
