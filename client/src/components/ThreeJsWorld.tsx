import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Block, Machine } from '../context/DataContext';
import { OrbitControls } from '@react-three/drei';

// Component to render each block
const BlockMesh: React.FC<{ block: Block }> = ({ block }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      const { x, y, z } = block;
      meshRef.current.position.set(x, y, z);
    }
  }, [block]);

  return (
    <mesh
      ref={meshRef}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={block.is_solid ? 'grey' : 'blue'} />
    </mesh>
  );
};

const MachineMesh: React.FC<{ machine: Machine }> = ({ machine }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      const { x, y, z } = machine;
      meshRef.current.position.set(x, y, z);
    }
  }, [machine]);

  return (
    <mesh
      ref={meshRef}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
};

// Main ThreeJSWorld component
const ThreeJSWorld: React.FC<{ blocks: Block[], machine: Machine }> = ({ blocks, machine }) => {
  const controlsRef = useRef<any>(null);

  // Set the target point for the camera
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(machine.x, machine.y, machine.z);
    }
  }, [blocks, machine]);

  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[machine.x, machine.y, machine.z]} />
      <OrbitControls ref={controlsRef} enableZoom={true} enablePan={false} target={[machine.x, machine.y, machine.z]} />
      {blocks.map((block, index) => (
        <BlockMesh key={block.id + "-" + index} block={block} />
      ))}
      <MachineMesh machine={machine} />
    </Canvas>
  );
};

export default ThreeJSWorld;
