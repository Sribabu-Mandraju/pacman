import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";

const Dot = ({ position, isPowerDot = false }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <Sphere ref={meshRef} position={position} args={[isPowerDot ? 0.15 : 0.08]}>
      <meshLambertMaterial color={isPowerDot ? "#ffff00" : "#ffffff"} />
    </Sphere>
  );
};

export default Dot;
