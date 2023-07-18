import * as THREE from 'three'
import { Text } from 'troika-three-text'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'

export default class InputDisplay extends SceneSubject {
	// Props
	troika // Troika instance does not support ts

	state: Store

	constructor(name: string, scene: THREE.Scene, state: Store) {
		super(name, scene)

		// Get State Reference
		this.state = state

		// Create a Troika Text
		this.troika = new Text()
		this.troika.font = './assets/cascadiamono.ttf'
		this.troika.fontSize = 1

		this.troika.sdfGlyphSize = 64
		this.troika.color = 0xffffff
		this.troika.anchorX = 'center'
		this.troika.anchorY = 'middle'

		// Add the troika to the scene
		this.scene.add(this.troika)
	}

	buildDevUI(gui: GUI) {
		const folder = gui.addFolder('Input Display')
		folder.add(this.troika, 'fontSize', 0.01, 1).name('Font Size')
		folder.add(this.troika, 'sdfGlyphSize', 0, 256).name('SDF Glyph Size')
		folder.addColor(this.troika, 'color').name('Color')
		this.troika.sync()
		gui.open()
	}

	update() {
		this.troika.text = this.state?.input
		this.troika.sync()
	}

	updateState(state: Store): void {
		this.state = state
	}
}
