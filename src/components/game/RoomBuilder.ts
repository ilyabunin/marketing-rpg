const TILE = 48; // 16px * 3x scale
const COLS = 20;
const ROWS = 15;

const COLORS = {
  floor: 0xc4a36a,
  floorAlt: 0xb89858,
  wallTop: 0x5a5a7a,
  wallSide: 0x4a4a6a,
  wallTrim: 0xe0d5c1,
};

export function drawFloor(scene: Phaser.Scene) {
  const gfx = scene.add.graphics();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const isAlt = (x + y) % 2 === 0;
      gfx.fillStyle(isAlt ? COLORS.floor : COLORS.floorAlt, 1);
      gfx.fillRect(x * TILE, y * TILE, TILE, TILE);
      gfx.lineStyle(1, 0x9a7e48, 0.3);
      gfx.strokeRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
}

export function drawWalls(scene: Phaser.Scene) {
  const gfx = scene.add.graphics();

  // Top wall (2 tiles tall)
  for (let x = 0; x < COLS; x++) {
    gfx.fillStyle(COLORS.wallTop, 1);
    gfx.fillRect(x * TILE, 0, TILE, TILE * 2);
    gfx.lineStyle(1, 0x3a3a5a, 0.5);
    gfx.strokeRect(x * TILE, 0, TILE, TILE);
    gfx.strokeRect(x * TILE, TILE, TILE, TILE);
  }

  // Wall trim line
  gfx.lineStyle(3, COLORS.wallTrim, 0.8);
  gfx.moveTo(0, TILE * 2);
  gfx.lineTo(COLS * TILE, TILE * 2);
  gfx.strokePath();

  // Left wall (1 tile wide)
  for (let y = 0; y < ROWS; y++) {
    gfx.fillStyle(COLORS.wallSide, 1);
    gfx.fillRect(0, y * TILE, TILE, TILE);
  }

  // Right wall (1 tile wide)
  for (let y = 0; y < ROWS; y++) {
    gfx.fillStyle(COLORS.wallSide, 1);
    gfx.fillRect((COLS - 1) * TILE, y * TILE, TILE, TILE);
  }

  // Side wall trim
  gfx.lineStyle(3, COLORS.wallTrim, 0.6);
  gfx.moveTo(TILE, 0);
  gfx.lineTo(TILE, ROWS * TILE);
  gfx.moveTo((COLS - 1) * TILE, 0);
  gfx.lineTo((COLS - 1) * TILE, ROWS * TILE);
  gfx.strokePath();
}

export { TILE, COLS, ROWS };
