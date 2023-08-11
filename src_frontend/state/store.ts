import { State } from '../utils/types'
import { API } from '../utils/api'
import config from '../front.config'

export class Store {
	// state
	appState: State

	// api
	elURL: URL
	uviURL: URL
	api: API
	convoID: number
	messageID: number
	startMsg: string

	// screen dimensions
	screenWidth: number
	screenHeight: number

	// textarea
	input: string
	cursorPos: number
	maxInputLength: number
	specialKeyPressed: string
	selection: { start: number; end: number }
	selectionActive: boolean

	// grid settings
	padding: number
	numLines: number
	numLinesSpacing: number

	// message settings
	ctpOffsetRatio: number
	msgWidthRatio: number

	// grid props
	origin: THREE.Vector3
	leftBottom: THREE.Vector3
	contentWidth: number
	contentHeight: number
	lineHeight: number
	spacing: number
	msgWidth: number
	ctpWidth: number
	ctpOffset: number
	msgIndicator: number
	loaIndicator: number
	ctpIndicator: number

	// text settings
	fontLineHeightRatio: number
	cursorWidthRatio: number
	sdfGlyphSize: number

	private initialState = config.initState

	private keyMutationCallbacks: {
		[key: string]: ((newVal?: unknown) => void) | (() => void)
	}

	private anyMutationCallbacks: {
		[key: string]: () => void
	}

	constructor() {
		Object.assign(this, this.initialState)
		this.keyMutationCallbacks = {}
		this.anyMutationCallbacks = {}
	}

	subscribe(
		key: string,
		callback: ((newVal?: unknown) => void) | (() => void),
		toAnyMutation = false
	): void {
		if (toAnyMutation) this.anyMutationCallbacks[key] = callback
		else this.keyMutationCallbacks[key] = callback
	}

	unsubscribe(key: string): void {
		if (key in this.anyMutationCallbacks) delete this.anyMutationCallbacks[key]
		else if (key in this.keyMutationCallbacks)
			delete this.keyMutationCallbacks[key]
		else throw new Error(`No callback found for key ${key}`)
	}

	mutate(newState: Partial<Store>): void {
		Object.assign(this, newState)
		const keys = Object.keys(newState)
		Object.values(this.anyMutationCallbacks).forEach((callback) => callback())
		const filteredCallbacks = keys
			.map((key) => this.keyMutationCallbacks[key])
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
