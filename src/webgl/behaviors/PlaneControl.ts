import * as THREE from 'three/webgpu'
import { Object3DBehaviour, ThreeContextEvents, getComponent } from "three-start"
import gsap from 'gsap'
import { Observer } from "gsap/Observer"
import { MotionType } from 'crashcat'
import { Body } from './physics/Body'

gsap.registerPlugin(Observer)

export class PlaneControl extends Object3DBehaviour {
  viewport: THREE.Vector2 = new THREE.Vector2()
  ndc: THREE.Vector3 = new THREE.Vector3()
  observer: Observer | null = null
  raycaster: THREE.Raycaster = new THREE.Raycaster()
  cursorY: number = 0
  cameraPositionOriginal: THREE.Vector3 = new THREE.Vector3()
  rotateXTween: gsap.core.Tween | null = null
  bodyComponent: Body | null = null

  private _updateViewport: Function = () => {}
  private _originalBodyMotionType: MotionType = MotionType.STATIC

  onAwake() {
    this.cameraPositionOriginal.copy(this.ctx.camera.position)

    this._updateViewport = this.updateViewport.bind(this)

    this.bodyComponent = getComponent(this.object.getObjectByName('PlaneBody')!, Body)
    this._originalBodyMotionType = this.bodyComponent!.body!.motionType

    this.createMouseControl()
    this.createRotateXTween()

    this._updateViewport()

    this.ctx.on(ThreeContextEvents.Resized, this._updateViewport as (width: number, height: number) => void)
  }

  onUpdate() {
    this.object.rotation.z *= 0.975
  }

  onEnable(): void {
    this.observer?.enable()
    this.bodyComponent!.body!.motionType = this._originalBodyMotionType
  }

  onDisable(): void {
    this.observer?.disable()
    gsap.killTweensOf(this.object)
    this.bodyComponent!.body!.motionType = MotionType.STATIC
  }

  die(): void {
    const tl = gsap.timeline()
    tl.timeScale(1.1)
    tl.addLabel('start')

    tl.to(this.object.position, {
      y: '+=0.65',
      duration: 0.6,
      ease: 'power1.out'
    }, 'start')

    tl.addLabel('fall', '>0.05')
    tl.to(this.object.position, {
      y: '-=6',
      duration: 1,
      ease: 'power2.in'
    }, 'fall')

    tl.to(this.object.position, {
      x: '+=1.2',
      duration: 1.5,
      ease: 'none'
    }, 'start')

    tl.to(this.object.rotation, {
      z: Math.PI * 0.25,
      duration: 0.5,
      ease: 'power1.out',
      overwrite: 'auto'
    }, 'start')

    tl.to(this.object.rotation, {
      x: () => gsap.utils.random([-0.6, 0.6]),
      duration: 1,
      ease: 'power1.out',
      overwrite: 'auto'
    }, 'start')

    tl.to(this.object.rotation, {
      z: Math.PI * -0.25,
      duration: 0.85,
      ease: 'power1.in',
      overwrite: 'auto'
    }, 'fall')
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
      gsap.utils.clamp(-0.75, 0.75),
      gsap.utils.mapRange(-0.75, 0.75, -1.5, 2.1)
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
      onComplete: () => {
        this.object.rotation.x = 0
      },
      duration: 1.2,
      overwrite: 'auto',
      ease: 'back.inOut(2.5)'
    })
  }
}
