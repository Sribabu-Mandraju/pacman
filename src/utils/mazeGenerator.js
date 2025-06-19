// Maze generator utility for infinite level creation
export const generateMaze = (level, segmentIndex = 0) => {
  const rows = 200 + segmentIndex * 50; // Infinite expansion
  const cols = 25; // Wider for better gameplay

  // Create a maze with more empty spaces
  const maze = Array(rows)
    .fill()
    .map(() => Array(cols).fill(0));

  // Create walls with more organic pattern and empty spaces
  for (let y = 2; y < rows - 2; y += 3) {
    for (let x = 2; x < cols - 2; x += 3) {
      // Create wall clusters with gaps
      if (Math.random() > 0.4) {
        // 60% chance of wall cluster
        maze[y][x] = 1;

        // Add surrounding walls randomly
        if (Math.random() > 0.5) maze[y - 1][x] = 1;
        if (Math.random() > 0.5) maze[y + 1][x] = 1;
        if (Math.random() > 0.5) maze[y][x - 1] = 1;
        if (Math.random() > 0.5) maze[y][x + 1] = 1;
      }
    }
  }

  // Create some larger wall structures
  for (let i = 0; i < Math.floor(rows / 20); i++) {
    const startX = Math.floor(Math.random() * (cols - 8)) + 2;
    const startY = Math.floor(Math.random() * (rows - 8)) + 2;
    const width = 2 + Math.floor(Math.random() * 4);
    const height = 2 + Math.floor(Math.random() * 4);

    if (Math.random() > 0.3) {
      // 70% chance to create structure
      for (let y = startY; y < Math.min(startY + height, rows - 2); y++) {
        for (let x = startX; x < Math.min(startX + width, cols - 2); x++) {
          maze[y][x] = 1;
        }
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

// Dynamic level configurations for infinite gameplay
export const getDynamicLevelConfig = (level, mazeSize) => {
  const baseGerms = Math.floor(mazeSize / 100); // 1 germ per 100 cells
  const baseGlitches = Math.floor(mazeSize / 150); // 1 glitch per 150 cells

  return {
    ghostCount: 20 + level * 2, // Moderate ghost increase
    germCount: Math.max(3, baseGerms + Math.floor(level / 2)), // Variable based on maze size
    glitchCount: Math.max(2, baseGlitches + Math.floor(level / 3)), // Variable based on maze size
  };
};
