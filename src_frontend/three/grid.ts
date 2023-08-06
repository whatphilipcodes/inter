import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'

export default class Grid extends SceneSubject {
	// Refs
	state: Store
	camera: THREE.OrthographicCamera
	// Coordinates
	messageWidth: number
	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene)
		this.state = state
		this.camera = camera
	}
}
