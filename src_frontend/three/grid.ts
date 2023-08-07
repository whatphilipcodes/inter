import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'

import Message from './message'
import Input from './input'

export default class Grid extends SceneSubject {
	// Refs
	state: Store
	camera: THREE.OrthographicCamera

	// Props
	padding: number // decimal percent of world units
	screenWidthWorldUnits: number
	screenHeightWorldUnits: number
	contentHeight: number
	contentWidth: number

	lineHeight: number
	leftOffset: number // 1/3 of screen width - margin
	messageWidth: number // 2/3 of screen width - margin
	messageHeight: number // 1/2 of screen height - margin

	// Children
	message: Message

	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store,
		padding = 0.08
	) {
		super(name, scene)
		this.state = state
		this.camera = camera
		this.padding = padding

		this.calculateScreenDimensions()
		this.calulateMessageDimensions()

		this.message = this.buildMessage()
		this.scene.add(this.message)
	}

	buildMessage(): Message {
		const message = new Message(
			'message',
			this.scene,
			this.state,
			this.camera,
			this.anchor,
			"Hello, I'm a message!"
		)
		return message
	}

	calculateScreenDimensions(): void {
		this.screenWidthWorldUnits = this.camera.right - this.camera.left
		this.screenHeightWorldUnits = this.camera.top - this.camera.bottom
		this.contentWidth = this.screenWidthWorldUnits * (1 - this.padding)
		this.contentHeight = this.screenHeightWorldUnits * (1 - this.padding)
	}

	calulateMessageDimensions(): void {
		this.leftOffset = this.contentWidth / 3
		this.messageWidth = this.contentWidth * (2 / 3)
		this.messageHeight = this.contentHeight / 2
	}

	update(elTime: number, curFrame: number, deltaTime: number): void {
		//
	}

	onWindowResize(): void {
		//
	}
}
