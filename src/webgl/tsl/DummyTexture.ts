import { DataTexture } from 'three/webgpu'

export const DummyTexture = new DataTexture(
  new Uint8Array([255, 255, 255, 255]),
  1,
  1
)
