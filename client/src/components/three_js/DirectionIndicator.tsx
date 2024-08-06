import * as THREE from 'three';
import React from 'react';

const DirectionIndicator: React.FC<{ position: THREE.Vector3; direction: THREE.Vector3 }> = ({ position, direction }) => {
  const shaftLength = 1; // Length of the shaft
  const shaftRadius = 0.1; // Radius of the shaft
  const headLength = 0.5; // Length of the arrowhead
  const headRadius = 0.2; // Radius of the arrowhead
  const color = 'white'; // Color of the indicator

  const arrowDirection = direction.clone().normalize();
  const arrowPosition = position.clone().add(arrowDirection.clone().multiplyScalar(shaftLength / 2));

  // Create quaternion based on the direction
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrowDirection);

  return (
    <group position={arrowPosition} quaternion={quaternion}>
      {/* Translucent Arrow */}
      <mesh>
        <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 32]} />
        <meshStandardMaterial color={color} transparent={true} opacity={0.5} />
      </mesh>
      <mesh position={[0, shaftLength / 2 + headLength / 2, 0]}>
        <coneGeometry args={[headRadius, headLength, 32]} />
        <meshStandardMaterial color={color} transparent={true} opacity={0.5} />
      </mesh>
    </group>
  );
};

export default DirectionIndicator;
