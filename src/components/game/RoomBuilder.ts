const TILE = 32;
const COLS = 39; // 1248 / 32
const ROWS = 26; // 832 / 32

const COLORS = {
  floor1: 0xc4a882,
  floor2: 0xb89b72,
  wall: 0x4a3a2a,
  wallTrim: 0xe0d5c1,
};

export function drawFloor(scene: Phaser.Scene) {
  const gfx = scene.add.graphics();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const isAlt = (x + y) % 2 === 0;
      gfx.fillStyle(isAlt ? COLORS.floor1 : COLORS.floor2, 1);
      gfx.fillRect(x * TILE, y * TILE, TILE, TILE);
      gfx.lineStyle(1, 0x9a8a6a, 0.12);
      gfx.strokeRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
}

export function drawWalls(scene: Phaser.Scene) {
  const gfx = scene.add.graphics();

  // Top wall (1 tile = 32px)
  gfx.fillStyle(COLORS.wall, 1);
  gfx.fillRect(0, 0, COLS * TILE, TILE);
  for (let x = 0; x < COLS; x++) {
    gfx.lineStyle(1, 0x3a2a1a, 0.35);
    gfx.strokeRect(x * TILE, 0, TILE, TILE);
  }
  // Top wall trim
  gfx.lineStyle(2, COLORS.wallTrim, 0.7);
  gfx.beginPath();
  gfx.moveTo(0, TILE);
  gfx.lineTo(COLS * TILE, TILE);
  gfx.strokePath();

  // Left wall (1 tile)
  gfx.fillStyle(COLORS.wall, 1);
  gfx.fillRect(0, 0, TILE, ROWS * TILE);
  for (let y = 0; y < ROWS; y++) {
    gfx.lineStyle(1, 0x3a2a1a, 0.25);
    gfx.strokeRect(0, y * TILE, TILE, TILE);
  }

  // Right wall (1 tile)
  gfx.fillStyle(COLORS.wall, 1);
  gfx.fillRect((COLS - 1) * TILE, 0, TILE, ROWS * TILE);
  for (let y = 0; y < ROWS; y++) {
    gfx.lineStyle(1, 0x3a2a1a, 0.25);
    gfx.strokeRect((COLS - 1) * TILE, y * TILE, TILE, TILE);
  }

  // Side wall trims
  gfx.lineStyle(2, COLORS.wallTrim, 0.5);
  gfx.beginPath();
  gfx.moveTo(TILE, 0);
  gfx.lineTo(TILE, ROWS * TILE);
  gfx.moveTo((COLS - 1) * TILE, 0);
  gfx.lineTo((COLS - 1) * TILE, ROWS * TILE);
  gfx.strokePath();

  // Bottom edge open — subtle shadow
  gfx.lineStyle(1, 0x2a1a0a, 0.3);
  gfx.beginPath();
  gfx.moveTo(0, ROWS * TILE - 1);
  gfx.lineTo(COLS * TILE, ROWS * TILE - 1);
  gfx.strokePath();
}

export { TILE, COLS, ROWS };
