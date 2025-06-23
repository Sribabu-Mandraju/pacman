import React, { useEffect, useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box } from "@react-three/drei";
import * as THREE from "three";
import PacmanCharacter from "./PacmanCharacter";
import Germ from "./Germ";

const CELL_SIZE = 1;

const levelColors = [
  "#0066ff",
  "#FFA500",
  "#800080",
  "#0066ff",
  "#FFA500",
  "#800080",
  "#0066ff",
  "#FFA500",
  "#800080",
  "#0066ff",
];

const GameScene = ({
  gameState,
  mazeData,
  onDotCollect,
  onGermMove,
  selectedCharacter,
}) => {
  const { camera } = useThree();
  const cameraTargetRef = useRef({ x: 0, y: 0, z: 0 });
  const wallMeshRef = useRef();
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    // Set camera for classic Pac-Man perspective - zoomed in closer
    camera.position.set(0, 12, 6);
    camera.lookAt(0, 0, 0);
    camera.fov = 70;
    camera.updateProjectionMatrix();
  }, [camera]);

  // Smooth camera following
  useFrame(() => {
    if (!gameState || !gameState.pacman || !mazeData) return;

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

  const levelColor =
    levelColors[(gameState?.level - 1) % levelColors.length] || "#0066ff";

  const wallInstances = useMemo(() => {
    if (!mazeData) return [];
    const instances = [];
    for (let y = 0; y < mazeData.dimensions.rows; y++) {
      for (let x = 0; x < mazeData.dimensions.cols; x++) {
        if (mazeData.pattern[y] && mazeData.pattern[y][x] === 1) {
          instances.push({
            position: [
              x - mazeData.dimensions.cols / 2,
              0,
              y - mazeData.dimensions.rows / 2,
            ],
          });
        }
      }
    }
    return instances;
  }, [mazeData]);

  // Update instanced mesh positions
  useEffect(() => {
    if (wallMeshRef.current && wallInstances.length > 0) {
      wallInstances.forEach((instance, i) => {
        tempObject.position.set(...instance.position);
        tempObject.updateMatrix();
        wallMeshRef.current.setMatrixAt(i, tempObject.matrix);
      });
      wallMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [wallInstances, tempObject]);

  if (!mazeData || !gameState) return null;

  const { dimensions } = mazeData;
  const pacmanX = gameState.pacman ? gameState.pacman.x : dimensions.cols / 2;
  const pacmanY = gameState.pacman ? gameState.pacman.y : dimensions.rows / 2;
  const renderRange = 30;

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

      {/* Walls using InstancedMesh */}
      <instancedMesh
        ref={wallMeshRef}
        args={[null, null, wallInstances.length]}
      >
        <boxGeometry args={[1, 0.3, 1]} />
        <meshLambertMaterial color={levelColor} />
      </instancedMesh>

      {/* Dots - render only visible ones */}
      {gameState.dots
        .filter((dot) => {
          const dx = Math.abs(dot.x - pacmanX);
          const dy = Math.abs(dot.y - pacmanY);
          return dx < renderRange && dy < renderRange;
        })
        .map((dot) => (
          <mesh
            key={`dot-${dot.x}-${dot.y}`}
            position={[
              dot.x - dimensions.cols / 2,
              0.2,
              dot.y - dimensions.rows / 2,
            ]}
            onClick={() => onDotCollect && onDotCollect(dot)}
          >
            <sphereGeometry args={[0.1]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}

      {/* Germs - render only visible ones */}
      {gameState.germs
        .filter((germ) => {
          const dx = Math.abs(germ.x - pacmanX);
          const dy = Math.abs(germ.y - pacmanY);
          return dx < renderRange && dy < renderRange;
        })
        .map((germ) => (
          <Germ
            key={`germ-${germ.id}`}
            position={[
              germ.x - dimensions.cols / 2,
              0.3,
              germ.y - dimensions.rows / 2,
            ]}
            pacmanPosition={gameState.pacman}
            aiType={germ.aiType}
            onMove={(direction) => onGermMove && onGermMove(germ.id, direction)}
          />
        ))}

      {/* Pacman */}
      {gameState.pacman && (
        <PacmanCharacter
          position={[
            pacmanX - dimensions.cols / 2,
            0.5,
            pacmanY - dimensions.rows / 2,
          ]}
          direction={gameState.direction}
          selectedCharacter={selectedCharacter}
        />
      )}
    </>
  );
};

export default GameScene;
