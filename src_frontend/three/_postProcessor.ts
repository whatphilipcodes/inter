import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
// import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

export default class PostProcessor {
	composer: EffectComposer
	renderPass: RenderPass
	outputPass
	constructor(
		renderer: THREE.WebGLRenderer,
		scene: THREE.Scene,
		camera: THREE.Camera
	) {
		this.composer = new EffectComposer(renderer)
		this.renderPass = new RenderPass(scene, camera)
		this.outputPass = new OutputPass()
		this.composer.addPass(this.renderPass)

		// custom shaders here:
		this.addBloomPass()

		this.composer.addPass(this.outputPass)
	}

	addBloomPass() {
		const bloomPass = new UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			0.2,
			0.2,
			0.85
		)
		this.composer.addPass(bloomPass)
	}

	update() {
		this.composer.render()
	}

	onWindowResize(width: number, height: number) {
		this.composer.setSize(width, height)
	}
}
