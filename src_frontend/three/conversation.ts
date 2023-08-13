import * as THREE from 'three'
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

import { ConvoText, ConvoType } from '../utils/types'
import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
import Message from './message'

export default class Conversation extends SceneSubject {
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

		// Dummy messages
		this.inputs = []
		this.inputs.push(
			{
				convoID: 0,
				messageID: 0,
				timestamp: '2021-08-01T00:00:00.000Z',
				type: ConvoType.input,
				text: 'Hello how are you doing, kind Sir?',
				trust: 0.0,
			},
			{
				convoID: 0,
				messageID: 1,
				timestamp: '2022-08-01T00:00:00.000Z',
				type: ConvoType.response,
				text: 'Hi. I am fine thanks a lot. How about you? Anything on your mind lately? I am here to listen. Please dont hesitate to tell me anything.',
				trust: 0.0,
			},
			{
				convoID: 0,
				messageID: 2,
				timestamp: '2023-08-01T00:00:00.000Z',
				type: ConvoType.input,
				text: 'I am fine too. I am just thinking about the future.',
				trust: 0.33,
			},
			{
				convoID: 0,
				messageID: 3,
				timestamp: '2024-08-01T00:00:00.000Z',
				type: ConvoType.response,
				text: 'Oh, what about the future?',
				trust: 0.33,
			}
		)
		this.inputs.reverse() // revert order
		this.buildMessages()
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
			this.messages.push(message)
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

	// /**
	//  * Add a new message to the chat.
	//  *
	//  * @param message - The message object to be added.
	//  */
	// addMessage(message: Message) {
	// 	this.messages.push(message)
	// }

	// /**
	//  * Remove a specific message from the chat. If no message is provided,
	//  * it removes the oldest message (i.e., the first one in the array).
	//  *
	//  * @param message - The message object to be removed (optional).
	//  */
	// removeMessage(message?: Message) {
	// 	if (message) {
	// 		const index = this.messages.indexOf(message)
	// 		if (index !== -1) {
	// 			this.messages.splice(index, 1)
	// 		}
	// 	} else {
	// 		// If no specific message is provided, remove the first one
	// 		this.messages.shift()
	// 	}
	// }

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
