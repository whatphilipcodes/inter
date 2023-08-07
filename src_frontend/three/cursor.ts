import * as THREE from 'three'
// import negative_frag from './shader/negative.frag'

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
	// posOffset: THREE.Vector2
	material: THREE.MeshBasicMaterial
	geometry: THREE.PlaneGeometry
	mesh: THREE.Mesh
	width: number
	height: number

	constructor(anchor: THREE.Vector3, width = 0.1, height = 1) {
		this.behavior = Behavior.FLASH
		// this.posOffset = new THREE.Vector2(0, 0)
		this.width = width
		this.height = height
		this.material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
		})
		this.geometry = new THREE.PlaneGeometry(this.width, this.height)
		this.mesh = new THREE.Mesh(this.geometry, this.material)
		this.anchor = anchor
		this.setPosition(anchor)
	}

	setPosition(position: THREE.Vector3) {
		// offsets the postion to the lower left corner of the cursor
		this.mesh.position.set(
			position.x + this.width / 2,
			position.y - this.height / 2,
			position.z
		)
	}

	get() {
		return this.mesh
	}

	updateDimensions(width: number, height: number) {
		this.width = width
		this.height = height
	}

	updatePosition(offset: THREE.Vector3) {
		const newPos = this.anchor.clone().add(offset)
		this.setPosition(newPos)
	}

	// CALLBACKS
	update(offset: THREE.Vector3) {
		this.updatePosition(offset)
	}

	onWindowResize(anchor: THREE.Vector3, width: number, height: number) {
		this.anchor = anchor
		this.updateDimensions(width, height)
	}
}
