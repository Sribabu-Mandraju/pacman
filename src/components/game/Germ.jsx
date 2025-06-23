import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";

const Germ = ({ position, aiType = "patrol", onMove, pacmanPosition }) => {
  const meshRef = useRef();
  const timeRef = useRef(0);
  const directionRef = useRef(Math.floor(Math.random() * 4)); // 0=up, 1=right, 2=down, 3=left
  const lastMoveRef = useRef(0);

  useFrame((state) => {
    if (meshRef.current) {
      // Visual animation
      meshRef.current.rotation.x = state.clock.elapsedTime * 2;
      meshRef.current.rotation.z = state.clock.elapsedTime * 1.5;

      // AI Movement
      timeRef.current = state.clock.elapsedTime;

      const moveInterval =
        aiType === "fast" ? 0.15 : aiType === "slow" ? 0.3 : 0.19;

      if (timeRef.current - lastMoveRef.current > moveInterval) {
        // Move every 190ms, 150ms, or 300ms depending on aiType
        lastMoveRef.current = timeRef.current;
        let newDirection = directionRef.current;

        if (aiType === "teleporter" && Math.random() < 0.05) {
          // 5% chance to teleport
          if (onMove) onMove(4); // Special direction for teleport
          return;
        }

        switch (aiType) {
          case "smartHunter": {
            const detectionRadius = 10;
            const germPos = { x: position[0], y: position[2] };
            const pacmanPos = { x: pacmanPosition.x, y: pacmanPosition.y };
            const dx = pacmanPos.x - germPos.x;
            const dy = pacmanPos.y - germPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < detectionRadius) {
              // Pacman is close, hunt him!
              if (Math.abs(dx) > Math.abs(dy)) {
                // Move horizontally
                newDirection = dx > 0 ? 1 : 3; // 1=right, 3=left
              } else {
                // Move vertically
                newDirection = dy > 0 ? 2 : 0; // 2=down, 0=up
              }
            } else {
              // Pacman is far, patrol randomly
              if (Math.random() < 0.3) {
                newDirection = Math.floor(Math.random() * 4);
              }
            }
            break;
          }
          case "patrol":
            // Simple patrol: occasionally change direction
            if (Math.random() < 0.3) {
              newDirection = Math.floor(Math.random() * 4);
            }
            break;

          case "hunter":
            // More aggressive movement pattern
            if (Math.random() < 0.6) {
              newDirection = Math.floor(Math.random() * 4);
            }
            break;

          case "guard":
            // Slower, more defensive movement
            if (Math.random() < 0.2) {
              newDirection = Math.floor(Math.random() * 4);
            }
            break;

          case "fast":
          case "slow":
          case "teleporter":
            // Random movement
            if (Math.random() < 0.4) {
              newDirection = Math.floor(Math.random() * 4);
            }
            break;

          default:
            // Random movement
            if (Math.random() < 0.4) {
              newDirection = Math.floor(Math.random() * 4);
            }
        }

        directionRef.current = newDirection;

        if (onMove) {
          onMove(newDirection);
        }
      }
    }
  });

  const getGermStyle = () => {
    switch (aiType) {
      case "hunter":
        return { color: "#ff2222", emissive: "#660000" }; // Red
      case "guard":
        return { color: "#2222ff", emissive: "#000066" }; // Blue
      case "fast":
        return { color: "#ffff00", emissive: "#666600" }; // Yellow
      case "slow":
        return { color: "#ff00ff", emissive: "#660066" }; // Magenta
      case "teleporter":
        return { color: "#00ffff", emissive: "#006666" }; // Cyan
      case "smartHunter":
        return { color: "#ff9900", emissive: "#993300" }; // Orange
      default:
        return { color: "#22ff22", emissive: "#006600" }; // Green (patrol)
    }
  };

  const style = getGermStyle();

  return (
    <Sphere ref={meshRef} position={position} args={[0.4]}>
      <meshLambertMaterial color={style.color} emissive={style.emissive} />
    </Sphere>
  );
};

export default Germ;
