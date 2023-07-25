import './index.css'

// components -> index.html
import './components/demoChat'
import './components/input'
// components types
import type Input from './components/input'
import type DemoChat from './components/demoChat'

// state
import { Store } from './state/store'

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
const chat = document.getElementById('testChatModule') as DemoChat
const input = document.getElementById('textInput') as Input

// /*************************************************************
//  * State
//  *************************************************************/
// create global (renderer process) state
const globalState = new Store()
// init all component instances that need access to the global state
if (!config.demoPlain) input.initInput(globalState)
if (config.demoPlain) chat.initChat(globalState)

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
;(window as any).electronAPI.getBackendURL().then(async (data: string) => {
	try {
		const url = new URL(data)
		await globalState.initAxios(url)
		if (config.debugMsg) {
			if (globalState.api.online) {
				console.log('Backend online & connected')
			}
		}
	} catch (error) {
		console.error('Invalid URL:', error)
	}
})
