import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";

const Germ = ({ position, aiType = "patrol", onMove }) => {
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

      if (timeRef.current - lastMoveRef.current > 0.8) {
        // Move every 800ms
        lastMoveRef.current = timeRef.current;

        let newDirection = directionRef.current;

        switch (aiType) {
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

  // Different visual styles based on AI type
  const getGermStyle = () => {
    switch (aiType) {
      case "hunter":
        return { color: "#ff2222", emissive: "#660000", size: 0.4 };
      case "guard":
        return { color: "#2222ff", emissive: "#000066", size: 0.45 };
      default:
        return { color: "#22ff22", emissive: "#006600", size: 0.35 };
    }
  };

  const style = getGermStyle();

  return (
    <Sphere ref={meshRef} position={position} args={[style.size]}>
      <meshLambertMaterial color={style.color} emissive={style.emissive} />
    </Sphere>
  );
};

export default Germ;
