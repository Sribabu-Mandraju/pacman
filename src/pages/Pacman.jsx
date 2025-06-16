import React, { useEffect, useRef, useState } from "react";
import "./Pacman.css";

const CELL_SIZE = 20;
const PACMAN_SIZE = CELL_SIZE * 0.8;
const GHOST_SIZE = CELL_SIZE * 0.8;
const DOT_SIZE = CELL_SIZE * 0.2;
const POWER_DOT_SIZE = CELL_SIZE * 0.4;

const GHOST_TYPES = {
  BLINKY: { color: "#FF0000", behavior: "chase" },
  PINKY: { color: "#FFB8FF", behavior: "ambush" },
  INKY: { color: "#00FFFF", behavior: "unpredictable" },
  CLYDE: { color: "#FFB852", behavior: "switch" },
};

const Pacman = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [direction, setDirection] = useState("right");
  const [pacmanPosition, setPacmanPosition] = useState({ x: 1, y: 1 });
  const [pacmanMouthOpen, setPacmanMouthOpen] = useState(true);
  const [ghosts, setGhosts] = useState([
    {
      x: 10,
      y: 10,
      direction: "up",
      type: "BLINKY",
      color: GHOST_TYPES.BLINKY.color,
      behavior: GHOST_TYPES.BLINKY.behavior,
    },
    {
      x: 15,
      y: 15,
      direction: "down",
      type: "PINKY",
      color: GHOST_TYPES.PINKY.color,
      behavior: GHOST_TYPES.PINKY.behavior,
    },
    {
      x: 20,
      y: 20,
      direction: "left",
      type: "INKY",
      color: GHOST_TYPES.INKY.color,
      behavior: GHOST_TYPES.INKY.behavior,
    },
    {
      x: 25,
      y: 25,
      direction: "right",
      type: "CLYDE",
      color: GHOST_TYPES.CLYDE.color,
      behavior: GHOST_TYPES.CLYDE.behavior,
    },
  ]);
  const [dots, setDots] = useState([]);
  const [walls, setWalls] = useState([]);
  const [powerMode, setPowerMode] = useState(false);
  const [powerModeTimer, setPowerModeTimer] = useState(null);
  const [ghostPoints, setGhostPoints] = useState(200);
  const [fruit, setFruit] = useState(null);
  const [fruitTimer, setFruitTimer] = useState(null);

  // Initialize game board
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const updateCanvasSize = () => {
      const isMobile = window.innerWidth <= 768;
      const size = isMobile ? Math.min(window.innerWidth - 40, 360) : 400;
      canvas.width = size;
      canvas.height = size;
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Generate classic Pacman maze
    const generateMaze = () => {
      const newWalls = [];
      const rows = Math.floor(canvas.height / CELL_SIZE);
      const cols = Math.floor(canvas.width / CELL_SIZE);

      // Create border walls
      for (let x = 0; x < cols; x++) {
        newWalls.push({ x, y: 0 });
        newWalls.push({ x, y: rows - 1 });
      }
      for (let y = 0; y < rows; y++) {
        newWalls.push({ x: 0, y });
        newWalls.push({ x: cols - 1, y });
      }

      // Create classic Pacman maze pattern (fixed for unreachable dots)
      const mazePattern = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
        [0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
        [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ];

      for (let y = 0; y < mazePattern.length; y++) {
        for (let x = 0; x < mazePattern[y].length; x++) {
          if (mazePattern[y][x] === 1) {
            newWalls.push({ x, y });
          }
        }
      }
      setWalls(newWalls);
    };

    // Generate dots
    const generateDots = () => {
      const newDots = [];
      const rows = Math.floor(canvas.height / CELL_SIZE);
      const cols = Math.floor(canvas.width / CELL_SIZE);

      for (let x = 1; x < cols - 1; x++) {
        for (let y = 1; y < rows - 1; y++) {
          if (!walls.some((wall) => wall.x === x && wall.y === y)) {
            // Add power pellets at specific locations
            const isPowerDot =
              (x === 1 && y === 1) ||
              (x === cols - 2 && y === 1) ||
              (x === 1 && y === rows - 2) ||
              (x === cols - 2 && y === rows - 2);
            newDots.push({ x, y, isPowerDot });
          }
        }
      }
      setDots(newDots);
    };

    generateMaze();
    generateDots();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowUp":
          setDirection("up");
          break;
        case "ArrowDown":
          setDirection("down");
          break;
        case "ArrowLeft":
          setDirection("left");
          break;
        case "ArrowRight":
          setDirection("right");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Spawn fruit
  useEffect(() => {
    if (dots.length > 0 && dots.length % 70 === 0 && !fruit) {
      const canvas = canvasRef.current;
      const rows = Math.floor(canvas.height / CELL_SIZE);
      const cols = Math.floor(canvas.width / CELL_SIZE);

      let fruitX, fruitY;
      do {
        fruitX = Math.floor(Math.random() * (cols - 2)) + 1;
        fruitY = Math.floor(Math.random() * (rows - 2)) + 1;
      } while (
        walls.some((wall) => wall.x === fruitX && wall.y === fruitY) ||
        dots.some((dot) => dot.x === fruitX && dot.y === fruitY)
      );

      setFruit({ x: fruitX, y: fruitY, type: Math.floor(Math.random() * 7) });

      const timer = setTimeout(() => setFruit(null), 10000);
      setFruitTimer(timer);
    }

    return () => {
      if (fruitTimer) clearTimeout(fruitTimer);
    };
  }, [dots, fruit, walls]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background grid
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw walls with gradient
      const wallGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      wallGradient.addColorStop(0, "#0000FF");
      wallGradient.addColorStop(1, "#000088");
      ctx.fillStyle = wallGradient;
      walls.forEach((wall) => {
        ctx.fillRect(
          wall.x * CELL_SIZE,
          wall.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
        // Add wall highlight
        ctx.strokeStyle = "#4444FF";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          wall.x * CELL_SIZE,
          wall.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      });

      // Draw dots with glow effect
      dots.forEach((dot) => {
        if (dot.isPowerDot) {
          const gradient = ctx.createRadialGradient(
            dot.x * CELL_SIZE + CELL_SIZE / 2,
            dot.y * CELL_SIZE + CELL_SIZE / 2,
            0,
            dot.x * CELL_SIZE + CELL_SIZE / 2,
            dot.y * CELL_SIZE + CELL_SIZE / 2,
            POWER_DOT_SIZE
          );
          gradient.addColorStop(0, "#FFFF00");
          gradient.addColorStop(1, "rgba(255, 255, 0, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(
            dot.x * CELL_SIZE + CELL_SIZE / 2,
            dot.y * CELL_SIZE + CELL_SIZE / 2,
            POWER_DOT_SIZE,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else {
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(
            dot.x * CELL_SIZE + CELL_SIZE / 2,
            dot.y * CELL_SIZE + CELL_SIZE / 2,
            DOT_SIZE,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });

      // Draw fruit
      if (fruit) {
        const fruitColors = [
          "#FF0000",
          "#FFA500",
          "#FFFF00",
          "#00FF00",
          "#0000FF",
          "#4B0082",
          "#EE82EE",
        ];
        ctx.fillStyle = fruitColors[fruit.type];
        ctx.beginPath();
        ctx.arc(
          fruit.x * CELL_SIZE + CELL_SIZE / 2,
          fruit.y * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE * 0.4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Draw Pacman with animation
      ctx.fillStyle = "#FFFF00";
      const mouthAngle = pacmanMouthOpen ? 0.2 : 0.05;
      const startAngle = {
        up: Math.PI * 1.5 - mouthAngle,
        down: Math.PI * 0.5 - mouthAngle,
        left: Math.PI - mouthAngle,
        right: -mouthAngle,
      }[direction];
      const endAngle = {
        up: Math.PI * 1.5 + mouthAngle,
        down: Math.PI * 0.5 + mouthAngle,
        left: Math.PI + mouthAngle,
        right: mouthAngle,
      }[direction];

      ctx.beginPath();
      ctx.arc(
        pacmanPosition.x * CELL_SIZE + CELL_SIZE / 2,
        pacmanPosition.y * CELL_SIZE + CELL_SIZE / 2,
        PACMAN_SIZE / 2,
        startAngle,
        endAngle
      );
      ctx.lineTo(
        pacmanPosition.x * CELL_SIZE + CELL_SIZE / 2,
        pacmanPosition.y * CELL_SIZE + CELL_SIZE / 2
      );
      ctx.fill();

      // Draw ghosts with animation
      ghosts.forEach((ghost) => {
        const ghostX = ghost.x * CELL_SIZE + CELL_SIZE / 2;
        const ghostY = ghost.y * CELL_SIZE + CELL_SIZE / 2;

        // Ghost body
        ctx.fillStyle = powerMode ? "#0000FF" : ghost.color;
        ctx.beginPath();
        ctx.arc(ghostX, ghostY - 2, GHOST_SIZE / 2, Math.PI, 0, false);
        ctx.lineTo(ghostX + GHOST_SIZE / 2, ghostY + GHOST_SIZE / 2);
        ctx.lineTo(ghostX - GHOST_SIZE / 2, ghostY + GHOST_SIZE / 2);
        ctx.fill();

        // Ghost eyes
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(ghostX - 5, ghostY - 2, 3, 0, Math.PI * 2);
        ctx.arc(ghostX + 5, ghostY - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Ghost pupils
        ctx.fillStyle = "#0000FF";
        const pupilOffset = {
          up: { x: 0, y: -1 },
          down: { x: 0, y: 1 },
          left: { x: -1, y: 0 },
          right: { x: 1, y: 0 },
        }[ghost.direction];
        ctx.beginPath();
        ctx.arc(
          ghostX - 5 + pupilOffset.x * 2,
          ghostY - 2 + pupilOffset.y * 2,
          1.5,
          0,
          Math.PI * 2
        );
        ctx.arc(
          ghostX + 5 + pupilOffset.x * 2,
          ghostY - 2 + pupilOffset.y * 2,
          1.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // Move Pacman
      let newX = pacmanPosition.x;
      let newY = pacmanPosition.y;

      switch (direction) {
        case "up":
          newY = Math.max(0, pacmanPosition.y - 1);
          break;
        case "down":
          newY = Math.min(canvas.height / CELL_SIZE - 1, pacmanPosition.y + 1);
          break;
        case "left":
          newX = Math.max(0, pacmanPosition.x - 1);
          break;
        case "right":
          newX = Math.min(canvas.width / CELL_SIZE - 1, pacmanPosition.x + 1);
          break;
      }

      // Check wall collision
      if (!walls.some((wall) => wall.x === newX && wall.y === newY)) {
        setPacmanPosition({ x: newX, y: newY });
      }

      // Animate Pacman's mouth
      setPacmanMouthOpen(!pacmanMouthOpen);

      // Check dot collection
      const dotIndex = dots.findIndex(
        (dot) => dot.x === newX && dot.y === newY
      );
      if (dotIndex !== -1) {
        const collectedDot = dots[dotIndex];
        setDots(dots.filter((_, index) => index !== dotIndex));
        setScore(score + (collectedDot.isPowerDot ? 50 : 10));

        if (collectedDot.isPowerDot) {
          setPowerMode(true);
          if (powerModeTimer) clearTimeout(powerModeTimer);
          const timer = setTimeout(() => setPowerMode(false), 10000);
          setPowerModeTimer(timer);
          setGhostPoints(200);
        }
      }

      // Check fruit collection
      if (fruit && fruit.x === newX && fruit.y === newY) {
        const fruitPoints = [100, 300, 500, 700, 1000, 2000, 5000][fruit.type];
        setScore(score + fruitPoints);
        setFruit(null);
        if (fruitTimer) clearTimeout(fruitTimer);
      }

      // Move ghosts with improved AI
      setGhosts(
        ghosts.map((ghost) => {
          let newDirection = ghost.direction;
          let newGhostX = ghost.x;
          let newGhostY = ghost.y;

          // Ghost AI based on type
          if (!powerMode) {
            switch (ghost.behavior) {
              case "chase":
                // Blinky: Direct chase
                const dx = pacmanPosition.x - ghost.x;
                const dy = pacmanPosition.y - ghost.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                  newDirection = dx > 0 ? "right" : "left";
                } else {
                  newDirection = dy > 0 ? "down" : "up";
                }
                break;
              case "ambush":
                // Pinky: Ambush by moving ahead
                const targetX =
                  pacmanPosition.x +
                  (direction === "right" ? 4 : direction === "left" ? -4 : 0);
                const targetY =
                  pacmanPosition.y +
                  (direction === "down" ? 4 : direction === "up" ? -4 : 0);
                if (Math.abs(targetX - ghost.x) > Math.abs(targetY - ghost.y)) {
                  newDirection = targetX > ghost.x ? "right" : "left";
                } else {
                  newDirection = targetY > ghost.y ? "down" : "up";
                }
                break;
              case "unpredictable":
                // Inky: Unpredictable movement
                if (Math.random() < 0.3) {
                  const directions = ["up", "down", "left", "right"];
                  newDirection = directions[Math.floor(Math.random() * 4)];
                } else {
                  const dx = pacmanPosition.x - ghost.x;
                  const dy = pacmanPosition.y - ghost.y;
                  if (Math.abs(dx) > Math.abs(dy)) {
                    newDirection = dx > 0 ? "right" : "left";
                  } else {
                    newDirection = dy > 0 ? "down" : "up";
                  }
                }
                break;
              case "switch":
                // Clyde: Switch between chase and flee
                const distance = Math.sqrt(
                  Math.pow(pacmanPosition.x - ghost.x, 2) +
                    Math.pow(pacmanPosition.y - ghost.y, 2)
                );
                if (distance < 8) {
                  // Flee
                  const dx = ghost.x - pacmanPosition.x;
                  const dy = ghost.y - pacmanPosition.y;
                  if (Math.abs(dx) > Math.abs(dy)) {
                    newDirection = dx > 0 ? "right" : "left";
                  } else {
                    newDirection = dy > 0 ? "down" : "up";
                  }
                } else {
                  // Chase
                  const dx = pacmanPosition.x - ghost.x;
                  const dy = pacmanPosition.y - ghost.y;
                  if (Math.abs(dx) > Math.abs(dy)) {
                    newDirection = dx > 0 ? "right" : "left";
                  } else {
                    newDirection = dy > 0 ? "down" : "up";
                  }
                }
                break;
            }
          } else {
            // Random movement when in power mode
            const directions = ["up", "down", "left", "right"];
            newDirection = directions[Math.floor(Math.random() * 4)];
          }

          switch (newDirection) {
            case "up":
              newGhostY = Math.max(0, ghost.y - 1);
              break;
            case "down":
              newGhostY = Math.min(canvas.height / CELL_SIZE - 1, ghost.y + 1);
              break;
            case "left":
              newGhostX = Math.max(0, ghost.x - 1);
              break;
            case "right":
              newGhostX = Math.min(canvas.width / CELL_SIZE - 1, ghost.x + 1);
              break;
          }

          if (
            !walls.some((wall) => wall.x === newGhostX && wall.y === newGhostY)
          ) {
            return {
              ...ghost,
              x: newGhostX,
              y: newGhostY,
              direction: newDirection,
            };
          }
          return ghost;
        })
      );

      // Check ghost collision
      if (ghosts.some((ghost) => ghost.x === newX && ghost.y === newY)) {
        if (powerMode) {
          // Remove ghost when in power mode
          setGhosts(
            ghosts.filter((ghost) => !(ghost.x === newX && ghost.y === newY))
          );
          setScore(score + ghostPoints);
          setGhostPoints((prev) => Math.min(prev * 2, 1600));
        } else {
          setLives(lives - 1);
          if (lives <= 1) {
            setGameOver(true);
          } else {
            // Reset positions
            setPacmanPosition({ x: 1, y: 1 });
            setGhosts([
              {
                x: 10,
                y: 10,
                direction: "up",
                type: "BLINKY",
                color: GHOST_TYPES.BLINKY.color,
                behavior: GHOST_TYPES.BLINKY.behavior,
              },
              {
                x: 15,
                y: 15,
                direction: "down",
                type: "PINKY",
                color: GHOST_TYPES.PINKY.color,
                behavior: GHOST_TYPES.PINKY.behavior,
              },
              {
                x: 20,
                y: 20,
                direction: "left",
                type: "INKY",
                color: GHOST_TYPES.INKY.color,
                behavior: GHOST_TYPES.INKY.behavior,
              },
              {
                x: 25,
                y: 25,
                direction: "right",
                type: "CLYDE",
                color: GHOST_TYPES.CLYDE.color,
                behavior: GHOST_TYPES.CLYDE.behavior,
              },
            ]);
          }
        }
      }

      // Check win condition
      if (dots.length === 0) {
        setLevel(level + 1);
        // Reset dots and increase difficulty
        const canvas = canvasRef.current;
        const rows = Math.floor(canvas.height / CELL_SIZE);
        const cols = Math.floor(canvas.width / CELL_SIZE);
        const newDots = [];
        for (let x = 1; x < cols - 1; x++) {
          for (let y = 1; y < rows - 1; y++) {
            if (!walls.some((wall) => wall.x === x && wall.y === y)) {
              const isPowerDot =
                (x === 1 && y === 1) ||
                (x === cols - 2 && y === 1) ||
                (x === 1 && y === rows - 2) ||
                (x === cols - 2 && y === rows - 2);
              newDots.push({ x, y, isPowerDot });
            }
          }
        }
        setDots(newDots);
        setPacmanPosition({ x: 1, y: 1 });
        setGhosts([
          {
            x: 10,
            y: 10,
            direction: "up",
            type: "BLINKY",
            color: GHOST_TYPES.BLINKY.color,
            behavior: GHOST_TYPES.BLINKY.behavior,
          },
          {
            x: 15,
            y: 15,
            direction: "down",
            type: "PINKY",
            color: GHOST_TYPES.PINKY.color,
            behavior: GHOST_TYPES.PINKY.behavior,
          },
          {
            x: 20,
            y: 20,
            direction: "left",
            type: "INKY",
            color: GHOST_TYPES.INKY.color,
            behavior: GHOST_TYPES.INKY.behavior,
          },
          {
            x: 25,
            y: 25,
            direction: "right",
            type: "CLYDE",
            color: GHOST_TYPES.CLYDE.color,
            behavior: GHOST_TYPES.CLYDE.behavior,
          },
        ]);
      }
    }, 150);

    return () => {
      clearInterval(gameLoop);
      if (powerModeTimer) clearTimeout(powerModeTimer);
    };
  }, [
    direction,
    pacmanPosition,
    ghosts,
    dots,
    walls,
    score,
    gameOver,
    powerMode,
    lives,
    level,
    ghostPoints,
  ]);

  // Touch controls with improved responsiveness
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    if (Math.abs(x - centerX) > Math.abs(y - centerY)) {
      setDirection(x > centerX ? "right" : "left");
    } else {
      setDirection(y > centerY ? "down" : "up");
    }
  };

  return (
    <div className="pacman-container">
      <div className="game-header">
        <div className="score">Score: {score}</div>
        <div className="level">Level: {level}</div>
        <div className="lives">
          {Array.from({ length: lives }).map((_, i) => (
            <span key={i} className="life">
              ❤️
            </span>
          ))}
        </div>
        {powerMode && <div className="power-mode">POWER MODE!</div>}
      </div>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchStart}
      />
      {gameOver && (
        <div className="game-over">
          <h2>{dots.length === 0 ? "You Win!" : "Game Over!"}</h2>
          <p>Final Score: {score}</p>
          <p>Level Reached: {level}</p>
          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      )}
      <div className="controls-info">
        <p>Use arrow keys or touch to move</p>
        <p>Collect power dots to eat ghosts!</p>
      </div>
    </div>
  );
};

export default Pacman;
