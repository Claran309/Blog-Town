import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import type { Scene } from '@babylonjs/core/scene.js';
import type { TownFeature } from '../../data/town-layout';
import { BrickKit, COLORS as C, COURSE as H, STUD as S } from './kit';
import { FLOOR_HEIGHT, GROUND_Y } from './buildings';

/**
 * The About landmark: a slender civic windmill tower. The silhouette follows a
 * lighthouse-like stepped profile (broad plinth, segmented shaft, pinched
 * waist, flared lantern room) while the four oversized sails stay mounted on
 * the front of the lantern so the windmill reads instantly from the diorama
 * camera.
 */
const SHAFT_WIDTHS = [5, 4, 4, 3, 3, 2, 3] as const;
const RING_FLOORS = new Set([1, 3, 5]);
const LANTERN_WIDTH = 4;

export function buildFeature(scene: Scene, feature: TownFeature, mobile = false) {
  const root = new TransformNode(`feature:${feature.id}`, scene);
  root.position.set(feature.x, GROUND_Y, feature.z);
  const kit = new BrickKit(scene, root, 'plastic', !mobile);
  const id = feature.id;
  const nx = Math.max(6, Math.round(feature.width / S));
  const nz = Math.max(6, Math.round(feature.depth / S));
  const w = nx * S;
  const d = nz * S;
  const baseY = H / 3;
  const coursesPerFloor = Math.round(FLOOR_HEIGHT / H);

  // Two-step plinth keeps the landmark grounded without widening the shaft.
  kit.brick(0, 0, 0, nx, nz, C.roadLight, H / 3, false, id);
  kit.brick(0, baseY, 0, 6, 6, C.sand, H * 0.85, true, id);
  kit.brick(0, baseY + H * 0.85, 0, 5, 5, C.cream, H * 0.85, true, id);
  let y = baseY + H * 1.7;

  for (let floor = 0; floor < SHAFT_WIDTHS.length; floor++) {
    const size = SHAFT_WIDTHS[floor];
    const floorBase = y;

    for (let course = 0; course < coursesPerFloor; course++) {
      const color = floor === 5 ? C.ivory
        : course === 0 && floor === 0 ? C.sand : C.cream;
      kit.brick(0, y, 0, size, size, color, H, course === coursesPerFloor - 1, id);
      y += H;
    }

    // Coral belt courses give the shaft the segmented lighthouse rhythm from
    // the reference while keeping the footprint compact.
    if (RING_FLOORS.has(floor)) {
      kit.brick(0, floorBase + H * 0.1, 0, size + 1, size + 1, C.coral, H * 0.42, true, id);
    }

    if (floor > 0 && size >= 2) {
      addShaftWindow(kit, id, size, floorBase);
    }
  }

  // Two-course-tall lantern room so the glass stays readable behind the sails.
  const lanternBaseY = y;
  const lanternCourses = coursesPerFloor * 2;
  for (let course = 0; course < lanternCourses; course++) {
    kit.brick(0, y, 0, LANTERN_WIDTH, LANTERN_WIDTH, C.cream, H, course === lanternCourses - 1, id);
    y += H;
  }
  addLanternWindows(kit, id, LANTERN_WIDTH, lanternBaseY, lanternCourses);

  // Balcony ring and railing under the lantern.
  kit.brick(0, lanternBaseY - H * 0.1, 0, LANTERN_WIDTH + 1, LANTERN_WIDTH + 1, C.coral, H * 0.45, true, id);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      kit.box(sx * S * 2.05, lanternBaseY + H * 1.15, sz * S * 2.05, 0.075, H * 1.4, 0.075, C.navy, 0, id);
    }
  }
  for (const side of [-1, 1]) {
    kit.box(0, lanternBaseY + H * 1.82, side * S * 2.05, S * 4.1, 0.055, 0.06, C.navy, 0, id);
    kit.box(side * S * 2.05, lanternBaseY + H * 1.82, 0, 0.06, 0.055, S * 4.1, C.navy, 0, id);
  }

  // Stepped cap and beacon.
  kit.brick(0, y, 0, 5, 5, C.coral, H * 0.55, true, id);
  y += H * 0.55;
  kit.brick(0, y, 0, 4, 4, C.red, H * 0.75, true, id);
  y += H * 0.75;
  kit.brick(0, y, 0, 3, 3, C.red, H * 0.7, true, id);
  y += H * 0.7;
  kit.brick(0, y, 0, 1, 1, C.navy, H * 0.8, false, id);
  y += H * 0.8;
  kit.box(0, y + H * 0.42, 0, 0.2, H * 0.85, 0.2, C.yellow, 0, id, true);
  y += H * 1.1;

  // Arched entrance at the base.
  const doorZ = 5 * S / 2 + 0.02;
  const doorY = H * 1.75;
  kit.box(0, doorY, doorZ, S * 1.3, H * 3.4, 0.06, C.brown, 0, id);
  kit.box(0, doorY + H * 0.55, doorZ + 0.04, S * 0.8, H * 1.5, 0.035, '#5e97a4', 0, id, true);
  kit.box(0, doorY + H * 1.52, doorZ + 0.08, S * 0.48, H * 0.24, 0.04, C.yellow, 0, id);
  for (let step = 0; step < 3; step++) {
    kit.box(0, H * 0.11 + step * H * 0.2, doorZ + 0.3 - step * 0.12, S * 1.7 + step * 0.22, H * 0.22, 0.22, C.sand, 0, id);
  }

  addRotor(kit, id, lanternBaseY, coursesPerFloor);

  const signX = -w * 0.4;
  const signZ = d / 2 + 0.2;
  for (const post of [-1, 1]) kit.box(signX + post * 0.26, 0.73, signZ, 0.08, 1.3, 0.08, C.brown, 0, id);
  kit.box(signX, 1.35, signZ, 0.94, 0.56, 0.07, C.cream, 0, id);
  kit.box(signX, 1.35, signZ - 0.05, 0.68, 0.1, 0.025, C.red, 0, id);
  kit.box(signX, 1.51, signZ - 0.05, 0.42, 0.08, 0.025, C.yellow, 0, id);

  const meshes = kit.flush(`feature:${feature.id}`);
  for (const mesh of meshes) {
    mesh.metadata = { ...mesh.metadata, featureId: feature.id };
  }
  return { root, meshes, feature, anchorY: lanternBaseY + H * 2.5 };
}

function addShaftWindow(kit: BrickKit, id: string, size: number, floorBase: number) {
  const face = size * S / 2;
  const paneY = floorBase + H * 3.6;
  const paneWidth = size >= 4 ? S * 0.74 : S * 0.62;
  const paneHeight = H * 2.5;
  const offset = size >= 4 ? S * 0.5 : 0;

  for (const side of [-1, 1]) {
    kit.box(offset, paneY, side * (face + 0.012), paneWidth, paneHeight, 0.04, '#5e97a4', 0, id, true);
    kit.box(offset, paneY - paneHeight * 0.62, side * (face + 0.04), paneWidth + 0.1, 0.07, 0.08, C.ivory, 0, id);
    kit.box(offset, paneY, side * (face + 0.045), 0.025, paneHeight, 0.06, C.ivory, 0, id);
    kit.box(side * (face + 0.012), paneY, offset, 0.04, paneHeight, paneWidth, '#5e97a4', 0, id, true);
    kit.box(side * (face + 0.04), paneY - paneHeight * 0.62, offset, 0.08, 0.07, paneWidth + 0.1, C.ivory, 0, id);
    kit.box(side * (face + 0.045), paneY, offset, 0.06, paneHeight, 0.025, C.ivory, 0, id);
  }
}

function addLanternWindows(kit: BrickKit, id: string, size: number, floorBase: number, courses: number) {
  const face = size * S / 2;
  const paneHeight = H * (courses - 1.6);
  const paneY = floorBase + H * (courses / 2 + 0.1);
  const paneWidth = S * 1.02;

  for (const side of [-1, 1]) {
    for (const offset of [-S * 0.52, S * 0.52]) {
      kit.box(offset, paneY, side * (face + 0.012), paneWidth, paneHeight, 0.04, C.yellow, 0, id, true);
      kit.box(side * (face + 0.012), paneY, offset, 0.04, paneHeight, paneWidth, C.yellow, 0, id, true);
    }
    for (const level of [-0.5, 0, 0.5]) {
      kit.box(0, paneY + paneHeight * level, side * (face + 0.04), S * 2.3, 0.055, 0.06, C.navy, 0, id);
      kit.box(side * (face + 0.04), paneY + paneHeight * level, 0, 0.06, 0.055, S * 2.3, C.navy, 0, id);
    }
    for (const offset of [-S * 1.02, -S * 0.34, S * 0.34, S * 1.02]) {
      kit.box(offset, paneY, side * (face + 0.045), 0.055, paneHeight, 0.06, C.navy, 0, id);
      kit.box(side * (face + 0.045), paneY, offset, 0.06, paneHeight, 0.055, C.navy, 0, id);
    }
    kit.box(0, paneY - paneHeight * 0.52, side * (face + 0.06), S * 2.5, 0.08, 0.1, C.coral, 0, id);
    kit.box(side * (face + 0.06), paneY - paneHeight * 0.52, 0, 0.1, 0.08, S * 2.5, C.coral, 0, id);
  }
}

function addRotor(kit: BrickKit, id: string, lanternBaseY: number, coursesPerFloor: number) {
  // The sail plane stays parallel to the tower's front facade: the rotor axis
  // points straight out of the masonry, the way a real windmill is mounted.
  const rotorYaw = 0;
  const rotorSin = Math.sin(rotorYaw);
  const rotorCos = Math.cos(rotorYaw);
  const rotorNormalX = Math.sin(rotorYaw);
  const rotorNormalZ = Math.cos(rotorYaw);
  const hubY = lanternBaseY + H * (coursesPerFloor * 1.1);
  const hubOut = LANTERN_WIDTH * S / 2 + 0.35;
  const hub = { x: rotorNormalX * hubOut, y: hubY, z: rotorNormalZ * hubOut };
  const rotorX = (u: number, front = 0) => hub.x + u * rotorCos + rotorNormalX * front;
  const rotorZ = (u: number, front = 0) => hub.z - u * rotorSin + rotorNormalZ * front;

  // Short axle ties the hub back into the lantern face.
  kit.box(hub.x * 0.55, hub.y, hub.z * 0.55, 0.22, 0.22, hubOut * 0.95, C.brown, rotorYaw, id);
  kit.box(hub.x, hub.y, hub.z, 0.44, 0.44, 0.26, C.brown, rotorYaw, id);
  kit.box(hub.x + 0.07, hub.y, hub.z + 0.15, 0.22, 0.22, 0.12, C.yellow, rotorYaw, id);

  const bladeLength = 3.55;
  const bladeCenter = 1.95;
  const panelLength = 3.0;
  const panelCenter = 2.0;
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    const roll = Math.PI / 4 + quadrant * Math.PI / 2;
    const sa = Math.sin(roll);
    const ca = Math.cos(roll);

    const frameU = ca * bladeCenter;
    const frameV = sa * bladeCenter;
    kit.rolledBox(rotorX(frameU, 0.04), hub.y + frameV, rotorZ(frameU, 0.04), bladeLength, 1.0, 0.1, roll, C.coral, rotorYaw, id);

    const panelU = ca * panelCenter;
    const panelV = sa * panelCenter;
    kit.rolledBox(rotorX(panelU, 0.085), hub.y + panelV, rotorZ(panelU, 0.085), panelLength, 0.72, 0.045, roll, C.ivory, rotorYaw, id);

    // Red perimeter rails frame each sail so it reads as cloth in a red border.
    for (const lateral of [-0.44, 0.44]) {
      const railU = ca * panelCenter - sa * lateral;
      const railV = sa * panelCenter + ca * lateral;
      kit.rolledBox(rotorX(railU, 0.13), hub.y + railV, rotorZ(railU, 0.13), panelLength + 0.06, 0.075, 0.035, roll, C.red, rotorYaw, id);
    }

    for (const distance of [0.95, 1.95, 2.95]) {
      const barU = ca * distance;
      const barV = sa * distance;
      kit.rolledBox(rotorX(barU, 0.12), hub.y + barV, rotorZ(barU, 0.12), 0.075, 0.86, 0.035, roll, C.coral, rotorYaw, id);
    }

    const tipU = ca * 3.62;
    const tipV = sa * 3.62;
    kit.rolledBox(rotorX(tipU, 0.07), hub.y + tipV, rotorZ(tipU, 0.07), 0.2, 1.0, 0.08, roll, C.red, rotorYaw, id);
  }
}
