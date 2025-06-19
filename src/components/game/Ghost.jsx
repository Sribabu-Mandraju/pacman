import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Box } from "@react-three/drei";

const Ghost = ({ position, color }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <Sphere args={[0.35]} position={[0, 0.1, 0]}>
        <meshLambertMaterial color={color} />
      </Sphere>
      <Box args={[0.7, 0.3, 0.7]} position={[0, -0.15, 0]}>
        <meshLambertMaterial color={color} />
      </Box>
    </group>
  );
};

export default Ghost;
