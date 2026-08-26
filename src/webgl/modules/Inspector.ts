import { ContextModule } from "three-start"
import { Inspector } from 'three/addons/inspector/Inspector.js'

import type { ParametersGroup } from "three/examples/jsm/inspector/tabs/Parameters.js"

import { seaSpeed, seaHeight, colorShallow, colorDeep } from '../materials/planet'
import { colorA, colorB } from '../materials/particles'
export class InspectorModule extends ContextModule {
  inspector: Inspector | null = null
  gui: ParametersGroup | null = null

  onAwake() {
    this.inspector = this.ctx.renderer.inspector = new Inspector()
    this.gui = this.inspector.createParameters('Settings')

    this.createPlanetFolder()
    this.createPlaneFolder()
  }

  private createPlanetFolder() {
    const folder = this.gui!.addFolder('Planet')
    folder.add(seaSpeed, 'value', 0, 1).name('Sea Speed')
    folder.add(seaHeight, 'value', 0, 1).name('Sea Height')
    folder.addColor(colorShallow, 'value').name('Color Shallow')
    folder.addColor(colorDeep, 'value').name('Color Deep')
  }

  private createPlaneFolder() {
    const planetFolder = this.gui!.addFolder('Planet')
    planetFolder.addColor(colorA, 'value').name('Smoke Color A')
    planetFolder.addColor(colorB, 'value').name('Smoke Color B')
  }
}
