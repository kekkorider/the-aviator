import { Mesh, Object3D } from 'three/webgpu'
import { MotionType } from 'crashcat'
import { addComponent } from 'three-start'

import type { ThreeContext } from 'three-start'
import type { RigidBodySettings } from 'crashcat'

import { PlaneMaterial } from '../materials/plane'
import { PropellerMaterial } from '../materials/propeller'

import { PlaneControl } from '../behaviors/PlaneControl'
import { Spin } from '../behaviors/Spin'
import {
  BodySphere,
  type BodyParams as SphereBodyParams
} from '../behaviors/physics/BodySphere'

export class Player extends Object3D {
  private ctx!: ThreeContext

  meshPlane!: Mesh
  meshPropeller!: Mesh
  meshBody!: Object3D

  controlComponent!: PlaneControl
  bodyComponent!: BodySphere

  constructor(ctx: ThreeContext) {
    super()

    this.ctx = ctx
  }

  create() {
    const gameScene = this.ctx.modules.assetLoader.getModel('game')?.scene as Object3D

    const meshPlane = gameScene.getObjectByName('Plane')!.clone() as Mesh
    meshPlane.material = PlaneMaterial
    this.createBody()

    requestAnimationFrame(() => {
      this.controlComponent = addComponent(this, PlaneControl)
    })

    const meshPropeller = meshPlane.getObjectByName('Propeller') as Mesh
    meshPropeller.material = PropellerMaterial
    addComponent(meshPropeller, Spin, { axis: 'x', speed: 20 })

    this.add(meshPlane)

    this.name = 'Plane'

    return this
  }

  private createBody(): void {
    const body = new Object3D()
    body.name = 'PlaneBody'
    this.add(body)

    this.meshBody = body

    this.bodyComponent = addComponent(this.meshBody, BodySphere, {
      motionType: MotionType.KINEMATIC,
    } as RigidBodySettings, {
      radius: 0.25
    } as SphereBodyParams)

    requestAnimationFrame(() => {
      this.bodyComponent!.body!.userData = {
        isPlane: true,
        object: this.meshBody
      } as object
    })
  }
}
