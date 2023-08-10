import * as THREE from 'three'
import SceneSubject from './_sceneSubject'
import Message from './message'

class History extends SceneSubject {
	constructor(name: string, scene: THREE.Scene) {
		super(name, scene)
	}
}
