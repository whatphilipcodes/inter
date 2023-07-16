// Thanks to https://pierfrancesco-soffritti.medium.com/how-to-organize-the-structure-of-a-three-js-project-77649f58fa3f

import * as THREE from 'three'
import SceneSubject from './_sceneSubject'

import { Store } from '../state/store'
// import { appState } from '../utils/enums'

// Import SceneSubjects
import InputDisplay from './inputDisplay'
// import TroikaTest from './troika'
// import ThreeDemo from './demo'

export default class SceneManager {
	// Props
	clock: THREE.Clock
	state: Store

	canvas: HTMLCanvasElement
	renderer: THREE.WebGLRenderer
	camera: THREE.PerspectiveCamera
	scene: THREE.Scene

	sceneSubjects: SceneSubject[]

	// Init
	constructor(canvas: HTMLCanvasElement) {
		this.clock = new THREE.Clock()
		this.canvas = canvas
		this.scene = this.buildScene()
		this.renderer = this.buildRenderer()
		this.camera = this.buildCamera()
		this.sceneSubjects = this.buildSceneSubjects()
	}

	// Methods
	buildScene() {
		const scene = new THREE.Scene()
		scene.background = new THREE.Color('#000')
		return scene
	}

	buildRenderer() {
		const renderer = new THREE.WebGLRenderer({ canvas: this.canvas })
		renderer.setSize(this.canvas.width, this.canvas.height)
		return renderer
	}

	buildCamera() {
		const aspectRatio = this.canvas.width / this.canvas.height
		const fieldOfView = 75
		const nearPlane = 0.1
		const farPlane = 1000
		const camera = new THREE.PerspectiveCamera(
			fieldOfView,
			aspectRatio,
			nearPlane,
			farPlane
		)
		camera.position.z = 5
		return camera
	}

	buildSceneSubjects() {
		const sceneSubjects = [
			// new TroikaTest('TroikaTest', this.scene),
			// new ThreeDemo('ThreeDemo', this.scene),
			new InputDisplay('InputDisplay', this.scene, this.state),
		]
		return sceneSubjects
	}

	// Callbacks
	update() {
		const elTime = this.clock.getElapsedTime()
		const deltaTime = this.clock.getDelta()
		const curFrame = this.renderer.info.render.frame
		for (const subject of this.sceneSubjects)
			subject.update(elTime, curFrame, deltaTime)
		this.renderer.render(this.scene, this.camera)
	}

	initThree(state: Store) {
		this.state = state
		for (const subject of this.sceneSubjects) {
			subject.updateState?.(state)
		}
	}

	onWindowResize(width: number, height: number) {
		this.camera.aspect = width / height
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(width, height)
	}
}
