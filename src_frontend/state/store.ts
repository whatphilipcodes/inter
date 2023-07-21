import { appState } from '../utils/enums'
import axios, { AxiosInstance } from 'axios'

export class Store {
	applicationState: appState
	elURL: URL
	uviURL: URL
	api: AxiosInstance

	// textarea synced props
	input: string
	cursorPos: number
	selection: { start: number; end: number }
	selectionActive: boolean

	private initialState = {
		// state
		applicationState: appState.loading,

		// textarea
		input: 'Start Typing...',
		cursorPos: 0,
		selection: { start: 0, end: 0 },
		selectionActive: false,
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
		Object.values(this.mutationCallbacks).forEach((callback) => callback())
	}

	initAxios(baseURL: URL): void {
		this.api = axios.create({
			baseURL: baseURL.origin,
			timeout: 1000,
			headers: {
				'Access-Control-Allow-Origin': 'self',
				'Content-Type': 'application/json',
			},
		})
	}
}
