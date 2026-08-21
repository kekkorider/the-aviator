import { MeshBasicNodeMaterial, StorageInstancedBufferAttribute } from 'three/webgpu'
import { Fn, instanceIndex, vec3, storage, positionLocal, float, uniform, time, PI, hash, rotate, uv, deltaTime, positionWorld } from 'three/tsl'

export const COUNT = 20

export const life = uniform(2)

export const ParticlesMaterial = new MeshBasicNodeMaterial()

const positionsArray = new Float32Array(COUNT * 3)
const positionsAttribute = new StorageInstancedBufferAttribute(positionsArray, 3)
const positionsStorage = storage(positionsAttribute, 'vec3', COUNT)

const rotationsArray = new Float32Array(COUNT * 3)
const rotationsAttribute = new StorageInstancedBufferAttribute(rotationsArray, 3)
const rotationsStorage = storage(rotationsAttribute, 'vec3', COUNT)

const scalesArray = new Float32Array(COUNT)
const scalesAttribute = new StorageInstancedBufferAttribute(scalesArray, 1)
const scalesStorage = storage(scalesAttribute, 'float', COUNT)

export const computeInit = Fn(() => {
  const idx = float(instanceIndex)

  scalesStorage.element(idx).assign(1)

  const position = positionsStorage.element(idx)
  const x = hash(idx).remap(0, 1, -0.2, 0.2)
  const z = hash(idx.add(42)).remap(0, 1, -0.2, 0.2)
  position.assign(vec3(x, 0, z))

  const rotation = vec3(
    hash(idx.add(42)).remap(0, 1, 0, PI),
    hash(idx.add(152)).remap(0, 1, 0, PI),
    hash(idx.add(262)).remap(0, 1, 0, PI)
  )
  rotationsStorage.element(idx).assign(rotation)
})().compute(COUNT)

export const computeUpdate = Fn(() => {
  const idx = float(instanceIndex)
  const position = positionsStorage.element(idx)

  const particleLife = time.sub(idx.mul(0.15)).mod(life)
  position.y.assign(particleLife)

  const particleScale = particleLife.remap(0, 0.4, 0.2, 1).min(1)
  particleScale.mulAssign(particleLife.remap(1.65, 2, 1, 0).min(1))
  scalesStorage.element(idx).assign(particleScale)

  const rotation = rotationsStorage.element(idx)
  rotation.addAssign(deltaTime)
})().compute(COUNT)

ParticlesMaterial.positionNode = Fn(() => {
  const instancePosition = positionsStorage.element(instanceIndex)
  const instanceScale = scalesStorage.element(instanceIndex)
  const instanceRotation = rotationsStorage.element(instanceIndex)

  const rotated = rotate(positionLocal, instanceRotation)
  const scaled = rotated.mul(instanceScale)
  const translated = scaled.add(instancePosition)

  return translated
})()

ParticlesMaterial.colorNode = uv()
