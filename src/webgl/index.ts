import * as THREE from "three/webgpu"
import {
  mrt,
  output,
  velocity,
  packNormalToRGB,
  normalView,
  Fn,
} from 'three/tsl'
import {
  ThreeContextEvents,
  ThreeStart,
  addComponent
} from "three-start"
import { MotionType } from 'crashcat'

import { PlanetMaterial } from './materials/planet'
import { PlaneMaterial } from './materials/plane'
import { PropellerMaterial } from './materials/propeller'

import { AssetLoaderModule } from './modules/AssetLoader'
import { OrbitControlsModule } from './modules/OrbitControls'
import { PhysicsModule } from './modules/Physics'
import { InspectorModule } from './modules/Inspector'
import { InputModule } from './modules/Input'

import { Spin } from './behaviors/Spin'
import { PlaneControl } from './behaviors/PlaneControl'

import { BodySphere, type BodyParams as SphereBodyParams } from './behaviors/physics/BodySphere'

import type { RigidBodySettings } from 'crashcat'

//
// Setup
//
const starter = new ThreeStart()

starter.addModules({
  assetLoader: new AssetLoaderModule(),
  orbitControls: new OrbitControlsModule(),
  physics: new PhysicsModule(true),
  inspector: new InspectorModule(),
  input: new InputModule(),
})

const { scene, renderer, camera, modules, scenePass, renderPipeline } = starter.ctx

let plane: THREE.Mesh | undefined = undefined

renderer.setClearColor(0xe4e0ba)

starter.ctx.once(ThreeContextEvents.Mount, () => {
  createPostProcessing()
})

starter.start()

starter.mount(document.getElementById('app')! as HTMLDivElement)

await modules.assetLoader.loadModels('game.glb')

//
// Camera
//
camera.position.z = 5

//
// Planet
//
const planetGeometry = new THREE.IcosahedronGeometry(5, 10)
const planet = new THREE.Mesh(planetGeometry, PlanetMaterial)
planet.position.set(0, -6, 0)
addComponent(planet, Spin, { axis: 'z', speed: 0.2 })
scene.add(planet)

//
// Plane
//
plane = modules.assetLoader.getModel('game')?.scene.getObjectByName('Plane') as THREE.Mesh
plane.material = PlaneMaterial

const planeBody = new THREE.Object3D()
planeBody.name = 'PlaneBody'
plane.add(planeBody)

addComponent(planeBody, BodySphere, {
  motionType: MotionType.STATIC,
} as RigidBodySettings, {
  radius: 0.5
} as SphereBodyParams)

addComponent(plane, PlaneControl)

const propeller = plane.getObjectByName('Propeller') as THREE.Mesh
propeller.material = PropellerMaterial
addComponent(propeller, Spin, { axis: 'x', speed: 20 })

scene.add(plane)

//
// Post-processing and Inspector
//
function createPostProcessing(): void {
  scenePass.setMRT(
    mrt({
      output,
      velocity,
      normal: packNormalToRGB(normalView)
    })
  )

  const scenePassColor = scenePass.getTextureNode('output').toInspector('Output')
  // const scenePassDepth = scenePass.getTextureNode('depth').toInspector('Depth', () => scenePass.getLinearDepthNode())
  // const scenePassNormal = scenePass.getTextureNode('normal').toInspector('Normal')
  // const scenePassVelocity = scenePass.getTextureNode('velocity').toInspector('Velocity')

  const outputNode = Fn(() => {
    // const top = mix(scenePassColor.renderOutput(), scenePassDepth.step(1), step(0.5, screenUV.x))
    // const bottom = mix(scenePassNormal, scenePassVelocity, step(0.5, screenUV.x))
    // const out = mix(top, bottom, step(0.5, screenUV.y))

    return scenePassColor.renderOutput()
  })

  renderPipeline.outputNode = outputNode()
}
