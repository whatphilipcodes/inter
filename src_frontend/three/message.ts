import * as THREE from 'three'
import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import { Text } from 'troika-three-text'
import { Sender } from '../utils/types'

export default class Message extends SceneSubject {
	// Props
	sender: Sender
	height: number
	text: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	troika: any

	// Debugging
	boxHelper: THREE.BoxHelper

	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store,
		text: string
	) {
		super(name, scene, camera, state)
		this.text = text
		this.troika = new Text()
		this.setTextSettings()
		this.setTextPosition()
		this.syncText()
	}

	// Methods
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
		this.troika.text = this.text
		this.troika.sync()
	}

	// Callback Implementations
	update(): void {
		//
	}

	onWindowResize(): void {
		//
	}
}
