import { State, InteractionState, ConvoText } from '../utils/types'
import { API } from '../utils/api'
import config from '../front.config'

export class Store {
	// state
	appState: State
	chatState: InteractionState

	// api
	elURL: URL
	uviURL: URL
	api: API

	// conversation
	convoID: number
	messageID: number
	message: ConvoText
	greeting: ConvoText
	databaseLength: number

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

	// vertical grid props
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

	// horizontal grid props
	historyStart: number

	// input props
	inputHeight: number

	// text settings
	fontLineHeightRatio: number
	cursorWidthRatio: number
	sdfGlyphSize: number

	private initialState = config.initState

	private keyMutationCallbacks: {
		[key: string]: (((newVal?: unknown) => void) | (() => void))[]
	}

	private anyMutationCallbacks: {
		[key: string]: () => void
	}

	private keysToUnsubscribeOnce: Set<string> = new Set()

	constructor() {
		Object.assign(this, this.initialState)
		this.keyMutationCallbacks = {}
		this.anyMutationCallbacks = {}
	}

	subscribe(
		key: string,
		callback: ((newVal?: unknown) => void) | (() => void),
		toAnyMutation = false,
		onlyOnce = false
	): void {
		if (onlyOnce) {
			// Mark the key to be unsubscribed after the first invocation
			this.keysToUnsubscribeOnce.add(key)
		}

		if (toAnyMutation) {
			this.anyMutationCallbacks[key] = callback
		} else {
			if (!this.keyMutationCallbacks[key]) this.keyMutationCallbacks[key] = []
			this.keyMutationCallbacks[key].push(callback)
		}
	}

	unsubscribe(
		key: string,
		callback: ((newVal?: unknown) => void) | (() => void)
	): void {
		if (key in this.anyMutationCallbacks) {
			delete this.anyMutationCallbacks[key]
		} else if (key in this.keyMutationCallbacks) {
			const index = this.keyMutationCallbacks[key].indexOf(callback)
			if (index > -1) {
				this.keyMutationCallbacks[key].splice(index, 1)
				if (this.keyMutationCallbacks[key].length === 0) {
					delete this.keyMutationCallbacks[key]
				}
			} else {
				throw new Error(`No callback found for key ${key}`)
			}
		}
	}

	// Modify the mutate method to unsubscribe keys after first invocation if needed
	mutate(newState: Partial<Store>): void {
		Object.assign(this, newState)
		const keys = Object.keys(newState)

		Object.values(this.anyMutationCallbacks).forEach((callback) => callback())

		keys.forEach((key) => {
			if (this.keyMutationCallbacks[key]) {
				this.keyMutationCallbacks[key].forEach((callback) => {
					if (callback) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						callback((newState as any)[key])

						// Check if the key needs to be unsubscribed after first invocation
						if (this.keysToUnsubscribeOnce.has(key)) {
							this.unsubscribe(key, callback)
							this.keysToUnsubscribeOnce.delete(key)
						}
					}
				})
			}
		})
	}

	async initAxios(baseURL: URL): Promise<void> {
		this.api = new API(baseURL)
		await this.api.checkStatus()
	}
}
