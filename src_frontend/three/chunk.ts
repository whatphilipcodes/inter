import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

import { ConvoText, ConvoType } from '../utils/types'
import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
import Message from './message'

export default class Chunk extends SceneSubject {
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
				text: 'Hello',
				trust: 0.5,
			},
			{
				convoID: 0,
				messageID: 1,
				timestamp: '2022-08-01T00:00:00.000Z',
				type: ConvoType.response,
				text: 'Hi',
				trust: 0.5,
			},
			{
				convoID: 0,
				messageID: 2,
				timestamp: '2023-08-01T00:00:00.000Z',
				type: ConvoType.input,
				text: 'How are you?',
				trust: 0.5,
			},
			{
				convoID: 0,
				messageID: 3,
				timestamp: '2024-08-01T00:00:00.000Z',
				type: ConvoType.response,
				text: 'Good',
				trust: 0.5,
			}
		)
		this.buildMessages()
	}

	// Methods
	buildMessages(): void {
		for (const [i, input] of this.inputs.entries()) {
			const message = new Message(
				`Message${i}`,
				this.scene,
				this.camera,
				this.state,
				input
			)
			this.messages.push(message)
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
