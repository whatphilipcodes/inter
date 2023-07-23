import * as THREE from 'three'
import negative_frag from './shader/negative.frag'

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

export default class TextCursor {
	// Props
	behavior: Behavior
	anchor: THREE.Vector3
	posOffset: THREE.Vector2
	material: THREE.MeshBasicMaterial
	geometry: THREE.PlaneGeometry
	mesh: THREE.Mesh
	width: number
	height: number

	constructor(anchor: THREE.Vector3, width = 0.1, height = 1) {
		this.behavior = Behavior.FLASH
		this.posOffset = new THREE.Vector2(0, 0)
		this.width = width
		this.height = height
		this.material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
		})
		this.geometry = new THREE.PlaneGeometry(this.width, this.height)
		this.mesh = new THREE.Mesh(this.geometry, this.material)
		this.setAnchor(anchor)
	}

	setAnchor(anchor: THREE.Vector3) {
		this.anchor = new THREE.Vector3(
			anchor.x + this.width / 2,
			anchor.y - this.height / 2,
			anchor.z
		)
		this.mesh.position.set(this.anchor.x, this.anchor.y, this.anchor.z)
	}

	get() {
		return this.mesh
	}

	update(offset: THREE.Vector2) {
		this.posOffset = offset
		this.mesh.position.set(
			this.anchor.x + this.posOffset.x,
			this.anchor.y + this.posOffset.y,
			this.anchor.z
		)
	}
}
