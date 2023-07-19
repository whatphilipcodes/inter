import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { Store } from '../state/store'
import * as THREE from 'three'

export default class SceneSubject extends THREE.Group {
	name: string
	scene: THREE.Scene
	origin: THREE.Vector3

	constructor(name: string, scene: THREE.Scene, origin?: THREE.Vector3) {
		super()
		this.name = name
		this.scene = scene
		this.origin = origin || new THREE.Vector3(0, 0, 0)
	}

	buildDevUI?(gui: GUI): void
	updateState?(state: Store): void
	updateOrigin?(origin: THREE.Vector3): void

	update(elTime: number, curFrame: number, deltaTime: number) {
		console.log(
			'elTime: ' + elTime,
			'curFrame: ' + curFrame,
			'deltaTime: ' + deltaTime
		)
		throw new Error('update() not implemented on SceneSubject: ' + this.name)
	}
}
