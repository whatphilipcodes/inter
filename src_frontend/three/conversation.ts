import * as THREE from 'three'
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

import { ConvoText } from '../utils/types'
import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
import Message from './message'

export default class Conversation extends SceneSubject {
	// Props
	messages: Message[] = []
	// chunks need to scale with the grid settings in order to fill the screen -> load ConvoTexts while height < sample size n = numLines * lineHeight * 2
	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)

		// init empty conversation
		this.state.mutate({ conversation: [] })

		// update messages with store subscription
		this.state.subscribe('conversation', () => {
			const newMessages = this.state.conversation.slice(this.messages.length)
			this.addMessages(newMessages)
		})
	}

	// Methods
	addMessages(newMessages: ConvoText[]): void {
		const heightPromises: Promise<void>[] = []
		// loops backwards to start with the oldest message
		for (let i = newMessages.length - 1; i >= 0; i--) {
			const input = newMessages[i]
			const message: Message = new Message(
				input.timestamp,
				this.scene,
				this.camera,
				this.state,
				input
			)
			this.messages.unshift(message)
			heightPromises.push(message.setHeight())
		}
		Promise.all(heightPromises).then(() => {
			this.positionMessagesVertically()
		})
	}

	positionMessagesVertically(): void {
		let yOffset =
			this.state.leftBottom.y + this.state.inputHeight + this.state.spacing
		for (const message of this.messages) {
			message.position.setY(yOffset)
			yOffset += message.height + this.state.spacing
		}
	}

	// Callback Passdowns
	update(): void {
		this.positionMessagesVertically()
		for (const message of this.messages) {
			message.update()
		}
	}

	buildDevUI(): void {
		for (const message of this.messages) {
			message.buildDevUI()
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
