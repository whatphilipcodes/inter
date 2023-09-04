import * as THREE from 'three'
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

import { ConvoText, State } from '../utils/types'
import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
import Message from './message'
import config from '../front.config'

export default class Conversation extends SceneSubject {
	// Props
	messages: Message[] = []
	loadedMsg: number
	historyInterval: NodeJS.Timer
	historyIndex: number
	buffer: ConvoText[]
	// chunks need to scale with the grid settings in order to fill the screen -> load ConvoTexts while height < sample size n = numLines * lineHeight * 2
	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)
		this.loadedMsg = 0
		this.buffer = []

		// init empty conversation
		this.state.mutate({ conversation: [] })

		// update messages with store subscription
		this.state.subscribe('conversation', () => {
			this.addMessages(this.state.conversation)
			this.state.conversation = []
		})

		this.state.subscribe('appState', (newState: State) => {
			this.handleEnterState(newState)
		})
	}

	handleEnterState(newState: State): void {
		switch (newState) {
			case State.interaction:
				clearInterval(this.historyInterval)
				this.clearMessages()
				break
			case State.idle:
				this.historyIndex = 1
				this.historyInterval = setInterval(() => {
					if (this.buffer.length > 0) {
						// console.log(this.buffer)
						this.addMessages(this.buffer, true)
						this.buffer = []
					}
					if (this.loadedMsg < config.numPreloadMsg) {
						// console.log('loading conID ' + this.historyIndex)
						this.state.api
							.post('/api/get_message', { id: this.historyIndex })
							.then((response: ConvoText[]) => {
								// handle empty response
								if (response.length === 0) {
									return
								}
								for (const msg of response) {
									if (msg.text === '') continue
									this.buffer.push(msg)
								}
								this.historyIndex += 1
							})
					}
					for (const message of this.messages) {
						message.scrollVertical()
					}
					this.cleanMessages()
					// console.log(this.loadedMsg)
				}, config.historyInterval)
				break
			default:
				break
		}
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

	cleanMessages(): void {
		let visible = 0
		for (const message of this.messages) {
			if (!message.visible) {
				message.unbuild()
				message.remove()
			} else {
				visible += 1
			}
		}
		this.loadedMsg = visible
	}

	positionMessagesVertically(): void {
		let yOffset = this.state.leftBottom.y + this.state.inputHeight
		for (const message of this.messages) {
			message.offset = yOffset
			message.setVerticalPosition()
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
