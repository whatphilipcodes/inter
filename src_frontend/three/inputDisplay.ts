import * as THREE from 'three'
import { Text } from 'troika-three-text'

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

	update() {
		this.troika.text = this.state?.input
		this.troika.sync()
	}

	updateState(state: Store): void {
		this.state = state
	}
}
