import * as THREE from 'three'

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Function to handle window resizing
function onWindowResize() {
	// Update the renderer's size
	renderer.setSize(window.innerWidth, window.innerHeight)

	// Optionally update the camera aspect ratio if you have a camera in your scene
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
}

// Call the function when the window is resized
window.addEventListener('resize', onWindowResize, false)

const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

camera.position.z = 5

function animate() {
	requestAnimationFrame(animate)

	cube.rotation.x += 0.01
	cube.rotation.y += 0.01

	renderer.render(scene, camera)
}

animate()
