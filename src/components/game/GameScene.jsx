import React, { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box } from "@react-three/drei";
import Wall from "./Wall";
import Dot from "./Dot";
import PacmanCharacter from "./PacmanCharacter";
import Ghost from "./Ghost";
import Germ from "./Germ";
import Glitch from "./Glitch";

const CELL_SIZE = 1;

const GameScene = ({ gameState, mazeData, onDotCollect, onGermMove }) => {
  const { camera } = useThree();
  const cameraTargetRef = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    // Set camera for classic Pac-Man perspective - more top-down view
    camera.position.set(0, 15, 8);
    camera.lookAt(0, 0, 0);
    camera.fov = 75;
    camera.updateProjectionMatrix();
  }, [camera]);

  // Smooth camera following
  useFrame(() => {
    if (!gameState.pacman || !mazeData) return;

    // Calculate target camera position based on Pacman's position
    const targetX =
      (gameState.pacman.x - mazeData.dimensions.cols / 2) * CELL_SIZE;
    const targetZ =
      (gameState.pacman.y - mazeData.dimensions.rows / 2) * CELL_SIZE;

    // Smooth camera movement
    cameraTargetRef.current.x += (targetX - cameraTargetRef.current.x) * 0.05;
    cameraTargetRef.current.z += (targetZ - cameraTargetRef.current.z) * 0.05;

    camera.position.x = cameraTargetRef.current.x;
    camera.position.z = cameraTargetRef.current.z + 8;
    camera.lookAt(cameraTargetRef.current.x, 0, cameraTargetRef.current.z);
  });

  if (!mazeData) return null;

  const { pattern, dimensions } = mazeData;

  // Create walls - only render visible walls for performance
  const walls = [];
  const pacmanX = gameState.pacman ? gameState.pacman.x : dimensions.cols / 2;
  const pacmanY = gameState.pacman ? gameState.pacman.y : dimensions.rows / 2;

  // Render walls in a reasonable range around pacman
  const renderRange = 25;
  const startX = Math.max(0, Math.floor(pacmanX - renderRange));
  const endX = Math.min(dimensions.cols, Math.floor(pacmanX + renderRange));
  const startY = Math.max(0, Math.floor(pacmanY - renderRange));
  const endY = Math.min(dimensions.rows, Math.floor(pacmanY + renderRange));

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (pattern[y] && pattern[y][x] === 1) {
        walls.push(
          <Wall
            key={`wall-${x}-${y}`}
            position={[x - dimensions.cols / 2, 0, y - dimensions.rows / 2]}
          />
        );
      }
    }
  }

  return (
    <>
      {/* Lighting setup for classic Pac-Man look */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} />
      <pointLight position={[0, 5, 5]} intensity={0.4} color="#0088ff" />

      {/* Ground plane - much larger for big mazes */}
      <Box
        position={[0, -0.5, 0]}
        args={[dimensions.cols + 10, 0.1, dimensions.rows + 10]}
      >
        <meshLambertMaterial color="#000033" />
      </Box>

      {/* Walls */}
      {walls}

      {/* Dots - render only visible ones */}
      {gameState.dots
        .filter((dot) => {
          const dx = Math.abs(dot.x - pacmanX);
          const dy = Math.abs(dot.y - pacmanY);
          return dx < renderRange && dy < renderRange;
        })
        .map((dot, index) => (
          <Dot
            key={`dot-${dot.x}-${dot.y}`}
            position={[
              dot.x - dimensions.cols / 2,
              0.2,
              dot.y - dimensions.rows / 2,
            ]}
            isPowerDot={dot.isPowerDot}
            onClick={() => onDotCollect && onDotCollect(dot)}
          />
        ))}

      {/* Ghosts - render only visible ones */}
      {gameState.ghosts
        .filter((ghost) => {
          const dx = Math.abs(ghost.x - pacmanX);
          const dy = Math.abs(ghost.y - pacmanY);
          return dx < renderRange && dy < renderRange;
        })
        .map((ghost, index) => (
          <Ghost
            key={`ghost-${index}`}
            position={[
              ghost.x - dimensions.cols / 2,
              0.5,
              ghost.y - dimensions.rows / 2,
            ]}
            color={ghost.color}
          />
        ))}

      {/* Germs - render only visible ones */}
      {gameState.germs
        .filter((germ) => {
          const dx = Math.abs(germ.x - pacmanX);
          const dy = Math.abs(germ.y - pacmanY);
          return dx < renderRange && dy < renderRange;
        })
        .map((germ, index) => (
          <Germ
            key={`germ-${germ.id}`}
            position={[
              germ.x - dimensions.cols / 2,
              0.3,
              germ.y - dimensions.rows / 2,
            ]}
            aiType={germ.aiType}
            onMove={(direction) => onGermMove && onGermMove(germ.id, direction)}
          />
        ))}

      {/* Glitches - render only visible ones */}
      {gameState.glitches
        .filter((glitch) => {
          const dx = Math.abs(glitch.x - pacmanX);
          const dy = Math.abs(glitch.y - pacmanY);
          return dx < renderRange && dy < renderRange;
        })
        .map((glitch, index) => (
          <Glitch
            key={`glitch-${index}`}
            position={[
              glitch.x - dimensions.cols / 2,
              0.3,
              glitch.y - dimensions.rows / 2,
            ]}
          />
        ))}

      {/* Pacman  */} 
      <PacmanCharacter
        position={[
          gameState.pacman.x - dimensions.cols / 2,
          0.5,
          gameState.pacman.y - dimensions.rows / 2,
        ]}
        direction={gameState.direction}
      />
    </>
  );
};



export default GameScene;
