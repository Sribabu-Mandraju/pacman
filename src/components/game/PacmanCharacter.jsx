import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Box } from "@react-three/drei";

const PacmanCharacter = ({ position, direction }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      const rotations = {
        right: 0,
        left: Math.PI,
        up: Math.PI / 2,
        down: -Math.PI / 2,
      };
      meshRef.current.rotation.y = rotations[direction] || 0;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <Sphere args={[0.4]}>
        <meshLambertMaterial color="#ffff00" />
      </Sphere>
      <Box position={[0.3, 0, 0]} args={[0.2, 0.4, 0.4]}>
        <meshLambertMaterial color="#000000" />
      </Box>
    </group>
  );
};

export default PacmanCharacter;
