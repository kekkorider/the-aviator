import { Object3DBehaviour } from "three-start"

type Params = {
  axis?: 'x' | 'y' | 'z',
  amplitude?: number,
  speed?: number,
  offset?: number,
}

export class Float extends Object3DBehaviour {
  private axis?: Params['axis']
  private offset: Params['offset']
  private amplitude: Params['amplitude']
  private speed: Params['speed']

  constructor(params?: Params) {
    super()

    this.axis = params?.axis ?? 'y'
    this.offset = params?.offset ?? 0
    this.amplitude = params?.amplitude ?? 0.1
    this.speed = params?.speed ?? 1
  }

  onUpdate() {
    this.object.position[this.axis!] = Math.sin(this.ctx.getTime() * this.speed! + this.offset!) * this.amplitude!
  }
}
