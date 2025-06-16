"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const CELL_SIZE = 20;
const MAZE_WIDTH = 19;
const MAZE_HEIGHT = 21;
const GAME_SPEED = 150; // milliseconds between updates

// Sound effects
const SOUNDS = {
  chomp: new Audio("/sounds/chomp.mp3"),
  death: new Audio("/sounds/death.mp3"),
  eatGhost: new Audio("/sounds/eat_ghost.mp3"),
  powerPellet: new Audio("/sounds/power_pellet.mp3"),
  gameStart: new Audio("/sounds/game_start.mp3"),
  extraLife: new Audio("/sounds/extra_life.mp3"),
  lifeLost: new Audio("/sounds/life_lost.mp3"),
};

// Ghost behavior constants
const GHOST_MODES = {
  CHASE: "chase",
  SCATTER: "scatter",
  FRIGHTENED: "frightened",
  EATEN: "eaten",
};

const GHOST_NAMES = {
  BLINKY: "blinky", // Red - Direct chase
  PINKY: "pinky", // Pink - Ambush
  INKY: "inky", // Cyan - Complex pattern
  CLYDE: "clyde", // Orange - Alternates chase/flee
};

const GHOST_COLORS = {
  [GHOST_NAMES.BLINKY]: "#FF0000",
  [GHOST_NAMES.PINKY]: "#FFB8FF",
  [GHOST_NAMES.INKY]: "#00FFFF",
  [GHOST_NAMES.CLYDE]: "#FFB852",
};

const GHOST_CORNERS = {
  [GHOST_NAMES.BLINKY]: { x: MAZE_WIDTH - 2, y: 0 },
  [GHOST_NAMES.PINKY]: { x: 0, y: 0 },
  [GHOST_NAMES.INKY]: { x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 1 },
  [GHOST_NAMES.CLYDE]: { x: 0, y: MAZE_HEIGHT - 1 },
};

const GHOST_HOUSE = { x: 9, y: 9 };

// Mode timing (in seconds)
const MODE_TIMING = {
  SCATTER: 7,
  CHASE: 20,
  FRIGHTENED: 7,
};

// Score thresholds for extra lives
const EXTRA_LIFE_SCORES = [10000, 15000, 20000];

// Game maze layout (1 = wall, 0 = dot, 2 = power pellet, 3 = empty, 4 = ghost house)
const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 2, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 2, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 0, 1, 1, 1, 3, 1, 3, 1, 1, 1, 0, 1, 1, 1, 1],
  [3, 3, 3, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 3, 3, 3],
  [1, 1, 1, 1, 0, 1, 3, 1, 4, 4, 4, 1, 3, 1, 0, 1, 1, 1, 1],
  [3, 3, 3, 3, 0, 3, 3, 1, 4, 4, 4, 1, 3, 3, 0, 3, 3, 3, 3],
  [1, 1, 1, 1, 0, 1, 3, 1, 1, 1, 1, 1, 3, 1, 0, 1, 1, 1, 1],
  [3, 3, 3, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 3, 3, 3],
  [1, 1, 1, 1, 0, 1, 1, 1, 3, 1, 3, 1, 1, 1, 0, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 1],
  [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const GHOST_SPEED = 0.8; // Ghosts move slightly slower than Pacman

const Pacman2 = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const lastUpdateRef = useRef(0);

  const [gameState, setGameState] = useState("start"); // start, playing, paused, gameOver
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  const [pacman, setPacman] = useState({
    x: 9,
    y: 15,
    direction: DIRECTIONS.RIGHT,
    nextDirection: DIRECTIONS.RIGHT,
    mouthOpen: true,
  });

  const [ghosts, setGhosts] = useState([
    {
      x: 9,
      y: 9,
      direction: DIRECTIONS.UP,
      mode: "scatter",
      color: GHOST_COLORS[GHOST_NAMES.BLINKY],
      frightened: false,
    },
    {
      x: 8,
      y: 9,
      direction: DIRECTIONS.UP,
      mode: "scatter",
      color: GHOST_COLORS[GHOST_NAMES.PINKY],
      frightened: false,
    },
    {
      x: 10,
      y: 9,
      direction: DIRECTIONS.UP,
      mode: "scatter",
      color: GHOST_COLORS[GHOST_NAMES.INKY],
      frightened: false,
    },
    {
      x: 9,
      y: 10,
      direction: DIRECTIONS.UP,
      mode: "scatter",
      color: GHOST_COLORS[GHOST_NAMES.CLYDE],
      frightened: false,
    },
  ]);

  const [maze, setMaze] = useState(() => MAZE.map((row) => [...row]));
  const [powerPelletActive, setPowerPelletActive] = useState(false);
  const [powerPelletTimer, setPowerPelletTimer] = useState(0);

  const [modeTimer, setModeTimer] = useState(MODE_TIMING.SCATTER);
  const [currentMode, setCurrentMode] = useState(GHOST_MODES.SCATTER);
  const [ghostEatenCount, setGhostEatenCount] = useState(0);
  const [lastExtraLifeScore, setLastExtraLifeScore] = useState(0);
  const [showLifeLost, setShowLifeLost] = useState(false);
  const [lifeLostTimer, setLifeLostTimer] = useState(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    lastUpdateRef.current = 0;
  }, []);

  const isValidMove = useCallback(
    (x, y) => {
      if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT) {
        return false;
      }
      return maze[y][x] !== 1;
    },
    [maze]
  );

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        const pixelX = x * CELL_SIZE;
        const pixelY = y * CELL_SIZE;

        if (cell === 1) {
          // Wall
          ctx.fillStyle = "#0000FF";
          ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
        } else if (cell === 0) {
          // Dot
          ctx.fillStyle = "#FFFF00";
          ctx.beginPath();
          ctx.arc(
            pixelX + CELL_SIZE / 2,
            pixelY + CELL_SIZE / 2,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (cell === 2) {
          // Power pellet
          ctx.fillStyle = "#FFFF00";
          ctx.beginPath();
          ctx.arc(
            pixelX + CELL_SIZE / 2,
            pixelY + CELL_SIZE / 2,
            6,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });
    });

    // Draw Pacman
    const pacX = pacman.x * CELL_SIZE + CELL_SIZE / 2;
    const pacY = pacman.y * CELL_SIZE + CELL_SIZE / 2;

    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();

    if (pacman.mouthOpen) {
      let startAngle = 0;
      let endAngle = Math.PI * 2;

      if (pacman.direction === DIRECTIONS.RIGHT) {
        startAngle = Math.PI * 0.2;
        endAngle = Math.PI * 1.8;
      } else if (pacman.direction === DIRECTIONS.LEFT) {
        startAngle = Math.PI * 1.2;
        endAngle = Math.PI * 0.8;
      } else if (pacman.direction === DIRECTIONS.UP) {
        startAngle = Math.PI * 1.7;
        endAngle = Math.PI * 1.3;
      } else if (pacman.direction === DIRECTIONS.DOWN) {
        startAngle = Math.PI * 0.7;
        endAngle = Math.PI * 0.3;
      }

      ctx.arc(pacX, pacY, CELL_SIZE / 2 - 2, startAngle, endAngle);
      ctx.lineTo(pacX, pacY);
    } else {
      ctx.arc(pacX, pacY, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    }

    ctx.fill();

    // Draw ghosts
    ghosts.forEach((ghost) => {
      const ghostX = ghost.x * CELL_SIZE + CELL_SIZE / 2;
      const ghostY = ghost.y * CELL_SIZE + CELL_SIZE / 2;

      ctx.fillStyle = ghost.frightened ? "#0000FF" : ghost.color;

      // Ghost body
      ctx.beginPath();
      ctx.arc(ghostX, ghostY - 2, CELL_SIZE / 2 - 2, Math.PI, 0);
      ctx.rect(
        ghostX - (CELL_SIZE / 2 - 2),
        ghostY - 2,
        CELL_SIZE - 4,
        CELL_SIZE / 2
      );
      ctx.fill();

      // Ghost bottom wavy part
      ctx.beginPath();
      ctx.moveTo(ghostX - (CELL_SIZE / 2 - 2), ghostY + CELL_SIZE / 2 - 2);
      for (let i = 0; i < 4; i++) {
        const waveX = ghostX - (CELL_SIZE / 2 - 2) + (i * (CELL_SIZE - 4)) / 3;
        const waveY = ghostY + CELL_SIZE / 2 - 2 + (i % 2 === 0 ? -3 : 0);
        ctx.lineTo(waveX, waveY);
      }
      ctx.lineTo(ghostX + (CELL_SIZE / 2 - 2), ghostY + CELL_SIZE / 2 - 2);
      ctx.fill();

      // Ghost eyes
      ctx.fillStyle = "#FFF";
      ctx.fillRect(ghostX - 6, ghostY - 6, 4, 6);
      ctx.fillRect(ghostX + 2, ghostY - 6, 4, 6);

      if (!ghost.frightened) {
        ctx.fillStyle = "#000";
        ctx.fillRect(ghostX - 5, ghostY - 4, 2, 2);
        ctx.fillRect(ghostX + 3, ghostY - 4, 2, 2);
      }
    });
  }, [pacman, ghosts, maze]);

  const playSound = useCallback((sound) => {
    if (SOUNDS[sound]) {
      SOUNDS[sound].currentTime = 0;
      SOUNDS[sound].play().catch(() => {}); // Ignore autoplay errors
    }
  }, []);

  const checkExtraLife = useCallback(
    (newScore) => {
      const nextThreshold = EXTRA_LIFE_SCORES.find(
        (threshold) => threshold > lastExtraLifeScore && newScore >= threshold
      );

      if (nextThreshold) {
        setLives((prev) => prev + 1);
        setLastExtraLifeScore(nextThreshold);
        playSound("extraLife");
      }
    },
    [lastExtraLifeScore, playSound]
  );

  const getGhostTarget = useCallback(
    (ghost, pacman) => {
      switch (ghost.name) {
        case GHOST_NAMES.BLINKY:
          // Direct chase
          return { x: pacman.x, y: pacman.y };

        case GHOST_NAMES.PINKY:
          // Target 4 tiles ahead of Pacman
          const targetX = pacman.x + pacman.direction.x * 4;
          const targetY = pacman.y + pacman.direction.y * 4;
          return { x: targetX, y: targetY };

        case GHOST_NAMES.INKY:
          // Complex pattern based on Pacman and Blinky
          const blinky = ghosts.find((g) => g.name === GHOST_NAMES.BLINKY);
          const pacmanAheadX = pacman.x + pacman.direction.x * 2;
          const pacmanAheadY = pacman.y + pacman.direction.y * 2;
          const vectorX = pacmanAheadX - blinky.x;
          const vectorY = pacmanAheadY - blinky.y;
          return {
            x: pacmanAheadX + vectorX,
            y: pacmanAheadY + vectorY,
          };

        case GHOST_NAMES.CLYDE:
          // Alternate between chase and flee
          const distanceToPacman = Math.sqrt(
            Math.pow(ghost.x - pacman.x, 2) + Math.pow(ghost.y - pacman.y, 2)
          );
          return distanceToPacman > 8
            ? { x: pacman.x, y: pacman.y }
            : GHOST_CORNERS[GHOST_NAMES.CLYDE];

        default:
          return { x: pacman.x, y: pacman.y };
      }
    },
    [ghosts]
  );

  const updateGame = useCallback(() => {
    // Update Pacman
    setPacman((prev) => {
      let newX = prev.x;
      let newY = prev.y;
      let direction = prev.direction;

      // Try to change direction if next direction is valid
      const nextX = prev.x + prev.nextDirection.x;
      const nextY = prev.y + prev.nextDirection.y;
      if (isValidMove(nextX, nextY)) {
        direction = prev.nextDirection;
      }

      // Move in current direction
      newX = prev.x + direction.x;
      newY = prev.y + direction.y;

      // Handle tunnel effect (left-right wrap)
      if (newX < 0) newX = MAZE_WIDTH - 1;
      if (newX >= MAZE_WIDTH) newX = 0;

      // Check if move is valid
      if (!isValidMove(newX, newY)) {
        newX = prev.x;
        newY = prev.y;
      }

      return {
        ...prev,
        x: newX,
        y: newY,
        direction,
        mouthOpen: !prev.mouthOpen,
      };
    });

    // Update ghosts
    setGhosts((prev) =>
      prev.map((ghost) => {
        const possibleDirections = Object.values(DIRECTIONS).filter((dir) => {
          const newX = ghost.x + dir.x;
          const newY = ghost.y + dir.y;
          return (
            isValidMove(newX, newY) &&
            !(dir.x === -ghost.direction.x && dir.y === -ghost.direction.y)
          );
        });

        let newDirection = ghost.direction;
        if (possibleDirections.length > 0) {
          if (ghost.mode === GHOST_MODES.FRIGHTENED) {
            // Random movement when frightened
            newDirection =
              possibleDirections[
                Math.floor(Math.random() * possibleDirections.length)
              ];
          } else if (ghost.mode === GHOST_MODES.SCATTER) {
            // Move towards corner
            const target = GHOST_CORNERS[ghost.name];
            const distances = possibleDirections.map((dir) => {
              const newX = ghost.x + dir.x;
              const newY = ghost.y + dir.y;
              return Math.sqrt(
                Math.pow(newX - target.x, 2) + Math.pow(newY - target.y, 2)
              );
            });
            const minDistanceIndex = distances.indexOf(Math.min(...distances));
            newDirection = possibleDirections[minDistanceIndex];
          } else if (ghost.mode === GHOST_MODES.CHASE) {
            // Use ghost-specific targeting
            const target = getGhostTarget(ghost, pacman);
            const distances = possibleDirections.map((dir) => {
              const newX = ghost.x + dir.x;
              const newY = ghost.y + dir.y;
              return Math.sqrt(
                Math.pow(newX - target.x, 2) + Math.pow(newY - target.y, 2)
              );
            });
            const minDistanceIndex = distances.indexOf(Math.min(...distances));
            newDirection = possibleDirections[minDistanceIndex];
          }
        }

        let newX = ghost.x + newDirection.x;
        let newY = ghost.y + newDirection.y;

        // Handle tunnel effect
        if (newX < 0) newX = MAZE_WIDTH - 1;
        if (newX >= MAZE_WIDTH) newX = 0;

        if (!isValidMove(newX, newY)) {
          newX = ghost.x;
          newY = ghost.y;
        }

        return {
          ...ghost,
          x: newX,
          y: newY,
          direction: newDirection,
        };
      })
    );

    // Check collisions and eat dots
    setMaze((prev) => {
      const newMaze = prev.map((row) => [...row]);
      const cell = newMaze[pacman.y][pacman.x];

      if (cell === 0) {
        // Regular dot
        newMaze[pacman.y][pacman.x] = 3;
        setScore((s) => {
          const newScore = s + 10;
          checkExtraLife(newScore);
          return newScore;
        });
        playSound("chomp");
      } else if (cell === 2) {
        // Power pellet
        newMaze[pacman.y][pacman.x] = 3;
        setScore((s) => {
          const newScore = s + 50;
          checkExtraLife(newScore);
          return newScore;
        });
        setPowerPelletActive(true);
        setPowerPelletTimer(100);
        setGhosts((g) =>
          g.map((ghost) => ({ ...ghost, mode: GHOST_MODES.FRIGHTENED }))
        );
        playSound("powerPellet");
      }

      return newMaze;
    });

    // Check ghost collisions with improved detection
    ghosts.forEach((ghost) => {
      const dx = Math.abs(ghost.x - pacman.x);
      const dy = Math.abs(ghost.y - pacman.y);

      // Consider collision if ghosts and Pacman are very close
      if (dx < 0.5 && dy < 0.5) {
        if (ghost.mode === GHOST_MODES.FRIGHTENED) {
          const points = Math.pow(2, ghostEatenCount) * 200;
          setScore((s) => {
            const newScore = s + points;
            checkExtraLife(newScore);
            return newScore;
          });
          setGhostEatenCount((prev) => prev + 1);
          playSound("eatGhost");
          // Reset ghost position
          setGhosts((prev) =>
            prev.map((g) =>
              g === ghost
                ? {
                    ...g,
                    x: GHOST_HOUSE.x,
                    y: GHOST_HOUSE.y,
                    mode: GHOST_MODES.EATEN,
                  }
                : g
            )
          );
        } else if (ghost.mode !== GHOST_MODES.EATEN) {
          // Only decrease lives if the ghost is not in EATEN mode
          setLives((prev) => {
            if (prev <= 0) return 0; // Prevent negative lives
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameState("gameOver");
              playSound("death");
            } else {
              // Show life lost notification
              setShowLifeLost(true);
              setLifeLostTimer(60); // Show for 60 frames (about 1 second)
              playSound("lifeLost");
            }
            return newLives;
          });

          // Reset positions only if we're not in game over state
          if (lives > 1) {
            setPacman((prev) => ({
              ...prev,
              x: 9,
              y: 15,
              direction: DIRECTIONS.RIGHT,
            }));
            setGhosts((prev) =>
              prev.map((g) => ({
                ...g,
                x: g === ghost ? GHOST_HOUSE.x : g.x,
                y: g === ghost ? GHOST_HOUSE.y : g.y,
                mode: GHOST_MODES.SCATTER,
              }))
            );
          }
        }
      }
    });

    // Check win condition
    const dotsRemaining = maze.flat().filter((cell) => cell === 0 || cell === 2)
      .length;
    if (dotsRemaining === 0) {
      setLevel((prev) => prev + 1);
      setMaze(MAZE.map((row) => [...row]));
      setPacman((prev) => ({ ...prev, x: 9, y: 15 }));
      setGhostEatenCount(0);
    }
  }, [
    pacman,
    ghosts,
    maze,
    isValidMove,
    getGhostTarget,
    checkExtraLife,
    playSound,
    ghostEatenCount,
  ]);

  const handleKeyPress = useCallback(
    (e) => {
      if (gameState !== "playing") return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          setPacman((prev) => ({ ...prev, nextDirection: DIRECTIONS.UP }));
          break;
        case "ArrowDown":
        case "s":
        case "S":
          setPacman((prev) => ({ ...prev, nextDirection: DIRECTIONS.DOWN }));
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          setPacman((prev) => ({ ...prev, nextDirection: DIRECTIONS.LEFT }));
          break;
        case "ArrowRight":
        case "d":
        case "D":
          setPacman((prev) => ({ ...prev, nextDirection: DIRECTIONS.RIGHT }));
          break;
      }
    },
    [gameState]
  );

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (gameState !== "playing") return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          setPacman((prev) => ({ ...prev, nextDirection: DIRECTIONS.RIGHT }));
        } else {
          setPacman((prev) => ({ ...prev, nextDirection: DIRECTIONS.LEFT }));
        }
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          setPacman((prev) => ({ ...prev, nextDirection: DIRECTIONS.DOWN }));
        } else {
          setPacman((prev) => ({ ...prev, nextDirection: DIRECTIONS.UP }));
        }
      }
    }
  };

  const startGame = () => {
    cleanup();
    setGameState("playing");
    setScore(0);
    setLives(3);
    setLevel(1);
    setMaze(MAZE.map((row) => [...row]));
    setPacman({
      x: 9,
      y: 15,
      direction: DIRECTIONS.RIGHT,
      nextDirection: DIRECTIONS.RIGHT,
      mouthOpen: true,
    });
    setGhosts([
      {
        name: GHOST_NAMES.BLINKY,
        x: 9,
        y: 9,
        direction: DIRECTIONS.UP,
        mode: GHOST_MODES.SCATTER,
        color: GHOST_COLORS[GHOST_NAMES.BLINKY],
        frightened: false,
      },
      {
        name: GHOST_NAMES.PINKY,
        x: 8,
        y: 9,
        direction: DIRECTIONS.UP,
        mode: GHOST_MODES.SCATTER,
        color: GHOST_COLORS[GHOST_NAMES.PINKY],
        frightened: false,
      },
      {
        name: GHOST_NAMES.INKY,
        x: 10,
        y: 9,
        direction: DIRECTIONS.UP,
        mode: GHOST_MODES.SCATTER,
        color: GHOST_COLORS[GHOST_NAMES.INKY],
        frightened: false,
      },
      {
        name: GHOST_NAMES.CLYDE,
        x: 9,
        y: 10,
        direction: DIRECTIONS.UP,
        mode: GHOST_MODES.SCATTER,
        color: GHOST_COLORS[GHOST_NAMES.CLYDE],
        frightened: false,
      },
    ]);
    setPowerPelletActive(false);
    setPowerPelletTimer(0);
    setModeTimer(MODE_TIMING.SCATTER);
    setCurrentMode(GHOST_MODES.SCATTER);
    setGhostEatenCount(0);
    setLastExtraLifeScore(0);
    lastUpdateRef.current = 0;
    playSound("gameStart");
  };

  const pauseGame = () => {
    if (gameState === "playing") {
      cleanup();
    }
    setGameState(gameState === "paused" ? "playing" : "paused");
  };

  // Initialize canvas and game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = MAZE_WIDTH * CELL_SIZE;
    canvas.height = MAZE_HEIGHT * CELL_SIZE;

    return cleanup;
  }, [cleanup]);

  // Handle window blur/focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === "playing") {
        setGameState("paused");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameState]);

  // Power pellet timer
  useEffect(() => {
    if (powerPelletActive && powerPelletTimer > 0) {
      const timer = setTimeout(() => {
        setPowerPelletTimer((prev) => prev - 1);
      }, 100);
      return () => clearTimeout(timer);
    } else if (powerPelletTimer === 0 && powerPelletActive) {
      setPowerPelletActive(false);
      setGhosts((prev) =>
        prev.map((ghost) => ({
          ...ghost,
          mode:
            ghost.mode === GHOST_MODES.EATEN ? GHOST_MODES.EATEN : currentMode,
        }))
      );
    }
  }, [powerPelletActive, powerPelletTimer]);

  // Game loop - moved to the end after all function definitions
  useEffect(() => {
    if (gameState !== "playing") return;

    const gameLoop = (timestamp) => {
      if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;
      const elapsed = timestamp - lastUpdateRef.current;

      if (elapsed > GAME_SPEED) {
        updateGame();
        drawGame();
        lastUpdateRef.current = timestamp;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, updateGame, drawGame]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Add life lost timer effect
  useEffect(() => {
    if (lifeLostTimer > 0) {
      const timer = setInterval(() => {
        setLifeLostTimer((prev) => {
          if (prev <= 1) {
            setShowLifeLost(false);
            return 0;
          }
          return prev - 1;
        });
      }, 16); // Update every 16ms (roughly 60fps)
      return () => clearInterval(timer);
    }
  }, [lifeLostTimer]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-yellow-400 p-4">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">PAC-MAN</h1>
        <div className="flex justify-center gap-8 text-lg">
          <div>Score: {score}</div>
          <div>Lives: {lives}</div>
          <div>Level: {level}</div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border-2 border-blue-500 bg-black"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "none" }}
        />

        {showLifeLost && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-red-500 bg-opacity-80 text-white text-4xl font-bold px-8 py-4 rounded-lg animate-bounce">
              LIFE LOST!
            </div>
          </div>
        )}

        {gameState === "start" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <div className="text-center">
              <h2 className="text-2xl mb-4">Ready to Play?</h2>
              <button
                onClick={startGame}
                className="bg-yellow-400 text-black px-6 py-3 rounded-lg text-xl font-bold hover:bg-yellow-300"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {gameState === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <div className="text-center">
              <h2 className="text-2xl mb-4">PAUSED</h2>
              <button
                onClick={pauseGame}
                className="bg-yellow-400 text-black px-6 py-3 rounded-lg text-xl font-bold hover:bg-yellow-300"
              >
                RESUME
              </button>
            </div>
          </div>
        )}

        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <div className="text-center">
              <h2 className="text-2xl mb-2">GAME OVER</h2>
              <p className="text-lg mb-4">Final Score: {score}</p>
              <button
                onClick={startGame}
                className="bg-yellow-400 text-black px-6 py-3 rounded-lg text-xl font-bold hover:bg-yellow-300"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        {gameState === "playing" && (
          <button
            onClick={pauseGame}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg mr-4 hover:bg-blue-400"
          >
            PAUSE
          </button>
        )}

        <div className="mt-4 text-sm">
          <p className="mb-2">Desktop: Use WASD or Arrow Keys</p>
          <p>Mobile: Swipe to move Pac-Man</p>
        </div>
      </div>

      {powerPelletActive && (
        <div className="mt-2 text-center">
          <div className="text-blue-400 font-bold">
            POWER MODE: {Math.ceil(powerPelletTimer / 10)}s
          </div>
        </div>
      )}
    </div>
  );
};

export default Pacman2;
