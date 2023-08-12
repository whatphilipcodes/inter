import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { Text } from 'troika-three-text'

import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import { ConvoText, ConvoType } from '../utils/types'

export default class Message extends SceneSubject {
	// Props
	text: ConvoText
	height: number
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

		this.text = text
		// Create and Link Text
		this.troika = new Text()
		this.setTextSettings()
		this.add(this.troika)
		this.syncText()

		this.setMessagePosition()
	}

	// Getters
	getTextHeight(): number {
		return this.height
	}

	// Methods
	private setMessagePosition(): void {
		switch (this.text.type) {
			case ConvoType.input:
				break
			case ConvoType.response:
				this.translateX(this.state.ctpOffset)
				break
			default:
				throw new Error('Invalid sender')
		}
	}

	private setTextSettings(): void {
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

	private syncText(): void {
		this.troika.text = this.text.text
		this.troika.sync(() => {
			this.height =
				this.troika.geometry.boundingBox.max.y -
				this.troika.geometry.boundingBox.min.y
		})
	}

	// Callback Implementations
	update(): void {
		// this.setMessagePosition()
		this.setTextSettings()
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
