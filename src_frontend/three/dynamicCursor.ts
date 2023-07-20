import * as THREE from 'three'
import {
	MeshLine,
	MeshLineGeometry,
	MeshLineMaterial,
} from '@lume/three-meshline'

import RectLineBuilder from './rectLineBuilder'

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
	material: MeshLineMaterial
	behavior: Behavior

	// Points
	cursorTop: THREE.Vector3
	cursorEnd: THREE.Vector3
	pointBase: THREE.Vector3
	pointCorn: THREE.Vector3
	pointDest: THREE.Vector3

	// MeshLine
	points: THREE.Vector3[]
	geometry: MeshLineGeometry
	line: RectLineBuilder

	constructor(
		name: string,
		scene: THREE.Scene,
		origin: THREE.Vector3,
		resolution: THREE.Vector2
	) {
		this.name = name
		this.scene = scene
		this.anchor = origin

		this.behavior = Behavior.HIDDEN

		// testing stuff
		this.cursorTop = new THREE.Vector3(0, 1, origin.z)
		this.cursorEnd = new THREE.Vector3(0, -1, origin.z)
		this.pointBase = new THREE.Vector3(0, -2, origin.z)
		this.pointCorn = new THREE.Vector3(-2, -2, origin.z)
		this.pointDest = new THREE.Vector3(-2, 1, origin.z)

		// this.points = [
		// 	this.cursorTop,
		// 	this.cursorEnd,
		// 	this.pointBase,
		// 	this.pointCorn,
		// 	this.pointDest,
		// ]
		this.points = [
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(1, 0, 0),
			new THREE.Vector3(0, 1, 0),
		]

		this.line = new RectLineBuilder(
			this.scene,
			this.points,
			0.1,
			false,
			0xffffff
		)
		this.line.createGeometry()
		this.line.animate(0, 1)

		// this.line = new RectLineBuilder(
		// 	this.scene,
		// 	this.points,
		// 	0.1,
		// 	false,
		// 	0xffffff
		// )
		// this.line.createGeometry()
		// this.line.animate(0, 1)

		// this.geometry = new MeshLineGeometry()
		// this.geometry.setPoints(this.points)

		// const options = {
		// 	resolution: resolution,
		// 	color: new THREE.Color('#fff'),
		// 	opacity: 1,
		// 	useDash: false,
		// 	sizeAttenuation: false,
		// 	lineWidth: 14,
		// 	visibility: 1,
		// } as THREE.ShaderMaterialParameters & MeshLineMaterial
		// this.material = new MeshLineMaterial(options)

		// this.line = new MeshLine(this.geometry, this.material)
		// scene.add(this.line)
	}
}
