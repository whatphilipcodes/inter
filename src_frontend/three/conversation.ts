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

	scroll: number

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
		this.state.mutate({ message: null })

		// update messages with store subscription
		this.state.subscribe('message', () => {
			this.addMessage(this.state.message)
			this.state.message = null
		})

		this.state.subscribe('appState', (newState: State) => {
			this.handleEnterState(newState)
		})
	}

	handleEnterState(newState: State): void {
		this.scroll = 0
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
			this.buffer.reverse()
			for (const item of this.buffer) {
				this.addMessage(item, true)
			}
			this.buffer = []
		}

		this.scrollVertical()

		if (this.historyIndex >= this.state.databaseLength) {
			if (config.debugMsg) console.log('resetting history index')
			this.historyIndex = 1
			this.clearMessages()
			this.scroll = 0
		}
	}

	// Methods
	addMessage(newMessage: ConvoText, history = false): void {
		const message: Message = new Message(
			newMessage.timestamp,
			this.scene,
			this.camera,
			this.state,
			newMessage
		)
		if (history) {
			this.messages.push(message)
		} else {
			this.messages.unshift(message)
		}
		new Promise((resolve) => {
			resolve(message.setHeight())
		}).then(() => {
			this.positionMessagesVertically()
			this.add(message)
		})
	}

	scrollVertical(): void {
		this.scroll -= this.state.lineHeight
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
		let yOffset = this.state.leftBottom.y + this.state.inputHeight + this.scroll
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
