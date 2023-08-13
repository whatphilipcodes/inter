import * as THREE from 'three'

enum Behavior {
	flash = 'flash',
	static = 'static',
	hidden = 'hidden',
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

	constructor(behavior = 'static') {
		this.setBehavior(behavior)
		this.material = new THREE.MeshBasicMaterial({
			transparent: true,
			color: new THREE.Color(0xffffff),
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

	setDimensions(width: number, height: number) {
		this.width = width
		this.height = height
		this.mesh.scale.set(width, height, 1)
	}

	// Public Methods
	get() {
		return this.mesh
	}

	setBehavior(behavior: string) {
		this.behavior = Behavior[behavior as keyof typeof Behavior]
	}

	update(position: THREE.Vector3, time = 0) {
		this.setPosition(position)
		switch (this.behavior) {
			case Behavior.flash:
				this.flash(time)
				break
			case Behavior.static:
				this.static()
				break
			case Behavior.hidden:
				this.hidden()
				break
			default:
				break
		}
	}

	// Animations
	flash(time: number) {
		this.material.opacity = Math.sin(time * Math.PI * 2) * 0.5 + 0.5
	}

	static() {
		this.material.opacity = 1
	}

	hidden() {
		this.material.opacity = 0
	}

	in(top: boolean, t: number) {
		const start = new THREE.Vector2(0, 0)
		const end = new THREE.Vector2(this.height, 1)
		const transform = start.lerp(end, t)
		this.mesh.scale.set(this.width, transform.x, 1)
		this.mesh.translateY(-transform.y)
	}

	out(top: boolean) {
		//
	}
}
