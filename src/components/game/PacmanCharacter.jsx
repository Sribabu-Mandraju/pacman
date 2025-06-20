import React, { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const PacmanCharacter = ({
  position,
  direction,
  selectedCharacter = "Weslie",
}) => {
  const meshRef = useRef();
  const bodyRef = useRef();
  const [isMoving, setIsMoving] = useState(false);
  const [currentDirection, setCurrentDirection] = useState("down");
  const texture = useTexture(`/main/${selectedCharacter}.webp`);

  // Configure texture for pixelated appearance
  useMemo(() => {
    if (texture) {
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.wrapS = THREE.ClampToEdgeWrap;
      texture.wrapT = THREE.ClampToEdgeWrap;
      texture.flipY = false;
      texture.format = THREE.RGBAFormat;
    }
  }, [texture]);

  const getCharacterInfo = (characterName) => {
    const wolves = ["Wolnie", "Wolffy", "Wilie"];
    const isWolf = wolves.includes(characterName);

    if (isWolf) {
      return {
        type: "wolf",
        bodyColor: "#E0E0E0", // Light gray - shows well on black
        accentColor: "#B0B0B0", // Medium gray
        bellyColor: "#F5F5F5", // Very light gray
        backColor: "#D0D0D0", // Light gray for back
        earShape: "pointed",
        scale: 1.4,
      };
    } else {
      return {
        type: "sheep",
        bodyColor: "#FFFFFF",
        accentColor: "#F0F0F0",
        bellyColor: "#FFFAF0",
        backColor: "#E0E0E0",
        earShape: "floppy",
        scale: 1.4,
      };
    }
  };

  const charInfo = getCharacterInfo(selectedCharacter);

  useFrame((state) => {
    if (meshRef.current && bodyRef.current) {
      // Check if character is moving and update direction
      const currentMoving = direction !== null && direction !== undefined;
      setIsMoving(currentMoving);

      if (direction && direction !== currentDirection) {
        setCurrentDirection(direction);
      }

      // Gentle walking animation
      if (currentMoving) {
        const walkCycle = state.clock.elapsedTime * 5;

        // Subtle bouncy movement
        meshRef.current.position.y =
          position[1] + Math.abs(Math.sin(walkCycle)) * 0.04;

        // Very subtle body tilt
        bodyRef.current.rotation.z = Math.sin(walkCycle * 0.8) * 0.015;

        // Gentle scale bounce
        const scale =
          charInfo.scale + Math.abs(Math.sin(walkCycle * 1.2)) * 0.02;
        bodyRef.current.scale.set(scale, scale, scale);
      } else {
        // Idle breathing animation
        const idleCycle = state.clock.elapsedTime * 1.5;
        meshRef.current.position.y = position[1] + Math.sin(idleCycle) * 0.01;

        // Gentle breathing scale
        const breathScale = charInfo.scale + Math.sin(idleCycle * 2) * 0.008;
        bodyRef.current.scale.set(breathScale, breathScale, breathScale);

        // Return to neutral pose smoothly
        bodyRef.current.rotation.z += -bodyRef.current.rotation.z * 0.1;
      }
    }
  });

  // Get the appropriate view based on direction
  const getAnimalView = () => {
    switch (currentDirection) {
      case "up":
        return "back"; // Show back when going up
      case "down":
        return "front"; // Show face when going down
      case "left":
        return "left"; // Show left side
      case "right":
        return "right"; // Show right side
      default:
        return "front"; // Default to front view
    }
  };

  const currentView = getAnimalView();

  return (
    <group ref={meshRef} position={[position[0], position[1], position[2]]}>
      {/* Animal body with directional views */}
      <group
        ref={bodyRef}
        scale={[charInfo.scale, charInfo.scale, charInfo.scale]}
      >
        {/* FRONT VIEW - when going down (face visible) */}
        {currentView === "front" && (
          <>
            {/* MINECRAFT-STYLE BODY - cubic */}
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[0.35, 0.3, 0.5]} />
              <meshLambertMaterial color={charInfo.bodyColor} />
            </mesh>

            {/* MINECRAFT-STYLE HEAD - MUCH LARGER cubic */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshLambertMaterial color={charInfo.bodyColor} />
            </mesh>

            {/* Face texture on front of head - MUCH LARGER and CLEARER */}
            <mesh position={[0, 0.35, 0.251]} rotation={[Math.PI, 0, 0]}>
              <planeGeometry args={[0.48, 0.48]} />
              <meshLambertMaterial
                map={texture}
                transparent
                alphaTest={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* MINECRAFT-STYLE LEGS - cubic blocks */}
            <mesh position={[-0.1, -0.08, 0]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>
            <mesh position={[0.1, -0.08, 0]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>

            {/* MINECRAFT-STYLE EARS - cubic blocks, positioned for larger head */}
            {charInfo.earShape === "pointed" ? (
              <>
                <mesh position={[-0.18, 0.58, 0]} rotation={[0, 0, 0.2]}>
                  <boxGeometry args={[0.08, 0.15, 0.06]} />
                  <meshLambertMaterial color={charInfo.accentColor} />
                </mesh>
                <mesh position={[0.18, 0.58, 0]} rotation={[0, 0, -0.2]}>
                  <boxGeometry args={[0.08, 0.15, 0.06]} />
                  <meshLambertMaterial color={charInfo.accentColor} />
                </mesh>
              </>
            ) : (
              <>
                <mesh position={[-0.18, 0.58, 0]}>
                  <boxGeometry args={[0.1, 0.1, 0.08]} />
                  <meshLambertMaterial color={charInfo.accentColor} />
                </mesh>
                <mesh position={[0.18, 0.58, 0]}>
                  <boxGeometry args={[0.1, 0.1, 0.08]} />
                  <meshLambertMaterial color={charInfo.accentColor} />
                </mesh>
              </>
            )}
          </>
        )}

        {/* BACK VIEW - when going up (back and tail visible) */}
        {currentView === "back" && (
          <>
            {/* MINECRAFT-STYLE BODY - cubic */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.4, 0.4, 0.6]} />
              <meshLambertMaterial color={charInfo.backColor} />
            </mesh>

            {/* MINECRAFT-STYLE HEAD - cubic */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshLambertMaterial color={charInfo.backColor} />
            </mesh>

            {/* MINECRAFT-STYLE LEGS - cubic blocks */}
            <mesh position={[-0.1, -0.08, 0]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>
            <mesh position={[0.1, -0.08, 0]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>

            {/* MINECRAFT-STYLE TAIL - prominent in back view */}
            <mesh position={[0, 0.15, -0.35]}>
              {charInfo.type === "sheep" ? (
                <boxGeometry args={[0.08, 0.08, 0.08]} />
              ) : (
                <boxGeometry args={[0.06, 0.2, 0.06]} />
              )}
              <meshLambertMaterial color={charInfo.bodyColor} />
            </mesh>

            {/* MINECRAFT-STYLE EARS - cubic blocks */}
            {charInfo.earShape === "pointed" ? (
              <>
                <mesh position={[-0.1, 0.45, 0]} rotation={[0, 0, 0.2]}>
                  <boxGeometry args={[0.06, 0.12, 0.04]} />
                  <meshLambertMaterial color={charInfo.accentColor} />
                </mesh>
                <mesh position={[0.1, 0.45, 0]} rotation={[0, 0, -0.2]}>
                  <boxGeometry args={[0.06, 0.12, 0.04]} />
                  <meshLambertMaterial color={charInfo.accentColor} />
                </mesh>
              </>
            ) : (
              <>
                <mesh position={[-0.1, 0.45, 0]}>
                  <boxGeometry args={[0.08, 0.08, 0.06]} />
                  <meshLambertMaterial color={charInfo.accentColor} />
                </mesh>
                <mesh position={[0.1, 0.45, 0]}>
                  <boxGeometry args={[0.08, 0.08, 0.06]} />
                  <meshLambertMaterial color={charInfo.accentColor} />
                </mesh>
              </>
            )}
          </>
        )}

        {/* LEFT SIDE VIEW - when going left */}
        {currentView === "left" && (
          <>
            {/* MINECRAFT-STYLE BODY - rectangular/cubic */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.6, 0.4, 0.3]} />
              <meshLambertMaterial color={charInfo.bodyColor} />
            </mesh>

            {/* MINECRAFT-STYLE HEAD - cubic */}
            <mesh position={[-0.25, 0.25, 0]}>
              <boxGeometry args={[0.25, 0.25, 0.25]} />
              <meshLambertMaterial color={charInfo.bodyColor} />
            </mesh>

            {/* Character face texture on side of head */}
            <mesh
              position={[-0.376, 0.25, 0]}
              rotation={[0, Math.PI / 2, Math.PI]}
            >
              <planeGeometry args={[0.24, 0.24]} />
              <meshLambertMaterial
                map={texture}
                transparent
                alphaTest={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* MINECRAFT-STYLE LEGS - rectangular blocks */}
            <mesh position={[-0.1, -0.08, 0]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>
            <mesh position={[0.1, -0.08, 0]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>
            <mesh position={[-0.15, -0.08, -0.1]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>
            <mesh position={[0.15, -0.08, -0.1]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>

            {/* MINECRAFT-STYLE EARS - small cubes */}
            {charInfo.earShape === "pointed" ? (
              <mesh position={[-0.25, 0.35, 0]} rotation={[0, 0, 0.3]}>
                <boxGeometry args={[0.06, 0.12, 0.04]} />
                <meshLambertMaterial color={charInfo.accentColor} />
              </mesh>
            ) : (
              <mesh position={[-0.25, 0.35, 0]}>
                <boxGeometry args={[0.08, 0.08, 0.06]} />
                <meshLambertMaterial color={charInfo.accentColor} />
              </mesh>
            )}

            {/* MINECRAFT-STYLE TAIL - small cube */}
            <mesh position={[0.32, 0.12, 0]}>
              {charInfo.type === "sheep" ? (
                <boxGeometry args={[0.06, 0.06, 0.06]} />
              ) : (
                <boxGeometry args={[0.04, 0.15, 0.04]} />
              )}
              <meshLambertMaterial color={charInfo.bodyColor} />
            </mesh>
          </>
        )}

        {/* RIGHT SIDE VIEW - when going right */}
        {currentView === "right" && (
          <>
            {/* MINECRAFT-STYLE BODY - rectangular/cubic */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.6, 0.4, 0.3]} />
              <meshLambertMaterial color={charInfo.bodyColor} />
            </mesh>

            {/* MINECRAFT-STYLE HEAD - cubic */}
            <mesh position={[0.25, 0.25, 0]}>
              <boxGeometry args={[0.25, 0.25, 0.25]} />
              <meshLambertMaterial color={charInfo.bodyColor} />
            </mesh>

            {/* Character face texture on side of head */}
            <mesh
              position={[0.376, 0.25, 0]}
              rotation={[0, -Math.PI / 2, Math.PI]}
            >
              <planeGeometry args={[0.24, 0.24]} />
              <meshLambertMaterial
                map={texture}
                transparent
                alphaTest={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* MINECRAFT-STYLE LEGS - rectangular blocks */}
            <mesh position={[0.1, -0.08, 0]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>
            <mesh position={[-0.1, -0.08, 0]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>
            <mesh position={[0.15, -0.08, -0.1]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>
            <mesh position={[-0.15, -0.08, -0.1]}>
              <boxGeometry args={[0.08, 0.16, 0.08]} />
              <meshLambertMaterial color={charInfo.accentColor} />
            </mesh>

            {/* MINECRAFT-STYLE EARS - small cubes */}
            {charInfo.earShape === "pointed" ? (
              <mesh position={[0.25, 0.35, 0]} rotation={[0, 0, -0.3]}>
                <boxGeometry args={[0.06, 0.12, 0.04]} />
                <meshLambertMaterial color={charInfo.accentColor} />
              </mesh>
            ) : (
              <mesh position={[0.25, 0.35, 0]}>
                <boxGeometry args={[0.08, 0.08, 0.06]} />
                <meshLambertMaterial color={charInfo.accentColor} />
              </mesh>
            )}

            {/* MINECRAFT-STYLE TAIL - small cube */}
            <mesh position={[-0.32, 0.12, 0]}>
              {charInfo.type === "sheep" ? (
                <boxGeometry args={[0.06, 0.06, 0.06]} />
              ) : (
                <boxGeometry args={[0.04, 0.15, 0.04]} />
              )}
              <meshLambertMaterial color={charInfo.bodyColor} />
            </mesh>
          </>
        )}

        {/* Sheep wool texture (only for sheep and only in front/back view) */}
        {charInfo.type === "sheep" &&
          (currentView === "front" || currentView === "back") && (
            <>
              <mesh position={[-0.12, 0.18, 0]} scale={[0.7, 0.7, 0.7]}>
                <sphereGeometry args={[0.06, 6, 6]} />
                <meshLambertMaterial color={charInfo.bodyColor} />
              </mesh>
              <mesh position={[0.12, 0.18, 0]} scale={[0.7, 0.7, 0.7]}>
                <sphereGeometry args={[0.06, 6, 6]} />
                <meshLambertMaterial color={charInfo.bodyColor} />
              </mesh>
            </>
          )}
      </group>

      {/* Shadow */}
      <mesh
        position={[0, -0.25, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[2, 1.2, 1]}
      >
        <circleGeometry args={[0.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* Movement sparkles */}
      {isMoving && (
        <group>
          {[...Array(2)].map((_, i) => (
            <mesh
              key={i}
              position={[
                (Math.random() - 0.5) * 0.4,
                Math.random() * 0.2 + 0.1,
                (Math.random() - 0.5) * 0.4,
              ]}
              rotation={[
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI,
              ]}
            >
              <octahedronGeometry args={[0.015]} />
              <meshBasicMaterial
                color={["#ffff00", "#ffffff"][i]}
                transparent
                opacity={0.5}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export default PacmanCharacter;
