import * as THREE from 'three'

enum Behavior {
	FLASH,
	STATIC,
	TOP2BOTTOM,
	BOTTOM2TOP,
}

export default class Cursor {
	// Props
	behavior: Behavior
	anchor: THREE.Vector3
	material: THREE.MeshBasicMaterial
	geometry: THREE.PlaneGeometry
	mesh: THREE.Mesh
	width: number
	height: number

	constructor(color: THREE.Color = new THREE.Color(0xffffff)) {
		this.behavior = Behavior.FLASH
		this.material = new THREE.MeshBasicMaterial({
			color: color,
		})
		this.geometry = new THREE.PlaneGeometry(1, 1)
		this.mesh = new THREE.Mesh(this.geometry, this.material)
	}

	private setPosition(position: THREE.Vector3) {
		// transforms the pos anchor to the bottom left corner
		this.mesh.position.set(
			position.x + this.width / 2,
			position.y + this.height / 2,
			position.z
		)
	}

	private setDimensions(width: number, height: number) {
		this.width = width
		this.height = height
		this.mesh.scale.set(width, height, 1)
	}

	// Public Methods
	get() {
		return this.mesh
	}

	update(position: THREE.Vector3, width: number, height: number) {
		this.setDimensions(width, height)
		this.setPosition(position)
	}
}
