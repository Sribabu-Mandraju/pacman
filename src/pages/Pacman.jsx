import React, { useState, useEffect, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useDrag } from "@use-gesture/react";
import "./Pacman.css";
import GameScene from "../components/game/GameScene";
import HackedNumbers from "../components/game/HackedNumbers";
import { generateMaze, LEVEL_CONFIG } from "../utils/mazeGenerator";
import { soundManager } from "../utils/soundManager";

const Pacman = () => {
  const [gameState, setGameState] = useState(null);
  const [mazeData, setMazeData] = useState(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hackedNumbers, setHackedNumbers] = useState([]);
  const lastMoveTimeRef = useRef(0);
  const gameLoopRef = useRef(null);
  const moveSpeed = 200;

  const initializeGame = useCallback((level = 1) => {
    const maze = generateMaze(level);
    const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG[10];

    setMazeData(maze);

    // Create dots for empty spaces
    const dots = [];
    for (let y = 0; y < maze.dimensions.rows; y++) {
      for (let x = 0; x < maze.dimensions.cols; x++) {
        if (maze.pattern[y] && maze.pattern[y][x] === 0) {
          // Center dots properly in walkable cells
          dots.push({ x: x, y: y, isPowerDot: false });
        }
      }
    }

    // Create germs with different AI types
    const germs = [];
    const aiTypes = ["patrol", "hunter", "guard", "fast", "slow", "teleporter"];
    for (let i = 0; i < levelConfig.germCount; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * maze.dimensions.cols);
        y = Math.floor(Math.random() * maze.dimensions.rows);
      } while (
        (maze.pattern[y] && maze.pattern[y][x] === 1) ||
        Math.abs(x - maze.spawnPoint.x) + Math.abs(y - maze.spawnPoint.y) < 10
      );

      germs.push({
        id: i,
        x: x,
        y: y,
        direction: Math.floor(Math.random() * 4),
        aiType: aiTypes[i % aiTypes.length],
        lastMove: 0,
      });
    }

    setGameState({
      pacman: { x: maze.spawnPoint.x, y: maze.spawnPoint.y },
      germs,
      dots,
      score: 0,
      level: level,
      lives: 1,
      germKillCount: 0,
      direction: null,
      nextDirection: null,
    });

    // Play game start sound
    soundManager.playGameStart();
  }, []);

  // Check if a position is walkable
  const isWalkable = useCallback(
    (x, y) => {
      if (!mazeData) return false;
      const gridX = Math.floor(x);
      const gridY = Math.floor(y);
      return (
        gridX >= 0 &&
        gridX < mazeData.dimensions.cols &&
        gridY >= 0 &&
        gridY < mazeData.dimensions.rows &&
        (!mazeData.pattern[gridY] || mazeData.pattern[gridY][gridX] === 0)
      );
    },
    [mazeData]
  );

  // Move pacman
  const movePacman = useCallback(
    (direction) => {
      if (!gameState || !mazeData) return;

      const { pacman } = gameState;
      let newX = pacman.x;
      let newY = pacman.y;

      switch (direction) {
        case "up":
          newY -= 1;
          break;
        case "down":
          newY += 1;
          break;
        case "left":
          newX -= 1;
          break;
        case "right":
          newX += 1;
          break;
      }

      if (isWalkable(newX, newY)) {
        setGameState((prev) => ({
          ...prev,
          pacman: { x: newX, y: newY },
          direction: direction,
          nextDirection: null,
        }));
        soundManager.playMove();
        return true;
      }
      return false;
    },
    [gameState, mazeData, isWalkable]
  );

  // Move germ
  const moveGerm = useCallback(
    (germId, direction) => {
      if (!gameState || !mazeData) return;

      setGameState((prev) => {
        const newGerms = prev.germs.map((germ) => {
          if (germ.id !== germId) return germ;

          // Handle teleportation
          if (direction === 4) {
            let newX, newY;
            do {
              newX = Math.floor(Math.random() * mazeData.dimensions.cols);
              newY = Math.floor(Math.random() * mazeData.dimensions.rows);
            } while (mazeData.pattern[newY]?.[newX] === 1);
            return { ...germ, x: newX, y: newY };
          }

          let newX = germ.x;
          let newY = germ.y;

          switch (direction) {
            case 0: // up
              newY -= 1;
              break;
            case 1: // right
              newX += 1;
              break;
            case 2: // down
              newY += 1;
              break;
            case 3: // left
              newX -= 1;
              break;
          }

          // Check if the new position is walkable
          if (isWalkable(newX, newY)) {
            return { ...germ, x: newX, y: newY, direction };
          }

          // If not walkable, try a random direction
          const randomDir = Math.floor(Math.random() * 4);
          return { ...germ, direction: randomDir };
        });

        return { ...prev, germs: newGerms };
      });
    },
    [gameState, mazeData, isWalkable]
  );

  // Game loop
  const gameLoop = useCallback(() => {
    if (!gameState || isPaused || isGameOver || !isGameStarted) return;

    const now = Date.now();
    if (now - lastMoveTimeRef.current < moveSpeed) return;
    lastMoveTimeRef.current = now;

    // Try to move in next direction first, if it fails try current direction
    let moved = false;
    if (gameState.nextDirection) {
      moved = movePacman(gameState.nextDirection);
      if (moved) {
        // Successfully changed direction
        setGameState((prev) => ({
          ...prev,
          direction: gameState.nextDirection,
          nextDirection: null,
        }));
      }
    }

    // If we couldn't turn or no next direction, continue in current direction
    if (!moved && gameState.direction) {
      movePacman(gameState.direction);
    }

    // Check dot collision
    const pacmanX = Math.floor(gameState.pacman.x);
    const pacmanY = Math.floor(gameState.pacman.y);

    const dotIndex = gameState.dots.findIndex(
      (dot) => Math.floor(dot.x) === pacmanX && Math.floor(dot.y) === pacmanY
    );

    if (dotIndex !== -1) {
      const dot = gameState.dots[dotIndex];
      const remainingDots = gameState.dots.length - 1;

      setGameState((prev) => ({
        ...prev,
        dots: prev.dots.filter((_, index) => index !== dotIndex),
        score: prev.score + 10,
      }));

      soundManager.playDotCollect();

      // Check if level complete
      if (remainingDots <= 0) {
        soundManager.playLevelComplete();
        if (gameState.level < 10) {
          setTimeout(() => {
            initializeGame(gameState.level + 1);
          }, 2000);
        } else {
          // Game completed!
          setIsGameOver(true);
        }
      }
    }

    // Check collisions with enemies
    const checkCollision = (entity) => {
      const dx = Math.abs(gameState.pacman.x - entity.x);
      const dy = Math.abs(gameState.pacman.y - entity.y);
      return dx < 0.6 && dy < 0.6;
    };

    // Check germ and glitch collisions (deadly)
    const hitByGerm = gameState.germs.some(checkCollision);

    if (hitByGerm) {
      soundManager.playPlayerDeath();

      // Add multiple hacked numbers effect
      const newNumbers = [];
      for (let i = 0; i < 10; i++) {
        newNumbers.push({
          id: Date.now() + i,
          x: Math.random() * 375, // Mobile frame width
          y: 667, // Start from bottom of mobile frame
          text: Math.floor(Math.random() * 999999).toString(),
          color: `hsl(${Math.random() * 360}, 100%, 50%)`,
          speed: 1 + Math.random() * 2,
        });
      }
      setHackedNumbers((prev) => [...prev, ...newNumbers]);

      setGameState((prev) => ({
        ...prev,
        lives: prev.lives - 1,
        germKillCount: hitByGerm ? prev.germKillCount + 1 : prev.germKillCount,
      }));

      if (gameState.lives <= 1) {
        setIsGameOver(true);
      } else {
        // Respawn pacman
        setTimeout(() => {
          setGameState((prev) => ({
            ...prev,
            pacman: { x: mazeData.spawnPoint.x, y: mazeData.spawnPoint.y },
          }));
        }, 1000);
      }
    }
  }, [
    gameState,
    isPaused,
    isGameOver,
    isGameStarted,
    movePacman,
    mazeData,
    initializeGame,
  ]);

  // Cleanup hacked numbers
  useEffect(() => {
    const cleanup = setInterval(() => {
      setHackedNumbers(
        (prev) => prev.filter((num) => Date.now() - num.id < 3000) // Remove after 3 seconds
      );
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  // Start game loop
  useEffect(() => {
    if (isGameStarted && !isGameOver && !isPaused) {
      gameLoopRef.current = setInterval(gameLoop, 16); // ~60fps
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameLoop, isGameStarted, isGameOver, isPaused]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Pause/resume works even when paused or game over
      if (e.key === " " || e.key === "Escape") {
        e.preventDefault();
        if (isGameStarted && !isGameOver) {
          setIsPaused(!isPaused);
        }
        return;
      }

      // Movement only works when game is active
      if (!isGameStarted || isGameOver || isPaused) return;

      const directions = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right",
      };

      if (directions[e.key]) {
        e.preventDefault();
        setDirection(directions[e.key]);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isGameStarted, isGameOver, isPaused]);

  // Start game
  const startGame = () => {
    setIsGameStarted(true);
    setIsGameOver(false);
    setIsPaused(false);
    setHackedNumbers([]);
    initializeGame(1);
  };

  const setDirection = (dir) => {
    if (!isGameStarted || isGameOver || isPaused) return;
    setGameState((prev) =>
      prev
        ? {
            ...prev,
            direction: prev.direction || dir,
            nextDirection: dir,
          }
        : prev
    );
  };

  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy] }) => {
      if (down) return; // Only trigger on swipe end

      const isHorizontal = Math.abs(mx) > Math.abs(my);
      const isVertical = !isHorizontal;

      if (isHorizontal) {
        if (dx > 0) setDirection("right");
        else setDirection("left");
      } else if (isVertical) {
        if (dy > 0) setDirection("down");
        else setDirection("up");
      }
    },
    {
      threshold: 20, // Minimum distance for a swipe to register
      axis: "lock", // Lock to the dominant axis
    }
  );

  return (
    <div className="pacman-container" {...bind()}>
      <div className="mobile-frame">
        {/* Header */}
        <div className="game-header">
          <div className="score">{gameState?.score || 0}</div>
          <div className="level">L{gameState?.level || 1}/10</div>
          {isGameStarted && (
            <button
              className="pause-button"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? "▶" : "⏸"}
            </button>
          )}
        </div>

        {/* Game Canvas */}
        <div className="game-viewport">
          <Canvas>
            <GameScene
              gameState={gameState}
              mazeData={mazeData}
              onGermMove={moveGerm}
            />
          </Canvas>

          {/* Hacked Numbers Effect */}
          {hackedNumbers.map((num) => (
            <div
              key={num.id}
              className="hacked-number"
              style={{
                left: num.x,
                top: num.y,
                color: num.color,
              }}
            >
              {num.text}
            </div>
          ))}
        </div>

        {/* Start Game Overlay */}
        {!isGameStarted && !isGameOver && (
          <div className="start-overlay">
            <h1>PACMAN 256</h1>
            <p>10 Levels • Dynamic Mazes • Survive the Germs!</p>
            <button className="start-button" onClick={startGame}>
              START GAME
            </button>
            <div className="controls-hint">
              <p>Use Arrow Keys or WASD to move</p>
              <p>Space/Escape to pause</p>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && isGameStarted && (
          <div className="pause-overlay">
            <h2>PAUSED</h2>
            <p>Press Space or Escape to resume</p>
          </div>
        )}

        {/* Game Over */}
        {isGameOver && (
          <div className="game-over-overlay">
            <h2>GAME OVER</h2>
            <p>Final Score: {gameState?.score || 0}</p>
            <p>Level Reached: {gameState?.level || 1}/10</p>
            <p>Germs Killed: {gameState?.germKillCount || 0}</p>
            <button onClick={startGame}>PLAY AGAIN</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pacman;
