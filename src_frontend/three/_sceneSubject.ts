import * as THREE from 'three'

export default class SceneSubject {
	name: string
	scene: THREE.Scene

	constructor(name: string, scene: THREE.Scene) {
		this.name = name
		this.scene = scene
	}

	update(elTime: number, curFrame: number, deltaTime: number) {
		console.log(
			'elTime: ' + elTime,
			'curFrame: ' + curFrame,
			'deltaTime: ' + deltaTime
		)
		throw new Error('update() not implemented on SceneSubject: ' + this.name)
	}
}
