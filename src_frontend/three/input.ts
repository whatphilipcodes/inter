import * as THREE from 'three'
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import { Text, getSelectionRects, getCaretAtPoint } from 'troika-three-text'
import Cursor from './cursor'
import { fontSize, cursorWidth } from '../utils/threeUtil'

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
		this.troika = this.buildTroika()
		this.setPosition()
		this.scene.add(this.troika)

		this.caretPositions = new Float32Array(0)

		// Create Text Cursor
		this.textcursor = new Cursor(
			this.state.leftBottom,
			cursorWidth(this.state.lineHeight),
			this.state.lineHeight
		)
		this.scene.add(this.textcursor.get())

		this.state.subscribe('input', () => this.syncDisplay())
		this.state.subscribe('specialKeyPressed', () => this.handleSpecialKey())
	}

	// METHODS
	buildTroika() {
		const troika = new Text()
		troika.font = './assets/cascadiacode/CascadiaMono-Regular.ttf'
		troika.fontSize = fontSize(this.state.lineHeight)
		troika.lineHeight = 1.2
		troika.sdfGlyphSize = 64
		troika.color = 0xffffff
		troika.anchorX = 'left'
		troika.anchorY = 'bottom'
		troika.maxWidth = this.state.messageWidth
		troika.overflowWrap = 'break-word'
		troika.whiteSpace = 'normal'
		return troika
	}

	setPosition(position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {
		const newPosition = new THREE.Vector3(
			this.state.leftBottom.x + /*this.state.lineHeight +*/ position.x,
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
				currentCaretPos.right + this.state.lineHeight,
				currentCaretPos.top,
				this.position.z
			)
		)
	}

	// Callback Implementations
	update() {
		this.setCaretPos()
	}

	buildDevUI(): void {
		// Debug
		this.boxHelper = new THREE.BoxHelper(this.troika)
		this.scene.add(this.boxHelper)

		// const folder = gui.addFolder('Input Display')
		// 	folder.add(this.troika, 'fontSize', 0.01, 1).name('Font Size')
		// 	folder.addColor(this.troika, 'color').name('Color')
	}

	updateDevUI(): void {
		this.boxHelper.update()
	}

	onWindowResize(): void {
		this.textcursor.onWindowResize(
			this.state.leftBottom,
			cursorWidth(this.state.lineHeight),
			this.state.lineHeight
		)
		this.setPosition()
		this.troika.maxWidth = this.state.messageWidth
		this.troika.fontSize = fontSize(this.state.lineHeight)
		this.syncDisplay()
	}
}
