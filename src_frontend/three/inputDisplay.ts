import * as THREE from 'three'
import { Text } from 'troika-three-text'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import Cursor from './dynamicCursor'

export default class InputDisplay extends SceneSubject {
	// Props
	troika // Troika instance does not support ts
	state: Store
	origin: THREE.Vector3
	dynCor: Cursor

	constructor(
		name: string,
		scene: THREE.Scene,
		state: Store,
		origin: THREE.Vector3,
		resolution: THREE.Vector2
	) {
		super(name, scene)

		// Get References
		this.state = state
		this.origin = origin

		// Create a Troika Text
		this.troika = new Text()
		this.troika.font = './assets/cascadiamono.ttf'
		this.troika.fontSize = 1

		this.troika.sdfGlyphSize = 64
		this.troika.color = 0xffffff
		this.troika.anchorX = 'left'
		this.troika.anchorY = 'top'

		// Add the troika to the scene
		this.troika.position.set(origin.x, origin.y, origin.z)
		this.scene.add(this.troika)

		// Cursor
		this.dynCor = new Cursor('testin', this.scene, this.origin, resolution)
	}

	buildDevUI(gui: GUI) {
		const folder = gui.addFolder('Input Display')
		folder.add(this.troika, 'fontSize', 0.01, 1).name('Font Size')
		folder.addColor(this.troika, 'color').name('Color')
		gui.open()
	}

	update() {
		this.troika.text = this.state?.input
		this.troika.sync()
	}

	updateState(state: Store): void {
		this.state = state
	}

	updateOrigin(origin: THREE.Vector3): void {
		this.origin = origin
		this.troika.position.set(origin.x, origin.y, origin.z)
	}
}
