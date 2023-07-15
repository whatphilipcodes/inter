import * as THREE from 'three'
import { Text } from 'troika-three-text'

import SceneSubject from './_sceneSubject'

export default class TroikaTest extends SceneSubject {
	// Props
	text // Troika instance does not support ts

	constructor(name: string, scene: THREE.Scene) {
		super(name, scene)

		// Create a Troika Text
		this.text = new Text()
		this.text.font = 'assets/sharetechmono.ttf'
		this.text.characters = 'abcdefghijklmnopqrstuvwxyz'
		this.text.text = 'Hello, Three.js!'
		this.text.fontSize = 1.0
		this.text.color = 0xffffff
		this.text.sync()

		// Add the text to the scene
		this.scene.add(this.text)
	}

	update() {
		this.text.rotation.z += 0.01
	}
}
