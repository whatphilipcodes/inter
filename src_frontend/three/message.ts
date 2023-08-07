import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'
import { Text } from 'troika-three-text'
import { fontSize, cursorWidth } from '../utils/threeUtil'

import Role from './role'
import config from '../front.config'

export default class Message extends SceneSubject {
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
	posOffset: THREE.Vector3
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
				this.indicatorOffset = new THREE.Vector3(0, 0, 0)
				this.posOffset = new THREE.Vector3(this.targetLineHeight, 0, 0)
				break
			case 'response':
				console.log(this.width)
				this.indicatorOffset = new THREE.Vector3(this.width, 0, 0)
				this.posOffset = new THREE.Vector3(-this.targetLineHeight, 0, 0)
				break
			default:
				throw new Error('Invalid message type!')
		}

		this.setPosition()

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
		troika.text = this.text
		return troika
	}

	setPosition(position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {
		const newPosition = new THREE.Vector3(
			this.anchor.x + this.posOffset.x + position.x,
			this.anchor.y + this.posOffset.y + position.y,
			this.anchor.z + this.posOffset.z + position.z
		)
		this.troika.position.set(newPosition.x, newPosition.y, newPosition.z)
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
		this.setPosition()
		this.troika.maxWidth = this.width
		this.troika.fontSize = fontSize(this.targetLineHeight)
	}
}
