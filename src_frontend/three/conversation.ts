import * as THREE from 'three'
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

import config from '../front.config'
import { ConvoText, State } from '../utils/types'
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
			this.addMessages(this.state.conversation)
			this.state.conversation = []
		})

		this.state.subscribe('appState', (newState) => {
			if (newState === State.interaction) {
				this.clearMessages()
			}
		})
	}

	// Methods
	addMessages(newMessages: ConvoText[], history = false): void {
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
			if (history) {
				this.messages.push(message)
			} else {
				this.messages.unshift(message)
			}
			heightPromises.push(message.setHeight())
		}
		Promise.all(heightPromises).then(() => {
			this.positionMessagesVertically()
		})
	}

	clearMessages(): void {
		for (const message of this.messages) {
			message.unbuild()
			message.remove()
		}
		this.messages = []
	}

	positionMessagesVertically(): void {
		let yOffset = this.state.leftBottom.y + this.state.inputHeight
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
