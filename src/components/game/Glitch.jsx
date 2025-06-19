import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box } from "@react-three/drei";

const Glitch = ({ position }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        1 + Math.sin(state.clock.elapsedTime * 10) * 0.2
      );
    }
  });

  return (
    <Box ref={meshRef} position={position} args={[0.3, 0.3, 0.3]}>
      <meshLambertMaterial color="#ff00ff" emissive="#220022" />
    </Box>
  );
};

export default Glitch;
