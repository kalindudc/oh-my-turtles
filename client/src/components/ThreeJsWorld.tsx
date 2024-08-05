import React, { useRef, useEffect } from 'react';
import { extend, Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Outline } from '@react-three/postprocessing';
import { UnrealBloomPass } from 'three-stdlib';

import { Block, Machine } from '../context/DataContext';

extend({ UnrealBloomPass });


// Component to render each block
const BlockMesh: React.FC<{ block: Block }> = ({ block }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      const { x, y, z } = block;
      meshRef.current.position.set(x, y, z);
    }
  }, [block]);

  const materialProps =
    block.id === 'minecraft:air'
      ? { color: '#fff', transparent: true, opacity: 0.2 }
      : { color: block.is_solid ? 'grey' : 'blue' };

  return (
    <mesh
      ref={meshRef}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial {...materialProps} />
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
  const sceneRef = useRef<THREE.Scene>(null);

  // Set the target point for the camera
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(machine.x, machine.y, machine.z);
    }
  }, [blocks, machine]);

  return (
    <Canvas
      camera={{
        position: [machine.x, machine.y - 10, machine.z - 10],
        fov: 75,
        near: 0.1,
        far: 1000
      }}
    >
      <scene ref={sceneRef}>
        <ambientLight />
        <pointLight position={[machine.x, machine.y, machine.z]} />
        <OrbitControls ref={controlsRef} enableZoom={true} enablePan={false} target={[machine.x, machine.y, machine.z]} />
        {blocks.map((block, index) => (
          <BlockMesh key={block.id + "-" + index} block={block} />
        ))}
        <MachineMesh machine={machine} />
      </scene>
    </Canvas>
  );
};

export default ThreeJSWorld;
