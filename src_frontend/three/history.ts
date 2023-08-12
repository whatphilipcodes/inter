import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

import { ConvoText, ConvoType } from '../utils/types'
import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
import Message from './message'

export default class History extends SceneSubject {
	// Props
	inputs: ConvoText[]
	messages: Message[] = []
	// chunks need to scale with the grid settings in order to fill the screen -> load ConvoTexts while height < sample size n = numLines * lineHeight * 2
	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)

		// set position to leftBottom
		this.position.set(
			this.state.leftBottom.x + this.state.spacing,
			this.state.leftBottom.y,
			0
		)

		// Dummy messages
		this.inputs = []
		this.inputs.push(
			{
				convoID: 0,
				messageID: 0,
				timestamp: '2021-08-01T00:00:00.000Z',
				type: ConvoType.input,
				text: 'Hello how are you doing, kind Sir?',
				trust: 0.5,
			},
			{
				convoID: 0,
				messageID: 1,
				timestamp: '2022-08-01T00:00:00.000Z',
				type: ConvoType.response,
				text: 'Hi. I am fine thanks a lot. How about you? Anything on your mind lately?',
				trust: 0.5,
			},
			{
				convoID: 0,
				messageID: 2,
				timestamp: '2023-08-01T00:00:00.000Z',
				type: ConvoType.input,
				text: 'I am fine too. I am just thinking about the future.',
				trust: 0.5,
			},
			{
				convoID: 0,
				messageID: 3,
				timestamp: '2024-08-01T00:00:00.000Z',
				type: ConvoType.response,
				text: 'Oh, what about the future?',
				trust: 0.5,
			}
		)
		this.inputs.reverse() // revert order
		this.buildMessages()
		this.scene.add(this)
	}

	// Methods
	buildMessages(): void {
		const heightPromises: Promise<void>[] = []
		for (const input of this.inputs) {
			const message: Message = new Message(
				input.timestamp,
				this.scene,
				this.camera,
				this.state,
				input
			)
			this.add(message)
			this.messages.push(message)
			heightPromises.push(message.setHeight())
		}
		Promise.all(heightPromises).then(() => {
			this.positionMessagesVertically()
		})
	}

	positionMessagesVertically(): void {
		let yOffset = 0
		for (const message of this.messages) {
			message.position.setY(yOffset)
			yOffset += message.height + this.state.spacing
		}
	}

	// Callback Passdowns
	update(): void {
		for (const message of this.messages) {
			message.update()
		}
	}

	buildDevUI(gui: GUI): void {
		for (const message of this.messages) {
			message.buildDevUI(gui)
		}
	}

	updateDevUI(): void {
		for (const message of this.messages) {
			message.updateDevUI()
		}
	}

	onWindowResize(): void {
		for (const message of this.messages) {
			message.onWindowResize()
		}
	}
}
