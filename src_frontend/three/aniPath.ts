import * as THREE from 'three'
import * as GeometryUtils from 'three/examples/jsm/utils/GeometryUtils.js'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'

export class AniPath {
	points: THREE.Vector3[]
	width: number

	material: LineMaterial
	positions: number[]
	line: Line2
	constructor(points: THREE.Vector3[], lineWidth: number) {
		// this.points = points
		// this.width = lineWidth
		// this.positions = []
		// this.points.forEach((point) => {
		// 	this.positions.push(point.x, point.y, point.z)
		// })

		// const geometry = new LineGeometry()
		// geometry.setPositions(this.positions)

		// this.material = new LineMaterial({
		// 	color: 0xffffff,
		// 	linewidth: 5, // in world units with size attenuation, pixels otherwise
		// 	vertexColors: true,

		// 	//resolution:  // to be set by renderer, eventually
		// 	dashed: false,
		// 	alphaToCoverage: true,
		// })

		// this.line = new Line2(geometry, this.material)
		// this.line.computeLineDistances()
		// this.line.scale.set(1, 1, 1)

		this.points = points

		this.positions = []
		points.forEach((point) => {
			this.positions.push(point.x, point.y, point.z)
		})

		const geometry = new LineGeometry()
		geometry.setPositions(this.positions)

		this.material = new LineMaterial({
			color: 0xffffff,
			linewidth: 0.1, // in world units with size attenuation, pixels otherwise
			vertexColors: false,
			worldUnits: true,
			alphaToCoverage: true,
		})

		this.line = new Line2(geometry, this.material)
		this.line.computeLineDistances()
	}

	instance() {
		// return object
	}

	update(start: number, end: number) {
		// TODO
		this.material.resolution.set(window.innerWidth, window.innerHeight)
	}
}
