import * as THREE from 'three'

import SceneSubject from './_sceneSubject'

export default class ThreeDemo extends SceneSubject {
	geometry: THREE.BoxGeometry
	material: THREE.MeshBasicMaterial
	cube: THREE.Mesh

	constructor(name: string, scene: THREE.Scene) {
		super(name, scene)
		this.geometry = new THREE.BoxGeometry(1, 1, 1)
		this.material = new THREE.MeshBasicMaterial({ color: 0xffffff })
		this.cube = new THREE.Mesh(this.geometry, this.material)
		this.scene.add(this.cube)
	}

	update(elTime: number, curFrame: number, deltaTime: number) {
		console.log(
			'elTime: ' + elTime,
			'curFrame: ' + curFrame,
			'deltaTime: ' + deltaTime
		)
		this.cube.rotation.x += 0.01
		this.cube.rotation.y += 0.01
	}
}
