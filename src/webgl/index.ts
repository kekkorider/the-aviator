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
  addComponent,
  getComponent,
  destroy as destroyComponent
} from "three-start"
import { MotionType } from 'crashcat'
import { gsap } from 'gsap'

import { PlaneMaterial } from './materials/plane'
import { PropellerMaterial } from './materials/propeller'
import { map as bombMap } from './materials/bomb'
import {
  ParticlesMaterial,
  computeInit,
  computeUpdate,
  COUNT as PARTICLE_COUNT,
  emitterPosition
} from './materials/particles'

import { AssetLoaderModule } from './modules/AssetLoader'
// import { OrbitControlsModule } from './modules/OrbitControls'
import { PhysicsModule } from './modules/Physics'
// import { InspectorModule } from './modules/Inspector'
import { InputModule } from './modules/Input'
import { GameModule } from './modules/Game'
import { UIModule } from './modules/UI'

import { Body } from "./behaviors/physics/Body"
import { Spin } from './behaviors/Spin'
import { Float } from './behaviors/Float'
import { PlaneControl } from './behaviors/PlaneControl'
// import { TransformControl } from './behaviors/TransformControl'

import { Planet } from './objects/Planet'
import { Bomb } from './objects/Bomb'
import { Coin } from './objects/Coin'

import { BodyBox, type BodyParams as BoxBodyParams } from './behaviors/physics/BodyBox'
import { BodySphere, type BodyParams as SphereBodyParams } from './behaviors/physics/BodySphere'

import type { RigidBody, RigidBodySettings } from 'crashcat'

type PickupUserData = {
  isCoin: boolean
  isBomb: boolean,
  isWall: boolean,
  isPlane: boolean,
  object: THREE.Object3D
}

//
// Setup
//
const starter = new ThreeStart()

starter.addModules({
  assetLoader: new AssetLoaderModule(),
  // orbitControls: new OrbitControlsModule(),
  physics: new PhysicsModule(true),
  // inspector: new InspectorModule(),
  input: new InputModule(),
  game: new GameModule(),
  ui: new UIModule(),
})

const { scene, renderer, camera, modules, scenePass, renderPipeline } = starter.ctx

let plane: THREE.Mesh | undefined = undefined
let planet: Planet

renderer.setClearColor(0xe4e0ba)

starter.ctx.once(ThreeContextEvents.Mount, () => {
  createPostProcessing()
})

starter.start()

await renderer.init()
await renderer.computeAsync(computeInit)

starter.mount(document.getElementById('app')! as HTMLDivElement)

await modules.assetLoader.loadModels('game.glb')
await modules.assetLoader.loadTextures('bomb-base.png')

modules.assetLoader.getTexture('bomb-base')!.flipY = false

bombMap.value = modules.assetLoader.getTexture('bomb-base') as THREE.Texture

//
// Camera
//
camera.position.set(0, 1, 5)
camera.lookAt(0, 0, 0)

//
// Planet
//
planet = new Planet(starter.ctx)
planet.mesh.position.set(0, -12, 0)

//
// Plane
//
plane = modules.assetLoader.getModel('game')?.scene.getObjectByName('Plane') as THREE.Mesh
plane.scale.set(0.6, 0.6, 0.6)
plane.position.x = -1.5
plane.position.y = 10
plane.material = PlaneMaterial

const planeBody = new THREE.Object3D()
planeBody.name = 'PlaneBody'
plane.add(planeBody)

const planeBodyComponent = addComponent(planeBody, BodySphere, {
  motionType: MotionType.KINEMATIC,
} as RigidBodySettings, {
  radius: 0.25
} as SphereBodyParams)

requestAnimationFrame(() => {
  planeBodyComponent!.body!.userData = {
    isPlane: true,
    object: planeBody
  } as object
})

const bomb = new Bomb(starter.ctx).createMesh()

const planeControlComponent = addComponent(plane, PlaneControl)
planeControlComponent.disable()

const propeller = plane.getObjectByName('Propeller') as THREE.Mesh
propeller.material = PropellerMaterial
addComponent(propeller, Spin, { axis: 'x', speed: 20 })

scene.add(plane)

//
// Coin
//
const coin = new Coin()

//
// Left wall
//
{
  const geometry = new THREE.BoxGeometry(10, 0.5, 2)
  const material = new THREE.MeshNormalNodeMaterial()
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(-13, -12, 0)
  mesh.name = 'LeftWall'
  mesh.visible = false
  scene.add(mesh)

  const bodyComponent = addComponent(mesh, BodyBox, {
    motionType: MotionType.KINEMATIC,
    sensor: true,
  } as RigidBodySettings, {
    width: 10.02,
    height: 0.52,
    depth: 2.02,
  } as BoxBodyParams)

  bodyComponent!.body!.userData = {
    isWall: true,
    object: mesh
  } as object
}

//
// Particles
//
const particleGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
const particles = new THREE.InstancedMesh(particleGeometry, ParticlesMaterial, PARTICLE_COUNT)
particles.position.set(-0.7, 0.1, 0)
particles.frustumCulled = false
particles.name = 'Particles'
// addComponent(particles, TransformControl)
plane.add(particles)

starter.ctx.on(ThreeContextEvents.Update, () => {
  particles.getWorldPosition(emitterPosition.value)
  renderer.compute(computeUpdate)
})

function spawnCoins(amount: number, gap: number, baseRadius: number = 6, startAngle: number = 0, spawnAfter?: number): void {
  let i: number, x: number, y: number, rng: number

  for (i = 0; i < amount; i++) {
    rng = Math.random()

    if (rng > 0.1) {
      const clone = coin.clone(false)
      const inner = clone.getObjectByName('CoinInner') as THREE.Mesh

      const angle = startAngle - i * gap

      x = Math.cos(angle) * baseRadius
      y = Math.sin(angle) * baseRadius

      clone.position.set(x, y, 0)
      clone.rotation.z = angle
      planet.mesh.add(clone)

      addComponent(inner, Spin, { axis: 'y', speed: 1 + Math.random() * 2 })
      addComponent(inner, Float, { axis: 'x', speed: 3, amplitude: 0.3, offset: angle * 6 })
      addComponent(inner, BodySphere, {
        motionType: MotionType.STATIC,
        sensor: true,
      } as RigidBodySettings, {
        radius: 0.15
      } as SphereBodyParams)

      const bodyComponent = getComponent(inner, BodySphere)

      bodyComponent!.body!.userData = {
        isCoin: true,
        object: inner
      } as object
    } else {
      const wrapper = new THREE.Object3D()
      wrapper.name = 'BombWrapper'

      const clone = bomb!.clone() as THREE.Mesh
      const angle = startAngle - i * gap

      wrapper.add(clone)

      x = Math.cos(angle) * baseRadius
      y = Math.sin(angle) * baseRadius

      wrapper.position.set(x, y, 0)
      wrapper.rotation.z = angle
      planet.mesh.add(wrapper)

      addComponent(clone, Float, { axis: 'x', speed: 3, amplitude: 0.3, offset: angle * 6 })
      addComponent(clone, BodySphere, {
        motionType: MotionType.STATIC,
        sensor: true,
      } as RigidBodySettings, {
        radius: 0.15
      } as SphereBodyParams)

      const bodyComponent = getComponent(clone, BodySphere)

      bodyComponent!.body!.userData = {
        isBomb: true,
        object: clone
      } as object
    }
  }

  if (spawnAfter) {
    gsap.delayedCall(spawnAfter, () => {
      const angle = -(planet.mesh.rotation.z % (Math.PI * 2))
      const amount = gsap.utils.random(3, 6)
      const radius = gsap.utils.random(11, 14)
      const spawnAfter = gsap.utils.random(2.5, 5)

      spawnCoins(amount, Math.PI * 0.03, radius, angle, spawnAfter)
    })
  }
}

//
// Post-processing
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

modules.game.on('start', async (animateInPlane: boolean) => {
  if (animateInPlane) {
    await planeControlComponent.animateIn().restart()

    planeControlComponent.enable()
    planeBodyComponent.enable()

    spawnCoins(5, Math.PI * 0.03, 12, -(planet.mesh.rotation.z % (Math.PI * 2)) + Math.PI * 0.25, 3.5)
  } else {
    planeControlComponent.enable()
    spawnCoins(5, Math.PI * 0.03, 12, -(planet.mesh.rotation.z % (Math.PI * 2)) + Math.PI * 0.25, 3.5)
  }
})

modules.game.on('levelProgressChanged', (levelProgress: number): void => {
  const amount = (planet.rotationComponent!.getInitialSpeed() + (modules.game.getLevel() - 1) * 0.06 + levelProgress * 0.11).toFixed(3)
  planet.rotationComponent!.tweenSpeed(parseFloat(amount))
})

modules.game.on('levelChanged', (level: number) => {
  level === 1 && planet.rotationComponent!.resetSpeed(1)
})

modules.game.on('gameOver', () => {
  planeControlComponent.disable()
  planeBodyComponent.disable()

  planeControlComponent.die()

  gsap.delayedCall(0.6, () => {
    modules.ui.animateInGameOverScreen()
  })
})

modules.physics.on('contactAdded', (bodyA: RigidBody, bodyB: RigidBody): void => {
  const userDataA = bodyA.userData as PickupUserData
  const userDataB = bodyB.userData as PickupUserData

  // Collect coin
  if (userDataA.isPlane && userDataB.isCoin) {
    const bodyComponent = getComponent(userDataB.object, Body)
    const parent = bodyComponent!.object.parent

    destroyComponent(bodyComponent as Body)
    parent!.removeFromParent()

    modules.game.addScore(350)
    modules.game.addLevelProgress(0.1)
  }

  // Hit bomb
  if (userDataA.isPlane && userDataB.isBomb) {
    const bodyComponent = getComponent(userDataB.object, Body)
    const parent = bodyComponent!.object.parent

    destroyComponent(bodyComponent as Body)
    parent!.removeFromParent()

    modules.game.addScore(-500)
    modules.game.addLives(-1)
    modules.game.getLives() > 0 && modules.game.setLevelProgress(0)
  }

  // Bomb and coins hit wall -> killed
  if (userDataA.isWall) {
    const bodyComponent = getComponent(userDataB.object, Body)
    const parent = bodyComponent!.object.parent

    destroyComponent(bodyComponent as Body)
    parent!.removeFromParent()
  }
})

modules.ui.on('animateInMainTitle', () => {
  planeControlComponent.animateIn()
})

modules.ui.on('animateOutMainTitle', () => {
  modules.ui.animateInHud()
  modules.game.start(false)
})

gsap.delayedCall(0.3, () => {
  modules.ui.animateInMainTitle()

  // modules.ui.animateInGameOverScreen()
})
