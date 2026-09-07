import type { ThreeContext } from 'three-start'
import type { Mesh } from 'three/webgpu'

import { BombMaterial } from '../materials/bomb'

export class Bomb {
  private ctx!: ThreeContext

  mesh!: Mesh

  constructor(ctx: ThreeContext) {
    this.ctx = ctx
  }

  createMesh(): Mesh {
    const mesh = this.ctx.modules.assetLoader.getModel('game')!.scene.getObjectByName('Bomb') as Mesh
    mesh.geometry.scale(0.3, 0.3, 0.3)
    mesh.geometry.rotateZ(-Math.PI / 2)
    mesh.material = BombMaterial

    this.mesh = mesh

    return mesh
  }
}
