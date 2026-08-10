import * as THREE from 'three/webgpu'
import { Object3DBehaviour, ThreeContextEvents } from "three-start"
import gsap from 'gsap'
import { Observer } from "gsap/Observer"

gsap.registerPlugin(Observer)

export class PlaneControl extends Object3DBehaviour {
  viewport: THREE.Vector2 = new THREE.Vector2()
  ndc: THREE.Vector3 = new THREE.Vector3()
  observer: Observer | null = null
  raycaster: THREE.Raycaster = new THREE.Raycaster()
  cursorY: number = 0

  private _updateViewport: Function = () => {}

  onAwake() {
    this._updateViewport = this.updateViewport.bind(this)

    this.createMouseControl()

    this._updateViewport()

    this.ctx.on(ThreeContextEvents.Resized, this._updateViewport as (width: number, height: number) => void)
  }

  onUpdate() {
    this.object.rotation.z *= 0.97
  }

  private updateViewport() {
    this.viewport.set(
      this.ctx.renderer.domElement.clientWidth,
      this.ctx.renderer.domElement.clientHeight
    )
  }

  private createMouseControl() {
    const moveY = gsap.quickTo(
      this.object.position,
      'y',
      {
        duration: 0.5,
        overwrite: 'auto',
        ease: 'power2.out'
      }
    )

    const moveX = gsap.quickTo(
      this.object.position,
      'x',
      {
        duration: 0.5,
        overwrite: 'auto',
        ease: 'power2.out'
      }
    )

    const targetY = gsap.utils.pipe(
      gsap.utils.clamp(-0.5, 0.5),
      gsap.utils.mapRange(-0.5, 0.5, -0.5, 1.1)
    )

    const targetX = gsap.utils.pipe(
      gsap.utils.clamp(-0.5, 0.5),
      gsap.utils.mapRange(-0.5, 0.5, -1.2, 1.2)
    )

    this.observer = Observer.create({
      type: 'pointer',
      onUp: (event) => {
        const ratio = Math.min(100, Math.abs(event.deltaY)) / 100

        gsap.to(this.object.rotation, {
          z: Math.PI * 0.15 * ratio,
          duration: 0.25,
          overwrite: 'auto'
        })
      },
      onDown: (event) => {
        const ratio = Math.min(100, Math.abs(event.deltaY)) / 100

        gsap.to(this.object.rotation, {
          z: Math.PI * -0.15 * ratio,
          duration: 0.25,
          overwrite: 'auto'
        })
      },
      onMove: (event) => {
        this.ndc.setComponent(0, (event.x! / this.viewport.x) * 2 - 1)
        this.ndc.setComponent(1, -(event.y! / this.viewport.y) * 2 + 1)

        this.ndc.clone().unproject(this.ctx.camera)

        const direction = this.ndc.sub(this.ctx.camera.position).normalize()
        const distance = -this.ctx.camera.position.z / direction.z
        const pos = this.ctx.camera.position.clone().add(direction.multiplyScalar(distance))

        moveX(targetX(pos.x))
        moveY(targetY(pos.y))
      }
    })
  }
}
