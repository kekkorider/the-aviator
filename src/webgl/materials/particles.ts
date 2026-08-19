import { MeshBasicNodeMaterial, StorageInstancedBufferAttribute } from 'three/webgpu'
import { Fn, instanceIndex, vec3, storage, positionLocal, float, time, hash } from 'three/tsl'

export const COUNT = 400
const amount = Math.sqrt(COUNT)

export const ParticlesMaterial = new MeshBasicNodeMaterial()

const positionsArray = new Float32Array(COUNT * 3)
const positionsAttribute = new StorageInstancedBufferAttribute(positionsArray, 3)
const positionsStorage = storage(positionsAttribute, 'vec3', COUNT)

export const computeInit = Fn(() => {
  // @ts-ignore
  const x = float(instanceIndex).mod(amount).sub(float(amount).div(2))
  // @ts-ignore
  const z = float(instanceIndex).div(amount).sub(float(amount).div(2))

  positionsStorage.element(instanceIndex).assign(vec3(x, -2, z))
})().compute(COUNT)

ParticlesMaterial.positionNode = Fn(() => {
  const instancePosition = positionsStorage.element(instanceIndex)
  return positionLocal.add(instancePosition)
})()

export const computeUpdate = Fn(() => {
  const idx = float(instanceIndex)
  const position = positionsStorage.element(instanceIndex)
  position.y.addAssign(time.mul(2).add((idx.mod(amount))).sin().mul(0.01))
})().compute(COUNT)
