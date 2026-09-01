import { Object3DBehaviour } from "three-start"
import gsap from 'gsap'

type Params = {
  axis?: 'x' | 'y' | 'z'
  speed?: number
}

export class Spin extends Object3DBehaviour {
  axis?: Params['axis']
  speed?: Params['speed']

  private _initialRotation: number = 0
  private _initialSpeed: number = 0

  constructor(params?: Params) {
      super()

      this.axis = params?.axis ?? 'y'
      this.speed = params?.speed ?? 1
  }

  onAwake() {
    this._initialRotation = this.object.rotation[this.axis!]
    this._initialSpeed = this.speed!
  }

  onUpdate() {
    const dt = this.ctx.getDeltaTime()
    this.object.rotation[this.axis!] += dt * this.speed!
  }

  onDestroy() {
    this.object.rotation[this.axis!] = this._initialRotation
  }

  getInitialSpeed(): number {
    return this._initialSpeed
  }

  tweenSpeed(speed: number, duration: number = 0.5): void {
    gsap.to(this, {
      speed,
      duration,
      ease: 'power2.out',
      overwrite: 'auto'
    })
  }

  resetSpeed(duration: number = 0.5): void {
    gsap.to(this, {
      speed: this._initialSpeed,
      duration,
      ease: 'power2.out',
      overwrite: 'auto'
    })
  }
}
