import { InstancedMesh, BoxGeometry } from 'three/webgpu'
import { ThreeContextEvents } from 'three-start'

import {
  SmokeMaterial,
  emitterPosition,
  computeInit,
  computeUpdate
} from '../materials/smoke'

import type { ThreeContext } from 'three-start'

const COUNT = 50

export class Smoke extends InstancedMesh {
  private ctx!: ThreeContext

  constructor(ctx: ThreeContext) {
    super(new BoxGeometry(0.2, 0.2, 0.2), SmokeMaterial, COUNT)

    this.frustumCulled = false
    this.name = 'Smoke'

    this.ctx = ctx

    this.init()
  }

  private async init(): Promise<void> {
    await this.ctx.renderer.computeAsync(computeInit)

    this.createEvents()
  }

  private createEvents(): void {
    this.ctx.on(ThreeContextEvents.Update, () => {
      this.getWorldPosition(emitterPosition.value)
      this.ctx.renderer.compute(computeUpdate)
    })
  }
}
