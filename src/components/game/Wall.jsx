import React from "react";
import { Box } from "@react-three/drei";

const Wall = ({ position }) => {
  return (
    <Box position={position} args={[1, 0.3, 1]}>
      <meshLambertMaterial color="#0066ff" />
    </Box>
  );
};

export default Wall;
