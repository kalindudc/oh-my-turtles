import { OrbitControls } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three-stdlib';

import { Block, Machine, useData } from '../../context/DataContext';
import { Direction, DirectionToVector, FacingDirection } from '../../enums/DirectionEnum';
import DirectionIndicator from './DirectionIndicator';

extend({ UnrealBloomPass });

const glowMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color('white').convertSRGBToLinear(), // Glow color
  opacity: 0.08,
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
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(machine.x, machine.y, machine.z));

  useEffect(() => {
    setTargetPosition(new THREE.Vector3(machine.x, machine.y, machine.z));
    const directionVector = machine.facing ? DirectionToVector.getVector(machine.facing as Direction) : null;
    setDirection(directionVector);
  }, [machine]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.lerp(targetPosition, 0.5);
    }
  });

  // Instantly update the position target and color when the machine prop changes
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.material = new THREE.MeshStandardMaterial({ color });
    }
  }, [color]);

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
          position={new THREE.Vector3(meshRef.current?.position.x, meshRef.current?.position.y, meshRef.current?.position.z)}
        >
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshBasicMaterial {...glowMaterial} />
        </mesh>
      )}
    </>
  );
};


const CameraController: React.FC<{ machine: Machine, isFollowing : boolean }> = ({ machine, isFollowing }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [cameraPosition, setCameraPosition] = useState(new THREE.Vector3(machine.x, machine.y, machine.z));
  const [facing, setFacing] = useState(DirectionToVector.getVector(machine.facing as Direction).multiplyScalar(6));

  useEffect(() => {
    setCameraPosition(new THREE.Vector3(machine.x, machine.y, machine.z));

    const currentDirection = DirectionToVector.getVector(machine.facing as Direction);
    setFacing(currentDirection.multiplyScalar(6));
  }, [machine]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.target.lerp(cameraPosition, 0.1);

      if (isFollowing) {
        const followPositon = new THREE.Vector3(cameraPosition.x, cameraPosition.y + 6, cameraPosition.z).sub(facing);
        controlsRef.current.object.position.lerp(followPositon, 0.1);
      }
      controlsRef.current.update();
    }
  });

  return <OrbitControls ref={controlsRef} enableZoom={true} enablePan={false} />;;
};

// Main ThreeJSWorld component
const ThreeJSWorld: React.FC<{ blocks: Block[], machine: Machine, onSelect: (machine: Machine) => void, isFollowing : boolean }> = ({ blocks, machine, onSelect, isFollowing }) => {
  const { machines } = useData();
  const sceneRef = useRef<THREE.Scene>(null);

  return (
    <Canvas>
      <scene ref={sceneRef}>
        <ambientLight />
        <pointLight position={[machine.x, machine.y, machine.z]} />
        <CameraController machine={machine} isFollowing={isFollowing} />

        {blocks.map((block, index) => (
          <BlockMesh key={block.id + "-" + index} block={block} />
        ))}
        {machines.filter(m => m.world_id === machine.world_id).map((m, index) => (
          <MachineMesh key={m.id + "-" + index} machine={m} color='green' shouldDrawDirection={false} onClick={onSelect} />
        ))}
        <MachineMesh machine={machine} color='red' shouldDrawDirection={true} onClick={() => {}} />
      </scene>
    </Canvas>
  );
};

export default ThreeJSWorld;
