import * as THREE from 'three'

export default class Camera {
	canvas: HTMLCanvasElement
	camera: THREE.OrthographicCamera
	frustumSize: number

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas
	}

	buildCamera(frustumSize?: number, position?: THREE.Vector3) {
		this.frustumSize = frustumSize || 10
		const aspect = this.canvas.width / this.canvas.height
		const camera = new THREE.OrthographicCamera(
			(-this.frustumSize * aspect) / 2,
			(this.frustumSize * aspect) / 2,
			this.frustumSize / 2,
			-this.frustumSize / 2,
			0,
			100
		)
		this.camera = camera
		this.position(position || new THREE.Vector3(0, 0, 0))
	}

	instance() {
		return this.camera
	}

	updateAspect(width: number, height: number) {
		if (this.camera instanceof THREE.PerspectiveCamera) {
			this.updatePerspCamera(this.camera, width, height)
		} else {
			this.updateOrthoCamera(this.camera, width, height)
		}
	}

	position(pos: THREE.Vector3) {
		this.camera.position.set(pos.x, pos.y, pos.z)
	}

	updateOrthoCamera(
		camera: THREE.OrthographicCamera,
		width: number,
		height: number
	) {
		const aspect = width / height
		camera.left = (-this.frustumSize * aspect) / 2
		camera.right = (this.frustumSize * aspect) / 2
		camera.top = this.frustumSize / 2
		camera.bottom = -this.frustumSize / 2
		camera.updateProjectionMatrix()
	}

	updatePerspCamera(
		camera: THREE.PerspectiveCamera,
		width: number,
		height: number
	) {
		camera.aspect = width / height
		camera.updateProjectionMatrix()
	}
}
