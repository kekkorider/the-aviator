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

import { PlanetMaterial } from './materials/planet'
import { PlaneMaterial } from './materials/plane'
import { PropellerMaterial } from './materials/propeller'
import { BombMaterial, map as bombMap } from './materials/bomb'
import {
  ParticlesMaterial,
  computeInit,
  computeUpdate,
  COUNT as PARTICLE_COUNT
} from './materials/particles'

import { AssetLoaderModule } from './modules/AssetLoader'
import { OrbitControlsModule } from './modules/OrbitControls'
import { PhysicsModule } from './modules/Physics'
// import { InspectorModule } from './modules/Inspector'
import { InputModule } from './modules/Input'
import { GameModule } from './modules/Game'

import { Body } from "./behaviors/physics/Body"
import { Spin } from './behaviors/Spin'
import { Float } from './behaviors/Float'
import { PlaneControl } from './behaviors/PlaneControl'

import { BodySphere, type BodyParams as SphereBodyParams } from './behaviors/physics/BodySphere'

import type { RigidBodySettings } from 'crashcat'

type PickupUserData = {
  isCoin: boolean
  isBomb: boolean
  object: THREE.Object3D
}

//
// Setup
//
const starter = new ThreeStart()

starter.addModules({
  assetLoader: new AssetLoaderModule(),
  orbitControls: new OrbitControlsModule(),
  physics: new PhysicsModule(true),
  // inspector: new InspectorModule(),
  input: new InputModule(),
  game: new GameModule(),
})

const { scene, renderer, camera, modules, scenePass, renderPipeline } = starter.ctx

let plane: THREE.Mesh | undefined = undefined
let bomb: THREE.Mesh | undefined = undefined

renderer.setClearColor(0xe4e0ba)

starter.ctx.once(ThreeContextEvents.Mount, () => {
  createPostProcessing()
})

starter.ctx.on(ThreeContextEvents.Update, () => {
  renderer.compute(computeUpdate)
})

starter.start()

await renderer.init()
renderer.compute(computeInit)

starter.mount(document.getElementById('app')! as HTMLDivElement)

await modules.assetLoader.loadModels('game.glb')
await modules.assetLoader.loadTextures('bomb-base.png')

modules.assetLoader.getTexture('bomb-base')!.flipY = false

bombMap.value = modules.assetLoader.getTexture('bomb-base') as THREE.Texture

//
// Camera
//
camera.position.z = 5

//
// Planet
//
const planetGeometry = new THREE.IcosahedronGeometry(5, 14)
const planet = new THREE.Mesh(planetGeometry, PlanetMaterial)
planet.name = 'Planet'
planet.position.set(0, -6, 0)
addComponent(planet, Spin, { axis: 'z', speed: 0.5 })
scene.add(planet)
planet.visible = false

//
// Plane
//
plane = modules.assetLoader.getModel('game')?.scene.getObjectByName('Plane') as THREE.Mesh
plane.material = PlaneMaterial

bomb = modules.assetLoader.getModel('game')?.scene.getObjectByName('Bomb') as THREE.Mesh
bomb.geometry.scale(0.3, 0.3, 0.3)
bomb.geometry.rotateZ(-Math.PI / 2)
bomb.material = BombMaterial

const planeBody = new THREE.Object3D()
planeBody.name = 'PlaneBody'
plane.add(planeBody)

addComponent(planeBody, BodySphere, {
  motionType: MotionType.KINEMATIC,
} as RigidBodySettings, {
  radius: 0.5
} as SphereBodyParams)

addComponent(plane, PlaneControl)

const propeller = plane.getObjectByName('Propeller') as THREE.Mesh
propeller.material = PropellerMaterial
addComponent(propeller, Spin, { axis: 'x', speed: 20 })

// scene.add(plane)

//
// Coin
//
const coinGeometry = new THREE.ConeGeometry(0.2, 0.25, 3, 1)
const coinMaterial = new THREE.MeshNormalNodeMaterial()

const coin = new THREE.Object3D()
coin.name = 'Coin'

const coinInner = new THREE.Mesh(coinGeometry, coinMaterial)
coinInner.name = 'CoinInner'

coin.add(coinInner)

//
// Particles
//
const particleGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
const particles = new THREE.InstancedMesh(particleGeometry, ParticlesMaterial, PARTICLE_COUNT)
particles.name = 'Particles'
addComponent(particles, PlaneControl)
scene.add(particles)

function spawnCoins(amount: number, gap: number, baseRadius: number = 6, startAngle: number = 0, spawnAfter?: number): void {
  let i: number, x: number, y: number, rng: number

  for (i = 0; i < amount; i++) {
    rng = Math.random()

    if (rng > 0.2) {
      const clone = coin.clone(true)
      const inner = clone.getObjectByName('CoinInner') as THREE.Mesh

      const angle = startAngle - i * gap

      x = Math.cos(angle) * baseRadius
      y = Math.sin(angle) * baseRadius

      clone.position.set(x, y, 0)
      clone.rotation.z = angle
      planet.add(clone)

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
      planet.add(wrapper)

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
      const angle = -(planet.rotation.z % (Math.PI * 2)) - Math.PI / 2
      const amount = gsap.utils.random(3, 6)
      const radius = gsap.utils.random(5.5, 8)
      const spawnAfter = gsap.utils.random(2, 4)

      spawnCoins(amount, Math.PI * 0.03, radius, angle, spawnAfter)
    })
  }
}

// spawnCoins(5, Math.PI * 0.03, 6.5, 0, 2)

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

  const scoreElem = document.getElementById('score') as HTMLDivElement
  const scaleScoreTween = gsap.fromTo(scoreElem,
    { scale: 1, rotation: 0 },
    {
      scale: 1.1,
      rotation: () => gsap.utils.random(-10, 10),
      duration: 0.08,
      repeat: 1,
      yoyo: true,
      ease: 'none',
      overwrite: true,
      paused: true
    }
  )
  modules.game.on('scoreChanged', (score) => {
    scoreElem.textContent = score.toString().padStart(3, '0')
    scaleScoreTween.invalidate().restart()
  })

  modules.physics.on('contactAdded', (_bodyA, bodyB) => {
    const userData = bodyB.userData as PickupUserData

    if (userData.isCoin) {
      const bodyComponent = getComponent(userData.object, Body)
      const parent = bodyComponent!.object.parent

      destroyComponent(bodyComponent as Body)
      parent!.removeFromParent()

      modules.game.addScore(1)
    }

    if (userData.isBomb) {
      const bodyComponent = getComponent(userData.object, Body)
      const parent = bodyComponent!.object.parent

      destroyComponent(bodyComponent as Body)
      parent!.removeFromParent()

      modules.game.addScore(-5)
    }
  })
}
