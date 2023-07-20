import * as THREE from 'three'
import { AniPath } from './aniPath'

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
	name: string
	scene: THREE.Scene
	anchor: THREE.Vector3
	material: THREE.MeshBasicMaterial
	behavior: Behavior

	// Points
	cursorTop: THREE.Vector3
	cursorEnd: THREE.Vector3
	pointBase: THREE.Vector3
	pointCorn: THREE.Vector3
	pointDest: THREE.Vector3

	// MeshLine
	points: THREE.Vector3[]
	geometry: THREE.BufferGeometry
	line: THREE.Mesh
	test: AniPath
	t: number

	constructor(
		name: string,
		scene: THREE.Scene,
		origin: THREE.Vector3
		// resolution: THREE.Vector2
	) {
		this.t = 0
		this.name = name
		this.scene = scene
		this.anchor = origin

		this.behavior = Behavior.HIDDEN

		// testing stuff
		this.material = new THREE.MeshBasicMaterial({
			// white color
			color: 0xffffff,
		})

		this.cursorTop = new THREE.Vector3(0, 1, origin.z)
		this.cursorEnd = new THREE.Vector3(0, -1, origin.z)
		this.pointBase = new THREE.Vector3(0, -2, origin.z)
		this.pointCorn = new THREE.Vector3(-2, -2, origin.z)
		this.pointDest = new THREE.Vector3(-2, 1, origin.z)

		this.points = [
			this.cursorTop,
			this.cursorEnd,
			this.pointBase,
			this.pointCorn,
			this.pointDest,
		]

		this.test = new AniPath(this.points, 0.4)

		// this.geometry = new THREE.BufferGeometry()

		// const vertices = new Float32Array([
		// 	-1.0,
		// 	-1.0,
		// 	origin.z, // v0
		// 	1.0,
		// 	-1.0,
		// 	origin.z, // v1
		// 	1.0,
		// 	1.0,
		// 	origin.z, // v2
		// 	-1.0,
		// 	1.0,
		// 	origin.z, // v3
		// ])

		// const indices = [0, 1, 2, 2, 3, 0]

		// this.geometry.setIndex(indices)
		// this.geometry.setAttribute(
		// 	'position',
		// 	new THREE.BufferAttribute(vertices, 3)
		// )
		// this.line = new THREE.Mesh(this.geometry, this.material)

		// this.scene.add(this.line)
	}

	update() {
		this.t += 0.01
		const value = (Math.sin(this.t) + 1) * 0.5
		this.test.update(value, value + 0.2)
		// TODO
	}
}
