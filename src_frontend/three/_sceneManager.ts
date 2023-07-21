// Thanks to https://pierfrancesco-soffritti.medium.com/how-to-organize-the-structure-of-a-three-js-project-77649f58fa3f

import * as THREE from 'three'
import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
// import { appState } from '../utils/enums'

// SceneSubjects
import InputDisplay from './inputDisplay'

// Debugging
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import config from '../front.config'

import Postprocessor from './postprocessor'
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
	postprocessor: Postprocessor

	// Init
	constructor(initRes: { width: number; height: number }, state: Store) {
		this.state = state
		this.canvas = this.buildCanvas(initRes.width, initRes.height)
		this.clock = new THREE.Clock()

		this.renderer = this.buildRenderer()
		// this.postprocessor = new Postprocessor(this.renderer) // line distance is to big

		this.camera = new Camera(this.canvas)
		this.camera.buildOrthoCam()

		this.scene = this.buildScene()
		this.sceneSubjects = this.buildSceneSubjects()

		this.init()

		if (config.devUI) this.buildDevUI()
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
			new InputDisplay(
				'InputDisplay',
				this.scene,
				this.state,
				this.camera.instance() as THREE.OrthographicCamera
			),
		]
		return sceneSubjects
	}

	buildDevUI(): void {
		const gui = new GUI({ title: 'Dev UI' })
		this.camera.buildDevUI(gui)
		for (const subject of this.sceneSubjects) {
			subject.buildDevUI?.(gui)
		}
	}

	// Callbacks
	init(): void {
		if (!this.postprocessor) document.body.appendChild(this.renderer.domElement)
	}

	update(): void {
		const elTime = this.clock.getElapsedTime()
		const deltaTime = this.clock.getDelta()
		const curFrame = this.renderer.info.render.frame
		for (const subject of this.sceneSubjects)
			subject.update(elTime, curFrame, deltaTime)
		this.renderer.render(this.scene, this.camera.instance())
		this.postprocessor?.render(this.scene, this.camera.instance())
	}

	onWindowResize(width: number, height: number): void {
		this.camera.updateAspect(width, height)
		this.renderer.setSize(width, height)
		this.postprocessor?.onWindowResize(width, height)
		for (const subject of this.sceneSubjects) {
			subject.onWindowResize?.()
		}
	}
}
