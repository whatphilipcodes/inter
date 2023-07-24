import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

export default class Camera {
	canvas: HTMLCanvasElement
	camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
	frustumSize: number
	valBounds = {
		position: { min: -10, max: 10 },
		fov: { min: 35, max: 100 },
		near: { min: 0, max: 100 },
		far: { min: 0, max: 1000 },
		frustum: { min: 2, max: 30 },
	}

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas
	}

	buildDevUI(ui: GUI) {
		if (this.camera instanceof THREE.PerspectiveCamera) {
			this.buildPerspCamUI(this.camera, ui)
		} else if (this.camera instanceof THREE.OrthographicCamera) {
			this.buildOrthoCamUI(this.camera, ui)
		}
	}

	buildPerspCam(position?: THREE.Vector3) {
		const camera = new THREE.PerspectiveCamera(
			75,
			this.canvas.width / this.canvas.height,
			0.1,
			1000
		)
		this.camera = camera
		this.position(position || new THREE.Vector3(0, 0, 0))
	}

	buildPerspCamUI(camera: THREE.PerspectiveCamera, gui: GUI) {
		const folder = gui.addFolder('Perspective Camera')
		folder
			.add(
				camera.position,
				'x',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position X')
		folder
			.add(
				camera.position,
				'y',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position Y')
		folder
			.add(
				camera.position,
				'z',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position Z')
		folder
			.add(camera, 'near', this.valBounds.near.min, this.valBounds.near.max)
			.name('Near')
		folder
			.add(camera, 'far', this.valBounds.far.min, this.valBounds.far.max)
			.name('Far')
		folder
			.add(camera, 'fov', this.valBounds.fov.min, this.valBounds.fov.max)
			.name('FOV')

		gui.onChange(() => {
			this.updatePerspCamera(camera, this.canvas.width, this.canvas.height)
		})
	}

	buildOrthoCam(frustumSize?: number, position?: THREE.Vector3) {
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

	buildOrthoCamUI(camera: THREE.OrthographicCamera, gui: GUI) {
		const folder = gui.addFolder('Orthographic Camera')
		folder
			.add(
				camera.position,
				'x',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position X')
		folder
			.add(
				camera.position,
				'y',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position Y')
		folder
			.add(
				camera.position,
				'z',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position Z')
		folder
			.add(camera, 'near', this.valBounds.near.min, this.valBounds.near.max)
			.name('Near')
		folder
			.add(camera, 'far', this.valBounds.far.min, this.valBounds.far.max)
			.name('Far')
		folder
			.add(
				this,
				'frustumSize',
				this.valBounds.frustum.min,
				this.valBounds.frustum.max
			)
			.name('Frustum Size')

		gui.onChange(() => {
			this.updateOrthoCamera(camera, this.canvas.width, this.canvas.height)
		})
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
