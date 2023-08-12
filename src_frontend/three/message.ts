import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { Text } from 'troika-three-text'

import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import { ConvoText, ConvoType } from '../utils/types'

export default class Message extends SceneSubject {
	// Props
	height: number
	text: ConvoText
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	troika: any

	// Debugging
	boxHelper: THREE.BoxHelper

	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store,
		text: ConvoText
	) {
		super(name, scene, camera, state)

		// Props
		this.text = text
		this.setMessagePosition()
		this.troika = new Text()
		this.setTextSettings()
		this.setTextPosition()
		this.syncText()
		this.scene.add(this.troika)
	}

	// Methods
	setMessagePosition(): void {
		switch (this.text.type) {
			case ConvoType.input:
				this.position.set(this.state.leftBottom.x + this.state.spacing, 0, 0)
				break
			case ConvoType.response:
				this.position.set(
					this.state.leftBottom.x + this.state.ctpOffset + this.state.spacing,
					0,
					0
				)
				break
			default:
				throw new Error('Invalid sender')
		}
	}

	setTextSettings(): void {
		this.troika.font = './assets/cascadiacode/CascadiaMono-Regular.ttf'
		this.troika.fontSize =
			this.state.lineHeight / this.state.fontLineHeightRatio
		this.troika.lineHeight = this.state.fontLineHeightRatio
		this.troika.sdfGlyphSize = this.state.sdfGlyphSize
		this.troika.color = 0xffffff
		this.troika.anchorX = 'left'
		this.troika.anchorY = 'bottom'
		this.troika.maxWidth = this.state.msgWidth
		this.troika.overflowWrap = 'break-word'
		this.troika.whiteSpace = 'normal'
	}

	setTextPosition() {
		const newPosition = this.position.clone()
		this.troika.position.set(newPosition.x, newPosition.y, newPosition.z)
	}

	syncText(): void {
		this.troika.text = this.text.text
		this.troika.sync()
	}

	// Callback Implementations
	update(): void {
		this.setMessagePosition()
		this.setTextSettings()
		this.setTextPosition()
		this.syncText()
	}

	buildDevUI(gui: GUI): void {
		this.boxHelper = new THREE.BoxHelper(this.troika)
		this.scene.add(this.boxHelper)
	}

	updateDevUI(): void {
		this.boxHelper.update()
	}

	onWindowResize(): void {
		//
	}
}
