import * as THREE from 'three'
import { Text } from 'troika-three-text'

import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'

export default class InputDisplay extends SceneSubject {
	// Props
	text // Troika instance does not support ts
	state: Store

	constructor(name: string, scene: THREE.Scene, state: Store) {
		super(name, scene)

		// Get State Reference
		this.state = state

		// Create a Troika Text
		this.text = new Text()
		this.text.font = 'assets/sharetechmono.ttf'
		this.text.fontSize = 1.0
		this.text.color = 0xffffff
		this.text.anchorX = 'center'
		this.text.anchorY = 'middle'

		// Add the text to the scene
		this.scene.add(this.text)
	}

	update() {
		this.text.text = this.state?.input
		this.text.sync()
	}

	updateState(state: Store): void {
		this.state = state
	}
}
