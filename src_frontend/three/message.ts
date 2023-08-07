import * as THREE from 'three'
import SceneSubject from './_sceneSubject'

import { Store } from '../state/store'
import { Text } from 'troika-three-text'
import { fontSizeFromLineHeight } from '../utils/threeUtil'

import Role from './role'

import config from '../front.config'

export default class Message extends SceneSubject {
	// Refs
	state: Store
	camera: THREE.OrthographicCamera

	// Props
	targetLineHeight = 0.5
	anchor: THREE.Vector3
	role: Role

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
		anchor: THREE.Vector3,
		text: string
	) {
		super(name, scene)

		// Get References
		this.state = state
		this.camera = camera
		this.anchor = anchor
		this.text = text

		// Create Troika Text
		this.troika = this.buildTroika()
		this.scene.add(this.troika)

		// Create Text Cursor
		this.role = new Role(
			this.anchor,
			this.getCursorWidth(),
			this.troika.lineHeight
		)
		this.scene.add(this.role.get())

		// debug
		if (config.devUI) {
			this.boxHelper = this.buildDevBox()
			this.scene.add(this.boxHelper)
		}
	}

	buildTroika() {
		const troika = new Text()
		troika.font = './assets/cascadiacode/CascadiaMono-Regular.ttf'
		troika.fontSize = fontSizeFromLineHeight(this.targetLineHeight)
		troika.lineHeight = 1.2
		troika.sdfGlyphSize = 64
		troika.color = 0xffffff
		troika.anchorX = 'left'
		troika.anchorY = 'top'
		troika.maxWidth = this.camera.right - this.camera.left //- this.margin
		troika.overflowWrap = 'break-word'
		troika.whiteSpace = 'normal'
		troika.text = this.text
		troika.position.set(this.anchor.x, this.anchor.y, this.anchor.z)
		return troika
	}

	getCursorWidth(ofLineHeight = 0.08): number {
		return this.targetLineHeight * ofLineHeight
	}

	buildDevBox(): THREE.BoxHelper {
		// Debug
		const boxHelper = new THREE.BoxHelper(this.troika)
		return boxHelper
	}

	update() {
		if (this.boxHelper) this.boxHelper.update()
	}

	onWindowResize(): void {
		// this.anchor = screenToWorld(this.camera, -1, 1)
		// this.role.setAnchor(this.anchor)
		this.role.updateDimensions(this.getCursorWidth(), this.targetLineHeight)
		// this.troika.position.set(this.anchor.x, this.anchor.y, this.anchor.z)
		this.troika.maxWidth = this.camera.right - this.camera.left
		this.troika.fontSize = fontSizeFromLineHeight(this.targetLineHeight)
	}
}
