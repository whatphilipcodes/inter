// Thanks to https://pierfrancesco-soffritti.medium.com/how-to-organize-the-structure-of-a-three-js-project-77649f58fa3f

import * as THREE from 'three'

import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
// import { appState } from '../utils/enums'

// SceneSubjects
import Grid from './grid'

// Debugging
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import config from '../front.config'

import Camera from './camera'

export default class SceneManager {
	// Props
	clock: THREE.Clock
	state: Store

	canvas: HTMLCanvasElement
	renderer: THREE.WebGLRenderer
	camera: Camera
	scene: THREE.Scene

	sceneSubjects: SceneSubject[]

	// Init
	constructor(initRes: { width: number; height: number }, state: Store) {
		this.state = state
		this.state.screenWidth = initRes.width
		this.state.screenHeight = initRes.height
		this.canvas = this.buildCanvas(initRes.width, initRes.height)
		this.clock = new THREE.Clock()

		this.camera = new Camera(this.canvas)
		this.camera.buildOrthoCam(1)

		this.scene = this.buildScene()
		this.sceneSubjects = this.buildSceneSubjects()

		this.renderer = this.buildRenderer()
		document.body.appendChild(this.renderer.domElement)

		// if (config.devUI) this.buildDevUI()
	}

	buildCanvas(width: number, height: number): HTMLCanvasElement {
		const canvas = document.createElement('canvas')
		canvas.width = width
		canvas.height = height
		canvas.id = 'THREE.WebGLRenderer'
		canvas.style.position = 'fixed'
		canvas.style.top = '0'
		canvas.style.left = '0'
		canvas.style.zIndex = '-1'
		return canvas
	}

	// Methods
	buildScene(): THREE.Scene {
		const scene = new THREE.Scene()
		scene.background = new THREE.Color('#000')
		return scene
	}

	buildRenderer(): THREE.WebGLRenderer {
		const renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
		})
		renderer.setSize(this.canvas.width, this.canvas.height)
		renderer.setPixelRatio(window.devicePixelRatio)
		return renderer
	}

	buildSceneSubjects(): SceneSubject[] {
		const sceneSubjects = [
			new Grid(
				'Grid',
				this.scene,
				this.camera.instance() as THREE.OrthographicCamera,
				this.state
			),
		]
		return sceneSubjects
	}

	// buildDevUI(): void {
	// 	const gui = new GUI({ title: 'Dev UI' })
	// 	this.camera.buildDevUI(gui)
	// 	for (const subject of this.sceneSubjects) {
	// 		subject.buildDevUI?.(gui)
	// 	}
	// }

	// Callbacks
	update(): void {
		const elTime = this.clock.getElapsedTime()
		const deltaTime = this.clock.getDelta()
		const curFrame = this.renderer.info.render.frame
		for (const subject of this.sceneSubjects)
			subject.update(elTime, curFrame, deltaTime)
		this.renderer.render(this.scene, this.camera.instance())
	}

	onWindowResize(width: number, height: number): void {
		this.state.screenWidth = width
		this.state.screenHeight = height
		this.camera.updateAspect(width, height)
		this.renderer.setSize(width, height)
		for (const subject of this.sceneSubjects) {
			subject.onWindowResize?.()
		}
	}
}
