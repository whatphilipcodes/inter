import * as THREE from 'three'

enum Behavior {
	// input
	FLASH,
	NAV,
	ENTER,
	// answer
	LOADING,
	REVEAL,
	// both
	STATIC,
	HIDDEN,
}

export default class InputCursor {
	// Props
	behavior: Behavior
	anchor: THREE.Vector3
	material: THREE.LineBasicMaterial

	constructor() {
		this.behavior = Behavior.HIDDEN
		this.material = new THREE.LineBasicMaterial({
			color: 0xffffff,
			linewidth: 1,
			linecap: 'round', //ignored by WebGLRenderer
			linejoin: 'round', //ignored by WebGLRenderer
		})
	}
}
