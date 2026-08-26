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
  cameraPositionOriginal: THREE.Vector3 = new THREE.Vector3()
  rotateXTween: gsap.core.Tween | null = null

  private _updateViewport: Function = () => {}

  onAwake() {
    this.cameraPositionOriginal.copy(this.ctx.camera.position)

    this._updateViewport = this.updateViewport.bind(this)

    this.createMouseControl()
    this.createRotateXTween()

    this._updateViewport()

    this.ctx.on(ThreeContextEvents.Resized, this._updateViewport as (width: number, height: number) => void)
  }

  onUpdate() {
    this.object.rotation.z *= 0.975
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

    const moveYCamera = gsap.quickTo(
      this.ctx.camera.position,
      'y',
      {
        duration: 0.65,
        overwrite: 'auto',
        ease: 'power2.out'
      }
    )

    const targetY = gsap.utils.pipe(
      gsap.utils.clamp(-1, 1),
      gsap.utils.mapRange(-1, 1, -1.5, 2.3)
    )

    const targetYCamera = gsap.utils.pipe(
      gsap.utils.clamp(-1, 1),
      gsap.utils.mapRange(-1, 1, this.cameraPositionOriginal.y - 0.35, this.cameraPositionOriginal.y + 0.35)
    )

    this.observer = Observer.create({
      type: 'pointer',
      onUp: (event) => {
        const ratio = Math.min(100, Math.abs(event.deltaY)) / 100

        gsap.to(this.object.rotation, {
          z: Math.PI * 0.35 * ratio,
          duration: 0.25,
          overwrite: 'auto'
        })
      },
      onDown: (event) => {
        const ratio = Math.min(100, Math.abs(event.deltaY)) / 100

        gsap.to(this.object.rotation, {
          z: Math.PI * -0.35 * ratio,
          duration: 0.25,
          overwrite: 'auto'
        })
      },
      onClick: () => {
        if (this.rotateXTween?.isActive()) return

        this.rotateXTween?.invalidate()
        this.rotateXTween?.restart()
      },
      onMove: (event) => {
        this.ndc.setComponent(0, (event.x! / this.viewport.x) * 2 - 1)
        this.ndc.setComponent(1, -(event.y! / this.viewport.y) * 2 + 1)

        moveY(targetY(this.ndc.y))
        moveYCamera(targetYCamera(this.ndc.y))
      }
    })
  }

  private createRotateXTween() {
    this.rotateXTween = gsap.fromTo(this.object.rotation, { x: 0 }, {
      paused: true,
      x: () => {
        return Math.PI * 2 * Math.sign(Math.random() - 0.5)
      },
      duration: 1.2,
      overwrite: 'auto',
      ease: 'back.inOut(2.5)'
    })
  }
}
