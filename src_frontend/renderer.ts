import './index.css'

// components -> index.html
import './components/chat'
import './components/input'

// components types
import type Input from './components/input'

// state
import { Store } from './state/store'
// inits for modules that need access to the global state
import { initAPI } from './utils/api'

// three
import SceneManager from './three/_sceneManager'

// /*************************************************************
//  * Components
//  *************************************************************/
// Get references to all custom elements in index.html
// const chat = document.getElementById('testChatModule') as any
const input = document.getElementById('textInput') as Input
console.log(input.id)

// /*************************************************************
//  * Rendering
//  *************************************************************/
// Create sceneManager
const canvas = document.getElementById('three') as HTMLCanvasElement
canvas.width = window.innerWidth
canvas.height = window.innerHeight
const sceneManager = new SceneManager(canvas)

// Render Loop
function animate() {
	sceneManager.update()
	requestAnimationFrame(animate)
	input.focusInput()
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
//  * State
//  *************************************************************/
// create global (renderer process) state
const globalState = new Store()
// init all modules that need access to the global state
initAPI(globalState)
// init all class instances that need access to the global state
sceneManager.initThree(globalState)
input.initInput(globalState)

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
