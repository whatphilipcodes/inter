import { state } from '../utils/types'
import { API } from '../utils/api'

export class Store {
	appState: state

	elURL: URL
	uviURL: URL

	// api
	api: API
	convoID: number
	messageID: number
	startMsg: string

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
		appState: state.loading,

		// textarea
		cursorPos: 0,

		// api
		convoID: 0,
		messageID: 0,
	}

	private mutationCallbacks: {
		[key: string]: ((newVal?: unknown) => void) | (() => void)
	}

	constructor() {
		Object.assign(this, this.initialState)
		this.mutationCallbacks = {}
	}

	subscribe(
		key: string,
		callback: ((newVal?: unknown) => void) | (() => void)
	): void {
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
		filteredCallbacks.forEach(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(callback, i) => callback && callback((newState as any)[keys[i]])
		)
	}

	async initAxios(baseURL: URL): Promise<void> {
		this.api = new API(baseURL)
		await this.api.checkStatus()
	}
}
