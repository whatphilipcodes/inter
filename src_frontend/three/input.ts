import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { Store } from '../state/store'
import SceneSubject from './_sceneSubject'
import { Text /*getSelectionRects, getCaretAtPoint*/ } from 'troika-three-text'
import Cursor from './cursor'
import { getPointsVisu } from '../utils/threeUtil'

export default class Input extends SceneSubject {
	// Props
	caret: Cursor
	caretPosition: THREE.Vector3
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	troika: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	caretPositionsArray: any

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
		this.caret = new Cursor()
		this.updateText()

		this.scene.add(this.troika)
		this.scene.add(this.caret.get())

		// Sate Subscriptions
		this.state.subscribe('input', () => this.syncText())
		this.state.subscribe('specialKeyPressed', () => this.handleSpecialKey())
		this.state.subscribe(
			'updateInputOnGridChanges',
			() => {
				this.updateText()
				this.updateCaret()
			},
			true
		)
	}

	// Methods
	updateText(): void {
		this.setTextSettings()
		this.setTextPosition()
		this.syncText()
	}

	updateCaret(): void {
		this.setCaretPosition()
		this.caret.update(
			this.caretPosition,
			this.state.lineHeight * this.state.cursorWidthRatio,
			this.state.lineHeight
		)
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

	setTextPosition() {
		const newPosition = this.position.clone()
		this.troika.position.set(newPosition.x, newPosition.y, newPosition.z)
	}

	syncText(): void {
		this.troika.text = this.state.input
		this.troika.sync(() => {
			this.caretPositionsArray = structuredClone(
				this.troika.textRenderInfo.caretPositions
			)
		})
	}

	handleSpecialKey(): void {
		switch (this.state.specialKeyPressed) {
			case 'ArrowUp':
				// this.state.mutate({ cursorPos: this.getUpperCaretPos() })
				break
			case 'ArrowDown':
				// this.state.mutate({ cursorPos: this.getLowerCaretPos() })
				break
			default:
				break
		}
	}

	// getUpperCaretPos(): number {
	// 	const currentRect = getSelectionRects(
	// 		this.troika.textRenderInfo,
	// 		this.state.cursorPos - 1,
	// 		this.state.cursorPos
	// 	)
	// 	if (currentRect.length === 0) return this.state.cursorPos
	// 	const upperCaretPos = getCaretAtPoint(
	// 		this.troika.textRenderInfo,
	// 		currentRect[0].right,
	// 		currentRect[0].top
	// 	)
	// 	return upperCaretPos.charIndex
	// }

	// getLowerCaretPos(): number {
	// 	const lineHeight = this.troika.textRenderInfo.caretPositions[2]
	// 	const currentRect = getSelectionRects(
	// 		this.troika.textRenderInfo,
	// 		this.state.cursorPos - 1,
	// 		this.state.cursorPos
	// 	)
	// 	if (currentRect.length === 0) return this.state.cursorPos
	// 	const lowerCaretPos = getCaretAtPoint(
	// 		this.troika.textRenderInfo,
	// 		currentRect[0].right,
	// 		currentRect[0].top + lineHeight * 2
	// 	)
	// 	return lowerCaretPos.charIndex
	// }

	setCaretPosition(): void {
		if (this.state.cursorPos === 0) {
			this.caretPosition = new THREE.Vector3(
				this.position.x,
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
	update() {
		this.updateCaret()
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
	}

	onWindowResize(): void {
		this.setInputPosition()
		this.updateCaret()
		this.updateText()
	}
}
