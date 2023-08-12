import * as THREE from 'three'
import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'

export default class Mask extends SceneSubject {
	top: THREE.Mesh
	bottom: THREE.Mesh
	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)

		this.top = this.buildMask()
		this.bottom = this.buildMask()

		this.scene.add(this.top)
		this.scene.add(this.bottom)
	}

	// Methods
	buildMask(): THREE.Mesh {
		const geometry = new THREE.PlaneGeometry(1, 1)
		const material = new THREE.MeshBasicMaterial({
			color: this.scene.background as THREE.Color,
			transparent: false,
		})
		const plane = new THREE.Mesh(geometry, material)
		return plane
	}

	// Callback Implementations
	update(): void {
		this.top.scale.set(this.state.screenWidth, this.state.padding, 1)
		this.top.position.set(
			0,
			this.state.contentHeight / 2 + this.state.padding / 2,
			0.5
		)
		this.bottom.scale.set(this.state.screenWidth, this.state.padding, 1)
		this.bottom.position.set(
			0,
			-this.state.contentHeight / 2 - this.state.padding / 2,
			0.5
		)
	}
}
