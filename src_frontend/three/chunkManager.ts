import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'

export default class ChunkManager extends SceneSubject {
	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)
	}

	// Callback Passdowns
}
