import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
import Chunk from './chunk'

export default class ChunkManager extends SceneSubject {
	// Props
	chunks: Chunk[] = []
	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)
		// Idea Interaction: Everything is displayed in a single chunk
		// Idea Idle: THere are always 3 chunks, one currently in view, one below about to be deleted, and one above to load in new data
		this.buildInteractionChunks()
	}

	// Methods
	buildIdleChunks(): void {
		//
	}

	buildInteractionChunks(): void {
		this.chunks.push(new Chunk('chunk', this.scene, this.camera, this.state))
	}

	// Callback Passdowns
	update(): void {
		for (const chunk of this.chunks) {
			chunk.update()
		}
	}

	buildDevUI(gui: GUI): void {
		for (const chunk of this.chunks) {
			chunk.buildDevUI(gui)
		}
	}

	updateDevUI(): void {
		for (const chunk of this.chunks) {
			chunk.updateDevUI()
		}
	}

	onWindowResize(): void {
		for (const chunk of this.chunks) {
			chunk.onWindowResize()
		}
	}
}
