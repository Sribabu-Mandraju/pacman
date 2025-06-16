"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const CELL_SIZE = 20; // Default, will be updated dynamically
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
  const lastUpdateRef = useRef(0);

  const [currentCellSize, setCurrentCellSize] = useState(CELL_SIZE);

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

  const sendTelegramMessage = async (message) => {
    // Get the Telegram WebApp instance
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      console.error("Telegram WebApp is not available");
      return;
    }

    // Get the user's chat ID from the WebApp
    const chatId = webApp.initDataUnsafe?.user?.id;
    if (!chatId) {
      console.error("User chat ID is not available");
      return;
    }

    const botToken = "7109819772:AAH8LhaGdkBdx6RwN_2JtImDngYkp-Jehz8";
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const response = await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML", // Enable HTML formatting
      });
      console.log("Message sent successfully:", response.data);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

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
        const pixelX = x * currentCellSize;
        const pixelY = y * currentCellSize;

        if (cell === 1) {
          // Wall
          ctx.fillStyle = "#0000FF";
          ctx.fillRect(pixelX, pixelY, currentCellSize, currentCellSize);
        } else if (cell === 0) {
          // Dot
          ctx.fillStyle = "#FFFF00";
          ctx.beginPath();
          ctx.arc(
            pixelX + currentCellSize / 2,
            pixelY + currentCellSize / 2,
            currentCellSize / 10, // Adjusted dot size relative to cell size
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (cell === 2) {
          // Power pellet
          ctx.fillStyle = "#FFFF00";
          ctx.beginPath();
          ctx.arc(
            pixelX + currentCellSize / 2,
            pixelY + currentCellSize / 2,
            currentCellSize / 3, // Adjusted power pellet size relative to cell size
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });
    });

    // Draw Pacman
    const pacX = pacman.x * currentCellSize + currentCellSize / 2;
    const pacY = pacman.y * currentCellSize + currentCellSize / 2;

    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();

    const pacmanRadius = currentCellSize / 2 - currentCellSize * 0.1; // Dynamic border for pacman

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

      ctx.arc(pacX, pacY, pacmanRadius, startAngle, endAngle);
      ctx.lineTo(pacX, pacY);
    } else {
      ctx.arc(pacX, pacY, pacmanRadius, 0, Math.PI * 2);
    }

    ctx.fill();

    // Draw ghosts
    ghosts.forEach((ghost) => {
      const ghostX = ghost.x * currentCellSize + currentCellSize / 2;
      const ghostY = ghost.y * currentCellSize + currentCellSize / 2;

      ctx.fillStyle = ghost.frightened ? "#0000FF" : ghost.color;

      const ghostBodyRadius = currentCellSize / 2 - currentCellSize * 0.1; // Dynamic border for ghost body
      const ghostBodyHeight = currentCellSize / 2 + currentCellSize * 0.05; // Slightly taller body

      // Ghost body
      ctx.beginPath();
      ctx.arc(
        ghostX,
        ghostY - currentCellSize * 0.1,
        ghostBodyRadius,
        Math.PI,
        0
      );
      ctx.rect(
        ghostX - ghostBodyRadius,
        ghostY - currentCellSize * 0.1,
        currentCellSize - currentCellSize * 0.2,
        ghostBodyHeight
      );
      ctx.fill();

      // Ghost bottom wavy part
      ctx.beginPath();
      ctx.moveTo(
        ghostX - ghostBodyRadius,
        ghostY + ghostBodyHeight - currentCellSize * 0.1
      );
      for (let i = 0; i < 4; i++) {
        const waveX =
          ghostX -
          ghostBodyRadius +
          (i * (currentCellSize - currentCellSize * 0.2)) / 3;
        const waveY =
          ghostY +
          ghostBodyHeight -
          currentCellSize * 0.1 +
          (i % 2 === 0 ? -(currentCellSize * 0.15) : 0);
        ctx.lineTo(waveX, waveY);
      }
      ctx.lineTo(
        ghostX + ghostBodyRadius,
        ghostY + ghostBodyHeight - currentCellSize * 0.1
      );
      ctx.fill();

      // Ghost eyes
      const eyeWidth = currentCellSize * 0.2;
      const eyeHeight = currentCellSize * 0.3;
      const eyeOffsetX = currentCellSize * 0.15;
      const eyeOffsetY = currentCellSize * 0.2;

      ctx.fillStyle = "#FFF";
      ctx.fillRect(
        ghostX - eyeOffsetX - eyeWidth,
        ghostY - eyeOffsetY,
        eyeWidth,
        eyeHeight
      );
      ctx.fillRect(
        ghostX + eyeOffsetX,
        ghostY - eyeOffsetY,
        eyeWidth,
        eyeHeight
      );

      if (!ghost.frightened) {
        const pupilSize = currentCellSize * 0.1;
        const pupilOffsetX = currentCellSize * 0.05; // Adjusted to be closer to center
        const pupilOffsetY = currentCellSize * 0.1; // Adjusted to be closer to center

        ctx.fillStyle = "#000";
        ctx.fillRect(
          ghostX - eyeOffsetX - pupilSize - pupilOffsetX,
          ghostY - pupilOffsetY,
          pupilSize,
          pupilSize
        );
        ctx.fillRect(
          ghostX + eyeOffsetX + pupilOffsetX,
          ghostY - pupilOffsetY,
          pupilSize,
          pupilSize
        );
      }
    });
  }, [pacman, ghosts, maze, currentCellSize]);

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
            // Move towards corner, but with slight randomness if multiple paths are equally good
            const target = GHOST_CORNERS[ghost.name];
            const distances = possibleDirections.map((dir) => {
              const newX = ghost.x + dir.x;
              const newY = ghost.y + dir.y;
              return Math.sqrt(
                Math.pow(newX - target.x, 2) + Math.pow(newY - target.y, 2)
              );
            });
            const minDistance = Math.min(...distances);
            const bestDirections = possibleDirections.filter(
              (_, index) => distances[index] === minDistance
            );
            newDirection =
              bestDirections[Math.floor(Math.random() * bestDirections.length)];
          } else if (ghost.mode === GHOST_MODES.CHASE) {
            // Use ghost-specific targeting, but with slight randomness if multiple paths are equally good
            const target = getGhostTarget(ghost, pacman);
            const distances = possibleDirections.map((dir) => {
              const newX = ghost.x + dir.x;
              const newY = ghost.y + dir.y;
              return Math.sqrt(
                Math.pow(newX - target.x, 2) + Math.pow(newY - target.y, 2)
              );
            });
            const minDistance = Math.min(...distances);
            const bestDirections = possibleDirections.filter(
              (_, index) => distances[index] === minDistance
            );
            newDirection =
              bestDirections[Math.floor(Math.random() * bestDirections.length)];
          }
        } else {
          // If no valid moves, reverse direction to get unstuck (shouldn't happen often)
          newDirection = { x: -ghost.direction.x, y: -ghost.direction.y };
        }

        let newX = ghost.x + newDirection.x;
        let newY = ghost.y + newDirection.y;

        // Handle tunnel effect
        if (newX < 0) newX = MAZE_WIDTH - 1;
        if (newX >= MAZE_WIDTH) newX = 0;

        // This check is redundant if possibleDirections are already valid moves.
        // Keeping it for safety, but if ghosts get stuck, this might be the culprit.
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
      const newLevel = level + 1;
      setLevel(newLevel);
      setMaze(MAZE.map((row) => [...row]));
      setPacman((prev) => ({ ...prev, x: 9, y: 15 }));
      setGhostEatenCount(0);

      // Send level completion message
      sendTelegramMessage(
        `🎮 <b>Level ${level} Completed!</b>\n\n` +
          `🏆 Score: <b>${score}</b>\n` +
          `❤️ Lives: <b>${lives}</b>\n` +
          `⬆️ Moving to Level <b>${newLevel}</b>`
      );
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
    level,
    score,
    lives,
  ]);

  const handleDirectionButton = useCallback(
    (direction) => {
      if (gameState !== "playing") return;
      setPacman((prev) => ({ ...prev, nextDirection: direction }));
    },
    [gameState]
  );

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

    // Send game start message
    sendTelegramMessage(
      `🎮 <b>New Game Started!</b>\n\n` +
        `👤 Player: <b>${
          window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || "Player"
        }</b>\n` +
        `📊 Level: <b>1</b>\n` +
        `❤️ Lives: <b>3</b>`
    );
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

    const updateCanvasSize = () => {
      const gameAreaDiv = document.querySelector(".game-area");
      if (!gameAreaDiv) return;

      const availableHeight = gameAreaDiv.clientHeight - 4; // Subtract a small buffer for border/padding
      const availableWidth = gameAreaDiv.clientWidth - 4; // Subtract a small buffer for border/padding

      const calculatedCellSizeByHeight = Math.floor(
        availableHeight / MAZE_HEIGHT
      );
      const calculatedCellSizeByWidth = Math.floor(availableWidth / MAZE_WIDTH);

      const newCellSize = Math.max(
        8,
        Math.min(calculatedCellSizeByHeight, calculatedCellSizeByWidth)
      ); // Min 8px to prevent too small cells

      setCurrentCellSize(newCellSize);

      canvas.width = MAZE_WIDTH * newCellSize;
      canvas.height = MAZE_HEIGHT * newCellSize;
    };

    // Initial size update and on window resize
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Observe the specific game area div for resizing
    const gameAreaObserver = new ResizeObserver(() => updateCanvasSize());
    const gameAreaDiv = document.querySelector(".game-area");
    if (gameAreaDiv) {
      gameAreaObserver.observe(gameAreaDiv);
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      gameAreaObserver.disconnect();
      cleanup();
    };
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

  // Add keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== "playing") return;

      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          handleDirectionButton(DIRECTIONS.UP);
          break;
        case "arrowdown":
        case "s":
          handleDirectionButton(DIRECTIONS.DOWN);
          break;
        case "arrowleft":
        case "a":
          handleDirectionButton(DIRECTIONS.LEFT);
          break;
        case "arrowright":
        case "d":
          handleDirectionButton(DIRECTIONS.RIGHT);
          break;
        case " ":
        case "p":
          pauseGame();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, handleDirectionButton]);

  // Add game over message sending
  useEffect(() => {
    if (gameState === "gameOver") {
      sendTelegramMessage(
        `🎮 <b>Game Over!</b>\n\n` +
          `🏆 Final Score: <b>${score}</b>\n` +
          `📊 Level Reached: <b>${level}</b>\n` +
          `❤️ Lives Remaining: <b>${lives}</b>\n` +
          `👤 Player: <b>${
            window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name ||
            "Player"
          }</b>`
      );
    }
  }, [gameState, score, level, lives]);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-black text-yellow-400 p-0.5">
      <div className="text-center w-full header-section py-0.5 px-0.5 flex flex-col items-center">
        <h1 className="text-xs font-bold text-yellow-400 animate-pulse">
          PAC-MAN
        </h1>
        <div className="flex justify-around w-full gap-0.5 text-xxs mt-0.5">
          <div className="bg-blue-900 bg-opacity-50 px-1 py-0.5 rounded-lg border border-blue-500 flex-1 text-center leading-none">
            Score: {score}
          </div>
          <div className="bg-blue-900 bg-opacity-50 px-1 py-0.5 rounded-lg border border-blue-500 flex-1 text-center leading-none">
            Lives: {lives}
          </div>
          <div className="bg-blue-900 bg-opacity-50 px-1 py-0.5 rounded-lg border border-blue-500 flex-1 text-center leading-none">
            Level: {level}
          </div>
        </div>
      </div>

      <div className="relative flex-grow flex items-center justify-center w-full max-w-full overflow-hidden game-area p-0">
        <canvas
          ref={canvasRef}
          className="border-2 border-blue-500 bg-black shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          style={{
            touchAction: "none",
            objectFit: "contain",
            flexShrink: 0, // Prevent canvas from shrinking
          }}
        />

        {showLifeLost && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-red-600 to-red-800 text-white text-xs font-bold px-3 py-1 rounded-xl border-2 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-bounce">
                <div className="flex items-center gap-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-2.5 w-2.5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  LIFE LOST!
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === "start" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
            <div className="text-center">
              <h2 className="text-sm mb-0.5">Ready to Play?</h2>
              <button
                onClick={startGame}
                className="bg-yellow-400 text-black px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-yellow-300"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {gameState === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
            <div className="text-center">
              <h2 className="text-sm mb-0.5">PAUSED</h2>
              <button
                onClick={pauseGame}
                className="bg-yellow-400 text-black px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-yellow-300"
              >
                RESUME
              </button>
            </div>
          </div>
        )}

        {gameState === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
            <div className="text-center">
              <h2 className="text-sm mb-0.5">GAME OVER</h2>
              <p className="text-xs mb-0.5">Final Score: {score}</p>
              <button
                onClick={startGame}
                className="bg-yellow-400 text-black px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-yellow-300"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full flex flex-col items-center controls-section py-0.5 px-0.5">
        {gameState === "playing" && (
          <button
            onClick={pauseGame}
            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:from-blue-500 hover:to-blue-700 transition-all duration-200 shadow-[0_0_10px_rgba(59,130,246,0.5)] mb-0.5"
          >
            PAUSE
          </button>
        )}

        {/* Enhanced Mobile Controls */}
        <div className="mb-0.5">
          <div className="flex flex-col items-center">
            {/* Up Button */}
            <button
              onClick={() => handleDirectionButton(DIRECTIONS.UP)}
              className="bg-gradient-to-b from-blue-600 to-blue-800 text-white w-12 h-12 rounded-t-xl mb-0.5 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)] hover:from-blue-500 hover:to-blue-700 transition-all duration-200 active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>

            {/* Middle Row */}
            <div className="flex">
              {/* Left Button */}
              <button
                onClick={() => handleDirectionButton(DIRECTIONS.LEFT)}
                className="bg-gradient-to-r from-blue-600 to-blue-800 text-white w-12 h-12 rounded-l-xl mr-0.5 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)] hover:from-blue-500 hover:to-blue-700 transition-all duration-200 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Center Empty Space */}
              <div className="w-12 h-12 flex items-center justify-center bg-black bg-opacity-30 rounded-xl shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                {/* This div keeps the space empty */}
              </div>

              {/* Right Button */}
              <button
                onClick={() => handleDirectionButton(DIRECTIONS.RIGHT)}
                className="bg-gradient-to-r from-blue-600 to-blue-800 text-white w-12 h-12 rounded-r-xl ml-0.5 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)] hover:from-blue-500 hover:to-blue-700 transition-all duration-200 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Down Button */}
            <button
              onClick={() => handleDirectionButton(DIRECTIONS.DOWN)}
              className="bg-gradient-to-b from-blue-600 to-blue-800 text-white w-12 h-12 rounded-b-xl mt-0.5 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)] hover:from-blue-500 hover:to-blue-700 transition-all duration-200 active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-0.5 text-xxs text-blue-400">
          Use the directional buttons below
        </div>
      </div>

      {powerPelletActive && (
        <div className="mt-0.5 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white text-xxs font-bold px-1 py-0.5 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse">
            POWER MODE: {Math.ceil(powerPelletTimer / 10)}s
          </div>
        </div>
      )}
    </div>
  );
};

export default Pacman2;
