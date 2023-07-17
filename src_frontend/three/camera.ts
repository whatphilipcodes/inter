import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import config from '../front.config'

export default class Camera {
	canvas: HTMLCanvasElement
	camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
	frustumSize: number
	valBounds = {
		position: { min: -5, max: 5 },
		fov: { min: 35, max: 100 },
		near: { min: 0, max: 100 },
		far: { min: 0, max: 1000 },
		frustum: { min: 2, max: 30 },
	}

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas
	}

	buildPerspCam() {
		const camera = new THREE.PerspectiveCamera(
			75,
			this.canvas.width / this.canvas.height,
			0.1,
			1000
		)
		camera.position.z = 5
		this.camera = camera
		if (config.devUI) this.buildPerspCamUI(this.camera)
	}

	buildPerspCamUI(camera: THREE.PerspectiveCamera) {
		const gui = new GUI({ title: 'Perspective Camera' })
		gui
			.add(
				camera.position,
				'x',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position X')
		gui
			.add(
				camera.position,
				'y',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position Y')
		gui
			.add(
				camera.position,
				'z',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position Z')
		gui
			.add(camera, 'near', this.valBounds.near.min, this.valBounds.near.max)
			.name('Near')
		gui
			.add(camera, 'far', this.valBounds.far.min, this.valBounds.far.max)
			.name('Far')
		gui
			.add(camera, 'fov', this.valBounds.fov.min, this.valBounds.fov.max)
			.name('FOV')

		gui.onChange(() => {
			this.updatePerspCamera(camera, this.canvas.width, this.canvas.height)
		})
		gui.open()
	}

	buildOrthoCam(frustumSize?: number) {
		this.frustumSize = frustumSize || 10
		const aspect = this.canvas.width / this.canvas.height
		const camera = new THREE.OrthographicCamera(
			(-this.frustumSize * aspect) / 2,
			(this.frustumSize * aspect) / 2,
			this.frustumSize / 2,
			-this.frustumSize / 2,
			0.1,
			1000
		)
		camera.position.z = 5
		this.camera = camera
		if (config.devUI) this.buildOrthoCamUI(this.camera)
	}

	buildOrthoCamUI(camera: THREE.OrthographicCamera) {
		const gui = new GUI({ title: 'Orthographic Camera' })
		gui
			.add(
				camera.position,
				'x',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position X')
		gui
			.add(
				camera.position,
				'y',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position Y')
		gui
			.add(
				camera.position,
				'z',
				this.valBounds.position.min,
				this.valBounds.position.max
			)
			.name('Position Z')
		gui
			.add(camera, 'near', this.valBounds.near.min, this.valBounds.near.max)
			.name('Near')
		gui
			.add(camera, 'far', this.valBounds.far.min, this.valBounds.far.max)
			.name('Far')
		gui
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
		gui.open()
	}

	link() {
		return this.camera
	}

	updateAspect(width: number, height: number) {
		if (this.camera instanceof THREE.PerspectiveCamera) {
			this.updatePerspCamera(this.camera, width, height)
		} else {
			this.updateOrthoCamera(this.camera, width, height)
		}
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
