import './index.css'
import * as THREE from 'three'

// components
import './components/chat'
import './components/input'

// three
// import './three/demo'
import TroikaTest from './three/troika'

// /*************************************************************
//  * Rendering
//  *************************************************************/

// Renderer
const canvas = document.getElementById('three') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas })
renderer.setSize(window.innerWidth, window.innerHeight)

// Camera
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
)
camera.position.z = 5

const scene = new TroikaTest()

// Renderloop
function animate() {
	scene.update()
	requestAnimationFrame(animate)
	renderer.render(scene, camera)
}
animate()

// Window Resizing (for testing)
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()

	renderer.setSize(window.innerWidth, window.innerHeight)
}

// /*************************************************************
//  * State
//  *************************************************************/
import { Store } from './state/store'

// inits for all modules that need access to the global state
import { initAPI } from './utils/api'

// create global (renderer process) state
const globalState = new Store()

// init all modules that need access to the global state
initAPI(globalState)

// /*************************************************************
//  * IPC from main process
//  *************************************************************/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).electronAPI.onBackURL((_event: unknown, data: string) => {
	try {
		const url = new URL(data)
		globalState.initAxios(url)
	} catch (error) {
		console.error('Invalid URL:', error)
	}
})
