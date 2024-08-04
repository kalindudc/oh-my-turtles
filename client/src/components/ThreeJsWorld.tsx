import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Block } from '../context/DataContext';

interface ThreeJSWorldProps {
  blocks: Block[];
}

const ThreeJSWorld: React.FC<ThreeJSWorldProps> = ({ blocks }) => {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      {blocks.map((block) => (
        <mesh key={block.id} position={[block.x, block.y, block.z]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={block.is_solid ? 'grey' : 'blue'} />
        </mesh>
      ))}
    </Canvas>
  );
};

export default ThreeJSWorld;
