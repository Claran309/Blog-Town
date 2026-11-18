import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import type { Scene } from '@babylonjs/core/scene.js';
import type { TownFeature } from '../../data/town-layout';
import { BrickKit, COLORS as C, COURSE as H, STUD as S } from './kit';
import { GROUND_Y } from './buildings';

/** Procedural civic landmarks. These are deliberately separate from article buildings. */
export function buildFeature(scene: Scene, feature: TownFeature, mobile = false) {
  const root = new TransformNode(`feature:${feature.id}`, scene);
  root.position.set(feature.x, GROUND_Y, feature.z);
  const kit = new BrickKit(scene, root, 'plastic', !mobile);
  const id = feature.id;
  const nx = Math.max(5, Math.round(feature.width / S));
  const nz = Math.max(4, Math.round(feature.depth / S));
  const w = nx * S;
  const d = nz * S;

  kit.brick(0, 0, 0, nx, nz, C.roadLight, H / 3, false, id);
  const lowerCourses = 12;
  for (let course = 0; course < lowerCourses; course++) {
    kit.brick(0, H / 3 + course * H, 0, nx, nz, course < 4 ? C.tan : C.sand, H, course === lowerCourses - 1, id);
    kit.box(0, H / 3 + course * H + H * 0.78, d / 2 - 0.03, w * 0.92, H * 0.12, 0.05, C.cream, 0, id);
  }

  const waist = H / 3 + lowerCourses * H;
  const upperCourses = 8;
  for (let course = 0; course < upperCourses; course++) {
    kit.brick(0, waist + course * H, 0, nx - 2, nz - 2, course % 2 ? C.cream : C.tan, H, course === upperCourses - 1, id);
  }
  kit.box(0, waist + 2.1 * H, 0, w * 0.72, H * 0.14, d * 0.72, C.ivory, 0, id);

  const roofBase = waist + upperCourses * H;
  kit.brick(0, roofBase, 0, nx - 2, nz - 2, C.red, H * 1.05, true, id);
  kit.brick(0, roofBase + H * 1.05, 0, nx - 4, nz - 4, C.coral, H * 1.05, true, id);
  kit.brick(0, roofBase + H * 2.1, 0, nx - 4, nz - 4, C.red, H * 1.05, true, id);
  kit.brick(0, roofBase + H * 3.15, 0, 1, 1, C.yellow, H * 1.15, false, id);

  const doorY = H / 3 + H * 1.7;
  kit.box(0, doorY, d / 2 - 0.06, S * 1.5, H * 3.4, 0.07, C.brown, 0, id);
  kit.box(0, doorY + H * 0.6, d / 2 - 0.105, S * 0.86, H * 1.4, 0.03, C.yellow, 0, id);
  for (const side of [-1, 1]) {
    kit.box(side * w * 0.31, H / 3 + H * 3.8, d / 2 - 0.065, S * 0.7, H * 1.7, 0.05, '#5e97a4', 0, id, true);
    kit.box(side * w * 0.31, H / 3 + H * 3.8, d / 2 - 0.12, 0.028, H * 1.7, 0.03, C.ivory, 0, id);
  }

  const hubY = roofBase - H * 0.1;
  const hubZ = d / 2 + 0.10;
  kit.box(0, hubY, hubZ, 0.34, 0.34, 0.18, C.brown, 0, id);
  for (const blade of [-1, 1]) {
    kit.box(0, hubY + blade * H * 4.2, hubZ, S * 0.38, H * 7.8, 0.08, C.ivory, 0, id);
    kit.box(blade * H * 4.2, hubY, hubZ, H * 7.8, S * 0.38, 0.08, C.ivory, 0, id);
  }
  kit.box(0, hubY + H * 3.5, hubZ + 0.05, S * 0.55, H * 3.4, 0.04, C.coral, 0, id);
  kit.box(H * 3.5, hubY, hubZ + 0.05, H * 3.4, S * 0.55, 0.04, C.coral, 0, id);

  const signX = -w * 0.40;
  const signZ = d / 2 + 0.18;
  for (const post of [-1, 1]) kit.box(signX + post * 0.28, 0.75, signZ, 0.085, 1.25, 0.085, C.brown, 0, id);
  kit.box(signX, 1.34, signZ, 0.92, 0.50, 0.08, C.cream, 0, id);
  kit.box(signX, 1.34, signZ - 0.05, 0.68, 0.10, 0.03, C.red, 0, id);
  kit.box(signX, 1.50, signZ - 0.05, 0.42, 0.08, 0.03, C.yellow, 0, id);

  const meshes = kit.flush(`feature:${feature.id}`);
  for (const mesh of meshes) {
    mesh.metadata = { ...mesh.metadata, featureId: feature.id };
  }
  return { root, meshes, feature, anchorY: roofBase + H * 1.5 };
}
