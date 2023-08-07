import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import * as THREE from 'three'
import { Text, getSelectionRects, getCaretAtPoint } from 'troika-three-text'
import Cursor from './cursor'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { screenToWorld } from '../utils/threeUtil'

import config from '../front.config'

export default class Input extends SceneSubject {
	// Refs
	state: Store
	camera: THREE.OrthographicCamera
	// Props
	targetLineHeight = 0.5
	anchor: THREE.Vector3
	textcursor: Cursor
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	troika: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	caretPositions: any
	// margin: number

	// Debug
	boxHelper: THREE.BoxHelper

	constructor(
		name: string,
		scene: THREE.Scene,
		state: Store,
		camera: THREE.OrthographicCamera
	) {
		super(name, scene)

		// Get References
		this.state = state
		this.camera = camera
		this.anchor = screenToWorld(camera, -1, 1)
		// this.margin = 0 // screenToWorld(camera, 0.4, 0).x

		// Create Troika Text
		this.troika = this.buildTroika()
		this.scene.add(this.troika)

		this.caretPositions = new Float32Array(0)
		this.state.cursorPos = 0

		// Create Text Cursor
		this.textcursor = new Cursor(
			this.anchor,
			this.getCursorWidth(),
			this.targetLineHeight
		)
		this.scene.add(this.textcursor.get())

		this.state.subscribe('input', () => this.syncDisplay())
		this.state.subscribe('specialKeyPressed', () => this.handleSpecialKey())

		// debug
		if (config.devUI) {
			this.boxHelper = this.buildDevBox()
			this.scene.add(this.boxHelper)
		}
	}

	buildTroika() {
		const troika = new Text()
		troika.font = './assets/cascadiacode/CascadiaMono-Regular.ttf'
		troika.fontSize = this.fontSizeFromLineHeight(0.5)
		troika.lineHeight = 1.2
		troika.sdfGlyphSize = 64
		troika.color = 0xffffff
		troika.anchorX = 'left'
		troika.anchorY = 'top'
		troika.maxWidth = this.camera.right - this.camera.left //- this.margin
		troika.overflowWrap = 'break-word'
		troika.whiteSpace = 'normal'
		troika.position.set(this.anchor.x, this.anchor.y, this.anchor.z)
		return troika
	}

	/**
	 * Calculates the font size from based on the target line height.
	 * @param {number} targetLineHeight The line height that the object should have in world units.
	 * @param {number} ratio The ratio between the font size and the line height. Defaults to 1.2.
	 * @returns {number} The font size.
	 */
	fontSizeFromLineHeight(targetLineHeight: number, ratio = 1.2): number {
		const targetFontSize = targetLineHeight / ratio
		return targetFontSize
	}

	getCursorWidth(ofLineHeight = 0.08): number {
		return this.targetLineHeight * ofLineHeight
	}

	buildDevBox(): THREE.BoxHelper {
		// Debug
		const boxHelper = new THREE.BoxHelper(this.troika)
		return boxHelper
	}

	buildDevUI(gui: GUI) {
		const folder = gui.addFolder('Input Display')
		folder.add(this.troika, 'fontSize', 0.01, 1).name('Font Size')
		folder.addColor(this.troika, 'color').name('Color')
	}

	update() {
		this.setCaretPos()
		if (this.boxHelper) this.boxHelper.update()
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

	onWindowResize(): void {
		this.anchor = screenToWorld(this.camera, -1, 1)
		// this.margin = screenToWorld(this.camera, 0.4, 0).x
		// this.textcursor.setAnchor(this.anchor)
		this.textcursor.updateDimensions(
			this.getCursorWidth(),
			this.targetLineHeight
		)
		this.troika.position.set(this.anchor.x, this.anchor.y, this.anchor.z)
		this.troika.maxWidth = this.camera.right - this.camera.left //- this.margin
		this.troika.fontSize = this.fontSizeFromLineHeight(0.5)
		this.syncDisplay()
	}

	setCaretPos(): void {
		if (this.state.cursorPos === 0) {
			this.textcursor.update(new THREE.Vector3(0, 0, this.position.z))
			return
		}
		// const currentChar = this.troika.text[this.state.cursorPos - 1]
		// let newLineOffset = 0
		// let charIndexOffset = 0
		// if (currentChar === '\n') {
		// 	charIndexOffset = 1
		// 	newLineOffset = 0
		// }
		const arrayPos = (this.state.cursorPos - 1) /*+ charIndexOffset*/ * 4
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
				currentCaretPos.right /*- newLineOffset*/,
				currentCaretPos.top,
				this.position.z
			)
		)
	}
}
