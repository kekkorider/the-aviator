import { MeshBasicNodeMaterial } from 'three/webgpu'
import { texture, uniform, Fn } from 'three/tsl'

import { DummyTexture } from '../tsl/DummyTexture'

const dummyTexture = DummyTexture.clone()

export const map = uniform(texture(dummyTexture))

export const BombMaterial = new MeshBasicNodeMaterial()

BombMaterial.colorNode = Fn(() => texture(map.value))()
