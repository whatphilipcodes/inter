import * as THREE from 'three'
import { Text } from 'troika-three-text'

export default class TroikaTest extends THREE.Scene {
	// Troika Instance
	text

	constructor() {
		super()

		// Create a Troika Text
		this.text = new Text()
		this.text.font = 'assets/sharetechmono.ttf'
		this.text.characters = 'abcdefghijklmnopqrstuvwxyz'
		this.text.text = 'Hello, Three.js!'
		this.text.fontSize = 1.0
		this.text.color = 0xffffff
		this.text.sync()

		// Add the text to the scene
		this.add(this.text)
	}

	update() {
		this.text.rotation.z += 0.01
	}
}
