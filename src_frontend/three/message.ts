import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'
import { Text } from 'troika-three-text'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { screenToWorld, fontSizeFromLineHeight } from '../utils/threeUtil'

import config from '../front.config'

export default class Input extends SceneSubject {
	// Refs
	state: Store
	camera: THREE.OrthographicCamera
	// Props
	targetLineHeight = 0.5
	anchor: THREE.Vector3
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	troika: any
	text: string

	// Debug
	boxHelper: THREE.BoxHelper

	constructor(
		name: string,
		scene: THREE.Scene,
		state: Store,
		camera: THREE.OrthographicCamera,
		text: string
	) {
		super(name, scene)

		// Get References
		this.state = state
		this.camera = camera
		this.anchor = screenToWorld(camera, -1, 1)
		this.text = text

		// Create Troika Text
		this.troika = this.buildTroika()
		this.scene.add(this.troika)

		// debug
		if (config.devUI) {
			this.boxHelper = this.buildDevBox()
			this.scene.add(this.boxHelper)
		}
	}

	// DEV
	buildDevBox(): THREE.BoxHelper {
		// Debug
		const boxHelper = new THREE.BoxHelper(this.troika)
		return boxHelper
	}

	buildDevUI(gui: GUI) {
		const folder = gui.addFolder('Input Display')
		folder.add(this.troika, 'fontSize', 0.01, 1).name('Font Size')
		folder.addColor(this.troika, 'color').name('Color')
	}

	// METHODS
	buildTroika() {
		const troika = new Text()
		troika.font = './assets/cascadiacode/CascadiaMono-Regular.ttf'
		troika.fontSize = fontSizeFromLineHeight(0.5)
		troika.lineHeight = 1.2
		troika.sdfGlyphSize = 64
		troika.color = 0xffffff
		troika.anchorX = 'left'
		troika.anchorY = 'top'
		troika.maxWidth = this.camera.right - this.camera.left
		troika.overflowWrap = 'break-word'
		troika.whiteSpace = 'normal'
		troika.position.set(this.anchor.x, this.anchor.y, this.anchor.z)
		troika.text = this.text
		return troika
	}

	getCursorWidth(ofLineHeight = 0.08): number {
		return this.targetLineHeight * ofLineHeight
	}

	// CALLBACKS
	update() {
		this.troika.sync()
		if (this.boxHelper) this.boxHelper.update()
	}

	onWindowResize(): void {
		this.anchor = screenToWorld(this.camera, -1, 1)
		this.troika.position.set(this.anchor.x, this.anchor.y, this.anchor.z)
		this.troika.maxWidth = this.camera.right - this.camera.left
		this.troika.fontSize = fontSizeFromLineHeight(0.5)
	}
}
