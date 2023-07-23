import { appState } from '../utils/enums'
import axios, { AxiosInstance } from 'axios'

export class Store {
	applicationState: appState
	elURL: URL
	uviURL: URL
	api: AxiosInstance

	// screen dimensions
	screenWidth: number
	screenHeight: number

	// textarea synced props
	// inputCols: number
	// fontSize: number
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
