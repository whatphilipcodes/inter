import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'
import {
	screenToWorld,
	getHelper2DBox,
	getPointsVisu,
} from '../utils/threeUtil'

import Message from './message'
import config from '../front.config'

export default class Grid extends SceneSubject {
	// Refs
	state: Store
	camera: THREE.OrthographicCamera

	// Props
	padding: number // in world units
	spacing: number // in world units
	screenWidthWorld: number
	screenHeightWorld: number
	contentHeight: number
	contentWidth: number

	lineHeight: number
	responseOffset: number // 1/3 of screen width - margin
	messageWidth: number // 2/3 of screen width - margin
	messageHeight: number // 1/2 of screen height - margin

	messageAnchor: THREE.Vector3[]
	leftBottom: THREE.Vector3

	// Debug
	testText =
		"The Egyptian's curved sword clanged against Sir Robert's helm, setting his head ringing. In return, the knight's broadsword came about in a sweeping arc,"
	testText02 =
		'This is a test response. Do you know what is happening? If you do, please tell me. I am very confused. I need 6 lines so condsider this boilerplate.'

	// Children
	message: Message
	response: Message

	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store,
		padding = 0.08
		// spacing = 0.02
	) {
		super(name, scene)

		this.state = state
		this.camera = camera
		this.padding = padding

		this.leftBottom = screenToWorld(this.camera, -1, -1) // functions as grid origin
		console.log(this.leftBottom)

		this.calculateScreenDimensions()
		this.calulateMessageDimensions()

		// this has to be automated
		this.messageAnchor = [
			this.leftBottom
				.clone()
				.add(
					new THREE.Vector3(
						this.padding + this.responseOffset,
						this.messageHeight + this.padding,
						0
					)
				),
			this.leftBottom
				.clone()
				.add(new THREE.Vector3(this.padding, this.padding, 0)),
		]
		//

		this.message = this.buildMessage()
		this.response = this.buildResponse()

		this.scene.add(this.message)
		this.scene.add(this.response)

		// Dev
		if (config.devUI) {
			const meshVisu = getHelper2DBox(
				this.leftBottom
					.clone()
					.add(new THREE.Vector3(this.padding, this.padding)),
				this.contentWidth,
				this.contentHeight
			)
			this.scene.add(meshVisu)

			const points = getPointsVisu(
				this.messageAnchor,
				new THREE.Color(0xff00ff)
			)
			this.scene.add(points)
		}
	}

	buildMessage(): Message {
		const message = new Message(
			'message',
			this.scene,
			this.state,
			this.camera,
			this.testText,
			this.messageWidth,
			this.lineHeight,
			this.messageAnchor[0],
			'response'
		)
		return message
	}

	buildResponse(): Message {
		const message = new Message(
			'message',
			this.scene,
			this.state,
			this.camera,
			this.testText02,
			this.messageWidth,
			this.lineHeight,
			this.messageAnchor[1]
		)
		return message
	}

	calculateScreenDimensions(): void {
		this.screenWidthWorld = screenToWorld(this.camera, 1, 1).distanceTo(
			screenToWorld(this.camera, -1, 1)
		)
		this.screenHeightWorld = screenToWorld(this.camera, 1, 1).distanceTo(
			screenToWorld(this.camera, 1, -1)
		)
		this.contentWidth = this.screenWidthWorld - this.padding * 2
		this.contentHeight = this.screenHeightWorld - this.padding * 2
	}

	calulateMessageDimensions(): void {
		this.responseOffset = this.contentWidth / 3
		this.messageWidth = this.contentWidth * (2 / 3)
		this.messageHeight = this.contentHeight / 2
		this.lineHeight = this.messageHeight / 6
	}

	// CALLBACKS
	update(): void {
		this.message.update()
		this.response.update()
	}

	onWindowResize(): void {
		this.calculateScreenDimensions()
		this.calulateMessageDimensions()
		this.message.onWindowResize()
		this.response.onWindowResize()
	}
}
