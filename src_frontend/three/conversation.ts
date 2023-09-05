import * as THREE from 'three'
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

import { ConvoText, State } from '../utils/types'
import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
import Message from './message'
import config from '../front.config'

export default class Conversation extends SceneSubject {
	// Props
	buffer: ConvoText[]
	messages: Message[] = []
	msgPending: boolean
	msgVisible: number

	historyInterval: NodeJS.Timer
	historyIndex: number
	// chunks need to scale with the grid settings in order to fill the screen -> load ConvoTexts while height < sample size n = numLines * lineHeight * 2
	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)
		//this.loadedMsg = 0
		this.buffer = []
		this.msgPending = false

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
				this.historyIndex = 1 + this.messages.length + 1 // +1 for greeting, starting at 1 because index is reversed in backend
				this.historyInterval = setInterval(
					() => this.idleLoop(),
					config.historyInterval
				)
				break
			default:
				break
		}
	}

	idleLoop(): void {
		this.cleanMessages()
		if (this.buffer.length < config.numBufferMsg && !this.msgPending) {
			this.state.api
				.post('/api/get_message', { id: this.historyIndex })
				.then((response: { msg_pair: ConvoText[]; length: number }) => {
					// handle empty response
					if (!response) return
					this.state.mutate({ databaseLength: response.length })
					for (const msg of response.msg_pair) {
						if (msg.text === '') continue
						this.buffer.push(msg)
					}
					this.historyIndex += 1
					this.msgPending = false
				})
		}
		for (const message of this.messages) {
			message.scrollable = true
		}
		if (this.buffer.length > 0) {
			this.addMessages(this.buffer, true)
			this.buffer = []
		}
		for (const message of this.messages) {
			message.scrollVertical()
		}
		if (this.historyIndex >= this.state.databaseLength) {
			if (config.debugMsg) console.log('resetting history index')
			this.historyIndex = 1
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
		this.msgVisible = visible
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
