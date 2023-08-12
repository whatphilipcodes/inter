import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'

export default class Mask extends SceneSubject {
	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)
	}
}
