import './index.css'

// components -> index.html
import './components/demoChat'
import './components/input'
// components types
import type Input from './components/input'

// state
import { Store } from './state/store'
// inits for modules that need access to the global state
import { initAPI } from './utils/api'

// three
import SceneManager from './three/_sceneManager'

// debugging
import config from './front.config'
import Stats from 'three/examples/jsm/libs/stats.module.js'

// /*************************************************************
//  * Debugging
//  *************************************************************/
let stats: Stats
if (config.devUI) {
	stats = new Stats()
	stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
	document.body.appendChild(stats.dom)
}

if (config.hideCursor) {
	document.body.style.cursor = 'none'
}

// /*************************************************************
//  * Components
//  *************************************************************/
// Get references to all custom elements in index.html
// const chat = document.getElementById('testChatModule') as any
const input = document.getElementById('textInput') as Input

// /*************************************************************
//  * State
//  *************************************************************/
// create global (renderer process) state
const globalState = new Store()
// init all modules that need access to the global state
initAPI(globalState)
// init all component instances that need access to the global state
if (!config.demoPlain) input.initInput(globalState)

// /*************************************************************
//  * Rendering
//  *************************************************************/
if (!config.demoPlain) {
	// Create sceneManager
	const initialResolution = {
		width: window.innerWidth,
		height: window.innerHeight,
	}
	const sceneManager = new SceneManager(initialResolution, globalState)

	// Render Loop
	// eslint-disable-next-line no-inner-declarations
	function animate() {
		if (config.devUI) stats.begin()
		sceneManager.update()
		requestAnimationFrame(animate)
		if (config.devUI) stats.end()
	}
	// Start Loop
	animate()

	// Event Callbacks
	window.addEventListener(
		'resize',
		() => sceneManager.onWindowResize(window.innerWidth, window.innerHeight),
		false
	)
}

// /*************************************************************
//  * IPC from main process
//  *************************************************************/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).electronAPI.getBackendURL().then((data: string) => {
	try {
		const url = new URL(data)
		globalState.initAxios(url)
	} catch (error) {
		console.error('Invalid URL:', error)
	}
})
