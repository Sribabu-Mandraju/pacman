import React, { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const PacmanCharacter = ({
  position,
  direction,
  selectedCharacter = "Weslie",
}) => {
  const meshRef = useRef();
  const modelRef = useRef();
  const [isMoving, setIsMoving] = useState(false);
  const [currentDirection, setCurrentDirection] = useState("down");

  const modelPath = `/${selectedCharacter.toLowerCase()}.glb`;
  const { nodes, materials } = useGLTF(modelPath);

  const getCharacterInfo = (characterName) => {
    const wolves = ["Wolnie", "Wolffy", "Wilie"];
    const isWolf = wolves.includes(characterName);

    if (isWolf) {
      return {
        type: "wolf",
        scale: 0.9,
      };
    } else {
      return {
        type: "sheep",
        scale: 0.9,
      };
    }
  };

  const charInfo = getCharacterInfo(selectedCharacter);

  useFrame((state) => {
    if (meshRef.current && modelRef.current) {
      // Check if character is moving and update direction
      const currentMoving = direction !== null && direction !== undefined;
      setIsMoving(currentMoving);

      if (direction && direction !== currentDirection) {
        setCurrentDirection(direction);
      }

      // Handle 3D model rotation based on direction to show different views
      let targetRotation = 0;
      switch (currentDirection) {
        case "up":
          targetRotation = Math.PI; // Face away (back view)
          break;
        case "down":
          targetRotation = 0; // Face toward camera (front view)
          break;
        case "left":
          targetRotation = -Math.PI / 2; // Face left (side view)
          break;
        case "right":
          targetRotation = Math.PI / 2; // Face right (side view)
          break;
        default:
          targetRotation = 0;
      }

      // FIXED: Smooth rotation with shortest path calculation
      const currentRotation = modelRef.current.rotation.y;
      let rotationDiff = targetRotation - currentRotation;

      // Normalize the rotation difference to take the shortest path
      while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
      while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;

      // Apply the shortest rotation path
      modelRef.current.rotation.y += rotationDiff * 0.15;

      // Gentle walking animation
      if (currentMoving) {
        const walkCycle = state.clock.elapsedTime * 6;

        // Bouncy movement
        meshRef.current.position.y =
          position[1] + Math.abs(Math.sin(walkCycle)) * 0.08;

        // Walking bob animation
        modelRef.current.rotation.x = Math.sin(walkCycle * 1.5) * 0.05;
        modelRef.current.rotation.z = Math.sin(walkCycle * 0.8) * 0.02;

        // Scale bounce for walking
        const walkScale =
          charInfo.scale + Math.abs(Math.sin(walkCycle * 1.2)) * 0.03;
        modelRef.current.scale.set(walkScale, walkScale, walkScale);
      } else {
        // Idle breathing animation
        const idleCycle = state.clock.elapsedTime * 2;
        meshRef.current.position.y = position[1] + Math.sin(idleCycle) * 0.02;

        // Gentle breathing scale
        const breathScale = charInfo.scale + Math.sin(idleCycle * 2) * 0.01;
        modelRef.current.scale.set(breathScale, breathScale, breathScale);

        // Return to neutral pose smoothly
        modelRef.current.rotation.x += -modelRef.current.rotation.x * 0.1;
        modelRef.current.rotation.z += -modelRef.current.rotation.z * 0.1;
      }
    }
  });

  // Function to render the model with original materials and textures
  const renderModel = () => {
    if (!nodes) return null;

    return Object.keys(nodes).map((key) => {
      const node = nodes[key];
      if (node.isMesh) {
        return (
          <mesh
            key={key}
            geometry={node.geometry}
            material={node.material} // Use original material with textures
            position={node.position}
            rotation={node.rotation}
            scale={node.scale}
          />
        );
      }
      return null;
    });
  };

  return (
    <group ref={meshRef} position={position}>
      <group ref={modelRef}>{renderModel()}</group>

      {/* Movement particles effect */}
      {isMoving && (
        <group>
          {[...Array(3)].map((_, i) => (
            <mesh
              key={i}
              position={[
                (Math.random() - 0.5) * 0.6,
                Math.random() * 0.3 + 0.1,
                (Math.random() - 0.5) * 0.6,
              ]}
              rotation={[
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI,
              ]}
            >
              <octahedronGeometry args={[0.02]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

// Preload all character GLB models for better performance
useGLTF.preload("/weslie.glb");
useGLTF.preload("/jonie.glb");
useGLTF.preload("/sparky.glb");
useGLTF.preload("/wolnie.glb");
useGLTF.preload("/wilie.glb");
useGLTF.preload("/paddi.glb");
useGLTF.preload("/tibbie.glb");
useGLTF.preload("/wolffy.glb");

export default PacmanCharacter;
