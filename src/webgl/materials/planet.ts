import {
  Fn,
  mx_fractal_noise_float,
  positionGeometry,
  positionLocal,
  time,
  uniform,
  normalLocal,
  mix,
  length
} from 'three/tsl'
import { MeshBasicNodeMaterial, Color } from 'three/webgpu'

export const seaSpeed = uniform(0.5)
export const seaHeight = uniform(0.55)
export const colorShallow = uniform(new Color(194 / 255, 244 / 255, 245 / 255))
export const colorDeep = uniform(new Color(64 / 255, 144 / 255, 160 / 255))

export const PlanetMaterial = new MeshBasicNodeMaterial({
  wireframe: false
})

// @ts-ignore
const Noise = Fn(([coords]) => {
  return mx_fractal_noise_float(coords, 1)
})

const Extrude = Fn(() => {
  // @ts-ignore
  return Noise(positionLocal.mul(1.3).add(time.mul(seaSpeed))).mul(seaHeight)
})

PlanetMaterial.colorNode = Fn(() => {
  const positionOriginal = length(positionGeometry)

  const positionRatio = length(positionLocal).div(positionOriginal)
  // @ts-ignore
  positionRatio.smoothstepAssign(0.98, 1.05)

  return mix(colorDeep, colorShallow, positionRatio)
})()

PlanetMaterial.positionNode = Fn(() => {
  return positionLocal.add(normalLocal.mul(Extrude()))
})()
