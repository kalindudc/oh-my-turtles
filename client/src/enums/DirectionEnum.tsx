import * as THREE from 'three';

export enum FacingDirection {
  north = 'north',
  south = 'south',
  east = 'east',
  west = 'west',
}

export enum Direction {
  north = 'north',
  south = 'south',
  east = 'east',
  west = 'west',
  up = 'up',
  down = 'down',
}

export class DirectionToVector {
  static readonly north = new THREE.Vector3(0, 0, -1);
  static readonly south = new THREE.Vector3(0, 0, 1);
  static readonly east = new THREE.Vector3(1, 0, 0);
  static readonly west = new THREE.Vector3(-1, 0, 0);
  static readonly up = new THREE.Vector3(0, 1, 0);
  static readonly down = new THREE.Vector3(0, -1, 0);

  static getVector(direction: Direction) {
    return this[direction];
  }

  private constructor(private readonly key: string, public readonly value: any) {
  }

  toString() {
    return this.key;
  }
}
