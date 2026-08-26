import { MeshBasicNodeMaterial, StorageInstancedBufferAttribute, Color } from 'three/webgpu'
import { Fn, instanceIndex, vec3, storage, positionLocal, float, uniform, time, PI, hash, rotate, uv, deltaTime, modelWorldMatrixInverse, If, mix, positionWorld } from 'three/tsl'

export const COUNT = 50

export const colorA = uniform(new Color(180 / 255, 150 / 255, 150 / 255))
export const colorB = uniform(new Color(71 / 255, 51 / 255, 51 / 255))
export const lifeMin = uniform(0.5)
export const lifeMax = uniform(3.5)
// export const life = uniform(2)
export const emitterPosition = uniform(vec3())
export const direction = uniform(vec3(-1, 0, 0))

export const ParticlesMaterial = new MeshBasicNodeMaterial()

const positionsArray = new Float32Array(COUNT * 3)
const positionsAttribute = new StorageInstancedBufferAttribute(positionsArray, 3)
const positionsStorage = storage(positionsAttribute, 'vec3', COUNT)

const originsArray = new Float32Array(COUNT * 3)
const originsAttribute = new StorageInstancedBufferAttribute(originsArray, 3)
const originsStorage = storage(originsAttribute, 'vec3', COUNT)

const lifeArray = new Float32Array(COUNT)
const lifeAttribute = new StorageInstancedBufferAttribute(lifeArray, 1)
const lifeStorage = storage(lifeAttribute, 'float', COUNT)

const lastLifeArray = new Float32Array(COUNT)
const lastLifeAttribute = new StorageInstancedBufferAttribute(lastLifeArray, 1)
const lastLifeStorage = storage(lastLifeAttribute, 'float', COUNT)

const rotationsArray = new Float32Array(COUNT * 3)
const rotationsAttribute = new StorageInstancedBufferAttribute(rotationsArray, 3)
const rotationsStorage = storage(rotationsAttribute, 'vec3', COUNT)

const scalesArray = new Float32Array(COUNT)
const scalesAttribute = new StorageInstancedBufferAttribute(scalesArray, 1)
const scalesStorage = storage(scalesAttribute, 'float', COUNT)

const colorsArray = new Float32Array(COUNT * 3)
const colorsAttribute = new StorageInstancedBufferAttribute(colorsArray, 3)
const colorsStorage = storage(colorsAttribute, 'vec3', COUNT)

export const computeInit = Fn(() => {
  const idx = float(instanceIndex)

  scalesStorage.element(idx).assign(1)
  lastLifeStorage.element(idx).assign(0)

  // const x = hash(idx).remap(0, 1, -0.2, 0.2)
  // const z = hash(idx.add(42)).remap(0, 1, -0.2, 0.2)
  const origin = vec3(-999, 0, 0)
  originsStorage.element(idx).assign(origin)
  positionsStorage.element(idx).assign(origin)

  const rotation = vec3(
    hash(idx.add(42)).remap(0, 1, 0, PI),
    hash(idx.add(152)).remap(0, 1, 0, PI),
    hash(idx.add(262)).remap(0, 1, 0, PI)
  )
  rotationsStorage.element(idx).assign(rotation)

  colorsStorage.element(idx).assign(colorA)

  const life = lifeMin.add(lifeMax.sub(lifeMin).mul(hash(idx)))
  lifeStorage.element(idx).assign(life)
})().compute(COUNT)

export const computeUpdate = Fn(() => {
  const idx = float(instanceIndex)
  const position = positionsStorage.element(idx)
  const origin = originsStorage.element(idx)
  const lastLife = lastLifeStorage.element(idx)
  const life = lifeStorage.element(idx)

  const particleLife = time.sub(idx.mul(0.15)).mod(life)

  If(particleLife.lessThan(lastLife), () => {
    const x = hash(idx).remap(0, 1, -0.2, 0.2)
    const z = hash(idx.add(42)).remap(0, 1, -0.2, 0.2)
    origin.assign(emitterPosition.add(vec3(x, 0, z)))

    const life = lifeMin.add(lifeMax.sub(lifeMin).mul(hash(idx)))
    lifeStorage.element(idx).assign(life)
  })
  lastLife.assign(particleLife)

  const newPosition = direction.normalize().mul(particleLife)
  position.assign(origin.add(newPosition))

  const particleScale = particleLife.remap(0, 0.4, 0.2, 1).min(1)
  particleScale.mulAssign(particleLife.remap(life.mul(0.8), life, 1, 0).min(1))
  scalesStorage.element(idx).assign(particleScale)

  const rotation = rotationsStorage.element(idx)
  rotation.addAssign(deltaTime)

  const color = mix(colorA, colorB, particleLife.remap(0, life, 0, 1))
  colorsStorage.element(idx).assign(color)
})().compute(COUNT)

ParticlesMaterial.positionNode = Fn(() => {
  const instancePosition = positionsStorage.element(instanceIndex)
  const instanceScale = scalesStorage.element(instanceIndex)
  const instanceRotation = rotationsStorage.element(instanceIndex)

  const rotated = rotate(positionLocal, instanceRotation)
  const scaled = rotated.mul(instanceScale)
  const worldPosition = scaled.add(instancePosition)

  return modelWorldMatrixInverse.mul(worldPosition).xyz
})()

ParticlesMaterial.colorNode = Fn(() => {
  return colorsStorage.element(instanceIndex)
})()
