import * as THREE from 'three'
import { Text } from 'troika-three-text'

export function createScene() {
	// Create a Scene
	const scene = new THREE.Scene()

	// Create a basic perspective camera
	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	)
	camera.position.z = 5

	// Create a renderer
	const renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)

	// Append the canvas element created by the renderer to the HTML document
	document.body.appendChild(renderer.domElement)

	// Create a Troika Text
	const text = new Text()
	text.font = 'assets/sharetechmono.ttf'
	text.characters = 'abcdefghijklmnopqrstuvwxyz'
	text.text = 'Hello, Three.js!'
	text.fontSize = 1.0
	text.color = 0xffffff
	text.sync()

	// Add the text to the scene
	scene.add(text)

	// Animation loop
	function animate() {
		text.rotation.z += 0.01
		requestAnimationFrame(animate)
		renderer.render(scene, camera)
	}

	animate()

	window.addEventListener('resize', onWindowResize, false)

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()

		renderer.setSize(window.innerWidth, window.innerHeight)
	}
}
