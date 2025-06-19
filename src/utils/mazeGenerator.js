// Maze generator utility for dynamic level creation
export const generateMaze = (level, baseRows = 100) => {
  const rows = baseRows + (level - 1) * 20; // Start with 100 rows, add 20 per level
  const cols = 19; // Keep width constant for now

  // Create a maze filled with walls
  const maze = Array(rows)
    .fill()
    .map(() => Array(cols).fill(1));

  // Create basic maze structure with corridors
  for (let y = 1; y < rows - 1; y += 2) {
    for (let x = 1; x < cols - 1; x += 2) {
      maze[y][x] = 0; // Create corridor intersection

      // Create horizontal corridors
      if (x < cols - 3 && Math.random() > 0.3) {
        maze[y][x + 1] = 0;
      }

      // Create vertical corridors
      if (y < rows - 3 && Math.random() > 0.3) {
        maze[y + 1][x] = 0;
      }
    }
  }

  // Ensure borders are walls
  for (let x = 0; x < cols; x++) {
    maze[0][x] = 1;
    maze[rows - 1][x] = 1;
  }
  for (let y = 0; y < rows; y++) {
    maze[y][0] = 1;
    maze[y][cols - 1] = 1;
  }

  // Create some larger open areas
  for (let i = 0; i < level * 2; i++) {
    const startX = Math.floor(Math.random() * (cols - 6)) + 2;
    const startY = Math.floor(Math.random() * (rows - 6)) + 2;

    for (let y = startY; y < Math.min(startY + 4, rows - 1); y++) {
      for (let x = startX; x < Math.min(startX + 4, cols - 1); x++) {
        if (x > 0 && x < cols - 1 && y > 0 && y < rows - 1) {
          maze[y][x] = 0;
        }
      }
    }
  }

  // Ensure there's always a path from spawn point
  const spawnY = rows - 3; // Start at bottom
  const spawnX = Math.floor(cols / 2);

  // Clear spawn area
  for (let y = spawnY - 1; y <= spawnY + 1; y++) {
    for (let x = spawnX - 1; x <= spawnX + 1; x++) {
      if (y >= 1 && y < rows - 1 && x >= 1 && x < cols - 1) {
        maze[y][x] = 0;
      }
    }
  }

  return {
    pattern: maze,
    spawnPoint: { x: spawnX + 0.5, y: spawnY + 0.5 },
    dimensions: { rows, cols },
  };
};

// Level configurations
export const LEVEL_CONFIG = {
  1: { ghostCount: 40, germCount: 5, glitchCount: 3 },
  2: { ghostCount: 45, germCount: 7, glitchCount: 4 },
  3: { ghostCount: 50, germCount: 9, glitchCount: 5 },
  4: { ghostCount: 55, germCount: 11, glitchCount: 6 },
  5: { ghostCount: 60, germCount: 13, glitchCount: 7 },
  6: { ghostCount: 65, germCount: 15, glitchCount: 8 },
  7: { ghostCount: 70, germCount: 17, glitchCount: 9 },
  8: { ghostCount: 75, germCount: 19, glitchCount: 10 },
  9: { ghostCount: 80, germCount: 21, glitchCount: 11 },
  10: { ghostCount: 90, germCount: 25, glitchCount: 15 },
};
