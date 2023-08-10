import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import { Text, getSelectionRects, getCaretAtPoint } from 'troika-three-text'
import Cursor from './cursor'

export default class Input extends SceneSubject {
	// Props
	textcursor: Cursor
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	troika: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	caretPositions: any

	// Debugging
	boxHelper: THREE.BoxHelper

	constructor(
		name: string,
		scene: THREE.Scene,
		camera: THREE.OrthographicCamera,
		state: Store
	) {
		super(name, scene, camera, state)

		// Create Troika Text
		this.troika = new Text()
		this.updateTroika()
		this.scene.add(this.troika)

		this.setPosition()
		this.caretPositions = new Float32Array(0)

		// Create Text Cursor
		this.textcursor = new Cursor(
			this.state.leftBottom,
			this.state.lineHeight * this.state.cursorWidthRatio,
			this.state.lineHeight
		)
		this.scene.add(this.textcursor.get())

		this.state.subscribe('input', () => this.syncDisplay())
		this.state.subscribe('specialKeyPressed', () => this.handleSpecialKey())
		this.state.subscribe(
			'updateInputOnGridChanges',
			() => {
				this.updateTroika()
				this.updateCursor()
			},
			true
		)
	}

	// Methods
	updateTroika(): void {
		this.updateSettings()
		this.setPosition()
		this.syncDisplay()
	}

	updateCursor(): void {
		this.textcursor.onWindowResize(
			this.state.leftBottom,
			this.state.lineHeight * this.state.cursorWidthRatio,
			this.state.lineHeight
		)
	}

	updateSettings(): void {
		this.troika.font = './assets/cascadiacode/CascadiaMono-Regular.ttf'
		this.troika.fontSize =
			this.state.lineHeight / this.state.fontLineHeightRatio
		this.troika.lineHeight = this.state.fontLineHeightRatio
		this.troika.sdfGlyphSize = this.state.sdfGlyphSize
		this.troika.color = 0xffffff
		this.troika.anchorX = 'left'
		this.troika.anchorY = 'bottom'
		this.troika.maxWidth = this.state.messageWidth
		this.troika.overflowWrap = 'break-word'
		this.troika.whiteSpace = 'normal'
	}

	setPosition(position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {
		const newPosition = new THREE.Vector3(
			this.state.leftBottom.x + this.state.spacing + position.x,
			this.state.leftBottom.y + position.y,
			this.state.leftBottom.z + position.z
		)
		this.troika.position.set(newPosition.x, newPosition.y, newPosition.z)
	}

	syncDisplay(): void {
		this.troika.text = this.state.input
		this.troika.sync(() => {
			this.caretPositions = structuredClone(
				this.troika.textRenderInfo.caretPositions
			)
		})
	}

	handleSpecialKey(): void {
		switch (this.state.specialKeyPressed) {
			case 'ArrowUp':
				this.state.mutate({ cursorPos: this.getUpperCaretPos() })
				break
			case 'ArrowDown':
				this.state.mutate({ cursorPos: this.getLowerCaretPos() })
				break
			default:
				break
		}
	}

	getUpperCaretPos(): number {
		const currentRect = getSelectionRects(
			this.troika.textRenderInfo,
			this.state.cursorPos - 1,
			this.state.cursorPos
		)
		if (currentRect.length === 0) return this.state.cursorPos
		const upperCaretPos = getCaretAtPoint(
			this.troika.textRenderInfo,
			currentRect[0].right,
			currentRect[0].top
		)
		return upperCaretPos.charIndex
	}

	getLowerCaretPos(): number {
		const lineHeight = this.troika.textRenderInfo.caretPositions[2]
		const currentRect = getSelectionRects(
			this.troika.textRenderInfo,
			this.state.cursorPos - 1,
			this.state.cursorPos
		)
		if (currentRect.length === 0) return this.state.cursorPos
		const lowerCaretPos = getCaretAtPoint(
			this.troika.textRenderInfo,
			currentRect[0].right,
			currentRect[0].top + lineHeight * 2
		)
		return lowerCaretPos.charIndex
	}

	setCaretPos(): void {
		if (this.state.cursorPos === 0) {
			this.textcursor.update(
				new THREE.Vector3(
					this.state.lineHeight,
					this.state.lineHeight,
					this.position.z
				)
			)
			return
		}
		const arrayPos = (this.state.cursorPos - 1) * 4
		// Float32Array contains n + 0: left, n + 1: right, n + 2: bottom, n + 3: top for each caret
		// they are relative to the text's anchor point, so we need to add the text's position to them
		const currentCaretPos = {
			left: this.caretPositions[arrayPos],
			right: this.caretPositions[arrayPos + 1],
			bottom: this.caretPositions[arrayPos + 2],
			top: this.caretPositions[arrayPos + 3],
		}
		// Due to async worker updates, the caret positions may not be set yet
		if (currentCaretPos.left === undefined && this.state.input?.length > 0)
			return
		this.textcursor.update(
			new THREE.Vector3(
				currentCaretPos.right + this.state.spacing,
				currentCaretPos.top,
				this.position.z
			)
		)
	}

	// Callback Implementations
	update() {
		this.setCaretPos()
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
				this.updateTroika()
			})
		folder
			.add(this.state, 'cursorWidthRatio', 0.01, 1, 0.01)
			.onChange((value: number) => {
				this.state.mutate({ cursorWidthRatio: value })
				this.updateTroika()
			})
	}

	updateDevUI(): void {
		this.boxHelper.update()
	}

	onWindowResize(): void {
		this.updateCursor()
		this.updateTroika()
	}
}
