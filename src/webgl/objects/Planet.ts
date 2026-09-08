import * as THREE from 'three/webgpu'
import { addComponent } from 'three-start'

import type { Mesh } from 'three/webgpu'
import type { ThreeContext } from 'three-start'

import { PlanetMaterial } from '../materials/planet'
import { Spin } from '../behaviors/Spin'

export class Planet {
  private ctx!: ThreeContext

  mesh!: Mesh
  rotationComponent!: Spin

  constructor(ctx: ThreeContext) {
    this.ctx = ctx

    this.createMesh()
  }

  createMesh(): void {
    const geometry = new THREE.IcosahedronGeometry(10, 14)
    this.mesh = new THREE.Mesh(geometry, PlanetMaterial)

    this.mesh.name = 'Planet'

    this.rotationComponent = addComponent(this.mesh, Spin, { axis: 'z', speed: 0.2 })

    this.ctx.scene.add(this.mesh)
  }
}
