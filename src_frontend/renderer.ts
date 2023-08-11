import './index.css'

// components -> index.html
import './components/hiddenInput'
// components types
import type Input from './components/hiddenInput'

// state
import { Store } from './state/store'
import { State, BackendState, LoopPatch } from './utils/types'

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
const input = document.getElementById('hiddenInput') as Input

// /*************************************************************
//  * State
//  *************************************************************/
// create global (renderer process) state
const globalState = new Store()

// connect frontend state to backend state
function updateBackendState(current: State): void {
	let translation
	switch (current) {
		case State.loading:
			translation = { S: BackendState.loading }
			break
		case State.idle:
			translation = { state: BackendState.training }
			break
		case State.interaction:
			translation = { state: BackendState.inference }
			break
		case State.error:
			translation = { state: BackendState.error }
			break
		case State.exit:
			translation = { state: BackendState.exit }
			break
		default:
			translation = { state: BackendState.training }
			break
	}
	globalState.api
		.post('/api/update', translation)
		.then((newState: LoopPatch) => {
			if (config.debugMsg) console.log('Backend state updated:', newState.state)
		})
}
globalState.subscribe('appState', updateBackendState)

// init all component instances that need access to the global state
input.initInput(globalState)

// /*************************************************************
//  * Rendering
//  *************************************************************/
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

// /*************************************************************
//  * IPC from main process
//  *************************************************************/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).electronAPI.getBackendURL().then(async (data: string) => {
	try {
		const url = new URL(data)
		await globalState.initAxios(url)
		if (config.debugMsg && globalState.api.online) {
			console.log('Backend online & connected')
		}
		if (globalState.api.online) {
			globalState.mutate({
				appState: State.idle,
			})
		}
	} catch (error) {
		console.error('Invalid URL:', error)
	}
})

// /*************************************************************
//  * Debugging
//  *************************************************************/
if (config.debugMsg) console.log('Frontend loaded')
