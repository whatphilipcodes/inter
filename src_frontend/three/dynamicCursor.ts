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

export default class Cursor {
	// Props
	behavior: Behavior
	anchor: THREE.Vector3
	material: THREE.MeshBasicMaterial
	geometry: THREE.PlaneGeometry
	mesh: THREE.Mesh

	constructor(anchor: THREE.Vector3) {
		this.behavior = Behavior.STATIC
		this.anchor = anchor
		this.material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.5,
		})
		this.geometry = new THREE.PlaneGeometry(1, 1)
	}

	get() {
		// TODO
	}

	update() {
		// TODO
	}
}
