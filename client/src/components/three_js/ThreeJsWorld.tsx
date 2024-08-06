import { OrbitControls } from '@react-three/drei';
import { Canvas, extend } from '@react-three/fiber';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three-stdlib';

import { Block, Machine, useData } from '../../context/DataContext';
import { Direction, DirectionToVector } from '../../enums/DirectionEnum';
import DirectionIndicator from './DirectionIndicator';

extend({ UnrealBloomPass });

const glowMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color('white').convertSRGBToLinear(), // Glow color
  opacity: 0.0, // Start with no opacity
  transparent: true,
});

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

const MachineMesh: React.FC<{ machine: Machine, color: string, shouldDrawDirection: boolean, onClick: (machine: Machine) => void }> = ({ machine, color, shouldDrawDirection, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [direction, setDirection] = useState<THREE.Vector3 | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (meshRef.current) {
      const { x, y, z } = machine;
      meshRef.current.position.set(x, y, z);
      const directionVector = machine.facing ? DirectionToVector.getVector(machine.facing as Direction) : null;
      setDirection(directionVector);
    }
  }, [machine]);

  useEffect(() => {
    if (!hovered) {
      glowMaterial.opacity = 0.08;
    } else {
      glowMaterial.opacity = 0;
    }
  }, [hovered]);

  const handleClick = () => {
    if (onClick) {
      onClick(machine);
    }
  };

  const handlePointerOver = () => setHovered(true);
  const handlePointerOut = () => setHovered(false);

  return (
    <>
      {shouldDrawDirection && direction && meshRef.current?.position &&
        <DirectionIndicator position={new THREE.Vector3(machine.x, machine.y, machine.z)} direction={direction || new THREE.Vector3(0,0,0)} />
      }
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Glow effect */}
      {hovered && (
        <mesh
          ref={glowRef}
          position={new THREE.Vector3(machine.x, machine.y, machine.z)}
        >
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshBasicMaterial {...glowMaterial} />
        </mesh>
      )}
    </>
  );
};

// Main ThreeJSWorld component
const ThreeJSWorld: React.FC<{ blocks: Block[], machine: Machine, onSelect: (machine: Machine) => void }> = ({ blocks, machine, onSelect }) => {
  const controlsRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene>(null);
  const { machines } = useData();

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
        {machines.filter(m => m.world_id === machine.world_id).map((m, index) => (
          <MachineMesh key={m.id + "-" + index} machine={m} color='green' shouldDrawDirection={false} onClick={onSelect} />
        ))}
        <MachineMesh machine={machine} color='red' shouldDrawDirection={true} onClick={()=>{}} />
      </scene>
    </Canvas>
  );
};

export default ThreeJSWorld;
