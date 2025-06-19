import React, { useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";

const HackedNumbers = () => {
  const [numbers, setNumbers] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newNumber = {
        id: Math.random(),
        x: (Math.random() - 0.5) * 20,
        y: 10,
        z: (Math.random() - 0.5) * 20,
        text: Math.random().toString(16).substring(2, 8).toUpperCase(),
        color: ["#ff0080", "#00ff80", "#8000ff", "#ff8000"][
          Math.floor(Math.random() * 4)
        ],
      };

      setNumbers((prev) => [...prev.slice(-20), newNumber]);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useFrame(() => {
    setNumbers((prev) =>
      prev
        .map((num) => ({
          ...num,
          y: num.y - 0.05,
        }))
        .filter((num) => num.y > -5)
    );
  });

  return (
    <>
      {numbers.map((num) => (
        <Text
          key={num.id}
          position={[num.x, num.y, num.z]}
          fontSize={0.5}
          color={num.color}
          anchorX="center"
          anchorY="middle"
        >
          {num.text}
        </Text>
      ))}
    </>
  );
};

export default HackedNumbers;
