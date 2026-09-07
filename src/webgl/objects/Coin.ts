import {
  ConeGeometry,
  MeshNormalNodeMaterial,
  Mesh,
  Object3D
} from 'three/webgpu'

export class Coin extends Object3D {
  constructor() {
    super()

    this.name = 'Coin'

    this.createMesh()
  }

  private createMesh(): void {
    const geometry = new ConeGeometry(0.2, 0.25, 3, 1)
    const material = new MeshNormalNodeMaterial()
    const mesh = new Mesh(geometry, material)
    mesh.name = 'CoinInner'

    this.add(mesh)
  }
}
