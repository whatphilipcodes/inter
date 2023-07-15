// Thanks to https://pierfrancesco-soffritti.medium.com/how-to-organize-the-structure-of-a-three-js-project-77649f58fa3f

import * as THREE from 'three'
import SceneSubject from './_sceneSubject'

// Import SceneSubjects
import TroikaTest from './troika'

export default class SceneManager {
	// Props
	clock: THREE.Clock
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
		this.renderer = this.buildRender()
		this.camera = this.buildCamera()
		this.sceneSubjects = this.buildSceneSubjects()
	}

	// Methods
	buildScene() {
		const scene = new THREE.Scene()
		scene.background = new THREE.Color('#A9CBB7')
		return scene
	}

	buildRender() {
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
		const sceneSubjects = [new TroikaTest('TroikaTest', this.scene)]
		return sceneSubjects
	}

	// Callbacks
	update() {
		const deltaTime = this.clock.getElapsedTime()
		for (let i = 0; i < this.sceneSubjects.length; i++)
			this.sceneSubjects[i].update(deltaTime)
		this.renderer.render(this.scene, this.camera)
	}

	onWindowResize(width: number, height: number) {
		this.camera.aspect = width / height
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(width, height)
	}
}
