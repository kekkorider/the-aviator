import type { ThreeContext } from 'three-start'
import type { Mesh } from 'three/webgpu'

import { BombMaterial } from '../materials/bomb'

export function createBomb(ctx: ThreeContext): Mesh {
  const bomb = ctx.modules.assetLoader.getModel('game')?.scene.getObjectByName('Bomb') as Mesh
  bomb.geometry.scale(0.3, 0.3, 0.3)
  bomb.geometry.rotateZ(-Math.PI / 2)
  bomb.material = BombMaterial

  return bomb
}
