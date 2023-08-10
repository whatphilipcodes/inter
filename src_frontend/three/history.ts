import * as THREE from 'three'
import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
// import Message from './message'

class History extends SceneSubject {
	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)
	}
}

export default History
