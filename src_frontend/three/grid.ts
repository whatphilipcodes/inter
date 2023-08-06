import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'
import { screenToWorld } from '../utils/threeUtil'

export default class Grid extends SceneSubject {
	// Refs
	state: Store
	camera: THREE.OrthographicCamera

	// Props
	margin: number
	screenWidthWorldUnits: number
	screenHeightWorldUnits: number

	leftOffset: number // 1/3 of screen width - margin
	messageWidth: number // 2/3 of screen width - margin
	messageHeight: number // 1/2 of screen height - margin

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

	calulateMessageWidth(): number {
		return 0
	}
}
