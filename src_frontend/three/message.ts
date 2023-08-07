import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'
import { Text } from 'troika-three-text'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { fontSize, cursorWidth, getHelper2DBox } from '../utils/threeUtil'

import Role from './role'
import config from '../front.config'

export default class Input extends SceneSubject {
	// Refs
	state: Store
	camera: THREE.OrthographicCamera

	// Props
	anchor: THREE.Vector3
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	troika: any
	text: string

	// Dimensions
	width: number
	height: number
	targetLineHeight: number

	// Role
	indicatorOffset: THREE.Vector3
	role: Role

	// Debug
	boxHelper: THREE.BoxHelper

	constructor(
		name: string,
		scene: THREE.Scene,
		state: Store,
		camera: THREE.OrthographicCamera,
		text: string,
		width: number,
		lineHeight: number,
		position: THREE.Vector3,
		type = 'input'
	) {
		super(name, scene)

		// Get References
		this.state = state
		this.camera = camera
		this.anchor = position
		this.text = text

		// Set Dimensions
		this.width = width
		this.targetLineHeight = lineHeight

		// Create Troika Text
		this.troika = this.buildTroika()
		this.scene.add(this.troika)

		// create role indicator
		switch (type) {
			case 'input':
				this.indicatorOffset = new THREE.Vector3(-0.04, 0, 0)
				break
			case 'response':
				console.log(this.width)
				this.indicatorOffset = new THREE.Vector3(this.width + 0.04, 0, 0)
				break
			default:
				throw new Error('Invalid message type!')
		}

		this.role = new Role(this.anchor, cursorWidth(this.targetLineHeight), 1)
		this.scene.add(this.role.get())

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
		troika.fontSize = fontSize(this.targetLineHeight)
		troika.lineHeight = 1.2
		troika.sdfGlyphSize = 64
		troika.color = 0xffffff
		troika.anchorX = 'left'
		troika.anchorY = 'bottom'
		troika.maxWidth = this.width
		troika.overflowWrap = 'break-word'
		troika.whiteSpace = 'normal'
		troika.position.set(this.anchor.x, this.anchor.y, this.anchor.z)
		troika.text = this.text
		return troika
	}

	// CALLBACKS
	update() {
		this.troika.sync(() => {
			this.height = this.troika.textRenderInfo.blockBounds[3]
		})
		this.role.updateDimensions(cursorWidth(this.targetLineHeight), this.height)
		this.role.update(this.indicatorOffset)
		if (this.boxHelper) this.boxHelper.update()
	}

	onWindowResize(): void {
		this.troika.position.set(this.anchor.x, this.anchor.y, this.anchor.z)
		this.troika.maxWidth = this.width
		this.troika.fontSize = fontSize(this.targetLineHeight)
	}
}
