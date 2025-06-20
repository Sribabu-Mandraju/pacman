// Maze generator utility for dynamic level creation

// Seeded pseudo-random number generator (PRNG)
const createSeededRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
};

export const generateMaze = (level, baseRows = 30) => {
  const random = createSeededRandom(level);
  let rows = baseRows + (level - 1) * 20;
  if (rows % 2 === 0) rows++; // Ensure rows are odd
  const cols = 19; // Keep width odd

  // Initialize maze with all walls
  const maze = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(1));
  const stack = [];

  const carve = (y, x) => {
    maze[y][x] = 0;
    stack.push([y, x]);
  };

  // Start carving from a random odd-coordinate point
  let startY = Math.floor(random() * (rows - 2)) + 1;
  let startX = Math.floor(random() * (cols - 2)) + 1;
  if (startY % 2 === 0) startY--;
  if (startX % 2 === 0) startX--;
  carve(startY > 0 ? startY : 1, startX > 0 ? startX : 1);

  while (stack.length > 0) {
    const [cy, cx] = stack[stack.length - 1];
    const neighbors = [];

    // Check potential neighbors (2 cells away)
    if (cy > 1 && maze[cy - 2][cx] === 1) neighbors.push([cy - 2, cx, "up"]);
    if (cy < rows - 2 && maze[cy + 2][cx] === 1)
      neighbors.push([cy + 2, cx, "down"]);
    if (cx > 1 && maze[cy][cx - 2] === 1) neighbors.push([cy, cx - 2, "left"]);
    if (cx < cols - 2 && maze[cy][cx + 2] === 1)
      neighbors.push([cy, cx + 2, "right"]);

    if (neighbors.length > 0) {
      const [ny, nx, dir] = neighbors[Math.floor(random() * neighbors.length)];

      if (dir === "up") maze[cy - 1][cx] = 0;
      if (dir === "down") maze[cy + 1][cx] = 0;
      if (dir === "left") maze[cy][cx - 1] = 0;
      if (dir === "right") maze[cy][cx + 1] = 0;

      carve(ny, nx);
    } else {
      stack.pop();
    }
  }

  // Define spawn point at the bottom center
  const spawnY = rows - 2;
  const spawnX = Math.floor(cols / 2);

  // Ensure spawn area is clear
  maze[spawnY][spawnX] = 0;
  if (maze[spawnY - 1]?.[spawnX] === 1) {
    maze[spawnY - 1][spawnX] = 0;
  }

  return {
    pattern: maze,
    spawnPoint: { x: spawnX, y: spawnY },
    dimensions: { rows, cols },
  };
};

// Level configurations
export const LEVEL_CONFIG = {
  1: { germCount: 10 },
  2: { germCount: 15 },
  3: { germCount: 20 },
  4: { germCount: 25 },
  5: { germCount: 30 },
  6: { germCount: 35 },
  7: { germCount: 40 },
  8: { germCount: 45 },
  9: { germCount: 50 },
  10: { germCount: 55 },
};
