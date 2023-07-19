import * as THREE from 'three'
import {
	AsciiEffect,
	AsciiEffectOptions,
} from 'three/examples/jsm/effects/AsciiEffect.js'

export default class Postprocessor {
	asci: AsciiEffect

	constructor(renderer: THREE.WebGLRenderer) {
		const options: AsciiEffectOptions = {
			resolution: 0.25, // default 0.15
			scale: 1, // default 1
			invert: true,
			block: false,
		}
		this.asci = new AsciiEffect(renderer, ' .+^0123456789', options)
		const resolution = renderer.getSize(new THREE.Vector2())
		this.asci.setSize(resolution.width, resolution.height)
		this.asci.domElement.style.color = 'white'
		this.asci.domElement.style.backgroundColor = 'black'

		// Special case: append effect.domElement, instead of renderer.domElement.
		// AsciiEffect creates a custom domElement (a div container) where the ASCII elements are placed.

		this.asci.domElement.style.position = 'fixed'
		this.asci.domElement.style.top = '0'
		this.asci.domElement.style.left = '0'
		this.asci.domElement.style.zIndex = '-1'

		this.asci.domElement.id = 'THREE.AsciiRenderer'

		document.body.appendChild(this.asci.domElement)
	}

	render(scene: THREE.Scene, camera: THREE.Camera) {
		this.asci.render(scene, camera)
	}

	onWindowResize(width: number, height: number) {
		this.asci.setSize(width, height)
	}
}
