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
// import { MotionType } from 'crashcat'

// import type { RigidBodySettings } from 'crashcat'

import { PlanetMaterial } from './materials/planet'

import { AssetLoaderModule } from './modules/AssetLoader'
import { OrbitControlsModule } from './modules/OrbitControls'
import { PhysicsModule } from './modules/Physics'
import { InspectorModule } from './modules/Inspector'
import { InputModule } from './modules/Input'

import {
  Spin
} from './behaviors/Spin'

//
// Setup
//
const starter = new ThreeStart()

starter.addModules({
  assetLoader: new AssetLoaderModule(),
  orbitControls: new OrbitControlsModule(),
  physics: new PhysicsModule(false),
  inspector: new InspectorModule(),
  input: new InputModule(),
})

const { scene, renderer, camera, modules, scenePass, renderPipeline } = starter.ctx

starter.start()
starter.ctx.once(ThreeContextEvents.Mount, () => {
  createPostProcessing()
})

starter.mount(document.getElementById('app')! as HTMLDivElement)

await renderer.init()

modules.assetLoader.createKTX2Loader()

await modules.assetLoader.loadTextures('/diamond-07.png')
await modules.assetLoader.loadModels('/suzanne.glb')
await modules.assetLoader.loadKTX('/2d_etc1s.ktx2')

//
// Camera
//
camera.position.z = 5

//
// Planet
//
const planetGeometry = new THREE.IcosahedronGeometry(5, 6)
const planet = new THREE.Mesh(planetGeometry, PlanetMaterial)
planet.position.set(0, -6, 0)
addComponent(planet, Spin, { axis: 'z', speed: 0.2 })
scene.add(planet)

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
