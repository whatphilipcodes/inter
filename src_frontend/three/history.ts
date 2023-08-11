import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

import { ConvoText, ConvoType } from '../utils/types'
import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
import Message from './message'

class History extends SceneSubject {
	// Props
	inputs: ConvoText[]
	messages: Message[] = []
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
			},
			{
				convoID: 0,
				messageID: 1,
				timestamp: '2022-08-01T00:00:00.000Z',
				type: ConvoType.response,
				text: 'Hi',
			},
			{
				convoID: 0,
				messageID: 2,
				timestamp: '2023-08-01T00:00:00.000Z',
				type: ConvoType.input,
				text: 'How are you?',
			},
			{
				convoID: 0,
				messageID: 3,
				timestamp: '2024-08-01T00:00:00.000Z',
				type: ConvoType.response,
				text: 'Good',
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
			this.scene.add(message.troika)
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

export default History
