import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { Text /*getSelectionRects, getCaretAtPoint*/ } from 'troika-three-text'

import { ConvoText, ConvoType, InteractionState } from '../utils/types'
import { getTimestamp } from '../utils/misc'
import SceneSubject from './_sceneSubject'
import { Store } from '../state/store'
import Cursor from './cursor'

export default class Input extends SceneSubject {
	// Props
	caret: Cursor
	caretPosition: THREE.Vector3
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	troika: any
	caretPositionsArray: Float32Array

	// Debugging
	boxHelper: THREE.BoxHelper

	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)

		// Props
		this.setInputPosition()
		this.caretPositionsArray = new Float32Array(0)
		this.caretPosition = this.position.clone()
		this.troika = new Text()
		this.caret = new Cursor('hidden')
		this.updateText()
		this.caret.setDimensions(
			this.state.lineHeight * this.state.cursorWidthRatio,
			this.state.lineHeight
		)

		// Add to scene
		this.scene.add(this.troika)
		this.scene.add(this.caret.get())

		// Sate Subscriptions
		this.state.subscribe('input', () => this.syncText())
		this.state.subscribe('specialKeyPressed', () => this.handleSpecialKey())
		this.state.subscribe('chatState', (newState: InteractionState) =>
			this.handleChatState(newState)
		)

		// Listen to troika Syncs
		this.troika.addEventListener('synccomplete', () => {
			this.calculateInputHeight()
			this.caretPositionsArray = structuredClone(
				this.troika.textRenderInfo.caretPositions
			)
		})
	}

	// Methods
	sendMessage(): void {
		const message: ConvoText = {
			convoID: this.state.convoID,
			messageID: this.state.messageID,
			timestamp: getTimestamp(),
			type: ConvoType.input,
			text: this.state.input,
			trust: 0.0,
		}
		this.state.mutate({
			chatState: InteractionState.waiting,
			conversation: [...this.state.conversation, message],
			messageID: this.state.messageID + 1,
			input: '',
			cursorPos: 0,
		})
		this.state.api.post('/api/infer', message).then((res: ConvoText) => {
			this.state.mutate({
				chatState: InteractionState.input,
				conversation: [...this.state.conversation, res],
				messageID: this.state.messageID + 1,
			})
		})
	}

	updateText(): void {
		this.setTextSettings()
		this.syncText()
	}

	setInputPosition(): void {
		// set the input position based on the grid
		this.position.set(
			this.state.leftBottom.x + this.state.spacing,
			this.state.leftBottom.y,
			this.state.leftBottom.z
		)
	}

	setTextSettings(): void {
		this.troika.font = './assets/cascadiacode/CascadiaMono-Regular.ttf'
		this.troika.fontSize =
			this.state.lineHeight / this.state.fontLineHeightRatio
		this.troika.lineHeight = this.state.fontLineHeightRatio
		this.troika.sdfGlyphSize = this.state.sdfGlyphSize
		this.troika.color = 0xffffff
		this.troika.anchorX = 'left'
		this.troika.anchorY = 'bottom'
		this.troika.maxWidth = this.state.msgWidth
		this.troika.overflowWrap = 'break-word'
		this.troika.whiteSpace = 'normal'
	}

	syncText(): void {
		this.troika.position.copy(this.position)
		this.troika.text = this.state.input
		this.troika.sync()
	}

	handleChatState(state: InteractionState): void {
		switch (state) {
			case InteractionState.input:
				this.state.mutate({
					inputHeight: this.state.lineHeight + this.state.spacing,
				})
				this.caret.setBehavior('flash')
				break
			case InteractionState.waiting:
				this.state.mutate({
					inputHeight: this.state.lineHeight + this.state.spacing,
				})
				this.caret.setBehavior('flash')
				break
			case InteractionState.disabled:
				this.state.mutate({ inputHeight: 0 })
				this.caret.setBehavior('hidden')
				break
			default:
				break
		}
	}

	handleSpecialKey(): void {
		switch (this.state.specialKeyPressed) {
			case 'Enter':
				this.sendMessage()
				break
			default:
				break
		}
	}

	async calculateInputHeight(): Promise<void> {
		// This is necessary because because troika syncs can happen before the geometry is ready
		while (!this.troika.textRenderInfo) {
			await new Promise((resolve) => setTimeout(resolve, 1))
		}
		return new Promise((resolve) => {
			let height = 0
			if (this.state.chatState !== InteractionState.disabled) {
				height =
					this.troika.geometry.boundingBox.max.y -
					this.troika.geometry.boundingBox.min.y
				if (height < this.state.lineHeight)
					height = this.state.lineHeight + this.state.spacing
				else height += this.state.spacing
			}
			this.state.mutate({ inputHeight: height })
			resolve()
		})
	}

	setCaretPosition(): void {
		if (this.state.chatState === InteractionState.disabled) return
		if (this.state.chatState === InteractionState.waiting) {
			this.caretPosition = new THREE.Vector3(
				this.state.leftBottom.x + this.state.ctpIndicator,
				this.position.y,
				this.position.z
			)
			return
		}
		if (this.state.cursorPos === 0) {
			this.caretPosition = new THREE.Vector3(
				this.state.leftBottom.x,
				this.position.y,
				this.position.z
			)
			return
		}
		const arrayPos = (this.state.cursorPos - 1) * 4
		// Float32Array contains n + 0: left, n + 1: right, n + 2: bottom, n + 3: top for each caret
		// they are relative to the text's anchor point, so we need to add the text's position to them
		const currentCaretPos = {
			left: this.caretPositionsArray[arrayPos],
			right: this.caretPositionsArray[arrayPos + 1],
			bottom: this.caretPositionsArray[arrayPos + 2],
			top: this.caretPositionsArray[arrayPos + 3],
		}
		// // Due to async worker updates, the caret positions may not be set yet
		// if (currentCaretPos.left === undefined && this.state.input?.length > 0)
		// 	return
		this.caretPosition = new THREE.Vector3(
			this.position.x + currentCaretPos.right,
			this.position.y + currentCaretPos.bottom,
			this.position.z
		)
	}

	// Callback Implementations
	update(elTime: number): void {
		this.updateText()
		this.setCaretPosition()
		this.caret.update(this.caretPosition, elTime)
	}

	buildDevUI(gui: GUI): void {
		// Debug
		this.boxHelper = new THREE.BoxHelper(this.troika)
		this.scene.add(this.boxHelper)
		const folder = gui.addFolder('Text')
		folder
			.add(this.state, 'fontLineHeightRatio', 1, 1.4, 0.01)
			.onChange((value: number) => {
				this.state.mutate({ fontLineHeightRatio: value })
				this.updateText()
			})
		folder
			.add(this.state, 'cursorWidthRatio', 0.01, 1, 0.01)
			.onChange((value: number) => {
				this.state.mutate({ cursorWidthRatio: value })
				this.updateText()
			})
	}

	updateDevUI(): void {
		this.boxHelper.update()
		this.setInputPosition()
		this.caret.setDimensions(
			this.state.lineHeight * this.state.cursorWidthRatio,
			this.state.lineHeight
		)
		// instead of subscribing to the state
		this.updateText()
	}

	onWindowResize(): void {
		this.setInputPosition()
		this.updateText()
	}
}
