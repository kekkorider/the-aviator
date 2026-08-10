import { ContextModule } from "three-start"
import { Inspector } from 'three/addons/inspector/Inspector.js'

import type { ParametersGroup } from "three/examples/jsm/inspector/tabs/Parameters.js"

import { seaSpeed, seaHeight, colorShallow, colorDeep } from '../materials/planet'

export class InspectorModule extends ContextModule {
  inspector: Inspector | null = null
  gui: ParametersGroup | null = null

  onAwake() {
    this.inspector = this.ctx.renderer.inspector = new Inspector()

    this.gui = this.inspector.createParameters('Settings')
    this.gui.add(seaSpeed, 'value', 0, 1).name('Sea Speed')
    this.gui.add(seaHeight, 'value', 0, 1).name('Sea Height')
    this.gui.addColor(colorShallow, 'value').name('Color Shallow')
    this.gui.addColor(colorDeep, 'value').name('Color Deep')
  }
}
