import * as THREE from 'three'
import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import Message from './message'

class History extends SceneSubject {
	// Props
	messages: Message[] = []
	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)

		// Dummy messages
		this.messages.push(
			new Message('message1', this.scene, this.camera, this.state, 'Hello')
		)
		this.messages.push(
			new Message('message2', this.scene, this.camera, this.state, 'World')
		)
		this.messages.push(
			new Message('message3', this.scene, this.camera, this.state, '!!!')
		)

		this.buildMessages()
	}

	// Methods
	buildMessages(): void {
		for (const message of this.messages) {
			this.scene.add(message.troika)
		}
	}
}

export default History
