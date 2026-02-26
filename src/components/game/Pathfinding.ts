/**
 * Pathfinding.ts — Walkability grid + EasyStar.js pathfinding
 *
 * Builds a walkability grid from the Tiled map layers and provides
 * path-finding utilities used by CharacterSprites and SocialSystem.
 */

import EasyStar from "easystarjs";

const TILE = 32;

// Layers whose tiles block movement
const BLOCKED_LAYERS = [
  "Objects", "Objects2", "Wall", "wall2",
  "wp1", "wp2", "wp3", "wp4", "wp5",
];

export interface PathPoint {
  x: number;
  y: number;
}

export interface PathfindingAPI {
  /** Find a pixel-path from (fx,fy) to (tx,ty). Returns null if unreachable. */
  findPath: (fx: number, fy: number, tx: number, ty: number) => Promise<PathPoint[] | null>;
  /** Random walkable pixel, optionally near a tile position */
  getRandomWalkable: (nearTX?: number, nearTY?: number) => PathPoint;
  /** Random walkable pixel in the centre of the room (for conversations) */
  getConversationPoint: () => PathPoint;
  /** Must be called every frame */
  calculate: () => void;
  /** The raw grid (for debug) */
  grid: number[][];
  /** All walkable tiles */
  walkableTiles: { x: number; y: number }[];
}

/** Read desk centre from wp layer tiles */
export function getDeskPosition(
  map: Phaser.Tilemaps.Tilemap,
  wpLayerName: string
): PathPoint {
  const layer = map.getLayer(wpLayerName);
  if (!layer) return { x: 480, y: 320 };

  const tiles: { x: number; y: number }[] = [];
  layer.data.forEach((row: Phaser.Tilemaps.Tile[], y: number) => {
    row.forEach((tile: Phaser.Tilemaps.Tile, x: number) => {
      if (tile.index !== -1) tiles.push({ x, y });
    });
  });
  if (tiles.length === 0) return { x: 480, y: 320 };

  const cx = tiles.reduce((s, t) => s + t.x, 0) / tiles.length;
  const cy = tiles.reduce((s, t) => s + t.y, 0) / tiles.length;
  return { x: cx * TILE + TILE / 2, y: cy * TILE + TILE / 2 };
}

/** Build walkability grid + EasyStar instance from a Tiled map */
export function initPathfinding(
  map: Phaser.Tilemaps.Tilemap
): PathfindingAPI {
  const w = map.width;
  const h = map.height;

  // Build grid: 1 = walkable, 0 = blocked
  const grid: number[][] = [];
  for (let y = 0; y < h; y++) {
    grid[y] = [];
    for (let x = 0; x < w; x++) {
      let blocked = false;
      for (const name of BLOCKED_LAYERS) {
        const layer = map.getLayer(name);
        if (layer && layer.data[y] && layer.data[y][x] && layer.data[y][x].index !== -1) {
          blocked = true;
          break;
        }
      }
      grid[y][x] = blocked ? 0 : 1;
    }
  }

  // Cache walkable tiles
  const walkableTiles: { x: number; y: number }[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 1) walkableTiles.push({ x, y });
    }
  }

  // EasyStar setup
  const easystar = new EasyStar.js();
  easystar.setGrid(grid);
  easystar.setAcceptableTiles([1]);
  easystar.enableDiagonals();
  easystar.disableCornerCutting();

  function findPath(
    fx: number, fy: number,
    tx: number, ty: number
  ): Promise<PathPoint[] | null> {
    const fromTX = Math.max(0, Math.min(w - 1, Math.floor(fx / TILE)));
    const fromTY = Math.max(0, Math.min(h - 1, Math.floor(fy / TILE)));
    let toTX = Math.max(0, Math.min(w - 1, Math.floor(tx / TILE)));
    let toTY = Math.max(0, Math.min(h - 1, Math.floor(ty / TILE)));

    // If target tile is blocked, find nearest walkable
    if (grid[toTY] && grid[toTY][toTX] === 0) {
      let bestX = toTX;
      let bestY = toTY;
      let bestDist = Infinity;
      walkableTiles.forEach((t) => {
        const d = Math.abs(t.x - toTX) + Math.abs(t.y - toTY);
        if (d < bestDist) { bestDist = d; bestX = t.x; bestY = t.y; }
      });
      toTX = bestX;
      toTY = bestY;
    }

    return new Promise((resolve) => {
      easystar.findPath(fromTX, fromTY, toTX, toTY, (path) => {
        if (path && path.length > 0) {
          resolve(
            path.map((p) => ({ x: p.x * TILE + TILE / 2, y: p.y * TILE + TILE / 2 }))
          );
        } else {
          resolve(null);
        }
      });
      easystar.calculate();
    });
  }

  function getRandomWalkable(nearTX?: number, nearTY?: number): PathPoint {
    if (nearTX !== undefined && nearTY !== undefined && Math.random() < 0.5) {
      const nearby = walkableTiles.filter(
        (t) => Math.abs(t.x - nearTX) + Math.abs(t.y - nearTY) < 8
      );
      if (nearby.length > 0) {
        const t = nearby[Math.floor(Math.random() * nearby.length)];
        return { x: t.x * TILE + TILE / 2, y: t.y * TILE + TILE / 2 };
      }
    }
    const t = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
    return { x: t.x * TILE + TILE / 2, y: t.y * TILE + TILE / 2 };
  }

  function getConversationPoint(): PathPoint {
    // Central room tiles (x:5-25, y:6-16)
    const central = walkableTiles.filter(
      (t) => t.x >= 5 && t.x <= 25 && t.y >= 6 && t.y <= 16
    );
    const pool = central.length > 0 ? central : walkableTiles;
    const t = pool[Math.floor(Math.random() * pool.length)];
    return { x: t.x * TILE + TILE / 2, y: t.y * TILE + TILE / 2 };
  }

  return {
    findPath,
    getRandomWalkable,
    getConversationPoint,
    calculate: () => easystar.calculate(),
    grid,
    walkableTiles,
  };
}
