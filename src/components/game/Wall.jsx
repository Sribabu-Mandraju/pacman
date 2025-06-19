import React from "react";
import { Box } from "@react-three/drei";

const Wall = ({ position }) => {
  return (
    <group position={position}>
      {/* Outer blue box */}
      <Box args={[1, 0.3, 1]}>
        <meshLambertMaterial color="#0066ff" />
      </Box>
      {/* Inner black box (slightly smaller) */}
      <Box args={[0.85, 0.25, 0.85]} position={[0, 0, 0]}>
        <meshLambertMaterial color="#000000" />
      </Box>
    </group>
  );
};

export default Wall;
