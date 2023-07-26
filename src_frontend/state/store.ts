import { appState } from '../utils/types'
import { API } from '../utils/api'

export class Store {
	applicationState: appState

	elURL: URL
	uviURL: URL

	// api
	api: API
	convoID: number
	messageID: number

	// screen dimensions
	screenWidth: number
	screenHeight: number

	// textarea synced props
	input: string
	cursorPos: number
	specialKeyPressed: string
	selection: { start: number; end: number }
	selectionActive: boolean

	private initialState = {
		// state
		applicationState: appState.loading,

		// textarea
		cursorPos: 0,
		selection: { start: 0, end: 0 },
		selectionActive: false,

		// api
		convoID: 0,
		messageID: 0,
	}

	private mutationCallbacks: { [key: string]: () => void }

	constructor() {
		Object.assign(this, this.initialState)
		this.mutationCallbacks = {}
	}

	subscribe(key: string, callback: () => void): void {
		this.mutationCallbacks[key] = callback
	}

	unsubscribe(key: string): void {
		delete this.mutationCallbacks[key]
	}

	mutate(newState: Partial<Store>): void {
		Object.assign(this, newState)
		const keys = Object.keys(newState)
		const filteredCallbacks = keys
			.map((key) => this.mutationCallbacks[key])
			.filter((callback) => typeof callback === 'function')
		filteredCallbacks.forEach((callback) => callback && callback())
	}

	async initAxios(baseURL: URL): Promise<void> {
		this.api = new API(baseURL)
		await this.api.checkStatus()
	}
}
