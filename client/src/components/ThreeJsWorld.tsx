import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Block } from '../context/DataContext';

interface ThreeJSWorldProps {
  blocks: Block[];
}

const ThreeJSWorld: React.FC<ThreeJSWorldProps> = ({ blocks }) => {
  const meshRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.forEach((mesh, index) => {
        if (mesh) {
          const { x, y, z } = blocks[index];
          mesh.position.set(x, y, z);
        }
      });
    }
  }, [blocks]);

  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      {blocks.map((block, index) => (
        <mesh
          key={block.id + "-" + index + "[cords: " + block.x + ", " + block.y + ", " + block.z + "]"}
          ref={(el) => (meshRef.current[index] = el as THREE.Mesh)}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={block.is_solid ? 'grey' : 'blue'} />
        </mesh>
      ))}
    </Canvas>
  );
};

export default ThreeJSWorld;
