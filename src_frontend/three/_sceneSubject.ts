import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { Store } from '../state/store'
import * as THREE from 'three'

export default class SceneSubject extends THREE.Group {
	name: string
	scene: THREE.Scene
	camera?: THREE.OrthographicCamera
	state?: Store

	constructor(
		name: string,
		scene: THREE.Scene,
		camera?: THREE.OrthographicCamera,
		state?: Store
	) {
		super()
		this.name = name
		this.scene = scene
		this.camera = camera
		this.state = state
	}

	update?(elTime: number, curFrame: number, deltaTime: number): void
	updateState?(state: Store): void
	onWindowResize?(): void

	buildDevUI?(gui: GUI): void
	updateDevUI?(): void
}
