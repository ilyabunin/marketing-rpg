// Work zone desk centers (pixel coords) — 1248x832 canvas
export const WORK_ZONES: Record<string, { cx: number; cy: number }> = {
  "seo-analyst": { cx: 260, cy: 240 },
  "creative-director": { cx: 980, cy: 240 },
  "senior-copywriter": { cx: 260, cy: 530 },
  "ua-strategist": { cx: 980, cy: 530 },
  "project-manager": { cx: 624, cy: 700 },
};

const ZONE_LABELS: Record<string, string> = {
  "seo-analyst": "SEO",
  "creative-director": "CREO",
  "senior-copywriter": "COPY",
  "ua-strategist": "UA",
  "project-manager": "PM",
};

export function drawFurniture(scene: Phaser.Scene) {
  const gfx = scene.add.graphics();

  // --- 5 Work Zones ---
  Object.entries(WORK_ZONES).forEach(([id, zone]) => {
    const label = ZONE_LABELS[id];
    const isPM = id === "project-manager";
    const deskW = isPM ? 76 : 64;
    const deskH = isPM ? 44 : 40;

    // Desk shadow
    gfx.fillStyle(0x4a3a2a, 0.4);
    gfx.fillRect(zone.cx - deskW / 2 + 2, zone.cy - deskH / 2 + 3, deskW, deskH);

    // Desk
    gfx.fillStyle(0x6b5b4a, 1);
    gfx.fillRect(zone.cx - deskW / 2, zone.cy - deskH / 2, deskW, deskH);
    gfx.lineStyle(1, 0x8a7a6a, 0.8);
    gfx.strokeRect(zone.cx - deskW / 2, zone.cy - deskH / 2, deskW, deskH);
    // Surface highlight
    gfx.fillStyle(0x7b6b5a, 0.5);
    gfx.fillRect(zone.cx - deskW / 2 + 2, zone.cy - deskH / 2 + 2, deskW - 4, 2);

    // Monitor bezel
    gfx.fillStyle(0x333333, 1);
    gfx.fillRect(zone.cx - 9, zone.cy - deskH / 2 + 3, 18, 14);
    gfx.fillStyle(0x88ccff, 1);
    gfx.fillRect(zone.cx - 8, zone.cy - deskH / 2 + 4, 16, 12);
    // Monitor stand
    gfx.fillStyle(0x555555, 1);
    gfx.fillRect(zone.cx - 3, zone.cy - deskH / 2 + 17, 6, 4);

    // Chair (below desk)
    gfx.fillStyle(0x5a4a3a, 1);
    gfx.fillRect(zone.cx - 10, zone.cy + deskH / 2 + 6, 20, 20);
    gfx.lineStyle(1, 0x7a6a5a, 0.5);
    gfx.strokeRect(zone.cx - 10, zone.cy + deskH / 2 + 6, 20, 20);
    gfx.fillStyle(0x4a3a2a, 1);
    gfx.fillRect(zone.cx - 8, zone.cy + deskH / 2 + 6, 16, 4);

    // Zone label
    if (label) {
      scene.add
        .text(zone.cx, zone.cy - deskH / 2 - 14, label, {
          fontSize: "10px",
          color: "#8a7a6a",
          fontFamily: '"Pixelify Sans", sans-serif',
        })
        .setOrigin(0.5);
    }
  });

  // --- Whiteboard at top wall center ---
  gfx.fillStyle(0xe0d8c8, 1);
  gfx.fillRect(554, 36, 140, 60);
  gfx.lineStyle(2, 0xc0b8a8, 0.9);
  gfx.strokeRect(554, 36, 140, 60);
  gfx.lineStyle(1, 0xa09888, 0.5);
  gfx.strokeRect(556, 38, 136, 56);
  scene.add
    .text(624, 66, "MARKETING", {
      fontSize: "14px",
      color: "#4a3a2a",
      fontFamily: '"Pixelify Sans", sans-serif',
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  // --- Coffee machine at bottom-left ---
  gfx.fillStyle(0x8b7355, 1);
  gfx.fillRect(64, 760, 24, 32);
  gfx.lineStyle(1, 0xa08a6a, 0.7);
  gfx.strokeRect(64, 760, 24, 32);
  gfx.fillStyle(0x9b8365, 1);
  gfx.fillRect(66, 760, 20, 6);
  // Cup
  gfx.fillStyle(0xdddddd, 1);
  gfx.fillRect(92, 780, 10, 10);
  gfx.lineStyle(1, 0xbbbbbb, 0.6);
  gfx.strokeRect(92, 780, 10, 10);
  gfx.fillStyle(0xcccccc, 1);
  gfx.fillRect(102, 783, 3, 4);

  // --- Plants in corners + extras ---
  const plants = [
    { x: 56, y: 56, size: 28 },
    { x: 1192, y: 56, size: 24 },
    { x: 56, y: 800, size: 26 },
    { x: 1192, y: 800, size: 22 },
    { x: 620, y: 170, size: 20 },
    { x: 1192, y: 420, size: 22 },
  ];
  plants.forEach((p) => {
    gfx.fillStyle(0x6b4e2f, 1);
    gfx.fillRect(p.x - p.size / 4, p.y + p.size / 6, p.size / 2, p.size / 3);
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
  gfx.fillRect(500, 350, 250, 150);
}
