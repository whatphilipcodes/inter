import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { Store } from '../state/store'
import * as THREE from 'three'

export default class SceneSubject extends THREE.Group {
	name: string
	scene: THREE.Scene
	camera?: THREE.Camera

	constructor(name: string, scene: THREE.Scene, camera?: THREE.Camera) {
		super()
		this.name = name
		this.scene = scene
		this.camera = camera
	}

	buildDevUI?(gui: GUI): void
	updateState?(state: Store): void
	onWindowResize?(): void

	update(elTime: number, curFrame: number, deltaTime: number) {
		console.log(
			'elTime: ' + elTime,
			'curFrame: ' + curFrame,
			'deltaTime: ' + deltaTime
		)
		throw new Error('update() not implemented on SceneSubject: ' + this.name)
	}
}
